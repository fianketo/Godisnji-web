/**
 * OdmorPro — slanje mejlova preko Gmail-a (Google Apps Script).
 *
 * Aplikacija ovde šalje: { idToken, to, toName, subject, message }.
 * Skripta proverava da je pošiljalac prijavljen u OdmorPro (Firebase
 * prijava), pa šalje mejl sa Gmail naloga vlasnika skripte.
 * Besplatno: ~100 primalaca dnevno (Gmail nalog), 1.500 (Google Workspace).
 *
 * Najlakše: kopirajte gotov kod iz aplikacije (Podešavanja → 📮 Mejlovi
 * preko Gmail-a → Kopiraj kod) — tamo je FIREBASE_API_KEY već upisan.
 */
const FIREBASE_API_KEY = 'OVDE_FIREBASE_API_KEY';
const SENDER_NAME = 'OdmorPro';

function doPost(e) {
  try {
    const req = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    if (!isSignedIn_(req.idToken)) return json_({ ok: false, error: 'Niste prijavljeni u OdmorPro.' });
    const to = String(req.to || '').trim();
    if (!/^[^@\s,;]+@[^@\s,;]+\.[^@\s,;]+$/.test(to)) return json_({ ok: false, error: 'Neispravna adresa: ' + to });
    if (MailApp.getRemainingDailyQuota() < 1) return json_({ ok: false, quota: 0, error: 'Dnevni Gmail limit je potrošen.' });
    const subject = String(req.subject || 'OdmorPro').slice(0, 250);
    const message = String(req.message || '').slice(0, 20000);
    MailApp.sendEmail({ to: to, subject: subject, body: message, htmlBody: html_(req.toName, message), name: SENDER_NAME });
    return json_({ ok: true, quota: MailApp.getRemainingDailyQuota() });
  } catch (err) {
    return json_({ ok: false, error: String(err && err.message || err) });
  }
}

// Provera iz aplikacije: da li skripta radi i koliko je mejlova ostalo danas.
function doGet() {
  return json_({ ok: true, app: 'OdmorPro mail', quota: MailApp.getRemainingDailyQuota() });
}

// Pokrenite ovu funkciju jednom iz editora (▶ Run) da Google zatraži dozvolu
// za slanje mejlova i da dobijete probni mejl na svoju adresu.
function probniMejl() {
  const me = Session.getActiveUser().getEmail();
  MailApp.sendEmail({ to: me, subject: 'OdmorPro — skripta radi', body: 'Skripta za slanje mejlova je podešena.', name: SENDER_NAME });
  Logger.log('Poslato na ' + me + '. Preostalo danas: ' + MailApp.getRemainingDailyQuota());
}

function isSignedIn_(idToken) {
  if (!idToken) return false;
  const cache = CacheService.getScriptCache();
  const key = 'tok_' + Utilities.base64EncodeWebSafe(
    Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, idToken)).slice(0, 40);
  if (cache.get(key)) return true;
  const res = UrlFetchApp.fetch(
    'https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=' + encodeURIComponent(FIREBASE_API_KEY),
    { method: 'post', contentType: 'application/json', payload: JSON.stringify({ idToken: idToken }), muteHttpExceptions: true });
  if (res.getResponseCode() !== 200) return false;
  const users = (JSON.parse(res.getContentText()).users) || [];
  if (!users.length) return false;
  cache.put(key, '1', 600);
  return true;
}

function html_(toName, message) {
  const esc = s => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const body = esc(message).replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1">$1</a>').replace(/\n/g, '<br>');
  return '<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.5;color:#0f1b2d;max-width:560px">' +
    (toName ? '<p>Zdravo ' + esc(toName) + ',</p>' : '') + '<p>' + body + '</p>' +
    '<p style="color:#74819a;font-size:12px;margin-top:24px">Poslato iz aplikacije OdmorPro.</p></div>';
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
