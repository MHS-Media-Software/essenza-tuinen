// Aanvragen/leads. POST publiek (configurator + contactformulier). GET/PATCH admin.
import * as db from './_db.js';

const STAGES = ['nieuw', 'contact', 'offerte', 'ingepland', 'gewonnen', 'verloren'];

export default async function handler(req, res) {
  try {
    await db.ensureSchema();

    if (req.method === 'POST') {
      const b = await db.readBody(req);

      // Handmatig een relatie toevoegen vanuit het beheer (bestaande klanten die
      // nooit via een formulier binnen zijn gekomen).
      if (b.action === 'nieuw') {
        if (!(await db.requirePerm(req, res, 'leads'))) return;
        const naam = String(b.naam || '').trim();
        if (!naam) return res.status(400).json({ ok: false, error: 'Vul een naam in.' });
        const r = await db.exec(
          `INSERT INTO leads(created,naam,email,telefoon,bron,plaats,adres,status,note)
           VALUES(?,?,?,?,'handmatig',?,?,?,?)`,
          [new Date().toISOString(), naam.slice(0, 160), String(b.email || '').trim().slice(0, 160),
            String(b.telefoon || '').trim().slice(0, 40), String(b.plaats || '').trim().slice(0, 120),
            String(b.adres || '').trim().slice(0, 200), STAGES.includes(b.status) ? b.status : 'contact',
            String(b.note || '').slice(0, 1000)]);
        return res.status(200).json({ ok: true, id: r.lastInsertRowid });
      }

      // honeypot
      if (b.hp_url) return res.status(200).json({ ok: true, id: 0 });
      const now = new Date().toISOString();
      const ontwerp = b.ontwerp ? (typeof b.ontwerp === 'string' ? b.ontwerp : JSON.stringify(b.ontwerp)) : null;
      const r = await db.exec(
        `INSERT INTO leads(created,naam,email,telefoon,bron,plaats,tuin_w,tuin_d,tier,ontwerp,richtprijs,status,note)
         VALUES(?,?,?,?,?,?,?,?,?,?,?, 'nieuw', ?)`,
        [now, b.naam || '', b.email || '', b.telefoon || '', b.bron || 'website', b.plaats || '',
         b.tuin_w != null ? +b.tuin_w : null, b.tuin_d != null ? +b.tuin_d : null, b.tier || '',
         ontwerp, b.richtprijs != null ? +b.richtprijs : null, b.note || b.bericht || '']);
      return res.status(200).json({ ok: true, id: r.lastInsertRowid });
    }

    if (!(await db.requirePerm(req, res, 'leads'))) return;

    if (req.method === 'GET') {
      const qy = req.query || {};

      // ── Eén relatie met alles wat eraan hangt ─────────────────────────────
      // Offertes, facturen, geplande klussen en gemaakte uren in één antwoord,
      // zodat het relatiescherm niet vijf keer hoeft te vragen.
      if (qy.id) {
        const id = +qy.id || 0;
        const lead = (await db.q('SELECT * FROM leads WHERE id=?', [id]))[0];
        if (!lead) return res.status(404).json({ ok: false, error: 'Relatie niet gevonden.' });
        try { lead.ontwerp = lead.ontwerp ? JSON.parse(lead.ontwerp) : null; } catch { lead.ontwerp = null; }
        const [quotes, invoices, klussen, uren] = await Promise.all([
          db.q('SELECT id,nummer,datum,geldig_tot,totaal,status,token FROM quotes WHERE lead_id=? ORDER BY id DESC', [id]).catch(() => []),
          db.q('SELECT id,nummer,datum,vervaldatum,totaal,status,token FROM invoices WHERE lead_id=? ORDER BY id DESC', [id]).catch(() => []),
          db.q(`SELECT s.id,s.datum,s.van,s.tot,s.titel,s.adres,s.soort,s.groep,u.naam AS medewerker
                FROM shifts s LEFT JOIN users u ON u.id=s.user_id
                WHERE s.lead_id=? ORDER BY s.datum DESC, s.van`, [id]).catch(() => []),
          db.q(`SELECT h.datum, h.uren, h.reistijd, h.omschrijving, u.naam AS medewerker
                FROM hours h LEFT JOIN users u ON u.id=h.user_id
                WHERE h.lead_id=? ORDER BY h.datum DESC LIMIT 200`, [id]).catch(() => []),
        ]);
        const urenTotaal = uren.reduce((s, r) => s + (+r.uren || 0), 0);
        const reisTotaal = uren.reduce((s, r) => s + (+r.reistijd || 0), 0);
        return res.status(200).json({ ok: true, lead, quotes, invoices, klussen, uren, urenTotaal, reisTotaal, stages: STAGES });
      }

      // ── Lijst, met zoeken op naam, plaats, e-mail of telefoon ─────────────
      const zoek = String(qy.zoek || '').trim().toLowerCase();
      const args = [], waar = [];
      if (zoek) {
        waar.push('(LOWER(naam) LIKE ? OR LOWER(plaats) LIKE ? OR LOWER(email) LIKE ? OR telefoon LIKE ?)');
        for (let i = 0; i < 4; i++) args.push('%' + zoek + '%');
      }
      if (qy.status && STAGES.includes(qy.status)) { waar.push('status=?'); args.push(qy.status); }
      const rows = await db.q(
        `SELECT * FROM leads ${waar.length ? 'WHERE ' + waar.join(' AND ') : ''} ORDER BY id DESC LIMIT 500`, args);
      const leads = rows.map(l => { let d = null; try { d = l.ontwerp ? JSON.parse(l.ontwerp) : null; } catch {} return { ...l, ontwerp: d }; });
      return res.status(200).json({ ok: true, stages: STAGES, leads });
    }
    if (req.method === 'PATCH') {
      const b = await db.readBody(req);
      const id = +b.id; if (!id) return res.status(400).json({ ok: false, error: 'id' });
      const sets = [], args = [];
      if (b.status != null) { sets.push('status=?'); args.push(String(b.status)); }
      if (b.note != null) { sets.push('note=?'); args.push(String(b.note)); }
      // Gegevens van de relatie bijwerken vanuit het relatiescherm.
      for (const [veld, max] of [['naam', 160], ['email', 160], ['telefoon', 40], ['plaats', 120], ['adres', 200]]) {
        if (b[veld] != null) { sets.push(`${veld}=?`); args.push(String(b[veld]).trim().slice(0, max)); }
      }
      if (!sets.length) return res.status(400).json({ ok: false, error: 'niets te wijzigen' });
      args.push(id);
      await db.exec(`UPDATE leads SET ${sets.join(',')} WHERE id=?`, args);
      return res.status(200).json({ ok: true });
    }
    if (req.method === 'DELETE') {
      const b = await db.readBody(req);
      const id = +(b.id || (req.query && req.query.id)); if (!id) return res.status(400).json({ ok: false, error: 'id' });
      await db.exec('DELETE FROM leads WHERE id=?', [id]);
      return res.status(200).json({ ok: true });
    }
    return res.status(405).json({ ok: false, error: 'method' });
  } catch (e) {
    return res.status(500).json({ ok: false, error: String(e.message || e).slice(0, 200) });
  }
};
