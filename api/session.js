// Admin login/logout/status. POST {password} -> cookie; GET -> {authed}; DELETE -> logout.
import * as db from './_db.js';

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      return res.status(200).json({ ok: true, authed: db.isAdmin(req) });
    }
    if (req.method === 'DELETE') {
      db.clearAuthCookie(res);
      return res.status(200).json({ ok: true });
    }
    if (req.method === 'POST') {
      const body = await db.readBody(req);
      const pw = String(body.password || '');
      if (pw && pw === (process.env.ADMIN_PASSWORD || '')) {
        db.setAuthCookie(res);
        return res.status(200).json({ ok: true });
      }
      return res.status(401).json({ ok: false, error: 'Onjuist wachtwoord' });
    }
    return res.status(405).json({ ok: false, error: 'method' });
  } catch (e) {
    return res.status(500).json({ ok: false, error: String(e.message || e).slice(0, 200) });
  }
};
