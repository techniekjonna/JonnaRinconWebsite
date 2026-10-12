import { auth } from './firebase/config';

// Uploads a file to the ownCloud (Internedata) via our own /api/cloud-upload
// function. Folders are relative to "J18/Media Website" and are created when
// missing. Returns a direct download URL (public share link + /download).

const CHUNK = 3 * 1024 * 1024; // stays under Vercel's 4.5 MB request limit

// Folder names used across the admin panel (relative to "J18/Media Website").
export const CLOUD_FOLDERS = {
  beat: (title?: string) => `BeatsByjonAthan/${title?.trim() || 'Nieuwe beat'}`,
  beatPack: (name?: string) => `BeatsByjonAthan/Packs/${name?.trim() || 'Nieuw pack'}`,
  single: 'CATALOGUE/Single',
  album: (title?: string) => `CATALOGUE/Album/${title?.trim() || 'Nieuw album'}`,
  ep: (title?: string) => `CATALOGUE/EP/${title?.trim() || 'Nieuwe EP'}`,
  remixesEdits: 'CATALOGUE/Remixes - Edits',
  services: (title?: string) => `Services/${title?.trim() || 'Algemeen'}`,
  promo: 'Promo',
  clients: (client?: string) => `Clients/${client?.trim() || 'Algemeen'}`,
};

export interface CloudUploadOptions {
  folder: string;
  /** Optional file name without extension; the original extension is kept. */
  baseName?: string;
  onProgress?: (fraction: number) => void;
}

function endpoint(params: Record<string, string | number>) {
  const base = (import.meta.env.BASE_URL || '/').replace(/\/?$/, '/');
  const q = new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)]));
  return `${base}api/cloud-upload?${q.toString()}`;
}

async function call(params: Record<string, string | number>, token: string, body?: Blob) {
  const res = await fetch(endpoint(params), {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/octet-stream' },
    body: body ?? null,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 404 && !data.error) {
      throw new Error('Uploaden werkt alleen op de live site (na publiceren), niet in de preview.');
    }
    throw new Error(data.error || `Upload mislukt (${res.status})`);
  }
  return data;
}

export async function uploadToCloud(file: File, { folder, baseName, onProgress }: CloudUploadOptions) {
  const user = auth.currentUser;
  if (!user) throw new Error('Log eerst in als admin');
  const token = await user.getIdToken();

  const dot = file.name.lastIndexOf('.');
  const ext = dot > 0 ? file.name.slice(dot) : '';
  const name = baseName?.trim() ? `${baseName.trim()}${ext}` : file.name;
  const transfer = `web${Date.now()}${Math.random().toString(36).slice(2, 10)}`;

  const started = await call({ stap: 'start', folder, name, transfer }, token);
  const finalName: string = started.name;

  const count = Math.max(1, Math.ceil(file.size / CHUNK));
  let result: { url?: string; path?: string } = {};
  for (let i = 0; i < count; i++) {
    const part = file.slice(i * CHUNK, Math.min(file.size, (i + 1) * CHUNK));
    result = await call({ stap: 'chunk', folder, name: finalName, transfer, index: i, count }, token, part);
    onProgress?.((i + 1) / count);
  }
  if (!result.url) throw new Error('Geen downloadlink ontvangen');
  return { url: result.url, path: result.path ?? `${folder}/${finalName}`, name: finalName };
}
