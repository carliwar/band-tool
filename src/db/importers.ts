import { getDb, replaceDbWithBytes, notifyChange } from './database';

function base64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export async function importSqlite(file: File): Promise<void> {
  const buf = new Uint8Array(await file.arrayBuffer());
  await replaceDbWithBytes(buf);
}

interface JsonPayload {
  version: number;
  songs: Record<string, unknown>[];
  schedule_progress: Record<string, unknown>[];
  phase_notes: Record<string, unknown>[];
  attachments: Record<string, unknown>[];
  work_sessions: Record<string, unknown>[];
}

export async function importJson(file: File): Promise<void> {
  const text = await file.text();
  const data = JSON.parse(text) as JsonPayload;
  if (!data || typeof data !== 'object') throw new Error('Invalid JSON');

  const db = getDb();
  db.exec('BEGIN TRANSACTION;');
  try {
    db.exec(`
      DELETE FROM attachments;
      DELETE FROM phase_notes;
      DELETE FROM schedule_progress;
      DELETE FROM work_sessions;
      DELETE FROM songs;
    `);

    for (const s of data.songs ?? []) {
      db.run(
        `INSERT INTO songs (id, name, bpm, norte, ref_instrumental, ref_vocal, concept_word, concept_phrase, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          s.id as number,
          s.name as string,
          (s.bpm as number | null) ?? null,
          (s.norte as string | null) ?? null,
          (s.ref_instrumental as string | null) ?? null,
          (s.ref_vocal as string | null) ?? null,
          (s.concept_word as string | null) ?? null,
          (s.concept_phrase as string | null) ?? null,
          s.created_at as number,
          s.updated_at as number,
        ],
      );
    }

    for (const p of data.schedule_progress ?? []) {
      db.run(
        `INSERT INTO schedule_progress (song_id, phase_id, completed, completed_at) VALUES (?, ?, ?, ?)`,
        [
          p.song_id as number,
          p.phase_id as string,
          (p.completed as number) ?? 0,
          (p.completed_at as number | null) ?? null,
        ],
      );
    }

    for (const n of data.phase_notes ?? []) {
      db.run(
        `INSERT INTO phase_notes (id, song_id, phase_id, text, created_at) VALUES (?, ?, ?, ?, ?)`,
        [
          n.id as number,
          n.song_id as number,
          n.phase_id as string,
          n.text as string,
          n.created_at as number,
        ],
      );
    }

    for (const a of data.attachments ?? []) {
      const blobB64 = a.blob as string | null;
      const blob = blobB64 ? base64ToBytes(blobB64) : null;
      db.run(
        `INSERT INTO attachments (id, song_id, kind, label, url, mime, blob, size, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          a.id as number,
          a.song_id as number,
          a.kind as string,
          a.label as string,
          (a.url as string | null) ?? null,
          (a.mime as string | null) ?? null,
          blob,
          (a.size as number | null) ?? null,
          a.created_at as number,
        ],
      );
    }

    for (const w of data.work_sessions ?? []) {
      db.run(
        `INSERT INTO work_sessions (id, song_id, started_at, ended_at) VALUES (?, ?, ?, ?)`,
        [
          w.id as number,
          w.song_id as number,
          w.started_at as number,
          (w.ended_at as number | null) ?? null,
        ],
      );
    }

    db.exec('COMMIT;');
    notifyChange();
  } catch (err) {
    db.exec('ROLLBACK;');
    throw err;
  }
}
