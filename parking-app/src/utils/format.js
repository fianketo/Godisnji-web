export function formatTime(timestamp) {
  if (!timestamp) return "—";
  return new Date(timestamp).toLocaleTimeString("sr-RS", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDateTime(timestamp) {
  if (!timestamp) return "—";
  return new Date(timestamp).toLocaleString("sr-RS", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDuration(startedAt, endedAt) {
  const end = endedAt || Date.now();
  const minutes = Math.max(0, Math.round((end - startedAt) / 60000));
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) return `${rest} min`;
  return `${hours}h ${rest}min`;
}
