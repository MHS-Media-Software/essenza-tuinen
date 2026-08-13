// Verstuur een offerte of factuur per e-mail naar de klant (met deel-link).
// Een eigen mailserver van de klant gaat voor, daarna de centrale mailbox via de
// MAIHS-gateway, dan Resend; lukt niets, dan komt er een mailto-fallback terug
// zodat de beheerder de mail alsnog handmatig kan versturen.
import * as db from './_db.js';
import { getBedrijf, euro } from './_doc.js';
import nodemailer from 'nodemailer';
import { eigenMailserver, gatewayBeschikbaar, mailViaGateway } from './_gateway.js';

export default async function handler(req, res) {
  try {
    await db.ensureSchema();
    if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'method' });

    const b = await db.readBody(req);
    const type = b.type === 'invoice' ? 'invoice' : 'quote';
    // Versturen mag alleen wie het bijbehorende onderdeel ook mag beheren.
    if (!(await db.requirePerm(req, res, type === 'invoice' ? 'facturen' : 'offertes'))) return;
    const id = +b.id; if (!id) return res.status(400).json({ ok: false, error: 'id' });
    const table = type === 'invoice' ? 'invoices' : 'quotes';
    const doc = (await db.q(`SELECT * FROM ${table} WHERE id=?`, [id]))[0];
    if (!doc) return res.status(404).json({ ok: false, error: 'niet gevonden' });
    const aan = String(b.email || doc.klant_email || '').trim();
    if (!aan) return res.status(400).json({ ok: false, error: 'Geen e-mailadres bij deze klant. Vul eerst een e-mailadres in.' });

    const bedrijf = await getBedrijf();
    const proto = (req.headers['x-forwarded-proto'] || 'https').split(',')[0];
    const host = req.headers['host'];
    const link = `${proto}://${host}/api/document?type=${type}&token=${doc.token}`;
    const isQuote = type === 'quote';
    const stuk = isQuote ? 'offerte' : 'factuur';
    const onderwerp = b.subject || `${isQuote ? 'Uw offerte' : 'Factuur'} ${doc.nummer} · ${bedrijf.naam}`;
    const naam = doc.klant_naam || 'geachte heer/mevrouw';
    const tekst = `Beste ${naam},\n\n${isQuote
      ? `Hierbij ontvangt u onze offerte (${doc.nummer}) op maat. U kunt de offerte online bekijken, downloaden en direct akkoord geven via onderstaande link.`
      : `Hierbij ontvangt u factuur ${doc.nummer} met een totaalbedrag van ${euro(doc.totaal)}. U kunt de factuur online bekijken en downloaden via onderstaande link.`}\n\n${link}\n\nMet vriendelijke groet,\n${bedrijf.naam}${bedrijf.telefoon ? '\n' + bedrijf.telefoon : ''}`;

    const html = mailHtml({ bedrijf, naam, isQuote, doc, link });
    const key = process.env.RESEND_API_KEY;
    const smtpHost = process.env.SMTP_HOST;
    const from = process.env.SMTP_FROM || process.env.RESEND_FROM || (process.env.SMTP_USER ? `${bedrijf.naam} <${process.env.SMTP_USER}>` : `${bedrijf.naam} <onboarding@resend.dev>`);
    const now = new Date().toISOString();

    async function markVerzonden(provider) {
      await db.exec('INSERT INTO mails(ref_type,ref_id,aan,onderwerp,status,provider,created) VALUES(?,?,?,?,?,?,?)',
        [type, id, aan, onderwerp, 'verzonden', provider, now]).catch(() => {});
      if (isQuote && doc.status === 'concept') await db.exec("UPDATE quotes SET status='verzonden', updated=? WHERE id=?", [now, id]).catch(() => {});
    }

    // 1) Zonder eigen mailserver van de klant loopt het via de centrale mailbox
    // bij MAIHS. Faalt dat, dan alsnog de lokale route hieronder — een offerte
    // mag niet blijven hangen omdat een centrale dienst even weg is.
    if (!eigenMailserver() && gatewayBeschikbaar()) {
      const g = await mailViaGateway({ to: aan, subject: onderwerp, html, text: tekst, fromName: bedrijf.naam });
      if (g.ok) {
        await markVerzonden('gateway');
        return res.status(200).json({ ok: true, sent: true, link });
      }
      console.error('[mail] gateway mislukt (' + g.error + ') — terugval op de lokale route');
    }

    // 2) Eigen SMTP (bv. Strato) wanneer geconfigureerd.
    if (smtpHost) {
      const port = +(process.env.SMTP_PORT || 465);
      const transporter = nodemailer.createTransport({
        host: smtpHost, port, secure: port === 465,
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
        connectionTimeout: 15000, greetingTimeout: 15000,
      });
      try {
        await transporter.sendMail({ from, to: aan, subject: onderwerp, html, text: tekst });
        await markVerzonden('smtp');
        return res.status(200).json({ ok: true, sent: true, link });
      } catch (e) {
        await db.exec('INSERT INTO mails(ref_type,ref_id,aan,onderwerp,status,provider,fout,created) VALUES(?,?,?,?,?,?,?,?)',
          [type, id, aan, onderwerp, 'mislukt', 'smtp', String(e.message || e).slice(0, 180), now]).catch(() => {});
        return res.status(502).json({ ok: false, error: `Verzenden mislukt (SMTP): ${String(e.message || e).slice(0, 140)}` });
      }
    }

    if (key) {
      const r = await fetch('https://api.resend.com/emails', {
        method: 'POST', headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ from, to: [aan], subject: onderwerp, html, text: tekst }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) {
        await db.exec('INSERT INTO mails(ref_type,ref_id,aan,onderwerp,status,provider,fout,created) VALUES(?,?,?,?,?,?,?,?)',
          [type, id, aan, onderwerp, 'mislukt', 'resend', String(j.message || j.name || r.status).slice(0, 180), now]).catch(() => {});
        return res.status(502).json({ ok: false, error: `Verzenden mislukt: ${j.message || j.name || ('fout ' + r.status)}` });
      }
      await db.exec('INSERT INTO mails(ref_type,ref_id,aan,onderwerp,status,provider,created) VALUES(?,?,?,?,?,?,?)',
        [type, id, aan, onderwerp, 'verzonden', 'resend', now]).catch(() => {});
      if (isQuote && doc.status === 'concept') await db.exec("UPDATE quotes SET status='verzonden', updated=? WHERE id=?", [now, id]).catch(() => {});
      return res.status(200).json({ ok: true, sent: true, link });
    }

    // Geen mailprovider gekoppeld → mailto-fallback (opent het mailprogramma van de beheerder).
    const mailto = `mailto:${encodeURIComponent(aan)}?subject=${encodeURIComponent(onderwerp)}&body=${encodeURIComponent(tekst)}`;
    await db.exec('INSERT INTO mails(ref_type,ref_id,aan,onderwerp,status,provider,created) VALUES(?,?,?,?,?,?,?)',
      [type, id, aan, onderwerp, 'handmatig', 'mailto', now]).catch(() => {});
    return res.status(200).json({ ok: true, sent: false, notConfigured: true, link, mailto, onderwerp, aan });
  } catch (e) {
    return res.status(500).json({ ok: false, error: String(e.message || e).slice(0, 200) });
  }
}

