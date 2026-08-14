// BIOTEST — konfiguracija za Firebase (baza promocija/porudžbina + admin login)
// i EmailJS (slanje email-a sa kodom). Vidi README.md, sekcija
// "Promocije, korpa i kod na email" za korak-po-korak uputstvo odakle se
// ove vrednosti uzimaju.
//
// Dok su ove vrednosti prazne, admin/promo/verifikacija stranice prikazuju
// jasnu poruku "nije podešeno" umesto da se sajt sruši ili tiho ne radi.

window.BiotestConfig = {
  firebase: {
    apiKey: 'AIzaSyBbthuZy2m5VWliIK6_bDkZJriE9NgMqe8',
    authDomain: 'biotest-akcije.firebaseapp.com',
    projectId: 'biotest-akcije',
    storageBucket: 'biotest-akcije.firebasestorage.app',
    messagingSenderId: '705718953940',
    appId: '1:705718953940:web:13183fbf01287df7c05841',
  },
  emailjs: {
    publicKey: '',
    serviceId: '',
    templateId: '',
  },
};
