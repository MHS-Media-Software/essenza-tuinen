// WebAuthn (passkeys) — low-level, zonder extra npm-pakket.
// Genoeg CBOR om een attestationObject en een COSE-sleutel te lezen, plus
// handtekeningverificatie met node:crypto (ES256 en RS256, de twee algoritmes
// die passkeys in de praktijk gebruiken).
import crypto from 'node:crypto';

const b64u = (buf) => Buffer.from(buf).toString('base64url');
const fromB64u = (s) => Buffer.from(String(s || '').replace(/-/g, '+').replace(/_/g, '/'), 'base64');

// ── CBOR (alleen wat WebAuthn nodig heeft) ───────────────────────────────────
// Geeft [waarde, nieuwe offset]. Maps worden een Map, zodat de negatieve
// integer-labels van een COSE-sleutel (-1, -2, -3) intact blijven.
function cborLees(buf, i) {
  const eerste = buf[i++];
  const type = eerste >> 5;
  const kort = eerste & 0x1f;
  let len = kort;
  if (kort === 24) { len = buf[i]; i += 1; }
  else if (kort === 25) { len = buf.readUInt16BE(i); i += 2; }
  else if (kort === 26) { len = buf.readUInt32BE(i); i += 4; }
  else if (kort === 27) { len = Number(buf.readBigUInt64BE(i)); i += 8; }
  else if (kort > 27) throw new Error('CBOR: onbekende lengte');

  switch (type) {
    case 0: return [len, i];
    case 1: return [-1 - len, i];
    case 2: return [buf.subarray(i, i + len), i + len];
    case 3: return [buf.subarray(i, i + len).toString('utf8'), i + len];
    case 4: {
      const arr = [];
      for (let n = 0; n < len; n++) { const [v, ni] = cborLees(buf, i); arr.push(v); i = ni; }
      return [arr, i];
    }
    case 5: {
      const m = new Map();
      for (let n = 0; n < len; n++) {
        const [k, ki] = cborLees(buf, i); i = ki;
        const [v, vi] = cborLees(buf, i); i = vi;
        m.set(k, v);
      }
      return [m, i];
    }
    case 7:
      if (kort === 20) return [false, i];
      if (kort === 21) return [true, i];
      if (kort === 22) return [null, i];
      if (kort === 23) return [undefined, i];
      throw new Error('CBOR: onbekend simpel type');
    default: throw new Error('CBOR: type ' + type);
  }
}
function cborDecode(buf) { return cborLees(buf, 0)[0]; }

// COSE-sleutel weer terug naar CBOR (om op te slaan) — alleen de map-vorm die
// wij zelf uitlezen, met integer-labels.
function cborEncodeCoseMap(m) {
  const kop = (type, n) => {
    if (n < 24) return Buffer.from([(type << 5) | n]);
    if (n < 256) return Buffer.from([(type << 5) | 24, n]);
    const b = Buffer.alloc(3); b.writeUInt8((type << 5) | 25, 0); b.writeUInt16BE(n, 1); return b;
  };
  const stuk = (v) => {
    if (typeof v === 'number') return v >= 0 ? kop(0, v) : kop(1, -1 - v);
    if (Buffer.isBuffer(v)) return Buffer.concat([kop(2, v.length), v]);
    if (typeof v === 'string') { const b = Buffer.from(v, 'utf8'); return Buffer.concat([kop(3, b.length), b]); }
    throw new Error('CBOR-encode: onverwacht type');
  };
  const delen = [kop(5, m.size)];
  for (const [k, v] of m) { delen.push(stuk(k), stuk(v)); }
  return Buffer.concat(delen);
}

// ── authenticatorData ────────────────────────────────────────────────────────
function parseAuthData(buf) {
  if (!buf || buf.length < 37) throw new Error('authenticatorData te kort');
  const rpIdHash = buf.subarray(0, 32);
  const flags = buf[32];
  const counter = buf.readUInt32BE(33);
  const out = {
    rpIdHash, flags, counter,
    userPresent: !!(flags & 0x01),
    userVerified: !!(flags & 0x04),
    heeftCredential: !!(flags & 0x40),
  };
  if (out.heeftCredential) {
    let i = 37 + 16; // aaguid overslaan
    const credLen = buf.readUInt16BE(i); i += 2;
    out.credentialId = buf.subarray(i, i + credLen); i += credLen;
    const [cose, eind] = cborLees(buf, i);
    out.coseKey = cose;
    out.coseBytes = buf.subarray(i, eind);
  }
  return out;
}

// ── COSE-sleutel → verifieerbare sleutel + handtekeningcontrole ──────────────
// kty 2 = EC2 (P-256, alg -7), kty 3 = RSA (alg -257).
function coseNaarKey(cose) {
  const kty = cose.get(1);
  if (kty === 2) {
    const x = cose.get(-2), y = cose.get(-3);
    if (!x || !y) throw new Error('COSE: EC-sleutel onvolledig');
    return { key: crypto.createPublicKey({ key: { kty: 'EC', crv: 'P-256', x: b64u(x), y: b64u(y) }, format: 'jwk' }), soort: 'ec' };
  }
  if (kty === 3) {
    const n = cose.get(-1), e = cose.get(-2);
    if (!n || !e) throw new Error('COSE: RSA-sleutel onvolledig');
    return { key: crypto.createPublicKey({ key: { kty: 'RSA', n: b64u(n), e: b64u(e) }, format: 'jwk' }), soort: 'rsa' };
  }
  throw new Error('COSE: niet-ondersteund sleuteltype');
}

function verifieerHandtekening(coseBytes, data, handtekening) {
  const { key } = coseNaarKey(cborDecode(coseBytes));
  return crypto.verify('sha256', data, key, handtekening);
}

// ── Relying party: welk domein en welke herkomsten mogen ─────────────────────
// rpId is het domein zonder 'www.', zodat een passkey op zowel essenzatuinen.nl
// als www.essenzatuinen.nl werkt.
function rpId(req) {
  const host = String(req.headers.host || '').split(':')[0].toLowerCase();
  return host.startsWith('www.') ? host.slice(4) : host;
}
function origins(req) {
  const rp = rpId(req);
  const host = String(req.headers.host || '').toLowerCase();
  if (rp === 'localhost' || rp === '127.0.0.1') return new Set([`http://${host}`, `https://${host}`]);
  return new Set([`https://${rp}`, `https://www.${rp}`]);
}

export { b64u, fromB64u, cborDecode, cborEncodeCoseMap, parseAuthData, coseNaarKey, verifieerHandtekening, rpId, origins };
