// Google team-SSO: alleen geverifieerde @mhsmedia.nl-accounts komen binnen.
// Zelfde opzet als op de andere klantsites, zodat één redirect-URI bij Google
// volstaat: de centrale proxy op software.mhsmedia.nl stuurt de callback door.
import crypto from 'node:crypto';

const TEAM_SSO_DOMAIN = 'mhsmedia.nl';

const proxySecret = () => (process.env.OAUTH_PROXY_SECRET || '').trim();
const proxyBase = () => (process.env.OAUTH_REDIRECT_BASE || '').replace(/\/$/, '');

function ssoBeschikbaar() {
  return !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}
function useProxy() {
  return !!(proxySecret() && proxyBase());
}

// Publieke https-origin van DEZE site — hier stuurt de proxy de callback heen.
function siteOrigin(req) {
  const host = req.headers['x-forwarded-host'] || req.headers.host || '';
  return 'https://' + String(host).split(',')[0].trim();
}
function googleRedirectUri(req) {
  return (useProxy() ? proxyBase() : siteOrigin(req)) + '/api/oauth/google/callback';
}

// state = base64url(JSON{o,s,n}) + "." + base64url(HMAC_SHA256(payload, secret))
// Exact hetzelfde formaat als de proxy en de andere klantsites.
function makeProxyState(origin, service, nonce) {
  if (!useProxy()) return nonce;
  const payload = Buffer.from(JSON.stringify({ o: origin, s: service, n: nonce })).toString('base64url');
  const sig = crypto.createHmac('sha256', proxySecret()).update(payload).digest('base64url');
  return payload + '.' + sig;
}
function readProxyState(state) {
  if (!useProxy()) return { n: String(state || '') };
  const s = String(state || '');
  const dot = s.indexOf('.');
  if (dot < 1) return null;
  const payload = s.slice(0, dot);
  let got, want;
  try {
    got = Buffer.from(s.slice(dot + 1), 'base64url');
    want = crypto.createHmac('sha256', proxySecret()).update(payload).digest();
  } catch { return null; }
  if (got.length !== want.length || !crypto.timingSafeEqual(got, want)) return null;
  try { return JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')); } catch { return null; }
}

// Wisselt de authorization code in voor een token en haalt het profiel op.
async function fetchGoogleIdentity(code, redirectUri) {
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID || '',
      client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  });
  if (!tokenRes.ok) throw new Error('token-uitwisseling mislukt (' + tokenRes.status + ')');
  const tok = await tokenRes.json();
  const infoRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: 'Bearer ' + (tok.access_token || '') },
  });
  if (!infoRes.ok) throw new Error('userinfo mislukt (' + infoRes.status + ')');
  return infoRes.json();
}

// Teamlid of niet: e-mail geverifieerd, @mhsmedia.nl, en als Google een
// hosted domain meestuurt moet dat kloppen.
function isTeamAccount(info) {
  const email = String((info && info.email) || '').trim().toLowerCase();
  const verified = !!(info && (info.verified_email != null ? info.verified_email : info.email_verified));
  const hd = String((info && info.hd) || '').trim().toLowerCase();
  if (!email || !verified) return '';
  if (!email.endsWith('@' + TEAM_SSO_DOMAIN)) return '';
  if (hd && hd !== TEAM_SSO_DOMAIN) return '';
  return email;
}

export { TEAM_SSO_DOMAIN, ssoBeschikbaar, useProxy, siteOrigin, googleRedirectUri,
  makeProxyState, readProxyState, fetchGoogleIdentity, isTeamAccount };
