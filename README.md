# BIOTEST — sajt za Zavod za laboratorijsku dijagnostiku

Prezentacioni, informativni sajt za BIOTEST laboratoriju (6 lokacija — Novi Sad i Novi Bečej). Bez online zakazivanja termina i bez portala za preuzimanje rezultata — samo katalog analiza, kalkulator cene/vremena, lokacije, usluge na terenu, popusti i osnovne informacije.

Statičan sajt (obične HTML/CSS/JS stranice, bez build koraka, bez servera) — jednostavan za održavanje za jednog developera.

> Napomena: prethodna aplikacija koja je bila u ovom repozitorijumu (OdmorPro — evidencija odsustva) premeštena je u `/legacy-odmorpro/` da bi napravila mesto za ovaj sajt. Njen README je i dalje unutar tog foldera.

## Struktura sajta

- `index.html` — Početna (hero, promocija, zašto Biotest, teaser bloga)
- `katalog.html` — Katalog analiza: pretraga + filter po kategoriji + ugrađeni kalkulator cene i vremena
- `lokacije.html` — Mapa svih 6 lokacija (Leaflet + OpenStreetMap) + kartice po lokaciji
- `teren.html` — Usluge na terenu (kućne posete za vađenje krvi/brisa) — kako funkcioniše, za koga, kontakt za dogovor termina
- `popusti.html` — Preuzimanje popust koda (ime + kontakt → jedinstveni kod na ekranu)
- `blog.html` — Lista blog objava (kartice sa slikom-bannerom, kategorijom i kratkim opisom)
- `clanak.html` — Pojedinačni blog članak, učitava se preko `?slug=` iz URL-a
- `o-nama.html` — O laboratoriji + kontakt forma (mailto)
- `assets/css/style.css` — jedan CSS fajl, ceo dizajn sistem (boje, tipografija, komponente)
- `assets/js/` — `main.js` (navigacija, service worker), `icons.js` (set ikonica), `catalog.js` (učitavanje JSON-a), `discount.js` (popust kodovi), i po jedan fajl za logiku svake stranice
- `data/biotest-analize.json` — katalog analiza (26 kategorija, ~940 analiza), učitava se kao statički JSON
- `data/test-descriptions.json` — kratki i dugi opisi za deo analiza (koristi ih katalog)
- `data/blog-posts.json` — blog objave, učitava se kao statički JSON
- `data/locations.json` — sve lokacije laboratorije (adresa, telefoni, radno vreme)

## Ažuriranje cenovnika

Sve analize, cene i vremena obrade nalaze se u `data/biotest-analize.json`, grupisano po kategoriji:

```json
{ "name": "S-TSH", "instrument": "Cobas e411_2", "time": "4h", "price": 650 }
```

Da izmeniš cenu, vreme ili dodaš/obrišeš analizu — samo izmeni ovaj fajl (validan JSON) i osveži stranicu, ništa drugo ne treba menjati. Nekoliko naziva ima mali ostatak teksta na kraju (artefakt automatske obrade PDF cenovnika, npr. zarez ili broj) — po potrebi ih ručno ispravi direktno u ovom fajlu.

Posetiocu se naziv analize prikazuje **bez prefiksa** (npr. `S-TSH` → "TSH") — `stripNamePrefix()` u `assets/js/catalog.js` to radi samo za prikaz; sirovi `name` (sa prefiksom) i dalje se koristi za `parseSampleType()`, pretragu i za ključ u `test-descriptions.json`. Polje `instrument` ostaje u podacima ali se više ne prikazuje na katalogu — klijent je tražio da se ukloni iz interfejsa.

Katalog na `katalog.html` prikazuje kategorije kao "harmoniku" (accordion) — sve su podrazumevano zatvorene, klik na naziv kategorije je otvara/zatvara. Čim je aktivna pretraga ili je izabrana konkretna kategorija u padajućem meniju, pogođene kategorije se automatski otvaraju (logika u `renderList()`, `assets/js/katalog-page.js`).

## Opisi analiza (Katalog)

`data/test-descriptions.json` sadrži kratke opise (šta analiza meri + duže objašnjenje) za trenutno ~50 najtraženijih analiza, ključ je tačan `name` iz `biotest-analize.json`. Analiza koja ima opis dobija u katalogu kratku rečenicu ispod naziva i dugme **"Pročitaj više"** koje otvara bočni panel (kao na primeru koji je klijent poslao) sa dužim objašnjenjem i dugmetom "Dodaj u kalkulator". Analize bez opisa u ovom fajlu i dalje rade normalno, samo bez tog dodatka — dodavanje opisa je postepeno, nije potrebno pokriti svih ~940 odjednom.

