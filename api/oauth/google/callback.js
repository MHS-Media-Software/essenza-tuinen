// Callback van de Google-login. De centrale proxy stuurt code + state
// ongewijzigd naar dit pad door; wij wisselen de code hier zelf in.
// Een geverifieerd @mhsmedia.nl-account krijgt beheerderstoegang tot deze site.
import crypto from 'node:crypto';
import * as db from '../../_db.js';
import { fetchGoogleIdentity, googleRedirectUri, isTeamAccount, readProxyState, ssoBeschikbaar } from '../../_sso.js';

const terug = (res, q) => { res.writeHead(302, { Location: '/inloggen?sso=' + q }); res.end(); };

export default async function handler(req, res) {
  try {
    if (!ssoBeschikbaar()) return terug(res, 'notconfigured');
    await db.ensureSchema();

    const url = new URL(req.url, 'https://' + (req.headers.host || 'localhost'));
    const code = url.searchParams.get('code') || '';
    const state = url.searchParams.get('state') || '';

    const wil = db.leesChallenge(req, 'sso');
    db.clearChallengeCookie(res);
    if (!code) return terug(res, 'err');

    // De state moet ondertekend zijn én bij deze browser horen (nonce uit cookie).
    const parsed = readProxyState(state);
    const nonce = String((parsed && parsed.n) || '');
    if (!parsed || !nonce || !wil || nonce.length !== String(wil).length
        || !crypto.timingSafeEqual(Buffer.from(nonce), Buffer.from(String(wil)))) {
      return terug(res, 'err');
    }

    let info;
    try { info = await fetchGoogleIdentity(code, googleRedirectUri(req)); }
    catch (e) { console.error('team-SSO mislukt:', e.message); return terug(res, 'err'); }

    const email = isTeamAccount(info);
    if (!email) return terug(res, 'denied');

    const now = new Date().toISOString();
    let u = (await db.q('SELECT * FROM users WHERE email=?', [email]))[0];
    if (!u) {
      // Nieuw teamlid: krijgt beheerderstoegang, herkenbaar als MHS-account.
      const naam = String((info && info.name) || email.split('@')[0]).slice(0, 80);
      await db.exec(`INSERT INTO users(email,pass_hash,naam,rol,rechten,actief,status,via,pass_version,created,last_login)
        VALUES(?,NULL,?,?,?,1,'actief','sso',1,?,?)`,
        [email, naam, 'beheerder', JSON.stringify(db.PERM_KEYS), now, now]);
      u = (await db.q('SELECT * FROM users WHERE email=?', [email]))[0];
    } else {
      if (!u.actief || (u.status || 'actief') !== 'actief') {
        // Een MHS-account dat op non-actief stond weer aanzetten mag: het is ons
        // eigen supportaccount, geen medewerker van de klant.
        if (u.via === 'sso') await db.exec("UPDATE users SET actief=1, status='actief' WHERE id=?", [u.id]);
        else return terug(res, 'denied');
      }
      await db.exec('UPDATE users SET last_login=? WHERE id=?', [now, u.id]);
      u = (await db.q('SELECT * FROM users WHERE id=?', [u.id]))[0];
    }

    db.setAuthCookie(res, u);
    res.writeHead(302, { Location: '/admin' });
    return res.end();
  } catch (e) {
    console.error('team-SSO fout:', e && e.message);
    return terug(res, 'err');
  }
}
