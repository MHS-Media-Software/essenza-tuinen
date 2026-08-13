// Start "Inloggen met Google (MHS-team)": stuurt door naar Google met een
// HMAC-ondertekende state, zodat de centrale proxy de callback terugstuurt.
import crypto from 'node:crypto';
import * as db from '../../_db.js';
import { ssoBeschikbaar, googleRedirectUri, makeProxyState, siteOrigin, TEAM_SSO_DOMAIN } from '../../_sso.js';
import { googleClientId } from '../../_gateway.js';

export default async function handler(req, res) {
  if (!ssoBeschikbaar()) {
    res.writeHead(302, { Location: '/inloggen?sso=notconfigured' });
    return res.end();
  }

  // Eigen client-id uit de env, anders die van de centrale gateway. Alleen dat
  // laatste kost een netwerkaanroep, en die zit kortstondig in het geheugen.
  const clientId = await googleClientId();
  if (!clientId) {
    res.writeHead(302, { Location: '/inloggen?sso=notconfigured' });
    return res.end();
  }

  const nonce = crypto.randomBytes(18).toString('base64url');
  db.setChallengeCookie(res, 'sso', nonce);

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: googleRedirectUri(req),
    response_type: 'code',
    scope: 'openid email profile',
    prompt: 'select_account',
    hd: TEAM_SSO_DOMAIN, // hint; server-side wordt het alsnog gecontroleerd
    state: makeProxyState(siteOrigin(req), 'teamlogin', nonce),
  });
  res.writeHead(302, { Location: 'https://accounts.google.com/o/oauth2/v2/auth?' + params.toString() });
  return res.end();
}
