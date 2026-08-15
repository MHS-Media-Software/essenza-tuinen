// Urenregistratie. Medewerkers vullen hun eigen dagen in ('uren_eigen');
// met 'uren_alle' zie je iedereen, keur je per week goed en exporteer je naar CSV.
//   GET    ?van&tot[&user_id|&iedereen=1][&export=csv]
//   POST   nieuwe urenregel
//   PATCH  regel wijzigen | {action:'indienen'|'beoordelen'|'heropenen'}
//   DELETE regel verwijderen
import * as db from './_db.js';

const VERGRENDELD = ['ingediend', 'akkoord'];
const SOORTEN = ['werk', 'reis', 'verlof', 'ziek'];

// Uren uit start/eind/pauze, of het handmatig ingevulde aantal.
function berekenUren(b) {
  const start = String(b.start || '').slice(0, 5);
  const eind = String(b.eind || '').slice(0, 5);
  if (/^\d\d:\d\d$/.test(start) && /^\d\d:\d\d$/.test(eind)) {
    const [su, sm] = start.split(':').map(Number);
    const [eu, em] = eind.split(':').map(Number);
    let min = (eu * 60 + em) - (su * 60 + sm);
    if (min < 0) min += 24 * 60; // doorgewerkt over middernacht
    min -= Math.max(0, +b.pauze || 0);
    return Math.max(0, Math.round(min / 0.6) / 100);
  }
  return Math.max(0, Math.round((+b.uren || 0) * 100) / 100);
}

function valideer(b, uren) {
  const datum = String(b.datum || '').slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(datum)) return 'Kies een geldige datum.';
  const vandaag = new Date(); vandaag.setHours(23, 59, 59, 999);
  if (new Date(`${datum}T12:00:00`) > vandaag) return 'Je kunt nog geen uren invullen voor een datum in de toekomst.';
  if (uren <= 0) return 'Vul een begin- en eindtijd in, of een aantal uren.';
  if (uren > 24) return 'Meer dan 24 uur op één dag kan niet.';
  return null;
}

const publiek = (r) => ({ ...r, akkoord: r.status === 'akkoord', vergrendeld: VERGRENDELD.includes(r.status) });

const isDatum = (s) => /^\d{4}-\d{2}-\d{2}$/.test(String(s || ''));
// Maandag van een ISO-week als '2026-W33' — nog gebruikt door oudere,
// nog niet herladen beheerpagina's die de week meesturen in plaats van data.
function weekNaarDatum(week) {
  const m = String(week || '').match(/^(\d{4})-W(\d{2})$/);
  if (!m) return null;
  const eersteWeek = new Date(db.weekStart(`${m[1]}-01-04`) + 'T00:00:00Z');
  return new Date(eersteWeek.getTime() + (+m[2] - 1) * 7 * 864e5).toISOString().slice(0, 10);
}

// Indienen en goedkeuren gaan over een datumbereik: zo werkt een week net zo
// goed als een kalendermaand, ook als die week over twee maanden heen loopt.
// Elke urenregel krijgt los zijn status, dus er kan niets tussen wal en schip.
function periode(b) {
  let van = String(b.van || '').slice(0, 10);
  let tot = String(b.tot || '').slice(0, 10);
  if (!isDatum(van) && b.week) {
    const maandag = weekNaarDatum(b.week);
    if (maandag) { van = maandag; tot = new Date(new Date(`${maandag}T00:00:00Z`).getTime() + 6 * 864e5).toISOString().slice(0, 10); }
  }
  if (!isDatum(van) || !isDatum(tot)) return { fout: 'Kies een periode.' };
  if (tot < van) return { fout: 'De einddatum ligt vóór de begindatum.' };
  const dagen = (new Date(`${tot}T00:00:00Z`) - new Date(`${van}T00:00:00Z`)) / 864e5;
  if (dagen > 61) return { fout: 'Kies hooguit één maand tegelijk.' };
  return { van, tot };
}

