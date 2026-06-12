import initSqlJs, { type Database, type SqlJsStatic } from 'sql.js';
import sqlWasmUrl from 'sql.js/dist/sql-wasm.wasm?url';
import { get, set } from 'idb-keyval';

const DB_KEY = 'band-tool-db-v1';

let SQL: SqlJsStatic | null = null;
let db: Database | null = null;
let flushTimer: number | null = null;
const listeners = new Set<() => void>();

const SCHEMA = `
CREATE TABLE IF NOT EXISTS songs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  bpm INTEGER,
  norte TEXT,
  ref_instrumental TEXT,
  ref_vocal TEXT,
  concept_word TEXT,
  concept_phrase TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS schedule_progress (
  song_id INTEGER NOT NULL,
  phase_id TEXT NOT NULL,
  completed INTEGER NOT NULL DEFAULT 0,
  completed_at INTEGER,
  PRIMARY KEY (song_id, phase_id),
  FOREIGN KEY (song_id) REFERENCES songs(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS phase_notes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  song_id INTEGER NOT NULL,
  phase_id TEXT NOT NULL,
  text TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (song_id) REFERENCES songs(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_phase_notes_song_phase ON phase_notes(song_id, phase_id);

CREATE TABLE IF NOT EXISTS attachments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  song_id INTEGER NOT NULL,
  kind TEXT NOT NULL CHECK(kind IN ('link','file')),
  label TEXT NOT NULL,
  url TEXT,
  mime TEXT,
  blob BLOB,
  size INTEGER,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (song_id) REFERENCES songs(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS work_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  song_id INTEGER NOT NULL,
  started_at INTEGER NOT NULL,
  ended_at INTEGER,
  FOREIGN KEY (song_id) REFERENCES songs(id) ON DELETE CASCADE
);
`;

export async function initDb(): Promise<Database> {
  if (db) return db;

  SQL = await initSqlJs({
    locateFile: () => sqlWasmUrl,
  });

  const existing = (await get(DB_KEY)) as Uint8Array | undefined;
  db = existing ? new SQL.Database(existing) : new SQL.Database();
  db.exec('PRAGMA foreign_keys = ON;');
  db.exec(SCHEMA);
  return db;
}

export function getDb(): Database {
  if (!db) throw new Error('DB not initialized. Call initDb() first.');
  return db;
}

export async function flushNow(): Promise<void> {
  if (!db) return;
  const data = db.export();
  await set(DB_KEY, data);
}

export function scheduleFlush(): void {
  if (flushTimer != null) {
    clearTimeout(flushTimer);
  }
  flushTimer = window.setTimeout(() => {
    flushTimer = null;
    void flushNow();
  }, 300);
}

export function notifyChange(): void {
  scheduleFlush();
  listeners.forEach((fn) => fn());
}

export function subscribe(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function getDbBlob(): Uint8Array {
  if (!db) throw new Error('DB not initialized');
  return db.export();
}

export async function replaceDbWithBytes(bytes: Uint8Array): Promise<void> {
  if (!SQL) throw new Error('SQL not initialized');
  if (db) db.close();
  db = new SQL.Database(bytes);
  db.exec('PRAGMA foreign_keys = ON;');
  db.exec(SCHEMA);
  await flushNow();
  listeners.forEach((fn) => fn());
}
