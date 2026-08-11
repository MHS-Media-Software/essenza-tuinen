// Passkeys: inloggen zonder wachtwoord, voor beheerders én medewerkers.
// Registreren doe je als ingelogde gebruiker op je eigen apparaat; daarna kun
// je op dat apparaat inloggen met je vinger, gezicht of pincode.
//   GET                          -> mijn passkeys
//   POST {action:'registreer-start'|'registreer-klaar'}   (ingelogd)
//   POST {action:'login-start'|'login-klaar'}             (publiek)
//   DELETE {id}                  -> eigen passkey verwijderen
import crypto from 'node:crypto';
import * as db from './_db.js';
import { b64u, fromB64u, cborDecode, parseAuthData, verifieerHandtekening, rpId, origins } from './_webauthn.js';

const NU = () => new Date().toISOString();

function clientData(rauw) {
  const data = JSON.parse(fromB64u(rauw).toString('utf8'));
  return { ...data, hash: crypto.createHash('sha256').update(fromB64u(rauw)).digest() };
}
// Vergelijk zonder timingverschil; ongelijke lengtes zijn sowieso mis.
function zelfde(a, b) {
  const ba = Buffer.from(String(a || '')), bb = Buffer.from(String(b || ''));
  return ba.length === bb.length && crypto.timingSafeEqual(ba, bb);
}

