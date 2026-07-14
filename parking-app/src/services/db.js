import * as SQLite from "expo-sqlite";

let dbPromise = null;

function getDb() {
  if (!dbPromise) {
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

export async function runAsync(sql, params = []) {
  const db = await getDb();
  return db.runAsync(sql, params);
}

export async function getAllAsync(sql, params = []) {
  const db = await getDb();
  return db.getAllAsync(sql, params);
}

export async function getFirstAsync(sql, params = []) {
  const db = await getDb();
  return db.getFirstAsync(sql, params);
}
