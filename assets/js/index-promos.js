// BIOTEST — teaser aktuelnih akcija na početnoj strani (do 3 kartice).
// Sekcija ostaje sakrivena ako Firebase nije podešen ili nema aktivnih
// akcija — statični promo-banner ispod i dalje radi nezavisno od ovoga.

(function () {
  if (!window.Biotest.firebaseReady) return;

  const sectionEl = document.getElementById('home-promos-section');
  const gridEl = document.getElementById('home-promo-grid');
  if (!sectionEl || !gridEl) return;

  const { formatPromoPrice } = window.Biotest;

  function discountPercent(p) {
    if (!p.oldPrice || p.oldPrice <= p.newPrice) return 0;
    return Math.round((1 - p.newPrice / p.oldPrice) * 100);
  }

  window.Biotest.db.collection('promotions').where('active', '==', true).limit(3).get()
    .then((snap) => {
      const promos = [];
      snap.forEach((doc) => promos.push({ id: doc.id, ...doc.data() }));
      if (promos.length === 0) return;

      gridEl.innerHTML = promos.map((p) => {
        const pct = discountPercent(p);
        return `<a href="popusti.html" class="promo-card">
          <div class="promo-card-media">
            ${p.imageUrl ? `<img src="${p.imageUrl}" alt="${p.name}" loading="lazy">` : ''}
            ${pct > 0 ? `<span class="promo-card-discount">-${pct}%</span>` : ''}
            ${p.imageCredit ? `<span class="promo-card-credit">${p.imageCredit}</span>` : ''}
          </div>
          <div class="promo-card-body">
            <p class="promo-card-name">${p.name}</p>
            <div class="promo-card-prices">
              ${p.oldPrice ? `<span class="promo-card-price-old">${formatPromoPrice(p.oldPrice)}</span>` : ''}
              <span class="promo-card-price-new">${formatPromoPrice(p.newPrice)}</span>
            </div>
          </div>
        </a>`;
      }).join('');
      sectionEl.style.display = 'block';
    })
    .catch(() => { /* tiho — početna ne treba da se sruši ako baza nije dostupna */ });
})();
