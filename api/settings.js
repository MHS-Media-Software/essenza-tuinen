// Instellingen (o.a. uurtarief voor de prijsberekening). GET admin, PUT admin.
import * as db from './_db.js';

export default async function handler(req, res) {
  try {
    await db.ensureSchema();
    if (!db.requireAdmin(req, res)) return;
    if (req.method === 'GET') {
      return res.status(200).json({ ok: true, uurtarief: Number(await db.getSetting('uurtarief', 55)) || 55 });
    }
    if (req.method === 'PUT') {
      const b = await db.readBody(req);
      if (b.uurtarief != null) await db.setSetting('uurtarief', Math.max(0, +b.uurtarief || 0));
      return res.status(200).json({ ok: true });
    }
    return res.status(405).json({ ok: false, error: 'method' });
  } catch (e) {
    return res.status(500).json({ ok: false, error: String(e.message || e).slice(0, 200) });
  }
};
