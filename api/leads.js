// Aanvragen/leads. POST publiek (configurator + contactformulier). GET/PATCH admin.
import * as db from './_db.js';

const STAGES = ['nieuw', 'contact', 'offerte', 'ingepland', 'gewonnen', 'verloren'];

export default async function handler(req, res) {
  try {
    await db.ensureSchema();

    if (req.method === 'POST') {
      const b = await db.readBody(req);
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

    if (!db.requireAdmin(req, res)) return;

    if (req.method === 'GET') {
      const rows = await db.q('SELECT * FROM leads ORDER BY id DESC LIMIT 500', []);
      const leads = rows.map(l => { let d = null; try { d = l.ontwerp ? JSON.parse(l.ontwerp) : null; } catch {} return { ...l, ontwerp: d }; });
      return res.status(200).json({ ok: true, stages: STAGES, leads });
    }
    if (req.method === 'PATCH') {
      const b = await db.readBody(req);
      const id = +b.id; if (!id) return res.status(400).json({ ok: false, error: 'id' });
      const sets = [], args = [];
      if (b.status != null) { sets.push('status=?'); args.push(String(b.status)); }
      if (b.note != null) { sets.push('note=?'); args.push(String(b.note)); }
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
