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

  // Scroll reveal — svaki element sa klasom .reveal se pojavljuje kad uđe u prikaz.
  const revealEls = document.querySelectorAll('.reveal');
  if (revealEls.length) {
    if ('IntersectionObserver' in window) {
      const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            revealObserver.unobserve(entry.target);
          }
        });
      }, { threshold: 0.2 });
      revealEls.forEach((el) => revealObserver.observe(el));
    } else {
      revealEls.forEach((el) => el.classList.add('is-visible'));
    }
  }

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
  // VAŽNO: heroVideo.paused samo kaže da li je reprodukcija "zatražena", ne da
  // li stvarno teče. Na nekim mobilnim mrežama/telefonima video ostane
  // zaglavljen u baferovanju — .paused je false (play() je "uspeo"), ali se
  // nikad ne pomeri sa prve slike. Zato pratimo da li je 'playing' događaj
  // ikad stvarno opaljen (to je jedini pouzdan znak da frejmovi teku), i dok
  // se to ne desi — ponavljamo pokušaj u petlji i pokazujemo dugme "pusti".
  const heroVideo = document.querySelector('.hero-video-frame video');
  if (heroVideo) {
    heroVideo.muted = true;
    heroVideo.playbackRate = 0.75;
    let hasStartedPlaying = false;
    const tryPlay = () => heroVideo.play().catch(() => {});
    tryPlay();
    heroVideo.addEventListener('loadedmetadata', () => { heroVideo.playbackRate = 0.75; tryPlay(); });
    heroVideo.addEventListener('canplay', tryPlay);

    const resumeOnInteraction = () => { if (!hasStartedPlaying) tryPlay(); };
    window.addEventListener('touchstart', resumeOnInteraction, { passive: true });
    window.addEventListener('click', resumeOnInteraction);
    heroVideo.addEventListener('touchstart', resumeOnInteraction, { passive: true });
    heroVideo.addEventListener('click', resumeOnInteraction);

    const playHint = document.getElementById('play-hint');

    // Dok reprodukcija stvarno ne počne, pokušavamo ponovo na par sekundi —
    // ne samo jednom na učitavanje — za slučaj da je prvi pokušaj naišao na
    // privremeno zaglavljeno baferovanje koje se kasnije samo oporavi. Ako je
    // video.networkState već 2 (aktivno učitava), NE zovemo play() ponovo —
    // na sporijoj vezi bi ponovni pozivi mogli da ometaju baferovanje koje je
    // već u toku, umesto da pomognu.
    const retryTimer = setInterval(() => {
      if (!hasStartedPlaying && heroVideo.networkState !== 2) tryPlay();
    }, 2000);

    heroVideo.addEventListener('playing', () => {
      hasStartedPlaying = true;
      clearInterval(retryTimer);
      window.removeEventListener('touchstart', resumeOnInteraction);
      window.removeEventListener('click', resumeOnInteraction);
      heroVideo.removeEventListener('touchstart', resumeOnInteraction);
      heroVideo.removeEventListener('click', resumeOnInteraction);
      if (playHint) playHint.classList.remove('is-visible');
    });

    // Ako se reprodukcija ni posle par sekundi stvarno ne pokrene, pokaži
    // vidljivo dugme "pusti" umesto da video ostane zamrznut na poster
    // slici bez ikakvog znaka da je uopšte video.
    if (playHint) {
      setTimeout(() => {
        if (!hasStartedPlaying) playHint.classList.add('is-visible');
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
