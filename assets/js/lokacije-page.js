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
  const map = L.map('map');
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> saradnici',
    maxZoom: 19,
  }).addTo(map);

  function cacheKey(loc) { return `biotest_geocode_${loc.id}`; }

  function geocode(loc) {
    const query = `${loc.address}, Srbija`;
    return fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`)
      .then((res) => (res.ok ? res.json() : []))
      .then((results) => (results && results[0] ? [parseFloat(results[0].lat), parseFloat(results[0].lon)] : null))
      .catch(() => null);
  }

  function phoneHtml(phones) {
    return phones.map((p) => `<a href="tel:+381${p.replace(/[^0-9]/g, '').replace(/^0/, '')}">${p}</a>`).join(' · ');
  }

  function cardHtml(loc, i) {
    return `<div class="card location-card" id="location-card-${loc.id}" data-loc="${loc.id}">
      <h3 class="mt-0">${loc.name}</h3>
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
      <a href="tel:+381${loc.phones[0].replace(/[^0-9]/g, '').replace(/^0/, '')}" class="btn btn-primary btn-block" style="margin-top:8px;">📞 Pozovi (${loc.city})</a>
    </div>`;
  }

  fetch(LOCATIONS_URL)
    .then((res) => res.json())
    .then(async (locations) => {
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

      const markers = [];
      for (const loc of locations) {
        const cached = localStorage.getItem(cacheKey(loc));
        const startCoords = cached ? JSON.parse(cached) : (CITY_FALLBACK_COORDS[loc.city] || CITY_FALLBACK_COORDS['Novi Sad']);
        const marker = L.marker(startCoords).addTo(map)
          .bindPopup(`<strong>${loc.name}</strong><br>${loc.address}`);
        loc.marker = marker;
        markers.push(marker);

        if (!cached) {
          geocode(loc).then((coords) => {
            if (coords) {
              localStorage.setItem(cacheKey(loc), JSON.stringify(coords));
              marker.setLatLng(coords);
              map.fitBounds(L.featureGroup(markers).getBounds().pad(0.15));
            }
          });
        }
      }

      if (markers.length) {
        map.fitBounds(L.featureGroup(markers).getBounds().pad(0.15));
      } else {
        map.setView(CITY_FALLBACK_COORDS['Novi Sad'], 13);
      }
    })
    .catch(() => {
      listEl.innerHTML = '<p class="empty-state">⚠️ Greška pri učitavanju lokacija.</p>';
      map.setView(CITY_FALLBACK_COORDS['Novi Sad'], 13);
    });
})();
