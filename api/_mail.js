// Gedeelde mailverzending: een eigen mailserver van de klant gaat voor, daarna
// de centrale mailbox via de MAIHS-gateway, dan Resend, en anders een
// mailto-terugval zodat de beheerder de mail alsnog zelf kan versturen.
//
// De centrale mailbox (email@mhsmedia.email) telt NIET als eigen mailserver:
// staat die in de SMTP_*-env, dan is dat een kopie van de bureau-gegevens en
// hoort de mail via de gateway te lopen.
import nodemailer from 'nodemailer';
import * as db from './_db.js';
import { getBedrijf } from './_doc.js';
import { eigenMailserver, gatewayBeschikbaar, mailViaGateway } from './_gateway.js';

function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }

function mailProvider() {
  if (eigenMailserver()) return 'smtp';
  if (gatewayBeschikbaar()) return 'gateway';
  if (process.env.SMTP_HOST) return 'smtp';
  if (process.env.RESEND_API_KEY) return 'resend';
  return null;
}

// Standaard-opmaak in de huisstijl, met één duidelijke knop.
function basisHtml({ titel, tekstRegels, knopTekst, knopLink, voet }) {
  const BRAND = '#0B9D46';
  const alineas = tekstRegels.map(t => `<p style="margin:0 0 12px">${t}</p>`).join('');
  return `<div style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:0 auto;color:#1F2113">
  <div style="height:6px;background:${BRAND};border-radius:6px 6px 0 0"></div>
  <div style="padding:28px 30px;background:#fff;border:1px solid #E6E8DC;border-top:none;border-radius:0 0 12px 12px">
    <h2 style="font-family:Poppins,Arial,sans-serif;margin:0 0 14px">${esc(titel)}</h2>
    ${alineas}
    ${knopLink ? `<p style="text-align:center;margin:24px 0">
      <a href="${knopLink}" style="background:${BRAND};color:#fff;text-decoration:none;font-weight:700;padding:12px 26px;border-radius:10px;display:inline-block">${esc(knopTekst)}</a>
    </p>
    <p style="margin:0 0 12px;color:#6B7060;font-size:.78rem">Werkt de knop niet? Plak deze link in je browser:<br><span style="word-break:break-all">${knopLink}</span></p>` : ''}
    <p style="margin:0;color:#6B7060;font-size:.85rem">${voet || ''}</p>
  </div></div>`;
}

// Verstuurt een mail. Geeft {sent:true,provider} of {sent:false,mailto} terug.
async function sendMail({ to, subject, html, text, refType, refId }) {
  const bedrijf = await getBedrijf().catch(() => ({ naam: 'Essenza Tuinen' }));
  const from = process.env.SMTP_FROM || process.env.RESEND_FROM
    || (process.env.SMTP_USER ? `${bedrijf.naam} <${process.env.SMTP_USER}>` : `${bedrijf.naam} <onboarding@resend.dev>`);
  const now = new Date().toISOString();
  const log = (status, provider, fout) => db.exec(
    'INSERT INTO mails(ref_type,ref_id,aan,onderwerp,status,provider,fout,created) VALUES(?,?,?,?,?,?,?,?)',
    [refType || 'mail', refId || 0, to, subject, status, provider, fout || null, now]).catch(() => {});

  // Zonder eigen mailserver loopt het via de centrale mailbox bij MAIHS. Lukt
  // dat niet, dan alsnog langs de lokale route: een lead of herstellink mag niet
  // verdwijnen omdat een centrale dienst even weg is. Bij een time-out ná
  // verzending kan dat een dubbele mail geven — het minste kwaad.
  if (!eigenMailserver() && gatewayBeschikbaar()) {
    const g = await mailViaGateway({ to, subject, html, text, fromName: bedrijf.naam });
    if (g.ok) {
      await log('verzonden', 'gateway');
      return { sent: true, provider: 'gateway' };
    }
    console.error('[mail] gateway mislukt (' + g.error + ') — terugval op de lokale route');
  }

  if (process.env.SMTP_HOST) {
    const port = +(process.env.SMTP_PORT || 465);
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST, port, secure: port === 465,
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
        // Bewust ruim binnen de looptijd van de functie: een trage of
        // geblokkeerde mailserver moet híer stuklopen (en gelogd worden), niet
        // de hele aanroep laten aflopen — dan blijft er geen spoor over.
        connectionTimeout: 8000, greetingTimeout: 8000, socketTimeout: 12000,
      });
      await transporter.sendMail({ from, to, subject, html, text });
      await log('verzonden', 'smtp');
      return { sent: true, provider: 'smtp' };
    } catch (e) {
      await log('mislukt', 'smtp', String(e.message || e).slice(0, 180));
      return { sent: false, error: `Verzenden mislukt (SMTP): ${String(e.message || e).slice(0, 140)}` };
    }
  }

  if (process.env.RESEND_API_KEY) {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to: [to], subject, text, html }),
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) {
      await log('mislukt', 'resend', String(j.message || j.name || r.status).slice(0, 180));
      return { sent: false, error: `Verzenden mislukt: ${j.message || j.name || ('fout ' + r.status)}` };
    }
    await log('verzonden', 'resend');
    return { sent: true, provider: 'resend' };
  }

  await log('handmatig', 'mailto');
  return { sent: false, notConfigured: true, mailto: `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text || '')}` };
}

// Volledige URL naar de site zelf (voor links in mails).
function siteUrl(req) {
  const proto = (req.headers['x-forwarded-proto'] || 'https').split(',')[0];
  return `${proto}://${req.headers.host}`;
}

export { sendMail, basisHtml, mailProvider, siteUrl, esc };
