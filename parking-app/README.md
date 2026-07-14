# Parking NS — MVP

Android MVP aplikacija koja automatski prepoznaje kada si parkirao vozilo u Novom Sadu, prikaže ulicu/zonu/cenu i omogući plaćanje SMS-om — bez ijednog plaćenog API-ja ili mesečne pretplate.

## Tech stack (sve besplatno)

| Potreba | Rešenje | Trošak |
|---|---|---|
| Framework | React Native (Expo, managed workflow) | 0 |
| Detekcija parkiranja | `expo-location` + `expo-task-manager`, brzina kretanja → geofencing logika | 0 |
| Reverse geocoding | OpenStreetMap **Nominatim** (bez API ključa, throttled na 1 req/s) | 0 |
| Baza zona | Lokalni JSON (`src/data/parkingZones.json`), ručno mapiran za Novi Sad | 0 |
| Notifikacije | `expo-notifications` (lokalne, bez Firebase/FCM) | 0 |
| Plaćanje | `sms:` intent (otvara native SMS app, korisnik sam šalje) | 0 |
| Istorija parkiranja | `expo-sqlite` (lokalno na uređaju) | 0 |
| Autentifikacija | Nema — single-user, lokalni podaci | 0 |
| Objava na Play Store | Google Play Developer nalog | ~25$ jednokratno (jedini trošak) |

## Struktura projekta

```
parking-app/
  App.js                        # root komponenta, notification-response listener
  app.json                      # Expo config: dozvole, plugin-ovi
  src/
    constants/config.js         # pragovi za detekciju, Nominatim podešavanja
    data/parkingZones.json      # zone/ulice/cene za Novi Sad (ILUSTRATIVNO, proveri pre produkcije)
    services/
      db.js                     # expo-sqlite inicijalizacija
      historyService.js         # CRUD nad tabelom parking_sessions
      settingsService.js        # registarska oznaka, tracking on/off (AsyncStorage)
      geocodingService.js       # Nominatim reverse geocoding, throttlovan na 1req/s
      zoneMatcher.js            # ulica -> zona (lokalni JSON)
      notificationService.js    # lokalne notifikacije + kategorija "Plati SMS-om"
      smsService.js             # sms: intent sa brojem zone i registracijom
      locationTracker.js        # background location task + logika detekcije parkiranja
    navigation/AppNavigator.js   # bottom tabs: Parkiranje / Istorija
    screens/HomeScreen.js        # status, uključi/isključi praćenje, aktivna sesija
    screens/HistoryScreen.js     # istorija parkiranja
    components/ParkingCard.js    # kartica za aktivnu parking sesiju
```

## Kako radi detekcija parkiranja

1. Kad korisnik uključi "Automatska detekcija", aplikacija traži dozvolu za lokaciju (prvo foreground, pa background — `"Allow all the time"` na Android 10+), uz objašnjenje razloga.
2. `expo-location.startLocationUpdatesAsync` šalje pozicije na definisan `TaskManager` task na svakih ~30s ili 25m pomeraja (balans potrošnje baterije).
3. U `locationTracker.js`: ako je brzina ≤ ~0.6 m/s neprekidno **3+ minuta**, tretira se kao parkiranje:
   - reverse-geocode GPS → ulica (Nominatim, throttled)
   - ulica se mapira na zonu iz `parkingZones.json`
   - sesija se snima u SQLite
   - šalje se lokalna notifikacija sa cenom i dugmetom "Plati SMS-om"
4. Kad brzina ponovo pređe ~1.5 m/s, sesija se zatvara (`ended_at`).
5. Korisnik može da izabere trajanje parkiranja (30min/1h/2h/ceo dan) — zakazuje se podsetnik 10 minuta pre isteka.

## Pokretanje (razvoj)

```bash
cd parking-app
npm install
npx expo install --fix   # uskladi verzije paketa sa instaliranom Expo SDK verzijom
npx expo start
```

**Važno — background lokacija ne radi u Expo Go**. Android background location zahteva custom development build (Expo Go klijent to ne podržava od SDK 45+). Za testiranje pozadinske detekcije parkiranja:

```bash
npx expo install expo-dev-client
npx eas build --profile development --platform android
```

(EAS build je besplatan za lične/male projekte u okviru free tier-a; potreban je samo besplatan Expo nalog.)

## Objava na Google Play

1. Napravi besplatan Expo/EAS nalog.
2. `npx eas build --platform android --profile production` → generiše `.aab`.
3. Otvori Google Play Developer nalog (jednokratnih ~25$) i uploaduj `.aab`.

## Ograničenja MVP verzije (svesno pojednostavljeno)

- Samo Novi Sad, ručno mapirane ulice/zone u `parkingZones.json` — **cene, brojevi za SMS i granice zona su ilustrativni**, sastavljeni iz javno dostupnih izvora (parkingns.rs, jul 2026.) i **moraju se proveriti/ažurirati** pre realne upotrebe, jer zvanični podaci mogu biti tačniji ili se promeniti.
- Samo Android — nema Apple Developer naloga (99$/god).
- Bez cloud sinhronizacije — sve ostaje lokalno na uređaju (SQLite + AsyncStorage).
- Nema autentifikacije — aplikacija pretpostavlja jednog korisnika po uređaju.
- Detekcija parkiranja je heuristika bazirana na brzini iz GPS-a; u urbanim kanjonima (uske ulice, tuneli) GPS signal može biti nestabilan, što MVP svesno prihvata kao kompromis.
- Nominatim reverse geocoding je throttlovan na ~1 zahtev/sekundi i namenjen pojedinačnom korisniku — pre skaliranja na više korisnika trebalo bi razmisliti o sopstvenom OSM/Nominatim instanci ili plaćenom servisu.

## Sledeći koraci (kad/ako zaživi)

- Firebase (auth + cloud sync) kad broj korisnika opravda backend.
- Google Maps SDK za vizuelni prikaz zona na mapi.
- Push notifikacije (FCM) ako treba obaveštavati korisnika i kad app nije pokrenuta duže vreme.
- Automatska verifikacija/refresh zvaničnih podataka o zonama (npr. periodično poređenje sa parkingns.rs).

## Napomena o testiranju

Ovaj kod nije pokrenut na realnom Android uređaju/emulatoru u ovoj sesiji (nema Android SDK/emulator u ovom okruženju) — proveren je: sintaksa svih JS/JSX fajlova (parsing), validnost `package.json`/`app.json`/`parkingZones.json`, i logička konzistentnost servisa. Pre puštanja u produkciju obavezno testiraj na sopstvenom telefonu, posebno tok dozvola za pozadinsku lokaciju i realnu detekciju parkiranja u vožnji.
