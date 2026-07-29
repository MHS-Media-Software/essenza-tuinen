import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Check, X, ArrowRight, Download, ExternalLink, Globe, Sparkles, Loader2, PenLine, CreditCard, Info, Play, Images, ChevronLeft, ChevronRight, Navigation, Bookmark, Phone } from 'lucide-react';
import { MHS_LOGO } from './mhsLogo';
import { base44 } from '@/api/base44Client';
import { PORTFOLIO_FOTO, PORTFOLIO_FOTO_FLAT, PORTFOLIO_VIDEO } from '@/lib/mhsMedia';

// ============================================================================
// MHS Media — Voorstel (exacte reproductie van de "Voorstel — … × MHS Media"
// PDF's, in MHS Media's EIGEN huisstijl: navy #0A1324 + cyaan #12AAE2, Poppins
// koppen/body, Menlo-mono labels, Caveat handtekening. NIET de klantkleuren.
// Dynamisch: live concept-iframe op pagina 2. Print → PDF (print-CSS onderin).
// Props: { data } — zie GlobalFortisVoorstel.jsx voor het datamodel.
// ============================================================================

const NAVY   = '#0A1324';
const CARD    = '#151E2E';
const CYAN    = '#14A9E0';
const CYAN_D  = '#0E90C4';
const LIGHT   = '#F4F5FA';
const BLUEBOX = '#EAF6FB';
const WHITE   = '#FFFFFF';
const INK     = '#0A1324';
const BODY    = '#4B5563';
const MUTED   = '#8A93A3';
const LINE    = '#E4E7F0';
const LINE_D  = 'rgba(255,255,255,0.10)';
const FONT    = "'Poppins', sans-serif";
const MONO    = "'Menlo','SF Mono',ui-monospace,monospace";
const SCRIPT  = "'Caveat', cursive";
const MHS_COVER = '/mhs-voorstel-cover.jpg'; // vaste MHS cover-foto (Marjolein)

const euro = (n) => '€ ' + n.toLocaleString('nl-NL');

// mono label (uppercase, letter-spaced)
const Mono = ({ children, color = CYAN, className = '' }) => (
  <p className={className} style={{ fontFamily: MONO, color, fontSize: 11, fontWeight: 500, letterSpacing: '0.28em', textTransform: 'uppercase' }}>{children}</p>
);

const rise = {
  initial: { opacity: 0, y: 26 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, margin: '-60px' },
  transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
};

// Online ondertekenen: teken je handtekening + naam → mail naar Morris.
function Handtekening({ data, brand }) {
  const canvasRef = useRef(null);
  const drawing = useRef(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [naam, setNaam] = useState(data.clientSigner || '');
  const [status, setStatus] = useState('');

  const pos = (e) => {
    const c = canvasRef.current; const r = c.getBoundingClientRect();
    const t = e.touches ? e.touches[0] : e;
    return { x: (t.clientX - r.left) * (c.width / r.width), y: (t.clientY - r.top) * (c.height / r.height) };
  };
  const start = (e) => { e.preventDefault(); drawing.current = true; const ctx = canvasRef.current.getContext('2d'); const p = pos(e); ctx.beginPath(); ctx.moveTo(p.x, p.y); };
  const move = (e) => { if (!drawing.current) return; e.preventDefault(); const ctx = canvasRef.current.getContext('2d'); const p = pos(e); ctx.lineTo(p.x, p.y); ctx.strokeStyle = '#0A1324'; ctx.lineWidth = 2.5; ctx.lineCap = 'round'; ctx.stroke(); if (!hasDrawn) setHasDrawn(true); };
  const end = () => { drawing.current = false; };
  const clear = () => { const c = canvasRef.current; c.getContext('2d').clearRect(0, 0, c.width, c.height); setHasDrawn(false); };

  const onderteken = async () => {
    if (!naam.trim() || !hasDrawn || status === 'loading') return;
    setStatus('loading');
    try {
      let sigUrl = '';
      try {
        const dataUrl = canvasRef.current.toDataURL('image/png');
        const up = await fetch('/api/upload', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ filename: `handtekening-${brand.slug}.png`, dataUrl }) }).then((r) => r.json());
        sigUrl = up.url || '';
      } catch { /* handtekening-upload optioneel */ }
      const datum = new Date().toLocaleDateString('nl-NL');
      const voorstelUrl = brand.conceptPath ? `https://concepts.mhsmedia.nl${brand.conceptPath}/voorstel` : (brand.site || '');
      await base44.integrations.Core.SendEmail({
        to: 'morris@mhsmedia.nl',
        subject: `✅ Voorstel ONDERTEKEND — ${brand.volledig}`,
        body: `${naam} heeft het voorstel voor ${brand.volledig} online ondertekend.\n\nDatum: ${datum}\nVoorstel: ${voorstelUrl}\nHandtekening: ${sigUrl || '(niet opgeslagen)'}`,
      });
      setStatus('ok');
    } catch { setStatus('err'); }
  };

  if (status === 'ok') return (
    <div>
      <Mono color={MUTED} className="mb-4">Namens {brand.volledig}</Mono>
      <div className="flex items-center gap-3 rounded-2xl p-4" style={{ background: 'rgba(34,176,125,0.10)', border: '1px solid rgba(34,176,125,0.25)' }}>
        <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: '#22B07D' }}><Check className="w-5 h-5 text-white" /></div>
        <div><p className="font-semibold text-sm" style={{ color: INK }}>Voorstel ondertekend</p><p className="text-xs" style={{ color: BODY }}>Bedankt {naam.split(' ')[0]}! Morris neemt snel contact met u op.</p></div>
      </div>
    </div>
  );

  return (
    <div className="no-print">
      <Mono color={MUTED} className="mb-3">Onderteken online — namens {brand.volledig}</Mono>
      <input value={naam} onChange={(e) => setNaam(e.target.value)} placeholder="Uw naam" className="w-full text-sm rounded-xl px-4 py-2.5 mb-2 outline-none" style={{ border: `1px solid ${LINE}`, color: INK, background: '#fff' }} />
      <div className="relative rounded-xl overflow-hidden" style={{ border: `1px solid ${LINE}`, background: '#fff' }}>
        <canvas ref={canvasRef} width={460} height={130} style={{ width: '100%', height: 130, touchAction: 'none', cursor: 'crosshair', display: 'block' }}
          onMouseDown={start} onMouseMove={move} onMouseUp={end} onMouseLeave={end}
          onTouchStart={start} onTouchMove={move} onTouchEnd={end} />
        {!hasDrawn && <span className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ color: MUTED, fontFamily: SCRIPT, fontSize: '1.7rem', opacity: 0.5 }}>uw handtekening</span>}
        <button onClick={clear} className="absolute top-2 right-2 text-[11px] px-2 py-1 rounded-md" style={{ background: '#f2f4f8', color: MUTED }}>wissen</button>
      </div>
      <button onClick={onderteken} disabled={!naam.trim() || !hasDrawn || status === 'loading'}
        className="w-full mt-3 flex items-center justify-center gap-2 text-sm font-bold px-5 py-3.5 rounded-xl text-white transition-all hover:opacity-90 disabled:opacity-40" style={{ background: CYAN }}>
        {status === 'loading' ? <Loader2 className="w-4 h-4 animate-spin" /> : <PenLine className="w-4 h-4" />}
        {status === 'loading' ? 'Versturen…' : status === 'err' ? 'Mislukt — probeer opnieuw' : 'Voorstel ondertekenen'}
      </button>
      <p className="text-[11px] mt-2" style={{ color: MUTED }}>Datum: {data.datum || new Date().toLocaleDateString('nl-NL')}</p>
    </div>
  );
}

