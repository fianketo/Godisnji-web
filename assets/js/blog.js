// BIOTEST — deljena logika za blog (učitavanje JSON-a, formatiranje, kartice).

const BLOG_URL = 'data/blog-posts.json';
const MONTHS_SR = ['januar', 'februar', 'mart', 'april', 'maj', 'jun', 'jul', 'avgust', 'septembar', 'oktobar', 'novembar', 'decembar'];

async function loadBlogPosts() {
  const res = await fetch(BLOG_URL);
  if (!res.ok) throw new Error('Ne mogu da učitam blog objave.');
  const posts = await res.json();
  // JSON je već poređan od najnovije ka najstarijoj objavi.
  return posts;
}

function formatBlogDate(isoDate) {
  const [y, m, d] = isoDate.split('-').map(Number);
  return `${d}. ${MONTHS_SR[m - 1]} ${y}.`;
}

function blogCardHtml(post, opts) {
  const options = opts || {};
  const linkBase = options.linkBase || 'clanak.html';
  return `<article class="tip-card">
    <a href="${linkBase}?slug=${encodeURIComponent(post.slug)}" style="display:block;">
      <div class="tip-banner tip-banner--${post.banner}">${post.emoji}</div>
    </a>
    <div class="tip-card-body">
      <span class="eyebrow">${post.category}</span>
      <h3><a href="${linkBase}?slug=${encodeURIComponent(post.slug)}" style="color:inherit;">${post.title}</a></h3>
      <p class="field-hint" style="margin:-4px 0 8px;">${formatBlogDate(post.date)}</p>
      <p>${post.excerpt}</p>
      <a class="tip-read-more" href="${linkBase}?slug=${encodeURIComponent(post.slug)}">Pročitaj više <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M13 6l6 6-6 6"/></svg></a>
    </div>
  </article>`;
}

window.Biotest = window.Biotest || {};
window.Biotest.loadBlogPosts = loadBlogPosts;
window.Biotest.formatBlogDate = formatBlogDate;
window.Biotest.blogCardHtml = blogCardHtml;
