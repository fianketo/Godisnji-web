// BIOTEST — katalog akcija (Temu-stil kartice), korpa i porudžbina koja
// generiše jedinstven kod poslat na email (assets/js/firebase-init.js,
// assets/js/promotions.js). Ako Firebase konfiguracija (assets/js/firebase-config.js)
// još nije popunjena, ova sekcija se sakriva i prikazuje se poruka —
// stara "opšti popust" forma ispod i dalje radi nezavisno od ovoga.

(function () {
  const gridEl = document.getElementById('promo-grid');
  const loadingEl = document.getElementById('promo-loading');
  const notConfiguredEl = document.getElementById('promo-not-configured');
  const emptyEl = document.getElementById('promo-empty');
  const appEl = document.getElementById('promo-app');

  const calcPanel = document.getElementById('calc-panel');
  const calcClose = document.getElementById('calc-close');
  const calcCount = document.getElementById('calc-count');
  const calcItemsEl = document.getElementById('calc-items');
  const calcSummary = document.getElementById('calc-summary');
  const totalOldEl = document.getElementById('cart-total-old');
  const savingsEl = document.getElementById('cart-savings');
  const totalNewEl = document.getElementById('cart-total-new');

  const checkoutForm = document.getElementById('checkout-form');
  const checkoutName = document.getElementById('checkout-name');
  const checkoutEmail = document.getElementById('checkout-email');
  const checkoutSubmit = document.getElementById('checkout-submit');
  const checkoutMsg = document.getElementById('checkout-msg');
  const checkoutSuccess = document.getElementById('checkout-success');
  const successCode = document.getElementById('success-code');
  const successQr = document.getElementById('success-qr');
  const newOrderBtn = document.getElementById('new-order-btn');

  const mobileSummary = document.getElementById('mobile-calc-summary');
  const mobileOpenBtn = document.getElementById('mobile-calc-open');

  const { formatPromoPrice, generateOrderCode, getPromoCart, addToPromoCart, removeFromPromoCart, clearPromoCart, icon } = window.Biotest;

  let promos = [];
  let cart = getPromoCart();

  loadingEl.style.display = 'none';

  if (!window.Biotest.firebaseReady) {
    notConfiguredEl.style.display = 'block';
    return;
  }

  window.Biotest.db.collection('promotions').where('active', '==', true).get()
    .then((snap) => {
      promos = [];
      snap.forEach((doc) => promos.push({ id: doc.id, ...doc.data() }));
      if (promos.length === 0) {
        emptyEl.style.display = 'block';
        return;
      }
      appEl.style.display = 'grid';
      renderGrid();
      renderCart();
    })
    .catch((err) => {
      notConfiguredEl.style.display = 'block';
      notConfiguredEl.querySelector('p').textContent = 'Greška pri učitavanju akcija: ' + err.message;
    });

  function discountPercent(p) {
    if (!p.oldPrice || p.oldPrice <= p.newPrice) return 0;
    return Math.round((1 - p.newPrice / p.oldPrice) * 100);
  }

  function renderGrid() {
    gridEl.innerHTML = promos.map((p) => {
      const inCart = cart.some((i) => i.id === p.id);
      const pct = discountPercent(p);
      return `<div class="promo-card">
        <div class="promo-card-media">
          ${p.imageUrl ? `<img src="${p.imageUrl}" alt="${p.name}" loading="lazy">` : ''}
          ${pct > 0 ? `<span class="promo-card-discount">-${pct}%</span>` : ''}
        </div>
        <div class="promo-card-body">
          <p class="promo-card-name">${p.name}</p>
          <div class="promo-card-prices">
            ${p.oldPrice ? `<span class="promo-card-price-old">${formatPromoPrice(p.oldPrice)}</span>` : ''}
            <span class="promo-card-price-new">${formatPromoPrice(p.newPrice)}</span>
          </div>
          <button type="button" class="promo-card-add${inCart ? ' in-cart' : ''}" data-add="${p.id}" ${inCart ? 'disabled' : ''}>
            ${inCart ? icon('check') + ' U korpi' : icon('shopping-cart') + ' Dodaj u korpu'}
          </button>
        </div>
      </div>`;
    }).join('');

    gridEl.querySelectorAll('[data-add]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const promo = promos.find((p) => p.id === btn.getAttribute('data-add'));
        cart = addToPromoCart(promo);
        renderGrid();
        renderCart();
        calcPanel.classList.add('mobile-open');
      });
    });
  }

  function renderCart() {
    checkoutSuccess.style.display = 'none';
    calcCount.style.display = 'block';
    calcItemsEl.style.display = 'flex';

    if (cart.length === 0) {
      calcCount.textContent = 'Korpa je prazna.';
      calcItemsEl.innerHTML = '<p class="calc-empty">Dodajte akcije iz ponude da biste videli ukupnu cenu.</p>';
      calcSummary.style.display = 'none';
      mobileSummary.textContent = '0 stavki u korpi';
      return;
    }

    calcCount.textContent = `U korpi: ${cart.length} ${cart.length === 1 ? 'stavka' : 'stavke/i'}`;
    calcSummary.style.display = 'block';

    calcItemsEl.innerHTML = cart.map((p) => `
      <div class="calc-item promo-cart-item">
        <div class="calc-item-top">
          <span>${p.name}</span>
          <button type="button" aria-label="Ukloni ${p.name}" data-remove="${p.id}">${icon('x')}</button>
        </div>
        <div class="calc-item-meta">
          <span class="calc-item-time">${p.oldPrice ? `<span class="promo-old-price">${formatPromoPrice(p.oldPrice)}</span>` : ''}</span>
          <span class="calc-item-price">${formatPromoPrice(p.newPrice)}</span>
        </div>
      </div>`).join('');

    calcItemsEl.querySelectorAll('[data-remove]').forEach((btn) => {
      btn.addEventListener('click', () => {
        cart = removeFromPromoCart(btn.getAttribute('data-remove'));
        renderGrid();
        renderCart();
      });
    });

    const totalOld = cart.reduce((sum, p) => sum + (p.oldPrice || p.newPrice), 0);
    const totalNew = cart.reduce((sum, p) => sum + p.newPrice, 0);
    totalOldEl.textContent = formatPromoPrice(totalOld);
    savingsEl.textContent = '-' + formatPromoPrice(totalOld - totalNew);
    totalNewEl.textContent = formatPromoPrice(totalNew);

    mobileSummary.textContent = `${cart.length} ${cart.length === 1 ? 'stavka' : 'stavke/i'} · ${formatPromoPrice(totalNew)}`;
  }

  checkoutForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (cart.length === 0) return;
    const name = checkoutName.value.trim();
    const email = checkoutEmail.value.trim();
    if (!name || !email) return;

    checkoutSubmit.disabled = true;
    checkoutSubmit.textContent = 'Slanje...';
    checkoutMsg.style.display = 'none';

    const code = generateOrderCode();
    const totalOld = cart.reduce((sum, p) => sum + (p.oldPrice || p.newPrice), 0);
    const totalNew = cart.reduce((sum, p) => sum + p.newPrice, 0);
    const itemsSummary = cart.map((p) => `${p.name} — ${formatPromoPrice(p.newPrice)}`).join('\n');

    const order = {
      items: cart.map((p) => ({ id: p.id, name: p.name, oldPrice: p.oldPrice || null, newPrice: p.newPrice })),
      customerName: name,
      customerEmail: email,
      totalOld,
      totalNew,
      savings: totalOld - totalNew,
      status: 'neiskorišćen',
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    };

    window.Biotest.db.collection('orders').doc(code).set(order)
      .then(() => sendOrderEmail(code, name, email, itemsSummary, totalOld, totalNew))
      .then(() => {
        clearPromoCart();
        cart = [];
        renderGrid();
        renderCart();
        showSuccess(code);
        checkoutForm.reset();
      })
      .catch((err) => {
        checkoutMsg.textContent = 'Greška: ' + err.message + ' Pokušajte ponovo.';
        checkoutMsg.className = 'promo-status-msg err';
        checkoutMsg.style.display = 'block';
      })
      .finally(() => {
        checkoutSubmit.disabled = false;
        checkoutSubmit.textContent = 'Pošalji porudžbinu i preuzmi kod';
      });
  });

  function sendOrderEmail(code, name, email, itemsSummary, totalOld, totalNew) {
    const ejsCfg = window.BiotestConfig.emailjs;
    if (!ejsCfg.publicKey || !ejsCfg.serviceId || !ejsCfg.templateId || typeof emailjs === 'undefined') {
      return Promise.resolve(); // Email nije podešen — porudžbina je ipak sačuvana, kod je vidljiv na ekranu.
    }
    emailjs.init({ publicKey: ejsCfg.publicKey });
    return emailjs.send(ejsCfg.serviceId, ejsCfg.templateId, {
      to_name: name,
      to_email: email,
      code,
      items: itemsSummary,
      total_old: formatPromoPrice(totalOld),
      total_new: formatPromoPrice(totalNew),
    }).catch((err) => {
      console.error('EmailJS greška', err); // Ne prekidamo tok — kod je već sačuvan i prikazan na ekranu.
    });
  }

  function showSuccess(code) {
    successCode.textContent = code;
    checkoutSuccess.style.display = 'block';
    calcSummary.style.display = 'none';
    calcCount.style.display = 'none';
    calcItemsEl.style.display = 'none';
    if (typeof qrcode !== 'undefined') {
      const qr = qrcode(0, 'M');
      qr.addData(code);
      qr.make();
      successQr.innerHTML = qr.createSvgTag({ cellSize: 4, margin: 2 });
    }
  }

  newOrderBtn.addEventListener('click', () => {
    checkoutSuccess.style.display = 'none';
    renderCart();
  });

  mobileOpenBtn.addEventListener('click', () => calcPanel.classList.add('mobile-open'));
  calcClose.addEventListener('click', () => calcPanel.classList.remove('mobile-open'));
})();
