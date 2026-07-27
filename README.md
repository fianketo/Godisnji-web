# BIOTEST — sajt za Zavod za laboratorijsku dijagnostiku

Prezentacioni, informativni sajt za BIOTEST laboratoriju (Novi Sad, Koste Abraševića 31). Bez online zakazivanja termina i bez portala za preuzimanje rezultata — samo katalog analiza, kalkulator cene/vremena, lokacije, popusti i osnovne informacije.

Statičan sajt (obične HTML/CSS/JS stranice, bez build koraka, bez servera) — jednostavan za održavanje za jednog developera.

> Napomena: prethodna aplikacija koja je bila u ovom repozitorijumu (OdmorPro — evidencija odsustva) premeštena je u `/legacy-odmorpro/` da bi napravila mesto za ovaj sajt. Njen README je i dalje unutar tog foldera.

## Struktura sajta

- `index.html` — Početna (hero, promocija, zašto Biotest, teaser saveta)
- `katalog.html` — Katalog analiza: pretraga + filter po kategoriji + ugrađeni kalkulator cene i vremena
- `lokacije.html` — Mapa (Leaflet + OpenStreetMap) i kontakt kartica
- `popusti.html` — Preuzimanje popust koda (ime + kontakt → jedinstveni kod na ekranu)
- `saveti.html` — Rotirajući zdravstveni saveti (statični tekstovi)
- `o-nama.html` — O laboratoriji + kontakt forma (mailto)
- `assets/css/style.css` — jedan CSS fajl, ceo dizajn sistem (boje, tipografija, komponente)
- `assets/js/` — `main.js` (navigacija, service worker), `catalog.js` (učitavanje JSON-a), `discount.js` (popust kodovi), i po jedan fajl za logiku svake stranice
- `data/biotest-analize.json` — katalog analiza (26 kategorija, ~940 analiza), učitava se kao statički JSON

## Ažuriranje cenovnika

Sve analize, cene i vremena obrade nalaze se u `data/biotest-analize.json`, grupisano po kategoriji:

```json
{ "name": "S-TSH", "instrument": "Cobas e411_2", "time": "4h", "price": 650 }
```

Da izmeniš cenu, vreme ili dodaš/obrišeš analizu — samo izmeni ovaj fajl (validan JSON) i osveži stranicu, ništa drugo ne treba menjati. Nekoliko naziva ima mali ostatak teksta na kraju (artefakt automatske obrade PDF cenovnika, npr. zarez ili broj) — po potrebi ih ručno ispravi direktno u ovom fajlu.

## Kalkulator i vreme obrade

Kalkulator (na `katalog.html`) sabira cene izabranih analiza i prikazuje **najduže** vreme obrade među njima. Pošto se vreme u cenovniku beleži veoma različito ("4h", "2-3 dana", "do 15 dana", "45 min."...), `assets/js/catalog.js` sadrži `parseTimeToHours()` koja sve to pretvara u približan broj sati radi poređenja — u kalkulatoru se onda prikazuje originalan tekst analize sa najdužim vremenom (ne prepravljen broj), da ostane čitljivo i tačno.

## Popust kodovi — kako rade (bez baze)

Kod koji posetilac dobija na `popusti.html` je **sam sebi dovoljan za proveru** — sadrži 6 nasumičnih cifara i 2-cifreni kontrolni broj izračunat iz njih (`assets/js/discount.js`). Kalkulator proverava kod istim izračunom, pa nije potrebna nikakva baza ili server da bi se utvrdilo da li je kod validno izdat sa ovog sajta. Trenutno svaki validan kod nosi fiksni popust od 10% (`DISCOUNT_PERCENT` u `discount.js`).

Ime i kontakt koje posetilac unese čuvaju se lokalno u browseru (`localStorage`, ključ `biotest_discount_leads`) — to je samo lokalna beleška tog uređaja, laboratorija ih trenutno ne prima centralno. Ako ti zatreba da svi preuzeti kodovi/kontakti stignu na jedno mesto (npr. za praćenje ili marketing), najlakša opcija je **Firebase Firestore na besplatnom Spark planu** (isti pristup kao u `legacy-odmorpro` aplikaciji) — javi ako ti to zatreba, dodaje se bez menjanja postojeće logike provere koda.

## Mapa (Lokacije)

`lokacije.html` koristi Leaflet + OpenStreetMap (besplatno, bez API ključa). Pošto tačne GPS koordinate za Koste Abraševića 31 nisu bile dostupne prilikom izrade, `assets/js/lokacije-page.js` pri prvoj poseti pokuša da sam geokodira adresu preko besplatnog Nominatim servisa (iz browsera posetioca) i rezultat trajno zapamti (`localStorage`). Dok se to ne desi (ili ako geokodiranje ne uspe), marker stoji na proceni centra Novog Sada — **ako znaš tačne koordinate**, upiši ih direktno u `FALLBACK_COORDS` na vrhu tog fajla da mapa uvek bude precizna bez oslanjanja na spoljni servis.

Radno vreme na `lokacije.html` je trenutno **placeholder** — zameni ga tačnim podacima čim ih dobiješ (jasno je obeleženo u HTML-u).

## PWA

Sajt ima `manifest.json` i osnovni `sw.js` (network-first keš), tako da se može instalirati na telefon ("Add to Home Screen"). Ikonice su u `assets/icons/`.

## Pokretanje lokalno

Nema build koraka. Za razvoj, pokreni bilo koji statički server iz root foldera (npr. `python3 -m http.server`) i otvori `http://localhost:8000` — direktno otvaranje `index.html` dvoklikom (`file://`) takođe radi za većinu stranica, osim što `fetch()` poziva (učitavanje JSON kataloga) u nekim browserima zahteva pravi server zbog CORS pravila za lokalne fajlove.

## Postavljanje na GitHub Pages

Isto kao i ranije za OdmorPro: **Settings → Pages → Deploy from a branch → `main` / `(root)`**. Pošto je `index.html` sada BIOTEST sajt, on postaje početna stranica na domenu; stara OdmorPro aplikacija ostaje dostupna na `/legacy-odmorpro/index.html` ako je i dalje negde u upotrebi.
