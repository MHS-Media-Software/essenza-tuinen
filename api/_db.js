// Gedeelde datalaag (Turso / libSQL via HTTP pipeline) + admin-auth helpers.
// Geen npm-deps: pure fetch + node:crypto. CommonJS zodat het werkt zonder package.json.
import crypto from 'node:crypto';

const RAW_URL = process.env.TURSO_DATABASE_URL || '';
const TOKEN = process.env.TURSO_AUTH_TOKEN || '';
const HTTP_URL = RAW_URL.replace(/^libsql:\/\//, 'https://').replace(/\/+$/, '');

function encodeArg(v) {
  if (v === null || v === undefined) return { type: 'null' };
  if (typeof v === 'boolean') return { type: 'integer', value: v ? '1' : '0' };
  if (typeof v === 'number') return Number.isInteger(v) ? { type: 'integer', value: String(v) } : { type: 'float', value: v };
  return { type: 'text', value: String(v) };
}
function decodeCell(c) {
  if (!c || c.type === 'null') return null;
  if (c.type === 'integer') return Number(c.value);
  if (c.type === 'float') return typeof c.value === 'number' ? c.value : Number(c.value);
  return c.value; // text / blob(base64)
}

// Voer 1..n SQL-statements uit. Elk item: {sql, args?} of een kale sql-string.
async function run(statements) {
  if (!HTTP_URL || !TOKEN) throw new Error('Turso niet geconfigureerd (env ontbreekt)');
  const list = (Array.isArray(statements) ? statements : [statements]).map(s => {
    const o = typeof s === 'string' ? { sql: s } : s;
    return { type: 'execute', stmt: { sql: o.sql, args: (o.args || []).map(encodeArg) } };
  });
  list.push({ type: 'close' });
  const r = await fetch(`${HTTP_URL}/v2/pipeline`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ requests: list }),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(`Turso ${r.status}: ${JSON.stringify(j).slice(0, 200)}`);
  const out = [];
  for (const res of (j.results || [])) {
    if (res.type === 'error') throw new Error('SQL: ' + (res.error && res.error.message || 'fout'));
    const rr = res.response && res.response.result;
    if (!rr) { out.push({ rows: [], rowsAffected: 0 }); continue; }
    const cols = (rr.cols || []).map(c => c.name);
    const rows = (rr.rows || []).map(row => {
      const o = {}; row.forEach((cell, i) => { o[cols[i]] = decodeCell(cell); }); return o;
    });
    out.push({ rows, rowsAffected: rr.affected_row_count || 0, lastInsertRowid: rr.last_insert_rowid ? Number(rr.last_insert_rowid) : null });
  }
  return out;
}
// Gemak: één query → rows
async function q(sql, args) { const [res] = await run([{ sql, args }]); return res.rows; }
async function exec(sql, args) { const [res] = await run([{ sql, args }]); return res; }

// ── Schema (idempotent, 1x per cold start) ───────────────────────────────────
let _schemaReady = null;
function ensureSchema() {
  if (_schemaReady) return _schemaReady;
  _schemaReady = run([
    { sql: `CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT, categorie TEXT NOT NULL, naam TEXT NOT NULL,
      foto TEXT, inkoop REAL DEFAULT 0, uren REAL DEFAULT 0, eenheid TEXT DEFAULT 'm2',
      actief INTEGER DEFAULT 1, sort INTEGER DEFAULT 0, created TEXT )` },
    { sql: `CREATE TABLE IF NOT EXISTS leads (
      id INTEGER PRIMARY KEY AUTOINCREMENT, created TEXT, naam TEXT, email TEXT, telefoon TEXT,
      bron TEXT, plaats TEXT, tuin_w REAL, tuin_d REAL, tier TEXT, ontwerp TEXT, richtprijs REAL,
      status TEXT DEFAULT 'nieuw', note TEXT )` },
    { sql: `CREATE TABLE IF NOT EXISTS designs (
      id INTEGER PRIMARY KEY AUTOINCREMENT, token TEXT UNIQUE, created TEXT, updated TEXT,
      naam TEXT, email TEXT, data TEXT )` },
    { sql: `CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT UNIQUE, pass_hash TEXT, naam TEXT, created TEXT )` },
    { sql: `CREATE TABLE IF NOT EXISTS quotes (
      id INTEGER PRIMARY KEY AUTOINCREMENT, nummer TEXT, token TEXT UNIQUE, lead_id INTEGER,
      klant_naam TEXT, klant_email TEXT, klant_adres TEXT, datum TEXT, geldig_tot TEXT, tier TEXT,
      regels TEXT, btw_pct REAL DEFAULT 21, subtotaal REAL, btw REAL, totaal REAL,
      status TEXT DEFAULT 'concept', note TEXT, created TEXT, updated TEXT )` },
    { sql: `CREATE TABLE IF NOT EXISTS invoices (
      id INTEGER PRIMARY KEY AUTOINCREMENT, nummer TEXT, token TEXT UNIQUE, quote_id INTEGER, lead_id INTEGER,
      klant_naam TEXT, klant_email TEXT, klant_adres TEXT, datum TEXT, vervaldatum TEXT,
      regels TEXT, btw_pct REAL DEFAULT 21, subtotaal REAL, btw REAL, totaal REAL,
      status TEXT DEFAULT 'open', betaald_op TEXT, note TEXT, created TEXT )` },
    { sql: `CREATE TABLE IF NOT EXISTS mails (
      id INTEGER PRIMARY KEY AUTOINCREMENT, ref_type TEXT, ref_id INTEGER, aan TEXT, onderwerp TEXT,
      status TEXT, provider TEXT, fout TEXT, created TEXT )` },
    { sql: `CREATE TABLE IF NOT EXISTS settings ( key TEXT PRIMARY KEY, value TEXT )` },
  ]).catch(e => { _schemaReady = null; throw e; });
  return _schemaReady;
}

