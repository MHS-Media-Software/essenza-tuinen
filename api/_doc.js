// Gedeelde helpers voor offertes & facturen: bedrijfsgegevens, bedragen en de
// (print-klare, gebrande) HTML-weergave die zowel de klantlink als de admin gebruikt.
import * as db from './_db.js';

const BRAND = '#0B9D46', DARK = '#1F2113', LINE = '#E6E8DC', MUTED = '#6B7060';

const DEFAULT_BEDRIJF = {
  naam: 'Essenza Tuinen', adres: '', postcode_plaats: '', regio: 'Zeeland & West-Brabant',
  kvk: '', btw: '', iban: '', email: '', telefoon: '', website: 'essenzatuinen.nl',
};

async function getBedrijf() {
  const saved = await db.getSetting('bedrijf', {});
  return { ...DEFAULT_BEDRIJF, ...(saved && typeof saved === 'object' ? saved : {}) };
}

function euro(n) { return '€ ' + (Math.round((+n || 0) * 100) / 100).toLocaleString('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
function dnl(iso) { if (!iso) return '—'; try { return new Date(iso).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' }); } catch { return iso; } }

// Bereken bedragen uit de regels ([{omschrijving,aantal,eenheid,prijs}]) + btw-percentage.
function computeTotals(regels, btwPct) {
  const rs = Array.isArray(regels) ? regels : [];
  const subtotaal = rs.reduce((s, r) => s + (+r.aantal || 0) * (+r.prijs || 0), 0);
  const pct = btwPct == null ? 21 : +btwPct;
  const btw = subtotaal * pct / 100;
  return { subtotaal: Math.round(subtotaal * 100) / 100, btw: Math.round(btw * 100) / 100, totaal: Math.round((subtotaal + btw) * 100) / 100 };
}

function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }

// Volledige, zelfstandige HTML-pagina voor een offerte of factuur.
function renderDocHTML({ kind, doc, bedrijf }) {
  const isQuote = kind === 'quote';
  const regels = (() => { try { return JSON.parse(doc.regels) || []; } catch { return []; } })();
  const totals = { subtotaal: doc.subtotaal, btw: doc.btw, totaal: doc.totaal };
  const titel = isQuote ? 'Offerte' : 'Factuur';
  const statusNL = {
    concept: 'Concept', verzonden: 'Verzonden', geaccepteerd: 'Geaccepteerd', afgewezen: 'Afgewezen',
    open: 'Openstaand', betaald: 'Betaald', verlopen: 'Verlopen',
  }[doc.status] || doc.status;
  const statusKleur = ['geaccepteerd', 'betaald'].includes(doc.status) ? BRAND
    : ['afgewezen', 'verlopen'].includes(doc.status) ? '#C0392B' : '#B8860B';
  const kanReageren = isQuote && (doc.status === 'verzonden' || doc.status === 'concept');

  const rijen = regels.map(r => {
    const rt = (+r.aantal || 0) * (+r.prijs || 0);
    const aant = (+r.aantal || 0);
    return `<tr>
      <td>${esc(r.omschrijving || '')}</td>
      <td class="num">${aant % 1 === 0 ? aant : aant.toFixed(1)} ${esc(r.eenheid || '')}</td>
      <td class="num">${euro(r.prijs)}</td>
      <td class="num">${euro(rt)}</td>
    </tr>`;
  }).join('');

  const b = bedrijf;
  const bedrijfRegels = [b.adres, b.postcode_plaats, b.telefoon, b.email].filter(Boolean).map(esc).join('<br>');
  const voetRegels = [b.kvk && `KvK ${esc(b.kvk)}`, b.btw && `BTW ${esc(b.btw)}`, b.iban && `IBAN ${esc(b.iban)}`].filter(Boolean).join(' &nbsp;·&nbsp; ');

  return `<!doctype html><html lang="nl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<title>${titel} ${esc(doc.nummer || '')} · ${esc(b.naam)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Poppins:wght@600;700&display=swap" rel="stylesheet">
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'Inter',sans-serif;color:${DARK};background:#EEF1E6;line-height:1.5;padding:24px 12px}
  .sheet{max-width:820px;margin:0 auto;background:#fff;border-radius:16px;box-shadow:0 8px 40px rgba(0,0,0,.08);overflow:hidden}
  .bar{height:8px;background:${BRAND}}
  .pad{padding:40px 44px}
  h1{font-family:'Poppins',sans-serif;font-size:1.9rem;font-weight:700}
  .muted{color:${MUTED}}
  .head{display:flex;justify-content:space-between;align-items:flex-start;gap:24px;flex-wrap:wrap}
  .brandname{font-family:'Poppins',sans-serif;font-weight:700;font-size:1.15rem;color:${DARK}}
  .badge{display:inline-block;padding:.28rem .8rem;border-radius:999px;font-size:.72rem;font-weight:700;color:#fff;background:${statusKleur}}
  .grid2{display:flex;justify-content:space-between;gap:24px;flex-wrap:wrap;margin:28px 0}
  .lbl{font-size:.68rem;font-weight:700;text-transform:uppercase;letter-spacing:.09em;color:${MUTED};margin-bottom:4px}
  table{width:100%;border-collapse:collapse;margin-top:8px}
  th{text-align:left;font-size:.68rem;text-transform:uppercase;letter-spacing:.07em;color:${MUTED};border-bottom:2px solid ${LINE};padding:8px 6px}
  td{padding:11px 6px;border-bottom:1px solid ${LINE};font-size:.92rem;vertical-align:top}
  th.num,td.num{text-align:right;white-space:nowrap}
  .totrow{display:flex;justify-content:flex-end;margin-top:14px}
  .totbox{width:min(320px,100%)}
  .totline{display:flex;justify-content:space-between;padding:6px 0;font-size:.92rem}
  .totline.grand{border-top:2px solid ${DARK};margin-top:6px;padding-top:12px;font-family:'Poppins',sans-serif;font-weight:700;font-size:1.15rem}
  .note{margin-top:26px;padding:16px 18px;background:#F5F7EE;border-radius:12px;font-size:.9rem}
  .foot{margin-top:30px;padding-top:18px;border-top:1px solid ${LINE};font-size:.78rem;color:${MUTED};text-align:center}
  .actions{position:sticky;bottom:0;background:#fff;border-top:1px solid ${LINE};padding:16px 44px;display:flex;gap:10px;justify-content:flex-end;flex-wrap:wrap}
  .btn{font-family:inherit;font-weight:700;font-size:.9rem;border-radius:10px;padding:.7rem 1.4rem;border:none;cursor:pointer}
  .btn-p{background:${BRAND};color:#fff}.btn-s{background:#fff;border:1px solid ${LINE};color:${DARK}}
  .btn-d{background:#fff;border:1px solid #f0c4c4;color:#C0392B}
  .intro{margin:20px 0 4px;font-size:.95rem}
  #msg{display:none;padding:14px 18px;border-radius:10px;background:#E4F2E8;color:${BRAND === '#0B9D46' ? '#087A37' : BRAND};font-weight:600;font-size:.9rem;margin-top:14px}
  @media print{body{background:#fff;padding:0}.sheet{box-shadow:none;border-radius:0;max-width:none}.actions{display:none}.bar{background:${BRAND}!important;-webkit-print-color-adjust:exact;print-color-adjust:exact}}
</style></head>
<body>
<div class="sheet">
  <div class="bar"></div>
  <div class="pad">
    <div class="head">
      <div>
        <div class="brandname">${esc(b.naam)}</div>
        <div class="muted" style="font-size:.85rem;margin-top:6px">${bedrijfRegels || esc(b.regio)}</div>
      </div>
      <div style="text-align:right">
        <h1>${titel}</h1>
        <div class="muted" style="margin-top:2px">${esc(doc.nummer || '')}</div>
        <div style="margin-top:8px"><span class="badge">${esc(statusNL)}</span></div>
      </div>
    </div>

    <div class="grid2">
      <div>
        <div class="lbl">${isQuote ? 'Offerte voor' : 'Factuur aan'}</div>
        <div style="font-weight:600">${esc(doc.klant_naam || '—')}</div>
        <div class="muted" style="font-size:.9rem;white-space:pre-line">${esc(doc.klant_adres || '')}</div>
        <div class="muted" style="font-size:.9rem">${esc(doc.klant_email || '')}</div>
      </div>
      <div style="text-align:right">
        <div class="lbl">Datum</div><div>${dnl(doc.datum)}</div>
        <div class="lbl" style="margin-top:10px">${isQuote ? 'Geldig tot' : 'Vervaldatum'}</div>
        <div>${dnl(isQuote ? doc.geldig_tot : doc.vervaldatum)}</div>
        ${isQuote && doc.tier ? `<div class="lbl" style="margin-top:10px">Niveau</div><div>${esc(doc.tier)}</div>` : ''}
      </div>
    </div>

    ${isQuote ? `<p class="intro">Hartelijk dank voor uw interesse in ${esc(b.naam)}. Hieronder vindt u onze vrijblijvende offerte op maat. Ontzorgd van A tot Z.</p>` : ''}

    <table>
      <thead><tr><th>Omschrijving</th><th class="num">Aantal</th><th class="num">Prijs</th><th class="num">Bedrag</th></tr></thead>
      <tbody>${rijen || '<tr><td colspan="4" class="muted">Geen regels.</td></tr>'}</tbody>
    </table>

    <div class="totrow"><div class="totbox">
      <div class="totline"><span class="muted">Subtotaal</span><span>${euro(totals.subtotaal)}</span></div>
      <div class="totline"><span class="muted">BTW ${doc.btw_pct != null ? doc.btw_pct : 21}%</span><span>${euro(totals.btw)}</span></div>
      <div class="totline grand"><span>Totaal</span><span>${euro(totals.totaal)}</span></div>
    </div></div>

    ${doc.note ? `<div class="note">${esc(doc.note)}</div>` : ''}
    ${!isQuote && b.iban ? `<div class="note">Wij verzoeken u vriendelijk het bedrag van <b>${euro(totals.totaal)}</b> binnen de betaaltermijn over te maken op <b>${esc(b.iban)}</b> t.n.v. ${esc(b.naam)} o.v.v. factuurnummer <b>${esc(doc.nummer || '')}</b>.</div>` : ''}

    <div id="msg"></div>

    <div class="foot">${esc(b.naam)}${b.website ? ' · ' + esc(b.website) : ''}${voetRegels ? '<br>' + voetRegels : ''}</div>
  </div>
  <div class="actions">
    <button class="btn btn-s" onclick="window.print()">Downloaden / printen (PDF)</button>
    ${kanReageren ? `<button class="btn btn-d" onclick="reageer('reject')">Afwijzen</button><button class="btn btn-p" onclick="reageer('accept')">Offerte accepteren</button>` : ''}
  </div>
</div>
<script>
  function reageer(action){
    if(action==='accept' && !confirm('Weet u zeker dat u deze offerte accepteert?')) return;
    fetch('/api/quotes',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({token:${JSON.stringify(doc.token || '')},action:action})})
      .then(r=>r.json()).then(d=>{
        var m=document.getElementById('msg');
        if(d&&d.ok){ m.style.display='block'; m.textContent = action==='accept' ? 'Bedankt! Uw akkoord is doorgegeven. Wij nemen spoedig contact met u op voor de planning.' : 'Uw reactie is doorgegeven. Bedankt voor uw terugkoppeling.'; document.querySelector('.actions').style.display='none'; }
        else { alert((d&&d.error)||'Er ging iets mis. Probeer het later opnieuw.'); }
      }).catch(function(){ alert('Er ging iets mis. Probeer het later opnieuw.'); });
  }
</script>
</body></html>`;
}

export { getBedrijf, DEFAULT_BEDRIJF, euro, computeTotals, renderDocHTML };
