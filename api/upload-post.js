// /api/upload-post?pad=/uploadposts/history&limit=50
// Passes admin requests on to the Upload-Post API (https://api.upload-post.com/api).
// The API key lives ONLY on the server (UPLOAD_POST_API_KEY in Vercel), never in the browser.
// Header: Authorization: Bearer <Firebase ID token of an admin>
import { verifyAdmin } from './_owncloud.js';

const BASE = 'https://api.upload-post.com/api';
// Only these parts of the Upload-Post API may be reached through this route.
const ALLOWED = [/^\/uploadposts\//, /^\/analytics\//, /^\/upload(_photos|_text)?$/];
const MAX_BODY = 4.4 * 1024 * 1024; // Vercel limit is 4.5 MB; big media go via the cloud as a link

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
      if (size > MAX_BODY) {
        reject(new Error('Bestand te groot om direct te versturen'));
        req.destroy();
        return;
      }
      parts.push(c);
    });
    req.on('end', () => resolve(Buffer.concat(parts)));
    req.on('error', reject);
  });
}

export async function uploadPostHandler(req, res, env = process.env) {
  const key = env.UPLOAD_POST_API_KEY;
  if (!key) {
    return send(res, 503, {
      error: 'Upload-Post is nog niet ingesteld op de server (UPLOAD_POST_API_KEY in Vercel).',
      code: 'niet_ingesteld',
    });
  }

  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  try {
    if (!(await verifyAdmin(token))) return send(res, 401, { error: 'Alleen admins. Log opnieuw in.' });
  } catch {
    return send(res, 401, { error: 'Inloggen controleren mislukt' });
  }

  const url = new URL(req.url, 'http://localhost');
  const pad = url.searchParams.get('pad') || '';
  url.searchParams.delete('pad');
  const [path] = pad.split('?');
  if (!path.startsWith('/') || path.includes('..') || !ALLOWED.some((r) => r.test(path))) {
    return send(res, 400, { error: 'Onbekende opdracht' });
  }
  const extra = new URLSearchParams(pad.includes('?') ? pad.slice(pad.indexOf('?') + 1) : '');
  url.searchParams.forEach((v, k) => extra.append(k, v));
  const qs = extra.toString();
  const target = `${BASE}${path}${qs ? `?${qs}` : ''}`;

  const method = (req.method || 'GET').toUpperCase();
  const headers = { Authorization: `Apikey ${key}` };
  let body;
  if (!['GET', 'HEAD'].includes(method)) {
    try {
      body = await readBody(req);
    } catch (e) {
      return send(res, 413, { error: e.message });
    }
    if (req.headers['content-type']) headers['Content-Type'] = req.headers['content-type'];
  }

  try {
    const r = await fetch(target, { method, headers, body });
    const text = await r.text();
    res.statusCode = r.status;
    res.setHeader('Content-Type', r.headers.get('content-type') || 'application/json');
    res.setHeader('Cache-Control', 'no-store');
    res.end(text);
  } catch (e) {
    send(res, 502, { error: e?.message || 'Upload-Post niet bereikbaar' });
  }
}

export default function handler(req, res) {
  return uploadPostHandler(req, res);
}

// Vercel: let the handler read the raw body itself (multipart uploads).
export const config = { api: { bodyParser: false } };
