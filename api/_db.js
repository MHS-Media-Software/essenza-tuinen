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
      btw REAL DEFAULT 21, actief INTEGER DEFAULT 1, sort INTEGER DEFAULT 0, created TEXT )` },
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

    // ── Personeel: accounts, rechten, uren en planning ──────────────────────
    { sql: `CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT UNIQUE NOT NULL, pass_hash TEXT,
      naam TEXT, telefoon TEXT, rol TEXT DEFAULT 'medewerker', rechten TEXT,
      actief INTEGER DEFAULT 1, pass_version INTEGER DEFAULT 1,
      created TEXT, last_login TEXT )` },
    { sql: `CREATE TABLE IF NOT EXISTS invites (
      id INTEGER PRIMARY KEY AUTOINCREMENT, token TEXT UNIQUE, soort TEXT DEFAULT 'invite',
      email TEXT, naam TEXT, rol TEXT, rechten TEXT, user_id INTEGER,
      door TEXT, created TEXT, exp TEXT, gebruikt TEXT )` },
    { sql: `CREATE TABLE IF NOT EXISTS hours (
      id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, datum TEXT NOT NULL, week TEXT,
      start TEXT, eind TEXT, pauze INTEGER DEFAULT 0, uren REAL DEFAULT 0,
      soort TEXT DEFAULT 'werk', lead_id INTEGER, project TEXT, omschrijving TEXT, shift_id INTEGER,
      status TEXT DEFAULT 'concept', beoordeeld_door INTEGER, beoordeeld_op TEXT, beoordeling_note TEXT,
      created TEXT, updated TEXT )` },
    { sql: `CREATE TABLE IF NOT EXISTS shifts (
      id INTEGER PRIMARY KEY AUTOINCREMENT, datum TEXT NOT NULL, van TEXT, tot TEXT, user_id INTEGER,
      titel TEXT, lead_id INTEGER, klant TEXT, adres TEXT, notitie TEXT,
      soort TEXT DEFAULT 'klus', status TEXT DEFAULT 'gepland',
      created_by INTEGER, created TEXT, updated TEXT )` },
    { sql: `CREATE TABLE IF NOT EXISTS passkeys (
      id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, cred_id TEXT UNIQUE,
      public_key TEXT, sign_count INTEGER DEFAULT 0, naam TEXT, created TEXT, last_used TEXT )` },
    { sql: `CREATE TABLE IF NOT EXISTS login_attempts ( id INTEGER PRIMARY KEY AUTOINCREMENT, sleutel TEXT, ts INTEGER )` },
    { sql: 'CREATE INDEX IF NOT EXISTS idx_hours_user_datum ON hours(user_id, datum)' },
    { sql: 'CREATE INDEX IF NOT EXISTS idx_hours_week ON hours(week)' },
    { sql: 'CREATE INDEX IF NOT EXISTS idx_shifts_datum ON shifts(datum)' },
    { sql: 'CREATE INDEX IF NOT EXISTS idx_attempts_ts ON login_attempts(ts)' },
  ])
    // Migraties (idempotent): kolommen die later zijn toegevoegd aan bestaande tabellen.
    .then(() => run([{ sql: 'ALTER TABLE products ADD COLUMN btw REAL DEFAULT 21' }]).catch(() => {}))
    // 'wacht' = via een deelbare link aangemaakt, moet nog goedgekeurd worden.
    .then(() => run([{ sql: "ALTER TABLE users ADD COLUMN status TEXT DEFAULT 'actief'" }]).catch(() => {}))
    // Onthoudt of we deze medewerker al een keer een passkey hebben aangeboden.
    .then(() => run([{ sql: 'ALTER TABLE users ADD COLUMN passkey_gevraagd INTEGER DEFAULT 0' }]).catch(() => {}))
    // 'sso' = via Google-teamlogin binnengekomen MHS-account (geen wachtwoord).
    .then(() => run([{ sql: "ALTER TABLE users ADD COLUMN via TEXT DEFAULT 'lokaal'" }]).catch(() => {}))
    // Eén klus met meerdere mensen = meerdere regels met dezelfde 'groep'.
    .then(() => run([{ sql: 'ALTER TABLE shifts ADD COLUMN groep TEXT' }]).catch(() => {}))
    // Losse namen zonder account die meedraaien (bijvoorbeeld een stagiair).
    .then(() => run([{ sql: 'ALTER TABLE shifts ADD COLUMN extern TEXT' }]).catch(() => {}))
    // Reistijd staat los van de gewerkte uren: die wordt apart gefactureerd.
    .then(() => run([{ sql: 'ALTER TABLE hours ADD COLUMN reistijd REAL DEFAULT 0' }]).catch(() => {}))
    // Handmatig toegevoegde relaties, plus adresgegevens bij een klant.
    .then(() => run([{ sql: 'ALTER TABLE leads ADD COLUMN adres TEXT' }]).catch(() => {}))
    .catch(e => { _schemaReady = null; throw e; });
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

// ── Rechten ───────────────────────────────────────────────────────────────────
// Elk recht is een losse schakelaar per medewerker. De rol is enkel een voorzet
// die de schakelaars in één klik goed zet; daarna staan ze los van elkaar.
const PERMS = [
  { key: 'uren_eigen', label: 'Eigen uren invullen', groep: 'Uren' },
  { key: 'uren_alle', label: 'Uren van iedereen zien en goedkeuren', groep: 'Uren' },
  { key: 'planning_bekijken', label: 'Eigen planning bekijken', groep: 'Planning' },
  { key: 'planning_alle', label: 'Planning van het hele team zien', groep: 'Planning' },
  { key: 'planning_beheren', label: 'Planning maken en wijzigen', groep: 'Planning' },
  { key: 'leads', label: 'Aanvragen', groep: 'Administratie' },
  { key: 'offertes', label: 'Offertes', groep: 'Administratie' },
  { key: 'facturen', label: 'Facturen', groep: 'Administratie' },
  { key: 'producten', label: 'Producten en prijzen', groep: 'Administratie' },
  { key: 'instellingen', label: 'Instellingen', groep: 'Beheer' },
  { key: 'team', label: 'Medewerkers en rechten beheren', groep: 'Beheer' },
];
const PERM_KEYS = PERMS.map(p => p.key);
const ROLLEN = {
  beheerder: PERM_KEYS.slice(),
  planner: ['uren_eigen', 'uren_alle', 'planning_bekijken', 'planning_alle', 'planning_beheren', 'leads'],
  medewerker: ['uren_eigen', 'planning_bekijken'],
};
function cleanPerms(list, rol) {
  if (!Array.isArray(list)) return (ROLLEN[rol] || ROLLEN.medewerker).slice();
  return PERM_KEYS.filter(k => list.includes(k));
}

// ── Auth (HMAC-getekende cookie met alleen het gebruikers-id) ─────────────────
// De rechten zitten bewust NIET in de cookie: ze worden elke request vers uit de
// database gelezen, zodat een ingetrokken recht direct werkt.
const SECRET = process.env.SESSION_SECRET || 'dev-secret-change-me';
const COOKIE = 'et_admin';
function b64u(buf) { return Buffer.from(buf).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); }
function signToken(payloadObj) {
  const payload = b64u(JSON.stringify(payloadObj));
  const sig = b64u(crypto.createHmac('sha256', SECRET).update(payload).digest());
  return `${payload}.${sig}`;
}
function verifyToken(tok) {
  if (!tok || tok.indexOf('.') < 0) return null;
  const [payload, sig] = tok.split('.');
  const exp = b64u(crypto.createHmac('sha256', SECRET).update(payload).digest());
  let ok = false;
  try { ok = crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(exp)); } catch { return null; }
  if (!ok) return null;
  try {
    const p = JSON.parse(Buffer.from(payload.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString());
    return p.exp > Date.now() ? p : null;
  } catch { return null; }
}
function readCookie(req, name) {
  const raw = req.headers.cookie || '';
  const m = raw.match(new RegExp('(?:^|;\\s*)' + name + '=([^;]+)'));
  return m ? decodeURIComponent(m[1]) : '';
}

// Aantal accounts: zolang dit 0 is mag het gedeelde ADMIN_PASSWORD nog gebruikt
// worden om het eerste beheerdersaccount aan te maken. Daarna nooit meer.
async function userCount() {
  const rows = await q('SELECT COUNT(*) AS n FROM users WHERE actief=1');
  return Number(rows[0] && rows[0].n) || 0;
}

// Huidige gebruiker of null. Resultaat wordt per request gecachet op het req-object.
async function currentUser(req) {
  if (req._etUser !== undefined) return req._etUser;
  req._etUser = null;
  const p = verifyToken(readCookie(req, COOKIE));
  if (p && p.u) {
    const rows = await q('SELECT id,email,naam,telefoon,rol,rechten,actief,status,via,pass_version,passkey_gevraagd FROM users WHERE id=?', [p.u]);
    const u = rows[0];
    if (u && u.actief && Number(u.pass_version || 1) === Number(p.v || 1)) {
      let rechten = []; try { rechten = JSON.parse(u.rechten || '[]'); } catch { rechten = []; }
      req._etUser = { ...u, rechten: cleanPerms(rechten, u.rol) };
      // Meekijken als een medewerker: 'a' is de beheerder die dat gestart is.
      if (p.a) {
        const b = (await q('SELECT id,naam,email FROM users WHERE id=? AND actief=1', [p.a]))[0];
        if (b) req._etUser.bekijkAls = { door: b.id, doorNaam: b.naam || b.email };
        else req._etUser = null; // beheerder bestaat niet meer → sessie ongeldig
      }
    }
  }
  return req._etUser;
}
// Meekijken is nadrukkelijk alleen-lezen.
function isMeekijken(u) { return !!(u && u.bekijkAls); }
async function hasPerm(req, perm) {
  const u = await currentUser(req);
  if (!u) return false;
  return !perm || u.rechten.includes(perm);
}
// Guard voor endpoints: geeft true als het mag, anders is het antwoord al verstuurd.
async function requirePerm(req, res, perm) {
  const u = await currentUser(req);
  if (!u) { res.status(401).json({ ok: false, error: 'auth' }); return false; }
  if (perm && !u.rechten.includes(perm)) {
    res.status(403).json({ ok: false, error: 'Je hebt geen toegang tot dit onderdeel.' });
    return false;
  }
  if (isMeekijken(u) && req.method !== 'GET') {
    res.status(403).json({ ok: false, error: 'Je kijkt mee als ' + (u.naam || u.email) + '. Wijzigen kan alleen vanuit je eigen account.' });
    return false;
  }
  return true;
}
// Alleen nog "is er iemand ingelogd" — gebruikt door gedeelde leesroutes.
async function requireUser(req, res) { return requirePerm(req, res, null); }

// Cookies stapelen i.p.v. overschrijven: bij passkey-login worden de sessie- en
// de challenge-cookie in hetzelfde antwoord gezet.
function zetCookie(res, str) {
  // De lijst wordt zelf bijgehouden: terugvragen via res.getHeader() werkt niet
  // overal, en dan overschreef de tweede cookie stilletjes de eerste.
  const lijst = res._etCookies || (res._etCookies = []);
  lijst.push(str);
  res.setHeader('Set-Cookie', lijst.slice());
}
// Leesbaar vlaggetje naast de sessiecookie. Bevat niets geheims en geeft geen
// toegang; de site gebruikt het alleen om de beheerknop te tonen zonder daarvoor
// bij elke bezoeker de server te hoeven bevragen.
const HINT_COOKIE = 'et_beheer';
// alsVan = id van de beheerder die meekijkt (leeg bij een gewone sessie).
function setAuthCookie(res, user, alsVan) {
  const payload = { u: user.id, v: Number(user.pass_version || 1), exp: Date.now() + 7 * 864e5 };
  if (alsVan) { payload.a = alsVan; payload.exp = Date.now() + 2 * 3600e3; } // meekijken vervalt na 2 uur
  const tok = signToken(payload);
  zetCookie(res, `${COOKIE}=${tok}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${7 * 86400}`);
  zetCookie(res, `${HINT_COOKIE}=1; Path=/; Secure; SameSite=Lax; Max-Age=${7 * 86400}`);
}
function clearAuthCookie(res) {
  zetCookie(res, `${COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`);
  zetCookie(res, `${HINT_COOKIE}=; Path=/; Secure; SameSite=Lax; Max-Age=0`);
}

// ── Passkey-challenge (kort geldig, ondertekend, geen serverstate) ───────────
const WA_COOKIE = 'et_wa';
function setChallengeCookie(res, doel, challenge) {
  const tok = signToken({ d: doel, c: challenge, exp: Date.now() + 5 * 60000 });
  zetCookie(res, `${WA_COOKIE}=${tok}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=300`);
}
function leesChallenge(req, doel) {
  const p = verifyToken(readCookie(req, WA_COOKIE));
  return (p && p.d === doel) ? p.c : null;
}
function clearChallengeCookie(res) {
  zetCookie(res, `${WA_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`);
}

// ── Login-pogingen afremmen (per e-mail + IP, glijdend venster van 15 min) ────
function clientIp(req) {
  return String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'onbekend';
}
async function tooManyAttempts(req, email) {
  const sleutel = `${String(email || '').toLowerCase()}|${clientIp(req)}`;
  const since = Date.now() - 15 * 60000;
  await exec('DELETE FROM login_attempts WHERE ts < ?', [Date.now() - 3600000]).catch(() => {});
  const rows = await q('SELECT COUNT(*) AS n FROM login_attempts WHERE sleutel=? AND ts > ?', [sleutel, since]);
  return (Number(rows[0] && rows[0].n) || 0) >= 8;
}
async function noteAttempt(req, email) {
  const sleutel = `${String(email || '').toLowerCase()}|${clientIp(req)}`;
  await exec('INSERT INTO login_attempts(sleutel,ts) VALUES(?,?)', [sleutel, Date.now()]).catch(() => {});
}
async function clearAttempts(req, email) {
  const sleutel = `${String(email || '').toLowerCase()}|${clientIp(req)}`;
  await exec('DELETE FROM login_attempts WHERE sleutel=?', [sleutel]).catch(() => {});
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

// Willekeurig, niet te raden token (uitnodigings- en herstellinks).
function randomToken() { return crypto.randomBytes(24).toString('base64url'); }

// ISO-weeknummer als '2026-W33' — de eenheid waarin uren worden goedgekeurd.
function isoWeek(datum) {
  const d = new Date(`${String(datum).slice(0, 10)}T00:00:00Z`);
  if (isNaN(d)) return '';
  const dag = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dag);
  const jaarStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((d - jaarStart) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}
// Maandag (ISO) van de week waarin deze datum valt, als 'YYYY-MM-DD'.
function weekStart(datum) {
  const d = new Date(`${String(datum).slice(0, 10)}T00:00:00Z`);
  if (isNaN(d)) return '';
  const dag = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() - (dag - 1));
  return d.toISOString().slice(0, 10);
}

export { run, q, exec, ensureSchema, getSetting, setSetting, nextSeq, readBody, COOKIE,
  hashPw, verifyPw, customerEmail, setCustomerCookie, clearCustomerCookie,
  PERMS, PERM_KEYS, ROLLEN, cleanPerms, currentUser, hasPerm, requirePerm, requireUser, isMeekijken,
  setAuthCookie, clearAuthCookie, userCount, tooManyAttempts, noteAttempt, clearAttempts,
  setChallengeCookie, leesChallenge, clearChallengeCookie,
  randomToken, isoWeek, weekStart };