Da dodaš opis za još neku analizu:

```json
"Tačan naziv analize iz biotest-analize.json": {
  "short": "Jedna kratka rečenica ispod naziva u listi.",
  "long": "Duže objašnjenje (2-4 rečenice) koje se prikazuje u bočnom panelu."
}
```

## Kalkulator i vreme obrade

Kalkulator (na `katalog.html`) sabira cene izabranih analiza i prikazuje **najduže** vreme obrade među njima. Pošto se vreme u cenovniku beleži veoma različito ("4h", "2-3 dana", "do 15 dana", "45 min."...), `assets/js/catalog.js` sadrži `parseTimeToHours()` koja sve to pretvara u približan broj sati radi poređenja — u kalkulatoru se onda prikazuje originalan tekst analize sa najdužim vremenom (ne prepravljen broj), da ostane čitljivo i tačno.

## Cena uzorkovanja (vađenje krvi / uzimanje brisa)

Kalkulator sada, pored cena analiza, dodaje i **jednokratnu** cenu uzorkovanja — "Vađenje krvi" ako je bar jedna izabrana analiza iz krvi, i/ili "Uzimanje brisa" ako je bar jedna izabrana analiza sa brisa. Ako je izabrano više analiza istog tipa uzorka, fiksna cena se naplaćuje samo jednom (jedno vađenje krvi pokriva sve analize iz krvi u toj poseti).

Cene su definisane u `assets/js/katalog-page.js`, na vrhu fajla (trenutno 100 RSD vađenje krvi, 200 RSD uzimanje brisa):

```js
const SAMPLING_FEES = {
  krv: { label: 'Vađenje krvi', price: 100 },
  bris: { label: 'Uzimanje brisa', price: 200 },
};
```

Koji tip uzorka odgovara kojoj analizi određuje se automatski na osnovu prefiksa u nazivu (deo pre prve crte), u `assets/js/catalog.js` (`parseSampleType()`):
- **Krv** (vađenje krvi): nazivi koji počinju sa `S-`, `eK-`, `cP-`, `eP-`, `cK-`, `hK-`, `hP-`, `K-`
- **Bris** (uzimanje brisa): nazivi koji počinju sa `B-`, `B/U-`, `OT-`
- **Bez dodatne naplate** (pacijent sam donosi uzorak): urin (`U-`, `dU-`), stolica (`F-`), sperma/sputum (`SPR-`, `SPT-`, `Sp-`) i par ređih kategorija

Ovo je heuristika bazirana na postojećim prefiksima u cenovniku i pokriva veliku većinu analiza — ako primetiš da je neka konkretna analiza pogrešno svrstana, javi, lako se doda ručni izuzetak.

## Blog — kako dodati novu objavu

Sve objave su u `data/blog-posts.json`, kao niz objekata poređanih od najnovije ka najstarijoj. Da dodaš novu objavu, dodaj novi objekat na **vrh** niza (bez pravljenja novog HTML fajla):

```json
{
  "slug": "kratak-jedinstven-url-deo",
  "title": "Naslov objave",
  "category": "Kategorija za značku",
  "banner": "teal",
  "icon": "droplet",
  "date": "2026-08-01",
  "excerpt": "Kratak opis za karticu na listi (1-2 rečenice).",
  "catalogQuery": "reč za pretragu u katalogu (dugme 'Pronađi u katalogu')",
  "sourceLabel": "Naziv izvora (opciono, prikazuje se kao napomena na dnu članka)",
  "sourceUrl": "https://... (opciono)",
  "body": ["Prvi pasus.", "Drugi pasus.", "..."]
}
```

`banner` bira boju bannera — dostupne vrednosti: `gold`, `teal`, `rose`, `deep`, `slate`, `coral` (definisane u `assets/css/style.css` pod `.tip-banner--*`). `icon` je naziv ikonice iz `assets/js/icons.js` (vidi sekciju "Ikonice" ispod) — ako dodaš temu za koju postojeće ikonice ne odgovaraju, prvo dodaj novu u `icons.js`. `slug` mora biti jedinstven — koristi se u URL-u `clanak.html?slug=...`.

