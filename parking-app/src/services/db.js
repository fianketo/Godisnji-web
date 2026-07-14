import { Platform } from "react-native";

let dbPromise = null;

function getDb() {
  if (!dbPromise) {
    // eslint-disable-next-line global-require
    const SQLite = require("expo-sqlite");
    dbPromise = SQLite.openDatabaseAsync("parkingns.db").then(async (db) => {
      await db.execAsync(`
        PRAGMA journal_mode = WAL;
        CREATE TABLE IF NOT EXISTS parking_sessions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          latitude REAL NOT NULL,
          longitude REAL NOT NULL,
          street TEXT,
          zone_id TEXT,
          zone_name TEXT,
          price_per_hour REAL,
          sms_number TEXT,
          started_at INTEGER NOT NULL,
          ended_at INTEGER,
          planned_until INTEGER,
          reminder_notification_id TEXT,
          paid INTEGER NOT NULL DEFAULT 0,
          sms_sent_at INTEGER
        );
      `);
      return db;
    });
  }
  return dbPromise;
}

// expo-sqlite has no ready-to-use web target in this managed setup (it needs
// extra wasm/COOP-COEP config), so the browser preview falls back to an
// in-memory store covering the handful of queries historyService.js issues.
// Android/iOS always use the real SQLite database above.
const memoryRows = [];
let nextId = 1;

export async function runAsync(sql, params = []) {
  if (Platform.OS !== "web") {
    const db = await getDb();
    return db.runAsync(sql, params);
  }

  if (sql.startsWith("INSERT INTO parking_sessions")) {
    const [latitude, longitude, street, zoneId, zoneName, pricePerHour, smsNumber, startedAt] = params;
    const row = {
      id: nextId++,
      latitude,
      longitude,
      street,
      zone_id: zoneId,
      zone_name: zoneName,
      price_per_hour: pricePerHour,
      sms_number: smsNumber,
      started_at: startedAt,
      ended_at: null,
      planned_until: null,
      reminder_notification_id: null,
      paid: 0,
      sms_sent_at: null,
    };
    memoryRows.push(row);
    return { lastInsertRowId: row.id };
  }

  if (sql.startsWith("UPDATE parking_sessions SET ended_at")) {
    const [endedAt, id] = params;
    const row = memoryRows.find((r) => r.id === id);
    if (row) row.ended_at = endedAt;
    return {};
  }

  if (sql.startsWith("UPDATE parking_sessions SET planned_until")) {
    const [plannedUntil, reminderId, id] = params;
    const row = memoryRows.find((r) => r.id === id);
    if (row) {
      row.planned_until = plannedUntil;
      row.reminder_notification_id = reminderId;
    }
    return {};
  }

  if (sql.startsWith("UPDATE parking_sessions SET paid")) {
    const [paidAt, id] = params;
    const row = memoryRows.find((r) => r.id === id);
    if (row) {
      row.paid = 1;
      row.sms_sent_at = paidAt;
    }
    return {};
  }

  return {};
}

export async function getAllAsync(sql, params = []) {
  if (Platform.OS !== "web") {
    const db = await getDb();
    return db.getAllAsync(sql, params);
  }
  const [limit] = params;
  return [...memoryRows]
    .sort((a, b) => b.started_at - a.started_at)
    .slice(0, limit ?? memoryRows.length);
}

export async function getFirstAsync(sql, params = []) {
  if (Platform.OS !== "web") {
    const db = await getDb();
    return db.getFirstAsync(sql, params);
  }

  if (sql.includes("WHERE ended_at IS NULL")) {
    return [...memoryRows].filter((r) => !r.ended_at).sort((a, b) => b.started_at - a.started_at)[0] || null;
  }
  if (sql.includes("WHERE id = ?")) {
    const [id] = params;
    return memoryRows.find((r) => r.id === id) || null;
  }
  return null;
}
