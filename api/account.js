// Klantaccount (optioneel, om ontwerpen te bewaren en later verder te werken).
// GET -> {authed,email}; POST {action:'register'|'login',email,password,naam}; DELETE -> uitloggen.
import * as db from './_db.js';

const emailOk = (e) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(e || ''));

export default async function handler(req, res) {
  try {
    await db.ensureSchema();

    if (req.method === 'GET') {
      const email = db.customerEmail(req);
      return res.status(200).json({ ok: true, authed: !!email, email: email || null });
    }
    if (req.method === 'DELETE') {
      db.clearCustomerCookie(res);
      return res.status(200).json({ ok: true });
    }
    if (req.method === 'POST') {
      const b = await db.readBody(req);
      const email = String(b.email || '').trim().toLowerCase();
      const pw = String(b.password || '');
      if (!emailOk(email)) return res.status(400).json({ ok: false, error: 'Vul een geldig e-mailadres in.' });
      if (pw.length < 6) return res.status(400).json({ ok: false, error: 'Kies een wachtwoord van minimaal 6 tekens.' });

      const rows = await db.q('SELECT id, pass_hash FROM customers WHERE email=?', [email]);
      if (b.action === 'register') {
        if (rows.length) return res.status(409).json({ ok: false, error: 'Er bestaat al een account met dit e-mailadres. Log in.' });
        await db.exec('INSERT INTO customers(email,pass_hash,naam,created) VALUES(?,?,?,?)',
          [email, db.hashPw(pw), b.naam || '', new Date().toISOString()]);
        db.setCustomerCookie(res, email);
        return res.status(200).json({ ok: true, email });
      }
      // login
      if (!rows.length || !db.verifyPw(pw, rows[0].pass_hash)) return res.status(401).json({ ok: false, error: 'Onjuist e-mailadres of wachtwoord.' });
      db.setCustomerCookie(res, email);
      return res.status(200).json({ ok: true, email });
    }
    return res.status(405).json({ ok: false, error: 'method' });
  } catch (e) {
    return res.status(500).json({ ok: false, error: String(e.message || e).slice(0, 200) });
  }
}
