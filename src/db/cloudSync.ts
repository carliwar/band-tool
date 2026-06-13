import { getDbBlob, replaceDbWithBytes, notifyChange, flushNow, subscribe, countSongsInBytes } from './database';
import { countSongs } from './repository';

const GITHUB_API = 'https://api.github.com';
const GIST_FILENAME = 'band-tool-db.sqlite.b64';
const META_FILENAME = 'band-tool-meta.json';
const GIST_DESCRIPTION = 'band-tool database backup';
const LS_DEVICE_ID_KEY = 'band-tool-device-id';

export const LS_GIST_ID_KEY = 'band-tool-gist-id';
export const LS_LAST_SYNC_KEY = 'band-tool-gist-last-sync';
const LS_LAST_REMOTE_UPDATED = 'band-tool-gist-remote-updated';

export type SyncStatus =
  | { state: 'idle' }
  | { state: 'pushing' }
  | { state: 'pulling' }
  | { state: 'synced'; at: number }
  | { state: 'error'; message: string };

/**
 * PAT bakeado en el build vía VITE_GIST_PAT (GitHub Actions secret).
 * NOTA DE SEGURIDAD: este valor queda visible en el bundle JS estático.
 * El scope del token es solo `gist`, por lo que el riesgo es limitado
 * (peor caso: lectura/escritura del Gist de backup de la banda).
 * Para mayor seguridad, usar un proxy serverless como intermediario.
 */
const BUILD_PAT: string = (import.meta.env.VITE_GIST_PAT as string | undefined) ?? '';

/** True cuando hay un PAT configurado en el build — no se necesita que el usuario lo ingrese. */
export const hasBuildPat: boolean = BUILD_PAT.length > 0;

/** Devuelve el PAT efectivo: build-time si existe, si no el provisto por el usuario. */
export function getEffectivePat(localPat: string): string {
  return BUILD_PAT || localPat;
}

function blobToBase64(bytes: Uint8Array): string {
  let bin = '';
  for (let i = 0; i < bytes.length; i++) {
    bin += String.fromCharCode(bytes[i]);
  }
  return btoa(bin);
}

function base64ToBlob(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function headers(pat: string): Record<string, string> {
  return {
    Authorization: `Bearer ${pat}`,
    'Content-Type': 'application/json',
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  };
}

async function checkResponse(res: Response, context: string): Promise<void> {
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`${context}: ${res.status} ${res.statusText}${body ? ' — ' + body : ''}`);
  }
}

/** Busca un Gist existente con la descripción de band-tool. Devuelve su ID o null. */
async function findExistingGist(pat: string): Promise<string | null> {
  const res = await fetch(`${GITHUB_API}/gists?per_page=100`, { headers: headers(pat) });
  if (!res.ok) return null;
  const gists = (await res.json()) as { id: string; description: string }[];
  return gists.find((g) => g.description === GIST_DESCRIPTION)?.id ?? null;
}

/** Limpia el localStorage de sync (llamar al desconectar). */
export function clearSyncStorage(): void {
  localStorage.removeItem(LS_GIST_ID_KEY);
  localStorage.removeItem(LS_LAST_SYNC_KEY);
  localStorage.removeItem(LS_LAST_REMOTE_UPDATED);
}

function getDeviceId(): string {
  let id = localStorage.getItem(LS_DEVICE_ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(LS_DEVICE_ID_KEY, id);
  }
  return id;
}

export interface GistMeta {
  song_count: number;
  pushed_at: number;
  device_id: string;
  admin_pin_hash: string | null;
}

function buildMeta(songCount: number, existingMeta: GistMeta | null): GistMeta {
  return {
    song_count: songCount,
    pushed_at: Date.now(),
    device_id: getDeviceId(),
    admin_pin_hash: existingMeta?.admin_pin_hash ?? null,
  };
}

