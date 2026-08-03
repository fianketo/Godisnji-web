// BIOTEST — zajednička ponašanja za sve stranice (nav, footer godina)

document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.querySelector('.nav-toggle');
  const links = document.querySelector('.nav-links');

  if (toggle && links) {
    toggle.addEventListener('click', () => {
      const isOpen = links.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(isOpen));
    });

    links.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        links.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  document.querySelectorAll('[data-year]').forEach((el) => {
    el.textContent = String(new Date().getFullYear());
  });

  const header = document.querySelector('.site-header');
  if (header) {
    const updateScrolled = () => header.classList.toggle('is-scrolled', window.scrollY > 8);
    updateScrolled();
    window.addEventListener('scroll', updateScrolled, { passive: true });
  }

  // Klizna "pilula" u navigaciji — prati hover, vraća se na aktivnu stranicu
  if (links) {
    const indicator = document.createElement('span');
    indicator.className = 'nav-indicator';
    links.prepend(indicator);

    const navItems = Array.from(links.querySelectorAll('a'));
    const activeLink = links.querySelector('a.active');

    const moveIndicatorTo = (link) => {
      if (!link) { indicator.classList.remove('is-visible'); return; }
      indicator.style.width = link.offsetWidth + 'px';
      indicator.style.transform = `translateX(${link.offsetLeft}px)`;
      indicator.classList.add('is-visible');
    };

    moveIndicatorTo(activeLink);

    navItems.forEach((link) => {
      link.addEventListener('mouseenter', () => moveIndicatorTo(link));
      link.addEventListener('focus', () => moveIndicatorTo(link));
    });
    links.addEventListener('mouseleave', () => moveIndicatorTo(activeLink));

    window.addEventListener('resize', () => moveIndicatorTo(activeLink));
  }
});

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => { /* PWA je opciona pogodnost, ne kritična */ });
  });
}