**Važna napomena o autorskim pravima:** tekst objava treba da bude originalan (napisan svojim rečima), čak i kada se koristi kao inspiracija strani članak — direktno kopiranje/prevod tuđeg teksta krši autorska prava. `sourceLabel`/`sourceUrl` služe da se navede opšti izvor informacija (kao referenca), ne da se citira ili prepiše ceo tekst.

## Popust kodovi — kako rade (bez baze)

Kod koji posetilac dobija na `popusti.html` je **sam sebi dovoljan za proveru** — sadrži 6 nasumičnih cifara i 2-cifreni kontrolni broj izračunat iz njih (`assets/js/discount.js`). Kalkulator proverava kod istim izračunom, pa nije potrebna nikakva baza ili server da bi se utvrdilo da li je kod validno izdat sa ovog sajta. Trenutno svaki validan kod nosi fiksni popust od 10% (`DISCOUNT_PERCENT` u `discount.js`).

Ime i kontakt koje posetilac unese čuvaju se lokalno u browseru (`localStorage`, ključ `biotest_discount_leads`) — to je samo lokalna beleška tog uređaja, laboratorija ih trenutno ne prima centralno.

Napomena: ovaj sistem (fiksnih 10%, samoprovera bez baze) je i dalje aktivan **samo u kalkulatoru na `katalog.html`**. Za pojedinačne promocije po analizi (kartice, korpa, jednokratan kod koji se može otkazati) koristi se odvojen, noviji sistem — vidi sekciju ispod.

## Promocije — katalog kao Temu (`popusti.html`) + admin panel

`popusti.html` je prodavnica promocija u stilu Temu-a: kartice sa slikom/ikonicom, starom precrtanom cenom i novom cenom, dugme "Dodaj u korpu", korpa sa desne strane sa količinama i ukupnim iznosom. Posetilac unese ime (i opciono telefon) i dobija **jednokratan kod sa datumom** (npr. `BIO-050826-7F2A9K`) koji se prikazuje preko celog ekrana — napravi se screenshot i pokaže na šalteru. Nema slanja emaila — sve je dizajnirano da radi kroz sam ekran.

Da bi kod zaista mogao da se iskoristi **samo jednom** (a ne da se isti screenshot pokaže dvaput), status "iskorišćen" se čuva centralno u bazi (ne samo lokalno na telefonu posetioca) — za to je potreban **Firebase** (besplatan Spark plan pokriva ovu potrebu bez ostatka). Isto važi i za same promocije (cene, nazivi) — da bi mogle da se menjaju bez ponovnog postavljanja sajta, moraju biti u bazi, ne u JSON fajlu koji se deploy-uje sa kodom.

### Šta je već napravljeno

- **`popusti.html` + `assets/js/popusti-page.js`** — javna prodavnica (kartice, korpa, kod na ekranu). Kod se generiše u `assets/js/promo-store.js` (`generateOrderCode()`), format `BIO-DDMMGG-XXXXXX` — datum je čitljiv golim okom, a osoblje dodatno vidi tačan datum/vreme izdavanja kad kod pretraži u adminu.
- **`admin.html` + `assets/js/admin.js`** — zaštićen prijavom (Firebase Auth, email/lozinka):
  - tab **Promocije** — dodavanje/izmena/brisanje/deaktivacija promocija (naziv, stara/nova cena, ikonica ili URL slike, boja pozadine);
  - tab **Provera koda** — unese se kod (ili klikne iz liste poslednjih porudžbina), vidi se šta je poručeno i po kojoj ceni, dugme **"Označi kao iskorišćen"** — nakon toga kod trajno prestaje da važi, čak i ako ga posetilac ponovo pokaže.
- `admin.html` **nije povezan iz javne navigacije** i ima `<meta name="robots" content="noindex, nofollow">` — pristupa mu se direktno preko URL-a (`tvoj-sajt.rs/admin.html`).

### Firebase podešavanje (obavezno da bi ovo proradilo)

