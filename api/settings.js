// Instellingen: uurtarief + bedrijfsgegevens (voor offertes/facturen). GET admin, PUT admin.
import * as db from './_db.js';
import { DEFAULT_BEDRIJF } from './_doc.js';

export default async function handler(req, res) {
  try {
    await db.ensureSchema();
    if (!db.requireAdmin(req, res)) return;
    if (req.method === 'GET') {
      const saved = await db.getSetting('bedrijf', {});
      const bedrijf = { ...DEFAULT_BEDRIJF, ...(saved && typeof saved === 'object' ? saved : {}) };
      return res.status(200).json({
        ok: true,
        uurtarief: Number(await db.getSetting('uurtarief', 55)) || 55,
        bedrijf,
        mailProvider: process.env.SMTP_HOST ? 'smtp' : (process.env.RESEND_API_KEY ? 'resend' : null),
      });
    }
    if (req.method === 'PUT') {
      const b = await db.readBody(req);
      if (b.uurtarief != null) await db.setSetting('uurtarief', Math.max(0, +b.uurtarief || 0));
      if (b.bedrijf && typeof b.bedrijf === 'object') {
        const keep = {};
        for (const k of Object.keys(DEFAULT_BEDRIJF)) keep[k] = String(b.bedrijf[k] == null ? '' : b.bedrijf[k]).slice(0, 200);
        await db.setSetting('bedrijf', keep);
      }
      return res.status(200).json({ ok: true });
    }
    return res.status(405).json({ ok: false, error: 'method' });
  } catch (e) {
    return res.status(500).json({ ok: false, error: String(e.message || e).slice(0, 200) });
  }
};