function mailHtml({ bedrijf, naam, isQuote, doc, link }) {
  const BRAND = '#0B9D46';
  return `<div style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:0 auto;color:#1F2113">
  <div style="height:6px;background:${BRAND};border-radius:6px 6px 0 0"></div>
  <div style="padding:28px 30px;background:#fff;border:1px solid #E6E8DC;border-top:none;border-radius:0 0 12px 12px">
    <h2 style="font-family:Poppins,Arial,sans-serif;margin:0 0 14px">${isQuote ? 'Uw offerte op maat' : 'Uw factuur'}</h2>
    <p style="margin:0 0 12px">Beste ${esc(naam)},</p>
    <p style="margin:0 0 12px">${isQuote
      ? `Hierbij ontvangt u onze offerte <b>${esc(doc.nummer)}</b>. Bekijk, download en geef eenvoudig akkoord via de knop hieronder.`
      : `Hierbij ontvangt u factuur <b>${esc(doc.nummer)}</b> met een totaalbedrag van <b>${euro(doc.totaal)}</b>.`}</p>
    <p style="text-align:center;margin:24px 0">
      <a href="${link}" style="background:${BRAND};color:#fff;text-decoration:none;font-weight:700;padding:12px 26px;border-radius:10px;display:inline-block">${isQuote ? 'Offerte bekijken' : 'Factuur bekijken'}</a>
    </p>
    <p style="margin:0;color:#6B7060;font-size:.85rem">Met vriendelijke groet,<br>${esc(bedrijf.naam)}${bedrijf.telefoon ? ' · ' + esc(bedrijf.telefoon) : ''}</p>
  </div></div>`;
}
function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
