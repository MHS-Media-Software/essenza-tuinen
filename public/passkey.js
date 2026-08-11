// Passkey-client, gedeeld door het inlogscherm, de aanmeldpagina en het dashboard.
// Vertaalt tussen de base64url-tekst van de server en de ArrayBuffers die de
// browser-API verwacht.
window.Passkey = (function () {
  function naarBuffer(v) {
    v = String(v).replace(/-/g, '+').replace(/\//g, '/').replace(/_/g, '/');
    var rest = v.length % 4; if (rest) v += '===='.slice(rest);
    var ruw = atob(v), arr = new Uint8Array(ruw.length);
    for (var i = 0; i < ruw.length; i++) arr[i] = ruw.charCodeAt(i);
    return arr.buffer;
  }
  function naarTekst(buf) {
    var arr = new Uint8Array(buf), s = '';
    for (var i = 0; i < arr.length; i++) s += String.fromCharCode(arr[i]);
    return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
  async function post(body) {
    var r = await fetch('/api/passkey', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    });
    try { return await r.json(); } catch (e) { return { ok: false, error: 'Serverfout (' + r.status + ')' }; }
  }

  // Kan dit apparaat überhaupt met passkeys overweg?
  function beschikbaar() {
    return !!(window.PublicKeyCredential && navigator.credentials && navigator.credentials.create);
  }
  // Heeft dit apparaat een ingebouwde authenticator (Face ID, Touch ID, Windows Hello)?
  async function opDitApparaat() {
    if (!beschikbaar() || !window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable) return false;
    try { return await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable(); }
    catch (e) { return false; }
  }

  // Een passkey aanmaken voor de ingelogde gebruiker.
  async function registreer(naam) {
    var start = await post({ action: 'registreer-start' });
    if (!start.ok) return start;
    var pk = start.publicKey;
    pk.challenge = naarBuffer(pk.challenge);
    pk.user.id = naarBuffer(pk.user.id);
    pk.excludeCredentials = (pk.excludeCredentials || []).map(function (c) { return { type: c.type, id: naarBuffer(c.id) }; });
    var cred;
    try { cred = await navigator.credentials.create({ publicKey: pk }); }
    catch (e) { return { ok: false, geannuleerd: true, error: melding(e) }; }
    if (!cred) return { ok: false, geannuleerd: true, error: 'Er is geen passkey aangemaakt.' };
    return post({
      action: 'registreer-klaar', naam: naam || '',
      clientDataJSON: naarTekst(cred.response.clientDataJSON),
      attestationObject: naarTekst(cred.response.attestationObject),
    });
  }

  // Inloggen zonder wachtwoord.
  async function login() {
    var start = await post({ action: 'login-start' });
    if (!start.ok) return start;
    var pk = start.publicKey;
    pk.challenge = naarBuffer(pk.challenge);
    var cred;
    try { cred = await navigator.credentials.get({ publicKey: pk }); }
    catch (e) { return { ok: false, geannuleerd: true, error: melding(e) }; }
    if (!cred) return { ok: false, geannuleerd: true, error: 'Er is geen passkey gekozen.' };
    return post({
      action: 'login-klaar',
      credentialId: naarTekst(cred.rawId),
      clientDataJSON: naarTekst(cred.response.clientDataJSON),
      authenticatorData: naarTekst(cred.response.authenticatorData),
      signature: naarTekst(cred.response.signature),
    });
  }

  function melding(e) {
    var n = e && e.name;
    if (n === 'NotAllowedError') return 'Afgebroken of te lang gewacht.';
    if (n === 'InvalidStateError') return 'Op dit apparaat staat al een passkey voor dit account.';
    if (n === 'SecurityError') return 'Passkeys werken alleen op een beveiligde verbinding (https).';
    return 'Er ging iets mis met de passkey.';
  }

  return { beschikbaar: beschikbaar, opDitApparaat: opDitApparaat, registreer: registreer, login: login };
})();
