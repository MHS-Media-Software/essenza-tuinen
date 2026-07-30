// Publieke, print-klare weergave van een offerte of factuur via de deel-token.
// GET /api/document?type=quote|invoice&token=... -> volledige HTML-pagina.
import * as db from './_db.js';
import { getBedrijf, renderDocHTML } from './_doc.js';

export default async function handler(req, res) {
  try {
    await db.ensureSchema();
    const type = (req.query && req.query.type) === 'invoice' ? 'invoice' : 'quote';
    const token = String((req.query && req.query.token) || '');
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('X-Robots-Tag', 'noindex, nofollow');
    if (!token) { res.status(400).send(page('Geen document opgegeven.')); return; }
    const table = type === 'invoice' ? 'invoices' : 'quotes';
    const rows = await db.q(`SELECT * FROM ${table} WHERE token=?`, [token]);
    if (!rows.length) { res.status(404).send(page('Dit document is niet (meer) beschikbaar.')); return; }
    const bedrijf = await getBedrijf();
    res.status(200).send(renderDocHTML({ kind: type === 'invoice' ? 'invoice' : 'quote', doc: rows[0], bedrijf }));
  } catch (e) {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.status(500).send(page('Er ging iets mis bij het laden van dit document.'));
  }
}

function page(msg) {
  return `<!doctype html><meta charset="utf-8"><title>Essenza Tuinen</title>
<div style="font-family:system-ui,sans-serif;max-width:480px;margin:18vh auto;text-align:center;color:#1F2113">
<h1 style="font-size:1.3rem">Essenza Tuinen</h1><p style="color:#6B7060">${msg}</p></div>`;
}
