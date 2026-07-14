import { runAsync, getAllAsync, getFirstAsync } from "./db";

export async function createSession({
  latitude,
  longitude,
  street,
  zoneId,
  zoneName,
  pricePerHour,
  smsNumber,
  startedAt,
}) {
  const result = await runAsync(
    `INSERT INTO parking_sessions
      (latitude, longitude, street, zone_id, zone_name, price_per_hour, sms_number, started_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [latitude, longitude, street ?? null, zoneId ?? null, zoneName ?? null, pricePerHour ?? null, smsNumber ?? null, startedAt]
  );
  return result.lastInsertRowId;
}

export async function getActiveSession() {
  return getFirstAsync(
    `SELECT * FROM parking_sessions WHERE ended_at IS NULL ORDER BY started_at DESC LIMIT 1`
  );
}

export async function closeSession(id, endedAt) {
  return runAsync(`UPDATE parking_sessions SET ended_at = ? WHERE id = ?`, [endedAt, id]);
}

export async function setPlannedUntil(id, plannedUntil, reminderNotificationId) {
  return runAsync(
    `UPDATE parking_sessions SET planned_until = ?, reminder_notification_id = ? WHERE id = ?`,
    [plannedUntil, reminderNotificationId ?? null, id]
  );
}

export async function markPaid(id, paidAt) {
  return runAsync(`UPDATE parking_sessions SET paid = 1, sms_sent_at = ? WHERE id = ?`, [paidAt, id]);
}

export async function getHistory(limit = 100) {
  return getAllAsync(`SELECT * FROM parking_sessions ORDER BY started_at DESC LIMIT ?`, [limit]);
}

export async function getSessionById(id) {
  return getFirstAsync(`SELECT * FROM parking_sessions WHERE id = ?`, [id]);
}
