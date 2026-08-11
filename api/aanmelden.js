// Publiek eindpunt achter de uitnodigings- en herstellink.
//   GET  ?token=…  -> is de link geldig, en voor wie is hij bedoeld
//   POST {token,naam,password} -> account aanmaken (of nieuw wachtwoord instellen) + inloggen
import * as db from './_db.js';

const ONGELDIG = 'Deze link is verlopen of al gebruikt. Vraag je beheerder om een nieuwe.';

async function geldigeInvite(token) {
  if (!token) return null;
  const inv = (await db.q('SELECT * FROM invites WHERE token=?', [String(token)]))[0];
  if (!inv || inv.gebruikt) return null;
  if (!inv.exp || new Date(inv.exp).getTime() < Date.now()) return null;
  return inv;
}

export default async function handler(req, res) {
  try {
    await db.ensureSchema();

    if (req.method === 'GET') {
      const inv = await geldigeInvite(req.query && req.query.token);
      if (!inv) return res.status(404).json({ ok: false, error: ONGELDIG });
      return res.status(200).json({ ok: true, email: inv.email, naam: inv.naam || '', soort: inv.soort || 'invite' });
    }

    if (req.method === 'POST') {
      const b = await db.readBody(req);
      const inv = await geldigeInvite(b.token);
      if (!inv) return res.status(404).json({ ok: false, error: ONGELDIG });
      const pw = String(b.password || '');
      if (pw.length < 10) return res.status(400).json({ ok: false, error: 'Kies een wachtwoord van minimaal 10 tekens.' });

      const now = new Date().toISOString();

      // Nieuw wachtwoord voor een bestaand account.
      if (inv.soort === 'reset' && inv.user_id) {
        const u = (await db.q('SELECT * FROM users WHERE id=?', [inv.user_id]))[0];
        if (!u || !u.actief) return res.status(404).json({ ok: false, error: ONGELDIG });
        const v = Number(u.pass_version || 1) + 1;
        await db.exec('UPDATE users SET pass_hash=?, pass_version=?, last_login=? WHERE id=?', [db.hashPw(pw), v, now, u.id]);
        await db.exec('UPDATE invites SET gebruikt=? WHERE id=?', [now, inv.id]);
        db.setAuthCookie(res, { id: u.id, pass_version: v });
        return res.status(200).json({ ok: true });
      }

      // Nieuw account vanuit een uitnodiging.
      const email = String(inv.email || '').trim().toLowerCase();
      if ((await db.q('SELECT id FROM users WHERE email=?', [email])).length) {
        await db.exec('UPDATE invites SET gebruikt=? WHERE id=?', [now, inv.id]);
        return res.status(409).json({ ok: false, error: 'Er bestaat al een account met dit e-mailadres. Log gewoon in.' });
      }
      const rol = db.ROLLEN[inv.rol] ? inv.rol : 'medewerker';
      let rechten = []; try { rechten = JSON.parse(inv.rechten || '[]'); } catch { rechten = []; }
      const naam = String(b.naam || inv.naam || '').trim();
      if (!naam) return res.status(400).json({ ok: false, error: 'Vul je naam in.' });

      await db.exec(`INSERT INTO users(email,pass_hash,naam,telefoon,rol,rechten,actief,pass_version,created,last_login)
        VALUES(?,?,?,?,?,?,1,1,?,?)`,
        [email, db.hashPw(pw), naam, String(b.telefoon || '').trim(), rol, JSON.stringify(db.cleanPerms(rechten, rol)), now, now]);
      await db.exec('UPDATE invites SET gebruikt=? WHERE id=?', [now, inv.id]);
      const u = (await db.q('SELECT * FROM users WHERE email=?', [email]))[0];
      db.setAuthCookie(res, u);
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ ok: false, error: 'method' });
  } catch (e) {
    return res.status(500).json({ ok: false, error: String(e.message || e).slice(0, 200) });
  }
}
