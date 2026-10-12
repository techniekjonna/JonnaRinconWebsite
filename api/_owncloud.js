// Shared server-side logic for uploading files to the ownCloud at Internedata.
// Credentials ONLY come from server environment variables (never VITE_):
//   OWNCLOUD_URL       e.g. https://internedata.nl
//   OWNCLOUD_USER      the ownCloud user name
//   OWNCLOUD_PASSWORD  the password (or an app password)
//   OWNCLOUD_BASE      optional, root folder for the website (default "J18/Media Website")
// Large files are sent in chunks (< 4 MB per request, Vercel's body limit) using
// ownCloud's chunked upload; after the last chunk the file is assembled, after which a
// public read-only share link is created and returned as a direct download URL.

const FIREBASE_API_KEY = 'AIzaSyBbTfR42ZW61pY4x2_3YYsqZyPv5I6tFoU'; // public web key (also in src/lib/firebase/config.ts)
const FIREBASE_PROJECT = 'jonna-8cd90';

export function cloudConfig(env = process.env) {
  const url = (env.OWNCLOUD_URL || '').replace(/\/+$/, '');
  const user = env.OWNCLOUD_USER || '';
  const password = env.OWNCLOUD_PASSWORD || '';
  const base = env.OWNCLOUD_BASE || 'J18/Media Website';
  if (!url || !user || !password) return null;
  return { url, user, password, base };
}

function authHeader(cfg) {
  return 'Basic ' + Buffer.from(`${cfg.user}:${cfg.password}`).toString('base64');
}

// Keep folder and file names safe: no path tricks, no odd characters.
export function cleanSegment(s) {
  return String(s || '')
    .replace(/[\\/:*?"<>|#%\u0000-\u001f]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^\.+/, '')
    .slice(0, 120);
}

export function cleanFolder(folder) {
  return String(folder || '')
    .split('/')
    .map(cleanSegment)
    .filter((p) => p && p !== '.' && p !== '..')
    .join('/');
}

function davUrl(cfg, path) {
  const enc = path.split('/').filter(Boolean).map(encodeURIComponent).join('/');
  return `${cfg.url}/remote.php/webdav/${enc}`;
}

async function exists(cfg, path) {
  const r = await fetch(davUrl(cfg, path), {
    method: 'PROPFIND',
    headers: { Authorization: authHeader(cfg), Depth: '0' },
  });
  return r.status === 207;
}

export async function ensureFolder(cfg, folderPath) {
  const parts = folderPath.split('/').filter(Boolean);
  let cur = '';
  for (const p of parts) {
    cur = cur ? `${cur}/${p}` : p;
    const r = await fetch(davUrl(cfg, cur), { method: 'MKCOL', headers: { Authorization: authHeader(cfg) } });
    // 201 created, 405 already exists
    if (r.status !== 201 && r.status !== 405) {
      throw new Error(`Map aanmaken mislukt (${cur}): ${r.status}`);
    }
  }
}

// Pick a free file name: "Name.wav", "Name (2).wav", ...
export async function freeName(cfg, folderPath, name) {
  const dot = name.lastIndexOf('.');
  const stem = dot > 0 ? name.slice(0, dot) : name;
  const ext = dot > 0 ? name.slice(dot) : '';
  for (let i = 1; i < 50; i++) {
    const candidate = i === 1 ? name : `${stem} (${i})${ext}`;
    if (!(await exists(cfg, `${folderPath}/${candidate}`))) return candidate;
  }
  return `${stem} (${Date.now()})${ext}`;
}

// ownCloud "new" chunking: chunks go to a temporary upload folder, then MOVE assembles them.
function uploadsUrl(cfg, transfer, part) {
  return `${cfg.url}/remote.php/dav/uploads/${encodeURIComponent(cfg.user)}/${transfer}${part ? '/' + part : ''}`;
}

export async function startTransfer(cfg, transfer) {
  const r = await fetch(uploadsUrl(cfg, transfer), { method: 'MKCOL', headers: { Authorization: authHeader(cfg) } });
  if (r.status !== 201 && r.status !== 405) throw new Error(`Upload starten mislukt: ${r.status}`);
}

export async function putChunk(cfg, transfer, index, body) {
  const r = await fetch(uploadsUrl(cfg, transfer, String(index).padStart(6, '0')), {
    method: 'PUT',
    headers: { Authorization: authHeader(cfg), 'Content-Type': 'application/octet-stream' },
    body,
  });
  if (r.status >= 300) throw new Error(`Uploaden mislukt: ${r.status}`);
}

export async function finishTransfer(cfg, transfer, filePath) {
  const enc = filePath.split('/').filter(Boolean).map(encodeURIComponent).join('/');
  const r = await fetch(uploadsUrl(cfg, transfer, '.file'), {
    method: 'MOVE',
    headers: {
      Authorization: authHeader(cfg),
      Destination: `${cfg.url}/remote.php/dav/files/${encodeURIComponent(cfg.user)}/${enc}`,
      Overwrite: 'F',
    },
  });
  if (r.status >= 300) throw new Error(`Bestand samenvoegen mislukt: ${r.status}`);
}

export async function shareLink(cfg, filePath) {
  const form = new URLSearchParams({ path: `/${filePath}`, shareType: '3', permissions: '1' });
  const r = await fetch(`${cfg.url}/ocs/v1.php/apps/files_sharing/api/v1/shares?format=json`, {
    method: 'POST',
    headers: {
      Authorization: authHeader(cfg),
      'OCS-APIRequest': 'true',
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: form.toString(),
  });
  const json = await r.json().catch(() => null);
  const url = json?.ocs?.data?.url;
  if (!url) throw new Error('Deellink maken mislukt');
  return url.replace(/\/+$/, '') + '/download';
}

// Only signed-in admins may upload. Verifies the Firebase ID token and reads the
// user's role from Firestore with that same token.
export async function verifyAdmin(idToken) {
  if (!idToken) return false;
  const look = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${FIREBASE_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken }),
  });
  if (!look.ok) return false;
  const uid = (await look.json())?.users?.[0]?.localId;
  if (!uid) return false;
  const doc = await fetch(
    `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT}/databases/(default)/documents/users/${uid}`,
    { headers: { Authorization: `Bearer ${idToken}` } }
  );
  if (!doc.ok) return false;
  const role = (await doc.json())?.fields?.role?.stringValue;
  return role === 'admin';
}
