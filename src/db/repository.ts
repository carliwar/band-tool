import { getDb, notifyChange } from './database';
import type {
  Attachment,
  AttachmentKind,
  PhaseNote,
  ScheduleProgress,
  Song,
  WorkSession,
} from '../types/models';

function now(): number {
  return Date.now();
}

function rowToSong(row: Record<string, unknown>): Song {
  return {
    id: row.id as number,
    name: row.name as string,
    bpm: (row.bpm as number | null) ?? null,
    norte: (row.norte as string | null) ?? null,
    ref_instrumental: (row.ref_instrumental as string | null) ?? null,
    ref_vocal: (row.ref_vocal as string | null) ?? null,
    concept_word: (row.concept_word as string | null) ?? null,
    concept_phrase: (row.concept_phrase as string | null) ?? null,
    created_at: row.created_at as number,
    updated_at: row.updated_at as number,
  };
}

function selectAll<T>(sql: string, params: unknown[] = [], map: (row: Record<string, unknown>) => T): T[] {
  const db = getDb();
  const stmt = db.prepare(sql);
  try {
    stmt.bind(params as never);
    const out: T[] = [];
    while (stmt.step()) {
      out.push(map(stmt.getAsObject() as Record<string, unknown>));
    }
    return out;
  } finally {
    stmt.free();
  }
}

function selectOne<T>(sql: string, params: unknown[], map: (row: Record<string, unknown>) => T): T | null {
  const all = selectAll(sql, params, map);
  return all[0] ?? null;
}

// ---------- songs ----------
export function listSongs(): Song[] {
  return selectAll('SELECT * FROM songs ORDER BY updated_at DESC', [], rowToSong);
}

export function getSong(id: number): Song | null {
  return selectOne('SELECT * FROM songs WHERE id = ?', [id], rowToSong);
}

export function getSongByName(name: string): Song | null {
  return selectOne('SELECT * FROM songs WHERE name = ?', [name], rowToSong);
}

export function createSong(input: { name: string; bpm?: number | null; norte?: string | null }): Song {
  const db = getDb();
  const t = now();
  db.run(
    'INSERT INTO songs (name, bpm, norte, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
    [input.name, input.bpm ?? null, input.norte ?? null, t, t],
  );
  const row = selectOne('SELECT * FROM songs WHERE id = last_insert_rowid()', [], rowToSong);
  if (!row) throw new Error('Failed to create song');
  notifyChange();
  return row;
}

/** Returns existing song if name matches, otherwise creates a new one. */
export function upsertSongByName(input: {
  name: string;
  bpm?: number | null;
  norte?: string | null;
}): Song {
  const existing = getSongByName(input.name);
  if (existing) return existing;
  return createSong(input);
}

export function updateSong(
  id: number,
  patch: Partial<
    Pick<
      Song,
      | 'name'
      | 'bpm'
      | 'norte'
      | 'ref_instrumental'
      | 'ref_vocal'
      | 'concept_word'
      | 'concept_phrase'
    >
  >,
): void {
  const db = getDb();
  const fields: string[] = [];
  const values: unknown[] = [];
  for (const [k, v] of Object.entries(patch)) {
    fields.push(`${k} = ?`);
    values.push(v ?? null);
  }
  if (fields.length === 0) return;
  fields.push('updated_at = ?');
  values.push(now());
  values.push(id);
  db.run(`UPDATE songs SET ${fields.join(', ')} WHERE id = ?`, values as never);
  notifyChange();
}

// ---------- schedule progress ----------
export function listProgress(songId: number): ScheduleProgress[] {
  return selectAll(
    'SELECT * FROM schedule_progress WHERE song_id = ?',
    [songId],
    (row) => ({
      song_id: row.song_id as number,
      phase_id: row.phase_id as string,
      completed: (row.completed as number) === 1,
      completed_at: (row.completed_at as number | null) ?? null,
    }),
  );
}

export function setSchedulePhase(songId: number, phaseId: string, completed: boolean): void {
  const db = getDb();
  const t = completed ? now() : null;
  db.run(
    `INSERT INTO schedule_progress (song_id, phase_id, completed, completed_at)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(song_id, phase_id) DO UPDATE SET completed = excluded.completed, completed_at = excluded.completed_at`,
    [songId, phaseId, completed ? 1 : 0, t],
  );
  // Touch song updated_at
  db.run('UPDATE songs SET updated_at = ? WHERE id = ?', [now(), songId]);
  notifyChange();
}

// ---------- phase notes ----------
export function listNotes(songId: number, phaseId: string): PhaseNote[] {
  return selectAll(
    'SELECT * FROM phase_notes WHERE song_id = ? AND phase_id = ? ORDER BY created_at DESC',
    [songId, phaseId],
    (row) => ({
      id: row.id as number,
      song_id: row.song_id as number,
      phase_id: row.phase_id as string,
      text: row.text as string,
      created_at: row.created_at as number,
    }),
  );
}

export function addNote(songId: number, phaseId: string, text: string): void {
  const db = getDb();
  db.run('INSERT INTO phase_notes (song_id, phase_id, text, created_at) VALUES (?, ?, ?, ?)', [
    songId,
    phaseId,
    text,
    now(),
  ]);
  db.run('UPDATE songs SET updated_at = ? WHERE id = ?', [now(), songId]);
  notifyChange();
}

