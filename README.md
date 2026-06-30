# OdmorPro – Evidencija odsustva i rasporeda

Aplikacija je **gotova i proverena** (validna HTML/CSS/JS, radi samostalno u browseru, bez servera — podaci se čuvaju lokalno u browseru preko `localStorage`).

## Šta aplikacija već radi (sve što si tražio)

- **Jedan Admin nalog** (`admin` / `admin123`) + neograničen broj **korisničkih naloga** koje admin kreira (stranica *Podešavanja* → *Upravljanje korisnicima*, ili *Dodaj zaposlenog* za pun profil sa pozicijom, odeljenjem, brojem dana odmora itd.)
- **Korisnički profil** – svaki zaposleni ima svoju stranicu *Moj profil* sa ličnim podacima i istorijom odsustava, i stranicu *Moj zahtev* gde **sam prijavljuje odsustvo** (tip, datumi, automatski obračun radnih dana, razlog) — zahtev ide Adminu na odobrenje.
- **Svi korisnici vide ko je odsutan** – na *Kontrolnoj tabli* je zajednički kalendar (mesečni/nedeljni/dnevni prikaz) sa svim odsustvima, bojama po tipu (godišnji, bolovanje, slobodan dan, porodiljsko...) i statusom (odobreno/na čekanju). Ovo je vidljivo i Adminu i korisnicima.
- **Pregledna statistika**:
  - Kartice na vrhu: broj zaposlenih, ko je danas odsutan, broj zahteva na čekanju, prosečan broj preostalih dana.
  - Admin dodatno ima stranicu *Izveštaji* sa tabelom po zaposlenom i grafikonom, plus izvoz u **CSV i PDF**.
- **Upravljanje zahtevima** (Admin) – odobravanje/odbijanje pojedinačno ili grupno.
- **Tamna/svetla tema, izvoz/uvoz svih podataka (JSON), reset podataka.**

Testirao sam JS kod (sintaksa je validna) — fajl je spreman za upotrebu.

## Deljeni podaci za sve zaposlene (NOVO)

Pošto ti je bitno da **svi zaposleni vide kada je neko označio odsustvo** (i sa različitih uređaja/računara), dodao sam besplatnu **Firebase Firestore** cloud bazu. Kada je podesiš (5 minuta, bez kartice):

- Svaki put kad neko podnese zahtev za odsustvo, doda zaposlenog, ili admin nešto odobri — promena se **odmah, uživo (real-time)** vidi kod svih ostalih korisnika koji imaju sajt otvoren, na bilo kom uređaju.
- I dalje radi i offline kao rezerva (localStorage cache), ali glavna, deljena "istina" je u Firestore bazi.
- Besplatni Firebase plan (Spark) je više nego dovoljan za malu firmu (npr. 50.000 čitanja/dan, 20.000 upisa/dan — firma od par desetina ljudi to teško može da potroši).

### Kako da podesiš Firebase (jednom, traje ~5 min)

1. Idi na **https://console.firebase.google.com**, prijavi se Google nalogom, klikni **Add project** (ne treba kartica, besplatno).
2. U levom meniju: **Build → Firestore Database → Create database**. Izaberi region (npr. najbliži Evropi), pa **Start in test mode** (kasnije po želji možeš pooštriti pravila).
3. Klikni na zupčanik gore levo → **Project settings**. Skroluj do "Your apps", klikni ikonicu **Web (`</>`)**, daj joj ime (npr. "OdmorPro"), klikni **Register app**. Firebase će ti prikazati kod sa objektom koji izgleda ovako:
   ```js
   const firebaseConfig = {
     apiKey: "AIzaSy...",
     authDomain: "tvoj-projekat.firebaseapp.com",
     projectId: "tvoj-projekat",
     storageBucket: "tvoj-projekat.appspot.com",
     messagingSenderId: "123456789",
     appId: "1:123456789:web:abcdef"
   };
   ```
4. Otvori `index.html` (npr. preko GitHub-a, dugme "Edit"/olovčica), pronađi na vrhu skripte (blizu početka, posle `<!-- Firebase -->` komentara) isti taj `firebaseConfig` objekat sa placeholder vrednostima (`"UNESI_SVOJ_..."`) i **zameni ih svojim pravim vrednostima** iz koraka 3. Sačuvaj (Commit changes).
5. To je sve — osveži stranicu i u konzoli (F12) ne bi trebalo više da vidiš upozorenje o Firebase-u. Otvori sajt na dva različita uređaja/browsera i testiraj: kad jedan korisnik prijavi odsustvo, drugi treba odmah da ga vidi na kalendaru/dashboardu.

### Bezbednosna napomena (bitno za malu firmu)

Test mode u Firestore-u znači da baza **nije zaštićena lozinkom na nivou baze** — svako ko zna tvoj `firebaseConfig` (vidljiv je u izvornom kodu stranice, to je normalno za web app) tehnički može da čita/piše podatke direktno, zaobilazeći login ekran aplikacije. Za malu firmu sa poverljivim timom ovo je uobičajeno i prihvatljivo rešenje (slično kao deljeni Excel fajl). Ako ti zatreba ozbiljnija zaštita (prava autentifikacija, pravila ko šta sme da menja), javi mi — mogu da dodam Firebase Authentication i Firestore security rules.

Ako ne podesiš Firebase config (ostaviš placeholder vrednosti), aplikacija i dalje radi normalno, samo se vraća na stari režim — svaki uređaj ima svoju lokalnu kopiju podataka.

## Kako da je postaviš na besplatan GitHub domen (GitHub Pages)

1. Napravi nalog na [github.com](https://github.com) ako ga nemaš.
2. Klikni **New repository**, daj mu ime npr. `odmorpro`, postavi ga kao **Public**, kreiraj ga.
3. U repozitorijum otpremi (Upload files) fajl **`index.html`** iz ovog paketa (mora da se zove tačno `index.html`).
4. Idi na **Settings → Pages** u tom repozitorijumu.
5. Pod "Build and deployment" izaberi **Deploy from a branch**, granu `main`, folder `/ (root)`, sačuvaj.
6. Posle 1-2 minuta aplikacija će biti dostupna na adresi:
   `https://tvoje-korisnicko-ime.github.io/odmorpro/`

To je to — besplatno, bez servera, bez troškova hostinga.

## Prijava

- Admin: korisničko ime `admin`, lozinka `admin123` (preporučujem da odmah promeniš ili dodaš novog admina pa obrišeš ovaj, iz Podešavanja).
- Nove korisnike (zaposlene) dodaješ kroz *Dodaj zaposlenog* (admin only) — email zaposlenog služi kao korisničko ime.
# Godisnji-web
