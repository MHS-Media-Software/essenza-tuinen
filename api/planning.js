// Weekplanning. Iedereen met 'planning_bekijken' ziet de hele teamplanning;
// aanmaken en wijzigen vereist 'planning_beheren'.
//   GET    ?van&tot[&user_id]
//   POST   nieuwe klus inplannen
//   PATCH  klus wijzigen
//   DELETE klus verwijderen
import * as db from './_db.js';

const SOORTEN = ['klus', 'bezichtiging', 'onderhoud', 'intern', 'verlof'];

function valideer(b) {
  const datum = String(b.datum || '').slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(datum)) return 'Kies een geldige datum.';
  const van = String(b.van || '').slice(0, 5), tot = String(b.tot || '').slice(0, 5);
  if (van && !/^\d\d:\d\d$/.test(van)) return 'Vul een geldige begintijd in.';
  if (tot && !/^\d\d:\d\d$/.test(tot)) return 'Vul een geldige eindtijd in.';
  if (van && tot && tot <= van) return 'De eindtijd moet na de begintijd liggen.';
  if (!String(b.titel || '').trim() && !b.lead_id && !String(b.klant || '').trim()) return 'Vul een omschrijving of een klant in.';
  return null;
}

// Wie staan er op de klus? Eén regel per medewerker; niemand toegewezen wordt
// één regel zonder medewerker, zodat de klus wel in het rooster blijft staan.
function teamUit(b) {
  const lijst = Array.isArray(b.user_ids) ? b.user_ids : (b.user_id ? [b.user_id] : []);
  const ids = [...new Set(lijst.map(x => +x).filter(x => x > 0))];
  return ids.length ? ids : [null];
}

async function voegToe(b, userId, groep, doorId) {
  const now = new Date().toISOString();
  await db.exec(`INSERT INTO shifts(datum,van,tot,user_id,titel,lead_id,klant,adres,notitie,soort,status,groep,extern,created_by,created,updated)
    VALUES(?,?,?,?,?,?,?,?,?,?,'gepland',?,?,?,?,?)`,
    [String(b.datum).slice(0, 10), String(b.van || '').slice(0, 5) || null, String(b.tot || '').slice(0, 5) || null,
      userId || null, String(b.titel || '').slice(0, 160) || null, b.lead_id ? +b.lead_id : null,
      String(b.klant || '').slice(0, 160) || null, String(b.adres || '').slice(0, 200) || null,
      String(b.notitie || '').slice(0, 600) || null, SOORTEN.includes(b.soort) ? b.soort : 'klus',
      groep, String(b.extern || '').slice(0, 200) || null, doorId, now, now]);
}

