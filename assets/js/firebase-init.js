// BIOTEST — inicijalizacija Firebase-a (kompat SDK, bez build alata).
// Učitava se samo na stranicama kojima treba (promocije, admin, provera koda).
// Ako firebase-config.js još uvek ima prazne vrednosti, isConfigured je false
// i pozivajuće stranice prikazuju poruku umesto da pokušaju poziv ka Firebase-u.

(function () {
  const cfg = (window.BiotestConfig && window.BiotestConfig.firebase) || {};
  const isConfigured = Boolean(cfg.apiKey && cfg.projectId && cfg.appId);

  window.Biotest = window.Biotest || {};
  window.Biotest.firebaseReady = isConfigured;

  if (!isConfigured || typeof firebase === 'undefined') {
    window.Biotest.firebaseReady = false;
    return;
  }

  firebase.initializeApp(cfg);
  window.Biotest.db = firebase.firestore();
  window.Biotest.auth = firebase.auth();
})();
