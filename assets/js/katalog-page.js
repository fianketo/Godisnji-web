// BIOTEST — logika stranice Katalog analiza: pretraga, filter po kategoriji,
// i kalkulator cene/vremena za izabrane analize.

(function () {
  const { loadCatalog, formatPrice } = window.Biotest;
  const { generateDiscountCode, isValidDiscountCode, DISCOUNT_PERCENT } = window.Biotest;

  const searchInput = document.getElementById('search-input');
  const categorySelect = document.getElementById('category-select');
  const clearFiltersBtn = document.getElementById('clear-filters');
  const listEl = document.getElementById('catalog-list');
  const resultsMeta = document.getElementById('results-meta');

  const calcItemsEl = document.getElementById('calc-items');
  const calcCountEl = document.getElementById('calc-count');
  const calcSubtotalEl = document.getElementById('calc-subtotal');
  const calcDiscountRow = document.getElementById('calc-discount-row');
  const calcDiscountPercentEl = document.getElementById('calc-discount-percent');
  const calcDiscountAmountEl = document.getElementById('calc-discount-amount');
  const calcTotalEl = document.getElementById('calc-total');
  const calcTimeEl = document.getElementById('calc-time');
  const discountInput = document.getElementById('discount-input');
  const applyCodeBtn = document.getElementById('apply-code');
  const calcCodeMsg = document.getElementById('calc-code-msg');

  const calcPanel = document.getElementById('calc-panel');
  const calcCloseBtn = document.getElementById('calc-close');
  const mobileBar = document.getElementById('mobile-calc-bar');
  const mobileSummary = document.getElementById('mobile-calc-summary');
  const mobileOpenBtn = document.getElementById('mobile-calc-open');

  const detailBackdrop = document.getElementById('detail-backdrop');
  const detailDrawer = document.getElementById('detail-drawer');
  const detailDrawerBody = document.getElementById('detail-drawer-body');
  const detailDrawerFooter = document.getElementById('detail-drawer-footer');
  const detailDrawerClose = document.getElementById('detail-drawer-close');

  let allTests = [];
  let descriptions = {};
  let selected = new Map(); // id -> test
  let appliedDiscount = false;

  function renderCategoryOptions(categories) {
    for (const cat of categories) {
      const opt = document.createElement('option');
      opt.value = cat;
      opt.textContent = cat;
      categorySelect.appendChild(opt);
    }
  }

  function matchesFilters(test, term, category) {
    if (category && test.category !== category) return false;
    if (term && !test.name.toLowerCase().includes(term)) return false;
    return true;
  }

  function renderList() {
    const term = searchInput.value.trim().toLowerCase();
    const category = categorySelect.value;
    const filtered = allTests.filter((t) => matchesFilters(t, term, category));

    resultsMeta.textContent = `${filtered.length} od ${allTests.length} analiza`;

    if (filtered.length === 0) {
      listEl.innerHTML = `<div class="empty-state">
        <p>Nema analiza koje odgovaraju pretrazi. Pokušajte drugi naziv ili poništite filtere.</p>
      </div>`;
      return;
    }

    // Grupiši po kategoriji, u redosledu kako se prvi put pojave.
    const byCategory = new Map();
    for (const test of filtered) {
      if (!byCategory.has(test.category)) byCategory.set(test.category, []);
      byCategory.get(test.category).push(test);
    }

    const html = [];
    for (const [category, tests] of byCategory) {
      html.push(`<div class="category-block">
        <div class="category-title">${category} <span class="category-count">${tests.length}</span></div>
        <div class="test-list">
          ${tests.map(rowHtml).join('')}
        </div>
      </div>`);
    }
    listEl.innerHTML = html.join('');

    listEl.querySelectorAll('input[type="checkbox"][data-id]').forEach((cb) => {
      cb.addEventListener('change', onCheckboxChange);
    });
    listEl.querySelectorAll('[data-readmore]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const test = allTests.find((t) => t.id === btn.getAttribute('data-readmore'));
        if (test) openDetailDrawer(test);
      });
    });
  }

  function rowHtml(test) {
    const checked = selected.has(test.id) ? 'checked' : '';
    const rowChecked = selected.has(test.id) ? ' checked' : '';
    const instrument = test.instrument ? `<span> · ${test.instrument}</span>` : '';
    const time = test.time || 'po dogovoru';
    const desc = descriptions[test.name];
    const descHtml = desc
      ? `<p class="test-desc">${desc.short}</p><button type="button" class="test-readmore-btn" data-readmore="${test.id}">Pročitaj više →</button>`
      : '';
    return `<label class="test-row${rowChecked}" data-row-id="${test.id}">
      <input type="checkbox" data-id="${test.id}" ${checked}>
      <span class="test-name"><strong>${test.name}</strong><span>${test.category}${instrument}</span>${descHtml}</span>
      <span class="test-meta">
        <span class="test-time">⏱ ${time}</span>
        <span class="test-price">${formatPrice(test.price)}</span>
      </span>
    </label>`;
  }

  function openDetailDrawer(test) {
    const desc = descriptions[test.name];
    if (!desc) return;
    const instrument = test.instrument ? ` · ${test.instrument}` : '';
    detailDrawerBody.innerHTML = `
      <span class="eyebrow">${test.category}</span>
      <h2>${test.name}</h2>
      <div class="test-meta-row">
        <span>⏱ ${test.time || 'po dogovoru'}</span>
        <span>${instrument.replace(' · ', '')}</span>
      </div>
      <div class="article-body"><p>${desc.long}</p></div>
    `;
    const isSelected = selected.has(test.id);
    detailDrawerFooter.innerHTML = `
      <span class="test-price">${formatPrice(test.price)}</span>
      <button type="button" class="btn btn-primary" style="flex:1;" id="drawer-toggle-btn">
        ${isSelected ? '✓ U kalkulatoru' : '+ Dodaj u kalkulator'}
      </button>
    `;
    document.getElementById('drawer-toggle-btn').addEventListener('click', () => {
      toggleSelected(test.id);
      openDetailDrawer(test); // re-render footer state
    });
    detailBackdrop.classList.add('open');
    detailDrawer.classList.add('open');
  }

  function closeDetailDrawer() {
    detailBackdrop.classList.remove('open');
    detailDrawer.classList.remove('open');
  }

  function toggleSelected(id) {
    const test = allTests.find((t) => t.id === id);
    if (selected.has(id)) {
      selected.delete(id);
    } else {
      selected.set(id, test);
    }
    const cb = listEl.querySelector(`input[data-id="${id}"]`);
    if (cb) cb.checked = selected.has(id);
    const row = listEl.querySelector(`[data-row-id="${id}"]`);
    if (row) row.classList.toggle('checked', selected.has(id));
    renderCalc();
  }

  function onCheckboxChange(e) {
    const id = e.target.getAttribute('data-id');
    const test = allTests.find((t) => t.id === id);
    if (e.target.checked) {
      selected.set(id, test);
    } else {
      selected.delete(id);
    }
    const row = listEl.querySelector(`[data-row-id="${id}"]`);
    if (row) row.classList.toggle('checked', e.target.checked);
    renderCalc();
  }

  function removeSelected(id) {
    selected.delete(id);
    const cb = listEl.querySelector(`input[data-id="${id}"]`);
    if (cb) cb.checked = false;
    const row = listEl.querySelector(`[data-row-id="${id}"]`);
    if (row) row.classList.remove('checked');
    renderCalc();
  }

  function renderCalc() {
    const items = Array.from(selected.values());

    if (items.length === 0) {
      calcItemsEl.innerHTML = '<p class="calc-empty">Označite analize iz kataloga da biste videli cenu i vreme.</p>';
      calcCountEl.textContent = 'Nije izabrana nijedna analiza.';
    } else {
      calcCountEl.textContent = `Izabrano: ${items.length} ${items.length === 1 ? 'analiza' : 'analize/a'}`;
      calcItemsEl.innerHTML = items.map((t) => `
        <div class="calc-item">
          <span>${t.name}</span>
          <span style="display:flex; align-items:center; gap:8px;">
            ${formatPrice(t.price)}
            <button type="button" aria-label="Ukloni ${t.name}" data-remove="${t.id}">✕</button>
          </span>
        </div>`).join('');
      calcItemsEl.querySelectorAll('[data-remove]').forEach((btn) => {
        btn.addEventListener('click', () => removeSelected(btn.getAttribute('data-remove')));
      });
    }

    const subtotal = items.reduce((sum, t) => sum + t.price, 0);
    calcSubtotalEl.textContent = formatPrice(subtotal);

    let total = subtotal;
    if (appliedDiscount && items.length > 0) {
      const discountAmount = Math.round(subtotal * (DISCOUNT_PERCENT / 100));
      calcDiscountRow.style.display = 'flex';
      calcDiscountPercentEl.textContent = DISCOUNT_PERCENT;
      calcDiscountAmountEl.textContent = '-' + formatPrice(discountAmount);
      total = subtotal - discountAmount;
    } else {
      calcDiscountRow.style.display = 'none';
    }
    calcTotalEl.textContent = formatPrice(total);

    if (items.length === 0) {
      calcTimeEl.textContent = '—';
    } else {
      const longest = items.reduce((a, b) => (b.hours > a.hours ? b : a));
      calcTimeEl.textContent = longest.time || 'po dogovoru';
    }

    mobileSummary.textContent = items.length === 0
      ? '0 analiza izabrano'
      : `${items.length} analiza · ${formatPrice(total)}`;
  }

  function applyDiscountCode() {
    const code = discountInput.value;
    if (!code.trim()) {
      appliedDiscount = false;
      calcCodeMsg.textContent = '';
      renderCalc();
      return;
    }
    if (isValidDiscountCode(code)) {
      appliedDiscount = true;
      calcCodeMsg.textContent = `Kod primenjen — ${DISCOUNT_PERCENT}% popusta.`;
      calcCodeMsg.className = 'calc-code-msg ok';
    } else {
      appliedDiscount = false;
      calcCodeMsg.textContent = 'Kod nije prepoznat. Proverite da li ste ga tačno uneli.';
      calcCodeMsg.className = 'calc-code-msg err';
    }
    renderCalc();
  }

  searchInput.addEventListener('input', renderList);
  categorySelect.addEventListener('change', renderList);
  clearFiltersBtn.addEventListener('click', () => {
    searchInput.value = '';
    categorySelect.value = '';
    renderList();
  });
  applyCodeBtn.addEventListener('click', applyDiscountCode);
  discountInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); applyDiscountCode(); }
  });

  mobileOpenBtn.addEventListener('click', () => {
    calcPanel.classList.add('mobile-open');
  });
  calcCloseBtn.addEventListener('click', () => {
    calcPanel.classList.remove('mobile-open');
  });

  detailDrawerClose.addEventListener('click', closeDetailDrawer);
  detailBackdrop.addEventListener('click', closeDetailDrawer);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeDetailDrawer();
  });

  // Ako korisnik stigne sa ?q=naziv (npr. iz pretrage na Početnoj), popuni pretragu.
  const params = new URLSearchParams(location.search);
  if (params.get('q')) searchInput.value = params.get('q');

  Promise.all([
    window.Biotest.loadCatalog(),
    fetch('data/test-descriptions.json').then((r) => (r.ok ? r.json() : {})).catch(() => ({})),
  ]).then(([{ categories, tests }, descMap]) => {
    allTests = tests;
    descriptions = descMap;
    renderCategoryOptions(categories);
    renderList();
    renderCalc();
  }).catch((err) => {
    listEl.innerHTML = `<div class="empty-state"><p>⚠️ Greška pri učitavanju kataloga: ${err.message}</p></div>`;
  });
})();