1. Idi na [console.firebase.google.com](https://console.firebase.google.com) → **Add project** → prati korake (besplatno, bez kartice na Spark planu).
2. U projektu: **Build → Firestore Database → Create database** → izaberi region (npr. `eur3`) → **Start in production mode**.
3. **Build → Authentication → Get started → Sign-in method → Email/Password → Enable.**
4. **Authentication → Users → Add user** — unesi email/lozinku koju će osoblje koristiti za prijavu na `admin.html`.
5. **Project settings (zupčanik) → General → Your apps → Add app → Web (`</>`)** — registruj app (nije potreban Hosting, samo se uzima config). Kopiraj `firebaseConfig` objekat.
6. Zalepi te vrednosti u `assets/js/firebase-config.js` (zameni `'TODO'` placeholdere). Ovi podaci nisu tajni — bezbednost obezbeđuju pravila ispod, ne tajnost config-a.
7. **Firestore Database → Rules** — zameni sadržaj sa:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /promotions/{promoId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    match /orders/{orderId} {
      allow create: if true;
      allow read, update: if request.auth != null;
      allow delete: if false;
    }
  }
}
```

Ovo znači: svako može da vidi promocije i da napravi porudžbinu (kreira svoj kod), ali samo prijavljeno osoblje (iz koraka 4) može da menja promocije, čita/pretražuje porudžbine i označava kod kao iskorišćen. Niko (ni prijavljen) ne može da briše porudžbine iz browsera — to čuva istoriju.

Dok `firebase-config.js` ima `'TODO'` vrednosti, `popusti.html` i `admin.html` prikazuju jasnu poruku da Firebase nije podešen, umesto da nešto tiho ne radi.

## Mapa (Lokacije)

`lokacije.html` prikazuje **svih 6 BIOTEST lokacija** (5 u Novom Sadu + 1 u Novom Bečeju) u "store locator" rasporedu — tamna lista lokacija sa leve strane (skroluje nezavisno) i Leaflet mapa sa desne strane, oboje u jednom zaobljenom okviru. Podloga je CartoDB Voyager (besplatno, bez API ključa — samo atribucija u dnu mape) — u boji, ali i dalje čitljiva, umesto standardne šarene OSM podloge ili prigušene sivkaste Positron varijante koju smo prvo probali. Mapa se podrazumevano fokusira na Novi Sad (5/6 lokacija); Novi Bečej ima svoj marker, dostupan klikom na karticu u listi.

Leaflet po difoltu stavlja flat sivu (`#ddd`) pozadinu direktno na kontejner mape — vidi se dok se tajlovi učitavaju ili ako neki tajl ne uspe (npr. spor internet, ad-blocker). To smo prekrili brendiranim teal→koral gradijentom (`.leaflet-container` u `style.css`), tako da mapa nikad ne "trepne" sivo, ni ovde ni na mini-mapi na početnoj.

Dodatne "moderne" funkcije na ovoj stranici:
- **Pretraga i filter po gradu** — polje za pretragu (naziv/adresa) i padajući meni za grad iznad liste, filtriraju samo listu (svi markeri ostaju na mapi).
- **Brendirani markeri** — teal pin sa 🧪, koralni i veći pin za "najbližu" lokaciju.
- **Bedž Otvoreno/Zatvoreno** po lokaciji, izračunat u browseru iz teksta radnog vremena i trenutnog vremena posetioca (`parseHours()`/`isOpenNow()` u `assets/js/lokacije-page.js`) — očekuje da `hours` u JSON-u prati format iz primera ispod (tri linije: radni dani / subota / nedelja); ako format odstupi, bedž jednostavno neće raditi za tu lokaciju, ostatak stranice i dalje radi normalno.
- **"Pronađi lokaciju najbližu meni"** dugme — traži dozvolu za lokaciju iz browsera (ne automatski pri učitavanju stranice, samo na klik) i istakne najbližu lokaciju na mapi i u listi.
- **Poziv direktno iz mapnog oblačića** (popup na markeru), ne samo iz liste.

Sve lokacije su u `data/locations.json` — da dodaš, izmeniš ili obrišeš lokaciju, samo izmeni taj fajl:

```json
{
  "id": "jedinstven-slug",
  "name": "BIOTEST — Naziv/adresa",
  "address": "Ulica broj, poštanski broj Grad",
  "city": "Novi Sad",
  "phones": ["021/xxx-xxx"],
  "hours": "Ponedeljak – petak: 07:00 – 20:00\nSubota: 07:00 – 14:00\nNedelja: ne radimo"
}
```