export default async function handler(req, res) {
  try {
    await db.ensureSchema();
    const b = req.method === 'GET' ? {} : await db.readBody(req);
    const actie = b.action || '';

    // ── Mijn passkeys ────────────────────────────────────────────────────
    if (req.method === 'GET') {
      const ik = await db.currentUser(req);
      if (!ik) return res.status(401).json({ ok: false, error: 'auth' });
      const rows = await db.q('SELECT id,naam,created,last_used FROM passkeys WHERE user_id=? ORDER BY id', [ik.id]);
      return res.status(200).json({ ok: true, passkeys: rows });
    }

    if (req.method === 'DELETE') {
      const ik = await db.currentUser(req);
      if (!ik) return res.status(401).json({ ok: false, error: 'auth' });
      const r = await db.exec('DELETE FROM passkeys WHERE id=? AND user_id=?', [+b.id || 0, ik.id]);
      if (!r.rowsAffected) return res.status(404).json({ ok: false, error: 'Passkey niet gevonden.' });
      return res.status(200).json({ ok: true });
    }

    if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'method' });

    // ── Registreren: stap 1, opties opvragen ─────────────────────────────
    if (actie === 'registreer-start') {
      const ik = await db.currentUser(req);
      if (!ik) return res.status(401).json({ ok: false, error: 'auth' });
      const challenge = b64u(crypto.randomBytes(32));
      db.setChallengeCookie(res, 'reg', challenge);
      const bestaand = await db.q('SELECT cred_id FROM passkeys WHERE user_id=?', [ik.id]);
      return res.status(200).json({
        ok: true,
        publicKey: {
          challenge,
          rp: { id: rpId(req), name: 'Essenza Tuinen' },
          // Het user-handle is willekeurig en bevat geen persoonsgegevens.
          user: { id: b64u(Buffer.from('et-user-' + ik.id)), name: ik.email, displayName: ik.naam || ik.email },
          pubKeyCredParams: [{ type: 'public-key', alg: -7 }, { type: 'public-key', alg: -257 }],
          excludeCredentials: bestaand.map(p => ({ type: 'public-key', id: p.cred_id })),
          // 'required': de sleutel moet op het apparaat vindbaar zijn, anders kun
          // je later niet inloggen zonder eerst je e-mailadres te typen.
          // requireResidentKey staat erbij voor oudere browsers.
          authenticatorSelection: { userVerification: 'preferred', residentKey: 'preferred' },
          timeout: 60000,
        },
      });
    }

    // ── Registreren: stap 2, antwoord van het apparaat controleren ───────
    if (actie === 'registreer-klaar') {
      const ik = await db.currentUser(req);
      if (!ik) return res.status(401).json({ ok: false, error: 'auth' });
      const wil = db.leesChallenge(req, 'reg');
      db.clearChallengeCookie(res);
      if (!wil) return res.status(400).json({ ok: false, error: 'De aanvraag is verlopen. Probeer het opnieuw.' });

      let cd, att;
      try {
        cd = clientData(b.clientDataJSON);
        att = cborDecode(fromB64u(b.attestationObject));
      } catch { return res.status(400).json({ ok: false, error: 'Ongeldige passkey-gegevens.' }); }

      if (!zelfde(cd.challenge, wil)) return res.status(400).json({ ok: false, error: 'Controle mislukt — probeer het opnieuw.' });
      if (cd.type !== 'webauthn.create' || !origins(req).has(cd.origin)) {
        return res.status(400).json({ ok: false, error: 'Herkomst klopt niet.' });
      }
      const ad = parseAuthData(att.get('authData'));
      const rpHash = crypto.createHash('sha256').update(rpId(req)).digest();
      if (!ad.rpIdHash.equals(rpHash) || !ad.userPresent || !ad.heeftCredential) {
        return res.status(400).json({ ok: false, error: 'Verificatie mislukt.' });
      }

      const credId = b64u(ad.credentialId);
      const naam = String(b.naam || '').trim().slice(0, 60) || apparaatNaam(req);
      await db.exec('DELETE FROM passkeys WHERE cred_id=?', [credId]).catch(() => {});
      await db.exec('INSERT INTO passkeys(user_id,cred_id,public_key,sign_count,naam,created) VALUES(?,?,?,?,?,?)',
        [ik.id, credId, b64u(ad.coseBytes), ad.counter || 0, naam, NU()]);
      return res.status(200).json({ ok: true, naam });
    }

    // ── Inloggen: stap 1, opties opvragen ────────────────────────────────
    if (actie === 'login-start') {
      const [{ n }] = await db.q('SELECT COUNT(*) AS n FROM passkeys');
      if (!n) return res.status(404).json({ ok: false, error: 'Er is op deze site nog geen passkey ingesteld. Log in met je wachtwoord.' });
      const challenge = b64u(crypto.randomBytes(32));
      db.setChallengeCookie(res, 'login', challenge);
      // Geen allowCredentials: de browser laat zelf de passende passkeys zien
      // en we geven niet prijs welke passkeys er op deze site bestaan.
      return res.status(200).json({
        ok: true,
        publicKey: { challenge, rpId: rpId(req), userVerification: 'preferred', timeout: 60000 },
      });
    }

    // ── Inloggen: stap 2, handtekening controleren ───────────────────────
    if (actie === 'login-klaar') {
      const wil = db.leesChallenge(req, 'login');
      db.clearChallengeCookie(res);
      if (!wil) return res.status(400).json({ ok: false, error: 'De aanvraag is verlopen. Probeer het opnieuw.' });
      if (await db.tooManyAttempts(req, 'passkey')) {
        return res.status(429).json({ ok: false, error: 'Te veel pogingen. Probeer het over 15 minuten opnieuw.' });
      }

      const credId = String(b.credentialId || '').replace(/=+$/, '');
      const pk = (await db.q('SELECT * FROM passkeys WHERE cred_id=?', [credId]))[0];
      if (!pk) { await db.noteAttempt(req, 'passkey'); return res.status(400).json({ ok: false, error: 'Deze passkey is hier niet bekend.' }); }

      let cd, authData, sig;
      try {
        cd = clientData(b.clientDataJSON);
        authData = fromB64u(b.authenticatorData);
        sig = fromB64u(b.signature);
      } catch { return res.status(400).json({ ok: false, error: 'Ongeldige passkey-gegevens.' }); }

      if (!zelfde(cd.challenge, wil)) return res.status(400).json({ ok: false, error: 'Controle mislukt — probeer het opnieuw.' });
      if (cd.type !== 'webauthn.get' || !origins(req).has(cd.origin)) {
        return res.status(400).json({ ok: false, error: 'Herkomst klopt niet.' });
      }
      const ad = parseAuthData(authData);
      const rpHash = crypto.createHash('sha256').update(rpId(req)).digest();
      if (!ad.rpIdHash.equals(rpHash) || !ad.userPresent) {
        return res.status(400).json({ ok: false, error: 'Verificatie mislukt.' });
      }

      let geldig = false;
      try { geldig = verifieerHandtekening(fromB64u(pk.public_key), Buffer.concat([authData, cd.hash]), sig); } catch { geldig = false; }
      if (!geldig) { await db.noteAttempt(req, 'passkey'); return res.status(400).json({ ok: false, error: 'Handtekening ongeldig.' }); }

      // Teruglopende teller wijst op een gekopieerde sleutel.
      if (ad.counter && pk.sign_count && ad.counter <= pk.sign_count) {
        return res.status(400).json({ ok: false, error: 'Deze passkey lijkt gekopieerd. Log in met je wachtwoord en verwijder de passkey.' });
      }

      const u = (await db.q('SELECT * FROM users WHERE id=?', [pk.user_id]))[0];
      if (!u || !u.actief) return res.status(401).json({ ok: false, error: 'Dit account is niet meer actief.' });

      await db.exec('UPDATE passkeys SET sign_count=?, last_used=? WHERE id=?', [ad.counter || 0, NU(), pk.id]);
      await db.exec('UPDATE users SET last_login=? WHERE id=?', [NU(), u.id]);
      await db.clearAttempts(req, 'passkey');
      db.setAuthCookie(res, u);
      return res.status(200).json({ ok: true, naam: u.naam });
    }

    return res.status(400).json({ ok: false, error: 'Onbekende actie.' });
  } catch (e) {
    return res.status(500).json({ ok: false, error: String(e.message || e).slice(0, 200) });
  }
}

// Handige standaardnaam zodat je later ziet op welk apparaat een passkey staat.
function apparaatNaam(req) {
  const ua = String(req.headers['user-agent'] || '');
  if (/iPhone/i.test(ua)) return 'iPhone';
  if (/iPad/i.test(ua)) return 'iPad';
  if (/Android/i.test(ua)) return 'Android-telefoon';
  if (/Macintosh|Mac OS/i.test(ua)) return 'Mac';
  if (/Windows/i.test(ua)) return 'Windows-pc';
  return 'Passkey';
}
