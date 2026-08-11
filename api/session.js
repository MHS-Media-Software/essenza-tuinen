// Inloggen voor medewerkers en beheerders.
//   GET    -> wie ben ik + welke rechten heb ik (of: moet de site nog ingericht worden)
//   POST   -> {email,password} inloggen | {action:'setup'|'wachtwoord'|'profiel'}
//   DELETE -> uitloggen
import * as db from './_db.js';

const emailOk = (e) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(e || ''));
const publiek = (u) => ({ id: u.id, naam: u.naam, email: u.email, telefoon: u.telefoon || '', rol: u.rol, rechten: u.rechten });

export default async function handler(req, res) {
  try {
    await db.ensureSchema();

    if (req.method === 'GET') {
      const u = await db.currentUser(req);
      // Zolang er nog geen enkel account is, mag het eerste beheerdersaccount
      // eenmalig met het gedeelde beheerderswachtwoord worden aangemaakt.
      const setup = u ? false : (await db.userCount()) === 0;
      return res.status(200).json({
        ok: true, authed: !!u, setup,
        user: u ? publiek(u) : null,
        perms: db.PERMS, rollen: db.ROLLEN,
      });
    }

    if (req.method === 'DELETE') {
      db.clearAuthCookie(res);
      return res.status(200).json({ ok: true });
    }

    if (req.method === 'POST') {
      const b = await db.readBody(req);

      // ── Eenmalig: het eerste beheerdersaccount aanmaken ──────────────────
      if (b.action === 'setup') {
        if ((await db.userCount()) > 0) {
          return res.status(409).json({ ok: false, error: 'De omgeving is al ingericht. Log in met je eigen account.' });
        }
        const gedeeld = String(process.env.ADMIN_PASSWORD || '');
        if (!gedeeld || String(b.beheerderswachtwoord || '') !== gedeeld) {
          await db.noteAttempt(req, 'setup');
          return res.status(401).json({ ok: false, error: 'Onjuist beheerderswachtwoord.' });
        }
        const email = String(b.email || '').trim().toLowerCase();
        const pw = String(b.password || '');
        if (!emailOk(email)) return res.status(400).json({ ok: false, error: 'Vul een geldig e-mailadres in.' });
        if (pw.length < 10) return res.status(400).json({ ok: false, error: 'Kies een wachtwoord van minimaal 10 tekens.' });
        const now = new Date().toISOString();
        await db.exec(`INSERT INTO users(email,pass_hash,naam,rol,rechten,actief,pass_version,created,last_login)
          VALUES(?,?,?,?,?,1,1,?,?)`,
          [email, db.hashPw(pw), String(b.naam || '').trim() || 'Beheerder', 'beheerder', JSON.stringify(db.PERM_KEYS), now, now]);
        const u = (await db.q('SELECT * FROM users WHERE email=?', [email]))[0];
        db.setAuthCookie(res, u);
        return res.status(200).json({ ok: true, user: { ...publiek(u), rechten: db.PERM_KEYS } });
      }

      // ── Eigen wachtwoord wijzigen (verbreekt alle andere sessies) ────────
      if (b.action === 'wachtwoord') {
        const u = await db.currentUser(req);
        if (!u) return res.status(401).json({ ok: false, error: 'auth' });
        const nieuw = String(b.nieuw || '');
        if (nieuw.length < 10) return res.status(400).json({ ok: false, error: 'Kies een wachtwoord van minimaal 10 tekens.' });
        const rij = (await db.q('SELECT pass_hash, pass_version FROM users WHERE id=?', [u.id]))[0];
        if (!db.verifyPw(String(b.huidig || ''), rij.pass_hash)) {
          return res.status(401).json({ ok: false, error: 'Je huidige wachtwoord klopt niet.' });
        }
        const v = Number(rij.pass_version || 1) + 1;
        await db.exec('UPDATE users SET pass_hash=?, pass_version=? WHERE id=?', [db.hashPw(nieuw), v, u.id]);
        db.setAuthCookie(res, { id: u.id, pass_version: v });
        return res.status(200).json({ ok: true });
      }

      // ── Eigen naam/telefoon bijwerken ────────────────────────────────────
      if (b.action === 'profiel') {
        const u = await db.currentUser(req);
        if (!u) return res.status(401).json({ ok: false, error: 'auth' });
        await db.exec('UPDATE users SET naam=?, telefoon=? WHERE id=?',
          [String(b.naam || '').trim() || u.naam, String(b.telefoon || '').trim(), u.id]);
        return res.status(200).json({ ok: true });
      }

      // ── Gewoon inloggen ──────────────────────────────────────────────────
      const email = String(b.email || '').trim().toLowerCase();
      const pw = String(b.password || '');
      if (!email || !pw) return res.status(400).json({ ok: false, error: 'Vul je e-mailadres en wachtwoord in.' });
      if (await db.tooManyAttempts(req, email)) {
        return res.status(429).json({ ok: false, error: 'Te veel inlogpogingen. Probeer het over 15 minuten opnieuw.' });
      }
      const u = (await db.q('SELECT * FROM users WHERE email=?', [email]))[0];
      // Bewust één en dezelfde melding, zodat niet te achterhalen is welke
      // e-mailadressen een account hebben.
      if (!u || !u.actief || !db.verifyPw(pw, u.pass_hash)) {
        await db.noteAttempt(req, email);
        return res.status(401).json({ ok: false, error: 'Onjuist e-mailadres of wachtwoord.' });
      }
      await db.clearAttempts(req, email);
      await db.exec('UPDATE users SET last_login=? WHERE id=?', [new Date().toISOString(), u.id]);
      db.setAuthCookie(res, u);
      let rechten = []; try { rechten = JSON.parse(u.rechten || '[]'); } catch { rechten = []; }
      return res.status(200).json({ ok: true, user: { ...publiek(u), rechten: db.cleanPerms(rechten, u.rol) } });
    }

    return res.status(405).json({ ok: false, error: 'method' });
  } catch (e) {
    return res.status(500).json({ ok: false, error: String(e.message || e).slice(0, 200) });
  }
}