export default function VoorstelTemplate({ data }) {
  const b = data.brand;
  const p = data.pricing;

  // SEO-onderdeel (standaard in elk voorstel) — dienst × locatie pagina's, €235/mnd.
  // Defaults + per-concept overrides (data.seo mag alleen bv. `voorbeelden` zetten).
  const SEO_DEFAULTS = {
    prijs: 235,
    kop: 'Gevonden worden op elke dienst én in elke plaats',
    body: 'Naast de hoofdpagina\'s bouwen wij doorlopend extra SEO-pagina\'s die één specifieke (sub)dienst koppelen aan één plaats. Zo verschijnt u precies bij die gerichte zoekopdrachten waar de klant al klaar is om aan te vragen, en groeit uw lokale vindbaarheid maand na maand.',
    punten: [
      'Aparte pagina per subdienst, geschreven op de zoekvraag van de klant',
      'Locatiepagina\'s per plaats in uw werkgebied',
      'Combinatiepagina\'s (subdienst × plaats) voor de meest gerichte zoekopdrachten',
      'Elke maand nieuwe pagina\'s + interne links, zodat de autoriteit blijft groeien',
      'Elke maand een helder rapport: welke pagina\'s we maakten én het resultaat (posities, verkeer, aanvragen)',
    ],
    voorbeelden: ['Bedrijfsgevelrenovatie Groningen', 'Voegwerk renovatie Utrecht', 'Gevelreiniging Arnhem', 'Steigerverhuur Nijmegen'],
  };
  const seo = { ...SEO_DEFAULTS, ...(data.seo || {}) };

  // Backend & CRM — standaard met de echte Kittenvoegen/MHS-dashboard-screenshots, zodat
  // elk voorstel de complete backend laat zien. Per voorstel te overriden via backend.
  const BACKEND_DEFAULTS = {
    kop: 'Eén dashboard voor uw hele bedrijf',
    body: 'Achter uw website draait ons CMS + CRM: u past zelf teksten en foto\'s aan, ziet elke aanvraag als lead binnenkomen en volgt precies wat uw website oplevert — alles op één plek.',
    screenshots: [
      { src: '/backend-dashboard.png', label: 'CRM-dashboard · MHS Media' },
      { src: '/backend-integraties.png', label: 'Integraties & koppelingen' },
    ],
    features: [
      'Zelf teksten, foto\'s en pagina\'s aanpassen (CMS)',
      'Elke aanvraag automatisch als lead in het CRM',
      'Status en opvolging per lead bijhouden',
      'Inzicht in bezoekers, aanvragen en omzet',
      'Offertes, facturen en documenten op één plek',
    ],
    integraties: [
      { naam: 'Google Bedrijfsprofiel', url: 'https://business.google.com', desc: 'Reviews & lokale vindbaarheid' },
      { naam: 'WhatsApp Business', url: 'https://business.whatsapp.com', desc: 'Direct contact met leads' },
      { naam: 'E-mail & agenda', url: '#', desc: 'Automatische bevestigingen' },
    ],
  };
  const backend = { ...BACKEND_DEFAULTS, ...(data.backend || {}) };

  // Case studies (social proof). Overrideerbaar via data.cases; screenshot per case optioneel.
  const CASES = data.cases || [
    { naam: 'Kittenvoegen', metric: '5-10', unit: 'aanvragen per dag', setup: 'SEO & SEA · € 1.500 advertentiebudget in Google Ads', hi: '', screenshot: '/cases/kittenvoegen.png' },
    { naam: 'Top Conditioning', metric: '219', unit: 'aanvragen in 30 dagen', setup: 'SEO & SEA · € 2.600 advertentiebudget in Google Ads', hi: '', screenshot: '/cases/top-conditioning.png' },
    { naam: 'Tiny Eco Home', metric: '3', unit: 'aanvragen per week', setup: 'Alleen SEO, meerdere #1-posities in Google', hi: 'Meerdere zoekwoorden op positie 1', screenshot: '/cases/tiny-eco-home.png' },
  ];

  // Social Media Beheer staat standaard als optionele post in het overzicht (met eigen
  // pagina). Verwijderen haalt zowel de post als de pagina uit het voorstel.
  const SOCIAL_DEFAULT = { key: 'social', label: 'Social Media Beheer', sub: 'Instagram & Facebook inbegrepen · extra platform (YouTube Shorts, LinkedIn, TikTok) +€50/mnd', prijs: 750 };
  const optioneel = (p.optioneel || []).some((o) => o.key === 'social') ? (p.optioneel || []) : [...(p.optioneel || []), SOCIAL_DEFAULT];

  // Eenmalige opstartkosten voor Google Ads (SEA) — alleen relevant als SEA in het
  // voorstel zit. Bedrag is per dienst/deal aanpasbaar (default € 500).
  const heeftSea = optioneel.some((o) => o.key === 'sea');
  const SEA_SETUP = { key: 'sea-setup', label: 'Opstartkosten Google Ads (SEA)', sub: 'Eenmalige campagne-opzet, afhankelijk van uw dienst', prijs: 500 };

  // Eigen (toegevoegde) producten: naam + prijs + eenmalig/maandelijks, bewaard per klant.
  const [toegevoegd, setToegevoegd] = useState([]);

  // alle aanvinkbare diensten → live prijsberekening (inbegrepen = standaard aangevinkt)
  const items = [
    ...(p.fotografie ? [{ ...p.fotografie, groep: 'eenmalig', defaultOn: false }] : []),
    ...(heeftSea ? [{ ...SEA_SETUP, groep: 'eenmalig', defaultOn: false }] : []),
    ...(p.inbegrepen || []).map(o => ({ ...o, groep: 'maand', defaultOn: true })),
    ...optioneel.map(o => ({ ...o, groep: 'maand', defaultOn: false })),
    ...toegevoegd.map(o => ({ ...o, groep: o.eenmalig ? 'eenmalig' : 'maand', defaultOn: true, custom: true })),
  ];
  const [gekozen, setGekozen] = useState(() =>
    Object.fromEntries(items.filter(o => o.defaultOn).map(o => [o.key, true]))
  );
  const aan = (k) => !!gekozen[k];
  const toggle = (k) => setGekozen(s => ({ ...s, [k]: !s[k] }));

  // Producten helemaal uit het overzicht halen (min) en weer terugzetten (plus).
  const [verwijderd, setVerwijderd] = useState({});
  const weg = (k) => !!verwijderd[k];
  const verwijder = (k) => setVerwijderd(s => ({ ...s, [k]: true }));
  const herstel = (k) => setVerwijderd(s => ({ ...s, [k]: false }));
  const removable = [
    ...(p.fotografie ? [{ ...p.fotografie, label: 'Professionele fotografie en video' }] : []),
    ...(heeftSea ? [SEA_SETUP] : []),
    ...(p.inbegrepen || []),
    ...optioneel,
    ...(p.extern ? [{ key: 'extern', label: p.extern.label }] : []),
  ];
  const verwijderdeItems = removable.filter(o => weg(o.key));

  // Eigen product toevoegen/verwijderen + per-post label overschrijven (admin).
  const [labels, setLabels] = useState({});
  const labelVan = (o) => (labels[o.key] != null ? labels[o.key] : o.label);
  const setLabel = (key, v) => setLabels((s) => ({ ...s, [key]: v }));
  const addProduct = ({ label, prijs, eenmalig, sub }) => {
    const key = 'custom_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
    setToegevoegd((t) => [...t, { key, label: label || 'Nieuwe post', sub: sub || '', prijs: Number(prijs) || 0, eenmalig: !!eenmalig }]);
    setGekozen((s) => ({ ...s, [key]: true }));
  };
  const removeProduct = (key) => setToegevoegd((t) => t.filter((x) => x.key !== key));

  // Prijzen zijn in admin-view aanpasbaar (potloodje bij hover): website + elke maand-/
  // eenmalige post (onderhoud, GMB, SEO, SEA, fotografie) via een override-map per key.
  const [websitePrijs, setWebsitePrijs] = useState(p.website);
  const [prijzen, setPrijzen] = useState({});
  const prijsVan = (o) => (prijzen[o.key] != null ? prijzen[o.key] : o.prijs);
  const setPrijs = (key, v) => setPrijzen((s) => ({ ...s, [key]: v }));

  // Opgeslagen prijssamenstelling per klant laden (elke bezoeker ziet de door de admin
  // vastgestelde prijzen/keuzes). Opslaan gebeurt via de "Prijzen opslaan"-knop rechtsboven.
  const [saveState, setSaveState] = useState('');   // '' | 'saving' | 'ok' | 'err'
  useEffect(() => {
    if (!b.slug) return;
    fetch(`/api/voorstel-config?slug=${encodeURIComponent(b.slug)}`).then((r) => r.json()).then((d) => {
      const c = d.config; if (!c) return;
      if (c.websitePrijs != null) setWebsitePrijs(c.websitePrijs);
      if (c.prijzen) setPrijzen(c.prijzen);
      if (c.gekozen) setGekozen(c.gekozen);
      if (c.verwijderd) setVerwijderd(c.verwijderd);
      if (c.toegevoegd) setToegevoegd(c.toegevoegd);
      if (c.labels) setLabels(c.labels);
    }).catch(() => {});
  }, [b.slug]);
  const saveConfig = async () => {
    setSaveState('saving');
    try {
      const r = await fetch('/api/voorstel-config', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: b.slug, websitePrijs, prijzen, gekozen, verwijderd, toegevoegd, labels }),
      });
      setSaveState(r.ok ? 'ok' : 'err');
    } catch { setSaveState('err'); }
    setTimeout(() => setSaveState(''), 4000);
  };

  // Detail-"pagina" per prijs-onderdeel (klik op ⓘ → pop-up) + fotografie-portfolio-pop-up.
  const [detail, setDetail] = useState(null);   // item-key
  const [mediaOpen, setMediaOpen] = useState(false);
  const [playing, setPlaying] = useState('');   // YouTube-id dat inline speelt

  // Eén bron voor de Social-prijs: de prijskaart, de detailpop-up én de social-pagina
  // lezen dezelfde waarde (incl. admin-prijsaanpassing), zodat ze nooit verschillen.
  const socialPrijs = prijsVan({ key: 'social', prijs: (optioneel.find((o) => o.key === 'social') || {}).prijs ?? 750 });

  // Standaard detail-inhoud per onderdeel; per voorstel te overriden via data.details[key].
  const DETAILS = {
    website:   { kop: 'Custom website (tot 10 pagina\'s)', prijs: euro(websitePrijs), eenheid: 'eenmalig', intro: 'Een volledig op maat gebouwde website die past bij uw merk en uw klanten direct naar een aanvraag leidt — geen sjabloon, maar een ontwerp dat van u is.', punten: ['Uniek ontwerp in uw huisstijl, tot 10 pagina\'s', 'Slimme aanvraag- en offerteflow die leads oplevert', 'Diensten- en projectpagina\'s die uw vakwerk laten zien', 'Ingebouwde backend + CMS: zelf teksten en foto\'s aanpassen', 'Razendsnel, veilig en volledig responsive · V1 binnen 5 werkdagen'] },
    fotografie:{ kop: 'Professionele fotografie en video', prijs: euro((p.fotografie || {}).prijs || 1500), eenheid: 'eenmalig', intro: 'Eén compleet pakket: een fotoshoot on-location én een professionele bedrijfsvideo. Authentieke beelden van uw werk, team en projecten — plus één sterke video die uw verhaal vertelt en uw site en social media laat leven.', punten: ['Professionele fotoshoot op locatie', 'Eén bedrijfsvideo (opname + montage verzorgd)', 'Authentieke project- en teambeelden', 'Beelden + video geoptimaliseerd voor web en social', 'Volledig rechtenvrij te gebruiken'], fotos: PORTFOLIO_FOTO_FLAT, media: 'video' },
    onderhoud: { kop: 'Hosting & onderhoud', prijs: euro(prijsVan({ key: 'onderhoud', prijs: (p.inbegrepen || []).find((x) => x.key === 'onderhoud')?.prijs ?? 65 })), eenheid: '/ mnd', intro: 'Uw website blijft snel, veilig en up-to-date. Wij regelen de hosting, updates en het technisch beheer — u heeft er geen omkijken naar.', punten: ['Snelle, veilige hosting', 'Doorlopende updates & technisch beheer', 'Back-ups en beveiliging', 'Beheer + CRM inbegrepen', 'Persoonlijke support'] },
    gmb:       { kop: 'Google Bedrijfsprofiel (GMB)', prijs: euro(prijsVan({ key: 'gmb', prijs: (p.inbegrepen || []).find((x) => x.key === 'gmb')?.prijs ?? 95 })), eenheid: '/ mnd', intro: 'Uw Google Bedrijfsprofiel is vaak het eerste wat klanten zien. Wij beheren en optimaliseren het zodat u lokaal bovenaan verschijnt en meer reviews krijgt.', punten: ['Beheer & optimalisatie van uw profiel', 'Lokale vindbaarheid in Google Maps', 'Reviewstrategie voor meer 5-sterren', 'Actuele foto\'s, openingstijden en posts'] },
    seo:       { kop: 'SEO — dienst- & locatiepagina\'s', prijs: euro(seo.prijs), eenheid: '/ mnd', intro: seo.body, punten: seo.punten, isSeo: true },
    sea:       { kop: 'Google Ads-beheer (SEA)', prijs: euro(620), eenheid: '/ mnd', intro: 'Direct bovenaan in Google voor uw belangrijkste zoekwoorden. Wij zetten uw campagnes op, beheren ze en sturen doorlopend bij op resultaat.', punten: ['€ 500 basistarief + 10% van het advertentiebudget', 'Campagne-opzet en zoekwoordonderzoek', 'Doorlopende optimalisatie op conversie', 'Heldere rapportage van resultaten'] },
    'sea-setup': { kop: 'Opstartkosten Google Ads (SEA)', prijs: euro(prijsVan(SEA_SETUP)), eenheid: 'eenmalig', intro: 'De eenmalige opzet van uw Google Ads-campagne, afgestemd op uw dienst: account- en campagnestructuur, zoekwoordonderzoek, advertentieteksten en het inrichten van conversietracking. De hoogte hangt af van uw dienst en de omvang van de campagne.', punten: ['Account- en campagnestructuur opgezet', 'Zoekwoordonderzoek voor uw dienst', 'Advertentieteksten en extensies', 'Conversietracking en rapportage ingericht'] },
    social:    { kop: 'Social Media Beheer', prijs: euro(socialPrijs), eenheid: '/ mnd', intro: 'Wij houden uw social media levend en zichtbaar. Een vaste contentkalender, professionele posts en het beheren van reacties en berichten, zodat u top-of-mind blijft bij uw doelgroep zonder er zelf tijd in te steken. We verzorgen ook het offline grafisch design zoals flyers en drukwerk, in dezelfde huisstijl. Instagram en Facebook zijn inbegrepen; elk extra platform (YouTube Shorts, LinkedIn of TikTok) is € 50 per maand extra.', punten: ['Contentkalender en planning per maand', 'Professionele posts (beeld + tekst) in uw huisstijl', 'Offline grafisch design: flyers, drukwerk en meer', 'Instagram en Facebook inbegrepen', 'Extra platform +€50/mnd: YouTube Shorts, LinkedIn, TikTok', 'Reageren op reacties en berichten (community)', 'Maandelijkse rapportage van bereik en groei'] },
    extern:    { kop: 'Google Ads budget', prijs: `v.a. ${euro((p.extern || {}).prijs || 1200)}`, eenheid: '/ mnd', intro: 'Het advertentiebudget dat rechtstreeks aan Google wordt betaald — dit staat los van het beheer door MHS Media. U bepaalt zelf de hoogte.', punten: ['Rechtstreeks aan Google, geen opslag van MHS', 'Volledig door u te bepalen en aan te passen', 'Minimum voor effectieve dataverzameling & optimalisatie'] },
  };
  const detailData = detail ? { ...(DETAILS[detail] || {}), ...((data.details || {})[detail] || {}) } : null;

  const optEenmalig = items.filter(o => o.groep === 'eenmalig' && aan(o.key) && !weg(o.key)).reduce((s, o) => s + prijsVan(o), 0);
  const totaalEenmalig = websitePrijs + optEenmalig;
  const totaalMaand = items.filter(o => o.groep === 'maand' && aan(o.key) && !weg(o.key)).reduce((s, o) => s + prijsVan(o), 0);

  // Admin-view (intern): ?admin=1 toont de Fathom-tools. Klant ziet dit NIET.
  const admin = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('admin') === '1';
  const fathomDomain = (b.email || '').split('@')[1] || '';
  const sld = (x) => (x || '').replace(/^www\./, '').split('.').slice(-2, -1)[0] || x;
  const [fathomList, setFathomList] = useState([]);
  const [fathomSel, setFathomSel] = useState('');
  const [fathom, setFathom] = useState('');
  const [note, setNote] = useState('');
  const [noteStatus, setNoteStatus] = useState('');

  useEffect(() => {
    if (!admin) return;
    fetch('/api/fathom?list=1').then((r) => r.json()).then((d) => {
      const items = d.items || [];
      setFathomList(items);
      const want = sld(fathomDomain);
      const m = items.find((it) => (it.domains || []).some((dm) => sld(dm) === want));
      if (m) setFathomSel(String(m.recordingId));
    }).catch(() => {});
  }, [admin]);

  const insertFathom = async () => {
    if (!fathomSel) return;
    setFathom('loading');
    try {
      const m = fathomList.find((x) => String(x.recordingId) === String(fathomSel));
      const jr = await fetch('/api/jobs', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'fathom-rewrite', source: 'voorstel', payload: { slug: b.slug, domain: fathomDomain, company: b.volledig, recordingId: fathomSel, fathomUrl: m?.shareUrl, title: m?.title } }),
      });
      const jd = await jr.json();
      setFathom(jd.ok ? 'ok' : 'err');
    } catch { setFathom('err'); }
    setTimeout(() => setFathom(''), 7000);
  };

  // Chatbar: vrije info die in het voorstel meegenomen moet worden → 'voorstel-edit'-job.
  const sendNote = async () => {
    if (!note.trim() || noteStatus === 'loading') return;
    setNoteStatus('loading');
    try {
      const jr = await fetch('/api/jobs', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'voorstel-edit', source: 'voorstel', payload: { slug: b.slug, domain: fathomDomain, company: b.volledig, note: note.trim() } }),
      });
      const jd = await jr.json();
      if (jd.ok) { setNoteStatus('ok'); setNote(''); } else setNoteStatus('err');
    } catch { setNoteStatus('err'); }
    setTimeout(() => setNoteStatus(''), 7000);
  };

  // Doorlopende sectienummering (cover telt niet mee; conditionele pagina's slaan
  // hun nummer automatisch over doordat secNo() alleen bij render wordt aangeroepen).
  const secNo = (() => { let n = 0; return () => String(++n).padStart(2, '0'); })();

  // Pagina's weglaten: geef data.omit = ['concept','backend','marketing'] mee om die
  // pagina's over te slaan (bv. als in het gesprek geen interesse in marketing bleek).
  // De doorlopende nummering klopt vanzelf omdat secNo() alleen bij render telt.
  const omit = (k) => Array.isArray(data.omit) && data.omit.includes(k);

  return (
    <div style={{ fontFamily: FONT, background: '#E5E8EF', color: INK }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&family=Caveat:wght@600;700&display=swap');
        .vsheets { display:flex; flex-direction:column; align-items:center; gap:24px; padding:28px 16px 40px; }
        .vpage { width:210mm; max-width:100%; min-height:297mm; margin:0 auto; box-shadow:0 8px 40px rgba(10,19,36,0.16); overflow:hidden; position:relative; }
        .vfoot { width:210mm; max-width:100%; }
        @media print {
          html, body { background:#fff !important; }
          .no-print { display:none !important; }
          .vsheets { display:block; padding:0; gap:0; background:#fff; }
          .vpage {
            width:auto !important; max-width:none !important; min-height:auto !important;
            box-shadow:none !important; margin:0 !important; overflow:visible !important;
            padding:13mm 15mm !important;
            page-break-after:always; break-after:page;
          }
          .vpage:last-child { page-break-after:auto; break-after:auto; }
          .vpage img { max-height:150mm !important; width:auto !important; max-width:100% !important; display:block; margin:0 auto; }
          figure, .avoid-break { break-inside:avoid; page-break-inside:avoid; }
          * { -webkit-print-color-adjust:exact !important; print-color-adjust:exact !important; }
        }
        @page { size:A4; margin:0; }
      `}</style>

      {/* Actiebalk (niet geprint) */}
      <div className="no-print sticky top-0 z-50 flex items-center justify-between px-6 py-3"
        style={{ background: 'rgba(10,19,36,0.92)', backdropFilter: 'blur(14px)', borderBottom: `1px solid ${LINE_D}` }}>
        <img src={MHS_LOGO} alt="MHS Media" style={{ height: 22 }} />
        <div className="flex items-center gap-2">
          {b.site && (
            <a href={b.site} target="_blank" rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-lg transition-all" style={{ border: `1px solid ${LINE_D}`, color: 'rgba(255,255,255,0.85)' }}>
              <Globe className="w-3.5 h-3.5" /> Huidige site
            </a>
          )}
          {b.conceptPath && (
            <a href={b.conceptPath} target="_blank" rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-lg transition-all" style={{ border: `1px solid ${LINE_D}`, color: 'rgba(255,255,255,0.85)' }}>
              <ExternalLink className="w-3.5 h-3.5" /> Bekijk concept
            </a>
          )}
          {admin && (
            <div className="hidden md:flex items-center gap-2 mr-1 pr-3" style={{ borderRight: `1px solid ${LINE_D}` }}>
              <span className="text-[9px] font-bold uppercase tracking-widest" style={{ fontFamily: MONO, color: '#7D9BFF' }}>Intern · Fathom</span>
              <select value={fathomSel} onChange={(e) => setFathomSel(e.target.value)}
                className="text-xs rounded-lg px-2 py-1.5 outline-none" style={{ background: CARD, color: '#fff', border: `1px solid ${LINE_D}`, maxWidth: 220 }}>
                <option value="" style={{ color: '#000' }}>Kies een gesprek…</option>
                {fathomList.map((m) => (
                  <option key={m.recordingId} value={m.recordingId} style={{ color: '#000' }}>
                    {m.title}{m.date ? ` · ${new Date(m.date).toLocaleDateString('nl-NL')}` : ''}
                  </option>
                ))}
              </select>
              <button onClick={insertFathom} disabled={!fathomSel || fathom === 'loading'}
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all disabled:opacity-50"
                style={{ border: `1px solid ${LINE_D}`, color: fathom === 'ok' ? '#5FD0A8' : fathom === 'err' ? '#FF8A7E' : 'rgba(255,255,255,0.85)' }}
                title="Voorstel herschrijven op basis van dit Fathom-gesprek">
                {fathom === 'loading' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                {fathom === 'ok' ? 'In wachtrij' : fathom === 'err' ? 'Mislukt' : 'Invoegen'}
              </button>
            </div>
          )}
          {admin && (
            <button onClick={saveConfig} disabled={saveState === 'saving'}
              className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-lg transition-all disabled:opacity-60"
              style={{ background: saveState === 'ok' ? '#22B07D' : 'rgba(255,255,255,0.12)', color: '#fff', border: `1px solid ${LINE_D}` }}
              title="Prijssamenstelling vastleggen voor deze klant — de klant ziet precies deze prijzen">
              {saveState === 'saving' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              {saveState === 'ok' ? 'Opgeslagen' : saveState === 'err' ? 'Mislukt' : 'Prijzen opslaan'}
            </button>
          )}
          <button onClick={() => window.print()} className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-lg text-white transition-all hover:opacity-90" style={{ background: CYAN }}>
            <Download className="w-3.5 h-3.5" /> Download als PDF
          </button>
        </div>
      </div>

      {/* Chatbar (intern): info die in het voorstel meegenomen moet worden */}
      {admin && (
        <div className="no-print flex items-center gap-2 px-6 py-2.5" style={{ background: 'rgba(10,19,36,0.85)', backdropFilter: 'blur(10px)', borderBottom: `1px solid ${LINE_D}` }}>
          <span className="hidden sm:inline text-[9px] font-bold uppercase tracking-widest shrink-0" style={{ fontFamily: MONO, color: '#7D9BFF' }}>Info voor voorstel</span>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') sendNote(); }}
            placeholder="Typ info die in het voorstel mee moet (besproken wensen, budget, extra dienst)…"
            className="flex-1 text-xs rounded-lg px-3 py-2 outline-none"
            style={{ background: CARD, color: '#fff', border: `1px solid ${LINE_D}` }} />
          <button onClick={sendNote} disabled={!note.trim() || noteStatus === 'loading'}
            className="flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-lg transition-all disabled:opacity-50 shrink-0"
            style={{ border: `1px solid ${LINE_D}`, color: noteStatus === 'ok' ? '#5FD0A8' : noteStatus === 'err' ? '#FF8A7E' : 'rgba(255,255,255,0.9)' }}
            title="Voorstel bijwerken met deze info">
            {noteStatus === 'loading' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            {noteStatus === 'ok' ? 'In wachtrij' : noteStatus === 'err' ? 'Mislukt' : 'Invoegen'}
          </button>
        </div>
      )}

      <div className="vsheets">

        {/* ══ PAGINA 1 · COVER (donker) ══ */}
        <section className="vpage relative overflow-hidden px-10 md:px-14 pt-10 pb-16" style={{ background: NAVY, color: WHITE }}>
          <div className="flex items-center justify-between mb-14">
            <div className="flex items-center gap-4">
              <img src={MHS_LOGO} alt="MHS Media" style={{ height: 30 }} />
              <span style={{ color: 'rgba(255,255,255,0.35)' }}>×</span>
              <Mono color="rgba(255,255,255,0.6)">{b.volledig}</Mono>
            </div>
            <Mono color="rgba(255,255,255,0.45)">Voorstel · {data.datum}</Mono>
          </div>

          <Mono className="mb-6">{data.sectorLabel}</Mono>
          <h1 className="font-bold leading-[1.12] mb-7 max-w-3xl" style={{ fontFamily: FONT, fontSize: 'clamp(1.9rem, 3.6vw, 2.9rem)', letterSpacing: '-0.03em' }}>{data.headline}</h1>
          <p className="text-base leading-relaxed max-w-xl mb-12" style={{ color: 'rgba(255,255,255,0.68)' }}>{data.intro}</p>

          <div className="rounded-3xl overflow-hidden mb-14" style={{ height: 320, boxShadow: '0 24px 60px rgba(0,0,0,0.4)' }}>
            <img src={data.coverImg || MHS_COVER} alt="" className="w-full h-full object-cover" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12">
            {data.doelen.map((d, i) => (
              <div key={i} className="p-6 rounded-2xl" style={{ background: CARD, border: `1px solid ${LINE_D}` }}>
                <Mono className="mb-2.5">Doel {String(i + 1).padStart(2, '0')}</Mono>
                <p className="text-base font-semibold leading-snug" style={{ fontFamily: FONT }}>{d}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 pt-9 border-t" style={{ borderColor: LINE_D }}>
            <div>
              <Mono color="rgba(255,255,255,0.4)" className="mb-2">Voor</Mono>
              <p className="text-base font-semibold" style={{ fontFamily: FONT }}>{b.volledig}</p>
              <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>{b.sector}</p>
            </div>
            <div>
              <Mono color="rgba(255,255,255,0.4)" className="mb-2">Van</Mono>
              <p className="text-base font-semibold" style={{ fontFamily: FONT }}>Morris Sanders</p>
              <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>Eigenaar · MHS Media</p>
            </div>
            <div>
              <Mono color="rgba(255,255,255,0.4)" className="mb-2">{b.conceptPath ? 'Concept' : 'Website'}</Mono>
              <p className="text-base font-semibold" style={{ fontFamily: FONT }}>{b.conceptPath ? 'Live te bekijken' : (b.site ? 'Huidige site' : 'Op maat')}</p>
              {b.conceptPath
                ? <a href={b.conceptPath} target="_blank" rel="noopener noreferrer" className="text-sm break-all hover:underline" style={{ fontFamily: MONO, color: CYAN }}>{b.conceptLabel}</a>
                : (b.site && <a href={b.site} target="_blank" rel="noopener noreferrer" className="text-sm break-all hover:underline" style={{ fontFamily: MONO, color: CYAN }}>{b.site.replace(/^https?:\/\//, '')}</a>)}
            </div>
          </div>
        </section>

        {/* ══ PAGINA · HUIDIGE SITUATIE & ONZE OPLOSSING (start Deel 1, banner bovenaan) ══ */}
        <section className="vpage px-10 md:px-14 py-14" style={{ background: WHITE }}>
          <PartBanner nr="Deel 1" titel="De fundering van je bedrijf" sub="Je nieuwe website, design, beeld, Google-profiel, onderhoud en de complete backend — het fundament waarop alle groei rust." />
          <div className="flex items-start justify-between mb-2">
            <Mono>Waar je nu staat</Mono>
            <Mono color={MUTED}>{secNo()} · Huidige situatie & onze oplossing</Mono>
          </div>
          <motion.div {...rise}>
            <h2 className="font-bold mt-4 mb-5" style={{ fontFamily: FONT, color: INK, fontSize: 'clamp(1.45rem, 2.8vw, 2rem)', letterSpacing: '-0.025em' }}>{data.aanpakKop}</h2>
            <p className="text-base leading-relaxed max-w-2xl mb-3" style={{ color: BODY }}>{data.aanpakIntro1}</p>
            <p className="text-base leading-relaxed max-w-2xl" style={{ color: BODY }}>{data.aanpakIntro2}</p>
          </motion.div>

          {/* Huidige site: issues ↔ onze oplossing */}
          <div className="grid sm:grid-cols-2 gap-4 mt-9">
            <motion.div {...rise} className="p-7 rounded-3xl" style={{ background: LIGHT }}>
              <Mono color={MUTED} className="mb-5">{b.site ? 'Huidige site — wat beter kan' : 'Zonder goede site loopt u dit mis'}</Mono>
              <ul className="space-y-4">
                {data.uitdagingen.map((u, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm" style={{ color: INK }}>
                    <X className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#E4574C' }} strokeWidth={3} />{u}
                  </li>
                ))}
              </ul>
            </motion.div>
            <motion.div {...rise} transition={{ ...rise.transition, delay: 0.08 }} className="p-7 rounded-3xl" style={{ background: BLUEBOX }}>
              <Mono className="mb-5">Onze oplossing</Mono>
              <ul className="space-y-4">
                {data.oplossingen.map((o, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm font-medium" style={{ color: INK }}>
                    <Check className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: CYAN }} strokeWidth={3} />{o}
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>

          <div className="my-9 h-px" style={{ background: LINE }} />
          <Mono className="mb-5">Drie doelen, één aanpak</Mono>
          <div className="space-y-4">
            {data.aanpak.map((a, i) => (
              <motion.div key={i} {...rise} transition={{ ...rise.transition, delay: i * 0.07 }}
                className="flex gap-5 p-6 rounded-3xl" style={{ background: LIGHT }}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 font-semibold text-white text-sm" style={{ background: CYAN, fontFamily: FONT }}>{i + 1}</div>
                <div>
                  <h3 className="font-semibold mb-2" style={{ fontFamily: FONT, color: INK }}>{a.title}</h3>
                  <p className="text-sm leading-relaxed mb-3" style={{ color: BODY }}>{a.body}</p>
                  <p style={{ fontFamily: MONO, color: CYAN, fontSize: 12.5, fontWeight: 700 }}>→ {a.result}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ══ PAGINA 3 · HET CONCEPT (live iframe) — alleen tonen als er een concept is ══ */}
        {b.conceptPath && !omit('concept') && (
        <section className="vpage px-10 md:px-14 py-14" style={{ background: WHITE }}>
          <div className="flex items-start justify-between mb-2">
            <Mono>Jullie nieuwe website — alvast te zien</Mono>
            <Mono color={MUTED}>{secNo()} · Het concept</Mono>
          </div>
          <motion.div {...rise}>
            <h2 className="font-bold mt-4 mb-5" style={{ fontFamily: FONT, color: INK, fontSize: 'clamp(1.45rem, 2.8vw, 2rem)', letterSpacing: '-0.025em' }}>We hebben alvast een eerste indruk gemaakt.</h2>
            <p className="text-base leading-relaxed max-w-2xl mb-8" style={{ color: BODY }}>
              Op basis van wat {b.volledig} doet en voor wie, hebben we een concept gebouwd dat laat zien hoe de nieuwe website eruit kan zien. Dit is een eerste versie — alle wensen en aanpassingen verwerken we in de volgende stap.
            </p>
          </motion.div>

          <motion.div {...rise} className="rounded-3xl overflow-hidden" style={{ boxShadow: '0 24px 60px rgba(10,19,36,0.18)', border: `1px solid ${LINE}` }}>
            <div className="flex items-center gap-2 px-4 py-2.5" style={{ background: NAVY }}>
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#FF5F57' }} />
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#FEBC2E' }} />
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#28C840' }} />
              <a href={b.conceptPath} target="_blank" rel="noopener noreferrer" className="ml-3 text-[11px] px-3 py-1 rounded-md truncate hover:underline" style={{ fontFamily: MONO, background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)' }}>{b.conceptLabel}</a>
            </div>
            {/* Desktop-weergave (1512×982) ingeschaald op A4-breedte, scrollbaar */}
            <div className="bg-white" style={{ height: 442, overflow: 'hidden' }}>
              <iframe title="Concept" src={b.conceptPath} loading="lazy"
                style={{ width: 1512, height: 982, border: 0, display: 'block', transformOrigin: 'top left', transform: 'scale(0.45)' }} />
            </div>
          </motion.div>

          <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-4 rounded-2xl" style={{ background: BLUEBOX }}>
            <p className="text-sm font-medium" style={{ color: INK }}>Bekijk het concept live in de browser</p>
            <a href={b.conceptPath} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold hover:underline" style={{ fontFamily: MONO, color: CYAN_D }}>{b.conceptLabel} →</a>
          </div>
        </section>
        )}

        {/* ══ PAGINA 4 · DE WEBSITE (licht) ══ */}
        <section className="vpage px-10 md:px-14 py-14" style={{ background: WHITE }}>
          <div className="flex items-start justify-between mb-2">
            <Mono>Het fundament</Mono>
            <Mono color={MUTED}>{secNo()} · De website</Mono>
          </div>
          <motion.div {...rise}>
            <h2 className="font-bold mt-4 mb-5" style={{ fontFamily: FONT, color: INK, fontSize: 'clamp(1.45rem, 2.8vw, 2rem)', letterSpacing: '-0.025em' }}>{data.fundamentKop}</h2>
            <p className="text-base leading-relaxed max-w-2xl mb-9" style={{ color: BODY }}>{data.fundamentBody}</p>
          </motion.div>

          <div className="rounded-3xl overflow-hidden" style={{ border: `1px solid ${LINE}` }}>
            {data.website.map((w, i) => (
              <motion.div key={i} {...rise} transition={{ ...rise.transition, delay: i * 0.05 }}
                className="flex items-center gap-4 p-5" style={{ borderTop: i ? `1px solid ${LINE}` : 'none' }}>
                <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-white" style={{ background: CYAN, fontFamily: MONO, fontSize: 12, fontWeight: 700 }}>{String(i + 1).padStart(2, '0')}</div>
                <div className="flex-1">
                  <h3 className="font-semibold text-sm mb-0.5" style={{ fontFamily: FONT, color: INK }}>{w.title}</h3>
                  <p className="text-xs leading-relaxed" style={{ color: BODY }}>{w.desc}</p>
                </div>
                <span className="flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold" style={{ border: `1px solid ${CYAN}`, color: CYAN_D, fontFamily: MONO }}>{w.tag}</span>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ══ PAGINA · GOOGLE BEDRIJFSPROFIEL (Deel 1) ══ */}
        {(() => {
          const gmbFoto = (typeof b.img === 'string' ? b.img : (b.img && (b.img.hero || b.img.about))) || '';
          const plaats = (b.werkgebied || '').split(/[·,()\/]/)[0].trim();
          const merkKleur = b.BLUE || b.NAVY || CYAN;
          return (
            <section className="vpage px-10 md:px-14 py-14" style={{ background: WHITE }}>
              <div className="flex items-start justify-between mb-2">
                <Mono>Direct zichtbaar &amp; vertrouwd</Mono>
                <Mono color={MUTED}>{secNo()} · Google Bedrijfsprofiel</Mono>
              </div>
              <motion.h2 {...rise} className="font-bold mt-4 mb-4" style={{ fontFamily: FONT, color: INK, fontSize: 'clamp(1.45rem, 2.8vw, 2rem)', letterSpacing: '-0.025em' }}>Bovenaan in Google Maps, met sterke reviews</motion.h2>
              <p className="text-base leading-relaxed max-w-2xl mb-8" style={{ color: BODY }}>Uw Google Bedrijfsprofiel is vaak het eerste wat klanten zien. Wij richten het volledig in, houden het actueel en zorgen met actief reviewmanagement dat u lokaal bovenaan verschijnt en direct vertrouwen wekt.</p>
              <div className="grid md:grid-cols-2 gap-6 items-start">
                <motion.div {...rise} className="avoid-break rounded-3xl overflow-hidden" style={{ border: `1px solid ${LINE}`, boxShadow: '0 16px 44px rgba(10,19,36,0.10)' }}>
                  {gmbFoto
                    ? <img src={gmbFoto} alt={b.volledig} className="w-full object-cover" style={{ height: 150 }} />
                    : <div style={{ height: 150, background: `linear-gradient(135deg, ${NAVY}, ${CYAN})` }} />}
                  <div className="p-6">
                    <h3 className="font-bold" style={{ fontFamily: FONT, color: INK, fontSize: '1.15rem' }}>{b.volledig}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span style={{ color: '#e7711b', fontWeight: 700, fontSize: 14 }}>4,9</span>
                      <span style={{ color: '#e7711b', letterSpacing: 1 }}>★★★★★</span>
                      <span className="text-xs" style={{ color: BODY }}>· 87 Google reviews</span>
                    </div>
                    <p className="text-sm mt-1" style={{ color: BODY }}>{b.sector}{plaats ? ` · ${plaats}` : ''}</p>
                    <div className="flex gap-2 mt-4">
                      {['Bellen', 'Route', 'Website'].map((t) => (
                        <span key={t} className="flex-1 text-center text-xs font-semibold py-2 rounded-lg" style={{ border: `1px solid ${LINE}`, color: CYAN_D }}>{t}</span>
                      ))}
                    </div>
                    <p className="text-xs mt-3" style={{ color: '#2e7d32' }}>● Geopend · sluit om 17:00</p>
                    <div className="h-px my-4" style={{ background: LINE }} />
                    <Mono color={MUTED} className="mb-3">Recente reviews</Mono>
                    {[{ n: 'Sanne V.', t: 'Snel, netjes en vakkundig geholpen. Echt een aanrader!' }, { n: 'Mark de J.', t: 'Duidelijke afspraken en keurig opgeleverd. Top service.' }].map((r) => (
                      <div key={r.n} className="mb-3">
                        <div className="flex items-center gap-2"><span style={{ color: '#e7711b', fontSize: 11, letterSpacing: 1 }}>★★★★★</span><span className="text-xs font-semibold" style={{ color: INK }}>{r.n}</span></div>
                        <p className="text-xs mt-0.5" style={{ color: BODY }}>{r.t}</p>
                      </div>
                    ))}
                  </div>
                </motion.div>
                <motion.div {...rise} transition={{ ...rise.transition, delay: 0.08 }}>
                  <div className="grid gap-2.5 mb-6">
                    {DETAILS.gmb.punten.map((pt, i) => (
                      <div key={i} className="flex items-start gap-2.5"><Check className="w-4 h-4 mt-0.5 shrink-0" style={{ color: CYAN }} /><span className="text-sm" style={{ color: INK }}>{pt}</span></div>
                    ))}
                  </div>
                  <div className="rounded-3xl p-6" style={{ background: BLUEBOX }}>
                    <Mono className="mb-2">Actief reviewmanagement</Mono>
                    <p className="text-sm leading-relaxed" style={{ color: INK }}>Na elke klus vragen we uw klant automatisch om een review, en we reageren professioneel op álle reviews. Zo groeit uw score maand na maand — en daarmee uw lokale vindbaarheid en vertrouwen.</p>
                  </div>
                </motion.div>
              </div>

              {/* Praktijkvoorbeeld: compact, getabd, met een realistisch Google-profiel */}
              <GmbVoorbeeld />

              {/* Slimme review-flow (branded met logo/naam/kleur van de klant) */}
              <motion.div {...rise} className="avoid-break rounded-3xl mt-6 p-8" style={{ background: LIGHT }}>
                <Mono className="mb-2">Slim reviewmanagement — zo werkt het</Mono>
                <h3 className="font-bold mb-6" style={{ fontFamily: FONT, color: INK, fontSize: '1.15rem' }}>Alleen echte 5-sterren reviews op Google, kritiek blijft privé</h3>
                <div className="grid md:grid-cols-[1.1fr_auto_1.2fr] gap-5 items-center">
                  <div className="rounded-2xl p-5 flex items-center justify-center" style={{ background: merkKleur }}>
                    <div className="rounded-2xl px-6 py-7 text-center w-full" style={{ background: WHITE, boxShadow: '0 16px 40px rgba(0,0,0,0.20)' }}>
                      {b.logo
                        ? <img src={b.logo} alt={b.naam} style={{ height: 36, maxWidth: 160, objectFit: 'contain', margin: '0 auto 14px' }} />
                        : <p className="font-bold mb-3" style={{ fontFamily: FONT, color: merkKleur, fontSize: '1.1rem' }}>{b.naam}</p>}
                      <p className="font-bold" style={{ fontFamily: FONT, color: INK, fontSize: '1.05rem', lineHeight: 1.25 }}>Hoe was je ervaring met {b.naam}?</p>
                      <p className="text-xs mt-2" style={{ color: MUTED }}>Klik op het aantal sterren dat past bij je ervaring.</p>
                      <div className="flex justify-center gap-1.5 mt-4" style={{ color: '#d0d4dc', fontSize: '1.9rem', lineHeight: 1 }}>★★★★★</div>
                    </div>
                  </div>
                  <div className="hidden md:flex items-center justify-center"><ArrowRight className="w-6 h-6" style={{ color: MUTED }} /></div>
                  <div className="grid gap-3">
                    <div className="rounded-2xl p-5" style={{ background: WHITE, border: `1px solid ${LINE}` }}>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span style={{ color: '#e7711b' }}>★★★★★</span>
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded" style={{ background: '#e8f5e9', color: '#2e7d32' }}>5 sterren</span>
                      </div>
                      <p className="text-sm font-semibold" style={{ color: INK }}>→ Direct door naar uw Google Bedrijfsprofiel</p>
                      <p className="text-xs mt-0.5 leading-relaxed" style={{ color: BODY }}>De klant laat de échte review publiek achter. Uw Google-score groeit.</p>
                    </div>
                    <div className="rounded-2xl p-5" style={{ background: WHITE, border: `1px solid ${LINE}` }}>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span style={{ color: '#e7711b' }}>★★★★<span style={{ color: '#d0d4dc' }}>★</span></span>
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded" style={{ background: '#fff3e0', color: '#e65100' }}>onder 5 sterren</span>
                      </div>
                      <p className="text-sm font-semibold" style={{ color: INK }}>→ Privé feedbackformulier</p>
                      <p className="text-xs mt-0.5 leading-relaxed" style={{ color: BODY }}>De feedback komt eerst bij u binnen, niet publiek — zo lost u het op.</p>
                    </div>
                  </div>
                </div>
                <p className="text-sm mt-6" style={{ color: BODY }}>Zo verzamelt u structureel <strong>alleen sterke publieke reviews</strong> op Google, terwijl kritische feedback privé bij u binnenkomt om direct op te pakken.</p>
              </motion.div>
            </section>
          );
        })()}

        {/* ══ PAGINA · BACKEND & CRM (altijd — toont het echte Kittenvoegen/MHS-dashboard) ══ */}
        {!omit('backend') && (
          <section className="vpage px-10 md:px-14 py-14" style={{ background: WHITE }}>
            <div className="flex items-start justify-between mb-2">
              <Mono>Meten is groeien</Mono>
              <Mono color={MUTED}>{secNo()} · Backend & CRM</Mono>
            </div>
            <motion.div {...rise}>
              <h2 className="font-bold mt-4 mb-5" style={{ fontFamily: FONT, color: INK, fontSize: 'clamp(1.45rem, 2.8vw, 2rem)', letterSpacing: '-0.025em' }}>{backend.kop}</h2>
              <p className="text-base leading-relaxed max-w-2xl mb-9" style={{ color: BODY }}>{backend.body}</p>
            </motion.div>

            {/* Backend-visuals: echte screenshots (met browser-frame), anders een mock */}
            {backend.screenshots ? (
              <div className="space-y-5 mb-8">
                {backend.screenshots.map((s, i) => (
                  <motion.figure key={i} {...rise} transition={{ ...rise.transition, delay: i * 0.06 }}
                    className="rounded-2xl overflow-hidden m-0" style={{ boxShadow: '0 24px 60px rgba(10,19,36,0.18)', border: `1px solid ${LINE}` }}>
                    <div className="flex items-center gap-2 px-4 py-2.5" style={{ background: NAVY }}>
                      <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#FF5F57' }} />
                      <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#FEBC2E' }} />
                      <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#28C840' }} />
                      <span className="ml-3 text-[11px] px-3 py-1 rounded-md truncate" style={{ fontFamily: MONO, background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)' }}>{s.label}</span>
                    </div>
                    <img src={s.src} alt={s.label} className="w-full block" style={{ background: WHITE }} />
                  </motion.figure>
                ))}
              </div>
            ) : (
              <motion.div {...rise} className="rounded-3xl overflow-hidden mb-8" style={{ boxShadow: '0 24px 60px rgba(10,19,36,0.18)', border: `1px solid ${LINE}` }}>
                <div className="flex items-center gap-2 px-4 py-2.5" style={{ background: NAVY }}>
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#FF5F57' }} />
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#FEBC2E' }} />
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#28C840' }} />
                  <span className="ml-3 text-[11px] px-3 py-1 rounded-md" style={{ fontFamily: MONO, background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)' }}>{b.slug || 'crm'}.mhsmedia.nl/dashboard</span>
                </div>
                <div className="p-6" style={{ background: LIGHT }}>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                    {(backend.stats || []).map((s) => (
                      <div key={s.label} className="p-4 rounded-2xl" style={{ background: WHITE, border: `1px solid ${LINE}` }}>
                        <p className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: MUTED }}>{s.label}</p>
                        <p className="font-bold text-2xl" style={{ fontFamily: FONT, color: NAVY }}>{s.value}</p>
                      </div>
                    ))}
                  </div>
                  <div className="rounded-2xl overflow-hidden" style={{ background: WHITE, border: `1px solid ${LINE}` }}>
                    <div className="grid grid-cols-4 px-4 py-2.5" style={{ background: '#FAFBFE', borderBottom: `1px solid ${LINE}` }}>
                      {['Lead', 'Bron', 'Status', 'Waarde'].map((h) => (
                        <p key={h} className="text-[10px] font-bold uppercase tracking-wider" style={{ color: MUTED }}>{h}</p>
                      ))}
                    </div>
                    {(backend.leads || []).map((l, i) => (
                      <div key={i} className="grid grid-cols-4 items-center px-4 py-3" style={{ borderTop: i ? `1px solid ${LINE}` : 'none' }}>
                        <p className="text-sm font-semibold" style={{ color: NAVY }}>{l.naam}</p>
                        <p className="text-sm" style={{ color: BODY }}>{l.bron}</p>
                        <span className="justify-self-start text-[11px] font-semibold px-2.5 py-1 rounded-full" style={{ background: `${l.kleur}1A`, color: l.kleur }}>{l.status}</span>
                        <p className="text-sm font-semibold" style={{ fontFamily: MONO, color: NAVY }}>{l.waarde}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Features + koppelingen */}
            <div className="grid md:grid-cols-2 gap-4">
              <motion.div {...rise} className="p-6 rounded-3xl" style={{ background: LIGHT }}>
                <Mono className="mb-4">Wat het dashboard doet</Mono>
                <ul className="space-y-3">
                  {backend.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm" style={{ color: INK }}>
                      <Check className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: CYAN }} strokeWidth={3} />{f}
                    </li>
                  ))}
                </ul>
              </motion.div>
              <motion.div {...rise} transition={{ ...rise.transition, delay: 0.08 }} className="p-6 rounded-3xl" style={{ background: BLUEBOX }}>
                <Mono className="mb-4">Koppelingen</Mono>
                <div className="space-y-2.5">
                  {backend.integraties.map((k) => (
                    <a key={k.naam} href={k.url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center justify-between gap-3 px-4 py-3 rounded-2xl transition-all hover:bg-white" style={{ background: WHITE, border: `1px solid ${LINE}` }}>
                      <div>
                        <p className="text-sm font-semibold" style={{ color: NAVY }}>{k.naam}</p>
                        <p className="text-xs" style={{ color: MUTED }}>{k.desc}</p>
                      </div>
                      <ExternalLink className="w-4 h-4 flex-shrink-0" style={{ color: CYAN }} />
                    </a>
                  ))}
                </div>
              </motion.div>
            </div>
          </section>
        )}

        {/* ══ DIENST-PAGINA · FOTOGRAFIE EN VIDEO (weg zodra fotografie uit de prijskaart is) ══ */}
        {p.fotografie && !weg(p.fotografie.key) && (
        <DienstPagina no={secNo()} eyebrow="Uw vakwerk in beeld" titel="Fotografie & video" kop="Professionele fotografie én video die vertrouwen wekken" intro={DETAILS.fotografie.intro} prijs={euro((p.fotografie || {}).prijs || 1500)} eenheid="eenmalig" punten={DETAILS.fotografie.punten}>
          <div className="flex items-center justify-between mb-3">
            <Mono>Voorbeelden uit ons portfolio</Mono>
            <button onClick={() => setMediaOpen(true)} className="no-print text-xs font-semibold inline-flex items-center gap-1.5" style={{ fontFamily: MONO, color: CYAN_D }}>Volledig foto- &amp; videowerk <ArrowRight className="w-3.5 h-3.5" /></button>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[PORTFOLIO_FOTO[0].fotos[0], PORTFOLIO_FOTO[1].fotos[0], PORTFOLIO_FOTO[2].fotos[0], PORTFOLIO_FOTO[3].fotos[0], PORTFOLIO_FOTO[3].fotos[1], PORTFOLIO_FOTO[0].fotos[1]].map((src, i) => (
              <div key={i} className="rounded-2xl overflow-hidden" style={{ aspectRatio: '4 / 3', background: LIGHT }}>
                <img src={src} alt="Fotografie" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            ))}
          </div>
          <Mono className="mt-6 mb-3">Voorbeelden van ons videowerk</Mono>
          <div className="grid grid-cols-3 gap-3">
            {PORTFOLIO_VIDEO.map((v) => (
              <button key={v.id} onClick={() => { setPlaying(v.id); setMediaOpen(true); }} className="no-print relative rounded-2xl overflow-hidden" style={{ aspectRatio: '16 / 9', background: '#000' }}>
                <img src={`https://i.ytimg.com/vi/${v.id}/hqdefault.jpg`} alt={v.title} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.9 }} />
                <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.92)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Play className="w-4 h-4" style={{ color: NAVY, marginLeft: 2 }} /></span>
                </span>
              </button>
            ))}
          </div>
          <p className="text-sm mt-4" style={{ color: MUTED }}>Eén pakket: u krijgt de fotoshoot én één professionele bedrijfsvideo. Projecten o.a.: {PORTFOLIO_FOTO.map((x) => x.project).join(' · ')}</p>
        </DienstPagina>
        )}

        {/* ══ DEEL 2 · MARKETING (marketing+planning, SEO, SEA, waarom-samen) — weg te laten via data.omit=['marketing'] ══ */}
        {!omit('marketing') && (<>
        {/* ══ PAGINA · MARKETING + PLANNING (start Deel 2, banner bovenaan) ══ */}
        <section className="vpage px-10 md:px-14 py-14" style={{ background: WHITE }}>
          <PartBanner nr="Deel 2" titel="Marketing & groei" sub="Nu het fundament staat, zorgen we dat je gevonden wordt: met SEO en Google Ads die structureel nieuwe aanvragen opleveren." />
          <div className="flex items-start justify-between mb-2">
            <Mono>De motor achter de groei</Mono>
            <Mono color={MUTED}>{secNo()} · Marketing + planning</Mono>
          </div>
          <motion.div {...rise}>
            <h2 className="font-bold mt-4 mb-5" style={{ fontFamily: FONT, color: INK, fontSize: 'clamp(1.45rem, 2.8vw, 2rem)', letterSpacing: '-0.025em' }}>{data.marketingKop}</h2>
            <p className="text-base leading-relaxed max-w-2xl mb-9" style={{ color: BODY }}>{data.marketingBody}</p>
          </motion.div>


          <div className="grid sm:grid-cols-2 gap-4 mb-4">
            {data.marketing.map((m, i) => (
              <motion.div key={i} {...rise} transition={{ ...rise.transition, delay: i * 0.08 }}
                className="p-7 rounded-3xl" style={{ background: WHITE, border: `1px solid ${LINE}` }}>
                <Mono className="mb-3">{m.tag}</Mono>
                <h3 className="font-semibold mb-2.5" style={{ fontFamily: FONT, color: INK }}>{m.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: BODY }}>{m.body}</p>
              </motion.div>
            ))}
          </div>
          <div className="p-6 rounded-3xl mb-10" style={{ background: BLUEBOX }}>
            <p className="text-sm leading-relaxed" style={{ color: INK }} dangerouslySetInnerHTML={{ __html: data.gmbNote }} />
          </div>

          <div className="h-px mb-9" style={{ background: LINE }} />
          <Mono className="mb-5">Planning</Mono>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {data.planning.map((s, i) => (
              <motion.div key={i} {...rise} transition={{ ...rise.transition, delay: i * 0.06 }}
                className="p-5 rounded-2xl" style={{ background: WHITE, border: `1px solid ${LINE}` }}>
                <Mono className="mb-2.5">Stap {i + 1}</Mono>
                <h4 className="font-semibold text-sm mb-1.5" style={{ fontFamily: FONT, color: INK }}>{s.title}</h4>
                <p className="text-xs leading-relaxed" style={{ color: BODY }}>{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ══ DIENST-PAGINA · SEO (weg zodra SEO uit de prijskaart is gehaald) ══ */}
        {!weg('seo') && (
        <section className="vpage px-10 md:px-14 py-14" style={{ background: WHITE }}>
          <div className="flex items-start justify-between mb-2">
            <Mono>Beter gevonden worden in Google</Mono>
            <Mono color={MUTED}>{secNo()} · SEO</Mono>
          </div>
          {/* SEO-onderdeel — dienst × locatie pagina's (standaard) */}
          <motion.div {...rise} className="avoid-break rounded-3xl p-8 md:p-9 mb-4" style={{ background: NAVY, color: WHITE }}>
            <div className="flex items-start justify-between gap-5 mb-4">
              <div>
                <Mono color={CYAN}>SEO · dienst × locatie</Mono>
                <h3 className="font-semibold mt-3" style={{ fontFamily: FONT, fontSize: 'clamp(1.2rem, 2.4vw, 1.5rem)' }}>{seo.kop}</h3>
              </div>
              <div className="text-right shrink-0">
                <p className="font-bold" style={{ fontFamily: FONT, color: CYAN, fontSize: 'clamp(1.6rem, 3vw, 2rem)', lineHeight: 1 }}>{euro(seo.prijs)}</p>
                <Mono color="rgba(255,255,255,0.5)">per maand</Mono>
              </div>
            </div>
            <p className="text-sm leading-relaxed mb-6 max-w-2xl" style={{ color: 'rgba(255,255,255,0.72)' }}>{seo.body}</p>
            <div className="grid sm:grid-cols-2 gap-x-8 gap-y-2.5 mb-7">
              {seo.punten.map((pt, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 mt-0.5 shrink-0" style={{ color: CYAN }} />
                  <span className="text-sm leading-snug" style={{ color: 'rgba(255,255,255,0.82)' }}>{pt}</span>
                </div>
              ))}
            </div>
            <Mono color="rgba(255,255,255,0.5)" className="mb-3">Voorbeeldpagina's die wij voor u maken</Mono>
            <div className="flex flex-wrap gap-2">
              {seo.voorbeelden.map((v, i) => (
                <span key={i} className="text-xs px-3 py-2 rounded-lg" style={{ fontFamily: MONO, background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.85)', border: `1px solid ${LINE_D}` }}>{v}</span>
              ))}
            </div>
          </motion.div>

          {/* Zo verschijnt zo'n pagina in Google (organisch zoekresultaat) */}
          {(() => {
            const vb = (seo.voorbeelden && seo.voorbeelden[0]) || 'Gevelrenovatie Groningen';
            const parts = vb.trim().split(' '); const loc = parts.pop(); const sub = parts.join(' ');
            const dom = (b.site || 'uwsite.nl').replace(/^https?:\/\//, '').replace(/\/.*$/, '');
            const slug = `${sub.toLowerCase().replace(/\s+/g, '-')}-${loc.toLowerCase()}`;
            return (
              <motion.div {...rise} className="avoid-break rounded-3xl p-8 md:p-9 mb-4" style={{ background: LIGHT, border: `1px solid ${LINE}` }}>
                <Mono>Zo verschijnt u in Google</Mono>
                <div className="mt-4 rounded-2xl p-6" style={{ background: WHITE, border: `1px solid ${LINE}`, boxShadow: '0 10px 30px rgba(10,19,36,0.06)' }}>
                  <div className="flex items-center gap-2.5 mb-2">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: LIGHT, fontFamily: FONT, fontWeight: 700, fontSize: 12, color: INK }}>{(b.naam || 'U')[0]}</div>
                    <div>
                      <p className="text-xs leading-tight font-medium" style={{ color: INK }}>{b.volledig}</p>
                      <p className="text-xs leading-tight" style={{ color: '#3a7d3a' }}>{dom} › {slug}</p>
                    </div>
                  </div>
                  <p className="leading-snug" style={{ color: '#1a0dab', fontSize: '1.25rem' }}>{sub} {loc} — {b.naam}</p>
                  <p className="text-sm mt-1.5 leading-relaxed" style={{ color: BODY }}>Op zoek naar {sub.toLowerCase()} in {loc}? ✓ Vakkundig ✓ Vrijblijvende offerte binnen 24 uur ✓ Actief in {loc} en omgeving. Bekijk onze projecten en vraag direct aan.</p>
                  <div className="flex items-center gap-1.5 mt-2">
                    <span style={{ color: '#e7711b', fontSize: 13, letterSpacing: 1 }}>★★★★★</span>
                    <span className="text-xs" style={{ color: BODY }}>4,9 · 87 reviews</span>
                  </div>
                </div>
                <p className="text-sm mt-3" style={{ color: BODY }}>Voor élke combinatie van (sub)dienst en plaats maken we zo'n pagina — met de juiste titel, tekst en structuur die Google nodig heeft om u bovenaan te tonen.</p>
              </motion.div>
            );
          })()}

          {/* Live voorbeeld van zo'n SEO-pagina (iframe) */}
          {(() => {
            const vb = (seo.voorbeelden && seo.voorbeelden[0]) || 'Gevelrenovatie Groningen';
            const parts = vb.trim().split(' '); const loc = parts.pop(); const sub = parts.join(' ');
            const seoDiensten = (data.diensten || seo.voorbeelden || []).map((x) => (typeof x === 'string' ? x.replace(/\s+\S+$/, '') : (x.title || x.naam || ''))).filter(Boolean).join('|');
            const bimg = b.img || {};
            const img1 = typeof bimg === 'string' ? bimg : (bimg.hero || '');
            const img2 = typeof bimg === 'string' ? '' : (bimg.about || bimg.d1 || '');
            const src = `/seo-voorbeeld?naam=${encodeURIComponent(b.volledig || b.naam)}&subdienst=${encodeURIComponent(sub)}&locatie=${encodeURIComponent(loc)}&sector=${encodeURIComponent(b.sector || '')}&navy=${encodeURIComponent(b.NAVY || NAVY)}&blue=${encodeURIComponent(b.BLUE || CYAN)}&tel=${encodeURIComponent(b.tel || '')}&email=${encodeURIComponent(b.email || '')}&logo=${encodeURIComponent(b.logo || '')}&werkgebied=${encodeURIComponent(b.werkgebied || '')}&diensten=${encodeURIComponent(seoDiensten)}&img=${encodeURIComponent(img1)}&img2=${encodeURIComponent(img2)}`;
            const slug = `${sub.toLowerCase().replace(/\s+/g, '-')}-${loc.toLowerCase()}`;
            return (
              <motion.div {...rise} className="avoid-break rounded-3xl p-8 md:p-9 mb-4" style={{ background: WHITE, border: `1px solid ${LINE}` }}>
                <Mono>Voorbeeld · zo ziet zo'n pagina eruit</Mono>
                <h3 className="font-bold mt-3 mb-4" style={{ fontFamily: FONT, color: INK, fontSize: '1.3rem' }}>{sub} {loc}</h3>
                <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${LINE}`, boxShadow: '0 16px 44px rgba(10,19,36,0.12)' }}>
                  <div className="flex items-center gap-2 px-4 py-2.5" style={{ background: NAVY }}>
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#FF5F57' }} /><span className="w-2.5 h-2.5 rounded-full" style={{ background: '#FEBC2E' }} /><span className="w-2.5 h-2.5 rounded-full" style={{ background: '#28C840' }} />
                    <span className="ml-2 text-[11px] px-3 py-1 rounded-md truncate" style={{ fontFamily: MONO, background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)' }}>{(b.site || 'uwsite.nl').replace(/^https?:\/\//, '')}/{slug}</span>
                  </div>
                  <div style={{ height: 470, overflow: 'hidden', display: 'flex', justifyContent: 'center' }}>
                    <div style={{ width: 714, height: 470, overflow: 'hidden', flexShrink: 0 }}>
                      <iframe title="SEO-voorbeeld" src={src} loading="lazy" style={{ width: 1400, height: 1000, border: 0, display: 'block', transformOrigin: 'top left', transform: 'scale(0.51)' }} />
                    </div>
                  </div>
                </div>
                <p className="text-sm mt-3" style={{ color: BODY }}>Zo'n pagina maken wij voor élke combinatie van (sub)dienst en plaats, met lokale content die aansluit op wat de klant in <strong>{loc}</strong> zoekt.</p>
              </motion.div>
            );
          })()}

          {/* Sitestructuur — duidelijke drill-down met voorbeeld (dienst → variant → variant × plaats) */}
          {(() => {
            const werk = (b.werkgebied || '').split(/[·,\/()]/).map((s) => s.trim()).filter(Boolean).slice(0, 5);
            const subs = (seo.voorbeelden || []).map((v) => v.trim().replace(/\s+\S+$/, '')).filter(Boolean);
            const uniqSubs = [...new Set(subs)].slice(0, 3);
            const hoofd = (Array.isArray(data.diensten) && data.diensten[0] && (data.diensten[0].title || data.diensten[0])) || (uniqSubs[0] || 'Uw dienst');
            const gekozen = uniqSubs[0] || hoofd;
            const plaats = werk[0] || 'uw plaats';
            const chip = (txt, st) => <span className="inline-block px-3 py-1.5 rounded-lg text-xs font-semibold" style={st}>{txt}</span>;
            const indent = { marginTop: 12, marginLeft: 10, paddingLeft: 16, borderLeft: `2px solid ${LINE}` };
            return (
              <motion.div {...rise} className="avoid-break rounded-3xl p-8 md:p-9 mb-4" style={{ background: BLUEBOX }}>
                <Mono>De sitestructuur groeit mee</Mono>
                <h3 className="font-bold mt-3 mb-5" style={{ fontFamily: FONT, color: INK, fontSize: '1.3rem' }}>Van één dienst naar honderden vindbare pagina's</h3>
                <div className="text-sm">
                  {chip('Home', { background: NAVY, color: '#fff' })}
                  <div style={indent}>
                    {chip('Diensten', { background: CYAN, color: NAVY })}
                    <div style={indent}>
                      {chip(hoofd, { background: NAVY, color: '#fff' })} <span className="text-xs" style={{ color: MUTED }}>de dienst</span>
                      <div style={indent}>
                        <div className="flex flex-wrap items-center gap-1.5">
                          {uniqSubs.map((s, i) => chip(s, s === gekozen
                            ? { background: CYAN, color: NAVY }
                            : { background: WHITE, color: INK, border: `1px solid ${LINE}` }))}
                          <span className="text-xs" style={{ color: MUTED }}>varianten per type/ruimte</span>
                        </div>
                        <div style={indent}>
                          <span className="text-xs mr-1.5" style={{ color: MUTED }}>{gekozen} in →</span>
                          {werk.map((w) => (
                            <span key={w} className="inline-block px-2.5 py-1 rounded-md text-[11px] mr-1.5 mb-1" style={{ fontFamily: MONO, background: WHITE, color: CYAN_D, border: `1px solid ${LINE}` }}>{gekozen} {w}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-6 p-4 rounded-2xl" style={{ background: WHITE, border: `1px solid ${LINE}` }}>
                    <p className="text-sm" style={{ color: INK }}>Voorbeeld: <strong>{hoofd}</strong> → <strong>{gekozen}</strong> → <strong>{gekozen} {plaats}</strong>. Zo iemand die in {plaats} zoekt, landt precies op de bijpassende pagina.</p>
                  </div>
                  <p className="text-sm mt-4" style={{ color: INK }}><strong>Elke maand 2 à 3 nieuwe pagina's</strong> (variant × plaats) + een <strong>helder maandrapport</strong> met de gemaakte pagina's en het resultaat (posities, verkeer, aanvragen). Zo bouwt uw lokale vindbaarheid zich maand na maand verder uit — en ziet u precies wat het oplevert.</p>
                </div>
              </motion.div>
            );
          })()}
        </section>
        )}

        {/* ══ DIENST-PAGINA · GOOGLE ADS (SEA) (weg zodra SEA uit de prijskaart is) ══ */}
        {!weg('sea') && (() => {
          const vb = (seo.voorbeelden && seo.voorbeelden[0]) || 'Gevelrenovatie Groningen';
          const parts = vb.trim().split(' '); const plaats = parts.pop(); const dienst = parts.join(' ');
          return (
            <DienstPagina no={secNo()} eyebrow="Direct bovenaan in Google" titel="Google Ads (SEA)" kop="Direct zichtbaar bij mensen die nú zoeken" intro={DETAILS.sea.intro} prijs={euro(620)} eenheid="/ mnd" punten={DETAILS.sea.punten}>
              <Mono className="mb-3">Zo ziet uw advertentie eruit in Google</Mono>
              <div className="rounded-2xl p-6 md:p-7" style={{ background: WHITE, border: `1px solid ${LINE}`, boxShadow: '0 10px 30px rgba(10,19,36,0.08)' }}>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-[11px] font-bold px-1.5 py-0.5 rounded" style={{ background: '#F1F3F4', color: INK }}>Advertentie</span>
                  <span className="text-xs" style={{ color: BODY }}>· {(b.site || 'uwsite.nl').replace(/^https?:\/\//, '')}</span>
                </div>
                <p className="font-medium text-lg leading-snug mb-1" style={{ color: '#1a0dab' }}>{dienst} {plaats} — {b.volledig}</p>
                <p className="text-sm leading-relaxed" style={{ color: BODY }}>Op zoek naar {(dienst || 'uw dienst').toLowerCase()} in {plaats}? ✓ Vakkundig ✓ Vrijblijvende offerte binnen 24 uur ✓ Actief in {plaats} e.o. Vraag nu direct aan.</p>
              </div>
              <p className="text-sm mt-4" style={{ color: BODY }}>Zo verschijnt u <strong>bovenaan de zoekresultaten</strong> op het moment dat iemand actief naar uw dienst zoekt. U betaalt alleen per klik en wij sturen doorlopend op de laagste kosten per aanvraag.</p>
            </DienstPagina>
          );
        })()}

        {/* ══ DIENST-PAGINA · SOCIAL MEDIA BEHEER (weg zodra de post is verwijderd) ══ */}
        {optioneel.some((o) => o.key === 'social') && !weg('social') && (
          <DienstPagina no={secNo()} eyebrow="Zichtbaar blijven bij uw doelgroep" titel="Social Media Beheer" kop="Doorlopend zichtbaar, zonder dat het u tijd kost" intro={DETAILS.social.intro} prijs={euro(socialPrijs)} eenheid="/ mnd" punten={DETAILS.social.punten}>
            <Mono className="mb-3">Wat wij maandelijks voor u doen</Mono>
            <div className="rounded-2xl p-6 md:p-7" style={{ background: WHITE, border: `1px solid ${LINE}`, boxShadow: '0 10px 30px rgba(10,19,36,0.08)' }}>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[['Content', 'Een vaste kalender met posts in uw huisstijl'], ['Offline design', 'Flyers, drukwerk en meer in dezelfde stijl'], ['Community', 'Wij reageren op reacties en berichten voor u'], ['Groei', 'Maandelijkse rapportage van bereik en volgers']].map(([t, d]) => (
                  <div key={t}><p className="font-semibold text-sm mb-1" style={{ fontFamily: FONT, color: INK }}>{t}</p><p className="text-xs leading-relaxed" style={{ color: BODY }}>{d}</p></div>
                ))}
              </div>
            </div>
            <div className="rounded-2xl p-6 mt-4" style={{ background: LIGHT, border: `1px solid ${LINE}` }}>
              <Mono className="mb-3">Op welke kanalen</Mono>
              <div className="flex flex-wrap items-center gap-2">
                {['Instagram', 'Facebook'].map((pf) => (
                  <span key={pf} className="text-xs font-semibold px-3 py-1.5 rounded-lg inline-flex items-center gap-1.5" style={{ background: NAVY, color: WHITE }}><Check className="w-3 h-3" style={{ color: CYAN }} /> {pf}</span>
                ))}
                <span className="text-xs" style={{ color: MUTED }}>inbegrepen</span>
                <span className="mx-1" style={{ color: LINE }}>·</span>
                {['YouTube Shorts', 'LinkedIn', 'TikTok'].map((pf) => (
                  <span key={pf} className="text-xs font-semibold px-3 py-1.5 rounded-lg" style={{ background: WHITE, color: INK, border: `1px solid ${LINE}` }}>{pf} <span style={{ color: CYAN }}>+€50/mnd</span></span>
                ))}
              </div>
            </div>
            <p className="text-sm mt-4" style={{ color: BODY }}>Zo blijft u <strong>top-of-mind</strong> bij mensen die u nu nog niet nodig hebben, maar u wél onthouden zodra dat moment er is.</p>
          </DienstPagina>
        )}

        {/* ══ PAGINA · WAAROM SEO + SEA SAMEN (alleen als SEO of SEA nog in het voorstel zit) ══ */}
        {(!weg('seo') || !weg('sea')) && (
        <section className="vpage px-10 md:px-14 py-14" style={{ background: WHITE }}>
          <div className="flex items-start justify-between mb-2">
            <Mono>1 + 1 = 3</Mono>
            <Mono color={MUTED}>{secNo()} · Waarom SEO + SEA samen</Mono>
          </div>
          <motion.h2 {...rise} className="font-bold mt-4 mb-5" style={{ fontFamily: FONT, color: INK, fontSize: 'clamp(1.45rem, 2.8vw, 2rem)', letterSpacing: '-0.025em' }}>De combinatie maakt het verschil</motion.h2>
          <p className="text-base leading-relaxed max-w-2xl mb-8" style={{ color: BODY }}>Los van elkaar hebben SEO en SEA allebei een zwakke plek. Sámen dekken ze elkaars nadeel af én versterken ze elkaar.</p>
          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <motion.div {...rise} className="p-7 rounded-3xl" style={{ background: LIGHT }}>
              <Mono className="mb-3">Alleen SEO</Mono>
              <p className="text-sm leading-relaxed" style={{ color: INK }}>Een langetermijnspel: u staat <strong>niet meteen bovenaan</strong>, dat duurt wat langer. Maar het levert wél sterke content en pagina's op die precies aansluiten op wat mensen zoeken — en die blijven werken.</p>
            </motion.div>
            <motion.div {...rise} transition={{ ...rise.transition, delay: 0.06 }} className="p-7 rounded-3xl" style={{ background: LIGHT }}>
              <Mono className="mb-3">Alleen SEA</Mono>
              <p className="text-sm leading-relaxed" style={{ color: INK }}>U staat <strong>meteen bovenaan</strong>, maar vaak zónder de bijpassende pagina. Zoekt iemand op dienst + plaats en komt die op een algemene dienstenpagina, dan voelt dat niet als een match — en haakt af.</p>
            </motion.div>
          </div>
          <motion.div {...rise} className="rounded-3xl p-8" style={{ background: NAVY, color: WHITE }}>
            <Mono color={CYAN} className="mb-3">Samen</Mono>
            <p className="text-base leading-relaxed" style={{ color: 'rgba(255,255,255,0.9)' }}>
              Door <strong style={{ color: '#fff' }}>direct bovenaan</strong> te staan op dat ene zoekwoord én de bezoeker meteen op de <strong style={{ color: '#fff' }}>bijpassende landingspagina</strong> te laten landen, ervaren mensen het als een match en een logische stap. In combinatie met een <strong style={{ color: '#fff' }}>professionele, conversiegerichte website</strong> zorgt dat uiteindelijk voor de aanvragen.
            </p>
            <div className="flex flex-wrap items-center gap-2 mt-6">
              {['Direct bovenaan (SEA)', 'Bijpassende pagina (SEO)', 'Conversiegerichte site', 'Aanvragen'].map((t, i) => (
                <React.Fragment key={t}>
                  {i > 0 && (i === 3
                    ? <span className="text-lg font-bold" style={{ color: CYAN }}>=</span>
                    : <span className="text-lg font-bold" style={{ color: CYAN }}>+</span>)}
                  <span className="text-xs font-semibold px-3 py-2 rounded-lg" style={{ background: i === 3 ? CYAN : 'rgba(255,255,255,0.1)', color: i === 3 ? NAVY : '#fff', border: i === 3 ? 'none' : `1px solid ${LINE_D}` }}>{t}</span>
                </React.Fragment>
              ))}
            </div>
          </motion.div>
        </section>
        )}

        </>)}
        {/* ══ einde DEEL 2 · MARKETING ══ */}

        {/* ══ PAGINA · CASE STUDIES (bewezen resultaten) ══ */}
        {!omit('cases') && CASES.length > 0 && (
        <section className="vpage px-10 md:px-14 py-14" style={{ background: WHITE }}>
          <div className="flex items-start justify-between mb-2">
            <Mono>Dit deden we voor anderen</Mono>
            <Mono color={MUTED}>{secNo()} · Resultaten</Mono>
          </div>
          <motion.h2 {...rise} className="font-bold mt-4 mb-5" style={{ fontFamily: FONT, color: INK, fontSize: 'clamp(1.45rem, 2.8vw, 2rem)', letterSpacing: '-0.025em' }}>Bewezen resultaten, geen beloftes</motion.h2>
          <p className="text-base leading-relaxed max-w-2xl mb-9" style={{ color: BODY }}>Hetzelfde systeem, marketing die verkeer binnenhaalt en een site die dat omzet in aanvragen, draait al bij deze ondernemers. Dit leverde het op:</p>
          <div className="space-y-5">
            {CASES.map((c, i) => (
              <motion.div key={i} {...rise} transition={{ ...rise.transition, delay: i * 0.05 }} className="avoid-break rounded-3xl overflow-hidden grid md:grid-cols-5" style={{ background: LIGHT, border: `1px solid ${LINE}` }}>
                <div className="md:col-span-2 p-7 flex flex-col justify-center">
                  <Mono color={MUTED} className="mb-3">{c.naam}</Mono>
                  <p className="font-bold leading-none" style={{ fontFamily: FONT, color: CYAN, fontSize: 'clamp(2.4rem, 5vw, 3rem)' }}>{c.metric}</p>
                  <p className="font-semibold text-sm mt-1.5 mb-3" style={{ color: INK }}>{c.unit}</p>
                  {c.hi && <p className="text-xs font-semibold mb-3 inline-flex items-center gap-1.5" style={{ color: '#0a7' }}><Check className="w-3.5 h-3.5" /> {c.hi}</p>}
                  <p className="text-xs leading-relaxed" style={{ fontFamily: MONO, color: MUTED }}>{c.setup}</p>
                </div>
                {c.screenshot && (
                  <div className="md:col-span-3 p-3 md:p-4 flex items-center" style={{ background: WHITE }}>
                    <div className="w-full rounded-2xl overflow-hidden" style={{ border: `1px solid ${LINE}`, boxShadow: '0 10px 30px rgba(10,19,36,0.08)' }}>
                      <img src={c.screenshot} alt={`Resultaat ${c.naam}`} className="w-full block" />
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </section>
        )}

        {/* ══ PAGINA 6 · INVESTERING & AKKOORD (licht + donkere prijskaart) ══ */}
        <section className="vpage px-10 md:px-14 py-14" style={{ background: WHITE }}>
          <div className="flex items-start justify-between mb-2">
            <Mono>Het overzicht</Mono>
            <Mono color={MUTED}>{secNo()} · Investering & akkoord</Mono>
          </div>
          <motion.h2 {...rise} className="font-bold mt-4 mb-8" style={{ fontFamily: FONT, color: INK, fontSize: 'clamp(1.45rem, 2.8vw, 2rem)', letterSpacing: '-0.025em' }}>
            Transparante investering — geen verborgen kosten.
          </motion.h2>

          {/* Donkere prijskaart — met aanvinkvakjes */}
          <motion.div {...rise} className="avoid-break rounded-3xl p-8 md:p-10" style={{ background: NAVY, color: WHITE }}>
            <div className="flex items-center justify-between mb-4">
              <Mono>{p.cardTitle || 'De website'}</Mono>
              <span className="no-print text-[10px] font-medium" style={{ fontFamily: MONO, color: 'rgba(255,255,255,0.4)' }}>Vink aan wat u wilt toevoegen ↓</span>
            </div>
            <PriceRow title={p.websiteLabel || "Custom website (tot 10 pagina's)"} sub={p.websiteSub || "Aanvraagflow, portfolio, dienstenpagina's, backend + CMS · V1 binnen 5 werkdagen"} prijs={euro(websitePrijs)} vast editable={admin} value={websitePrijs} onChange={setWebsitePrijs} onInfo={() => setDetail('website')} />
            {p.fotografie && !weg(p.fotografie.key) && (
              <CheckRow o={{ ...p.fotografie, label: labelVan({ ...p.fotografie, label: 'Professionele fotografie en video' }), sub: 'Fotoshoot on-location + één bedrijfsvideo — authentieke beelden voor uw site & social' }} eenheid="eenmalig" on={aan(p.fotografie.key)} onClick={() => toggle(p.fotografie.key)} onRemove={() => verwijder(p.fotografie.key)} onInfo={() => setDetail(p.fotografie.key)} editable={admin} value={prijsVan(p.fotografie)} onChange={(v) => setPrijs(p.fotografie.key, v)} onLabel={(v) => setLabel(p.fotografie.key, v)} />
            )}
            {heeftSea && !weg('sea-setup') && (
              <CheckRow o={{ ...SEA_SETUP, label: labelVan(SEA_SETUP) }} eenheid="eenmalig" on={aan('sea-setup')} onClick={() => toggle('sea-setup')} onRemove={() => verwijder('sea-setup')} onInfo={() => setDetail('sea-setup')} editable={admin} value={prijsVan(SEA_SETUP)} onChange={(v) => setPrijs('sea-setup', v)} onLabel={(v) => setLabel('sea-setup', v)} />
            )}
            {toegevoegd.filter((o) => o.eenmalig && !weg(o.key)).map((o) => (
              <CheckRow key={o.key} o={{ ...o, label: labelVan(o) }} eenheid="eenmalig" on={aan(o.key)} onClick={() => toggle(o.key)} onRemove={() => removeProduct(o.key)} editable={admin} value={prijsVan(o)} onChange={(v) => setPrijs(o.key, v)} onLabel={(v) => setLabel(o.key, v)} />
            ))}
            {admin && <AddProduct eenmalig onAdd={addProduct} />}

            <div className="h-px my-6" style={{ background: LINE_D }} />
            <Mono className="mb-4">Maandelijks · standaard inbegrepen</Mono>
            {p.inbegrepen.filter((o) => !weg(o.key)).map((o) => (
              <CheckRow key={o.key} o={{ ...o, label: labelVan(o) }} eenheid="/ mnd" on={aan(o.key)} onClick={() => toggle(o.key)} onRemove={() => verwijder(o.key)} onInfo={() => setDetail(o.key)} editable={admin} value={prijsVan(o)} onChange={(v) => setPrijs(o.key, v)} onLabel={(v) => setLabel(o.key, v)} />
            ))}

            <div className="h-px my-6" style={{ background: LINE_D }} />
            <Mono className="mb-4">Maandelijks · optioneel</Mono>
            {optioneel.filter((o) => !weg(o.key)).map((o) => (
              <CheckRow key={o.key} o={{ ...o, label: labelVan(o) }} eenheid="/ mnd" on={aan(o.key)} onClick={() => toggle(o.key)} onRemove={() => verwijder(o.key)} onInfo={() => setDetail(o.key)} editable={admin} value={prijsVan(o)} onChange={(v) => setPrijs(o.key, v)} onLabel={(v) => setLabel(o.key, v)} />
            ))}
            {toegevoegd.filter((o) => !o.eenmalig && !weg(o.key)).map((o) => (
              <CheckRow key={o.key} o={{ ...o, label: labelVan(o) }} eenheid="/ mnd" on={aan(o.key)} onClick={() => toggle(o.key)} onRemove={() => removeProduct(o.key)} editable={admin} value={prijsVan(o)} onChange={(v) => setPrijs(o.key, v)} onLabel={(v) => setLabel(o.key, v)} />
            ))}
            {admin && <AddProduct onAdd={addProduct} />}
            {p.extern && !weg('extern') && (
              <PriceRow title={p.extern.label} sub={p.extern.sub} prijs={`${p.extern.prefix || ''}${euro(p.extern.prijs)} / mnd`} dim onRemove={() => verwijder('extern')} onInfo={() => setDetail('extern')} />
            )}

            {verwijderdeItems.length > 0 && (
              <div className="no-print flex flex-wrap items-center gap-2 mt-5">
                <span className="text-[10px] font-bold uppercase tracking-widest" style={{ fontFamily: MONO, color: 'rgba(255,255,255,0.4)' }}>Verwijderd —</span>
                {verwijderdeItems.map((o) => (
                  <button key={o.key} onClick={() => herstel(o.key)} className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all hover:bg-white/10" style={{ border: `1px solid ${LINE_D}`, color: 'rgba(255,255,255,0.85)' }}>
                    <span style={{ color: CYAN, fontWeight: 800 }}>+</span> {o.label}
                  </button>
                ))}
              </div>
            )}

            <div className="h-px my-7" style={{ background: LINE_D }} />
            <div className="flex flex-col sm:flex-row justify-between gap-6">
              <div>
                <Mono color="rgba(255,255,255,0.5)" className="mb-2">Totaal eenmalig</Mono>
                <p className="font-bold" style={{ fontFamily: FONT, color: CYAN, fontSize: '2.6rem', lineHeight: 1 }}>{euro(totaalEenmalig)}</p>
              </div>
              <div className="sm:text-right">
                <Mono color="rgba(255,255,255,0.5)" className="mb-2">Maandelijks totaal</Mono>
                <p className="font-bold" style={{ fontFamily: FONT, color: CYAN, fontSize: '2.6rem', lineHeight: 1 }}>
                  {euro(totaalMaand)}<span className="text-lg font-medium" style={{ color: 'rgba(255,255,255,0.6)' }}> / mnd</span>
                </p>
              </div>
            </div>
            <div className="mt-5 flex items-start gap-2.5 rounded-2xl p-4" style={{ background: 'rgba(20,169,224,0.12)', border: `1px solid ${LINE_D}` }}>
              <CreditCard className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: CYAN }} />
              <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.82)' }}>
                <strong style={{ color: '#fff' }}>Betalen in termijnen.</strong> U betaalt niet alles vooraf, maar bijvoorbeeld de helft of een derde bij de start. In de praktijk staat uw website meestal al online vóórdat deze volledig is afbetaald.
              </p>
            </div>
            <p className="text-xs leading-relaxed mt-5" style={{ fontFamily: MONO, color: 'rgba(255,255,255,0.45)' }}>
              Excl. 21% btw{p.inbegrepen.length > 0 ? ' · onderhoud + GMB altijd inbegrepen' : ''}{(p.optioneel.length > 0 || p.fotografie) ? ' · SEO, Google Ads en fotografie & video optioneel' : ''}{p.extern ? ' · Google Ads budget staat los van MHS Media' : ''} · Eerste V1 binnen 5 werkdagen na onboarding
            </p>
          </motion.div>

          {/* Akkoord / handtekeningen */}
          <div className="avoid-break grid sm:grid-cols-2 gap-10 mt-14">
            <div>
              <Mono color={MUTED} className="mb-4">Namens MHS Media</Mono>
              <p style={{ fontFamily: SCRIPT, fontSize: '2.4rem', lineHeight: 1, color: INK }}>Morris Sanders</p>
              <div className="h-px my-3" style={{ background: LINE }} />
              <p className="font-semibold text-sm" style={{ color: INK }}>Morris Sanders</p>
              <p className="text-sm" style={{ color: BODY }}>Eigenaar · MHS Media</p>
              <p className="text-sm" style={{ color: BODY }}>Datum: {data.datum}</p>
            </div>
            <div>
              <Handtekening data={data} brand={b} />
              {/* Print-versie: klassieke handtekeningregel */}
              <div className="hidden print:block">
                <Mono color={MUTED} className="mb-4">Namens {b.volledig}</Mono>
                <div style={{ height: '2.4rem' }} />
                <div className="h-px my-3" style={{ background: LINE }} />
                <p className="font-semibold text-sm" style={{ color: INK }}>{data.clientSigner || b.volledig}</p>
                <p className="text-sm" style={{ color: BODY }}>Datum: __ / __ / {data.jaar}</p>
              </div>
            </div>
          </div>

          <p className="text-xs leading-relaxed mt-12" style={{ color: MUTED }}>
            Voorstel geldig t/m {data.geldigTot} · Excl. 21% btw{p.extern ? ` · Google Ads budget (v.a. ${euro(data.pricing.adspend ?? p.extern.prijs)}/mnd) rechtstreeks aan Google · SEO en Ads optioneel, maandelijks toe te voegen` : ''} · Vragen? morris@mhsmedia.nl · +31 6 17 78 57 80
          </p>

          <div className="no-print mt-10 flex flex-wrap gap-3">
            <button onClick={() => window.print()} className="flex items-center gap-2 text-sm font-semibold px-7 py-4 rounded-xl text-white transition-all hover:scale-105" style={{ background: CYAN }}>
              <Download className="w-4 h-4" /> Download voorstel als PDF
            </button>
            {b.conceptPath && (
              <a href={b.conceptPath} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm font-semibold px-7 py-4 rounded-xl border transition-all hover:bg-gray-50" style={{ borderColor: LINE, color: INK }}>
                Bekijk het concept <ExternalLink className="w-4 h-4" />
              </a>
            )}
          </div>
        </section>

        {/* Detail-"pagina" per prijs-onderdeel (pop-up) */}
        {detailData && (
          <div className="no-print" onClick={() => setDetail(null)} style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(6,12,24,0.72)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <motion.div initial={{ opacity: 0, y: 16, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} onClick={(e) => e.stopPropagation()}
              style={{ background: WHITE, borderRadius: 24, maxWidth: 620, width: '100%', maxHeight: '88vh', overflow: 'auto', boxShadow: '0 40px 90px rgba(0,0,0,0.4)' }}>
              <div style={{ background: NAVY, color: WHITE, padding: '28px 32px' }}>
                <div className="flex items-center justify-between">
                  <span style={{ fontFamily: MONO, fontSize: 11, color: CYAN, textTransform: 'uppercase', letterSpacing: '0.2em' }}>Onderdeel</span>
                  <button onClick={() => setDetail(null)} style={{ color: 'rgba(255,255,255,0.7)' }}><X className="w-5 h-5" /></button>
                </div>
                <h3 style={{ fontFamily: FONT, fontSize: '1.55rem', fontWeight: 700, marginTop: 8, letterSpacing: '-0.02em' }}>{detailData.kop}</h3>
                {detailData.prijs && <p style={{ fontFamily: FONT, marginTop: 8 }}><span style={{ fontSize: '2rem', fontWeight: 700, color: CYAN }}>{detailData.prijs}</span> <span style={{ color: 'rgba(255,255,255,0.6)' }}>{detailData.eenheid}</span></p>}
              </div>
              <div style={{ padding: '28px 32px' }}>
                {detailData.intro && <p style={{ color: BODY, lineHeight: 1.7, marginBottom: 20 }}>{detailData.intro}</p>}
                <div style={{ display: 'grid', gap: 12 }}>
                  {(detailData.punten || []).map((pt, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <Check className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: CYAN }} strokeWidth={3} />
                      <span style={{ color: INK, fontSize: 15, lineHeight: 1.55 }}>{pt}</span>
                    </div>
                  ))}
                </div>
                {detailData.isSeo && seo.voorbeelden && (
                  <div style={{ marginTop: 22 }}>
                    <p style={{ fontFamily: MONO, fontSize: 11, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 10 }}>Voorbeeldpagina's</p>
                    <div className="flex flex-wrap gap-2">
                      {seo.voorbeelden.map((v, i) => <span key={i} style={{ fontSize: 13, padding: '7px 12px', borderRadius: 10, background: BLUEBOX, color: INK }}>{v}</span>)}
                    </div>
                  </div>
                )}
                {detailData.fotos && (
                  <div style={{ marginTop: 22 }}>
                    <p style={{ fontFamily: MONO, fontSize: 11, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 10 }}>Voorbeelden uit ons portfolio</p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                      {detailData.fotos.slice(0, 6).map((src, i) => (
                        <div key={i} style={{ borderRadius: 10, overflow: 'hidden', aspectRatio: '4 / 3', background: LIGHT }}>
                          <img src={src} alt="" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {detailData.media === 'video' && (
                  <div style={{ marginTop: 22 }}>
                    <p style={{ fontFamily: MONO, fontSize: 11, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 10 }}>Voorbeelden van ons videowerk</p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                      {PORTFOLIO_VIDEO.slice(0, 3).map((v) => (
                        <a key={v.id} href={`https://youtu.be/${v.id}`} target="_blank" rel="noopener noreferrer" style={{ position: 'relative', borderRadius: 10, overflow: 'hidden', aspectRatio: '16 / 9', background: '#000', display: 'block' }}>
                          <img src={`https://i.ytimg.com/vi/${v.id}/hqdefault.jpg`} alt={v.title} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.85 }} />
                          <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <span style={{ width: 34, height: 34, borderRadius: '50%', background: 'rgba(255,255,255,0.92)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Play className="w-4 h-4" style={{ color: NAVY, marginLeft: 2 }} /></span>
                          </span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
                {detailData.fotos && (
                  <button onClick={() => { setDetail(null); setMediaOpen(true); }} className="mt-5 inline-flex items-center gap-2 text-sm font-semibold" style={{ fontFamily: MONO, color: CYAN_D }}>
                    Bekijk het volledige foto- & videowerk <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}

        {/* Portfolio-pop-up — MHS foto- & videowerk */}
        {mediaOpen && (
          <div className="no-print" onClick={() => { setMediaOpen(false); setPlaying(''); }} style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(6,12,24,0.82)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <motion.div initial={{ opacity: 0, y: 16, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} onClick={(e) => e.stopPropagation()}
              style={{ background: WHITE, borderRadius: 24, maxWidth: 960, width: '100%', maxHeight: '90vh', overflow: 'auto', boxShadow: '0 40px 90px rgba(0,0,0,0.4)' }}>
              <div className="flex items-center justify-between" style={{ padding: '22px 28px', borderBottom: `1px solid ${LINE}`, position: 'sticky', top: 0, background: WHITE, zIndex: 2 }}>
                <div>
                  <span style={{ fontFamily: MONO, fontSize: 11, color: CYAN_D, textTransform: 'uppercase', letterSpacing: '0.2em' }}>Ons werk</span>
                  <h3 style={{ fontFamily: FONT, fontSize: '1.3rem', fontWeight: 700, color: INK }}>Foto- & videografie portfolio</h3>
                </div>
                <button onClick={() => { setMediaOpen(false); setPlaying(''); }} style={{ color: MUTED }}><X className="w-5 h-5" /></button>
              </div>
              <div style={{ padding: 28 }}>
                {/* Videografie */}
                <div className="flex items-center gap-2" style={{ marginBottom: 14 }}>
                  <Play className="w-4 h-4" style={{ color: CYAN_D }} />
                  <span style={{ fontFamily: MONO, fontSize: 11, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.18em' }}>Videografie</span>
                </div>
                {playing && (
                  <div style={{ borderRadius: 16, overflow: 'hidden', marginBottom: 16, background: '#000', aspectRatio: '16 / 9' }}>
                    <iframe src={`https://www.youtube.com/embed/${playing}?autoplay=1`} title="Video" allow="autoplay; fullscreen; picture-in-picture" style={{ width: '100%', height: '100%', border: 0 }} />
                  </div>
                )}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 30 }}>
                  {PORTFOLIO_VIDEO.map((v) => (
                    <button key={v.id} onClick={() => setPlaying(v.id)} style={{ position: 'relative', borderRadius: 14, overflow: 'hidden', aspectRatio: '16 / 9', background: '#000', cursor: 'pointer', border: playing === v.id ? `2px solid ${CYAN}` : 'none' }}>
                      <img src={`https://i.ytimg.com/vi/${v.id}/hqdefault.jpg`} alt={v.title} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.9 }} />
                      <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,0.92)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Play className="w-5 h-5" style={{ color: NAVY, marginLeft: 2 }} /></span>
                      </span>
                    </button>
                  ))}
                </div>

                {/* Fotografie — per project */}
                <div className="flex items-center gap-2" style={{ marginBottom: 14 }}>
                  <Images className="w-4 h-4" style={{ color: CYAN_D }} />
                  <span style={{ fontFamily: MONO, fontSize: 11, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.18em' }}>Fotografie</span>
                </div>
                <div style={{ display: 'grid', gap: 26 }}>
                  {PORTFOLIO_FOTO.map((pr) => (
                    <ProjectCarousel key={pr.project} project={pr.project} sector={pr.sector} fotos={pr.fotos} />
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}

// min-knop om een product uit het overzicht te halen (niet geprint)
function RemoveBtn({ onRemove }) {
  if (!onRemove) return null;
  return (
    <button onClick={onRemove} title="Uit overzicht halen"
      className="no-print w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 transition-all hover:bg-white/10"
      style={{ border: '1px solid rgba(255,255,255,0.18)', color: 'rgba(255,255,255,0.55)' }}>
      <span style={{ fontSize: 17, lineHeight: 1, fontWeight: 700 }}>−</span>
    </button>
  );
}

// Foto-carousel per project (pijltjes + thumbnails) voor de portfolio-pop-up.
function ProjectCarousel({ project, sector, fotos }) {
  const [i, setI] = useState(0);
  const go = (d) => setI((v) => (v + d + fotos.length) % fotos.length);
  const navBtn = { position: 'absolute', top: '50%', transform: 'translateY(-50%)', width: 38, height: 38, borderRadius: '50%', background: 'rgba(255,255,255,0.92)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer', boxShadow: '0 4px 14px rgba(0,0,0,0.2)' };
  return (
    <div>
      <div className="flex items-baseline gap-2" style={{ marginBottom: 8 }}>
        <p style={{ fontFamily: FONT, fontWeight: 700, color: INK, fontSize: 15 }}>{project}</p>
        <span style={{ fontSize: 12, color: MUTED }}>· {sector}</span>
        <span style={{ marginLeft: 'auto', fontFamily: MONO, fontSize: 11, color: MUTED }}>{i + 1} / {fotos.length}</span>
      </div>
      <div style={{ position: 'relative', borderRadius: 14, overflow: 'hidden', aspectRatio: '16 / 10', background: LIGHT }}>
        <img src={fotos[i]} alt={project} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        <button onClick={() => go(-1)} style={{ ...navBtn, left: 10 }}><ChevronLeft className="w-5 h-5" style={{ color: NAVY }} /></button>
        <button onClick={() => go(1)} style={{ ...navBtn, right: 10 }}><ChevronRight className="w-5 h-5" style={{ color: NAVY }} /></button>
        <div style={{ position: 'absolute', bottom: 10, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 6 }}>
          {fotos.map((_, d) => <span key={d} onClick={() => setI(d)} style={{ width: 7, height: 7, borderRadius: '50%', background: d === i ? '#fff' : 'rgba(255,255,255,0.55)', cursor: 'pointer' }} />)}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 6, marginTop: 8, overflowX: 'auto' }}>
        {fotos.map((src, d) => (
          <button key={d} onClick={() => setI(d)} style={{ flexShrink: 0, width: 66, height: 46, borderRadius: 7, overflow: 'hidden', border: d === i ? `2px solid ${CYAN}` : '2px solid transparent', padding: 0, cursor: 'pointer', background: 'none' }}>
            <img src={src} alt="" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </button>
        ))}
      </div>
    </div>
  );
}

// Deel-banner bovenaan de eerste pagina van een deel (geen losse A4 meer) — geeft
// duidelijke structuur zonder een hele pagina te kosten.
function PartBanner({ nr, titel, sub }) {
  return (
    <div className="avoid-break rounded-2xl px-6 py-5 mb-9 flex items-center gap-5" style={{ background: NAVY, color: WHITE }}>
      <span className="flex-shrink-0 px-3 py-1.5 rounded-lg text-[11px] font-bold" style={{ background: CYAN, color: NAVY, fontFamily: MONO, letterSpacing: '0.12em', textTransform: 'uppercase' }}>{nr}</span>
      <div>
        <p className="font-bold" style={{ fontFamily: FONT, fontSize: '1.2rem', lineHeight: 1.15 }}>{titel}</p>
        {sub && <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.65)' }}>{sub}</p>}
      </div>
    </div>
  );
}

// Volledige A4-pagina per dienst (kop + intro + navy kaart met prijs & punten + media)
// Admin: eigen product toevoegen aan de prijskaart (naam + bedrag).
function AddProduct({ eenmalig, onAdd }) {
  const [open, setOpen] = useState(false);
  const [naam, setNaam] = useState('');
  const [prijs, setPrijs] = useState('');
  const submit = () => { if (!naam.trim()) return; onAdd({ label: naam.trim(), prijs: Number(prijs) || 0, eenmalig: !!eenmalig }); setNaam(''); setPrijs(''); setOpen(false); };
  if (!open) return (
    <button onClick={() => setOpen(true)} className="no-print flex items-center gap-1.5 text-[13px] font-semibold py-2" style={{ color: CYAN }}>
      <span style={{ fontWeight: 800 }}>+</span> Eigen product toevoegen ({eenmalig ? 'eenmalig' : 'maandelijks'})
    </button>
  );
  return (
    <div className="no-print flex flex-wrap items-center gap-2 py-2.5">
      <input autoFocus value={naam} onChange={(e) => setNaam(e.target.value)} placeholder="Naam van het product"
        onKeyDown={(e) => { if (e.key === 'Enter') submit(); }}
        className="flex-1 min-w-[160px] text-[14px] px-3 py-2 rounded-lg" style={{ fontFamily: FONT, background: 'rgba(255,255,255,0.1)', color: WHITE, border: `1px solid ${LINE_D}`, outline: 'none' }} />
      <span className="flex items-center gap-1" style={{ color: WHITE }}>€
        <input type="number" value={prijs} onChange={(e) => setPrijs(e.target.value)} placeholder="0"
          onKeyDown={(e) => { if (e.key === 'Enter') submit(); }}
          className="w-24 text-[14px] px-2 py-2 rounded-lg text-right" style={{ fontFamily: MONO, background: 'rgba(255,255,255,0.1)', color: WHITE, border: `1px solid ${LINE_D}`, outline: 'none' }} />
        <span className="text-xs" style={{ color: 'rgba(255,255,255,0.6)' }}>{eenmalig ? 'eenmalig' : '/ mnd'}</span>
      </span>
      <button onClick={submit} className="text-[13px] font-bold px-3 py-2 rounded-lg" style={{ background: CYAN, color: NAVY }}>Toevoegen</button>
      <button onClick={() => setOpen(false)} className="text-[13px] px-2 py-2 rounded-lg" style={{ color: 'rgba(255,255,255,0.6)' }}>Annuleren</button>
    </div>
  );
}

function DienstPagina({ no, eyebrow, titel, kop, intro, prijs, eenheid, punten, children }) {
  return (
    <section className="vpage px-10 md:px-14 py-14" style={{ background: WHITE }}>
      <div className="flex items-start justify-between mb-2">
        <Mono>{eyebrow}</Mono>
        <Mono color={MUTED}>{no} · {titel}</Mono>
      </div>
      <motion.h2 {...rise} className="font-bold mt-4 mb-4" style={{ fontFamily: FONT, color: INK, fontSize: 'clamp(1.45rem, 2.8vw, 2rem)', letterSpacing: '-0.025em' }}>{kop}</motion.h2>
      <p className="text-base leading-relaxed max-w-2xl mb-8" style={{ color: BODY }}>{intro}</p>
      <motion.div {...rise} className="avoid-break rounded-3xl p-8 md:p-9 mb-6" style={{ background: NAVY, color: WHITE }}>
        <div className="flex items-start justify-between gap-5 mb-5">
          <Mono color={CYAN}>{titel}</Mono>
          {prijs && (
            <div className="text-right shrink-0">
              <p className="font-bold" style={{ fontFamily: FONT, color: CYAN, fontSize: 'clamp(1.6rem, 3vw, 2rem)', lineHeight: 1 }}>{prijs}</p>
              {eenheid && <Mono color="rgba(255,255,255,0.5)">{eenheid === '/ mnd' ? 'per maand' : eenheid}</Mono>}
            </div>
          )}
        </div>
        <div className="grid sm:grid-cols-2 gap-x-8 gap-y-2.5">
          {(punten || []).map((pt, i) => (
            <div key={i} className="flex items-start gap-2.5">
              <Check className="w-4 h-4 mt-0.5 shrink-0" style={{ color: CYAN }} />
              <span className="text-sm leading-snug" style={{ color: 'rgba(255,255,255,0.82)' }}>{pt}</span>
            </div>
          ))}
        </div>
      </motion.div>
      {children}
    </section>
  );
}

// ⓘ-knop → opent de detail-"pagina" van dat onderdeel (niet geprint)
function InfoBtn({ onInfo }) {
  if (!onInfo) return null;
  return (
    <button onClick={onInfo} title="Bekijk details"
      className="no-print w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 transition-all hover:bg-white/10"
      style={{ border: '1px solid rgba(255,255,255,0.18)', color: 'rgba(255,255,255,0.6)' }}>
      <Info className="w-3.5 h-3.5" />
    </button>
  );
}

// Realistische na-bootsing van een Google-Bedrijfsprofiel (kenniskaart), voor het
// before/after-praktijkvoorbeeld. Zelfde typografie, gouden sterren, blauwe review-link
// en actie-knoppen als Google.
function GoogleProfielKaart({ reviews }) {
  const GF = "Arial, 'Roboto', 'Helvetica Neue', sans-serif";
  return (
    <div className="overflow-hidden" style={{ background: '#fff', fontFamily: GF, borderRadius: 12, border: '1px solid #dadce0', boxShadow: '0 8px 26px rgba(0,0,0,0.28)' }}>
      {/* fotostrip zoals Google */}
      <div style={{ display: 'flex', gap: 2, height: 84 }}>
        <div style={{ flex: 1.7, background: 'linear-gradient(135deg,#d3e5da,#a7c7b4)' }} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <div style={{ flex: 1, background: 'linear-gradient(135deg,#dde6ef,#bcccdd)' }} />
          <div style={{ flex: 1, background: 'linear-gradient(135deg,#4a4f54,#65696e)', position: 'relative' }}>
            <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 9, fontWeight: 600 }}>Foto's</span>
          </div>
        </div>
      </div>
      <div style={{ padding: '11px 14px 13px' }}>
        <p style={{ color: '#202124', fontSize: 19, lineHeight: 1.2 }}>Before we Meet</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 3 }}>
          <span style={{ color: '#70757a', fontSize: 13 }}>5,0</span>
          <span style={{ color: '#fbbc04', fontSize: 13, letterSpacing: 0.5 }}>★★★★★</span>
          <span style={{ color: '#1a73e8', fontSize: 13 }}>{reviews} Google-reviews</span>
        </div>
        <p style={{ color: '#70757a', fontSize: 12.5, marginTop: 4 }}>Centrum voor zwangerschapsbegeleiding · Voorburg</p>
        <div style={{ display: 'flex', gap: 16, marginTop: 12, color: '#1a73e8' }}>
          {[[Navigation, 'Route'], [Bookmark, 'Opslaan'], [Globe, 'Website'], [Phone, 'Bellen']].map(([Ic, l]) => (
            <div key={l} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 32, height: 32, borderRadius: '50%', border: '1px solid #dadce0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Ic style={{ width: 15, height: 15 }} /></span>
              <span style={{ fontSize: 10.5 }}>{l}</span>
            </div>
          ))}
        </div>
        <div style={{ height: 1, background: '#e8eaed', margin: '12px 0' }} />
        <p style={{ fontSize: 12.5, color: '#202124' }}><span style={{ color: '#188038' }}>Open</span> <span style={{ color: '#70757a' }}>· Sluit om 17:00</span></p>
        <p style={{ fontSize: 12.5, color: '#70757a', marginTop: 3 }}>Kon. Wilhelminalaan 539a, Voorburg</p>
      </div>
    </div>
  );
}

// Compact praktijkvoorbeeld met tabs (bij de start · na ons beheer) + de methode.
function GmbVoorbeeld() {
  const [tab, setTab] = React.useState('na');
  const reviews = tab === 'na' ? 364 : 19;
  const STAPPEN = [
    ['Profiel juist ingericht', 'Juiste categorieën, diensten, foto\'s en openingstijden.'],
    ['Regelmatig posts', 'Elke week een Google-post met een update of actie.'],
    ['Review-card op kantoor', 'Fysieke QR-kaart bij de balie: in één tik een review.'],
    ['Actief reviewmanagement', 'Elke klant om review vragen en op álles reageren.'],
  ];
  return (
    <motion.div {...rise} className="avoid-break rounded-3xl mt-6 p-6 md:p-7" style={{ background: NAVY, color: WHITE }}>
      <div className="flex items-end justify-between flex-wrap gap-3 mb-5">
        <div>
          <Mono color={CYAN} className="mb-1.5">Voorbeeld uit de praktijk</Mono>
          <h3 className="font-bold" style={{ fontFamily: FONT, fontSize: 'clamp(1.2rem, 2.4vw, 1.55rem)' }}>Van 19 naar 364 reviews</h3>
        </div>
        <p className="text-[13px]" style={{ color: 'rgba(255,255,255,0.7)' }}>Zelfde 5,0-score · <strong style={{ color: CYAN }}>+345 reviews</strong></p>
      </div>
      <div className="grid md:grid-cols-[290px_1fr] gap-6 md:gap-8 items-start">
        <div>
          <div className="flex gap-1 mb-3 p-1 rounded-xl" style={{ background: 'rgba(255,255,255,0.07)' }}>
            {[['start', 'Bij de start · 19'], ['na', 'Na ons beheer · 364']].map(([k, l]) => (
              <button key={k} onClick={() => setTab(k)} className="flex-1 text-[11.5px] font-semibold py-2 rounded-lg transition-all"
                style={tab === k ? { background: CYAN, color: NAVY } : { color: 'rgba(255,255,255,0.65)' }}>{l}</button>
            ))}
          </div>
          <GoogleProfielKaart reviews={reviews} />
        </div>
        <div>
          <p className="text-sm leading-relaxed mb-4" style={{ color: 'rgba(255,255,255,0.82)' }}>Dit profiel begon met 19 reviews en een 5,0. Wij lieten het groeien naar 364 reviews — met behoud van die topscore — via vier stappen:</p>
          <div className="grid sm:grid-cols-2 gap-2">
            {STAPPEN.map(([t, d], i) => (
              <div key={t} className="flex items-start gap-2.5 rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${LINE_D}` }}>
                <span className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-[11px] font-bold" style={{ background: 'rgba(20,169,224,0.18)', color: CYAN }}>{i + 1}</span>
                <p className="text-[12px] leading-snug" style={{ color: 'rgba(255,255,255,0.85)' }}><strong style={{ color: '#fff' }}>{t}.</strong> {d}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// vaste/inbegrepen/externe prijsrij binnen de donkere kaart
function PriceRow({ title, sub, prijs, dim, inbegrepen, onRemove, onInfo, editable, value, onChange }) {
  const [editing, setEditing] = useState(false);
  return (
    <div className="group flex items-start justify-between gap-4 py-2.5">
      <div className="flex items-start gap-3">
        {inbegrepen && <Check className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: CYAN }} strokeWidth={3} />}
        <div>
          <p className="font-semibold text-[15px]" style={{ fontFamily: FONT, color: dim ? 'rgba(255,255,255,0.9)' : WHITE }}>{title}</p>
          {sub && <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.45)' }}>{sub}</p>}
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        {editable && editing ? (
          <span className="no-print flex items-center gap-1">
            <span style={{ fontFamily: MONO, color: WHITE }}>€</span>
            <input
              type="number" autoFocus value={value}
              onChange={(e) => onChange(Number(e.target.value) || 0)}
              onBlur={() => setEditing(false)}
              onKeyDown={(e) => { if (e.key === 'Enter') setEditing(false); }}
              className="w-24 px-2 py-1 rounded-md text-[15px] font-semibold text-right"
              style={{ fontFamily: MONO, background: 'rgba(255,255,255,0.12)', color: WHITE, border: `1px solid ${CYAN}`, outline: 'none' }}
            />
          </span>
        ) : (
          <span className="flex items-center gap-1.5">
            <p className="whitespace-nowrap font-semibold text-[15px]" style={{ fontFamily: MONO, color: dim ? 'rgba(255,255,255,0.6)' : WHITE }}>{prijs}</p>
            {editable && (
              <button
                type="button" onClick={() => setEditing(true)} title="Prijs aanpassen"
                className="no-print opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md"
                style={{ color: CYAN }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}>
                <PenLine className="w-3.5 h-3.5" />
              </button>
            )}
          </span>
        )}
        <InfoBtn onInfo={onInfo} />
        <RemoveBtn onRemove={onRemove} />
      </div>
    </div>
  );
}

// aanvinkbare optionele prijsrij (klik = toevoegen aan totaal; min = uit overzicht)
function CheckRow({ o, eenheid, on, onClick, onRemove, onInfo, editable, value, onChange, onLabel }) {
  const [editing, setEditing] = useState(false);
  const [editLabel, setEditLabel] = useState(false);
  const prijs = value != null ? value : o.prijs;
  return (
    <div className="w-full flex items-start justify-between gap-3 py-2.5 group">
      <button onClick={editLabel ? undefined : onClick} className="flex items-start gap-3 text-left flex-1 min-w-0 transition-colors">
        <span className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5 transition-all"
          style={on ? { background: CYAN } : { border: '2px solid rgba(255,255,255,0.28)' }}>
          {on && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
        </span>
        <div className="min-w-0 flex-1">
          {editable && onLabel && editLabel ? (
            <input autoFocus value={o.label} onClick={(e) => e.stopPropagation()} onChange={(e) => onLabel(e.target.value)}
              onBlur={() => setEditLabel(false)} onKeyDown={(e) => { if (e.key === 'Enter') setEditLabel(false); }}
              className="no-print w-full font-semibold text-[15px] px-2 py-1 rounded-md"
              style={{ fontFamily: FONT, background: 'rgba(255,255,255,0.12)', color: WHITE, border: `1px solid ${CYAN}`, outline: 'none' }} />
          ) : (
            <p className="font-semibold text-[15px] transition-colors inline-flex items-center gap-1.5" style={{ fontFamily: FONT, color: on ? WHITE : 'rgba(255,255,255,0.82)' }}>
              {o.label}
              {editable && onLabel && <span role="button" tabIndex={0} onClick={(e) => { e.stopPropagation(); setEditLabel(true); }} title="Naam aanpassen" className="no-print opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: CYAN, cursor: 'pointer' }}><PenLine className="w-3 h-3" /></span>}
            </p>
          )}
          {o.sub && <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.45)' }}>{o.sub}</p>}
        </div>
      </button>
      <div className="flex items-center gap-2 flex-shrink-0">
        {editable && editing ? (
          <span className="no-print flex items-center gap-1">
            <span style={{ fontFamily: MONO, color: WHITE }}>€</span>
            <input type="number" autoFocus value={prijs}
              onChange={(e) => onChange(Number(e.target.value) || 0)}
              onBlur={() => setEditing(false)}
              onKeyDown={(e) => { if (e.key === 'Enter') setEditing(false); }}
              className="w-20 px-2 py-1 rounded-md text-[15px] font-semibold text-right"
              style={{ fontFamily: MONO, background: 'rgba(255,255,255,0.12)', color: WHITE, border: `1px solid ${CYAN}`, outline: 'none' }} />
            <span className="text-xs" style={{ color: 'rgba(255,255,255,0.6)' }}>{eenheid}</span>
          </span>
        ) : (
          <span className="flex items-center gap-1.5">
            <p className="whitespace-nowrap font-semibold text-[15px]" style={{ fontFamily: MONO, color: on ? CYAN : 'rgba(255,255,255,0.6)' }}>{euro(prijs)} {eenheid}</p>
            {editable && (
              <button type="button" onClick={() => setEditing(true)} title="Prijs aanpassen"
                className="no-print opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md" style={{ color: CYAN }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}>
                <PenLine className="w-3.5 h-3.5" />
              </button>
            )}
          </span>
        )}
        <InfoBtn onInfo={onInfo} />
        <RemoveBtn onRemove={onRemove} />
      </div>
    </div>
  );
}
