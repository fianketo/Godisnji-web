// BIOTEST — Admin panel: prijava, upravljanje promocijama, provera/otkazivanje koda.

const ICON_CHOICES = ['tag', 'flask', 'droplet', 'droplets', 'heart', 'gift', 'bandage', 'microscope', 'sun', 'candy', 'flower'];
const BANNER_CHOICES = ['teal', 'gold', 'rose', 'deep', 'slate', 'coral'];

function formatPrice(price) {
  return new Intl.NumberFormat('sr-RS').format(price) + ' RSD';
}

function formatDateTime(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('sr-RS', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

document.addEventListener('DOMContentLoaded', async () => {
  const configWarning = document.getElementById('config-warning');
  const loginScreen = document.getElementById('login-screen');
  const adminScreen = document.getElementById('admin-screen');
  const loginForm = document.getElementById('login-form');
  const loginError = document.getElementById('login-error');
  const logoutBtn = document.getElementById('logout-btn');

  // Dinamički import (ne statički na vrhu fajla) da ceo modul ne padne bez
  // traga ako Firebase SDK ne uspe da se učita (npr. ad-blocker blokira
  // gstatic.com) — tada bar prikazujemo jasnu poruku umesto prazne strane.
  let firebaseApp, firebaseReady, getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut;
  let listAllPromotions, savePromotion, deletePromotion, getOrder, redeemOrder, listRecentOrders;
  try {
    ({ firebaseApp, firebaseReady } = await import('./firebase-config.js'));
    ({ getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js'));
    ({ listAllPromotions, savePromotion, deletePromotion, getOrder, redeemOrder, listRecentOrders } = await import('./promo-store.js'));
  } catch (err) {
    configWarning.style.display = 'block';
    loginForm.querySelector('button[type="submit"]').disabled = true;
    return;
  }

  if (!firebaseReady) {
    configWarning.style.display = 'block';
    loginForm.querySelector('button[type="submit"]').disabled = true;
    return;
  }

  const auth = getAuth(firebaseApp);

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    loginError.style.display = 'none';
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      loginError.textContent = 'Pogrešan email ili lozinka.';
      loginError.style.display = 'block';
    }
  });

  logoutBtn.addEventListener('click', () => signOut(auth));

  onAuthStateChanged(auth, (user) => {
    if (user) {
      loginScreen.style.display = 'none';
      adminScreen.style.display = 'block';
      initAdminScreen();
    } else {
      loginScreen.style.display = 'block';
      adminScreen.style.display = 'none';
    }
  });

  let initialized = false;
  function initAdminScreen() {
    if (initialized) return;
    initialized = true;
    setupTabs();
    setupPromotions();
    setupCodeLookup();
  }

  function setupTabs() {
    const tabs = document.querySelectorAll('.admin-tab');
    const panels = document.querySelectorAll('.admin-panel');
    tabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        tabs.forEach((t) => t.classList.remove('is-active'));
        panels.forEach((p) => p.classList.remove('is-active'));
        tab.classList.add('is-active');
        document.getElementById(tab.dataset.panel).classList.add('is-active');
      });
    });
  }

  function setupPromotions() {
    const listEl = document.getElementById('promo-admin-list');
    const formCard = document.getElementById('promo-form-card');
    const form = document.getElementById('promo-form');
    const addBtn = document.getElementById('promo-add-btn');
    const cancelBtn = document.getElementById('promo-form-cancel');
    const iconSelect = document.getElementById('promo-icon');
    const bannerSelect = document.getElementById('promo-banner');

    iconSelect.innerHTML = ICON_CHOICES.map((i) => `<option value="${i}">${i}</option>`).join('');
    bannerSelect.innerHTML = BANNER_CHOICES.map((b) => `<option value="${b}">${b}</option>`).join('');

    let promotions = [];

    async function refresh() {
      listEl.innerHTML = '<p class="field-hint">Učitavanje...</p>';
      try {
        promotions = await listAllPromotions();
        renderList();
      } catch (err) {
        listEl.innerHTML = `<p class="field-hint">Greška pri učitavanju: ${err.message}</p>`;
      }
    }

    function renderList() {
      if (promotions.length === 0) {
        listEl.innerHTML = '<p class="field-hint">Nema unetih promocija.</p>';
        return;
      }
      listEl.innerHTML = promotions
        .map((p) => `
        <div class="admin-promo-row${p.active === false ? ' is-inactive' : ''}">
          <div class="admin-promo-row-info">
            <strong>${p.name}</strong>
            <span>${formatPrice(p.oldPrice)} → ${formatPrice(p.newPrice)} ${p.active === false ? '<em>(neaktivna)</em>' : ''}</span>
          </div>
          <div class="admin-promo-row-actions">
            <button type="button" class="btn btn-ghost btn-sm" data-action="edit" data-id="${p.id}">Izmeni</button>
            <button type="button" class="btn btn-ghost btn-sm" data-action="toggle" data-id="${p.id}">${p.active === false ? 'Aktiviraj' : 'Deaktiviraj'}</button>
            <button type="button" class="btn btn-ghost btn-sm text-danger" data-action="delete" data-id="${p.id}">Obriši</button>
          </div>
        </div>`)
        .join('');
    }

    listEl.addEventListener('click', async (e) => {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;
      const id = btn.dataset.id;
      const promo = promotions.find((p) => p.id === id);
      if (!promo) return;

      if (btn.dataset.action === 'edit') {
        openForm(promo);
      } else if (btn.dataset.action === 'toggle') {
        await savePromotion({ ...promo, active: promo.active === false });
        refresh();
      } else if (btn.dataset.action === 'delete') {
        if (confirm(`Obrisati promociju "${promo.name}"?`)) {
          await deletePromotion(id);
          refresh();
        }
      }
    });

    function openForm(promo) {
      form.reset();
      document.getElementById('promo-id').value = promo?.id || '';
      document.getElementById('promo-name').value = promo?.name || '';
      document.getElementById('promo-old-price').value = promo?.oldPrice || '';
      document.getElementById('promo-new-price').value = promo?.newPrice || '';
      document.getElementById('promo-image').value = promo?.imageUrl || '';
      iconSelect.value = promo?.icon || 'tag';
      bannerSelect.value = promo?.banner || 'teal';
      document.getElementById('promo-form-title').textContent = promo ? 'Izmeni promociju' : 'Nova promocija';
      formCard.style.display = 'block';
      formCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    addBtn.addEventListener('click', () => openForm(null));
    cancelBtn.addEventListener('click', () => { formCard.style.display = 'none'; });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const id = document.getElementById('promo-id').value || null;
      const existing = promotions.find((p) => p.id === id);
      const promo = {
        id,
        name: document.getElementById('promo-name').value.trim(),
        oldPrice: Number(document.getElementById('promo-old-price').value),
        newPrice: Number(document.getElementById('promo-new-price').value),
        imageUrl: document.getElementById('promo-image').value.trim(),
        icon: iconSelect.value,
        banner: bannerSelect.value,
        active: existing ? existing.active !== false : true,
        sortIndex: existing?.sortIndex ?? promotions.length,
      };
      await savePromotion(promo);
      formCard.style.display = 'none';
      refresh();
    });

    refresh();
  }

  function setupCodeLookup() {
    const form = document.getElementById('code-lookup-form');
    const input = document.getElementById('code-lookup-input');
    const resultEl = document.getElementById('code-lookup-result');
    const recentEl = document.getElementById('recent-orders-list');

    function renderOrder(order) {
      if (!order) {
        resultEl.innerHTML = '<p class="field-hint">Kod nije pronađen.</p>';
        return;
      }
      const itemsHtml = order.items.map((it) => `<li>${it.qty}× ${it.name} <span>${formatPrice(it.newPrice * it.qty)}</span></li>`).join('');
      resultEl.innerHTML = `
        <div class="admin-order-card${order.redeemed ? ' is-redeemed' : ''}">
          <div class="admin-order-header">
            <strong>${order.code}</strong>
            <span>${order.redeemed ? `Iskorišćen ${formatDateTime(order.redeemedAt)}` : `Izdat ${formatDateTime(order.createdAt)}`}</span>
          </div>
          <p>${order.customerName || '(bez imena)'} ${order.customerContact ? '· ' + order.customerContact : ''}</p>
          <ul class="code-items-recap">${itemsHtml}</ul>
          <div class="code-totals-recap">
            <span>Bez popusta: <s>${formatPrice(order.totalOld)}</s></span>
            <span>Za plaćanje: <strong>${formatPrice(order.totalNew)}</strong></span>
          </div>
          ${order.redeemed
            ? '<p class="admin-order-flag">⚠ Ovaj kod je već iskorišćen — ne primenjujte popust ponovo.</p>'
            : `<button type="button" class="btn btn-accent" id="redeem-btn">Označi kao iskorišćen</button>`
          }
        </div>
      `;
      if (!order.redeemed) {
        document.getElementById('redeem-btn').addEventListener('click', async () => {
          await redeemOrder(order.code);
          renderOrder({ ...order, redeemed: true, redeemedAt: new Date().toISOString() });
          refreshRecent();
        });
      }
    }

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      resultEl.innerHTML = '<p class="field-hint">Pretraga...</p>';
      const order = await getOrder(input.value);
      renderOrder(order);
    });

    async function refreshRecent() {
      const orders = await listRecentOrders(20);
      if (orders.length === 0) {
        recentEl.innerHTML = '<p class="field-hint">Još uvek nema porudžbina.</p>';
        return;
      }
      recentEl.innerHTML = orders
        .map((o) => `
        <button type="button" class="admin-recent-row${o.redeemed ? ' is-redeemed' : ''}" data-code="${o.code}">
          <span>${o.code}</span>
          <span>${formatDateTime(o.createdAt)}</span>
          <span>${o.redeemed ? 'Iskorišćen' : 'Aktivan'}</span>
        </button>`)
        .join('');
    }

    recentEl.addEventListener('click', (e) => {
      const row = e.target.closest('[data-code]');
      if (!row) return;
      input.value = row.dataset.code;
      form.requestSubmit();
    });

    refreshRecent();
  }
});
