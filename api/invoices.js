// Facturen. Admin: GET (lijst / ?id=detail), POST (aanmaken, evt. uit een offerte), PATCH (bewerken/betaald), DELETE.
import * as db from './_db.js';
import { computeTotals } from './_doc.js';
import crypto from 'node:crypto';

const YEAR = () => new Date().getFullYear();
const pad4 = (n) => String(n).padStart(4, '0');
function parseRow(r) { let regels = []; try { regels = JSON.parse(r.regels) || []; } catch {} return { ...r, regels }; }

export default async function handler(req, res) {
  try {
    await db.ensureSchema();
    if (!db.requireAdmin(req, res)) return;

    if (req.method === 'GET') {
      if (req.query && req.query.id) {
        const rows = await db.q('SELECT * FROM invoices WHERE id=?', [+req.query.id]);
        if (!rows.length) return res.status(404).json({ ok: false, error: 'niet gevonden' });
        return res.status(200).json({ ok: true, invoice: parseRow(rows[0]) });
      }
      const rows = await db.q('SELECT id,nummer,token,quote_id,lead_id,klant_naam,klant_email,datum,vervaldatum,btw_pct,subtotaal,btw,totaal,status,betaald_op,created FROM invoices ORDER BY id DESC LIMIT 500', []);
      return res.status(200).json({ ok: true, invoices: rows });
    }

    if (req.method === 'POST') {
      const b = await db.readBody(req);
      let base = { klant_naam: b.klant_naam || '', klant_email: b.klant_email || '', klant_adres: b.klant_adres || '', regels: Array.isArray(b.regels) ? b.regels : [], btw_pct: b.btw_pct != null ? +b.btw_pct : 21, quote_id: null, lead_id: b.lead_id || null, note: b.note || '' };
      if (b.quote_id) {
        const q = (await db.q('SELECT * FROM quotes WHERE id=?', [+b.quote_id]))[0];
        if (!q) return res.status(404).json({ ok: false, error: 'offerte niet gevonden' });
        let regels = []; try { regels = JSON.parse(q.regels) || []; } catch {}
        base = { klant_naam: q.klant_naam, klant_email: q.klant_email, klant_adres: q.klant_adres, regels, btw_pct: q.btw_pct, quote_id: q.id, lead_id: q.lead_id, note: b.note || q.note || '' };
      }
      const t = computeTotals(base.regels, base.btw_pct);
      const now = new Date();
      const termijn = b.betaal_dagen != null ? +b.betaal_dagen : 14;
      const vervaldatum = b.vervaldatum ? new Date(b.vervaldatum).toISOString() : new Date(now.getTime() + termijn * 864e5).toISOString();
      const seq = await db.nextSeq(`invoice_seq_${YEAR()}`);
      const nummer = `FAC-${YEAR()}-${pad4(seq)}`;
      const token = crypto.randomBytes(9).toString('hex');
      const r = await db.exec(
        `INSERT INTO invoices(nummer,token,quote_id,lead_id,klant_naam,klant_email,klant_adres,datum,vervaldatum,regels,btw_pct,subtotaal,btw,totaal,status,note,created)
         VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?, 'open', ?,?)`,
        [nummer, token, base.quote_id, base.lead_id, base.klant_naam, base.klant_email, base.klant_adres,
         now.toISOString(), vervaldatum, JSON.stringify(base.regels), base.btw_pct, t.subtotaal, t.btw, t.totaal, base.note, now.toISOString()]);
      return res.status(200).json({ ok: true, id: r.lastInsertRowid, nummer, token });
    }

    if (req.method === 'PATCH') {
      const b = await db.readBody(req);
      const id = +b.id; if (!id) return res.status(400).json({ ok: false, error: 'id' });
      const cur = (await db.q('SELECT * FROM invoices WHERE id=?', [id]))[0];
      if (!cur) return res.status(404).json({ ok: false, error: 'niet gevonden' });
      const sets = [], args = [];
      const put = (col, val) => { sets.push(`${col}=?`); args.push(val); };
      if (b.klant_naam != null) put('klant_naam', String(b.klant_naam));
      if (b.klant_email != null) put('klant_email', String(b.klant_email));
      if (b.klant_adres != null) put('klant_adres', String(b.klant_adres));
      if (b.vervaldatum != null) put('vervaldatum', String(b.vervaldatum));
      if (b.note != null) put('note', String(b.note));
      if (b.status != null) { put('status', String(b.status)); put('betaald_op', b.status === 'betaald' ? new Date().toISOString() : null); }
      if (b.regels != null || b.btw_pct != null) {
        const regels = b.regels != null ? b.regels : JSON.parse(cur.regels || '[]');
        const pct = b.btw_pct != null ? +b.btw_pct : cur.btw_pct;
        const t = computeTotals(regels, pct);
        put('regels', JSON.stringify(regels)); put('btw_pct', pct);
        put('subtotaal', t.subtotaal); put('btw', t.btw); put('totaal', t.totaal);
      }
      if (!sets.length) return res.status(400).json({ ok: false, error: 'niets te wijzigen' });
      args.push(id);
      await db.exec(`UPDATE invoices SET ${sets.join(',')} WHERE id=?`, args);
      return res.status(200).json({ ok: true });
    }

    if (req.method === 'DELETE') {
      const id = +((await db.readBody(req)).id || (req.query && req.query.id)); if (!id) return res.status(400).json({ ok: false, error: 'id' });
      await db.exec('DELETE FROM invoices WHERE id=?', [id]);
      return res.status(200).json({ ok: true });
    }
    return res.status(405).json({ ok: false, error: 'method' });
  } catch (e) {
    return res.status(500).json({ ok: false, error: String(e.message || e).slice(0, 200) });
  }
}
