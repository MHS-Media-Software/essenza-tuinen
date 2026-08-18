// Onderdelen: een kop (bv. Bestrating) met een standaardtekst voor de klant en
// standaardregels eronder (zand, opsluitbanden, tegels…). In een offerte voeg je
// zo'n onderdeel in één klik toe en vul je alleen nog aantal en prijs in.
import * as db from './_db.js';

// Voorbeeld dat één keer wordt klaargezet, zodat meteen zichtbaar is hoe het werkt.
const VOORBEELD = [{
  naam: 'Bestrating',
  tekst: 'Het aanleggen van de bestrating, inclusief het uitgraven van de cunet, '
    + 'aanbrengen en verdichten van de fundering, het stellen van de opsluitbanden '
    + 'en het strak leggen en aftrillen van de bestrating. Inclusief afvoer van grond en puin.',
  regels: [
    { omschrijving: 'Uitgraven en afvoeren grond', eenheid: 'm2', aantal: 0, prijs: 0 },
    { omschrijving: 'Brekerszand fundering', eenheid: 'm2', aantal: 0, prijs: 0 },
    { omschrijving: 'Straatzand', eenheid: 'm2', aantal: 0, prijs: 0 },
    { omschrijving: 'Opsluitbanden incl. stellen', eenheid: 'm', aantal: 0, prijs: 0 },
    { omschrijving: 'Tegels / klinkers', eenheid: 'm2', aantal: 0, prijs: 0 },
    { omschrijving: 'Arbeid straatwerk', eenheid: 'uur', aantal: 0, prijs: 0 },
  ],
}];

const schoonRegels = (lijst) => (Array.isArray(lijst) ? lijst : []).slice(0, 60).map(r => ({
  omschrijving: String(r.omschrijving || '').slice(0, 200),
  eenheid: String(r.eenheid || '').slice(0, 12),
  aantal: +String(r.aantal || 0).replace(',', '.') || 0,
  prijs: +String(r.prijs || 0).replace(',', '.') || 0,
  btw: r.btw != null && r.btw !== '' ? +r.btw : null,
}));

const publiek = (r) => { let regels = []; try { regels = JSON.parse(r.regels || '[]'); } catch {} return { ...r, regels }; };

export default async function handler(req, res) {
  try {
    await db.ensureSchema();
    if (!(await db.requirePerm(req, res, 'offertes'))) return;

    if (req.method === 'GET') {
      let rows = await db.q('SELECT * FROM onderdelen ORDER BY sort, naam COLLATE NOCASE');
      // Eerste keer: één voorbeeldonderdeel klaarzetten.
      if (!rows.length) {
        const now = new Date().toISOString();
        for (const v of VOORBEELD) {
          await db.exec('INSERT INTO onderdelen(naam,tekst,regels,sort,created) VALUES(?,?,?,0,?)',
            [v.naam, v.tekst, JSON.stringify(v.regels), now]);
        }
        rows = await db.q('SELECT * FROM onderdelen ORDER BY sort, naam COLLATE NOCASE');
      }
      return res.status(200).json({ ok: true, onderdelen: rows.map(publiek) });
    }

    if (req.method === 'POST' || req.method === 'PUT') {
      const b = await db.readBody(req);
      const naam = String(b.naam || '').trim().slice(0, 120);
      if (!naam) return res.status(400).json({ ok: false, error: 'Geef het onderdeel een naam.' });
      const velden = [naam, String(b.tekst || '').slice(0, 2000), JSON.stringify(schoonRegels(b.regels)), +b.sort || 0];
      if (b.id) {
        await db.exec('UPDATE onderdelen SET naam=?, tekst=?, regels=?, sort=? WHERE id=?', [...velden, +b.id]);
        return res.status(200).json({ ok: true, id: +b.id });
      }
      const r = await db.exec('INSERT INTO onderdelen(naam,tekst,regels,sort,created) VALUES(?,?,?,?,?)',
        [...velden, new Date().toISOString()]);
      return res.status(200).json({ ok: true, id: r.lastInsertRowid });
    }

    if (req.method === 'DELETE') {
      const b = await db.readBody(req);
      await db.exec('DELETE FROM onderdelen WHERE id=?', [+b.id || 0]);
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ ok: false, error: 'method' });
  } catch (e) {
    return res.status(500).json({ ok: false, error: String(e.message || e).slice(0, 200) });
  }
}
