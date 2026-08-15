// Centrale MAIHS-gateway: één plek voor de Google-OAuth-client en de uitgaande
// mail van de hele vloot, zodat een rotatie niet langs elke klantsite hoeft.
//
// Deze laag is bewust INERT zolang de gateway-envs niet gezet zijn:
// staat het eigen Google-clientpaar in de env, dan gaat alles precies zoals het
// altijd ging. De gateway is de terugval, niet de nieuwe hoofdweg.
//
// Het clientpaar is alles-of-niets: een eigen client-id met een centraal secret
// (of andersom) levert bij Google 'unauthorized_client' op. Daarom kijken we
// altijd naar het páár, nooit naar één van de twee.

import crypto from 'node:crypto';

const UA = 'MAIHS-Gateway-Client/1.0';

// De envs heetten MAIHS_AI_* toen de gateway alleen AI deed. Datzelfde token
// bedient inmiddels ook SE Ranking, Google-OAuth, Ads en mail, dus de vloot draait
// op MHS_GATEWAY_*. De oude namen staan nergens meer op Vercel en worden hier niet
// meer gelezen.
//
// De env is een kale origin ('https://host'), maar de normalisatie hieronder blijft
// nodig: ze vangt een afsluitende slash en een per ongeluk meegeplakt pad af.
// Zonder die stap zou een aanroep op een dubbel pad uitkomen.
const gatewayUrl = () => (process.env.MHS_GATEWAY_URL || '').trim();
const gatewayKey = () => (process.env.MHS_GATEWAY_KEY || '').trim();

// De MHS-host als kale origin. Knipt de origin uit de env-waarde, dus een kale
// host (met of zonder afsluitende slash) en een vol pad leveren exact hetzelfde
// op — dat scheelt een env-variabele per site. Alle centrale gateways (config,
// Google-OAuth, mail) hangen onder diezelfde host en het token dat we toch al
// hebben geeft er toegang toe.
function gatewayOrigin() {
  const m = /^(https?:\/\/[^/]+)/.exec(gatewayUrl());
  return m ? m[1] : '';
}

function gatewayBeschikbaar() {
  return !!(gatewayOrigin() && gatewayKey());
}

function eigenGoogleClient() {
  return !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

// AbortSignal.timeout bestaat op de Node-runtime van Vercel (18+); mocht dat
// ooit niet zo zijn, dan liever geen timeout dan een harde fout bij het opstarten.
function metTimeout(ms) {
  try { return AbortSignal.timeout(ms); } catch { return undefined; }
}

// ---------- Centrale configuratie ----------
// Alleen een memo binnen de warme lambda, en kort: een verouderde client-id is
// erger dan een extra verzoek. Bewust NIET in de database — bij de Flask-uitrol
// bleef een site na het weghalen van de env zijn oude client-id serveren omdat
// die nog in de langlevende cache stond. Een koude lambda begint hier leeg.
const CONFIG_TTL_MS = 5 * 60 * 1000;
let memo = { t: 0, sleutel: '', data: null };

// Ophalen van { google_client_id, google_ads: {...} } bij MAIHS. Bij een storing
// valt hij terug op de laatst opgehaalde waarden: een hapering bij MAIHS mag
// geen inlogpagina platleggen.
async function gatewayConfig() {
  if (!gatewayBeschikbaar()) return {};
  // De memo hangt aan host + token: wisselt er één, dan is de oude waarde meteen
  // ongeldig. Het token zelf bewaren we niet, een korte hash is genoeg.
  const sleutel = gatewayOrigin() + '|' + crypto.createHash('sha256').update(gatewayKey()).digest('hex').slice(0, 16);
  const laatste = memo.sleutel === sleutel && memo.data ? memo.data : null;
  if (laatste && Date.now() - memo.t < CONFIG_TTL_MS) return laatste;
  try {
    const r = await fetch(gatewayOrigin() + '/api/gateway/config', {
      headers: { Authorization: 'Bearer ' + gatewayKey(), 'User-Agent': UA },
      signal: metTimeout(10000),
    });
    if (!r.ok) throw new Error('status ' + r.status);
    const data = await r.json();
    memo = { t: Date.now(), sleutel, data: data && typeof data === 'object' ? data : {} };
    return memo.data;
  } catch (e) {
    console.error('[gateway] config ophalen mislukt:', String(e && e.message || e));
    return laatste || {};
  }
}

// ---------- Google OAuth ----------

// De (publieke) client-id waarmee de bezoeker naar Google gestuurd wordt.
async function googleClientId() {
  if (eigenGoogleClient()) return String(process.env.GOOGLE_CLIENT_ID || '').trim();
  const cfg = await gatewayConfig();
  return String(cfg.google_client_id || '').trim();
}

// Kan deze site überhaupt met Google inloggen? Eigen paar óf de gateway.
function googleOauthBeschikbaar() {
  return eigenGoogleClient() || gatewayBeschikbaar();
}

// Wisselt een code ({code, redirect_uri}) of een refresh-token ({refresh_token})
// in bij Google. Met een eigen clientpaar rechtstreeks, anders via MAIHS dat het
// centrale secret toevoegt. Geeft de rauwe Response terug: MAIHS reikt Google's
// status én body onveranderd door, dus de afhandeling bij de aanroeper (ook van
// invalid_grant) blijft in beide gevallen hetzelfde werken.
async function googleTokenExchange(velden) {
  if (eigenGoogleClient()) {
    return fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        ...velden,
        client_id: process.env.GOOGLE_CLIENT_ID || '',
        client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
      }),
      signal: metTimeout(20000),
    });
  }
  if (!gatewayBeschikbaar()) {
    throw new Error('Google OAuth niet geconfigureerd: geen eigen client en geen gateway');
  }
  return fetch(gatewayOrigin() + '/api/gateway/google-oauth/token', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + gatewayKey(),
      'Content-Type': 'application/json',
      'User-Agent': UA,
    },
    body: JSON.stringify(velden),
    signal: metTimeout(20000),
  });
}

