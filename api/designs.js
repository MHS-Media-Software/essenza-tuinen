// Opgeslagen tuinontwerpen. Anoniem opslaan (met resume-token) of gekoppeld aan een klantaccount.
// POST {token?, data, naam?} -> {token}. GET ?token= -> één ontwerp; ?mine=1 -> lijst van de klant.
// DELETE ?token= -> eigen ontwerp verwijderen (klant).
import * as db from './_db.js';
import crypto from 'node:crypto';

export default async function handler(req, res) {
  try {
    await db.ensureSchema();
    const custEmail = db.customerEmail(req);

    if (req.method === 'POST') {
      const b = await db.readBody(req);
      if (!b.data) return res.status(400).json({ ok: false, error: 'geen ontwerp' });
      const data = typeof b.data === 'string' ? b.data : JSON.stringify(b.data);
      const naam = String(b.naam || '').slice(0, 120);
      const email = custEmail || String(b.email || '').trim().toLowerCase() || null;
      const now = new Date().toISOString();

      if (b.token) {
        const rows = await db.q('SELECT id, email FROM designs WHERE token=?', [String(b.token)]);
        if (rows.length) {
          // alleen bijwerken als anoniem, van dezelfde klant, of nog niet gekoppeld
          const owner = rows[0].email;
          if (owner && custEmail && owner !== custEmail) return res.status(403).json({ ok: false, error: 'geen toegang' });
          await db.exec('UPDATE designs SET data=?, naam=?, email=COALESCE(?,email), updated=? WHERE token=?',
            [data, naam, email, now, String(b.token)]);
          return res.status(200).json({ ok: true, token: String(b.token) });
        }
      }
      const token = crypto.randomBytes(9).toString('hex');
      await db.exec('INSERT INTO designs(token,created,updated,naam,email,data) VALUES(?,?,?,?,?,?)',
        [token, now, now, naam, email, data]);
      return res.status(200).json({ ok: true, token });
    }

    if (req.method === 'GET') {
      if (req.query && req.query.token) {
        const rows = await db.q('SELECT token,naam,email,data,updated FROM designs WHERE token=?', [String(req.query.token)]);
        if (!rows.length) return res.status(404).json({ ok: false, error: 'niet gevonden' });
        const d = rows[0]; let data = null; try { data = JSON.parse(d.data); } catch {}
        return res.status(200).json({ ok: true, design: { token: d.token, naam: d.naam, email: d.email, updated: d.updated, data } });
      }
      if (req.query && (req.query.mine === '1')) {
        if (!custEmail) return res.status(401).json({ ok: false, error: 'niet ingelogd' });
        const rows = await db.q('SELECT token,naam,updated FROM designs WHERE email=? ORDER BY updated DESC LIMIT 50', [custEmail]);
        return res.status(200).json({ ok: true, designs: rows });
      }
      return res.status(400).json({ ok: false, error: 'token of mine=1 vereist' });
    }

    if (req.method === 'DELETE') {
      if (!custEmail) return res.status(401).json({ ok: false, error: 'niet ingelogd' });
      const token = String((await db.readBody(req)).token || (req.query && req.query.token) || '');
      if (!token) return res.status(400).json({ ok: false, error: 'token' });
      await db.exec('DELETE FROM designs WHERE token=? AND email=?', [token, custEmail]);
      return res.status(200).json({ ok: true });
    }
    return res.status(405).json({ ok: false, error: 'method' });
  } catch (e) {
    return res.status(500).json({ ok: false, error: String(e.message || e).slice(0, 200) });
  }
}
