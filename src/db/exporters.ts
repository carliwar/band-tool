import { getDb } from './database';

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function timestamp(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

export function exportSqlite(): void {
  const db = getDb();
  const bytes = db.export();
  const buf = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(buf).set(bytes);
  const blob = new Blob([buf], { type: 'application/octet-stream' });
  download(blob, `band-tool-${timestamp()}.sqlite`);
}

function bytesToBase64(bytes: Uint8Array): string {
  let bin = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    bin += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(bin);
}

function tableRows(name: string): Record<string, unknown>[] {
  const db = getDb();
  const stmt = db.prepare(`SELECT * FROM ${name}`);
  try {
    const out: Record<string, unknown>[] = [];
    while (stmt.step()) {
      out.push(stmt.getAsObject() as Record<string, unknown>);
    }
    return out;
  } finally {
    stmt.free();
  }
}

export function exportJson(): void {
  const songs = tableRows('songs');
  const schedule_progress = tableRows('schedule_progress');
  const phase_notes = tableRows('phase_notes');
  const work_sessions = tableRows('work_sessions');
  const attachmentsRaw = tableRows('attachments');
  const attachments = attachmentsRaw.map((r) => {
    const blob = r.blob as Uint8Array | null;
    return {
      ...r,
      blob: blob ? bytesToBase64(blob) : null,
    };
  });

  const payload = {
    version: 1,
    exported_at: Date.now(),
    songs,
    schedule_progress,
    phase_notes,
    attachments,
    work_sessions,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: 'application/json',
  });
  download(blob, `band-tool-${timestamp()}.json`);
}
