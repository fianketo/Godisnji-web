// BIOTEST — mapa lokacije (Leaflet + OpenStreetMap, bez API ključa).
// Fallback koordinata je centar Novog Sada; pri prvoj poseti sajt pokuša
// da geokodira tačnu adresu preko besplatnog Nominatim servisa (klijentski,
// iz browsera posetioca) i rezultat keš-uje u localStorage da se ne ponavlja.
// Ako geokodiranje ne uspe (npr. bez interneta), ostaje fallback marker —
// adresa u kartici pored mape je uvek tačna bez obzira na mapu.

(function () {
  const FALLBACK_COORDS = [45.2551, 19.8452]; // centar Novog Sada — zameni tačnim koordinatama po potrebi
  const ADDRESS_QUERY = 'Koste Abraševića 31, Novi Sad, Srbija';
  const CACHE_KEY = 'biotest_geocode_koste_abrasevica_31';

  const popupHtml = '<strong>BIOTEST</strong><br>Koste Abraševića 31, Novi Sad';

  const cached = localStorage.getItem(CACHE_KEY);
  const startCoords = cached ? JSON.parse(cached) : FALLBACK_COORDS;

  const map = L.map('map').setView(startCoords, 16);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> saradnici',
    maxZoom: 19,
  }).addTo(map);

  const marker = L.marker(startCoords).addTo(map).bindPopup(popupHtml).openPopup();

  if (!cached) {
    fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(ADDRESS_QUERY)}`)
      .then((res) => (res.ok ? res.json() : []))
      .then((results) => {
        if (results && results[0]) {
          const coords = [parseFloat(results[0].lat), parseFloat(results[0].lon)];
          localStorage.setItem(CACHE_KEY, JSON.stringify(coords));
          marker.setLatLng(coords);
          map.setView(coords, 16);
        }
      })
      .catch(() => { /* ostaje fallback marker */ });
  }
})();
