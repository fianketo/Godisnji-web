// BIOTEST — učitavanje kataloga analiza (data/biotest-analize.json),
// pretraga/filter, i logika kalkulatora cene/vremena.
// Nema baze — sve radi nad statičkim JSON-om učitanim u browseru.

const CATALOG_URL = 'data/biotest-analize.json';

/** Pretvara raznolike zapise vremena ("4h", "2-3 dana", "do 15 dana", "45 min.", "")
 *  u približan broj sati, da bi se mogle porediti i naći najduže vreme. */
function parseTimeToHours(raw) {
  if (!raw) return 0;
  const str = raw.toString().trim().toLowerCase();
  if (!str) return 0;

  const numbers = str.match(/\d+(?:[.,]\d+)?/g);
  if (!numbers) return 0;
  // Za opsege ("2-3 dana") ili "do 15 dana" uzimamo najveći broj (gornju granicu).
  const value = Math.max(...numbers.map((n) => parseFloat(n.replace(',', '.'))));

  if (str.includes('min')) return value / 60;
  if (str.includes('sat') || /\bh\b/.test(str) || str.endsWith('h')) return value;
  if (str.includes('dan') || str.includes('rd')) return value * 24;
  return value; // nepoznata jedinica — tretiraj kao sate
}

// Prefiks u nazivu analize (deo pre prve crte) govori kakav se uzorak uzima.
// S/eK/cP/eP/cK/hK/hP/K = uzorak krvi (serum/plazma/puna krv) → vađenje krvi.
// B/B-U/OT = bris (koža, grlo, nokat...) → uzimanje brisa.
// Ostalo (U, dU, F, SPR, SPT, Sp, Km...) pacijent sam donosi uzorak (urin, feces...) — nema dodatne usluge uzorkovanja.
const BLOOD_SAMPLE_PREFIXES = new Set(['S', 'eK', 'cP', 'eP', 'cK', 'hK', 'hP', 'K', 'k']);
const SWAB_SAMPLE_PREFIXES = new Set(['B', 'B/U', 'OT']);

function parseSampleType(name) {
  const match = /^([A-Za-zčćžšđČĆŽŠĐ0-9/]+)-/.exec(name);
  if (!match) return null;
  const prefix = match[1];
  if (BLOOD_SAMPLE_PREFIXES.has(prefix)) return 'krv';
  if (SWAB_SAMPLE_PREFIXES.has(prefix)) return 'bris';
  return null;
}

function slugify(str) {
  return str
    .toString()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

/** Učitava JSON katalog i vraća { categories: string[], tests: Test[] }
 *  gde je Test = { id, category, name, instrument, time, price, hours } */
async function loadCatalog() {
  const res = await fetch(CATALOG_URL);
  if (!res.ok) throw new Error('Ne mogu da učitam katalog analiza.');
  const data = await res.json();

  const categories = Object.keys(data);
  const tests = [];
  for (const category of categories) {
    for (const item of data[category]) {
      tests.push({
        id: `${slugify(category)}--${slugify(item.name)}`,
        category,
        name: item.name,
        instrument: item.instrument || '',
        time: item.time || '',
        price: item.price,
        hours: parseTimeToHours(item.time),
        sampleType: parseSampleType(item.name),
      });
    }
  }
  return { categories, tests };
}

function formatPrice(price) {
  return new Intl.NumberFormat('sr-RS').format(price) + ' RSD';
}

window.Biotest = window.Biotest || {};
window.Biotest.loadCatalog = loadCatalog;
window.Biotest.formatPrice = formatPrice;
window.Biotest.parseTimeToHours = parseTimeToHours;
window.Biotest.parseSampleType = parseSampleType;
