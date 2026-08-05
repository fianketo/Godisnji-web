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

  // Hero video (Početna) — malo sporije od realnog vremena, radi mirnijeg utiska.
  // Neki mobilni browseri (npr. Samsung Internet sa uključenim štednjom
  // podataka) odbiju i autoplay atribut i prvi ručni play() dok se video
  // stvarno ne učita, pa pokušavamo ponovo na SVAKI sledeći dodir/klik —
  // ne samo jednom — dok se puštanje stvarno ne pokrene.
  const heroVideo = document.querySelector('.hero-video-frame video');
  if (heroVideo) {
    heroVideo.muted = true;
    heroVideo.playbackRate = 0.75;
    const tryPlay = () => heroVideo.play().catch(() => {});
    tryPlay();
    heroVideo.addEventListener('loadedmetadata', () => { heroVideo.playbackRate = 0.75; tryPlay(); });
    heroVideo.addEventListener('canplay', tryPlay);

    const resumeOnInteraction = () => { if (heroVideo.paused) tryPlay(); };
    window.addEventListener('touchstart', resumeOnInteraction, { passive: true });
    window.addEventListener('click', resumeOnInteraction);
    heroVideo.addEventListener('touchstart', resumeOnInteraction, { passive: true });
    heroVideo.addEventListener('click', resumeOnInteraction);

    heroVideo.addEventListener('playing', () => {
      window.removeEventListener('touchstart', resumeOnInteraction);
      window.removeEventListener('click', resumeOnInteraction);
      heroVideo.removeEventListener('touchstart', resumeOnInteraction);
      heroVideo.removeEventListener('click', resumeOnInteraction);
      playHint.classList.remove('is-visible');
    });

    // Ako se ni posle par sekundi ne pokrene (npr. štednja podataka na
    // mobilnom blokira i autoplay i tihi play() bez direktnog dodira na
    // sam video), pokaži vidljivo dugme "pusti" umesto da video ostane
    // zamrznut na poster slici bez ikakvog znaka da je uopšte video.
    const playHint = document.getElementById('play-hint');
    if (playHint) {
      setTimeout(() => {
        if (heroVideo.paused) playHint.classList.add('is-visible');
      }, 1500);
      playHint.addEventListener('click', () => {
        tryPlay();
        playHint.classList.remove('is-visible');
      });
    }
  }
});

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => { /* PWA je opciona pogodnost, ne kritična */ });
  });
}
