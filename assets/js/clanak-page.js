// BIOTEST — stranica pojedinačnog blog članka (učitava data/blog-posts.json,
// pronalazi post po ?slug= iz URL-a i renderuje ga).

(function () {
  const { loadBlogPosts, formatBlogDate, blogCardHtml, blogBannerHtml } = window.Biotest;
  const container = document.getElementById('article-content');
  const relatedGrid = document.getElementById('related-grid');
  const relatedSection = document.getElementById('related-section');

  const slug = new URLSearchParams(location.search).get('slug');

  function renderNotFound() {
    container.innerHTML = `<div class="empty-state">
      <p>Ova objava ne postoji ili je uklonjena.</p>
      <a href="blog.html" class="btn btn-primary" style="margin-top:12px;">Nazad na blog</a>
    </div>`;
  }

  function renderArticle(post) {
    document.title = `${post.title} — BIOTEST blog`;

    const inlineByParagraph = {};
    (post.inlineImages || []).forEach((img) => {
      inlineByParagraph[img.afterParagraph] = img;
    });

    const bodyHtml = post.body
      .map((p, i) => {
        const img = inlineByParagraph[i];
        const imgHtml = img
          ? `<figure class="article-inline-image"><img src="${img.src}" alt="${img.alt || ''}" loading="lazy">${img.caption ? `<figcaption>${img.caption}</figcaption>` : ''}</figure>`
          : '';
        return `<p>${p}</p>${imgHtml}`;
      })
      .join('');

    container.innerHTML = `
      ${blogBannerHtml(post, 'tip-banner--article')}
      <div style="margin-top: 24px;">
        <span class="eyebrow">${post.category}</span>
        <h1 style="margin-top:10px;">${post.title}</h1>
        <p class="field-hint" style="margin-bottom: 24px;">${formatBlogDate(post.date)}</p>
        <div class="article-body">${bodyHtml}</div>

        <div class="promo-banner" style="margin: 32px 0;">
          <div>
            <h3>Zanima vas ova analiza?</h3>
            <p>Pogledajte cenu i vreme čekanja u katalogu i dodajte je u kalkulator.</p>
          </div>
          <a href="katalog.html?q=${encodeURIComponent(post.catalogQuery)}" class="btn btn-accent">Pronađi u katalogu →</a>
        </div>

        <p class="field-hint">Tekst je pripremljen na osnovu opštih preporuka: ${post.sourceLabel ? `<a href="${post.sourceUrl}" target="_blank" rel="noopener">${post.sourceLabel}</a>` : ''}. Ovaj tekst je informativnog karaktera i ne zamenjuje konsultaciju sa lekarom.</p>
      </div>
    `;
  }

  function renderRelated(posts, current) {
    const others = posts.filter((p) => p.slug !== current.slug).slice(0, 3);
    if (others.length === 0) { relatedSection.style.display = 'none'; return; }
    relatedGrid.innerHTML = others.map((p) => blogCardHtml(p)).join('');
  }

  loadBlogPosts().then((posts) => {
    const post = posts.find((p) => p.slug === slug);
    if (!post) { renderNotFound(); relatedSection.style.display = 'none'; return; }
    renderArticle(post);
    renderRelated(posts, post);
  }).catch((err) => {
    container.innerHTML = `<div class="empty-state"><p>${window.Biotest.icon('alert-triangle')} Greška pri učitavanju: ${err.message}</p></div>`;
    relatedSection.style.display = 'none';
  });
})();
