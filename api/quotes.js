// Offertes. Admin: GET (lijst / ?id=detail), POST (aanmaken), PATCH (bewerken/status), DELETE.
// Publiek (klantlink): PATCH {token, action:'accept'|'reject'} om te reageren.
import * as db from './_db.js';
import { computeTotals } from './_doc.js';
import crypto from 'node:crypto';

const YEAR = () => new Date().getFullYear();
const pad4 = (n) => String(n).padStart(4, '0');

function parseRow(r) { let regels = []; try { regels = JSON.parse(r.regels) || []; } catch {} return { ...r, regels }; }

export default async function handler(req, res) {
  try {
    await db.ensureSchema();

    // ── Publieke reactie van de klant (accepteren/afwijzen) ──
    if (req.method === 'PATCH') {
      const b = await db.readBody(req);
      if (b.token && b.action && !b.id) {
        const rows = await db.q('SELECT * FROM quotes WHERE token=?', [String(b.token)]);
        if (!rows.length) return res.status(404).json({ ok: false, error: 'Offerte niet gevonden.' });
        const qte = rows[0];
        if (!['concept', 'verzonden'].includes(qte.status)) return res.status(409).json({ ok: false, error: 'Deze offerte is al afgerond.' });
        const status = b.action === 'accept' ? 'geaccepteerd' : 'afgewezen';
        await db.exec('UPDATE quotes SET status=?, updated=? WHERE id=?', [status, new Date().toISOString(), qte.id]);
        if (qte.lead_id) await db.exec('UPDATE leads SET status=? WHERE id=?', [b.action === 'accept' ? 'gewonnen' : 'verloren', qte.lead_id]).catch(() => {});
        return res.status(200).json({ ok: true });
      }
      if (!db.requireAdmin(req, res)) return;
      const id = +b.id; if (!id) return res.status(400).json({ ok: false, error: 'id' });
      const cur = (await db.q('SELECT * FROM quotes WHERE id=?', [id]))[0];
      if (!cur) return res.status(404).json({ ok: false, error: 'niet gevonden' });
      const sets = [], args = [];
      const put = (col, val) => { sets.push(`${col}=?`); args.push(val); };
      if (b.klant_naam != null) put('klant_naam', String(b.klant_naam));
      if (b.klant_email != null) put('klant_email', String(b.klant_email));
      if (b.klant_adres != null) put('klant_adres', String(b.klant_adres));
      if (b.tier != null) put('tier', String(b.tier));
      if (b.geldig_tot != null) put('geldig_tot', String(b.geldig_tot));
      if (b.note != null) put('note', String(b.note));
      if (b.status != null) put('status', String(b.status));
      if (b.regels != null || b.btw_pct != null) {
        const regels = b.regels != null ? b.regels : JSON.parse(cur.regels || '[]');
        const pct = b.btw_pct != null ? +b.btw_pct : cur.btw_pct;
        const t = computeTotals(regels, pct);
        put('regels', JSON.stringify(regels)); put('btw_pct', pct);
        put('subtotaal', t.subtotaal); put('btw', t.btw); put('totaal', t.totaal);
      }
      if (!sets.length) return res.status(400).json({ ok: false, error: 'niets te wijzigen' });
      put('updated', new Date().toISOString());
      args.push(id);
      await db.exec(`UPDATE quotes SET ${sets.join(',')} WHERE id=?`, args);
      return res.status(200).json({ ok: true });
    }

    if (!db.requireAdmin(req, res)) return;

    if (req.method === 'GET') {
      if (req.query && req.query.id) {
        const rows = await db.q('SELECT * FROM quotes WHERE id=?', [+req.query.id]);
        if (!rows.length) return res.status(404).json({ ok: false, error: 'niet gevonden' });
        return res.status(200).json({ ok: true, quote: parseRow(rows[0]) });
      }
      const rows = await db.q('SELECT id,nummer,token,lead_id,klant_naam,klant_email,datum,geldig_tot,tier,btw_pct,subtotaal,btw,totaal,status,created FROM quotes ORDER BY id DESC LIMIT 500', []);
      return res.status(200).json({ ok: true, quotes: rows });
    }

    if (req.method === 'POST') {
      const b = await db.readBody(req);
      const regels = Array.isArray(b.regels) ? b.regels : [];
      const pct = b.btw_pct != null ? +b.btw_pct : 21;
      const t = computeTotals(regels, pct);
      const now = new Date();
      const geldigDagen = b.geldig_dagen != null ? +b.geldig_dagen : 30;
      const geldigTot = b.geldig_tot ? new Date(b.geldig_tot).toISOString() : new Date(now.getTime() + geldigDagen * 864e5).toISOString();
      const seq = await db.nextSeq(`quote_seq_${YEAR()}`);
      const nummer = `OFF-${YEAR()}-${pad4(seq)}`;
      const token = crypto.randomBytes(9).toString('hex');
      const r = await db.exec(
        `INSERT INTO quotes(nummer,token,lead_id,klant_naam,klant_email,klant_adres,datum,geldig_tot,tier,regels,btw_pct,subtotaal,btw,totaal,status,note,created,updated)
         VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?, 'concept', ?,?,?)`,
        [nummer, token, b.lead_id || null, b.klant_naam || '', b.klant_email || '', b.klant_adres || '',
         now.toISOString(), geldigTot, b.tier || '', JSON.stringify(regels), pct, t.subtotaal, t.btw, t.totaal,
         b.note || '', now.toISOString(), now.toISOString()]);
      if (b.lead_id) await db.exec("UPDATE leads SET status='offerte' WHERE id=? AND status IN('nieuw','contact')", [+b.lead_id]).catch(() => {});
      return res.status(200).json({ ok: true, id: r.lastInsertRowid, nummer, token });
    }

    if (req.method === 'DELETE') {
      const id = +((await db.readBody(req)).id || (req.query && req.query.id)); if (!id) return res.status(400).json({ ok: false, error: 'id' });
      await db.exec('DELETE FROM quotes WHERE id=?', [id]);
      return res.status(200).json({ ok: true });
    }
    return res.status(405).json({ ok: false, error: 'method' });
  } catch (e) {
    return res.status(500).json({ ok: false, error: String(e.message || e).slice(0, 200) });
  }
}
