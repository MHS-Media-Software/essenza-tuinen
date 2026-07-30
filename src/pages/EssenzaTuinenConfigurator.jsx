import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowUpRight, ArrowRight, Search, Trash2, RotateCcw, Map as MapIcon, Box, Wand2, Upload, Download, Save, User as UserIcon, LogIn, Copy, FolderOpen,
  CheckCircle, Check, Plus, Phone, MapPin, Info, Sparkles, X, Camera,
  Grid2x2, Sprout, Flower2, Rows3, Waves, Droplets, Fence, Columns3, TreePine, Warehouse, Building2, Square, PenTool,
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { BRAND, Footer, BASE } from './EssenzaTuinen';

const { NAVY, BLUE, BLUE_D, SOFT, LIGHT, WHITE, INK, MUTED, LINE, LINE_D, FONT_H, FONT_B } = BRAND;
const MINT = BRAND.MINT || BLUE;

// Eenvoudige layout: vaste kop met logo + terug-link, en de Hoveniers-footer eronder.
// (De configurator is een losse, volledige pagina.)
function Layout({ children }) {
  return (
    <div style={{ fontFamily: FONT_B, background: WHITE, minHeight: '100vh' }}>
      <header className="sticky top-0 z-50" style={{ background: WHITE, borderBottom: `1px solid ${LINE}` }}>
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between" style={{ height: 68 }}>
          <Link to={BASE || '/'} className="flex items-center gap-2.5">
            {BRAND.logo
              ? <img src={BRAND.logo} alt={BRAND.volledig} style={{ height: 34, objectFit: 'contain' }} />
              : (<>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm" style={{ background: BLUE, color: WHITE, fontFamily: FONT_H }}>{(BRAND.naam || 'H').slice(0, 2).toUpperCase()}</div>
                  <p className="font-extrabold text-lg" style={{ fontFamily: FONT_H, color: NAVY }}>{BRAND.naam} <span style={{ color: BLUE }}>{BRAND.naam2}</span></p>
                </>)}
          </Link>
          <Link to={BASE || '/'} className="text-sm font-bold inline-flex items-center gap-1.5" style={{ color: BLUE }}>Terug naar de website</Link>
        </div>
      </header>
      {children}
      <Footer />
    </div>
  );
}

// ── Tuinelementen (footprint + prijs per tier + icoon) ───────────────────────
const ELEMENTS = [
  { key: 'terras',   label: 'Terras / bestrating', icon: Grid2x2,  unit: 'm2', color: '#B9B1A3', hz: 0.12, w: 4,   d: 3,   prijs: { budget: 80,  standaard: 130, premium: 190 } },
  { key: 'gazon',    label: 'Gazon',               icon: Sprout,   unit: 'm2', color: '#6BB149', hz: 0.05, w: 5,   d: 4,   prijs: { budget: 15,  standaard: 28,  premium: 45  } },
  { key: 'border',   label: 'Beplanting / border', icon: Flower2,  unit: 'm2', color: '#3E7D34', hz: 0.5,  w: 4,   d: 1.2, prijs: { budget: 45,  standaard: 75,  premium: 120 } },
  { key: 'vlonder',  label: 'Vlonder (hardhout)',  icon: Rows3,    unit: 'm2', color: '#A56C3C', hz: 0.26, w: 3,   d: 3,   prijs: { budget: 150, standaard: 220, premium: 320 } },
  { key: 'vijver',   label: 'Vijver',              icon: Waves,    unit: 'm2', color: '#3E7CA8', hz: 0,    w: 3,   d: 2,   prijs: { budget: 120, standaard: 180, premium: 260 } },
  { key: 'zwembad',  label: 'Zwembad',             icon: Droplets, unit: 'm2', color: '#2E9FC0', hz: 0,    w: 6,   d: 3,   prijs: { budget: 450, standaard: 750, premium: 1150 } },
  { key: 'schutting', label: 'Schutting',          icon: Fence,    unit: 'm',  color: '#7A5433', hz: 1.8,  w: 4,   d: 0.2, prijs: { budget: 90,  standaard: 140, premium: 200 } },
  { key: 'pergola',  label: 'Pergola / overkapping', icon: Columns3, unit: 'm2', color: '#8A5E38', hz: 2.3, w: 4,  d: 3,   prijs: { budget: 130, standaard: 190, premium: 280 } },
  { key: 'boom',     label: 'Boom',                icon: TreePine, unit: 'stuk', color: '#2F6B2A', hz: 3.4, w: 1.6, d: 1.6, prijs: { budget: 150, standaard: 300, premium: 600 } },
  { key: 'tuinhuis', label: 'Tuinhuis / berging',  icon: Warehouse, unit: 'm2', color: '#C9BCA0', hz: 2.0,  w: 3,   d: 2.5, prijs: { budget: 320, standaard: 520, premium: 820 } },
  { key: 'gebouw',   label: 'Bestaand gebouw / huis', icon: Building2, unit: 'info', color: '#9AA0A6', hz: 2.7, w: 4,   d: 3,   prijs: { budget: 0, standaard: 0, premium: 0 } },
];
const DEF = Object.fromEntries(ELEMENTS.map(e => [e.key, e]));

const TIERS = [
  { key: 'budget',    label: 'Budget',    sub: 'Degelijk & functioneel' },
  { key: 'standaard', label: 'Standaard', sub: 'De gulden middenweg' },
  { key: 'premium',   label: 'Premium',   sub: 'Hoogwaardig maatwerk' },
];
const PRESETS = [
  { label: 'Klein', w: 8, d: 10 },
  { label: 'Normaal', w: 12, d: 15 },
  { label: 'Groot', w: 20, d: 25 },
];

const euro = (n) => '€ ' + Math.round(n).toLocaleString('nl-NL');
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
function shade(hex, f) {
  const n = parseInt(hex.slice(1), 16);
  let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  r = Math.min(255, Math.round(r * f)); g = Math.min(255, Math.round(g * f)); b = Math.min(255, Math.round(b * f));
  return `rgb(${r},${g},${b})`;
}
// Categorieën die als vrije vorm (m²-vlak) getekend kunnen worden.
const SHAPE_CATS = ['terras', 'gazon', 'border', 'vlonder', 'vijver', 'zwembad'];
function polyArea(pts) {
  let a = 0; for (let i = 0; i < pts.length; i++) { const [x1, y1] = pts[i], [x2, y2] = pts[(i + 1) % pts.length]; a += x1 * y2 - x2 * y1; }
  return Math.abs(a) / 2;
}
function polyBBox(pts) {
  const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
  return { x0: Math.min(...xs), y0: Math.min(...ys), x1: Math.max(...xs), y1: Math.max(...ys) };
}
function polyCentroid(pts) { let x = 0, y = 0; pts.forEach(p => { x += p[0]; y += p[1]; }); return [x / pts.length, y / pts.length]; }
function pointInPoly(px, py, pts) {
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const xi = pts[i][0], yi = pts[i][1], xj = pts[j][0], yj = pts[j][1];
    if (((yi > py) !== (yj > py)) && (px < (xj - xi) * (py - yi) / (yj - yi) + xi)) inside = !inside;
  }
  return inside;
}
function itemArea(it) { return it.kind === 'shape' ? polyArea(it.points) : it.w * it.d; }

function itemPrice(it, tier) {
  const def = DEF[it.type]; if (!def) return 0;
  if (def.unit === 'info') return 0;
  // Gekozen materiaal (uit de backend) bepaalt de prijs; anders de tier-schatting.
  const unitP = it.materiaal ? it.materiaal.prijs : def.prijs[tier];
  if (it.kind === 'shape') return itemArea(it) * unitP;
  if (def.unit === 'm2') return it.w * it.d * unitP;
  if (def.unit === 'm') return Math.max(it.w, it.d) * unitP;
  return unitP;
}
function itemHoeveelheid(it) {
  const def = DEF[it.type];
  if (it.kind === 'shape') return `${itemArea(it).toFixed(1)} m² (vrije vorm)`;
  if (def.unit === 'info') return 'bestaand';
  if (def.unit === 'm2') return `${(it.w * it.d).toFixed(1)} m²`;
  if (def.unit === 'm') return `${Math.max(it.w, it.d).toFixed(1)} m`;
  return '1 stuk';
}

// ── Tuinvorm: rechthoek of L-vorm (hoektuin met uitsparing in een hoek) ──────
// cfg = null (rechthoek) of { corner:'ne'|'nw'|'se'|'sw', cw, cd }
function cutRect(W, D, cfg) {
  if (!cfg) return null;
  const cw = Math.min(cfg.cw, W - 1), cd = Math.min(cfg.cd, D - 1);
  const x0 = cfg.corner.includes('w') ? 0 : W - cw;
  const x1 = cfg.corner.includes('w') ? cw : W;
  const y0 = cfg.corner.includes('n') ? 0 : D - cd;
  const y1 = cfg.corner.includes('n') ? cd : D;
  return { x0, y0, x1, y1 };
}
function lPolygon(W, D, cfg) {
  const r = cutRect(W, D, cfg); if (!r) return [[0, 0], [W, 0], [W, D], [0, D]];
  const { x0, y0, x1, y1 } = r;
  switch (cfg.corner) {
    case 'ne': return [[0, 0], [x0, 0], [x0, y1], [W, y1], [W, D], [0, D]];
    case 'nw': return [[x1, 0], [W, 0], [W, D], [0, D], [0, y1], [x1, y1]];
    case 'se': return [[0, 0], [W, 0], [W, y0], [x0, y0], [x0, D], [0, D]];
    default:   return [[0, 0], [W, 0], [W, D], [x1, D], [x1, y0], [0, y0]]; // sw
  }
}
// Duw een element uit de hoek-uitsparing (minimale verplaatsing, binnen de grenzen)
function resolveCut(x, y, w, d, r, W, D) {
  if (!r) return [x, y];
  const overlaps = x < r.x1 && x + w > r.x0 && y < r.y1 && y + d > r.y0;
  if (!overlaps) return [x, y];
  const cand = [];
  if (r.x0 - w >= 0) cand.push(['x', r.x0 - w]);
  if (r.x1 <= W - w) cand.push(['x', r.x1]);
  if (r.y0 - d >= 0) cand.push(['y', r.y0 - d]);
  if (r.y1 <= D - d) cand.push(['y', r.y1]);
  if (!cand.length) return [x, y];
  let best = null, bd = 1e9;
  for (const [ax, v] of cand) { const dist = ax === 'x' ? Math.abs(v - x) : Math.abs(v - y); if (dist < bd) { bd = dist; best = [ax, v]; } }
  return best[0] === 'x' ? [best[1], y] : [x, best[1]];
}
// Plattegrond → PNG (conditioning-beeld voor de AI-render). Duidelijke kleurvlakken
// met donkere contour per element zodat het model de indeling goed leest.
function planToDataUrl(items, plotW, plotD, cutCfg) {
  const MAX = 900;
  const scale = Math.min(MAX / plotW, MAX / plotD);
  const w = Math.max(1, Math.round(plotW * scale)), h = Math.max(1, Math.round(plotD * scale));
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d');
  g.fillStyle = '#86BF54'; g.fillRect(0, 0, w, h); // gazon-basis
  items.forEach(it => {
    const def = DEF[it.type];
    g.fillStyle = def.color; g.lineWidth = 3; g.strokeStyle = 'rgba(0,0,0,0.55)';
    if (it.kind === 'shape') {
      g.beginPath(); it.points.forEach((p, i) => { const px = p[0] * scale, py = p[1] * scale; i ? g.lineTo(px, py) : g.moveTo(px, py); });
      g.closePath(); g.fill(); g.stroke();
    } else {
      const x = it.x * scale, y = it.y * scale, ew = it.w * scale, ed = it.d * scale;
      g.fillRect(x, y, ew, ed); g.strokeRect(x, y, ew, ed);
    }
  });
  const r = cutRect(plotW, plotD, cutCfg);
  if (r) { // hoekuitsparing = buiten de tuin
    g.fillStyle = '#3A3F44'; g.fillRect(r.x0 * scale, r.y0 * scale, (r.x1 - r.x0) * scale, (r.y1 - r.y0) * scale);
  }
  return c.toDataURL('image/png');
}

// Tekstuele indelingsbeschrijving (helpt het model met de posities)
function planDescription(items, plotW, plotD) {
  const posH = (cx) => cx < plotW / 3 ? 'links' : cx < 2 * plotW / 3 ? 'in het midden' : 'rechts';
  const posV = (cy) => cy < plotD / 3 ? 'achterin' : cy < 2 * plotD / 3 ? 'centraal' : 'vooraan';
  return items.map(it => {
    const def = DEF[it.type];
    if (it.kind === 'shape') {
      const c = polyCentroid(it.points);
      return `- ${def.label} als organisch, vrij gevormd vlak ${posV(c[1])} ${posH(c[0])} (${polyArea(it.points).toFixed(0)} m², vloeiende gebogen randen — geen rechte hoeken)`;
    }
    const cx = it.x + it.w / 2, cy = it.y + it.d / 2;
    const size = def.unit === 'm2' ? `${(it.w * it.d).toFixed(0)} m²` : def.unit === 'm' ? `${Math.max(it.w, it.d).toFixed(0)} m` : '';
    return `- ${def.label} ${posV(cy)} ${posH(cx)}${size ? ` (${size})` : ''}`;
  }).join('\n');
}

