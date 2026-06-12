import { getDbBlob, replaceDbWithBytes, notifyChange } from './database';
import { flushNow } from './database';

const GITHUB_API = 'https://api.github.com';
const GIST_FILENAME = 'band-tool-db.sqlite.b64';
const GIST_DESCRIPTION = 'band-tool database backup';

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
export async function pushToGist(pat: string, gistId: string | null): Promise<string> {
  const bytes = getDbBlob();
  const content = blobToBase64(bytes);

  // Auto-discover existing gist if no ID is stored locally
  const resolvedId = gistId ?? (await findExistingGist(pat));

  const body = JSON.stringify({
    description: GIST_DESCRIPTION,
    public: false,
    files: { [GIST_FILENAME]: { content } },
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
  const data = (await res.json()) as { id: string };
  return data.id;
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
