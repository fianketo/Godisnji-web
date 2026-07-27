// BIOTEST — rotirajuća sekcija zdravstvenih saveta (statični sadržaj).

(function () {
  const slides = document.querySelectorAll('.tip-slide');
  const dotsWrap = document.getElementById('tips-dots');
  const prevBtn = document.getElementById('tips-prev');
  const nextBtn = document.getElementById('tips-next');
  let current = 0;
  let timer = null;

  slides.forEach((_, i) => {
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.setAttribute('aria-label', `Savet ${i + 1}`);
    dot.addEventListener('click', () => show(i, true));
    dotsWrap.appendChild(dot);
  });
  const dots = dotsWrap.querySelectorAll('button');

  function show(index, userInitiated) {
    current = (index + slides.length) % slides.length;
    slides.forEach((s, i) => s.classList.toggle('active', i === current));
    dots.forEach((d, i) => d.classList.toggle('active', i === current));
    if (userInitiated) restartAutoplay();
  }

  function next() { show(current + 1); }
  function prev() { show(current - 1); }

  function restartAutoplay() {
    if (timer) clearInterval(timer);
    timer = setInterval(next, 7000);
  }

  prevBtn.addEventListener('click', () => show(current - 1, true));
  nextBtn.addEventListener('click', () => show(current + 1, true));

  show(0);
  restartAutoplay();
})();