// Foto → verkleinde dataURL (voor upload van de huidige tuin)
function fileToDataUrl(file, maxDim = 1280) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDim || height > maxDim) { const s = maxDim / Math.max(width, height); width = Math.round(width * s); height = Math.round(height * s); }
        const cv = document.createElement('canvas'); cv.width = width; cv.height = height;
        cv.getContext('2d').drawImage(img, 0, 0, width, height);
        resolve(cv.toDataURL('image/jpeg', 0.85));
      };
      img.onerror = reject; img.src = reader.result;
    };
    reader.onerror = reject; reader.readAsDataURL(file);
  });
}

// 2D-textuur per element (subtiel patroon zodat het herkenbaar is)
function pat2d(def) {
  if (def.key === 'terras') return { backgroundImage: `linear-gradient(rgba(0,0,0,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.12) 1px, transparent 1px)`, backgroundSize: '11px 11px' };
  if (def.key === 'vlonder') return { backgroundImage: `repeating-linear-gradient(90deg, rgba(0,0,0,0.16) 0 1px, transparent 1px 9px)` };
  if (def.key === 'gazon') return { backgroundImage: `repeating-linear-gradient(90deg, rgba(255,255,255,0.14) 0 10px, transparent 10px 20px)` };
  if (def.key === 'schutting') return { backgroundImage: `repeating-linear-gradient(90deg, rgba(0,0,0,0.22) 0 1px, transparent 1px 5px)` };
  return null;
}

// Vrije maatvoering: houdt een ruwe invoerstring vast en commit (geklemd) pas bij
// blur/Enter. Voorkomt de "typ 10 → wordt 30"-bug (klemmen tijdens typen).
function DimInput({ value, onCommit, min = 3, max = 60, className, style }) {
  const [raw, setRaw] = useState(String(value));
  useEffect(() => { setRaw(String(value)); }, [value]);
  const commit = () => { const n = Math.round(+raw); onCommit(isNaN(n) || raw === '' ? value : clamp(n, min, max)); };
  return (
    <input type="number" inputMode="numeric" min={min} max={max} value={raw}
      onChange={e => setRaw(e.target.value)} onBlur={commit}
      onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur(); }}
      className={className} style={style} />
  );
}

