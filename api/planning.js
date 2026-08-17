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

// Een klus kan meer dagen duren: dan komt er per dag een setje regels, allemaal
// in dezelfde groep. Zo kun je later op één dag iemand extra aanvinken.
function dagenUit(b) {
  const start = String(b.datum || '').slice(0, 10);
  let n = Math.max(1, Math.min(31, Math.round(+b.dagen || 1)));
  if (b.tot_datum) {
    const eind = String(b.tot_datum).slice(0, 10);
    const dagen = Math.round((new Date(`${eind}T00:00:00Z`) - new Date(`${start}T00:00:00Z`)) / 864e5) + 1;
    if (dagen > 0) n = Math.min(31, dagen);
  }
  return Array.from({ length: n }, (_, i) =>
    new Date(new Date(`${start}T00:00:00Z`).getTime() + i * 864e5).toISOString().slice(0, 10));
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
      // Wie de planning maakt of het recht 'planning_alle' heeft ziet iedereen.
      // De rest ziet alleen de klussen waarop hij zelf staat — plus de collega's
      // die diezelfde dag op diezelfde klus staan, zodat je wel weet met wie je
      // op pad gaat.
      const magAlles = magBeheren || ik.rechten.includes('planning_alle');
      const args = [van, tot];
      let where = 's.datum BETWEEN ? AND ?';
      if (!magAlles) {
        where += ` AND (s.user_id=? OR EXISTS (SELECT 1 FROM shifts m
          WHERE m.user_id=? AND m.groep IS NOT NULL AND m.groep=s.groep AND m.datum=s.datum))`;
        args.push(ik.id, ik.id);
      } else if (qy.user_id && qy.user_id !== 'alle') { where += ' AND s.user_id=?'; args.push(+qy.user_id); }

      const shifts = await db.q(
        `SELECT s.*, u.naam AS medewerker, l.naam AS lead_naam, l.plaats AS lead_plaats, l.telefoon AS lead_telefoon
         FROM shifts s LEFT JOIN users u ON u.id=s.user_id LEFT JOIN leads l ON l.id=s.lead_id
         WHERE ${where} ORDER BY s.datum, s.van, s.id`, args);

      // Actieve medewerkers plus iedereen die in deze week nog ingepland staat,
      // zodat werk van een uit dienst getreden collega niet uit beeld verdwijnt.
      // MHS-accounts (via='sso') zijn geen personeel en staan hier niet tussen,
      // tenzij er voor deze week toch een klus op hun naam staat.
      // Zie je alleen je eigen planning, dan bevat de lijst alleen de mensen die
      // in de zichtbare klussen voorkomen.
      const collegas = magAlles
        ? await db.q(`SELECT id,naam,actief FROM users
            WHERE (actief=1 AND COALESCE(via,'lokaal')<>'sso')
               OR id IN (SELECT DISTINCT user_id FROM shifts WHERE datum BETWEEN ? AND ?)
            ORDER BY actief DESC, naam COLLATE NOCASE`, [van, tot])
        : [{ id: ik.id, naam: ik.naam, actief: 1 }].concat(
            [...new Set(shifts.map(s => s.user_id).filter(u => u && u !== ik.id))]
              .map(uid => { const s = shifts.find(x => x.user_id === uid); return { id: uid, naam: s.medewerker, actief: 1 }; }));
      // Klantenlijst alleen voor wie de planning maakt (en dus een klus koppelt).
      const klanten = magBeheren
        ? await db.q("SELECT id,naam,plaats FROM leads WHERE status NOT IN ('verloren') ORDER BY id DESC LIMIT 200")
        : [];
      return res.status(200).json({
        ok: true, van, tot, shifts, collegas, klanten, soorten: SOORTEN,
        ik: { id: ik.id, naam: ik.naam }, magBeheren, magAlles,
      });
    }

    if (!magBeheren) return res.status(403).json({ ok: false, error: 'Je mag de planning niet wijzigen.' });

    if (req.method === 'POST') {
      const b = await db.readBody(req);
      const fout = valideer(b);
      if (fout) return res.status(400).json({ ok: false, error: fout });
      const groep = db.randomToken().slice(0, 20);
      const dagen = dagenUit(b);
      for (const datum of dagen) for (const uid of teamUit(b)) await voegToe({ ...b, datum }, uid, groep, ik.id);
      return res.status(200).json({ ok: true, groep, dagen: dagen.length });
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
      // Wie er meegaan en de tijden gelden voor de dag die je open hebt staan;
      // klant, adres en notitie gelden voor de hele klus. Anders zou het
      // verplaatsen van één dag de rest van een meerdaagse klus meeslepen.
      const dag = r.datum;
      const regels = await db.q('SELECT * FROM shifts WHERE groep=? AND datum=?', [groep, dag]);
      const now = new Date().toISOString();

      // Wie moet erbij, wie eraf? Uitvinken in het scherm haalt iemand van de klus.
      // Bij een lege bezetting blijft er bewust één regel over: anders zou de dag
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
        for (const uid of ids.filter(u => !heeft.includes(u))) await voegToe({ ...samen, datum: dag }, uid, groep, ik.id);
      }

      // Deze dag: datum, tijden, bezetting en de losse namen.
      await db.exec(`UPDATE shifts SET datum=?, van=?, tot=?, extern=?, updated=? WHERE groep=? AND datum=?`,
        [String(samen.datum).slice(0, 10), String(samen.van || '').slice(0, 5) || null, String(samen.tot || '').slice(0, 5) || null,
          String(samen.extern || '').slice(0, 200) || null, now, groep, dag]);
      if (leegmaken) await db.exec('UPDATE shifts SET user_id=NULL WHERE groep=? AND datum=?', [groep, String(samen.datum).slice(0, 10)]);

      // De hele klus: klant, omschrijving, adres en notitie.
      await db.exec(`UPDATE shifts SET titel=?, lead_id=?, klant=?, adres=?, notitie=?, soort=?, status=?, updated=?
        WHERE groep=?`,
        [String(samen.titel || '').slice(0, 160) || null, samen.lead_id ? +samen.lead_id : null,
          String(samen.klant || '').slice(0, 160) || null, String(samen.adres || '').slice(0, 200) || null,
          String(samen.notitie || '').slice(0, 600) || null, SOORTEN.includes(samen.soort) ? samen.soort : 'klus',
          ['gepland', 'bezig', 'klaar'].includes(samen.status) ? samen.status : 'gepland', now, groep]);
      return res.status(200).json({ ok: true, groep });
    }

    // Verwijderen gaat over alle mensen op de klus: standaard alleen deze dag,
    // met {alles:true} de hele (meerdaagse) klus.
    if (req.method === 'DELETE') {
      const b = await db.readBody(req);
      const r = (await db.q('SELECT * FROM shifts WHERE id=?', [+b.id || 0]))[0];
      if (!r) return res.status(200).json({ ok: true });
      const regels = !r.groep ? [{ id: r.id }]
        : (b.alles ? await db.q('SELECT id FROM shifts WHERE groep=?', [r.groep])
                   : await db.q('SELECT id FROM shifts WHERE groep=? AND datum=?', [r.groep, r.datum]));
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
