// BIOTEST — mini-mapa na početnoj ("6 lokacija") sa linijama od centralne
// lokacije (Koste Abraševića 31) do ostalih laboratorija u Novom Sadu.
// Deli keš geokodiranja (localStorage) sa lokacije.html, pa ako je posetilac
// već bio na toj stranici, mapa se ovde odmah prikazuje na tačnim pozicijama.

(function () {
  const mapEl = document.getElementById('mini-map');
  if (!mapEl) return;

  const LOCATIONS_URL = 'data/locations.json';
  const HUB_ID = 'koste-abrasevica';
  const NOVI_SAD_FALLBACK = [45.2551, 19.8452];

  function cacheKey(id) { return `biotest_geocode_${id}`; }

  function geocode(loc) {
    const query = `${loc.address}, Srbija`;
    return fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`)
      .then((res) => (res.ok ? res.json() : []))
      .then((results) => (results && results[0] ? [parseFloat(results[0].lat), parseFloat(results[0].lon)] : null))
      .catch(() => null);
  }

  const map = L.map('mini-map', {
    zoomControl: false,
    dragging: false,
    scrollWheelZoom: false,
    doubleClickZoom: false,
    boxZoom: false,
    keyboard: false,
    touchZoom: false,
    tap: false,
    attributionControl: false,
  });
  L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    subdomains: 'abcd',
    maxZoom: 19,
  }).addTo(map);
  map.setView(NOVI_SAD_FALLBACK, 12);

  const hubIcon = L.divIcon({
    className: 'biotest-marker-wrap',
    html: `<div class="biotest-marker-pin biotest-marker-pin--nearest">${window.Biotest.icon('flask')}</div>`,
    iconSize: [40, 50],
    iconAnchor: [20, 48],
  });
  const spokeIcon = L.divIcon({
    className: 'biotest-marker-wrap',
    html: `<div class="biotest-marker-pin">${window.Biotest.icon('flask')}</div>`,
    iconSize: [30, 38],
    iconAnchor: [15, 36],
  });

  fetch(LOCATIONS_URL)
    .then((res) => res.json())
    .then((locations) => {
      const novisad = locations.filter((loc) => loc.city === 'Novi Sad');
      const hub = novisad.find((loc) => loc.id === HUB_ID);
      const spokes = novisad.filter((loc) => loc.id !== HUB_ID);

      const markers = [];
      const lines = [];

      function placeMarker(loc, icon) {
        const cached = localStorage.getItem(cacheKey(loc.id));
        const startCoords = cached ? JSON.parse(cached) : NOVI_SAD_FALLBACK;
        const marker = L.marker(startCoords, { icon, interactive: false }).addTo(map);
        markers.push(marker);
        loc.marker = marker;
        if (!cached) {
          geocode(loc).then((coords) => {
            if (coords) {
              localStorage.setItem(cacheKey(loc.id), JSON.stringify(coords));
              marker.setLatLng(coords);
              redrawLines();
              fitAll();
            }
          });
        }
      }

      function redrawLines() {
        lines.forEach((line) => map.removeLayer(line));
        lines.length = 0;
        if (!hub || !hub.marker) return;
        spokes.forEach((loc) => {
          if (!loc.marker) return;
          const line = L.polyline([hub.marker.getLatLng(), loc.marker.getLatLng()], {
            color: '#0e7c86',
            weight: 2,
            opacity: 0.55,
            dashArray: '1 7',
            lineCap: 'round',
            interactive: false,
          }).addTo(map);
          line.bringToBack();
          lines.push(line);
        });
      }

      function fitAll() {
        if (markers.length) {
          map.fitBounds(L.featureGroup(markers).getBounds().pad(0.25));
        }
      }

      if (hub) placeMarker(hub, hubIcon);
      spokes.forEach((loc) => placeMarker(loc, spokeIcon));

      redrawLines();
      fitAll();
    })
    .catch(() => {
      map.setView(NOVI_SAD_FALLBACK, 12);
    });
})();
