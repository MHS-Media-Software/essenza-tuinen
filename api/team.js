// Medewerkersbeheer: uitnodigen, rechten aan/uit zetten, deactiveren.
// Vereist het recht 'team'.
import * as db from './_db.js';
import { sendMail, basisHtml, siteUrl, esc } from './_mail.js';

const emailOk = (e) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(e || ''));
const INVITE_DAGEN = 7;

function rij(u) {
  let rechten = []; try { rechten = JSON.parse(u.rechten || '[]'); } catch { rechten = []; }
  return {
    id: u.id, naam: u.naam, email: u.email, telefoon: u.telefoon || '', rol: u.rol,
    rechten: db.cleanPerms(rechten, u.rol), actief: !!u.actief,
    created: u.created, last_login: u.last_login,
  };
}

// Er moet altijd minstens één actieve beheerder overblijven die het team beheert.
async function laatsteBeheerder(userId) {
  const rows = await db.q("SELECT id, rechten FROM users WHERE actief=1 AND id<>?", [userId]);
  return !rows.some(r => { try { return JSON.parse(r.rechten || '[]').includes('team'); } catch { return false; } });
}

async function maakUitnodiging({ soort, email, naam, rol, rechten, user_id, door }) {
  const token = db.randomToken();
  const now = new Date();
  await db.exec(`INSERT INTO invites(token,soort,email,naam,rol,rechten,user_id,door,created,exp)
    VALUES(?,?,?,?,?,?,?,?,?,?)`,
    [token, soort, email, naam || '', rol || 'medewerker', JSON.stringify(rechten || []), user_id || null,
      door || '', now.toISOString(), new Date(now.getTime() + INVITE_DAGEN * 864e5).toISOString()]);
  return token;
}

