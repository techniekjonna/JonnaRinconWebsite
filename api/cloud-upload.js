// POST /api/cloud-upload
//   ?stap=start&folder=...&name=...&transfer=...  -> makes the folder(s), picks a free name: { name }
//   ?stap=chunk&folder=...&name=...&transfer=...&index=0&count=N  (body = raw bytes, < 4 MB)
//        -> { ok: true } or, after the last chunk, { url } (direct download link)
// Header: Authorization: Bearer <Firebase ID token of an admin>
import {
  cloudConfig, cleanFolder, cleanSegment, ensureFolder, freeName, startTransfer, putChunk, finishTransfer,
  shareLink, verifyAdmin,
} from './_owncloud.js';

function send(res, status, data) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(data));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const parts = [];
    let size = 0;
    req.on('data', (c) => {
      size += c.length;
      if (size > 4.4 * 1024 * 1024) {
        reject(new Error('Stuk te groot'));
        req.destroy();
        return;
      }
      parts.push(c);
    });
    req.on('end', () => resolve(Buffer.concat(parts)));
    req.on('error', reject);
  });
}

export async function cloudUploadHandler(req, res, env = process.env) {
  if (req.method !== 'POST') return send(res, 405, { error: 'Alleen POST' });

  const cfg = cloudConfig(env);
  if (!cfg) {
    return send(res, 503, {
      error: 'Cloud-opslag is nog niet ingesteld op de server (OWNCLOUD_URL, OWNCLOUD_USER, OWNCLOUD_PASSWORD).',
    });
  }

  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  try {
    if (!(await verifyAdmin(token))) return send(res, 401, { error: 'Alleen admins kunnen uploaden. Log opnieuw in.' });
  } catch {
    return send(res, 401, { error: 'Inloggen controleren mislukt' });
  }

  const q = new URL(req.url, 'http://localhost').searchParams;
  const sub = cleanFolder(q.get('folder') || 'Uploads') || 'Uploads';
  const folder = `${cfg.base}/${sub}`;
  const name = cleanSegment(q.get('name'));
  if (!name) return send(res, 400, { error: 'Bestandsnaam ontbreekt' });

  try {
    const transfer = String(q.get('transfer') || '').replace(/[^a-zA-Z0-9]/g, '').slice(0, 40);
    if (transfer.length < 8) return send(res, 400, { error: 'Ongeldige upload' });

    if (q.get('stap') === 'start') {
      await ensureFolder(cfg, folder);
      const free = await freeName(cfg, folder, name);
      await startTransfer(cfg, transfer);
      return send(res, 200, { name: free });
    }

    const index = Number(q.get('index'));
    const count = Number(q.get('count'));
    if (!Number.isInteger(index) || !Number.isInteger(count) || count < 1 || index < 0 || index >= count) {
      return send(res, 400, { error: 'Ongeldig stuk' });
    }

    const body = await readBody(req);
    const filePath = `${folder}/${name}`;
    await putChunk(cfg, transfer, index, body);
    if (index < count - 1) return send(res, 200, { ok: true });

    await finishTransfer(cfg, transfer, filePath);

    const url = await shareLink(cfg, filePath);
    return send(res, 200, { url, path: `${sub}/${name}` });
  } catch (e) {
    return send(res, 502, { error: e?.message || 'Uploaden mislukt' });
  }
}

export default function handler(req, res) {
  return cloudUploadHandler(req, res);
}