export function deleteNote(noteId: number, songId: number): void {
  const db = getDb();
  db.run('DELETE FROM phase_notes WHERE id = ?', [noteId]);
  db.run('UPDATE songs SET updated_at = ? WHERE id = ?', [now(), songId]);
  notifyChange();
}

// ---------- attachments ----------
function rowToAttachment(row: Record<string, unknown>): Attachment {
  return {
    id: row.id as number,
    song_id: row.song_id as number,
    kind: row.kind as AttachmentKind,
    label: row.label as string,
    url: (row.url as string | null) ?? null,
    mime: (row.mime as string | null) ?? null,
    size: (row.size as number | null) ?? null,
    created_at: row.created_at as number,
  };
}

export function listAttachments(songId: number): Attachment[] {
  return selectAll(
    'SELECT id, song_id, kind, label, url, mime, size, created_at FROM attachments WHERE song_id = ? ORDER BY created_at DESC',
    [songId],
    rowToAttachment,
  );
}

export function addLink(songId: number, label: string, url: string): void {
  const db = getDb();
  db.run(
    'INSERT INTO attachments (song_id, kind, label, url, created_at) VALUES (?, ?, ?, ?, ?)',
    [songId, 'link', label, url, now()],
  );
  db.run('UPDATE songs SET updated_at = ? WHERE id = ?', [now(), songId]);
  notifyChange();
}

export async function addFile(songId: number, label: string, file: File): Promise<void> {
  const db = getDb();
  const buf = new Uint8Array(await file.arrayBuffer());
  db.run(
    'INSERT INTO attachments (song_id, kind, label, mime, blob, size, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [songId, 'file', label, file.type || null, buf, file.size, now()],
  );
  db.run('UPDATE songs SET updated_at = ? WHERE id = ?', [now(), songId]);
  notifyChange();
}

export function deleteAttachment(id: number, songId: number): void {
  const db = getDb();
  db.run('DELETE FROM attachments WHERE id = ?', [id]);
  db.run('UPDATE songs SET updated_at = ? WHERE id = ?', [now(), songId]);
  notifyChange();
}

export function getAttachmentBlob(id: number): { blob: Uint8Array; mime: string | null; label: string } | null {
  const db = getDb();
  const stmt = db.prepare('SELECT label, mime, blob FROM attachments WHERE id = ? AND kind = ?');
  try {
    stmt.bind([id, 'file']);
    if (!stmt.step()) return null;
    const row = stmt.getAsObject() as Record<string, unknown>;
    return {
      label: row.label as string,
      mime: (row.mime as string | null) ?? null,
      blob: row.blob as Uint8Array,
    };
  } finally {
    stmt.free();
  }
}

// ---------- work sessions ----------
function rowToSession(row: Record<string, unknown>): WorkSession {
  return {
    id: row.id as number,
    song_id: row.song_id as number,
    started_at: row.started_at as number,
    ended_at: (row.ended_at as number | null) ?? null,
  };
}

export function listSessions(songId: number): WorkSession[] {
  return selectAll(
    'SELECT * FROM work_sessions WHERE song_id = ? ORDER BY started_at DESC',
    [songId],
    rowToSession,
  );
}

export function getActiveSession(songId: number): WorkSession | null {
  return selectOne(
    'SELECT * FROM work_sessions WHERE song_id = ? AND ended_at IS NULL ORDER BY started_at DESC LIMIT 1',
    [songId],
    rowToSession,
  );
}

export function startSession(songId: number): WorkSession {
  const db = getDb();
  // close any stray active session first (safety)
  const active = getActiveSession(songId);
  if (active) {
    db.run('UPDATE work_sessions SET ended_at = ? WHERE id = ?', [now(), active.id]);
  }
  db.run('INSERT INTO work_sessions (song_id, started_at) VALUES (?, ?)', [songId, now()]);
  db.run('UPDATE songs SET updated_at = ? WHERE id = ?', [now(), songId]);
  const row = selectOne(
    'SELECT * FROM work_sessions WHERE id = last_insert_rowid()',
    [],
    rowToSession,
  );
  if (!row) throw new Error('Failed to start session');
  notifyChange();
  return row;
}

export function endSession(songId: number): void {
  const db = getDb();
  const active = getActiveSession(songId);
  if (!active) return;
  db.run('UPDATE work_sessions SET ended_at = ? WHERE id = ?', [now(), active.id]);
  db.run('UPDATE songs SET updated_at = ? WHERE id = ?', [now(), songId]);
  notifyChange();
}

/** Returns total elapsed ms across all sessions (closed + active up to now). */
export function getTotalElapsed(songId: number, asOf: number = Date.now()): number {
  const sessions = listSessions(songId);
  let total = 0;
  for (const s of sessions) {
    const end = s.ended_at ?? asOf;
    total += Math.max(0, end - s.started_at);
  }
  return total;
}

/** Deletes all data (songs + everything via CASCADE). */
export function deleteAllData(): void {
  getDb().run('DELETE FROM songs');
  notifyChange();
}
