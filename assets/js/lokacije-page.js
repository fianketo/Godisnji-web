// BIOTEST — mapa svih lokacija (Leaflet + OpenStreetMap, bez API ključa).
// Adrese/telefoni su u data/locations.json. Za svaku lokaciju, pri prvoj
// poseti sajt pokuša da je geokodira preko besplatnog Nominatim servisa
// (klijentski, iz browsera posetioca) i rezultat keš-uje u localStorage.
// Ako geokodiranje ne uspe, marker te lokacije ostaje na proceni centra
// grada u kom se nalazi — adresa u kartici je uvek tačna bez obzira na mapu.

(function () {
  const LOCATIONS_URL = 'data/locations.json';
  const CITY_FALLBACK_COORDS = {
    'Novi Sad': [45.2551, 19.8452],
    'Novi Bečej': [45.6067, 20.1332],
  };

  const listEl = document.getElementById('locations-list');
  const findNearestBtn = document.getElementById('find-nearest-btn');
  const nearestStatus = document.getElementById('nearest-status');

  const map = L.map('map');
  // Svetla, minimalna podloga (CartoDB Positron) — čistije uz zdravstveni brend
  // nego standardna šarena OSM podloga. I dalje besplatno, bez API ključa.
  L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> saradnici &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 19,
  }).addTo(map);

  const pinIcon = L.divIcon({
    className: 'biotest-marker-wrap',
    html: '<div class="biotest-marker-pin"><span>🧪</span></div>',
    iconSize: [34, 44],
    iconAnchor: [17, 42],
    popupAnchor: [0, -38],
  });
  const pinIconNearest = L.divIcon({
    className: 'biotest-marker-wrap',
    html: '<div class="biotest-marker-pin biotest-marker-pin--nearest"><span>📍</span></div>',
    iconSize: [40, 50],
    iconAnchor: [20, 48],
    popupAnchor: [0, -44],
  });

  function cacheKey(loc) { return `biotest_geocode_${loc.id}`; }

  function geocode(loc) {
    const query = `${loc.address}, Srbija`;
    return fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`)
      .then((res) => (res.ok ? res.json() : []))
      .then((results) => (results && results[0] ? [parseFloat(results[0].lat), parseFloat(results[0].lon)] : null))
      .catch(() => null);
  }

  function telHref(rawPhone) {
    return `tel:+381${rawPhone.replace(/[^0-9]/g, '').replace(/^0/, '')}`;
  }

  function phoneHtml(phones) {
    return phones.map((p) => `<a href="${telHref(p)}">${p}</a>`).join(' · ');
  }

  // Radno vreme je slobodan tekst ("Ponedeljak – petak: 07:00 – 20:00\n...");
  // parsira tri očekivane linije (radni dani / subota / nedelja) da bi se
  // moglo odrediti da li je lokacija trenutno otvorena.
  function parseHours(hoursText) {
    const result = { monFri: null, sat: null, sun: null };
    for (const line of hoursText.split('\n')) {
      const m = line.match(/(\d{1,2}):(\d{2})\s*[–-]\s*(\d{1,2}):(\d{2})/);
      const range = m ? [Number(m[1]) * 60 + Number(m[2]), Number(m[3]) * 60 + Number(m[4])] : null;
      if (/ponedeljak/i.test(line)) result.monFri = range;
      else if (/subota/i.test(line)) result.sat = range;
      else if (/nedelja/i.test(line)) result.sun = range;
    }
    return result;
  }

  function isOpenNow(hoursText) {
    const parsed = parseHours(hoursText);
    const now = new Date();
    const day = now.getDay(); // 0 = nedelja ... 6 = subota
    const minutes = now.getHours() * 60 + now.getMinutes();
    const range = day === 0 ? parsed.sun : day === 6 ? parsed.sat : parsed.monFri;
    return !!range && minutes >= range[0] && minutes < range[1];
  }

  function distanceKm(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  function cardHtml(loc) {
    const open = isOpenNow(loc.hours);
    const statusBadge = open
      ? '<span class="badge badge-success">🟢 Otvoreno sada</span>'
      : '<span class="badge badge-accent">Zatvoreno</span>';
    return `<div class="card location-card" id="location-card-${loc.id}" data-loc="${loc.id}">
      <div style="display:flex; align-items:flex-start; justify-content:space-between; gap:10px;">
        <h3 class="mt-0" style="margin-bottom:10px;">${loc.name}</h3>
        <span class="location-status">${statusBadge}</span>
      </div>
      <div class="info-row" style="padding-top:0;">
        <div class="icon-badge">📍</div>
        <div><h4>Adresa</h4><p>${loc.address}</p></div>
      </div>
      <div class="info-row">
        <div class="icon-badge">🕒</div>
        <div><h4>Radno vreme</h4><p>${loc.hours.replace(/\n/g, '<br>')}</p></div>
      </div>
      <div class="info-row">
        <div class="icon-badge">📞</div>
        <div><h4>Telefoni</h4><p>${phoneHtml(loc.phones)}</p></div>
      </div>
      <a href="${telHref(loc.phones[0])}" class="btn btn-primary btn-block" style="margin-top:8px;">📞 Pozovi (${loc.city})</a>
    </div>`;
  }

  function markNearest(locations, nearestLoc) {
    locations.forEach((loc) => {
      const card = document.getElementById(`location-card-${loc.id}`);
      if (card) {
        card.classList.remove('location-card--nearest');
        const oldBadge = card.querySelector('.nearest-badge');
        if (oldBadge) oldBadge.remove();
      }
      if (loc.marker) loc.marker.setIcon(pinIcon);
    });

    nearestLoc.marker.setIcon(pinIconNearest);
    const card = document.getElementById(`location-card-${nearestLoc.id}`);
    if (card) {
      card.classList.add('location-card--nearest');
      const badge = document.createElement('span');
      badge.className = 'badge badge-accent nearest-badge';
      badge.style.marginLeft = '8px';
      badge.textContent = '📍 Najbliža vama';
      card.querySelector('h3').after(badge);
    }
  }

  fetch(LOCATIONS_URL)
    .then((res) => res.json())
    .then((locations) => {
      listEl.innerHTML = locations.map(cardHtml).join('');
      listEl.querySelectorAll('.location-card').forEach((el) => {
        el.addEventListener('click', (e) => {
          if (e.target.closest('a')) return; // ne presretaj klik/dodir na telefon-link
          const loc = locations.find((l) => l.id === el.getAttribute('data-loc'));
          if (loc && loc.marker) {
            map.setView(loc.marker.getLatLng(), 16);
            loc.marker.openPopup();
          }
        });
      });

      // Fokus mape je na Novi Sad (5 od 6 lokacija) — Novi Bečej i dalje ima marker
      // i dostupan je klikom na svoju karticu, ali ne razvlači početni zum.
      const FOCUS_CITY = 'Novi Sad';
      const focusMarkers = [];
      const markers = [];

      for (const loc of locations) {
        const cached = localStorage.getItem(cacheKey(loc));
        const startCoords = cached ? JSON.parse(cached) : (CITY_FALLBACK_COORDS[loc.city] || CITY_FALLBACK_COORDS['Novi Sad']);
        const marker = L.marker(startCoords, { icon: pinIcon }).addTo(map)
          .bindPopup(`<div class="map-popup"><strong>${loc.name}</strong><br>${loc.address}<br><a class="map-popup-call" href="${telHref(loc.phones[0])}">📞 Pozovi</a></div>`);
        loc.marker = marker;
        markers.push(marker);
        if (loc.city === FOCUS_CITY) focusMarkers.push(marker);

        if (!cached) {
          geocode(loc).then((coords) => {
            if (coords) {
              localStorage.setItem(cacheKey(loc), JSON.stringify(coords));
              marker.setLatLng(coords);
              fitToFocusCity();
            }
          });
        }
      }

      function fitToFocusCity() {
        const group = focusMarkers.length ? focusMarkers : markers;
        if (group.length === 1) {
          map.setView(group[0].getLatLng(), 15);
        } else if (group.length > 1) {
          map.fitBounds(L.featureGroup(group).getBounds().pad(0.2));
        } else {
          map.setView(CITY_FALLBACK_COORDS[FOCUS_CITY], 13);
        }
      }

      fitToFocusCity();

      if (findNearestBtn) {
        findNearestBtn.addEventListener('click', () => {
          if (!navigator.geolocation) {
            nearestStatus.textContent = 'Vaš browser ne podržava određivanje lokacije.';
            return;
          }
          nearestStatus.textContent = 'Određivanje vaše lokacije...';
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              const { latitude, longitude } = pos.coords;
              let nearest = null;
              let nearestDist = Infinity;
              locations.forEach((loc) => {
                const { lat, lng } = loc.marker.getLatLng();
                const d = distanceKm(latitude, longitude, lat, lng);
                if (d < nearestDist) { nearestDist = d; nearest = loc; }
              });
              if (nearest) {
                nearestStatus.textContent = `Najbliža vama: ${nearest.name} (~${nearestDist.toFixed(1)} km)`;
                markNearest(locations, nearest);
                map.setView(nearest.marker.getLatLng(), 16);
                nearest.marker.openPopup();
                const card = document.getElementById(`location-card-${nearest.id}`);
                if (card) card.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }
            },
            () => {
              nearestStatus.textContent = 'Nije moguće odrediti vašu lokaciju — proverite dozvole za lokaciju u browseru.';
            }
          );
        });
      }
    })
    .catch(() => {
      listEl.innerHTML = '<p class="empty-state">⚠️ Greška pri učitavanju lokacija.</p>';
      map.setView(CITY_FALLBACK_COORDS['Novi Sad'], 13);
    });
})();
