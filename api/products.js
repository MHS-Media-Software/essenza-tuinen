// Producten / materialen per categorie. Prijs per eenheid = inkoop + uren * uurtarief.
// GET (publiek: actieve producten; ?all=1 admin: incl. inactief)
// POST/PUT/DELETE: admin. Bij lege tabel wordt een set voorbeeldmaterialen geseed.
import * as db from './_db.js';

const CATS = ['tuinontwerp', 'tuinaanleg', 'terras', 'gazon', 'border', 'houtbouw', 'vlonder', 'schutting', 'pergola', 'watermanagement', 'vijver', 'zwembad', 'tuinonderhoud', 'boomverzorging', 'boom', 'tuinhuis'];

const SEED = [
  { categorie: 'terras', naam: 'Betontegel 60x60 grijs', inkoop: 28, uren: 0.9, eenheid: 'm2' },
  { categorie: 'terras', naam: 'Keramische tegel 60x60', inkoop: 55, uren: 1.1, eenheid: 'm2' },
  { categorie: 'terras', naam: 'Keramiek 90x90 natuurlook', inkoop: 78, uren: 1.3, eenheid: 'm2' },
  { categorie: 'terras', naam: 'Gebakken waalformaat klinker', inkoop: 42, uren: 1.4, eenheid: 'm2' },
  { categorie: 'gazon', naam: 'Graszoden (kant-en-klaar)', inkoop: 8, uren: 0.3, eenheid: 'm2' },
  { categorie: 'gazon', naam: 'Kunstgras premium', inkoop: 32, uren: 0.6, eenheid: 'm2' },
  { categorie: 'border', naam: 'Vaste planten borderpakket', inkoop: 35, uren: 0.8, eenheid: 'm2' },
  { categorie: 'border', naam: 'Sierheesters + bodembedekkers', inkoop: 28, uren: 0.7, eenheid: 'm2' },
  { categorie: 'vlonder', naam: 'Hardhout vlonderplank (bankirai)', inkoop: 95, uren: 1.6, eenheid: 'm2' },
  { categorie: 'vlonder', naam: 'Composiet vlonderplank', inkoop: 78, uren: 1.2, eenheid: 'm2' },
  { categorie: 'schutting', naam: 'Hardhouten schutting geschaafd', inkoop: 60, uren: 1.0, eenheid: 'm' },
  { categorie: 'schutting', naam: 'Douglas plankenscherm', inkoop: 45, uren: 0.9, eenheid: 'm' },
  { categorie: 'pergola', naam: 'Hardhouten pergola op maat', inkoop: 120, uren: 1.4, eenheid: 'm2' },
  { categorie: 'vijver', naam: 'Vijver met folie + rand', inkoop: 90, uren: 2.2, eenheid: 'm2' },
  { categorie: 'zwembad', naam: 'Inbouw zwembad (polypropyleen)', inkoop: 520, uren: 4.0, eenheid: 'm2' },
  { categorie: 'boom', naam: 'Meerstammige sierboom', inkoop: 180, uren: 1.5, eenheid: 'stuk' },
  { categorie: 'tuinhuis', naam: 'Tuinhuis / berging hardhout', inkoop: 380, uren: 3.0, eenheid: 'm2' },
];

async function seedIfEmpty() {
  const rows = await db.q('SELECT COUNT(*) AS n FROM products', []);
  if (rows[0] && rows[0].n > 0) return;
  const now = new Date().toISOString();
  const stmts = SEED.map((p, i) => ({
    sql: 'INSERT INTO products(categorie,naam,foto,inkoop,uren,eenheid,actief,sort,created) VALUES(?,?,?,?,?,?,1,?,?)',
    args: [p.categorie, p.naam, null, p.inkoop, p.uren, p.eenheid, i, now],
  }));
  if (stmts.length) await db.run(stmts);
}

function withPrijs(p, uurtarief) {
  const prijs = Math.round(((p.inkoop || 0) + (p.uren || 0) * uurtarief) * 100) / 100;
  return { ...p, actief: !!p.actief, btw: p.btw != null ? p.btw : 21, prijs };
}

export default async function handler(req, res) {
  try {
    await db.ensureSchema();
    const uurtarief = Number(await db.getSetting('uurtarief', 55)) || 55;

    if (req.method === 'GET') {
      await seedIfEmpty();
      const all = req.query && (req.query.all === '1' || req.query.all === 'true');
      if (all && !db.isAdmin(req)) return res.status(401).json({ ok: false, error: 'auth' });
      const sql = all
        ? 'SELECT * FROM products ORDER BY categorie, sort, id'
        : 'SELECT * FROM products WHERE actief=1 ORDER BY categorie, sort, id';
      const rows = await db.q(sql, []);
      return res.status(200).json({ ok: true, uurtarief, categorien: CATS, products: rows.map(r => withPrijs(r, uurtarief)) });
    }

    if (!db.requireAdmin(req, res)) return;
    const body = await db.readBody(req);

    if (req.method === 'POST') {
      if (!body.naam || !body.categorie) return res.status(400).json({ ok: false, error: 'naam en categorie verplicht' });
      const now = new Date().toISOString();
      const r = await db.exec(
        'INSERT INTO products(categorie,naam,foto,inkoop,uren,eenheid,btw,actief,sort,created) VALUES(?,?,?,?,?,?,?,?,?,?)',
        [body.categorie, body.naam, body.foto || null, +body.inkoop || 0, +body.uren || 0, body.eenheid || 'm2',
         body.btw != null ? +body.btw : 21, body.actief === false ? 0 : 1, +body.sort || 0, now]);
      return res.status(200).json({ ok: true, id: r.lastInsertRowid });
    }
    if (req.method === 'PUT') {
      const id = +body.id; if (!id) return res.status(400).json({ ok: false, error: 'id' });
      await db.exec(
        'UPDATE products SET categorie=?,naam=?,foto=?,inkoop=?,uren=?,eenheid=?,btw=?,actief=?,sort=? WHERE id=?',
        [body.categorie, body.naam, body.foto || null, +body.inkoop || 0, +body.uren || 0, body.eenheid || 'm2',
         body.btw != null ? +body.btw : 21, body.actief === false ? 0 : 1, +body.sort || 0, id]);
      return res.status(200).json({ ok: true });
    }
    if (req.method === 'DELETE') {
      const id = +(body.id || (req.query && req.query.id)); if (!id) return res.status(400).json({ ok: false, error: 'id' });
      await db.exec('DELETE FROM products WHERE id=?', [id]);
      return res.status(200).json({ ok: true });
    }
    return res.status(405).json({ ok: false, error: 'method' });
  } catch (e) {
    return res.status(500).json({ ok: false, error: String(e.message || e).slice(0, 200) });
  }
};
