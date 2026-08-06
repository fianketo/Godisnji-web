// BIOTEST — konfiguracija za Firebase (baza promocija/porudžbina + admin login)
// i EmailJS (slanje email-a sa kodom). Vidi README.md, sekcija
// "Promocije, korpa i kod na email" za korak-po-korak uputstvo odakle se
// ove vrednosti uzimaju.
//
// Dok su ove vrednosti prazne, admin/promo/verifikacija stranice prikazuju
// jasnu poruku "nije podešeno" umesto da se sajt sruši ili tiho ne radi.

window.BiotestConfig = {
  firebase: {
    apiKey: '',
    authDomain: '',
    projectId: '',
    storageBucket: '',
    messagingSenderId: '',
    appId: '',
  },
  emailjs: {
    publicKey: '',
    serviceId: '',
    templateId: '',
  },
};
