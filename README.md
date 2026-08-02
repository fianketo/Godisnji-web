# BIOTEST — sajt za Zavod za laboratorijsku dijagnostiku

Prezentacioni, informativni sajt za BIOTEST laboratoriju (Novi Sad, Koste Abraševića 31). Bez online zakazivanja termina i bez portala za preuzimanje rezultata — samo katalog analiza, kalkulator cene/vremena, lokacije, popusti i osnovne informacije.

Statičan sajt (obične HTML/CSS/JS stranice, bez build koraka, bez servera) — jednostavan za održavanje za jednog developera.

> Napomena: prethodna aplikacija koja je bila u ovom repozitorijumu (OdmorPro — evidencija odsustva) premeštena je u `/legacy-odmorpro/` da bi napravila mesto za ovaj sajt. Njen README je i dalje unutar tog foldera.

## Struktura sajta

- `index.html` — Početna (hero, promocija, zašto Biotest, teaser bloga)
- `katalog.html` — Katalog analiza: pretraga + filter po kategoriji + ugrađeni kalkulator cene i vremena
- `lokacije.html` — Mapa (Leaflet + OpenStreetMap) i kontakt kartica
- `popusti.html` — Preuzimanje popust koda (ime + kontakt → jedinstveni kod na ekranu)
- `blog.html` — Lista blog objava (kartice sa slikom-bannerom, kategorijom i kratkim opisom)
- `clanak.html` — Pojedinačni blog članak, učitava se preko `?slug=` iz URL-a
- `o-nama.html` — O laboratoriji + kontakt forma (mailto)
- `assets/css/style.css` — jedan CSS fajl, ceo dizajn sistem (boje, tipografija, komponente)
- `assets/js/` — `main.js` (navigacija, service worker), `catalog.js` (učitavanje JSON-a), `discount.js` (popust kodovi), i po jedan fajl za logiku svake stranice
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
  "emoji": "🩸",
  "date": "2026-08-01",
  "excerpt": "Kratak opis za karticu na listi (1-2 rečenice).",
  "catalogQuery": "reč za pretragu u katalogu (dugme 'Pronađi u katalogu')",
  "sourceLabel": "Naziv izvora (opciono, prikazuje se kao napomena na dnu članka)",
  "sourceUrl": "https://... (opciono)",
  "body": ["Prvi pasus.", "Drugi pasus.", "..."]
}
```

`banner` bira boju bannera — dostupne vrednosti: `gold`, `teal`, `rose`, `deep`, `slate`, `coral` (definisane u `assets/css/style.css` pod `.tip-banner--*`). `slug` mora biti jedinstven — koristi se u URL-u `clanak.html?slug=...`.

**Važna napomena o autorskim pravima:** tekst objava treba da bude originalan (napisan svojim rečima), čak i kada se koristi kao inspiracija strani članak — direktno kopiranje/prevod tuđeg teksta krši autorska prava. `sourceLabel`/`sourceUrl` služe da se navede opšti izvor informacija (kao referenca), ne da se citira ili prepiše ceo tekst.

## Popust kodovi — kako rade (bez baze)

Kod koji posetilac dobija na `popusti.html` je **sam sebi dovoljan za proveru** — sadrži 6 nasumičnih cifara i 2-cifreni kontrolni broj izračunat iz njih (`assets/js/discount.js`). Kalkulator proverava kod istim izračunom, pa nije potrebna nikakva baza ili server da bi se utvrdilo da li je kod validno izdat sa ovog sajta. Trenutno svaki validan kod nosi fiksni popust od 10% (`DISCOUNT_PERCENT` u `discount.js`).

Ime i kontakt koje posetilac unese čuvaju se lokalno u browseru (`localStorage`, ključ `biotest_discount_leads`) — to je samo lokalna beleška tog uređaja, laboratorija ih trenutno ne prima centralno. Ako ti zatreba da svi preuzeti kodovi/kontakti stignu na jedno mesto (npr. za praćenje ili marketing), najlakša opcija je **Firebase Firestore na besplatnom Spark planu** (isti pristup kao u `legacy-odmorpro` aplikaciji) — javi ako ti to zatreba, dodaje se bez menjanja postojeće logike provere koda.

## Mapa (Lokacije)

`lokacije.html` prikazuje **svih 6 BIOTEST lokacija** (5 u Novom Sadu + 1 u Novom Bečeju) na jednoj Leaflet + OpenStreetMap mapi (besplatno, bez API ključa), sa karticom po lokaciji ispod mape (adresa, radno vreme, telefoni, dugme za poziv). Klik na karticu centrira mapu na tu lokaciju.

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

## PWA

Sajt ima `manifest.json` i osnovni `sw.js` (network-first keš), tako da se može instalirati na telefon ("Add to Home Screen"). Ikonice su u `assets/icons/`.

## Pokretanje lokalno

Nema build koraka. Za razvoj, pokreni bilo koji statički server iz root foldera (npr. `python3 -m http.server`) i otvori `http://localhost:8000` — direktno otvaranje `index.html` dvoklikom (`file://`) takođe radi za većinu stranica, osim što `fetch()` poziva (učitavanje JSON kataloga) u nekim browserima zahteva pravi server zbog CORS pravila za lokalne fajlove.

## Postavljanje na GitHub Pages

Isto kao i ranije za OdmorPro: **Settings → Pages → Deploy from a branch → `main` / `(root)`**. Pošto je `index.html` sada BIOTEST sajt, on postaje početna stranica na domenu; stara OdmorPro aplikacija ostaje dostupna na `/legacy-odmorpro/index.html` ako je i dalje negde u upotrebi.
