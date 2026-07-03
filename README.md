# OdmorPro – Evidencija odsustva i rasporeda

Aplikacija je jedan samostalan HTML fajl (`index.html`) — bez servera, bez build koraka. Radi na dva načina:

- **Bez podešavanja Firebase-a**: sve radi lokalno u browseru (`localStorage`), kao demo/test režim. Podaci nisu deljeni između uređaja i mogu se izgubiti (svaki uređaj ima svoju kopiju).
- **Sa podešenim Firebase-om (preporučeno za pravu upotrebu)**: svi zaposleni u firmi dele iste, trajne podatke u oblaku, uživo (real-time) — kad neko prijavi odsustvo ili ga admin odobri, svi ostali to odmah vide, na bilo kom uređaju. Registracija i prijava su prave (Firebase Authentication), lozinke se ne čuvaju u samoj aplikaciji.

## Šta aplikacija radi

- **Nalozi** – samostalna registracija je namenjena samo za **jednokratni admin bootstrap** (prva osoba koja se ikad registruje automatski postaje Admin) i skrivena je sa login ekrana (otvara se preko `index.html?register`, pogledaj korak 8 ispod). Ubuduće, admin dodaje sve zaposlene kroz *Dodaj radnika* (puni profil + lozinka koju admin zada).
- **Korisnički profil** – svaki zaposleni ima *Moj profil* sa ličnim podacima i istorijom odsustava, i *Moj zahtev* gde sam prijavljuje odsustvo (tip, datumi, automatski obračun radnih dana, razlog) — ide Adminu na odobrenje.
- **Zajednički kalendar** – na *Kontrolnoj tabli* svi vide ko je odsutan (mesečni/nedeljni/dnevni prikaz), boje po tipu odsustva, status (odobreno/na čekanju).
- **Statistika** – kartice (broj zaposlenih, ko je danas odsutan, zahtevi na čekanju, prosek preostalih dana) + Admin stranica *Izveštaji* sa grafikonom i izvozom u CSV/PDF.
- **Upravljanje zahtevima** (Admin) – odobravanje/odbijanje.
- **Godišnji obračun** – 1. januara svako dobija novih 20 dana godišnjeg odmora **plus** ono što mu je ostalo od prethodne godine (ne propada). Slobodni dani se **ne prenose** — svake godine se vraćaju na podrazumevanih 3 (admin može da promeni broj po zaposlenom u *Dodaj radnika*). Ovo se automatski primeni čim neko prvi put otvori aplikaciju posle Nove godine — nema potrebe za ručnim resetom.
- Tamna/svetla tema (lokalno po uređaju), izvoz/uvoz svih podataka (JSON).

## Podešavanje Firebase-a (jednom, ~5-10 min, besplatno, bez kartice)

1. Idi na **https://console.firebase.google.com**, prijavi se Google nalogom, **Add project**.
2. **Build → Authentication → Get started → Sign-in method → Email/Password → Enable.** Ovo omogućava pravu registraciju/prijavu.
3. **Build → Realtime Database → Create Database.** Izaberi region (npr. najbliži Evropi), izaberi **"Start in locked mode"**.
4. Otvori tab **Rules** te baze i zameni sadržaj sa:
   ```json
   {
     "rules": {
       ".read": "auth != null",
       ".write": "auth != null"
     }
   }
   ```
   Klikni **Publish**. Ovo znači: samo prijavljeni (registrovani) korisnici mogu da čitaju/pišu podatke — nasumični posetioci sajta ne mogu, čak i ako znaju adresu.
5. Zupčanik gore levo → **Project settings** → skroluj do "Your apps" → ikonica **Web (`</>`)** → daj ime (npr. "OdmorPro") → **Register app**. Prikazaće se `firebaseConfig` objekat.
6. Otvori `index.html`, pronađi na vrhu skripte `const FIREBASE_CONFIG = { ... }` (odmah ispod komentara „FIREBASE CONFIG"), i zameni placeholder vrednosti (`"YOUR_API_KEY"` itd.) pravim vrednostima iz koraka 5. Sačuvaj.
7. **Authentication → Settings → Authorized domains** → dodaj domen na kom će sajt živeti (npr. `tvoje-korisnicko-ime.github.io`). **Bez ovog koraka registracija/prijava neće raditi na živom sajtu** (radiće samo na `localhost` dok testiraš lokalno).
8. Otvori `index.html?register` (napomena: `?register` na kraju — registracija je namerno skrivena sa običnog login ekrana) i registruj se svojim pravim email-om. Taj nalog (prvi ikad registrovan) automatski postaje Admin. Ubuduće koristi običan `index.html` i dodaj ostale zaposlene kroz *Dodaj radnika* — link za registraciju ostaje skriven za njih.

### Bezbednosna napomena

Pravila iz koraka 4 (`auth != null`) znače da **bilo koji prijavljeni korisnik može da čita i menja sve podatke** (nema razdvajanja po ulogama na nivou baze — to app radi na UI nivou). Za malu firmu sa poverljivim timom ovo je uobičajeno i prihvatljivo (slično deljenom Excel fajlu koji svi članovi tima mogu da menjaju). Ako ti zatreba stroža podela (npr. da običan zaposleni ne može direktno da piše u bazu mimo aplikacije), to zahteva finije Firebase security rules po ulozi — javi ako ti to zatreba.

Lozinke se **ne čuvaju** u našoj bazi — njima upravlja Firebase Authentication (industrijski standard, hashovano), aplikacija samo čuva ime/email/ulogu/vezu ka profilu zaposlenog.

Ako ne podesiš Firebase (ostaviš placeholder vrednosti u `FIREBASE_CONFIG`), aplikacija i dalje radi normalno u lokalnom demo režimu (admin/admin123, podaci samo na tom uređaju).

## Postavljanje na besplatan GitHub Pages

1. Napravi nalog na [github.com](https://github.com) ako ga nemaš.
2. **New repository** → ime npr. `odmorpro` → **Public** → kreiraj.
3. Otpremi (**Add file → Upload files**) fajl i preimenuj ga tačno u **`index.html`** (GitHub Pages traži baš to ime za početnu stranicu).
4. **Settings → Pages** → "Build and deployment" → **Deploy from a branch** → grana `main`, folder `/ (root)` → Save.
5. Posle 1-2 minuta sajt je dostupan na `https://tvoje-korisnicko-ime.github.io/odmorpro/`.
6. Ne zaboravi korak 7 iz sekcije o Firebase-u iznad (dodaj taj domen u Authorized domains) — inače će registracija/prijava raditi lokalno ali ne i na živom sajtu.

## Prijava

- **Bez Firebase-a (demo režim)**: `admin` / `admin123`.
- **Sa Firebase-om**: nema unapred zadatog naloga. Prva registracija (preko `index.html?register`) postaje Admin; sve ostale naloge admin dodaje kroz *Dodaj radnika*.
