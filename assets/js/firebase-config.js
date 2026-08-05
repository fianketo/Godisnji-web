// BIOTEST — Firebase konfiguracija.
//
// Popuni vrednosti ispod svojim podacima iz Firebase konzole:
// Project settings → General → Your apps → Web app → SDK setup and configuration → Config.
// Ovi podaci NISU tajni — klijentski Firebase config je javan po dizajnu (poziva se iz
// browsera svakog posetioca). Prava bezbednost se obezbeđuje preko Firestore Security
// Rules (vidi README, sekcija "Promocije — Firebase podešavanje").
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';

const firebaseConfig = {
  apiKey: 'TODO',
  authDomain: 'TODO.firebaseapp.com',
  projectId: 'TODO',
  storageBucket: 'TODO.appspot.com',
  messagingSenderId: 'TODO',
  appId: 'TODO',
};

export const firebaseApp = initializeApp(firebaseConfig);
export const firebaseReady = firebaseConfig.apiKey !== 'TODO';