async function hashPin(pin: string): Promise<string> {
  const data = new TextEncoder().encode(pin);
  const buf = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

/** Read the metadata file from a Gist response payload. */
function parseMetaFromGist(files: Record<string, { content: string } | undefined>): GistMeta | null {
  const file = files[META_FILENAME];
  if (!file?.content) return null;
  try {
    return JSON.parse(file.content) as GistMeta;
  } catch {
    return null;
  }
}

/** Fetch only the metadata file from the Gist (uses full Gist fetch but only reads meta). */
async function fetchRemoteMeta(pat: string, gistId: string): Promise<GistMeta | null> {
  const res = await fetch(`${GITHUB_API}/gists/${gistId}`, { headers: headers(pat) });
  if (!res.ok) return null;
  const data = (await res.json()) as { files: Record<string, { content: string } | undefined> };
  return parseMetaFromGist(data.files);
}

/** Descarga solo metadatos del Gist para detectar cambios remotos sin transferir el blob. */
async function getGistMeta(pat: string, gistId: string): Promise<{ updated_at: string; meta: GistMeta | null }> {
  const res = await fetch(`${GITHUB_API}/gists/${gistId}`, { headers: headers(pat) });
  await checkResponse(res, 'getGistMeta');
  const data = (await res.json()) as { updated_at: string; files: Record<string, { content: string } | undefined> };
  return { updated_at: data.updated_at, meta: parseMetaFromGist(data.files) };
}

/** Verifica que el PAT sea válido consultando /user. */
export async function validatePat(pat: string): Promise<boolean> {
  const res = await fetch(`${GITHUB_API}/user`, { headers: headers(pat) });
  return res.ok;
}

/**
 * Sube la DB actual al Gist.
 * Si gistId es null, busca un Gist existente por descripción antes de crear uno nuevo.
 * Devuelve el Gist ID.
 */
export async function pushToGist(
  pat: string,
  gistId: string | null,
  existingMeta: GistMeta | null = null,
): Promise<{ id: string; updated_at: string }> {
  const bytes = getDbBlob();
  const content = blobToBase64(bytes);
  const localCount = countSongs();
  const meta = buildMeta(localCount, existingMeta);

  // Auto-discover existing gist if no ID is stored locally
  const resolvedId = gistId ?? (await findExistingGist(pat));

  const body = JSON.stringify({
    description: GIST_DESCRIPTION,
    public: false,
    files: {
      [GIST_FILENAME]: { content },
      [META_FILENAME]: { content: JSON.stringify(meta, null, 2) },
    },
  });

  let res: Response;
  if (resolvedId) {
    res = await fetch(`${GITHUB_API}/gists/${resolvedId}`, {
      method: 'PATCH',
      headers: headers(pat),
      body,
    });
  } else {
    res = await fetch(`${GITHUB_API}/gists`, {
      method: 'POST',
      headers: headers(pat),
      body,
    });
  }

  await checkResponse(res, 'pushToGist');
  const data = (await res.json()) as { id: string; updated_at: string };
  return { id: data.id, updated_at: data.updated_at };
}

/** Descarga la DB desde el Gist y reemplaza la base local. */
export async function pullFromGist(pat: string, gistId: string): Promise<void> {
  const res = await fetch(`${GITHUB_API}/gists/${gistId}`, { headers: headers(pat) });
  await checkResponse(res, 'pullFromGist');

  const data = (await res.json()) as {
    files: Record<string, { content: string } | undefined>;
  };

  const file = data.files[GIST_FILENAME];
  if (!file?.content) {
    throw new Error('El Gist no contiene un backup de band-tool');
  }

  const bytes = base64ToBlob(file.content);
  await replaceDbWithBytes(bytes);
  await flushNow();
  notifyChange();
}

/**
 * Inicia el sync automático bidireccional.
 * - Push: debounced 8s después de cada cambio local.
 * - Pull: cada 30s y al volver al tab, si el Gist fue actualizado remotamente.
 * Devuelve { cleanup, push } para detener el sync o forzar un push manual.
 */
export function startAutoSync(
  pat: string,
  initialGistId: string | null,
  onGistId: (id: string) => void,
  onStatus: (status: SyncStatus) => void,
): { cleanup: () => void; push: () => void; sync: () => void } {
  let gistId = initialGistId;
  let pushing = false;
  let pulling = false;
  let pushTimer: number | null = null;
  let lastPullAt = 0;
  const PULL_COOLDOWN = 12_000;
  let lastKnownRemoteUpdated = localStorage.getItem(LS_LAST_REMOTE_UPDATED) ?? '';

  let cachedRemoteMeta: GistMeta | null = null;

  async function doPush(): Promise<void> {
    if (pushing || pulling) return;

    // --- Guard: prevent pushing empty/reduced DB over a populated remote ---
    const localCount = countSongs();
    if (gistId && localCount === 0) {
      // Local is empty — check if remote has data
      try {
        const remoteMeta = cachedRemoteMeta ?? await fetchRemoteMeta(pat, gistId);
        if (remoteMeta && remoteMeta.song_count > 0) {
          // Remote has data, local is empty → pull instead of push
          await checkAndPull();
          return;
        }
      } catch {
        // Can't verify remote — refuse to push empty DB to be safe
        return;
      }
    }

    pushing = true;
    onStatus({ state: 'pushing' });
    try {
      const result = await pushToGist(pat, gistId, cachedRemoteMeta);
      gistId = result.id;
      onGistId(result.id);
      localStorage.setItem(LS_GIST_ID_KEY, result.id);
      lastKnownRemoteUpdated = result.updated_at;
      localStorage.setItem(LS_LAST_REMOTE_UPDATED, result.updated_at);
      const ts = Date.now();
      localStorage.setItem(LS_LAST_SYNC_KEY, String(ts));
      onStatus({ state: 'synced', at: ts });
    } catch (e) {
      onStatus({ state: 'error', message: e instanceof Error ? e.message : 'Error al sincronizar' });
    } finally {
      pushing = false;
    }
  }

  async function checkAndPull(): Promise<void> {
    if (!gistId || pushing || pulling) return;
    try {
      const gistMeta = await getGistMeta(pat, gistId);
      cachedRemoteMeta = gistMeta.meta;

      // If local is empty and remote has data, always pull regardless of timestamps
      const localCount = countSongs();
      const remoteSongs = gistMeta.meta?.song_count ?? 0;
      const forcePull = localCount === 0 && remoteSongs > 0;

      // Guard: don't pull if it would destroy local data (remote has fewer songs)
      if (localCount > 0 && remoteSongs === 0) return;

      if (!forcePull && gistMeta.updated_at <= lastKnownRemoteUpdated) return;
      pulling = true;
      lastPullAt = Date.now();
      onStatus({ state: 'pulling' });
      try {
        await pullFromGist(pat, gistId);
        lastKnownRemoteUpdated = gistMeta.updated_at;
        localStorage.setItem(LS_LAST_REMOTE_UPDATED, gistMeta.updated_at);
        const ts = Date.now();
        localStorage.setItem(LS_LAST_SYNC_KEY, String(ts));
        onStatus({ state: 'synced', at: ts });
      } finally {
        pulling = false;
      }
    } catch {
      // silent — no spamear error en desconexiones momentáneas del poller
    }
  }

  const unsubDb = subscribe(() => {
    if (pulling || Date.now() - lastPullAt < PULL_COOLDOWN) return;
    if (pushTimer !== null) clearTimeout(pushTimer);
    pushTimer = window.setTimeout(() => {
      pushTimer = null;
      void doPush();
    }, 8_000);
  });

  const intervalId = setInterval(() => { void checkAndPull(); }, 30_000);

  const onVisibility = () => {
    if (document.visibilityState === 'visible') void checkAndPull();
  };
  document.addEventListener('visibilitychange', onVisibility);

  // Verificación inicial al montar
  void checkAndPull();

  return {
    push: () => { void doPush(); },
    sync: () => { void (async () => { await checkAndPull(); await doPush(); })(); },
    cleanup: () => {
      unsubDb();
      clearInterval(intervalId);
      if (pushTimer !== null) clearTimeout(pushTimer);
      document.removeEventListener('visibilitychange', onVisibility);
    },
  };
}

// ---------- Admin PIN ----------

/** Sets the admin PIN in the Gist metadata. Requires existing PAT & gist ID. */
export async function setAdminPin(pat: string, gistId: string, pin: string): Promise<void> {
  const pinHash = await hashPin(pin);
  const remoteMeta = await fetchRemoteMeta(pat, gistId);
  const meta: GistMeta = {
    song_count: remoteMeta?.song_count ?? countSongs(),
    pushed_at: remoteMeta?.pushed_at ?? Date.now(),
    device_id: remoteMeta?.device_id ?? getDeviceId(),
    admin_pin_hash: pinHash,
  };
  const body = JSON.stringify({
    files: { [META_FILENAME]: { content: JSON.stringify(meta, null, 2) } },
  });
  const res = await fetch(`${GITHUB_API}/gists/${gistId}`, {
    method: 'PATCH',
    headers: headers(pat),
    body,
  });
  await checkResponse(res, 'setAdminPin');
  // Update lastKnownRemoteUpdated so auto-sync doesn't re-pull after this meta-only patch
  try {
    const resData = (await res.json()) as { updated_at?: string };
    if (resData.updated_at) {
      localStorage.setItem(LS_LAST_REMOTE_UPDATED, resData.updated_at);
    }
  } catch { /* non-critical */ }
}

/** Verifies a PIN against the stored hash in the Gist. Returns true if correct. */
export async function verifyAdminPin(pat: string, gistId: string, pin: string): Promise<boolean> {
  const remoteMeta = await fetchRemoteMeta(pat, gistId);
  if (!remoteMeta?.admin_pin_hash) return false;
  const pinHash = await hashPin(pin);
  return pinHash === remoteMeta.admin_pin_hash;
}

/** Checks if an admin PIN has been configured. */
export async function hasAdminPin(pat: string, gistId: string): Promise<boolean> {
  const remoteMeta = await fetchRemoteMeta(pat, gistId);
  return remoteMeta?.admin_pin_hash != null;
}

// ---------- Gist Revision Recovery ----------

export interface GistRevision {
  sha: string;
  committed_at: string;
  song_count: number | null;
}

/**
 * Counts songs inside a base64-encoded SQLite blob without replacing the active DB.
 * Returns the count, or null if the blob can't be parsed.
 */
async function countSongsInBlob(b64Content: string): Promise<number | null> {
  try {
    const bytes = base64ToBlob(b64Content);
    return countSongsInBytes(bytes);
  } catch {
    return null;
  }
}

/** Lists Gist revisions (most recent first). */
export async function listGistRevisions(pat: string, gistId: string): Promise<GistRevision[]> {
  const res = await fetch(`${GITHUB_API}/gists/${gistId}`, { headers: headers(pat) });
  await checkResponse(res, 'listGistRevisions');
  const data = (await res.json()) as {
    history: { version: string; committed_at: string }[];
  };
  const revisions: GistRevision[] = [];
  const toCheck = data.history.slice(0, 20);
  for (const h of toCheck) {
    try {
      const revRes = await fetch(`${GITHUB_API}/gists/${gistId}/${h.version}`, { headers: headers(pat) });
      if (!revRes.ok) continue;
      const revData = (await revRes.json()) as { files: Record<string, { content: string } | undefined> };
      const meta = parseMetaFromGist(revData.files);
      let songCount = meta?.song_count ?? null;

      // For revisions without metadata, inspect the DB blob directly
      if (songCount === null) {
        const dbFile = revData.files[GIST_FILENAME];
        if (dbFile?.content) {
          songCount = await countSongsInBlob(dbFile.content);
        }
      }

      revisions.push({
        sha: h.version,
        committed_at: h.committed_at,
        song_count: songCount,
      });
    } catch {
      revisions.push({ sha: h.version, committed_at: h.committed_at, song_count: null });
    }
  }
  return revisions;
}

/** Restores the DB from a specific Gist revision. */
export async function restoreFromRevision(pat: string, gistId: string, sha: string): Promise<void> {
  const res = await fetch(`${GITHUB_API}/gists/${gistId}/${sha}`, { headers: headers(pat) });
  await checkResponse(res, 'restoreFromRevision');
  const data = (await res.json()) as { files: Record<string, { content: string } | undefined> };
  const file = data.files[GIST_FILENAME];
  if (!file?.content) throw new Error('La revisión no contiene un backup de band-tool');
  const bytes = base64ToBlob(file.content);
  await replaceDbWithBytes(bytes);
  await flushNow();
  notifyChange();
}

/** Finds and restores the most recent Gist revision that had data (song_count > 0). */
export async function recoverLatestWithData(pat: string, gistId: string): Promise<{ restored: boolean; revision: GistRevision | null }> {
  const revisions = await listGistRevisions(pat, gistId);
  const withData = revisions.find(r => r.song_count !== null && r.song_count > 0);
  if (!withData) return { restored: false, revision: null };
  await restoreFromRevision(pat, gistId, withData.sha);
  // Push the recovered data back to Gist so it becomes the latest version
  const result = await pushToGist(pat, gistId);
  // Update localStorage so auto-sync doesn't re-pull over this push
  localStorage.setItem(LS_GIST_ID_KEY, result.id);
  localStorage.setItem(LS_LAST_REMOTE_UPDATED, result.updated_at);
  localStorage.setItem(LS_LAST_SYNC_KEY, String(Date.now()));
  return { restored: true, revision: withData };
}