export default async function handler(req, res) {
  try {
    await db.ensureSchema();
    if (!(await db.requirePerm(req, res, 'planning_bekijken'))) return;
    const ik = await db.currentUser(req);
    const magBeheren = ik.rechten.includes('planning_beheren');

    if (req.method === 'GET') {
      const qy = req.query || {};
      const van = String(qy.van || '').slice(0, 10) || db.weekStart(new Date().toISOString());
      const tot = String(qy.tot || '').slice(0, 10) || new Date(new Date(`${van}T00:00:00Z`).getTime() + 6 * 864e5).toISOString().slice(0, 10);
      const args = [van, tot];
      let where = 's.datum BETWEEN ? AND ?';
      if (qy.user_id && qy.user_id !== 'alle') { where += ' AND s.user_id=?'; args.push(+qy.user_id); }

      const shifts = await db.q(
        `SELECT s.*, u.naam AS medewerker, l.naam AS lead_naam, l.plaats AS lead_plaats, l.telefoon AS lead_telefoon
         FROM shifts s LEFT JOIN users u ON u.id=s.user_id LEFT JOIN leads l ON l.id=s.lead_id
         WHERE ${where} ORDER BY s.datum, s.van, s.id`, args);
      // Actieve medewerkers plus iedereen die in deze week nog ingepland staat,
      // zodat werk van een uit dienst getreden collega niet uit beeld verdwijnt.
      // MHS-accounts (via='sso') zijn geen personeel en staan hier niet tussen,
      // tenzij er voor deze week toch een klus op hun naam staat.
      const collegas = await db.q(`SELECT id,naam,actief FROM users
        WHERE (actief=1 AND COALESCE(via,'lokaal')<>'sso')
           OR id IN (SELECT DISTINCT user_id FROM shifts WHERE datum BETWEEN ? AND ?)
        ORDER BY actief DESC, naam COLLATE NOCASE`, [van, tot]);
      // Klantenlijst alleen voor wie de planning maakt (en dus een klus koppelt).
      const klanten = magBeheren
        ? await db.q("SELECT id,naam,plaats FROM leads WHERE status NOT IN ('verloren') ORDER BY id DESC LIMIT 200")
        : [];
      return res.status(200).json({
        ok: true, van, tot, shifts, collegas, klanten, soorten: SOORTEN,
        ik: { id: ik.id, naam: ik.naam }, magBeheren,
      });
    }

    if (!magBeheren) return res.status(403).json({ ok: false, error: 'Je mag de planning niet wijzigen.' });

    if (req.method === 'POST') {
      const b = await db.readBody(req);
      const fout = valideer(b);
      if (fout) return res.status(400).json({ ok: false, error: fout });
      const groep = db.randomToken().slice(0, 20);
      for (const uid of teamUit(b)) await voegToe(b, uid, groep, ik.id);
      return res.status(200).json({ ok: true, groep });
    }

    if (req.method === 'PATCH') {
      const b = await db.readBody(req);
      const r = (await db.q('SELECT * FROM shifts WHERE id=?', [+b.id || 0]))[0];
      if (!r) return res.status(404).json({ ok: false, error: 'Deze klus staat niet meer in de planning.' });
      const samen = { ...r, ...b };
      const fout = valideer(samen);
      if (fout) return res.status(400).json({ ok: false, error: fout });

      // Klussen van vóór de teamfunctie hebben nog geen groep; die krijgen er nu een.
      let groep = r.groep;
      if (!groep) { groep = db.randomToken().slice(0, 20); await db.exec('UPDATE shifts SET groep=? WHERE id=?', [groep, r.id]); }
      const regels = await db.q('SELECT * FROM shifts WHERE groep=?', [groep]);

      // Wie moet erbij, wie eraf? Uitvinken in het scherm haalt iemand van de klus.
      // Bij een lege bezetting blijft er bewust één regel over: anders zou de klus
      // zelf uit de planning verdwijnen.
      const ids = (b.user_ids !== undefined ? teamUit(b) : regels.map(x => x.user_id)).filter(Boolean);
      const leegmaken = !ids.length;
      const blijft = leegmaken ? regels.slice(0, 1) : regels.filter(x => ids.includes(x.user_id));
      for (const x of regels.filter(x => !blijft.includes(x))) {
        await db.exec('UPDATE hours SET shift_id=NULL WHERE shift_id=?', [x.id]).catch(() => {});
        await db.exec('DELETE FROM shifts WHERE id=?', [x.id]);
      }
      if (!leegmaken) {
        const heeft = blijft.map(x => x.user_id);
        for (const uid of ids.filter(u => !heeft.includes(u))) await voegToe(samen, uid, groep, ik.id);
      }

      await db.exec(`UPDATE shifts SET datum=?, van=?, tot=?, titel=?, lead_id=?, klant=?, adres=?, notitie=?, soort=?, status=?, extern=?, updated=?
        WHERE groep=?`,
        [String(samen.datum).slice(0, 10), String(samen.van || '').slice(0, 5) || null, String(samen.tot || '').slice(0, 5) || null,
          String(samen.titel || '').slice(0, 160) || null, samen.lead_id ? +samen.lead_id : null,
          String(samen.klant || '').slice(0, 160) || null, String(samen.adres || '').slice(0, 200) || null,
          String(samen.notitie || '').slice(0, 600) || null, SOORTEN.includes(samen.soort) ? samen.soort : 'klus',
          ['gepland', 'bezig', 'klaar'].includes(samen.status) ? samen.status : 'gepland',
          String(samen.extern || '').slice(0, 200) || null, new Date().toISOString(), groep]);
      // Bij een lege bezetting moet de overgebleven regel ook echt leeg zijn.
      if (leegmaken) await db.exec('UPDATE shifts SET user_id=NULL WHERE groep=?', [groep]);
      return res.status(200).json({ ok: true, groep });
    }

    // Verwijderen gaat altijd over de hele klus, dus over alle mensen erop.
    if (req.method === 'DELETE') {
      const b = await db.readBody(req);
      const r = (await db.q('SELECT * FROM shifts WHERE id=?', [+b.id || 0]))[0];
      if (!r) return res.status(200).json({ ok: true });
      const regels = r.groep ? await db.q('SELECT id FROM shifts WHERE groep=?', [r.groep]) : [{ id: r.id }];
      for (const x of regels) {
        await db.exec('UPDATE hours SET shift_id=NULL WHERE shift_id=?', [x.id]).catch(() => {});
        await db.exec('DELETE FROM shifts WHERE id=?', [x.id]);
      }
      return res.status(200).json({ ok: true, aantal: regels.length });
    }

    return res.status(405).json({ ok: false, error: 'method' });
  } catch (e) {
    return res.status(500).json({ ok: false, error: String(e.message || e).slice(0, 200) });
  }
}
