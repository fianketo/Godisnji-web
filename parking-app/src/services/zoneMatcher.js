import zonesData from "../data/parkingZones.json";

function normalize(text) {
  return (text || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(new RegExp("[\\u0300-\\u036f]", "g"), "")
    .replace(/[^a-z0-9\s]/g, "")
    .trim();
}

/**
 * Matches a street name (from reverse geocoding) to a locally defined
 * parking zone. Returns null when the street isn't in any known zone
 * (e.g. outside the mapped area of the MVP data set).
 */
export function matchZone(streetName) {
  if (!streetName) return null;
  const target = normalize(streetName);

  for (const zone of zonesData.zones) {
    const hit = zone.streets.some((street) => {
      const candidate = normalize(street);
      return candidate === target || target.includes(candidate) || candidate.includes(target);
    });
    if (hit) {
      return zone;
    }
  }
  return null;
}

export function getAllZones() {
  return zonesData.zones;
}

export function getCityMeta() {
  return {
    city: zonesData.city,
    currency: zonesData.currency,
    workingHours: zonesData.generalWorkingHours,
  };
}
