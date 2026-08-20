// BIOTEST — deljena logika za promocije: korpa (localStorage) i generisanje
// jedinstvenog koda porudžbine. Za razliku od starog popust-koda (koji je
// samo-proverljiv preko kontrolnog broja), ovaj kod predstavlja konkretnu
// porudžbinu sačuvanu u Firestore-u (assets/js/firebase-init.js) — laboratorija
// ga učitava i vidi tačno šta je izabrano i koliki je popust.

const PROMO_CART_KEY = 'biotest_promo_cart';

function formatPromoPrice(price) {
  return new Intl.NumberFormat('sr-RS').format(price) + ' RSD';
}

function generateOrderCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // bez lako-zabunljivih znakova (0/O, 1/I)
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return `BIO-${code}`;
}

function getPromoCart() {
  try {
    return JSON.parse(localStorage.getItem(PROMO_CART_KEY) || '[]');
  } catch {
    return [];
  }
}

function savePromoCart(items) {
  localStorage.setItem(PROMO_CART_KEY, JSON.stringify(items));
}

function addToPromoCart(promo) {
  const items = getPromoCart();
  if (items.some((i) => i.id === promo.id)) return items;
  items.push(promo);
  savePromoCart(items);
  return items;
}

function removeFromPromoCart(id) {
  const items = getPromoCart().filter((i) => i.id !== id);
  savePromoCart(items);
  return items;
}

function clearPromoCart() {
  localStorage.removeItem(PROMO_CART_KEY);
}

window.Biotest = window.Biotest || {};
window.Biotest.formatPromoPrice = formatPromoPrice;
window.Biotest.generateOrderCode = generateOrderCode;
window.Biotest.getPromoCart = getPromoCart;
window.Biotest.savePromoCart = savePromoCart;
window.Biotest.addToPromoCart = addToPromoCart;
window.Biotest.removeFromPromoCart = removeFromPromoCart;
window.Biotest.clearPromoCart = clearPromoCart;