export default async function handler(req, res) {
  try {
    await db.ensureSchema();
    if (!(await db.requirePerm(req, res, null))) return;
    const ik = await db.currentUser(req);
    const magAlles = ik.rechten.includes('uren_alle');
    const magEigen = ik.rechten.includes('uren_eigen');
    if (!magAlles && !magEigen) return res.status(403).json({ ok: false, error: 'Je hebt geen toegang tot urenregistratie.' });

    // ── Ophalen ────────────────────────────────────────────────────────────
    if (req.method === 'GET') {
      const qy = req.query || {};
      const van = String(qy.van || '').slice(0, 10) || db.weekStart(new Date().toISOString());
      const tot = String(qy.tot || '').slice(0, 10) || new Date(new Date(`${van}T00:00:00Z`).getTime() + 6 * 864e5).toISOString().slice(0, 10);
      const iedereen = magAlles && (qy.iedereen === '1' || qy.user_id === 'alle');
      const wieId = qy.user_id && qy.user_id !== 'alle' ? +qy.user_id : ik.id;
      if (!iedereen && wieId !== ik.id && !magAlles) {
        return res.status(403).json({ ok: false, error: 'Je kunt alleen je eigen uren bekijken.' });
      }

      const args = [van, tot];
      let where = 'h.datum BETWEEN ? AND ?';
      if (!iedereen) { where += ' AND h.user_id=?'; args.push(wieId); }
      const rows = await db.q(
        `SELECT h.*, u.naam AS medewerker, l.naam AS lead_naam
         FROM hours h LEFT JOIN users u ON u.id=h.user_id LEFT JOIN leads l ON l.id=h.lead_id
         WHERE ${where} ORDER BY h.datum, h.start, h.id`, args);

      // CSV voor de boekhouding. Zonder iedereen=1 krijg je \u00E9\u00E9n medewerker,
      // zodat de boekhouder per persoon een bestand kan opslaan.
      if (qy.export === 'csv') {
        if (!magAlles) return res.status(403).json({ ok: false, error: 'Geen toegang tot de export.' });
        const kop = ['Datum', 'Medewerker', 'Van', 'Tot', 'Pauze (min)', 'Uren', 'Soort', 'Klant', 'Omschrijving', 'Status'];
        const regels = rows.map(r => [
          r.datum, r.medewerker || '', r.start || '', r.eind || '', r.pauze || 0,
          String(r.uren).replace('.', ','), r.soort || 'werk',
          r.lead_naam || r.project || '', String(r.omschrijving || '').replace(/[\r\n;]/g, ' '), r.status,
        ].join(';'));
        // Sluitregel met het totaal: dat is waar de boekhouding op uitkomt.
        const totaal = rows.reduce((s, r) => s + (+r.uren || 0), 0);
        regels.push(['', 'TOTAAL', '', '', '', String(Math.round(totaal * 100) / 100).replace('.', ','), '', '', '', ''].join(';'));
        const csv = [kop.join(';')].concat(regels).join('\r\n');
        let wie = '';
        if (!iedereen) {
          const u = (await db.q('SELECT naam FROM users WHERE id=?', [wieId]))[0];
          wie = String((u && u.naam) || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        }
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="uren-${wie ? wie + '-' : ''}${van}_${tot}.csv"`);
        return res.status(200).send('\uFEFF' + csv);
      }

      // Actieve medewerkers plus iedereen die in deze periode uren heeft staan —
      // anders vallen de uren van een uit dienst getreden collega uit het overzicht.
      // MHS-accounts (via='sso') horen bij het bureau en zijn geen personeel: die
      // blijven eruit, tenzij er toevallig toch uren van ze in de periode staan.
      const collegas = magAlles
        ? (await db.q(`SELECT id,naam,email,actief FROM users
             WHERE (actief=1 AND COALESCE(via,'lokaal')<>'sso')
                OR id IN (SELECT DISTINCT user_id FROM hours WHERE datum BETWEEN ? AND ?)
             ORDER BY actief DESC, naam COLLATE NOCASE`, [van, tot]))
        : [{ id: ik.id, naam: ik.naam, email: ik.email, actief: 1 }];
      // De klussen waarvoor je in deze week bent ingepland: daarmee vult een
      // urenregel zich in één klik, inclusief klant en tijden.
      const klussen = await db.q(
        `SELECT s.id, s.datum, s.van, s.tot, s.titel, s.lead_id, s.klant, s.adres, l.naam AS lead_naam
         FROM shifts s LEFT JOIN leads l ON l.id=s.lead_id
         WHERE s.datum BETWEEN ? AND ? AND s.user_id=? ORDER BY s.datum, s.van`, [van, tot, wieId]);
      return res.status(200).json({
        ok: true, van, tot, uren: rows.map(publiek), collegas, klussen,
        ik: { id: ik.id, naam: ik.naam }, magAlles, soorten: SOORTEN,
      });
    }

    // ── Nieuwe regel ───────────────────────────────────────────────────────
    if (req.method === 'POST') {
      const b = await db.readBody(req);
      const voorId = b.user_id && +b.user_id !== ik.id ? +b.user_id : ik.id;
      if (voorId !== ik.id && !magAlles) return res.status(403).json({ ok: false, error: 'Je kunt alleen je eigen uren invullen.' });
      if (voorId === ik.id && !magEigen && !magAlles) return res.status(403).json({ ok: false, error: 'Je mag geen uren invullen.' });

      const uren = berekenUren(b);
      const fout = valideer(b, uren);
      if (fout) return res.status(400).json({ ok: false, error: fout });
      const datum = String(b.datum).slice(0, 10);

      // Al goedgekeurde weken staan op slot.
      const week = db.isoWeek(datum);
      const slot = await db.q("SELECT COUNT(*) AS n FROM hours WHERE user_id=? AND week=? AND status IN ('ingediend','akkoord')", [voorId, week]);
      if ((Number(slot[0] && slot[0].n) || 0) > 0 && !magAlles) {
        return res.status(409).json({ ok: false, error: 'Deze week is al ingediend. Vraag je beheerder om hem te heropenen.' });
      }

      const now = new Date().toISOString();
      await db.exec(`INSERT INTO hours(user_id,datum,week,start,eind,pauze,uren,soort,lead_id,project,omschrijving,shift_id,status,created,updated)
        VALUES(?,?,?,?,?,?,?,?,?,?,?,?,'concept',?,?)`,
        [voorId, datum, week, String(b.start || '').slice(0, 5) || null, String(b.eind || '').slice(0, 5) || null,
          Math.max(0, +b.pauze || 0), uren, SOORTEN.includes(b.soort) ? b.soort : 'werk',
          b.lead_id ? +b.lead_id : null, String(b.project || '').slice(0, 160) || null,
          String(b.omschrijving || '').slice(0, 500) || null, b.shift_id ? +b.shift_id : null, now, now]);
      return res.status(200).json({ ok: true });
    }

    // ── Wijzigen, indienen, beoordelen ─────────────────────────────────────
    if (req.method === 'PATCH') {
      const b = await db.readBody(req);
      const now = new Date().toISOString();

      if (b.action === 'indienen') {
        const voorId = b.user_id && +b.user_id !== ik.id ? +b.user_id : ik.id;
        if (voorId !== ik.id && !magAlles) return res.status(403).json({ ok: false, error: 'Geen toegang.' });
        const p = periode(b);
        if (p.fout) return res.status(400).json({ ok: false, error: p.fout });
        const n = await db.exec(`UPDATE hours SET status='ingediend', updated=?
          WHERE user_id=? AND datum BETWEEN ? AND ? AND status IN ('concept','afgekeurd')`,
          [now, voorId, p.van, p.tot]);
        if (!n.rowsAffected) return res.status(400).json({ ok: false, error: 'Er zijn geen uren om in te dienen in deze periode.' });
        return res.status(200).json({ ok: true, aantal: n.rowsAffected });
      }

      if (b.action === 'beoordelen' || b.action === 'heropenen') {
        if (!magAlles) return res.status(403).json({ ok: false, error: 'Je mag uren niet goedkeuren.' });
        const voorId = +b.user_id || 0;
        const p = periode(b);
        if (!voorId) return res.status(400).json({ ok: false, error: 'Kies een medewerker.' });
        if (p.fout) return res.status(400).json({ ok: false, error: p.fout });
        const status = b.action === 'heropenen' ? 'concept' : (b.status === 'afgekeurd' ? 'afgekeurd' : 'akkoord');
        await db.exec(`UPDATE hours SET status=?, beoordeeld_door=?, beoordeeld_op=?, beoordeling_note=?, updated=?
          WHERE user_id=? AND datum BETWEEN ? AND ?`,
          [status, ik.id, status === 'concept' ? null : now, String(b.note || '').slice(0, 300) || null, now, voorId, p.van, p.tot]);
        return res.status(200).json({ ok: true, status, van: p.van, tot: p.tot });
      }

      // Losse regel bijwerken.
      const id = +b.id || 0;
      const r = (await db.q('SELECT * FROM hours WHERE id=?', [id]))[0];
      if (!r) return res.status(404).json({ ok: false, error: 'Urenregel niet gevonden.' });
      if (r.user_id !== ik.id && !magAlles) return res.status(403).json({ ok: false, error: 'Dit zijn niet jouw uren.' });
      if (VERGRENDELD.includes(r.status) && !magAlles) {
        return res.status(409).json({ ok: false, error: 'Deze uren zijn al ingediend en kunnen niet meer gewijzigd worden.' });
      }

      const samen = { ...r, ...b };
      const uren = berekenUren(samen);
      const fout = valideer(samen, uren);
      if (fout) return res.status(400).json({ ok: false, error: fout });
      const datum = String(samen.datum).slice(0, 10);
      await db.exec(`UPDATE hours SET datum=?, week=?, start=?, eind=?, pauze=?, uren=?, soort=?, lead_id=?, project=?, omschrijving=?, updated=?
        WHERE id=?`,
        [datum, db.isoWeek(datum), String(samen.start || '').slice(0, 5) || null, String(samen.eind || '').slice(0, 5) || null,
          Math.max(0, +samen.pauze || 0), uren, SOORTEN.includes(samen.soort) ? samen.soort : 'werk',
          samen.lead_id ? +samen.lead_id : null, String(samen.project || '').slice(0, 160) || null,
          String(samen.omschrijving || '').slice(0, 500) || null, now, id]);
      return res.status(200).json({ ok: true });
    }

    // ── Verwijderen ────────────────────────────────────────────────────────
    if (req.method === 'DELETE') {
      const b = await db.readBody(req);
      const r = (await db.q('SELECT * FROM hours WHERE id=?', [+b.id || 0]))[0];
      if (!r) return res.status(404).json({ ok: false, error: 'Urenregel niet gevonden.' });
      if (r.user_id !== ik.id && !magAlles) return res.status(403).json({ ok: false, error: 'Dit zijn niet jouw uren.' });
      if (VERGRENDELD.includes(r.status) && !magAlles) {
        return res.status(409).json({ ok: false, error: 'Deze uren zijn al ingediend en kunnen niet meer verwijderd worden.' });
      }
      await db.exec('DELETE FROM hours WHERE id=?', [r.id]);
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ ok: false, error: 'method' });
  } catch (e) {
    return res.status(500).json({ ok: false, error: String(e.message || e).slice(0, 200) });
  }
}
