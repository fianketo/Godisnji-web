// BIOTEST — popust kodovi.
// Kod je samo-proverljiv (kontrolni broj), pa nije potrebna baza/server
// da bi se u kalkulatoru proverilo da li je kod ispravno izdat sa ovog sajta.
// Napomena za kasnije: ako zatreba centralno čuvanje ko je kod preuzeo
// (npr. radi praćenja iskorišćenosti), najlakša opcija je Firebase Firestore
// na besplatnom Spark planu — videti README.

const DISCOUNT_PERCENT = 10;

function checksumOf(baseDigits) {
  let sum = 0;
  for (let i = 0; i < baseDigits.length; i++) {
    sum += Number(baseDigits[i]) * (i + 2);
  }
  return (sum % 97).toString().padStart(2, '0');
}

function generateDiscountCode() {
  const base = Math.floor(100000 + Math.random() * 900000).toString();
  return `BIO-${base}-${checksumOf(base)}`;
}

function isValidDiscountCode(code) {
  const match = /^BIO-(\d{6})-(\d{2})$/.exec((code || '').trim().toUpperCase());
  if (!match) return false;
  const [, base, check] = match;
  return checksumOf(base) === check;
}

function saveDiscountLead(name, contact, code) {
  const leads = JSON.parse(localStorage.getItem('biotest_discount_leads') || '[]');
  leads.push({ name, contact, code, createdAt: new Date().toISOString() });
  localStorage.setItem('biotest_discount_leads', JSON.stringify(leads));
}

window.Biotest = window.Biotest || {};
window.Biotest.DISCOUNT_PERCENT = DISCOUNT_PERCENT;
window.Biotest.generateDiscountCode = generateDiscountCode;
window.Biotest.isValidDiscountCode = isValidDiscountCode;
window.Biotest.saveDiscountLead = saveDiscountLead;