Pošto tačne GPS koordinate nisu bile dostupne prilikom izrade, `assets/js/lokacije-page.js` pri prvoj poseti pokuša da sam geokodira svaku adresu preko besplatnog Nominatim servisa (iz browsera posetioca) i rezultat trajno zapamti po lokaciji (`localStorage`, ključ `biotest_geocode_<id>`). Dok se to ne desi (ili ako geokodiranje ne uspe), marker te lokacije stoji na proceni centra grada (`CITY_FALLBACK_COORDS` na vrhu fajla).

**Podaci o adresama, telefonima i radnom vremenu su prikupljeni sa javno dostupnih izvora (zvanični sajt biotest.rs i poslovni imenici) i nisu direktno potvrđeni od strane laboratorije — obavezno proveri tačnost pre nego što sajt ode u produkciju**, posebno radno vreme (razlikuje se po lokaciji, a neki izvori nisu bili potpuno usaglašeni).

### Mini-mapa na početnoj ("6 lokacija")

`index.html` ima svoju malu, ne-interaktivnu Leaflet mapu (`assets/js/index-map.js`, `#mini-map`) koja prikazuje samo 5 lokacija u Novom Sadu, sa isprekidanim linijama od centralne lokacije (Koste Abraševića 31, `HUB_ID` u fajlu) do ostale četiri — vizuelno "mreža" laboratorija, kao teaser koji vodi na `lokacije.html`. Deli isti keš geokodiranja (`localStorage`, `biotest_geocode_<id>`) i istu logiku sa `lokacije-page.js`, tako da se pozicije poklapaju sa punom mapom čim se bar jednom uspešno geokodiraju. Dok se to ne desi, svi markeri privremeno stoje na istoj proceni centra grada (linije se i dalje iscrtavaju, samo skupljene u jednu tačku) — to nije greška, samo čeka geokodiranje.

## PWA

Sajt ima `manifest.json` i osnovni `sw.js` (network-first keš), tako da se može instalirati na telefon ("Add to Home Screen"). Ikonice aplikacije (za instalaciju/favicon) su u `assets/icons/`.

## Ikonice u sadržaju sajta

Umesto emoji znakova, sajt koristi [Tabler Icons](https://tabler.io/icons) (MIT licenca) — samostalno hostovane kao inline SVG, bez spoljnog fonta ili mreže. Set ikonica koje se trenutno koriste (imena i putanje) definisan je u `assets/js/icons.js`, kao običan JS objekat; `window.Biotest.icon('flask')` vraća gotov `<svg>` string.

- **Na statičnim HTML stranicama** ikonica je zalepljena direktno kao `<svg class="icon" ...>` (isti format koji `icon()` generiše) — to je čist HTML/CSS, nema JS zavisnost za prikaz.
- **U JS-generisanom sadržaju** (kartice, kalkulator, mapa, popup...) koristi se `window.Biotest.icon('ime-ikonice')`, pa `assets/js/icons.js` mora biti učitan pre svih ostalih skripti (već je tako podešeno na svim stranicama, odmah pre `main.js`).
- Ikonica nasleđuje boju teksta iz okolnog elementa (`stroke="currentColor"`), i podrazumevano je veličine `1em` (prati `font-size` roditelja) — u `style.css` postoje precizniji overrides za specifična mesta (`.icon-badge .icon`, `.brand-mark .icon`, `.tip-banner .icon`, itd.).

Da dodaš novu ikonicu koja trenutno nije u setu: preuzmi `outline` varijantu SVG-a sa [tabler.io/icons](https://tabler.io/icons) (ili iz `@tabler/icons` npm paketa), izvuci sadržaj `<path>` elemenata (bez nevidljivog "frame" path-a koji Tabler dodaje) i dodaj novi red u `ICON_PATHS` objektu u `icons.js`.

## Pokretanje lokalno

Nema build koraka. Za razvoj, pokreni bilo koji statički server iz root foldera (npr. `python3 -m http.server`) i otvori `http://localhost:8000` — direktno otvaranje `index.html` dvoklikom (`file://`) takođe radi za većinu stranica, osim što `fetch()` poziva (učitavanje JSON kataloga) u nekim browserima zahteva pravi server zbog CORS pravila za lokalne fajlove.

## Postavljanje na GitHub Pages

Isto kao i ranije za OdmorPro: **Settings → Pages → Deploy from a branch → `main` / `(root)`**. Pošto je `index.html` sada BIOTEST sajt, on postaje početna stranica na domenu; stara OdmorPro aplikacija ostaje dostupna na `/legacy-odmorpro/index.html` ako je i dalje negde u upotrebi.