// Plattegrond + stuklijst → printbaar venster (op schaal, "Opslaan als PDF" via print).
function exportPlanPDF({ items, plotW, plotD, cutCfg, tier, totals, adres }) {
  const plan = planToDataUrl(items, plotW, plotD, cutCfg);
  const tierLabel = TIERS.find(t => t.key === tier).label;
  const rows = items.map(it => `<tr><td>${DEF[it.type].label}${it.materiaal ? ` — ${it.materiaal.naam}` : ''}</td><td>${itemHoeveelheid(it)}</td><td style="text-align:right">${DEF[it.type].unit === 'info' ? '—' : euro(itemPrice(it, tier))}</td></tr>`).join('');
  const w = window.open('', '_blank'); if (!w) return;
  w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Tuinontwerp Essenza Tuinen</title>
    <style>
      *{font-family:-apple-system,Segoe UI,Roboto,sans-serif;color:#1F2113;box-sizing:border-box}
      body{margin:0;padding:28px}h1{font-size:20px;margin:0 0 2px}.sub{color:#6B7060;font-size:13px;margin:0 0 16px}
      img{width:100%;max-width:640px;border:1px solid #E6E8DC;border-radius:8px;display:block;margin-bottom:6px}
      .scale{font-size:11px;color:#6B7060;margin-bottom:16px}
      table{width:100%;border-collapse:collapse;font-size:13px}td{padding:6px 4px;border-bottom:1px solid #E6E8DC}
      .tot{display:flex;justify-content:space-between;margin-top:12px;padding:12px;background:#F5F7EE;border-radius:8px;font-weight:700}
      .foot{color:#6B7060;font-size:11px;margin-top:14px}
      @media print{body{padding:0}}
    </style></head><body>
    <h1>Tuinontwerp</h1><p class="sub">Essenza Tuinen · ${adres?.naam ? adres.naam + ' · ' : ''}${plotW} × ${plotD} m${cutCfg ? ' (L-vorm)' : ''}</p>
    <img src="${plan}"/><p class="scale">Plattegrond op schaal · elk raster­vakje = 1 × 1 meter</p>
    <table><thead><tr><td><b>Onderdeel</b></td><td><b>Hoeveelheid</b></td><td style="text-align:right"><b>Richtprijs</b></td></tr></thead><tbody>${rows}</tbody></table>
    <div class="tot"><span>Totale richtprijs · ${tierLabel}</span><span>${euro(totals[tier])}</span></div>
    <p class="foot">Indicatief en exclusief btw. De definitieve offerte stellen wij op na een schouw.</p>
    <script>window.onload=function(){setTimeout(function(){window.print();},250);}</script></body></html>`);
  w.document.close();
}

// ── Opslaan + klantaccount modal (account niet verplicht) ────────────────────
function SaveAccountModal({ open, onClose, account, designToken, onSave, onAuth }) {
  const [mode, setMode] = useState('choose'); // choose | register | login | done
  const [email, setEmail] = useState(''); const [pw, setPw] = useState('');
  const [busy, setBusy] = useState(false); const [err, setErr] = useState(''); const [link, setLink] = useState(''); const [copied, setCopied] = useState(false);
  useEffect(() => { if (open) { setMode('choose'); setErr(''); setLink(''); setPw(''); setCopied(false); } }, [open]);
  if (!open) return null;
  const finish = (token) => { setLink(`${window.location.origin}${BASE}/configurator?d=${token}`); setMode('done'); };
  const doSave = async (withEmail) => { setBusy(true); setErr(''); try { const t = await onSave(withEmail); finish(t); } catch (e) { setErr(e.message || 'Mislukt'); } setBusy(false); };
  const doAuthSave = async (action) => {
    setBusy(true); setErr('');
    try { await onAuth(action, email.trim().toLowerCase(), pw); const t = await onSave(); finish(t); }
    catch (e) { setErr(e.message || 'Mislukt'); } setBusy(false);
  };
  const inp = 'w-full px-4 py-3 text-sm rounded-xl border outline-none';
  const inpStyle = { borderColor: LINE, background: WHITE, color: INK };
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4" style={{ background: 'rgba(15,16,9,0.75)', backdropFilter: 'blur(4px)' }} onClick={onClose}>
      <div className="w-full max-w-md rounded-3xl overflow-hidden" style={{ background: WHITE, fontFamily: FONT_B, maxHeight: '90vh' }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between gap-4 p-5 border-b" style={{ borderColor: LINE }}>
          <div className="flex items-center gap-2.5"><div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: SOFT }}><Save className="w-4 h-4" style={{ color: BLUE }} /></div>
            <p className="font-semibold" style={{ fontFamily: FONT_H, color: NAVY }}>Ontwerp bewaren</p></div>
          <button onClick={onClose} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: LIGHT, color: NAVY }}><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5 overflow-y-auto">
          {mode === 'done' && (
            <div>
              <div className="flex items-center gap-2 mb-3"><CheckCircle className="w-5 h-5" style={{ color: BLUE }} /><p className="font-semibold" style={{ color: NAVY }}>Uw ontwerp is bewaard{account.authed ? ' in uw account' : ''}.</p></div>
              <p className="text-xs mb-2" style={{ color: MUTED }}>Bewaar deze link om later verder te werken:</p>
              <div className="flex gap-2 mb-4">
                <input readOnly value={link} className={inp} style={{ ...inpStyle, fontSize: 12 }} onFocus={e => e.target.select()} />
                <button onClick={() => { navigator.clipboard?.writeText(link); setCopied(true); }} className="px-3 rounded-xl flex items-center gap-1.5 text-xs font-bold flex-shrink-0" style={{ background: SOFT, color: BLUE_D }}><Copy className="w-3.5 h-3.5" /> {copied ? 'Gekopieerd' : 'Kopieer'}</button>
              </div>
              {!account.authed && <p className="text-[12px] mb-3" style={{ color: MUTED }}>Tip: maak een account aan zodat u niet afhankelijk bent van deze link. U kunt dan altijd inloggen en verder werken.</p>}
              <button onClick={onClose} className="w-full py-3 text-sm font-bold rounded-xl text-white" style={{ background: BLUE }}>Klaar</button>
            </div>
          )}
          {mode !== 'done' && account.authed && (
            <div>
              <p className="text-sm mb-4" style={{ color: MUTED }}>Opslaan in uw account <b style={{ color: NAVY }}>{account.email}</b>. U kunt later inloggen en verder werken.</p>
              {err && <p className="text-xs mb-3" style={{ color: '#C0392B' }}>{err}</p>}
              <button onClick={() => doSave()} disabled={busy} className="w-full py-3.5 text-sm font-bold rounded-xl text-white disabled:opacity-50" style={{ background: BLUE }}>{busy ? 'Opslaan…' : 'Opslaan in mijn account'}</button>
            </div>
          )}
          {mode === 'choose' && !account.authed && (
            <div>
              <p className="text-sm mb-4" style={{ color: MUTED }}>Bewaar uw ontwerp zodat u er later mee verder kunt. Maak een account aan, of bewaar met een link.</p>
              <button onClick={() => setMode('register')} className="w-full flex items-center gap-3 p-3.5 rounded-xl mb-2 text-left" style={{ border: `1px solid ${BLUE}`, background: SOFT }}>
                <UserIcon className="w-5 h-5" style={{ color: BLUE }} /><span><span className="block text-sm font-bold" style={{ color: NAVY }}>Account aanmaken</span><span className="block text-[11px]" style={{ color: MUTED }}>Altijd terug te vinden, ook op een ander apparaat</span></span></button>
              <button onClick={() => setMode('login')} className="w-full flex items-center gap-3 p-3.5 rounded-xl mb-2 text-left" style={{ border: `1px solid ${LINE}` }}>
                <LogIn className="w-5 h-5" style={{ color: MUTED }} /><span><span className="block text-sm font-bold" style={{ color: NAVY }}>Ik heb al een account</span><span className="block text-[11px]" style={{ color: MUTED }}>Inloggen en opslaan</span></span></button>
              <button onClick={() => doSave()} disabled={busy} className="w-full flex items-center gap-3 p-3.5 rounded-xl text-left disabled:opacity-50" style={{ border: `1px solid ${LINE}` }}>
                <Save className="w-5 h-5" style={{ color: MUTED }} /><span><span className="block text-sm font-bold" style={{ color: NAVY }}>{busy ? 'Opslaan…' : 'Alleen bewaren met een link'}</span><span className="block text-[11px]" style={{ color: MUTED }}>Geen account, u krijgt een terugkeer-link</span></span></button>
              {err && <p className="text-xs mt-3" style={{ color: '#C0392B' }}>{err}</p>}
            </div>
          )}
          {(mode === 'register' || mode === 'login') && !account.authed && (
            <div>
              <p className="text-sm mb-4" style={{ color: MUTED }}>{mode === 'register' ? 'Maak een account aan met uw e-mailadres en een wachtwoord.' : 'Log in met uw e-mailadres en wachtwoord.'}</p>
              <input type="email" placeholder="E-mailadres" value={email} onChange={e => setEmail(e.target.value)} className={inp + ' mb-2'} style={inpStyle} />
              <input type="password" placeholder="Wachtwoord (min. 6 tekens)" value={pw} onChange={e => setPw(e.target.value)} className={inp + ' mb-3'} style={inpStyle} />
              {err && <p className="text-xs mb-3" style={{ color: '#C0392B' }}>{err}</p>}
              <button onClick={() => doAuthSave(mode === 'register' ? 'register' : 'login')} disabled={busy || !email || pw.length < 6} className="w-full py-3.5 text-sm font-bold rounded-xl text-white disabled:opacity-40 mb-2" style={{ background: BLUE }}>
                {busy ? 'Bezig…' : (mode === 'register' ? 'Account aanmaken & opslaan' : 'Inloggen & opslaan')}</button>
              <button onClick={() => setMode('choose')} className="w-full py-2 text-xs font-semibold" style={{ color: MUTED }}>← Terug</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── "Mijn ontwerpen" modal (voor ingelogde klant) ────────────────────────────
function MineModal({ open, onClose, onOpenDesign }) {
  const [list, setList] = useState(null);
  useEffect(() => { if (open) { setList(null); fetch('/api/designs?mine=1').then(r => r.json()).then(d => setList(d.ok ? d.designs : [])).catch(() => setList([])); } }, [open]);
  if (!open) return null;
  const openOne = async (token) => { const d = await (await fetch('/api/designs?token=' + encodeURIComponent(token))).json(); if (d.ok && d.design) { onOpenDesign(d.design.data, token); onClose(); } };
  const del = async (token) => { await fetch('/api/designs', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token }) }); setList(l => l.filter(x => x.token !== token)); };
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4" style={{ background: 'rgba(15,16,9,0.75)', backdropFilter: 'blur(4px)' }} onClick={onClose}>
      <div className="w-full max-w-md rounded-3xl overflow-hidden" style={{ background: WHITE, fontFamily: FONT_B, maxHeight: '90vh' }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between gap-4 p-5 border-b" style={{ borderColor: LINE }}>
          <p className="font-semibold" style={{ fontFamily: FONT_H, color: NAVY }}>Mijn ontwerpen</p>
          <button onClick={onClose} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: LIGHT, color: NAVY }}><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5 overflow-y-auto">
          {list === null && <p className="text-sm py-6 text-center" style={{ color: MUTED }}>Laden…</p>}
          {list && list.length === 0 && <p className="text-sm py-8 text-center" style={{ color: MUTED }}>U heeft nog geen opgeslagen ontwerpen.</p>}
          <div className="space-y-2">
            {list && list.map(d => (
              <div key={d.token} className="flex items-center gap-3 p-3 rounded-xl" style={{ border: `1px solid ${LINE}` }}>
                <FolderOpen className="w-5 h-5 flex-shrink-0" style={{ color: BLUE }} />
                <div className="flex-1 min-w-0"><p className="text-sm font-bold truncate" style={{ color: NAVY }}>{d.naam || 'Tuinontwerp'}</p><p className="text-[11px]" style={{ color: MUTED }}>{new Date(d.updated).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' })}</p></div>
                <button onClick={() => openOne(d.token)} className="text-xs font-bold px-3 py-1.5 rounded-lg text-white" style={{ background: BLUE }}>Openen</button>
                <button onClick={() => del(d.token)} className="text-xs font-bold px-2 py-1.5 rounded-lg" style={{ color: '#C0392B' }}><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

let _uid = 1;

export default function HoverniersConfigurator() {
  const [step, setStep] = useState(0);
  const [postcode, setPostcode] = useState('');
  const [huisnr, setHuisnr] = useState('');
  const [adres, setAdres] = useState(null);
  const [zoekLoad, setZoekLoad] = useState(false);
  const [zoekErr, setZoekErr] = useState('');
  const [plotW, setPlotW] = useState(12);
  const [plotD, setPlotD] = useState(15);
  const [cutCfg, setCutCfg] = useState(null); // null = rechthoek · {corner,cw,cd} = L-vorm

  const [items, setItems] = useState([]);
  const [sel, setSel] = useState(null);
  const [tier, setTier] = useState('standaard');
  const [view, setView] = useState('2d');
  const [catalog, setCatalog] = useState({});   // {categorie: [product]} uit de backend
  const [past, setPast] = useState([]);          // undo-historie (JSON-snapshots)
  const [drawCat, setDrawCat] = useState(null);  // actieve vrije-vorm categorie (pen-tool) of null

  useEffect(() => {
    fetch('/api/products').then(r => r.json()).then(d => {
      if (d && d.ok) { const by = {}; d.products.forEach(p => { (by[p.categorie] = by[p.categorie] || []).push(p); }); setCatalog(by); }
    }).catch(() => {});
  }, []);
  const pushHist = () => setPast(p => [...p.slice(-49), JSON.stringify(items)]);
  const undo = () => setPast(p => { if (!p.length) return p; setItems(JSON.parse(p[p.length - 1])); setSel(null); return p.slice(0, -1); });
  const setMateriaal = (id, mat) => { pushHist(); setItems(l => l.map(it => it.id === id ? { ...it, materiaal: mat } : it)); };

  // ── Klantaccount + ontwerp opslaan/laden ──────────────────────────────────
  const [account, setAccount] = useState({ authed: false, email: null });
  const [designToken, setDesignToken] = useState(null);
  const [saveModal, setSaveModal] = useState(false);
  const [mineModal, setMineModal] = useState(false);

  const applyDesign = (data, token) => {
    if (data.items) { setItems(data.items); _uid = data.items.reduce((m, i) => Math.max(m, i.id || 0), 0) + 1; }
    if (data.plotW) setPlotW(data.plotW); if (data.plotD) setPlotD(data.plotD);
    setCutCfg(data.cutCfg || null); if (data.tier) setTier(data.tier); if (data.adres) setAdres(data.adres);
    setDesignToken(token || null); setStep(1);
  };
  useEffect(() => {
    fetch('/api/account').then(r => r.json()).then(d => { if (d && d.ok) setAccount({ authed: !!d.authed, email: d.email }); }).catch(() => {});
    const t = new URLSearchParams(window.location.search).get('d');
    if (t) fetch('/api/designs?token=' + encodeURIComponent(t)).then(r => r.json()).then(d => { if (d && d.ok && d.design && d.design.data) applyDesign(d.design.data, t); }).catch(() => {});
  }, []);
  const saveDesign = async (email) => {
    const body = { token: designToken || undefined, data: { items, plotW, plotD, cutCfg, tier, adres }, naam: adres?.naam || 'Mijn tuinontwerp', email };
    const d = await (await fetch('/api/designs', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })).json();
    if (d && d.ok) { setDesignToken(d.token); return d.token; } throw new Error(d && d.error || 'Opslaan mislukt');
  };
  const doAuth = async (action, email, password) => {
    const d = await (await fetch('/api/account', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, email, password }) })).json();
    if (d && d.ok) { setAccount({ authed: true, email: d.email }); return d.email; } throw new Error(d && d.error || 'Mislukt');
  };
  const logout = async () => { await fetch('/api/account', { method: 'DELETE' }); setAccount({ authed: false, email: null }); };

  const stappen = ['Uw kavel', 'Ontwerp', 'Offerte'];

  const zoekKavel = async () => {
    if (!postcode.trim()) { setZoekErr('Vul uw postcode in.'); return; }
    setZoekLoad(true); setZoekErr(''); setAdres(null);
    try {
      const q = `${postcode.trim()} ${huisnr.trim()}`.trim();
      const r = await fetch(`https://api.pdok.nl/bzk/locatieserver/search/v3_1/free?fq=type:adres&rows=1&q=${encodeURIComponent(q)}`);
      const j = await r.json();
      const doc = j?.response?.docs?.[0];
      if (!doc) throw new Error('geen adres');
      setAdres({ naam: doc.weergavenaam, gemeente: doc.gemeentenaam });
    } catch {
      setZoekErr('Wij konden dit adres niet vinden. Vul de afmetingen hieronder handmatig in.');
    }
    setZoekLoad(false);
  };

  const addItem = (key) => {
    pushHist();
    const def = DEF[key];
    setItems(l => {
      const off = (l.length % 6) * 1.1;
      const w = Math.min(def.w, plotW), d = Math.min(def.d, plotD);
      let x = clamp(1 + off, 0, Math.max(0, plotW - w)), y = clamp(1 + off, 0, Math.max(0, plotD - d));
      [x, y] = resolveCut(x, y, w, d, cutRect(plotW, plotD, cutCfg), plotW, plotD);
      const it = { id: _uid++, type: key, w, d, x, y };
      setSel(it.id);
      return [...l, it];
    });
  };
  const delItem = (id) => { pushHist(); setItems(l => l.filter(i => i.id !== id)); setSel(s => s === id ? null : s); };
  const wisAlles = () => { if (items.length) pushHist(); setItems([]); setSel(null); };

  // Vrije vorm (pen-tool): voeg een getekend, met een materiaal gevuld vlak toe.
  const addShape = (cat, points) => {
    if (!points || points.length < 3) return;
    pushHist();
    const it = { id: _uid++, kind: 'shape', type: cat, points };
    setItems(l => [...l, it]);
    setSel(it.id); setDrawCat(null);
  };

  // Bij het wijzigen van het tuinformaat: elementen binnen de nieuwe grenzen houden
  const setPlot = (w, d) => {
    const nw = clamp(w, 3, 60), nd = clamp(d, 3, 60);
    setPlotW(nw); setPlotD(nd);
    setItems(l => l.map(it => {
      if (it.kind === 'shape') return { ...it, points: it.points.map(p => [clamp(p[0], 0, nw), clamp(p[1], 0, nd)]) };
      const iw = Math.min(it.w, nw), id = Math.min(it.d, nd);
      return { ...it, w: iw, d: id, x: clamp(it.x, 0, nw - iw), y: clamp(it.y, 0, nd - id) };
    }));
  };

  const totals = Object.fromEntries(TIERS.map(t => [t.key, items.reduce((s, it) => s + itemPrice(it, t.key), 0)]));
  const _cr = cutRect(plotW, plotD, cutCfg);
  const netArea = Math.round(plotW * plotD - (_cr ? (_cr.x1 - _cr.x0) * (_cr.y1 - _cr.y0) : 0));

  return (
    <Layout solidNav>
      <div style={{ background: LIGHT, fontFamily: FONT_B }}>
        <section className="pt-28 pb-8" style={{ background: NAVY }}>
          <div className="max-w-7xl mx-auto px-6 md:px-8">
            <p className="text-[11px] font-bold uppercase tracking-[0.3em] mb-2" style={{ color: MINT }}>Ontwerp je eigen tuin</p>
            <h1 className="font-semibold text-white mb-2" style={{ fontFamily: FONT_H, fontSize: 'clamp(1.5rem, 2.8vw, 2.2rem)', letterSpacing: '-0.02em' }}>De 3D-tuinconfigurator</h1>
            <p className="text-[15px] max-w-2xl" style={{ color: 'rgba(255,255,255,0.72)' }}>Bepaal uw kavel, sleep tuinelementen op de plattegrond, bekijk uw tuin in 3D en breng het ontwerp met AI tot leven. U ontvangt direct een prijsindicatie op maat.</p>
            <div className="flex items-center gap-0 mt-7 max-w-lg">
              {stappen.map((s, i) => (
                <React.Fragment key={s}>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all"
                      style={i <= step ? { background: BLUE, color: WHITE } : { background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)' }}>
                      {i < step ? <Check className="w-4 h-4" /> : i + 1}
                    </div>
                    <span className="text-[12px] font-semibold hidden sm:block" style={{ color: i <= step ? WHITE : 'rgba(255,255,255,0.5)' }}>{s}</span>
                  </div>
                  {i < stappen.length - 1 && <div className="flex-1 h-0.5 mx-3 rounded" style={{ background: i < step ? BLUE : 'rgba(255,255,255,0.15)' }} />}
                </React.Fragment>
              ))}
            </div>
          </div>
        </section>

        <section className="py-10 md:py-12">
          <div className="max-w-7xl mx-auto px-6 md:px-8">
            <AnimatePresence mode="wait">
              {step === 0 && (
                <motion.div key="kavel" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}
                  className="grid lg:grid-cols-2 gap-8 items-start">
                  <div className="p-7 md:p-9 rounded-3xl" style={{ background: WHITE, border: `1px solid ${LINE}` }}>
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5" style={{ background: SOFT }}><MapPin className="w-5 h-5" style={{ color: BLUE }} /></div>
                    <h2 className="font-semibold mb-2" style={{ fontFamily: FONT_H, color: NAVY, fontSize: '1.3rem' }}>Waar ligt uw tuin?</h2>
                    <p className="text-sm leading-relaxed mb-6" style={{ color: MUTED }}>Vul uw postcode en huisnummer in. Wij halen uw adres op via het Kadaster en u bevestigt de afmetingen.</p>
                    <div className="grid grid-cols-3 gap-3 mb-3">
                      <input value={postcode} onChange={e => setPostcode(e.target.value)} placeholder="Postcode" className="col-span-2 px-4 py-3.5 text-sm rounded-xl border outline-none" style={{ borderColor: LINE, background: WHITE, color: INK }} />
                      <input value={huisnr} onChange={e => setHuisnr(e.target.value)} placeholder="Nr." className="px-4 py-3.5 text-sm rounded-xl border outline-none" style={{ borderColor: LINE, background: WHITE, color: INK }} />
                    </div>
                    <button onClick={zoekKavel} disabled={zoekLoad} className="w-full flex items-center justify-center gap-2 py-3.5 text-sm font-bold rounded-xl text-white transition-all hover:opacity-90 disabled:opacity-50" style={{ background: BLUE }}>
                      {zoekLoad ? <><span className="w-4 h-4 border-2 rounded-full animate-spin" style={{ borderColor: 'rgba(255,255,255,0.4)', borderTopColor: WHITE }} /> Zoeken…</> : <><Search className="w-4 h-4" /> Zoek mijn kavel</>}
                    </button>
                    {zoekErr && <p className="text-xs mt-3" style={{ color: '#C0392B' }}>{zoekErr}</p>}
                    {adres && (
                      <div className="mt-4 p-4 rounded-2xl flex items-start gap-3" style={{ background: SOFT }}>
                        <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: BLUE }} />
                        <div><p className="text-sm font-bold" style={{ color: NAVY }}>{adres.naam}</p><p className="text-xs" style={{ color: MUTED }}>{adres.gemeente ? `Gemeente ${adres.gemeente} · ` : ''}kavel gevonden</p></div>
                      </div>
                    )}
                    <div className="flex items-start gap-2 mt-5 text-[11px]" style={{ color: MUTED }}><Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" /> Adres via het Kadaster / PDOK. De exacte perceelgrenzen bevestigen wij bij de schouw.</div>
                  </div>

                  <div className="p-7 md:p-9 rounded-3xl" style={{ background: WHITE, border: `1px solid ${LINE}` }}>
                    <h2 className="font-semibold mb-2" style={{ fontFamily: FONT_H, color: NAVY, fontSize: '1.3rem' }}>Afmetingen van de tuin</h2>
                    <p className="text-sm leading-relaxed mb-5" style={{ color: MUTED }}>Kies een formaat of vul de exacte maten in. U kunt dit tijdens het ontwerpen altijd nog aanpassen.</p>
                    <div className="flex flex-wrap gap-2 mb-5">
                      {PRESETS.map(p => (
                        <button key={p.label} onClick={() => setPlot(p.w, p.d)} className="px-4 py-2 rounded-full text-xs font-bold transition-all"
                          style={plotW === p.w && plotD === p.d ? { background: BLUE, color: WHITE } : { background: LIGHT, color: MUTED, border: `1px solid ${LINE}` }}>{p.label} · {p.w}×{p.d}m</button>
                      ))}
                    </div>
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <label className="block"><span className="text-[11px] font-bold uppercase tracking-[0.2em]" style={{ color: MUTED }}>Breedte (m)</span>
                        <DimInput value={plotW} onCommit={v => setPlot(v, plotD)} className="w-full mt-1.5 px-4 py-3 text-sm rounded-xl border outline-none" style={{ borderColor: LINE, background: WHITE, color: INK }} /></label>
                      <label className="block"><span className="text-[11px] font-bold uppercase tracking-[0.2em]" style={{ color: MUTED }}>Diepte (m)</span>
                        <DimInput value={plotD} onCommit={v => setPlot(plotW, v)} className="w-full mt-1.5 px-4 py-3 text-sm rounded-xl border outline-none" style={{ borderColor: LINE, background: WHITE, color: INK }} /></label>
                    </div>
                    {/* Tuinvorm: rechthoek of L-vorm (hoektuin) */}
                    <div className="mb-5">
                      <span className="text-[11px] font-bold uppercase tracking-[0.2em]" style={{ color: MUTED }}>Tuinvorm</span>
                      <div className="flex gap-2 mt-2">
                        <button onClick={() => setCutCfg(null)} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all" style={!cutCfg ? { background: BLUE, color: WHITE } : { background: LIGHT, color: MUTED, border: `1px solid ${LINE}` }}><Square className="w-3.5 h-3.5" /> Rechthoek</button>
                        <button onClick={() => setCutCfg(c => c || { corner: 'ne', cw: Math.min(4, plotW - 2), cd: Math.min(4, plotD - 2) })} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all" style={cutCfg ? { background: BLUE, color: WHITE } : { background: LIGHT, color: MUTED, border: `1px solid ${LINE}` }}><PenTool className="w-3.5 h-3.5" /> L-vorm (hoektuin)</button>
                      </div>
                      {cutCfg && (
                        <div className="mt-3 p-3.5 rounded-xl" style={{ background: LIGHT }}>
                          <p className="text-[11px] font-semibold mb-2" style={{ color: MUTED }}>In welke hoek zit de uitsparing (bv. het huis of de buren)?</p>
                          <div className="grid grid-cols-2 gap-1.5 mb-3" style={{ maxWidth: 200 }}>
                            {[['nw', 'Linksachter'], ['ne', 'Rechtsachter'], ['sw', 'Linksvoor'], ['se', 'Rechtsvoor']].map(([cn, lbl]) => (
                              <button key={cn} onClick={() => setCutCfg(c => ({ ...c, corner: cn }))} className="py-2 rounded-lg text-[11px] font-bold transition-all" style={cutCfg.corner === cn ? { background: BLUE, color: WHITE } : { background: WHITE, color: MUTED, border: `1px solid ${LINE}` }}>{lbl}</button>
                            ))}
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <label className="block"><span className="text-[10px] font-bold uppercase tracking-wide" style={{ color: MUTED }}>Uitsparing breedte</span>
                              <input type="number" min={1} max={plotW - 1} value={cutCfg.cw} onChange={e => setCutCfg(c => ({ ...c, cw: clamp(+e.target.value || 0, 1, plotW - 1) }))} className="w-full mt-1 px-3 py-2 text-sm rounded-lg border outline-none" style={{ borderColor: LINE, background: WHITE, color: INK }} /></label>
                            <label className="block"><span className="text-[10px] font-bold uppercase tracking-wide" style={{ color: MUTED }}>Uitsparing diepte</span>
                              <input type="number" min={1} max={plotD - 1} value={cutCfg.cd} onChange={e => setCutCfg(c => ({ ...c, cd: clamp(+e.target.value || 0, 1, plotD - 1) }))} className="w-full mt-1 px-3 py-2 text-sm rounded-lg border outline-none" style={{ borderColor: LINE, background: WHITE, color: INK }} /></label>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="p-4 rounded-2xl mb-6 flex items-center justify-between" style={{ background: LIGHT }}>
                      <span className="text-sm font-semibold" style={{ color: NAVY }}>Tuinoppervlakte</span>
                      <span className="text-lg font-bold" style={{ fontFamily: FONT_H, color: BLUE }}>{netArea.toLocaleString('nl-NL')} m²</span>
                    </div>
                    <button onClick={() => setStep(1)} className="w-full flex items-center justify-center gap-2 py-3.5 text-sm font-bold rounded-xl text-white transition-all hover:scale-[1.02]" style={{ background: BLUE }}>
                      Begin met ontwerpen <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              )}

              {step === 1 && (
                <motion.div key="ontwerp" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
                  {/* Account + opslaan-balk */}
                  <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
                    <div className="flex items-center gap-2 text-sm">
                      {account.authed ? (
                        <>
                          <span style={{ color: MUTED }}>Ingelogd als <b style={{ color: NAVY }}>{account.email}</b></span>
                          <button onClick={() => setMineModal(true)} className="font-bold" style={{ color: BLUE }}>Mijn ontwerpen</button>
                          <span style={{ color: LINE }}>·</span>
                          <button onClick={logout} className="font-semibold" style={{ color: MUTED }}>Uitloggen</button>
                        </>
                      ) : (
                        <button onClick={() => setSaveModal(true)} className="font-bold inline-flex items-center gap-1.5" style={{ color: BLUE }}><UserIcon className="w-4 h-4" /> Inloggen / account aanmaken</button>
                      )}
                    </div>
                    <button onClick={() => setSaveModal(true)} disabled={items.length === 0} className="inline-flex items-center gap-2 text-sm font-bold px-5 py-2.5 rounded-xl transition-all disabled:opacity-30" style={{ background: SOFT, color: BLUE_D }}><Save className="w-4 h-4" /> Ontwerp opslaan{designToken ? ' (opgeslagen)' : ''}</button>
                  </div>
                  <Ontwerper plotW={plotW} plotD={plotD} setPlot={setPlot} cutCfg={cutCfg} items={items} setItems={setItems} sel={sel} setSel={setSel}
                    view={view} setView={setView} addItem={addItem} delItem={delItem} wisAlles={wisAlles}
                    catalog={catalog} setMateriaal={setMateriaal} pushHist={pushHist} undo={undo} canUndo={past.length > 0}
                    drawCat={drawCat} setDrawCat={setDrawCat} addShape={addShape}
                    tier={tier} setTier={setTier} totals={totals} adres={adres} onTerug={() => setStep(0)} onVerder={() => setStep(2)} />
                </motion.div>
              )}

              {step === 2 && (
                <motion.div key="offerte" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
                  <OfferteStap items={items} tier={tier} setTier={setTier} totals={totals} adres={adres} plotW={plotW} plotD={plotD} cutCfg={cutCfg} netArea={netArea} onTerug={() => setStep(1)} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>
      </div>
      <SaveAccountModal open={saveModal} onClose={() => setSaveModal(false)} account={account} designToken={designToken} onSave={saveDesign} onAuth={doAuth} />
      <MineModal open={mineModal} onClose={() => setMineModal(false)} onOpenDesign={applyDesign} />
    </Layout>
  );
}

// ── Ontwerp-stap ─────────────────────────────────────────────────────────────
function Ontwerper({ plotW, plotD, setPlot, cutCfg, items, setItems, sel, setSel, view, setView, addItem, delItem, wisAlles, catalog = {}, setMateriaal, pushHist, undo, canUndo, drawCat, setDrawCat, addShape, tier, setTier, totals, adres, onTerug, onVerder }) {
  const selItem = items.find(i => i.id === sel) || null;
  const selMats = selItem ? (catalog[selItem.type] || []) : [];
  const wrapRef = useRef(null);
  const canvasRef = useRef(null);
  const [cw, setCw] = useState(720);
  const maxH = 520;
  const pxPerM = Math.min(cw / plotW, maxH / plotD);
  const canPxW = plotW * pxPerM, canPxH = plotD * pxPerM;
  const pxRef = useRef(pxPerM); pxRef.current = pxPerM;
  const drag = useRef(null);
  const [ai, setAi] = useState({ open: false, phase: 'input', img: null, err: '', plan: null });
  const [photo, setPhoto] = useState(null);
  const [penOpen, setPenOpen] = useState(false);      // materiaalkeuze-menu van de pen-tool
  const [path, setPath] = useState([]);               // punten (in meters) tijdens het tekenen
  const drawing = useRef(false);

  useEffect(() => {
    const el = wrapRef.current; if (!el) return;
    const ro = new ResizeObserver(() => setCw(el.clientWidth));
    ro.observe(el); setCw(el.clientWidth);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const move = (e) => {
      const d = drag.current; if (!d) return;
      const dx = (e.clientX - d.sx) / pxRef.current, dy = (e.clientY - d.sy) / pxRef.current;
      const r = cutRect(plotW, plotD, cutCfg);
      setItems(list => list.map(it => {
        if (it.id !== d.id) return it;
        if (d.mode === 'move-shape') {
          const bb = polyBBox(d.opts);
          const ddx = clamp(dx, -bb.x0, plotW - bb.x1), ddy = clamp(dy, -bb.y0, plotD - bb.y1);
          return { ...it, points: d.opts.map(p => [p[0] + ddx, p[1] + ddy]) };
        }
        if (d.mode === 'move') {
          let nx = clamp(d.ox + dx, 0, plotW - it.w), ny = clamp(d.oy + dy, 0, plotD - it.d);
          [nx, ny] = resolveCut(nx, ny, it.w, it.d, r, plotW, plotD);
          return { ...it, x: nx, y: ny };
        }
        return { ...it, w: clamp(d.ow + dx, 0.5, plotW - it.x), d: clamp(d.oh + dy, 0.5, plotD - it.y) };
      }));
    };
    const up = () => { drag.current = null; };
    window.addEventListener('pointermove', move); window.addEventListener('pointerup', up);
    return () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); };
  }, [plotW, plotD, cutCfg, setItems]);

  const startMove = (e, it) => { e.stopPropagation(); setSel(it.id); pushHist && pushHist(); drag.current = { mode: 'move', id: it.id, sx: e.clientX, sy: e.clientY, ox: it.x, oy: it.y }; };
  const startResize = (e, it) => { e.stopPropagation(); setSel(it.id); pushHist && pushHist(); drag.current = { mode: 'resize', id: it.id, sx: e.clientX, sy: e.clientY, ow: it.w, oh: it.d }; };
  const startShapeMove = (e, it) => { e.stopPropagation(); setSel(it.id); pushHist && pushHist(); drag.current = { mode: 'move-shape', id: it.id, sx: e.clientX, sy: e.clientY, opts: it.points }; };

  // ── Pen-tool: vrije vorm tekenen op de plattegrond ──────────────────────────
  const evToM = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    return [clamp((e.clientX - rect.left) / pxPerM, 0, plotW), clamp((e.clientY - rect.top) / pxPerM, 0, plotD)];
  };
  const penDown = (e) => {
    e.stopPropagation(); e.preventDefault();
    drawing.current = true; setPath([evToM(e)]);
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* negeer */ }
  };
  const penMove = (e) => {
    if (!drawing.current) return;
    const p = evToM(e);
    setPath(prev => { const last = prev[prev.length - 1]; return (last && Math.hypot(p[0] - last[0], p[1] - last[1]) < 0.3) ? prev : [...prev, p]; });
  };
  const penUp = () => {
    if (!drawing.current) return;
    drawing.current = false;
    if (path.length >= 3 && polyArea(path) >= 0.5) addShape(drawCat, path);
    setPath([]);
  };

  // Cache: alleen opnieuw genereren als het ontwerp (of de foto) is gewijzigd.
  const renderCache = useRef({ sig: null, img: null });
  const sigOf = () => JSON.stringify({
    p: [plotW, plotD], t: tier, c: cutCfg,
    it: items.map(i => i.kind === 'shape'
      ? ['shape', i.type, i.points.map(p => [+p[0].toFixed(1), +p[1].toFixed(1)]), i.materiaal ? i.materiaal.id : 0]
      : [i.type, +i.x.toFixed(2), +i.y.toFixed(2), +i.w.toFixed(2), +i.d.toFixed(2), i.materiaal ? i.materiaal.id : 0]),
    ph: photo ? (photo.length + ':' + photo.slice(-24)) : 'none',
  });

  const openAI = () => {
    if (items.length === 0) return;
    const plan = planToDataUrl(items, plotW, plotD, cutCfg);
    if (renderCache.current.sig === sigOf() && renderCache.current.img) {
      setAi({ open: true, phase: 'result', img: renderCache.current.img, err: '', plan }); // ongewijzigd → toon bestaande impressie
    } else {
      setAi({ open: true, phase: 'input', img: null, err: '', plan });
    }
  };
  const onFoto = async (e) => { const f = e.target.files?.[0]; if (!f) return; try { setPhoto(await fileToDataUrl(f)); } catch { /* negeer */ } };

  const doRender = async () => {
    setAi(a => ({ ...a, phase: 'loading', err: '' }));
    const sig = sigOf();
    try {
      const plan = ai.plan || planToDataUrl(items, plotW, plotD, cutCfg);
      const kinds = [...new Set(items.filter(i => i.type !== 'gebouw').map(i => DEF[i.type].label))].join(', ');
      const desc = planDescription(items, plotW, plotD);
      const heeftBorder = items.some(i => i.type === 'border');
      const heeftGebouw = items.some(i => i.type === 'gebouw');
      const cornerNL = { nw: 'linksachter', ne: 'rechtsachter', sw: 'linksvoor', se: 'rechtsvoor' };
      const vormNote = cutCfg ? `De tuin is L-vormig (hoektuin): de ${cornerNL[cutCfg.corner]} hoek (donkergrijs vlak in de plattegrond) hoort NIET bij de tuin — daar staat bebouwing of het buurperceel. Laat die hoek volledig buiten de tuin, ontwerp daar niets.` : '';
      const gebouwNote = heeftGebouw ? 'Er staat een bestaand gebouw in of aan de tuin (grijs blok met dak in de plattegrond). Behoud dit gebouw exact op zijn plek en ontwerp eromheen; het is geen beplanting.' : '';
      const tierLabel = TIERS.find(t => t.key === tier).label;
      const legend = 'Kleurcodering in de plattegrond: grijs = natuurstenen terras/bestrating, lichtgroen (ondergrond) = strak gemaaid gazon, donkergroen vlak = border vol beplanting en bloemen, warm bruin = hardhouten vlonder of schutting, blauw = vijver of zwembad, klein rond = boom, licht beige = tuinhuis, grijs blok met dak = bestaand gebouw, donkergrijs hoekvlak = buiten de tuin.';
      const gekozen = items.filter(i => i.materiaal).map(i => `${DEF[i.type].label}: ${i.materiaal.naam}`);
      const matNote = gekozen.length ? ` Gebruik exact deze gekozen materialen/uitstraling: ${gekozen.join('; ')}.` : '';
      const regels = `ZEER BELANGRIJK — voeg absoluut NIETS toe dat niet als gekleurd vlak in de plattegrond staat. GEEN extra planten, bloemen, struiken, borders, hagen, bomen, potten, tuinmeubels, paden of decoratie. ${heeftBorder ? 'Beplanting staat alleen in de donkergroene bordervlakken; daarbuiten geen enkele plant.' : 'Er staan GEEN borders in dit ontwerp, dus er zijn NERGENS planten, struiken of bloemen. Alleen gazon.'} Gazon is kort gemaaid gras zonder enige beplanting. Alle ruimte zonder gekleurd vlak is uitsluitend gazon. Houd je exact aan de posities, vormen, aantallen en verhoudingen van de gekleurde vlakken.${matNote} ${vormNote} ${gebouwNote}`;
      let prompt;
      if (photo) {
        prompt = `Herontwerp de tuin op de EERSTE afbeelding (foto van de huidige tuin van de klant) volgens de TWEEDE afbeelding (de plattegrond met het nieuwe ontwerp). Behoud het huis, de erfgrenzen en het camerastandpunt en perspectief van de foto, maar vervang de tuininrichting volledig door het ontwerp uit de plattegrond. ${legend} ${regels}\nIndeling die je moet aanhouden:\n${desc}\nFotorealistisch, ${tierLabel}-afwerking van hoog niveau, realistische materialen en texturen, zacht daglicht, geen tekst, geen mensen, geen watermerk.`;
      } else {
        prompt = `Fotorealistische, licht schuine luchtfoto (bird's-eye view) van een Nederlandse achtertuin die EXACT deze plattegrond volgt (bijgevoegde afbeelding). ${legend} ${regels}\nIndeling:\n${desc}\nAlleen deze elementen aanwezig: ${kinds}. ${tierLabel}-afwerking van hoog niveau, realistische materialen en texturen, zacht daglicht, geen tekst, geen mensen, geen watermerk.`;
      }
      const r = await fetch('/api/render', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ imageDataUrl: plan, photoDataUrl: photo || undefined, prompt }) });
      const d = await r.json();
      if (!d.ok || !d.image) throw new Error(d.error || 'mislukt');
      renderCache.current = { sig, img: d.image };
      setAi(a => ({ ...a, phase: 'result', img: d.image, err: '' }));
    } catch {
      setAi(a => ({ ...a, phase: 'result', img: null, err: 'De AI-impressie is nu even niet beschikbaar. Probeer het zo nog eens.' }));
    }
  };

  return (
    <>
      <div className="grid lg:grid-cols-[240px_1fr_280px] gap-5">
        {/* Palet */}
        <div className="rounded-3xl p-5 h-fit" style={{ background: WHITE, border: `1px solid ${LINE}` }}>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] mb-4" style={{ color: BLUE }}>Voeg elementen toe</p>
          <div className="grid grid-cols-2 lg:grid-cols-1 gap-2">
            {ELEMENTS.map(el => {
              const Icon = el.icon;
              return (
                <button key={el.key} onClick={() => addItem(el.key)} className="flex items-center gap-3 p-2.5 rounded-xl text-left transition-all hover:scale-[1.02]" style={{ background: LIGHT, border: `1px solid ${LINE}` }}>
                  <span className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: el.color }}><Icon className="w-4 h-4 text-white" style={{ filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.3))' }} /></span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-[13px] font-bold truncate" style={{ color: NAVY }}>{el.label}</span>
                    <span className="block text-[10px]" style={{ color: MUTED }}>v.a. {euro(el.prijs.budget)}{el.unit === 'm2' ? '/m²' : el.unit === 'm' ? '/m' : ''}</span>
                  </span>
                  <Plus className="w-4 h-4 flex-shrink-0" style={{ color: BLUE }} />
                </button>
              );
            })}
          </div>
        </div>

        {/* Canvas */}
        <div className="rounded-3xl p-4 md:p-5" style={{ background: WHITE, border: `1px solid ${LINE}` }}>
          <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
            <div className="inline-flex rounded-xl p-1" style={{ background: LIGHT }}>
              <button onClick={() => setView('2d')} className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-all" style={view === '2d' ? { background: WHITE, color: NAVY, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' } : { color: MUTED }}><MapIcon className="w-3.5 h-3.5" /> Plattegrond</button>
              <button onClick={() => setView('3d')} className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-all" style={view === '3d' ? { background: WHITE, color: NAVY, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' } : { color: MUTED }}><Box className="w-3.5 h-3.5" /> 3D-weergave</button>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {/* Tuinformaat aanpasbaar (vrije invoer) */}
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg" style={{ border: `1px solid ${LINE}` }}>
                <span className="text-[11px] font-bold" style={{ color: MUTED }}>Tuin</span>
                <DimInput value={plotW} onCommit={v => setPlot(v, plotD)} className="w-11 text-xs font-bold text-center outline-none" style={{ color: NAVY }} />
                <span className="text-xs" style={{ color: MUTED }}>×</span>
                <DimInput value={plotD} onCommit={v => setPlot(plotW, v)} className="w-11 text-xs font-bold text-center outline-none" style={{ color: NAVY }} />
                <span className="text-[11px]" style={{ color: MUTED }}>m</span>
              </div>
              <div className="relative">
                <button onClick={() => { if (drawCat) { setDrawCat(null); } else { setView('2d'); setPenOpen(o => !o); } }} title="Vrije vorm tekenen"
                  className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-lg transition-all" style={drawCat ? { background: BLUE, color: WHITE } : { border: `1px solid ${LINE}`, color: NAVY }}>
                  <PenTool className="w-3.5 h-3.5" /> {drawCat ? `Teken: ${DEF[drawCat].label.split(' ')[0]}` : 'Vrije vorm'}
                </button>
                {penOpen && !drawCat && (
                  <div className="absolute right-0 top-full mt-1.5 z-30 w-56 rounded-xl p-2 shadow-xl" style={{ background: WHITE, border: `1px solid ${LINE}` }}>
                    <p className="text-[10px] font-bold uppercase tracking-wider px-1 pb-1.5" style={{ color: MUTED }}>Teken een vlak als…</p>
                    {SHAPE_CATS.map(k => { const def = DEF[k]; const Icon = def.icon; return (
                      <button key={k} onClick={() => { setDrawCat(k); setPenOpen(false); }} className="w-full flex items-center gap-2.5 p-1.5 rounded-lg text-left transition-all hover:scale-[1.02]" style={{ background: LIGHT, marginBottom: 4 }}>
                        <span className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0" style={{ background: def.color }}><Icon className="w-3.5 h-3.5 text-white" /></span>
                        <span className="text-xs font-bold" style={{ color: NAVY }}>{def.label}</span>
                      </button>
                    ); })}
                  </div>
                )}
              </div>
              <button onClick={() => undo && undo()} disabled={!canUndo} title="Ongedaan maken" className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-lg transition-all disabled:opacity-30" style={{ border: `1px solid ${LINE}`, color: NAVY }}><RotateCcw className="w-3.5 h-3.5" /> Ongedaan</button>
              <button onClick={() => exportPlanPDF({ items, plotW, plotD, cutCfg, tier, totals, adres })} disabled={items.length === 0} title="Opslaan als PDF / printen op schaal" className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-lg transition-all disabled:opacity-30" style={{ border: `1px solid ${LINE}`, color: NAVY }}><Download className="w-3.5 h-3.5" /> PDF</button>
              <button onClick={openAI} disabled={items.length === 0} className="inline-flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-lg text-white transition-all hover:scale-105 disabled:opacity-30" style={{ background: BLUE }}><Wand2 className="w-3.5 h-3.5" /> Breng tot leven</button>
              <button onClick={wisAlles} disabled={items.length === 0} title="Alles wissen" className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-lg transition-all disabled:opacity-30" style={{ border: `1px solid #f0c4c4`, color: '#C0392B' }}><Trash2 className="w-3.5 h-3.5" /> Wis</button>
            </div>
          </div>

          <div ref={wrapRef} className="w-full flex justify-center overflow-hidden rounded-2xl" style={{ background: view === '2d' ? '#EEF1E6' : '#E4EBF0', minHeight: 320 }}>
            {view === '2d' ? (
              <div ref={canvasRef} className="relative my-4" onPointerDown={() => { if (!drawCat) setSel(null); }}
                style={{ width: canPxW, height: canPxH, background: '#CFE0BC', border: `2px solid ${BLUE_D}`, borderRadius: 6, flexShrink: 0,
                  backgroundImage: `linear-gradient(rgba(31,33,19,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(31,33,19,0.06) 1px, transparent 1px)`, backgroundSize: `${pxPerM}px ${pxPerM}px` }}>
                {/* Vrije vormen (getekende vlakken) — onder de rechthoek-elementen */}
                <svg className="absolute inset-0" width={canPxW} height={canPxH} style={{ zIndex: 0, pointerEvents: 'none' }}>
                  {items.filter(it => it.kind === 'shape').map(it => {
                    const def = DEF[it.type]; const on = sel === it.id; const pts = it.points.map(p => `${p[0] * pxPerM},${p[1] * pxPerM}`).join(' ');
                    return <polygon key={it.id} points={pts} fill={def.color} fillOpacity="0.9" stroke={on ? NAVY : 'rgba(0,0,0,0.3)'} strokeWidth={on ? 2.5 : 1.5} strokeLinejoin="round"
                      style={{ cursor: 'move', pointerEvents: drawCat ? 'none' : 'auto' }} onPointerDown={(e) => startShapeMove(e, it)} />;
                  })}
                </svg>
                {/* Label + verwijderknop voor de geselecteerde vrije vorm */}
                {(() => {
                  const s = selItem; if (!s || s.kind !== 'shape') return null;
                  const c = polyCentroid(s.points), bb = polyBBox(s.points); const Icon = DEF[s.type].icon;
                  return (
                    <div key="shapesel" className="absolute" style={{ left: 0, top: 0, zIndex: 6, pointerEvents: 'none' }}>
                      <div className="absolute flex flex-col items-center gap-0.5" style={{ left: c[0] * pxPerM, top: c[1] * pxPerM, transform: 'translate(-50%,-50%)' }}>
                        <Icon className="w-4 h-4 text-white" style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.6))' }} />
                        <span className="text-[9px] font-bold text-white leading-tight" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.7)' }}>{DEF[s.type].label.split(' ')[0]} · {itemArea(s).toFixed(0)}m²</span>
                      </div>
                      <button onPointerDown={(e) => { e.stopPropagation(); delItem(s.id); }} className="absolute w-6 h-6 rounded-full flex items-center justify-center shadow"
                        style={{ left: bb.x1 * pxPerM, top: bb.y0 * pxPerM, transform: 'translate(-50%,-50%)', background: '#C0392B', color: WHITE, pointerEvents: 'auto' }}><Trash2 className="w-3 h-3" /></button>
                    </div>
                  );
                })()}
                {items.map(it => {
                  if (it.kind === 'shape') return null;
                  const def = DEF[it.type]; const on = sel === it.id; const Icon = def.icon; const p = pat2d(def);
                  return (
                    <div key={it.id} onPointerDown={(e) => startMove(e, it)} className="absolute select-none touch-none flex flex-col items-center justify-center gap-0.5"
                      style={{ left: it.x * pxPerM, top: it.y * pxPerM, width: it.w * pxPerM, height: it.d * pxPerM, background: def.color, opacity: 0.94, borderRadius: 4, cursor: 'move',
                        outline: on ? `2px solid ${NAVY}` : '1px solid rgba(0,0,0,0.15)', boxShadow: on ? '0 6px 20px rgba(0,0,0,0.2)' : 'none', zIndex: on ? 5 : 1, overflow: 'hidden', ...(p || {}) }}>
                      <Icon className="w-4 h-4 text-white pointer-events-none" style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.5))', opacity: 0.95 }} />
                      <span className="text-[9px] font-bold text-white text-center px-1 pointer-events-none leading-tight" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.6)' }}>{def.label.split(' ')[0]}</span>
                      {on && (
                        <>
                          <button onPointerDown={(e) => { e.stopPropagation(); delItem(it.id); }} className="absolute -top-2.5 -right-2.5 w-6 h-6 rounded-full flex items-center justify-center shadow" style={{ background: '#C0392B', color: WHITE }}><Trash2 className="w-3 h-3" /></button>
                          <div onPointerDown={(e) => startResize(e, it)} className="absolute -bottom-1.5 -right-1.5 w-4 h-4 rounded-sm cursor-nwse-resize" style={{ background: NAVY, border: `2px solid ${WHITE}` }} />
                        </>
                      )}
                    </div>
                  );
                })}
                {(() => { const r = cutRect(plotW, plotD, cutCfg); if (!r) return null; return (
                  <div className="absolute flex items-center justify-center pointer-events-none" style={{ left: r.x0 * pxPerM, top: r.y0 * pxPerM, width: (r.x1 - r.x0) * pxPerM, height: (r.y1 - r.y0) * pxPerM, zIndex: 4,
                    background: 'repeating-linear-gradient(45deg, rgba(58,63,68,0.9) 0 7px, rgba(80,86,92,0.9) 7px 14px)',
                    borderLeft: r.x0 > 0 ? `2px solid ${NAVY}` : 'none', borderRight: r.x1 < plotW ? `2px solid ${NAVY}` : 'none', borderTop: r.y0 > 0 ? `2px solid ${NAVY}` : 'none', borderBottom: r.y1 < plotD ? `2px solid ${NAVY}` : 'none' }}>
                    <span className="text-[9px] font-bold text-white text-center px-1" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.7)' }}>Buiten de tuin</span>
                  </div>
                ); })()}
                {items.length === 0 && !drawCat && <div className="absolute inset-0 flex items-center justify-center pointer-events-none"><p className="text-sm font-semibold px-4 text-center" style={{ color: 'rgba(31,33,19,0.4)' }}>Klik links op een element om het toe te voegen, sleep en pas de maat aan.</p></div>}
                {/* Teken-overlay: vang alle pointers zolang de pen-tool actief is */}
                {drawCat && (
                  <div className="absolute inset-0" style={{ zIndex: 40, cursor: 'crosshair', touchAction: 'none' }}
                    onPointerDown={penDown} onPointerMove={penMove} onPointerUp={penUp} onPointerCancel={penUp}>
                    <svg className="absolute inset-0" width={canPxW} height={canPxH} style={{ pointerEvents: 'none' }}>
                      {path.length > 1 && <polygon points={path.map(p => `${p[0] * pxPerM},${p[1] * pxPerM}`).join(' ')} fill={DEF[drawCat].color} fillOpacity="0.35" stroke={DEF[drawCat].color} strokeWidth="2" strokeLinejoin="round" strokeDasharray="5 4" />}
                      {path.map((p, i) => <circle key={i} cx={p[0] * pxPerM} cy={p[1] * pxPerM} r="2.5" fill={BLUE_D} />)}
                    </svg>
                    {path.length === 0 && (
                      <div className="absolute inset-x-0 top-3 flex justify-center pointer-events-none">
                        <span className="px-3 py-1.5 rounded-full text-[11px] font-bold text-white shadow" style={{ background: 'rgba(11,29,58,0.9)' }}>Teken een vlak — houd ingedrukt en sleep. Laat los om te sluiten.</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <IsoView items={items} plotW={plotW} plotD={plotD} width={canPxW} cutCfg={cutCfg} />
            )}
          </div>
          <div className="flex items-center justify-center gap-4 mt-3 flex-wrap">
            {view === '2d' && (
              <div className="flex items-center gap-1.5" title="Schaalverdeling">
                <div style={{ width: pxPerM, height: 6, background: NAVY, borderLeft: `2px solid ${NAVY}`, borderRight: `2px solid ${NAVY}`, position: 'relative' }} />
                <span className="text-[11px] font-bold" style={{ color: NAVY }}>1 m</span>
                <span className="text-[11px]" style={{ color: MUTED }}>· elk vakje = 1 × 1 m</span>
              </div>
            )}
            <p className="text-[11px]" style={{ color: MUTED }}>Klik een element aan om te verplaatsen, de maat te wijzigen (hoekje) of een materiaal te kiezen. Met <b>Vrije vorm</b> teken je een organische border, gazon of vijver.</p>
          </div>
        </div>

        {/* Prijspaneel */}
        <div className="rounded-3xl p-5 h-fit lg:sticky lg:top-28" style={{ background: WHITE, border: `1px solid ${LINE}` }}>
          {/* Materiaalkeuze voor het geselecteerde element (uit de backend) */}
          {selItem && selMats.length > 0 && (
            <div className="mb-5 pb-5 border-b" style={{ borderColor: LINE }}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-[11px] font-bold uppercase tracking-[0.2em]" style={{ color: BLUE }}>Materiaal · {DEF[selItem.type].label}</p>
                <button onClick={() => delItem(selItem.id)} className="inline-flex items-center gap-1 text-[11px] font-bold" style={{ color: '#C0392B' }}><Trash2 className="w-3 h-3" /> Verwijder</button>
              </div>
              <div className="space-y-1.5 max-h-64 overflow-y-auto pr-0.5">
                <button onClick={() => setMateriaal(selItem.id, null)} className="w-full flex items-center gap-2.5 p-2 rounded-lg text-left transition-all"
                  style={!selItem.materiaal ? { background: SOFT, border: `1px solid ${BLUE}` } : { border: `1px solid ${LINE}`, background: WHITE }}>
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: LIGHT }}><Sparkles className="w-4 h-4" style={{ color: MUTED }} /></div>
                  <span className="flex-1 min-w-0"><span className="block text-xs font-bold" style={{ color: NAVY }}>Standaard (schatting)</span><span className="block text-[10px]" style={{ color: MUTED }}>prijs volgens niveau</span></span>
                </button>
                {selMats.map(pr => {
                  const on = selItem.materiaal && selItem.materiaal.id === pr.id;
                  return (
                    <button key={pr.id} onClick={() => setMateriaal(selItem.id, { id: pr.id, naam: pr.naam, foto: pr.foto, prijs: pr.prijs, eenheid: pr.eenheid })}
                      className="w-full flex items-center gap-2.5 p-2 rounded-lg text-left transition-all"
                      style={on ? { background: SOFT, border: `1px solid ${BLUE}` } : { border: `1px solid ${LINE}`, background: WHITE }}>
                      <div className="w-9 h-9 rounded-lg bg-cover bg-center flex-shrink-0" style={pr.foto ? { backgroundImage: `url(${pr.foto})` } : { background: DEF[selItem.type].color }} />
                      <span className="flex-1 min-w-0"><span className="block text-xs font-bold truncate" style={{ color: NAVY }}>{pr.naam}</span><span className="block text-[10px]" style={{ color: MUTED }}>{euro(pr.prijs)}/{pr.eenheid}</span></span>
                      {on && <Check className="w-4 h-4 flex-shrink-0" style={{ color: BLUE }} />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] mb-1" style={{ color: BLUE }}>Prijsindicatie</p>
          <p className="text-[11px] mb-4" style={{ color: MUTED }}>Kies een niveau. De prijs telt live op.</p>
          <div className="space-y-2 mb-5">
            {TIERS.map(t => {
              const on = tier === t.key;
              return (
                <button key={t.key} onClick={() => setTier(t.key)} className="w-full flex items-center justify-between gap-2 p-3 rounded-xl text-left transition-all" style={on ? { background: SOFT, border: `1px solid ${BLUE}` } : { background: WHITE, border: `1px solid ${LINE}` }}>
                  <span><span className="block text-sm font-bold" style={{ color: NAVY }}>{t.label}</span><span className="block text-[10px]" style={{ color: MUTED }}>{t.sub}</span></span>
                  <span className="text-sm font-bold" style={{ fontFamily: FONT_H, color: on ? BLUE_D : MUTED }}>{euro(totals[t.key])}</span>
                </button>
              );
            })}
          </div>
          <div className="p-4 rounded-2xl mb-4" style={{ background: NAVY }}>
            <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: MINT }}>Richtprijs · {TIERS.find(t => t.key === tier).label}</p>
            <p className="font-bold text-white" style={{ fontFamily: FONT_H, fontSize: '1.7rem' }}>{euro(totals[tier])}</p>
            <p className="text-[11px] mt-1" style={{ color: 'rgba(255,255,255,0.55)' }}>{items.length} element{items.length === 1 ? '' : 'en'} · indicatief, excl. btw</p>
          </div>
          <button onClick={openAI} disabled={items.length === 0} className="w-full flex items-center justify-center gap-2 py-3 mb-2 text-sm font-bold rounded-xl transition-all hover:scale-[1.02] disabled:opacity-30" style={{ background: SOFT, color: BLUE_D }}><Wand2 className="w-4 h-4" /> Breng tot leven met AI</button>
          <button onClick={onVerder} disabled={items.length === 0} className="w-full flex items-center justify-center gap-2 py-3.5 text-sm font-bold rounded-xl text-white transition-all hover:scale-[1.02] disabled:opacity-30" style={{ background: BLUE }}>Vraag offerte aan <ArrowUpRight className="w-4 h-4" /></button>
          <button onClick={onTerug} className="w-full mt-2 py-2.5 text-xs font-bold rounded-xl transition-all" style={{ color: MUTED }}>← Terug naar kavel</button>
        </div>
      </div>

      {/* AI-impressie modal */}
      <AnimatePresence>
        {ai.open && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setAi(a => ({ ...a, open: false }))}
            className="fixed inset-0 z-[80] flex items-center justify-center p-4" style={{ background: 'rgba(15,16,9,0.75)', backdropFilter: 'blur(4px)' }}>
            <motion.div initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.96, opacity: 0 }} onClick={e => e.stopPropagation()}
              className="relative w-full max-w-2xl rounded-3xl overflow-hidden flex flex-col" style={{ background: WHITE, fontFamily: FONT_B, maxHeight: '90vh' }}>
              <div className="flex items-center justify-between gap-4 p-5 border-b flex-shrink-0" style={{ borderColor: LINE }}>
                <div className="flex items-center gap-2.5"><div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: SOFT }}><Sparkles className="w-4 h-4" style={{ color: BLUE }} /></div>
                  <div><p className="text-[11px] font-bold uppercase tracking-[0.2em]" style={{ color: BLUE }}>AI-impressie</p><p className="text-sm font-semibold" style={{ fontFamily: FONT_H, color: NAVY }}>Uw ontwerp tot leven gebracht</p></div></div>
                <button onClick={() => setAi(a => ({ ...a, open: false }))} className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: LIGHT, color: NAVY }}><X className="w-4 h-4" /></button>
              </div>
              <div className="p-5 overflow-y-auto">
                {ai.phase === 'input' && (
                  <div>
                    <div className="grid sm:grid-cols-2 gap-4 mb-5">
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-[0.2em] mb-2" style={{ color: MUTED }}>Uw plattegrond</p>
                        {ai.plan && <img src={ai.plan} alt="plattegrond" className="w-full rounded-xl" style={{ border: `1px solid ${LINE}` }} />}
                      </div>
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-[0.2em] mb-2" style={{ color: MUTED }}>Huidige tuin (optioneel)</p>
                        {photo ? (
                          <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${BLUE}` }}>
                            <img src={photo} alt="uw tuin" className="w-full object-cover" style={{ maxHeight: 160 }} />
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 gap-2" style={{ minHeight: 132 }}>
                            <label className="flex flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed cursor-pointer transition-all hover:scale-[1.02]" style={{ borderColor: LINE, background: LIGHT }}>
                              <Upload className="w-6 h-6" style={{ color: BLUE }} /><span className="text-[11px] font-bold text-center px-2" style={{ color: MUTED }}>Foto uploaden</span>
                              <input type="file" accept="image/*" className="hidden" onChange={onFoto} />
                            </label>
                            <label className="flex flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed cursor-pointer transition-all hover:scale-[1.02]" style={{ borderColor: LINE, background: LIGHT }}>
                              <Camera className="w-6 h-6" style={{ color: BLUE }} /><span className="text-[11px] font-bold text-center px-2" style={{ color: MUTED }}>Foto maken</span>
                              <input type="file" accept="image/*" capture="environment" className="hidden" onChange={onFoto} />
                            </label>
                          </div>
                        )}
                        {photo && <button onClick={() => setPhoto(null)} className="text-[11px] font-semibold underline mt-1.5" style={{ color: MUTED }}>Foto verwijderen</button>}
                      </div>
                    </div>
                    <p className="text-[12px] leading-relaxed mb-4 flex items-start gap-2" style={{ color: MUTED }}>
                      <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: BLUE }} />
                      {photo ? 'Wij verwerken uw ontwerp in de foto van uw huidige tuin, met behoud van het huis en het perspectief.' : 'Zonder foto maken wij een luchtimpressie op basis van uw plattegrond. Alleen wat op de plattegrond staat wordt getoond, de rest is gazon.'}
                    </p>
                    <button onClick={doRender} className="w-full flex items-center justify-center gap-2 py-3.5 text-sm font-bold rounded-xl text-white transition-all hover:scale-[1.02]" style={{ background: BLUE }}><Sparkles className="w-4 h-4" /> Genereer AI-impressie</button>
                  </div>
                )}
                {ai.phase === 'loading' && (
                  <div className="aspect-[4/3] rounded-2xl flex flex-col items-center justify-center gap-3" style={{ background: LIGHT }}>
                    <span className="w-8 h-8 border-2 rounded-full animate-spin" style={{ borderColor: 'rgba(11,157,70,0.25)', borderTopColor: BLUE }} />
                    <p className="text-sm font-semibold" style={{ color: MUTED }}>AI maakt een fotorealistische impressie…</p>
                    <p className="text-xs" style={{ color: MUTED }}>Dit duurt enkele seconden.</p>
                  </div>
                )}
                {ai.phase === 'result' && ai.img && (
                  <div>
                    <img src={ai.img} alt="AI-impressie van uw tuin" className="w-full rounded-2xl mx-auto" style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.2)', maxHeight: '62vh', objectFit: 'contain', width: 'auto', maxWidth: '100%' }} />
                    <p className="text-[11px] mt-3" style={{ color: MUTED }}>Een AI-impressie op basis van uw {photo ? 'foto en ' : ''}plattegrond. De werkelijke aanleg stemmen wij met u af.</p>
                    <div className="flex gap-3 mt-4">
                      <button onClick={onVerder} className="flex-1 flex items-center justify-center gap-2 py-3 text-sm font-bold rounded-xl text-white" style={{ background: BLUE }}>Vraag offerte aan <ArrowUpRight className="w-4 h-4" /></button>
                      <button onClick={() => setAi(a => ({ ...a, phase: 'input' }))} className="px-5 py-3 text-sm font-bold rounded-xl" style={{ border: `1px solid ${LINE}`, color: NAVY }}>Opnieuw</button>
                    </div>
                  </div>
                )}
                {ai.phase === 'result' && ai.err && (
                  <div className="text-center py-10">
                    <p className="text-sm mb-4" style={{ color: MUTED }}>{ai.err}</p>
                    <button onClick={doRender} className="text-sm font-bold px-6 py-3 rounded-xl text-white" style={{ background: BLUE }}>Probeer opnieuw</button>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// ── Isometrische 3D-weergave (per element realistisch, pure SVG) ─────────────
function IsoView({ items, plotW, plotD, width, cutCfg }) {
  const s = Math.max(12, Math.min(width, 660) / (plotW + plotD) * 1.2);
  const proj = (mx, my, z) => [(mx - my) * s, (mx + my) * s * 0.5 - z * s * 0.85];
  const P = (arr) => arr.map(p => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');

  const grondPoly = lPolygon(plotW, plotD, cutCfg);
  const pts = [];
  grondPoly.forEach(c => pts.push(proj(c[0], c[1], 0)));
  items.forEach(it => {
    if (it.kind === 'shape') { it.points.forEach(p => pts.push(proj(p[0], p[1], 0), proj(p[0], p[1], 0.5))); return; }
    const def = DEF[it.type]; const cx = it.x + it.w / 2, cy = it.y + it.d / 2; pts.push(proj(it.x, it.y, 0), proj(it.x + it.w, it.y + it.d, 0), proj(cx, cy, def.hz + (def.key === 'tuinhuis' || def.key === 'gebouw' ? 0.9 : 0)));
  });
  const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
  const pad = 34;
  const minX = Math.min(...xs) - pad, maxX = Math.max(...xs) + pad, minY = Math.min(...ys) - pad, maxY = Math.max(...ys) + pad;

  const drawShape = (it, k) => {
    const def = DEF[it.type]; const col = def.color; const els = []; let ki = 0; const key = () => `${k}-s-${ki++}`;
    const isWater = def.key === 'vijver' || def.key === 'zwembad';
    const zTop = def.key === 'vlonder' ? 0.24 : def.key === 'terras' ? 0.12 : def.key === 'border' ? 0.12 : isWater ? 0 : 0.05;
    const bottom = it.points.map(p => proj(p[0], p[1], 0));
    const top = it.points.map(p => proj(p[0], p[1], zTop));
    if (zTop > 0) els.push(<polygon key={key()} points={P(bottom)} fill={shade(col, 0.68)} />); // zijkant / dikte
    els.push(<polygon key={key()} points={P(top)} fill={isWater ? '#AEB6A0' : col} stroke={shade(col, 0.72)} strokeWidth="0.6" strokeLinejoin="round" />);
    if (isWater) {
      const c = polyCentroid(it.points), bb = polyBBox(it.points); const m = Math.min(0.4, (bb.x1 - bb.x0) / 5, (bb.y1 - bb.y0) / 5);
      const inner = it.points.map(p => proj(c[0] + (p[0] - c[0]) * (1 - m / Math.max(0.5, Math.hypot(p[0] - c[0], p[1] - c[1]))), c[1] + (p[1] - c[1]) * (1 - m / Math.max(0.5, Math.hypot(p[0] - c[0], p[1] - c[1]))), 0));
      els.push(<polygon key={key()} points={P(inner)} fill={col} />);
      els.push(<polygon key={key()} points={P(inner)} fill="rgba(255,255,255,0.14)" />);
    }
    if (def.key === 'border') { // beplanting: struiken binnen de vorm
      const bb = polyBBox(it.points); const greens = ['#3E7D34', '#4E8F3F', '#356E2C'], flowers = ['#D98FB0', '#E7C44B', '#C96A6A'];
      const bushes = []; let c = 0;
      for (let gx = bb.x0 + 0.4; gx < bb.x1; gx += 0.8) for (let gy = bb.y0 + 0.4; gy < bb.y1; gy += 0.8) { if (pointInPoly(gx, gy, it.points)) bushes.push({ cx: gx, cy: gy, c: c++ }); }
      bushes.sort((a, b) => (a.cx + a.cy) - (b.cx + b.cy));
      bushes.forEach(({ cx, cy, c }) => {
        const g0 = proj(cx, cy, 0), p = proj(cx, cy, 0.4), r = s * 0.42;
        els.push(<ellipse key={key()} cx={g0[0]} cy={g0[1]} rx={r * 1.1} ry={r * 0.5} fill="rgba(0,0,0,0.08)" />);
        els.push(<circle key={key()} cx={p[0]} cy={p[1]} r={r} fill={greens[c % 3]} />);
        els.push(<circle key={key()} cx={p[0] - r * 0.32} cy={p[1] - r * 0.3} r={r * 0.5} fill={shade(greens[c % 3], 1.28)} />);
        if (c % 2 === 0) els.push(<circle key={key()} cx={p[0] + r * 0.25} cy={p[1] - r * 0.1} r={r * 0.2} fill={flowers[c % 3]} />);
      });
    }
    return <g key={k}>{els}</g>;
  };

  const drawItem = (it, k) => {
    if (it.kind === 'shape') return drawShape(it, k);
    const def = DEF[it.type]; const { x, y, w, d } = it; const col = def.color; const els = []; let ki = 0;
    const key = () => `${k}-${ki++}`;
    const poly = (arr, fill, stroke, sw) => els.push(<polygon key={key()} points={P(arr)} fill={fill} stroke={stroke || 'none'} strokeWidth={sw || 0} />);
    const line = (a, b, stroke, sw) => els.push(<line key={key()} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke={stroke} strokeWidth={sw} strokeLinecap="round" />);
    const box = (bx, by, bw, bd, z0, z1, c) => {
      const B = proj(bx + bw, by, z0), C0 = proj(bx + bw, by + bd, z0), D0 = proj(bx, by + bd, z0);
      const Bt = proj(bx + bw, by, z1), Ct = proj(bx + bw, by + bd, z1), Dt = proj(bx, by + bd, z1), At = proj(bx, by, z1);
      poly([B, C0, Ct, Bt], shade(c, 0.72)); poly([D0, C0, Ct, Dt], shade(c, 0.86)); poly([At, Bt, Ct, Dt], shade(c, 1.06), shade(c, 0.9), 0.4);
    };

    if (def.key === 'terras') {
      const z = 0.12; box(x, y, w, d, 0, z, col);
      for (let i = 0.6; i < w - 0.01; i += 0.6) line(proj(x + i, y, z), proj(x + i, y + d, z), shade(col, 0.8), 0.5);
      for (let j = 0.6; j < d - 0.01; j += 0.6) line(proj(x, y + j, z), proj(x + w, y + j, z), shade(col, 0.8), 0.5);
    } else if (def.key === 'gazon') {
      const z = 0.05; box(x, y, w, d, 0, z, col);
      let idx = 0;
      for (let i = 0; i < w - 0.01; i += 0.7, idx++) { const w2 = Math.min(0.7, w - i); poly([proj(x + i, y, z), proj(x + i + w2, y, z), proj(x + i + w2, y + d, z), proj(x + i, y + d, z)], idx % 2 ? shade(col, 1.13) : shade(col, 1.0)); }
    } else if (def.key === 'border') {
      box(x, y, w, d, 0, 0.08, '#6B4A2B');
      const nx = Math.max(1, Math.round(w / 0.85)), ny = Math.max(1, Math.round(d / 0.85));
      const greens = ['#3E7D34', '#4E8F3F', '#356E2C']; const flowers = ['#D98FB0', '#E7C44B', '#C96A6A']; let c = 0;
      const bushes = [];
      for (let ix = 0; ix < nx; ix++) for (let iy = 0; iy < ny; iy++) { const cx = x + (ix + 0.5) * w / nx, cy = y + (iy + 0.5) * d / ny; bushes.push({ cx, cy, c: c++ }); }
      bushes.sort((a, b) => (a.cx + a.cy) - (b.cx + b.cy));
      bushes.forEach(({ cx, cy, c }) => {
        const g0 = proj(cx, cy, 0), p = proj(cx, cy, 0.4); const r = Math.min(w / nx, d / ny) * s * 0.5;
        els.push(<ellipse key={key()} cx={g0[0]} cy={g0[1]} rx={r * 1.1} ry={r * 0.5} fill="rgba(0,0,0,0.08)" />);
        els.push(<circle key={key()} cx={p[0]} cy={p[1]} r={r} fill={greens[c % 3]} />);
        els.push(<circle key={key()} cx={p[0] - r * 0.32} cy={p[1] - r * 0.3} r={r * 0.5} fill={shade(greens[c % 3], 1.28)} />);
        if (c % 2 === 0) els.push(<circle key={key()} cx={p[0] + r * 0.25} cy={p[1] - r * 0.1} r={r * 0.2} fill={flowers[c % 3]} />);
      });
    } else if (def.key === 'vlonder') {
      const z = 0.26; box(x, y, w, d, 0, z, col);
      if (w >= d) { for (let j = 0.25; j < d - 0.01; j += 0.25) line(proj(x, y + j, z), proj(x + w, y + j, z), shade(col, 0.72), 0.5); }
      else { for (let i = 0.25; i < w - 0.01; i += 0.25) line(proj(x + i, y, z), proj(x + i, y + d, z), shade(col, 0.72), 0.5); }
    } else if (def.key === 'vijver') {
      poly([proj(x, y, 0), proj(x + w, y, 0), proj(x + w, y + d, 0), proj(x, y + d, 0)], '#AEB6A0');
      const m = Math.min(0.35, w / 3, d / 3);
      poly([proj(x + m, y + m, 0), proj(x + w - m, y + m, 0), proj(x + w - m, y + d - m, 0), proj(x + m, y + d - m, 0)], col, shade(col, 0.7), 0.6);
      poly([proj(x + m * 1.4, y + m * 1.4, 0), proj(x + w * 0.55, y + m * 1.4, 0), proj(x + w * 0.42, y + d * 0.45, 0)], 'rgba(255,255,255,0.22)');
    } else if (def.key === 'zwembad') {
      poly([proj(x, y, 0), proj(x + w, y, 0), proj(x + w, y + d, 0), proj(x, y + d, 0)], '#E6EAE0');
      const m = 0.3; poly([proj(x + m, y + m, 0), proj(x + w - m, y + m, 0), proj(x + w - m, y + d - m, 0), proj(x + m, y + d - m, 0)], col, shade(col, 0.75), 0.6);
      for (let j = m + 0.6; j < d - m; j += 0.9) line(proj(x + m + 0.2, y + j, 0), proj(x + w - m - 0.2, y + j, 0), 'rgba(255,255,255,0.16)', 1);
    } else if (def.key === 'schutting') {
      const z = 1.8; box(x, y, w, d, 0, z, col);
      for (let i = 0.16; i < w - 0.01; i += 0.16) line(proj(x + i, y + d, 0), proj(x + i, y + d, z), shade(col, 0.66), 0.5);
    } else if (def.key === 'pergola') {
      const z = 2.3, ps = 0.14;
      [[x, y], [x + w - ps, y], [x, y + d - ps], [x + w - ps, y + d - ps]].forEach(([px, py]) => box(px, py, ps, ps, 0, z, '#6E4A2C'));
      box(x, y, w, ps, z - 0.16, z, '#7A5433'); box(x, y + d - ps, w, ps, z - 0.16, z, '#7A5433');
      for (let i = 0.5; i < w - 0.01; i += 0.5) line(proj(x + i, y, z), proj(x + i, y + d, z), shade('#7A5433', 0.85), 1);
    } else if (def.key === 'boom') {
      const cx = x + w / 2, cy = y + d / 2, hz = def.hz; const base = proj(cx, cy, 0), tt = proj(cx, cy, hz * 0.5), cr = proj(cx, cy, hz); const rad = w * s * 0.62;
      els.push(<ellipse key={key()} cx={base[0]} cy={base[1]} rx={w * s * 0.5} ry={w * s * 0.28} fill="rgba(0,0,0,0.12)" />);
      els.push(<line key={key()} x1={base[0]} y1={base[1]} x2={tt[0]} y2={tt[1]} stroke="#6B4A2B" strokeWidth={Math.max(3, s * 0.16)} strokeLinecap="round" />);
      els.push(<circle key={key()} cx={cr[0]} cy={cr[1] + rad * 0.15} r={rad * 0.85} fill="#2A6127" />);
      els.push(<circle key={key()} cx={cr[0]} cy={cr[1]} r={rad} fill="#357030" />);
      els.push(<circle key={key()} cx={cr[0] - rad * 0.3} cy={cr[1] - rad * 0.3} r={rad * 0.5} fill="#4A9440" />);
    } else if (def.key === 'tuinhuis' || def.key === 'gebouw') {
      const wz = def.hz; const roof = def.key === 'gebouw' ? '#6E4A3A' : '#9B5240';
      box(x, y, w, d, 0, wz, col);
      const rH = wz + (def.key === 'gebouw' ? 1.0 : 0.75), midY = y + d / 2;
      poly([proj(x, y, wz), proj(x + w, y, wz), proj(x + w, midY, rH), proj(x, midY, rH)], shade(roof, 0.82)); // achterdak
      poly([proj(x + w, y, wz), proj(x + w, y + d, wz), proj(x + w, midY, rH)], shade(col, 0.9)); // rechter topgevel
      poly([proj(x, y + d, wz), proj(x + w, y + d, wz), proj(x + w, midY, rH), proj(x, midY, rH)], roof); // voordak (bovenop)
      const dw = 0.9, dcx = x + w / 2;
      poly([proj(dcx - dw / 2, y + d, 0), proj(dcx + dw / 2, y + d, 0), proj(dcx + dw / 2, y + d, 1.9), proj(dcx - dw / 2, y + d, 1.9)], '#5A4632'); // deur
    } else {
      box(x, y, w, d, 0, Math.max(def.hz, 0.1), col);
    }
    return <g key={k}>{els}</g>;
  };

  const grond = grondPoly.map(c => proj(c[0], c[1], 0));
  const cr = cutRect(plotW, plotD, cutCfg);
  const depthKey = (it) => { if (it.kind === 'shape') { const c = polyCentroid(it.points); return c[0] + c[1]; } return (it.x + it.w / 2) + (it.y + it.d / 2); };
  const sorted = [...items].sort((a, b) => depthKey(a) - depthKey(b));

  return (
    <svg viewBox={`${minX} ${minY} ${maxX - minX} ${maxY - minY}`} className="my-4" style={{ width: '100%', maxWidth: Math.min(width + 140, 780), height: 'auto' }}>
      <polygon points={P(grond)} fill="#CBDDB6" stroke={shade('#0B9D46', 0.8)} strokeWidth="1.5" />
      {cr && <polygon points={P([[cr.x0, cr.y0], [cr.x1, cr.y0], [cr.x1, cr.y1], [cr.x0, cr.y1]].map(p => proj(p[0], p[1], 0)))} fill="rgba(90,96,102,0.18)" stroke="rgba(90,96,102,0.4)" strokeWidth="1" strokeDasharray="3 3" />}
      {Array.from({ length: Math.floor(plotW) + 1 }).map((_, i) => { const a = proj(i, 0, 0), b = proj(i, plotD, 0); return <line key={'gx' + i} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke="rgba(31,33,19,0.05)" strokeWidth="0.6" />; })}
      {Array.from({ length: Math.floor(plotD) + 1 }).map((_, i) => { const a = proj(0, i, 0), b = proj(plotW, i, 0); return <line key={'gy' + i} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke="rgba(31,33,19,0.05)" strokeWidth="0.6" />; })}
      {sorted.map((it, k) => drawItem(it, k))}
      {items.length === 0 && <text x={(minX + maxX) / 2} y={(minY + maxY) / 2} textAnchor="middle" fill="rgba(31,33,19,0.4)" fontSize={Math.max(11, s * 0.6)} fontWeight="600">Voeg elementen toe in de plattegrond</text>}
    </svg>
  );
}

// ── Offerte-stap ─────────────────────────────────────────────────────────────
function OfferteStap({ items, tier, setTier, totals, adres, plotW, plotD, cutCfg, netArea, onTerug }) {
  const [form, setForm] = useState({ naam: '', email: '', telefoon: '' });
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const regels = items.map(it => ({ label: DEF[it.type].label, hoeveelheid: itemHoeveelheid(it), prijs: itemPrice(it, tier), info: DEF[it.type].unit === 'info' }));
  const cornerNL = { nw: 'linksachter', ne: 'rechtsachter', sw: 'linksvoor', se: 'rechtsvoor' };
  const vorm = cutCfg ? `L-vorm (hoektuin, uitsparing ${cornerNL[cutCfg.corner]} ${cutCfg.cw}×${cutCfg.cd} m)` : 'Rechthoek';

  const verstuur = async () => {
    setLoading(true);
    try {
      await fetch('/api/leads', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          naam: form.naam, email: form.email, telefoon: form.telefoon,
          bron: 'configurator', plaats: adres?.naam || '',
          tuin_w: plotW, tuin_d: plotD, tier: TIERS.find(t => t.key === tier).label,
          richtprijs: totals[tier],
          ontwerp: { vorm, oppervlak: netArea, items: regels.map(r => `${r.label} (${r.hoeveelheid})${r.info ? '' : ' — ' + euro(r.prijs)}`) },
          note: `Configurator-ontwerp · ${plotW}×${plotD} m · ${netArea} m² · ${TIERS.find(t => t.key === tier).label}`,
        }),
      });
    } catch { /* concept */ }
    setLoading(false); setSent(true);
  };

  if (sent) return (
    <div className="max-w-lg mx-auto text-center p-10 rounded-3xl" style={{ background: WHITE, border: `1px solid ${LINE}` }}>
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: SOFT }}><CheckCircle className="w-8 h-8" style={{ color: BLUE }} /></div>
      <h2 className="font-semibold text-xl mb-2" style={{ fontFamily: FONT_H, color: NAVY }}>Ontwerp ontvangen</h2>
      <p className="text-sm mb-6" style={{ color: MUTED }}>Bedankt! Wij nemen uw ontwerp door en nemen contact met u op met een offerte op maat en een afspraak voor de schouw.</p>
      <Link to={BASE || '/'} className="inline-flex items-center gap-2 text-sm font-bold px-6 py-3 rounded-xl text-white" style={{ background: BLUE }}>Terug naar de website</Link>
    </div>
  );

  return (
    <div className="grid lg:grid-cols-2 gap-8 items-start">
      <div className="p-7 md:p-9 rounded-3xl" style={{ background: WHITE, border: `1px solid ${LINE}` }}>
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] mb-2" style={{ color: BLUE }}>Uw ontwerp</p>
        <h2 className="font-semibold mb-1" style={{ fontFamily: FONT_H, color: NAVY, fontSize: '1.3rem' }}>Overzicht</h2>
        <p className="text-sm mb-5" style={{ color: MUTED }}>{adres?.naam ? adres.naam + ' · ' : ''}{vorm} · {netArea} m²</p>
        <div className="space-y-2 mb-5">
          {regels.length === 0 && <p className="text-sm" style={{ color: MUTED }}>Nog geen elementen toegevoegd.</p>}
          {regels.map((r, i) => (
            <div key={i} className="flex items-center justify-between gap-3 py-2 border-b" style={{ borderColor: LINE }}>
              <span className="text-sm font-semibold" style={{ color: NAVY }}>{r.label} <span className="font-normal" style={{ color: MUTED }}>· {r.hoeveelheid}</span></span>
              <span className="text-sm font-bold" style={{ color: r.info ? MUTED : NAVY }}>{r.info ? 'bestaand' : euro(r.prijs)}</span>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2 mb-4">
          {TIERS.map(t => (<button key={t.key} onClick={() => setTier(t.key)} className="flex-1 py-2.5 rounded-xl text-xs font-bold transition-all" style={tier === t.key ? { background: BLUE, color: WHITE } : { background: LIGHT, color: MUTED, border: `1px solid ${LINE}` }}>{t.label}</button>))}
        </div>
        <div className="p-4 rounded-2xl flex items-center justify-between" style={{ background: NAVY }}>
          <span className="text-sm font-semibold text-white">Richtprijs · {TIERS.find(t => t.key === tier).label}</span>
          <span className="font-bold text-white" style={{ fontFamily: FONT_H, fontSize: '1.4rem' }}>{euro(totals[tier])}</span>
        </div>
        <p className="text-[11px] mt-2" style={{ color: MUTED }}>Indicatief en excl. btw. De exacte offerte stellen wij op na een schouw.</p>
      </div>

      <div className="p-7 md:p-9 rounded-3xl" style={{ background: WHITE, border: `1px solid ${LINE}` }}>
        <h2 className="font-semibold mb-2" style={{ fontFamily: FONT_H, color: NAVY, fontSize: '1.3rem' }}>Ontvang uw offerte</h2>
        <p className="text-sm mb-6" style={{ color: MUTED }}>Laat uw gegevens achter. Wij sturen u uw ontwerp met een prijs op maat en plannen een afspraak.</p>
        <div className="space-y-2.5 mb-4">
          <input placeholder="Naam *" value={form.naam} onChange={e => set('naam', e.target.value)} className="w-full px-4 py-3.5 text-sm rounded-xl border outline-none" style={{ borderColor: LINE, background: WHITE, color: INK }} />
          <div className="grid grid-cols-2 gap-2.5">
            <input type="email" placeholder="E-mail *" value={form.email} onChange={e => set('email', e.target.value)} className="w-full px-4 py-3.5 text-sm rounded-xl border outline-none" style={{ borderColor: LINE, background: WHITE, color: INK }} />
            <input type="tel" placeholder="Telefoon *" value={form.telefoon} onChange={e => set('telefoon', e.target.value)} className="w-full px-4 py-3.5 text-sm rounded-xl border outline-none" style={{ borderColor: LINE, background: WHITE, color: INK }} />
          </div>
        </div>
        <button onClick={verstuur} disabled={!form.naam || !form.email || !form.telefoon || loading} className="w-full flex items-center justify-center gap-2 py-3.5 text-sm font-bold rounded-xl text-white transition-all hover:scale-[1.02] disabled:opacity-30" style={{ background: BLUE }}>
          {loading && <span className="w-4 h-4 border-2 rounded-full animate-spin" style={{ borderColor: 'rgba(255,255,255,0.4)', borderTopColor: WHITE }} />}
          {loading ? 'Verzenden…' : 'Verstuur ontwerp & ontvang offerte'} {!loading && <ArrowUpRight className="w-4 h-4" />}
        </button>
        <button onClick={onTerug} className="w-full mt-2 py-2.5 text-xs font-bold rounded-xl" style={{ color: MUTED }}>← Terug naar het ontwerp</button>
        <p className="text-[11px] mt-4 flex items-center gap-1.5" style={{ color: MUTED }}><Phone className="w-3.5 h-3.5" /> Liever bellen? {BRAND.telTxt}</p>
      </div>
    </div>
  );
}