// ---------- Mail ----------

// De mailbox die het bureau voor alle sites gebruikt. Die telt NIET als eigen
// mailserver van de klant: staat een site hierop ingesteld, dan heeft hij een
// kopie van de centrale gegevens en hoort de mail via de gateway te lopen.
const CENTRALE_MAILBOXEN = new Set(['email@mhsmedia.email', 'emails@mhsmedia.email']);

// Haalt het kale adres uit 'Naam <adres@domein>' of uit een kaal adres.
function adresUit(waarde) {
  const s = String(waarde == null ? '' : waarde).trim();
  const m = /<([^>]+)>/.exec(s);
  return (m ? m[1] : s).trim().toLowerCase();
}

function isCentraleMailbox(...adressen) {
  return adressen.some(a => a && CENTRALE_MAILBOXEN.has(adresUit(a)));
}

// Heeft deze site écht een eigen mailserver van de klant? Zonder argumenten
// kijkt hij naar de SMTP_*-env van deze site.
function eigenMailserver(cfg = {}) {
  const host = String(cfg.host != null ? cfg.host : (process.env.SMTP_HOST || '')).trim();
  const user = String(cfg.user != null ? cfg.user : (process.env.SMTP_USER || '')).trim();
  const from = String(cfg.from != null ? cfg.from : (process.env.SMTP_FROM || '')).trim();
  if (!host) return false;
  return !isCentraleMailbox(user, from);
}

// Verstuurt via de centrale mailbox bij MAIHS. Gooit nooit: geeft {ok, error}
// terug zodat de aanroeper alsnog op de lokale route kan terugvallen.
async function mailViaGateway({ to, subject, html, text, fromName, replyTo, cc, bcc }) {
  if (!gatewayBeschikbaar()) return { ok: false, error: 'geen gateway geconfigureerd' };
  const lading = { to, subject };
  if (html) lading.html = html;
  if (text) lading.text = text;
  if (fromName) lading.from_name = fromName;
  if (replyTo) lading.reply_to = replyTo;
  if (cc) lading.cc = cc;
  if (bcc) lading.bcc = bcc;
  try {
    const r = await fetch(gatewayOrigin() + '/api/gateway/mail', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + gatewayKey(),
        'Content-Type': 'application/json',
        'User-Agent': UA,
      },
      body: JSON.stringify(lading),
      signal: metTimeout(20000),
    });
    if (!r.ok) {
      const reden = await r.text().catch(() => '');
      return { ok: false, error: `gateway ${r.status} ${String(reden).slice(0, 160)}`.trim() };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: 'gateway onbereikbaar: ' + String(e && e.message || e).slice(0, 140) };
  }
}

export {
  gatewayOrigin, gatewayBeschikbaar, gatewayConfig,
  eigenGoogleClient, googleOauthBeschikbaar, googleClientId, googleTokenExchange,
  CENTRALE_MAILBOXEN, isCentraleMailbox, eigenMailserver, mailViaGateway,
};