// Ophogende, doorlopende nummering (offertes/facturen) — atomair via RETURNING.
async function nextSeq(key) {
  const rows = await q(`INSERT INTO settings(key,value) VALUES(?, '1')
    ON CONFLICT(key) DO UPDATE SET value = CAST(value AS INTEGER) + 1 RETURNING value`, [key]);
  return Number(rows[0] && rows[0].value) || 1;
}

async function getSetting(key, fallback) {
  const rows = await q('SELECT value FROM settings WHERE key=?', [key]);
  if (!rows.length) return fallback;
  try { return JSON.parse(rows[0].value); } catch { return rows[0].value; }
}
async function setSetting(key, value) {
  await exec('INSERT INTO settings(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value',
    [key, JSON.stringify(value)]);
}

// ── Admin-auth (HMAC-getekende cookie, geen server-state) ─────────────────────
const SECRET = process.env.SESSION_SECRET || 'dev-secret-change-me';
const COOKIE = 'et_admin';
function b64u(buf) { return Buffer.from(buf).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); }
function signToken() {
  const payload = b64u(JSON.stringify({ r: 'admin', exp: Date.now() + 7 * 864e5 }));
  const sig = b64u(crypto.createHmac('sha256', SECRET).update(payload).digest());
  return `${payload}.${sig}`;
}
function verifyToken(tok) {
  if (!tok || tok.indexOf('.') < 0) return false;
  const [payload, sig] = tok.split('.');
  const exp = b64u(crypto.createHmac('sha256', SECRET).update(payload).digest());
  if (sig !== exp) return false;
  try { const p = JSON.parse(Buffer.from(payload.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString()); return p.r === 'admin' && p.exp > Date.now(); }
  catch { return false; }
}
function readCookie(req, name) {
  const raw = req.headers.cookie || '';
  const m = raw.match(new RegExp('(?:^|;\\s*)' + name + '=([^;]+)'));
  return m ? decodeURIComponent(m[1]) : '';
}
function isAdmin(req) { return verifyToken(readCookie(req, COOKIE)); }
function setAuthCookie(res) {
  res.setHeader('Set-Cookie', `${COOKIE}=${signToken()}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${7 * 86400}`);
}
function clearAuthCookie(res) {
  res.setHeader('Set-Cookie', `${COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`);
}
function requireAdmin(req, res) {
  if (isAdmin(req)) return true;
  res.status(401).json({ ok: false, error: 'auth' });
  return false;
}

// ── Wachtwoord-hashing (klantaccounts) ───────────────────────────────────────
function hashPw(pw) {
  const salt = crypto.randomBytes(16).toString('hex');
  const h = crypto.pbkdf2Sync(String(pw), salt, 120000, 32, 'sha256').toString('hex');
  return `${salt}$${h}`;
}
function verifyPw(pw, stored) {
  if (!stored || stored.indexOf('$') < 0) return false;
  const [salt, h] = stored.split('$');
  const cand = crypto.pbkdf2Sync(String(pw), salt, 120000, 32, 'sha256').toString('hex');
  try { return crypto.timingSafeEqual(Buffer.from(cand, 'hex'), Buffer.from(h, 'hex')); } catch { return false; }
}

// ── Klant-sessie (aparte cookie van de admin) ────────────────────────────────
const CUST_COOKIE = 'et_klant';
function signCustomer(email) {
  const payload = b64u(JSON.stringify({ r: 'klant', email, exp: Date.now() + 30 * 864e5 }));
  const sig = b64u(crypto.createHmac('sha256', SECRET).update(payload).digest());
  return `${payload}.${sig}`;
}
function verifyCustomer(tok) {
  if (!tok || tok.indexOf('.') < 0) return null;
  const [payload, sig] = tok.split('.');
  const exp = b64u(crypto.createHmac('sha256', SECRET).update(payload).digest());
  if (sig !== exp) return null;
  try { const p = JSON.parse(Buffer.from(payload.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString()); return (p.r === 'klant' && p.exp > Date.now()) ? p.email : null; }
  catch { return null; }
}
function customerEmail(req) { return verifyCustomer(readCookie(req, CUST_COOKIE)); }
function setCustomerCookie(res, email) {
  res.setHeader('Set-Cookie', `${CUST_COOKIE}=${signCustomer(email)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${30 * 86400}`);
}
function clearCustomerCookie(res) {
  res.setHeader('Set-Cookie', `${CUST_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`);
}

// Body-parser (Vercel parseert JSON meestal al, maar wees defensief)
async function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') { try { return JSON.parse(req.body); } catch { return {}; } }
  return await new Promise((resolve) => {
    let d = ''; req.on('data', c => { d += c; }); req.on('end', () => { try { resolve(JSON.parse(d || '{}')); } catch { resolve({}); } });
  });
}

export { run, q, exec, ensureSchema, getSetting, setSetting, nextSeq, isAdmin, requireAdmin, setAuthCookie, clearAuthCookie, readBody, COOKIE,
  hashPw, verifyPw, customerEmail, setCustomerCookie, clearCustomerCookie };
