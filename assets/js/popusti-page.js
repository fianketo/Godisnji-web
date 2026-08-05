// BIOTEST — Promocije: katalog (kao Temu) + korpa + preuzimanje koda.

const CART_KEY = 'biotest_promo_cart';

function formatPrice(price) {
  return new Intl.NumberFormat('sr-RS').format(price) + ' RSD';
}

function loadCart() {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY) || '{}');
  } catch {
    return {};
  }
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

document.addEventListener('DOMContentLoaded', async () => {
  const grid = document.getElementById('promo-grid');
  const gridEmpty = document.getElementById('promo-grid-empty');
  const gridError = document.getElementById('promo-grid-error');
  const cartPanel = document.getElementById('cart-panel');
  const cartItemsEl = document.getElementById('cart-items');
  const cartEmptyEl = document.getElementById('cart-empty');
  const cartTotalsEl = document.getElementById('cart-totals');
  const cartOldEl = document.getElementById('cart-total-old');
  const cartNewEl = document.getElementById('cart-total-new');
  const cartSaveEl = document.getElementById('cart-total-save');
  const checkoutBtn = document.getElementById('checkout-btn');
  const checkoutSection = document.getElementById('checkout-section');
  const checkoutForm = document.getElementById('checkout-form');
  const codeScreen = document.getElementById('code-screen');
  const catalogWrap = document.getElementById('promo-catalog-wrap');

  if (!grid) return;

  // Dinamički import (ne statički na vrhu fajla) da ceo modul ne padne bez
  // traga ako Firebase SDK ne uspe da se učita (npr. ad-blocker blokira
  // gstatic.com) — tada bar prikazujemo jasnu poruku umesto prazne strane.
  let firebaseReady, listActivePromotions, createOrder;
  try {
    ({ firebaseReady } = await import('./firebase-config.js'));
    ({ listActivePromotions, createOrder } = await import('./promo-store.js'));
  } catch (err) {
    if (gridError) gridError.style.display = 'block';
    if (checkoutBtn) checkoutBtn.disabled = true;
    return;
  }

  if (!firebaseReady) {
    if (gridError) gridError.style.display = 'block';
    if (checkoutBtn) checkoutBtn.disabled = true;
    return;
  }

  let promotions = [];
  let cart = loadCart();

  function cartItemsList() {
    return Object.entries(cart)
      .map(([id, qty]) => {
        const promo = promotions.find((p) => p.id === id);
        if (!promo || qty <= 0) return null;
        return { id, qty, name: promo.name, oldPrice: promo.oldPrice, newPrice: promo.newPrice };
      })
      .filter(Boolean);
  }

  function renderCart() {
    const items = cartItemsList();
    saveCart(cart);

    const cartCount = document.getElementById('cart-count');
    const totalQty = items.reduce((sum, it) => sum + it.qty, 0);
    if (cartCount) {
      cartCount.textContent = String(totalQty);
      cartCount.style.display = totalQty > 0 ? 'inline-flex' : 'none';
    }

    if (items.length === 0) {
      cartEmptyEl.style.display = '';
      cartItemsEl.style.display = 'none';
      cartTotalsEl.style.display = 'none';
      checkoutBtn.disabled = true;
      return;
    }

    cartEmptyEl.style.display = 'none';
    cartItemsEl.style.display = '';
    cartTotalsEl.style.display = '';
    checkoutBtn.disabled = false;

    cartItemsEl.innerHTML = items
      .map(
        (it) => `
      <div class="cart-item" data-id="${it.id}">
        <div class="cart-item-name">${it.name}</div>
        <div class="cart-item-qty">
          <button type="button" class="qty-btn" data-action="dec" aria-label="Smanji količinu">${window.Biotest.icon('minus')}</button>
          <span>${it.qty}</span>
          <button type="button" class="qty-btn" data-action="inc" aria-label="Povećaj količinu">${window.Biotest.icon('plus')}</button>
        </div>
        <div class="cart-item-price">${formatPrice(it.newPrice * it.qty)}</div>
        <button type="button" class="cart-item-remove" data-action="remove" aria-label="Ukloni">${window.Biotest.icon('trash')}</button>
      </div>`
      )
      .join('');

    const totalOld = items.reduce((sum, it) => sum + it.oldPrice * it.qty, 0);
    const totalNew = items.reduce((sum, it) => sum + it.newPrice * it.qty, 0);
    cartOldEl.textContent = formatPrice(totalOld);
    cartNewEl.textContent = formatPrice(totalNew);
    cartSaveEl.textContent = formatPrice(totalOld - totalNew);
  }

  function renderGrid() {
    if (promotions.length === 0) {
      gridEmpty.style.display = 'block';
      grid.style.display = 'none';
      return;
    }
    grid.style.display = '';
    gridEmpty.style.display = 'none';

    grid.innerHTML = promotions
      .map((p) => {
        const percent = Math.round((1 - p.newPrice / p.oldPrice) * 100);
        const media = p.imageUrl
          ? `<img src="${p.imageUrl}" alt="${p.name}" loading="lazy">`
          : `<div class="promo-card-icon tip-banner--${p.banner || 'teal'}">${window.Biotest.icon(p.icon || 'tag')}</div>`;
        const qty = cart[p.id] || 0;
        return `
        <div class="promo-card" data-id="${p.id}">
          <div class="promo-card-media">
            ${media}
            <span class="promo-badge">-${percent}%</span>
          </div>
          <div class="promo-card-body">
            <h3>${p.name}</h3>
            <div class="promo-card-prices">
              <span class="price-old">${formatPrice(p.oldPrice)}</span>
              <span class="price-new">${formatPrice(p.newPrice)}</span>
            </div>
            ${
              qty > 0
                ? `<div class="promo-card-qty">
                    <button type="button" class="qty-btn" data-action="dec" aria-label="Smanji količinu">${window.Biotest.icon('minus')}</button>
                    <span>${qty} u korpi</span>
                    <button type="button" class="qty-btn" data-action="inc" aria-label="Povećaj količinu">${window.Biotest.icon('plus')}</button>
                  </div>`
                : `<button type="button" class="btn btn-accent btn-block btn-sm" data-action="add">${window.Biotest.icon('shopping-cart')} Dodaj u korpu</button>`
            }
          </div>
        </div>`;
      })
      .join('');
  }

  grid.addEventListener('click', (e) => {
    const card = e.target.closest('.promo-card');
    if (!card) return;
    const id = card.dataset.id;
    const action = e.target.closest('[data-action]')?.dataset.action;
    if (!action) return;
    if (action === 'add' || action === 'inc') cart[id] = (cart[id] || 0) + 1;
    if (action === 'dec') cart[id] = Math.max(0, (cart[id] || 0) - 1);
    renderGrid();
    renderCart();
  });

  cartItemsEl.addEventListener('click', (e) => {
    const row = e.target.closest('.cart-item');
    if (!row) return;
    const id = row.dataset.id;
    const action = e.target.closest('[data-action]')?.dataset.action;
    if (action === 'inc') cart[id] = (cart[id] || 0) + 1;
    if (action === 'dec') cart[id] = Math.max(0, (cart[id] || 0) - 1);
    if (action === 'remove') delete cart[id];
    renderGrid();
    renderCart();
  });

  checkoutBtn.addEventListener('click', () => {
    checkoutSection.style.display = 'block';
    catalogWrap.style.display = 'none';
    cartPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  document.getElementById('checkout-back')?.addEventListener('click', () => {
    checkoutSection.style.display = 'none';
    catalogWrap.style.display = '';
  });

  checkoutForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const items = cartItemsList();
    if (items.length === 0) return;

    const submitBtn = checkoutForm.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Kreiranje koda...';

    try {
      const name = document.getElementById('checkout-name').value.trim();
      const contact = document.getElementById('checkout-contact').value.trim();
      const order = await createOrder({ items, customerName: name, customerContact: contact });
      renderCodeScreen(order);
      cart = {};
      saveCart(cart);
    } catch (err) {
      alert('Došlo je do greške pri kreiranju koda. Pokušajte ponovo. (' + err.message + ')');
      submitBtn.disabled = false;
      submitBtn.textContent = 'Preuzmi kod';
    }
  });

  function renderCodeScreen(order) {
    checkoutSection.style.display = 'none';
    cartPanel.style.display = 'none';
    catalogWrap.style.display = 'none';
    codeScreen.style.display = 'block';

    const dateStr = new Date(order.createdAt).toLocaleDateString('sr-RS', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });

    const itemsHtml = order.items
      .map((it) => `<li>${it.qty}× ${it.name} <span>${formatPrice(it.newPrice * it.qty)}</span></li>`)
      .join('');

    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&margin=8&data=${encodeURIComponent(order.code)}`;

    codeScreen.innerHTML = `
      <div class="code-screen-inner">
        <div class="icon-badge" style="margin: 0 auto 14px;">${window.Biotest.icon('check')}</div>
        <h2>Vaš kod je spreman</h2>
        <p class="field-hint">Uslikajte ovaj ekran (screenshot) i pokažite ga na šalteru prilikom plaćanja. Kod važi jednokratno.</p>
        <div class="code-display code-display-lg">
          <div>Kod • izdat ${dateStr}</div>
          <div class="code-value">${order.code}</div>
          <img class="code-qr" src="${qrUrl}" alt="QR kod za brzo očitavanje" width="140" height="140">
        </div>
        <ul class="code-items-recap">${itemsHtml}</ul>
        <div class="code-totals-recap">
          <span>Ukupno bez popusta: <s>${formatPrice(order.totalOld)}</s></span>
          <span>Ukupno sa popustom: <strong>${formatPrice(order.totalNew)}</strong></span>
        </div>
        <button type="button" class="btn btn-outline" id="new-order-btn">Napravi novu porudžbinu</button>
      </div>
    `;

    document.getElementById('new-order-btn').addEventListener('click', () => {
      codeScreen.style.display = 'none';
      cartPanel.style.display = '';
      catalogWrap.style.display = '';
      renderGrid();
      renderCart();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  try {
    promotions = await listActivePromotions();
    renderGrid();
    renderCart();
  } catch (err) {
    if (gridError) gridError.style.display = 'block';
  }
});
