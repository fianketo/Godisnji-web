import {
  NOMINATIM_ENDPOINT,
  NOMINATIM_MIN_INTERVAL_MS,
  NOMINATIM_USER_AGENT,
} from "../constants/config";

let lastRequestAt = 0;
let queue = Promise.resolve();

async function throttle() {
  const now = Date.now();
  const wait = Math.max(0, lastRequestAt + NOMINATIM_MIN_INTERVAL_MS - now);
  if (wait > 0) {
    await new Promise((resolve) => setTimeout(resolve, wait));
  }
  lastRequestAt = Date.now();
}

/**
 * Reverse geocodes GPS coordinates into a street/address using the free
 * OpenStreetMap Nominatim API. Requests are serialized and throttled to
 * respect Nominatim's 1 request/second usage policy.
 */
export function reverseGeocode(latitude, longitude) {
  const task = queue.then(async () => {
    await throttle();
    const url = `${NOMINATIM_ENDPOINT}?format=jsonv2&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`;
    const response = await fetch(url, {
      headers: {
        "User-Agent": NOMINATIM_USER_AGENT,
        "Accept-Language": "sr",
      },
    });
    if (!response.ok) {
      throw new Error(`Nominatim greška: ${response.status}`);
    }
    const data = await response.json();
    const address = data.address ?? {};
    const street = address.road || address.pedestrian || address.residential || null;
    return {
      street,
      suburb: address.suburb || address.neighbourhood || null,
      city: address.city || address.town || address.village || null,
      displayName: data.display_name || null,
    };
  });

  queue = task.catch(() => {});
  return task;
}
