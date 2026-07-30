// Serveert de bij een aanvraag opgeslagen AI-impressie als afbeelding.
// GET /api/impressie?token=... -> image (uit de designs-tabel, veld data.impressie).
import * as db from './_db.js';

export default async function handler(req, res) {
  try {
    await db.ensureSchema();
    const token = String((req.query && req.query.token) || '');
    if (!token) { res.status(400).send('geen token'); return; }
    const rows = await db.q('SELECT data FROM designs WHERE token=?', [token]);
    if (!rows.length) { res.status(404).send('niet gevonden'); return; }
    let data = {}; try { data = JSON.parse(rows[0].data) || {}; } catch {}
    const url = data.impressie || '';
    const m = /^data:(image\/[a-z+]+);base64,(.*)$/i.exec(url);
    if (!m) { res.status(404).send('geen afbeelding'); return; }
    const buf = Buffer.from(m[2], 'base64');
    res.setHeader('Content-Type', m[1]);
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.status(200).send(buf);
  } catch (e) {
    res.status(500).send('fout');
  }
}