export default async function handler(req, res) {
  try {
    await db.ensureSchema();
    if (!(await db.requirePerm(req, res, 'team'))) return;
    const ik = await db.currentUser(req);

    if (req.method === 'GET') {
      const users = await db.q('SELECT * FROM users ORDER BY actief DESC, naam COLLATE NOCASE');
      const invites = await db.q("SELECT id,token,soort,email,naam,rol,created,exp,gebruikt FROM invites WHERE gebruikt IS NULL AND exp > ? ORDER BY created DESC",
        [new Date().toISOString()]);
      return res.status(200).json({
        ok: true, users: users.map(rij), perms: db.PERMS, rollen: db.ROLLEN,
        invites: invites.map(i => ({ ...i, link: `${siteUrl(req)}/account-aanmaken?token=${i.token}` })),
      });
    }

    if (req.method === 'POST') {
      const b = await db.readBody(req);

      // ── Nieuwe medewerker uitnodigen ─────────────────────────────────────
      if (b.action === 'uitnodigen') {
        const email = String(b.email || '').trim().toLowerCase();
        if (!emailOk(email)) return res.status(400).json({ ok: false, error: 'Vul een geldig e-mailadres in.' });
        const bestaat = await db.q('SELECT id FROM users WHERE email=?', [email]);
        if (bestaat.length) return res.status(409).json({ ok: false, error: 'Er is al een account met dit e-mailadres.' });
        const rol = db.ROLLEN[b.rol] ? b.rol : 'medewerker';
        const rechten = db.cleanPerms(b.rechten, rol);
        const naam = String(b.naam || '').trim();
        // Openstaande uitnodiging voor hetzelfde adres vervangen.
        await db.exec("UPDATE invites SET gebruikt=? WHERE email=? AND soort='invite' AND gebruikt IS NULL",
          [new Date().toISOString(), email]).catch(() => {});
        const token = await maakUitnodiging({ soort: 'invite', email, naam, rol, rechten, door: ik.naam || ik.email });
        const link = `${siteUrl(req)}/account-aanmaken?token=${token}`;

        let mail = { sent: false };
        if (b.mail !== false) mail = await stuurUitnodiging({ email, naam, link, door: ik.naam || ik.email });
        return res.status(200).json({ ok: true, link, mail });
      }

      // ── Uitnodiging opnieuw versturen ────────────────────────────────────
      if (b.action === 'opnieuw') {
        const inv = (await db.q('SELECT * FROM invites WHERE id=? AND gebruikt IS NULL', [+b.id || 0]))[0];
        if (!inv) return res.status(404).json({ ok: false, error: 'Uitnodiging niet gevonden.' });
        await db.exec('UPDATE invites SET exp=? WHERE id=?', [new Date(Date.now() + INVITE_DAGEN * 864e5).toISOString(), inv.id]);
        const link = `${siteUrl(req)}/account-aanmaken?token=${inv.token}`;
        const mail = await stuurUitnodiging({ email: inv.email, naam: inv.naam, link, door: ik.naam || ik.email });
        return res.status(200).json({ ok: true, link, mail });
      }

      // ── Herstellink voor een bestaand account ────────────────────────────
      if (b.action === 'reset') {
        const u = (await db.q('SELECT * FROM users WHERE id=?', [+b.id || 0]))[0];
        if (!u) return res.status(404).json({ ok: false, error: 'Medewerker niet gevonden.' });
        const token = await maakUitnodiging({ soort: 'reset', email: u.email, naam: u.naam, rol: u.rol, rechten: [], user_id: u.id, door: ik.naam || ik.email });
        const link = `${siteUrl(req)}/account-aanmaken?token=${token}`;
        let mail = { sent: false };
        if (b.mail !== false) {
          const tekst = `Beste ${u.naam || ''},\n\nEr is een link aangemaakt waarmee je een nieuw wachtwoord kunt instellen voor het beheer van Essenza Tuinen.\n\n${link}\n\nDe link is ${INVITE_DAGEN} dagen geldig.`;
          mail = await sendMail({
            to: u.email, subject: 'Nieuw wachtwoord instellen · Essenza Tuinen', text: tekst,
            html: basisHtml({
              titel: 'Nieuw wachtwoord instellen',
              tekstRegels: [`Beste ${esc(u.naam || '')},`, 'Via de knop hieronder stel je een nieuw wachtwoord in voor het beheer van Essenza Tuinen.'],
              knopTekst: 'Wachtwoord instellen', knopLink: link,
              voet: `Deze link is ${INVITE_DAGEN} dagen geldig.`,
            }),
            refType: 'reset', refId: u.id,
          });
        }
        return res.status(200).json({ ok: true, link, mail });
      }

      return res.status(400).json({ ok: false, error: 'Onbekende actie.' });
    }

    // ── Gegevens, rol, rechten of actief-status bijwerken ──────────────────
    if (req.method === 'PATCH') {
      const b = await db.readBody(req);
      const id = +b.id || 0;
      const u = (await db.q('SELECT * FROM users WHERE id=?', [id]))[0];
      if (!u) return res.status(404).json({ ok: false, error: 'Medewerker niet gevonden.' });

      const velden = [], args = [];
      if (b.naam !== undefined) { velden.push('naam=?'); args.push(String(b.naam).trim()); }
      if (b.telefoon !== undefined) { velden.push('telefoon=?'); args.push(String(b.telefoon).trim()); }
      if (b.rol !== undefined && db.ROLLEN[b.rol]) { velden.push('rol=?'); args.push(b.rol); }
      if (b.rechten !== undefined) {
        const rechten = db.cleanPerms(b.rechten, b.rol || u.rol);
        // Jezelf het teambeheer ontnemen — of de laatste beheerder uitschakelen — kan niet.
        if (!rechten.includes('team') && (id === ik.id || await laatsteBeheerder(id))) {
          return res.status(400).json({ ok: false, error: 'Er moet minstens één beheerder blijven die medewerkers kan beheren.' });
        }
        velden.push('rechten=?'); args.push(JSON.stringify(rechten));
      }
      if (b.actief !== undefined) {
        const actief = b.actief ? 1 : 0;
        if (!actief && (id === ik.id || await laatsteBeheerder(id))) {
          return res.status(400).json({ ok: false, error: id === ik.id ? 'Je kunt je eigen account niet op non-actief zetten.' : 'Er moet minstens één beheerder actief blijven.' });
        }
        velden.push('actief=?'); args.push(actief);
        // Op non-actief zetten verbreekt direct alle lopende sessies.
        if (!actief) velden.push('pass_version=pass_version+1');
      }
      if (!velden.length) return res.status(400).json({ ok: false, error: 'Niets om te wijzigen.' });
      args.push(id);
      await db.exec(`UPDATE users SET ${velden.join(', ')} WHERE id=?`, args);
      const na = (await db.q('SELECT * FROM users WHERE id=?', [id]))[0];
      return res.status(200).json({ ok: true, user: rij(na) });
    }

    // ── Openstaande uitnodiging intrekken ─────────────────────────────────
    if (req.method === 'DELETE') {
      const b = await db.readBody(req);
      if (!b.invite_id) return res.status(400).json({ ok: false, error: 'Alleen uitnodigingen kunnen worden ingetrokken. Zet een medewerker anders op non-actief.' });
      await db.exec('DELETE FROM invites WHERE id=?', [+b.invite_id]);
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ ok: false, error: 'method' });
  } catch (e) {
    return res.status(500).json({ ok: false, error: String(e.message || e).slice(0, 200) });
  }
}

async function stuurUitnodiging({ email, naam, link, door }) {
  const tekst = `Beste ${naam || ''},\n\n${door} heeft een account voor je klaargezet in de werkomgeving van Essenza Tuinen. Hierin vul je je uren in en zie je de planning.\n\nMaak je account aan via onderstaande link en kies zelf een wachtwoord:\n\n${link}\n\nDe link is ${INVITE_DAGEN} dagen geldig.`;
  return sendMail({
    to: email, subject: 'Je account voor Essenza Tuinen', text: tekst,
    html: basisHtml({
      titel: 'Welkom bij de werkomgeving',
      tekstRegels: [
        `Beste ${esc(naam || '')},`,
        `${esc(door)} heeft een account voor je klaargezet. Hierin vul je je gewerkte uren in en zie je de planning.`,
        'Klik op de knop hieronder, kies zelf een wachtwoord en je kunt meteen aan de slag.',
      ],
      knopTekst: 'Account aanmaken', knopLink: link,
      voet: `Deze link is ${INVITE_DAGEN} dagen geldig en werkt één keer.`,
    }),
    refType: 'invite', refId: 0,
  });
}
