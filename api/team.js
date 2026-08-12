// Medewerkersbeheer: uitnodigen, rechten aan/uit zetten, deactiveren.
// Vereist het recht 'team'.
import * as db from './_db.js';
import { sendMail, basisHtml, siteUrl, esc } from './_mail.js';

const INVITE_DAGEN = 7;

function rij(u) {
  let rechten = []; try { rechten = JSON.parse(u.rechten || '[]'); } catch { rechten = []; }
  return {
    id: u.id, naam: u.naam, email: u.email, telefoon: u.telefoon || '', rol: u.rol,
    rechten: db.cleanPerms(rechten, u.rol), actief: !!u.actief, status: u.status || 'actief', via: u.via || 'lokaal',
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
      const rijen = users.map(rij);
      return res.status(200).json({
        ok: true, users: rijen, perms: db.PERMS, rollen: db.ROLLEN,
        wachtend: rijen.filter(u => u.status === 'wacht').length,
        invites: invites.map(i => ({ ...i, link: `${siteUrl(req)}/account-aanmaken?token=${i.token}` })),
      });
    }

    if (req.method === 'POST') {
      const b = await db.readBody(req);

      // ── Deelbare aanmeldlink maken ───────────────────────────────────────
      // Eén link die je aan je team geeft; iedereen die hem opent maakt zelf een
      // account aan. Dat account is nog niet actief: jij keurt het eerst goed.
      if (b.action === 'link') {
        const rol = db.ROLLEN[b.rol] ? b.rol : 'medewerker';
        const rechten = db.cleanPerms(b.rechten, rol);
        const token = await maakUitnodiging({ soort: 'open', rol, rechten, door: ik.naam || ik.email });
        return res.status(200).json({
          ok: true, link: `${siteUrl(req)}/account-aanmaken?token=${token}`, dagen: INVITE_DAGEN,
        });
      }

      // ── Bestaande link met een week verlengen ────────────────────────────
      if (b.action === 'verleng') {
        const inv = (await db.q('SELECT * FROM invites WHERE id=? AND gebruikt IS NULL', [+b.id || 0]))[0];
        if (!inv) return res.status(404).json({ ok: false, error: 'Deze link bestaat niet meer.' });
        await db.exec('UPDATE invites SET exp=? WHERE id=?', [new Date(Date.now() + INVITE_DAGEN * 864e5).toISOString(), inv.id]);
        return res.status(200).json({ ok: true, link: `${siteUrl(req)}/account-aanmaken?token=${inv.token}` });
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

      // ── Nieuw aangemeld account goedkeuren of weigeren ──────────────────
      if (b.actie === 'goedkeuren' || b.actie === 'afkeuren') {
        if ((u.status || 'actief') !== 'wacht') {
          return res.status(409).json({ ok: false, error: 'Dit account wacht niet (meer) op goedkeuring.' });
        }
        if (b.actie === 'afkeuren') {
          // Weigeren verwijdert het account: er hangt nog geen werk aan.
          await db.exec('DELETE FROM passkeys WHERE user_id=?', [id]).catch(() => {});
          await db.exec('DELETE FROM users WHERE id=?', [id]);
          return res.status(200).json({ ok: true, verwijderd: true });
        }
        await db.exec("UPDATE users SET status='actief', actief=1 WHERE id=?", [id]);
        const na = (await db.q('SELECT * FROM users WHERE id=?', [id]))[0];
        return res.status(200).json({ ok: true, user: rij(na) });
      }

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
        velden.push('status=?'); args.push(actief ? 'actief' : 'inactief');
        // Op non-actief zetten verbreekt direct alle lopende sessies.
        if (!actief) velden.push('pass_version=pass_version+1');
      }
      if (!velden.length) return res.status(400).json({ ok: false, error: 'Niets om te wijzigen.' });
      args.push(id);
      await db.exec(`UPDATE users SET ${velden.join(', ')} WHERE id=?`, args);
      const na = (await db.q('SELECT * FROM users WHERE id=?', [id]))[0];
      return res.status(200).json({ ok: true, user: rij(na) });
    }

    // ── Uitnodiging intrekken of medewerker verwijderen ───────────────────
    if (req.method === 'DELETE') {
      const b = await db.readBody(req);
      if (b.invite_id) {
        await db.exec('DELETE FROM invites WHERE id=?', [+b.invite_id]);
        return res.status(200).json({ ok: true });
      }

      const id = +b.id || 0;
      const u = (await db.q('SELECT * FROM users WHERE id=?', [id]))[0];
      if (!u) return res.status(404).json({ ok: false, error: 'Medewerker niet gevonden.' });
      if (id === ik.id) return res.status(400).json({ ok: false, error: 'Je kunt je eigen account niet verwijderen.' });
      if (await laatsteBeheerder(id)) {
        return res.status(400).json({ ok: false, error: 'Er moet minstens één beheerder blijven die medewerkers kan beheren.' });
      }

      // Verwijderen mag alleen als er geen werk aan hangt: anders blijven er
      // urenregels achter zonder naam en kloppen de weekoverzichten niet meer.
      const [{ n: urenN }] = await db.q('SELECT COUNT(*) AS n FROM hours WHERE user_id=?', [id]);
      const [{ n: klusN }] = await db.q('SELECT COUNT(*) AS n FROM shifts WHERE user_id=?', [id]);
      if (urenN || klusN) {
        const delen = [];
        if (urenN) delen.push(`${urenN} urenregel${urenN === 1 ? '' : 's'}`);
        if (klusN) delen.push(`${klusN} ingeplande klus${klusN === 1 ? '' : 'sen'}`);
        return res.status(409).json({
          ok: false, urenN, klusN,
          error: `${u.naam || u.email} heeft ${delen.join(' en ')}. Zet het account op non-actief — dan blijft de historie kloppen en kan diegene niet meer inloggen.`,
        });
      }

      await db.exec('DELETE FROM passkeys WHERE user_id=?', [id]).catch(() => {});
      await db.exec('DELETE FROM invites WHERE user_id=? OR email=?', [id, u.email]).catch(() => {});
      await db.exec('DELETE FROM users WHERE id=?', [id]);
      return res.status(200).json({ ok: true, naam: u.naam || u.email });
    }

    return res.status(405).json({ ok: false, error: 'method' });
  } catch (e) {
    return res.status(500).json({ ok: false, error: String(e.message || e).slice(0, 200) });
  }
}
