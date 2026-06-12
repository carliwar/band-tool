import { getDbBlob, replaceDbWithBytes, notifyChange } from './database';
import { flushNow } from './database';

const GITHUB_API = 'https://api.github.com';
const GIST_FILENAME = 'band-tool-db.sqlite.b64';

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

/** Verifica que el PAT sea válido consultando /user. */
export async function validatePat(pat: string): Promise<boolean> {
  const res = await fetch(`${GITHUB_API}/user`, { headers: headers(pat) });
  return res.ok;
}

/**
 * Sube la DB actual al Gist.
 * Si gistId es null crea un Gist nuevo (secreto). Devuelve el Gist ID.
 */
export async function pushToGist(pat: string, gistId: string | null): Promise<string> {
  const bytes = getDbBlob();
  const content = blobToBase64(bytes);

  const body = JSON.stringify({
    description: 'band-tool database backup',
    public: false,
    files: { [GIST_FILENAME]: { content } },
  });

  let res: Response;
  if (gistId) {
    res = await fetch(`${GITHUB_API}/gists/${gistId}`, {
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
