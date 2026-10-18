import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Data directory
const dataDir = path.resolve(__dirname, '../../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'tripwise.db');
export const db = new DatabaseSync(dbPath);

// Initialize tables
export function initDatabase() {
  // WAL mode for high concurrency and performance
  db.exec(`PRAGMA journal_mode = WAL;`);

  // Itinerary table
  db.exec(`
    CREATE TABLE IF NOT EXISTS itinerary (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      place_id TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      location TEXT NOT NULL,
      category TEXT NOT NULL,
      image_url TEXT NOT NULL,
      description TEXT,
      lat REAL,
      lng REAL,
      notes TEXT DEFAULT '',
      visit_date TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_itinerary_place_id ON itinerary (place_id);
    CREATE INDEX IF NOT EXISTS idx_itinerary_created ON itinerary (created_at DESC);
  `);

  // Cache table for external API results
  db.exec(`
    CREATE TABLE IF NOT EXISTS api_cache (
      cache_key TEXT PRIMARY KEY,
      data TEXT NOT NULL,
      expires_at INTEGER NOT NULL
    );
  `);

  console.log(`[TripWise DB] SQLite initialized at: ${dbPath}`);
}
