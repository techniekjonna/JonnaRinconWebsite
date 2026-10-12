// Reads details from an audio file in the browser: ID3 tags (mp3, and the
// id3 chunk in wav), RIFF INFO (wav), the duration, the embedded cover, and
// whatever can be read from the file or folder name.

export interface AudioMeta {
  title?: string;
  artist?: string;
  album?: string;
  year?: number;
  /** Full date (YYYY-MM-DD) when the file has one. */
  date?: string;
  genre?: string;
  bpm?: number;
  key?: string;
  trackNumber?: number;
  /** Duration as m:ss */
  duration?: string;
  picture?: File;
}

export interface NameParts {
  title?: string;
  artist?: string;
  bpm?: number;
  key?: string;
  genre?: string;
  year?: number;
  trackNumber?: number;
}

export const AUDIO_EXT = /\.(wav|mp3|aiff?|flac|m4a|ogg|aac)$/i;
export const IMAGE_EXT = /\.(png|jpe?g|webp|gif|avif)$/i;

export const isAudioFile = (f: File) => f.type.startsWith('audio/') || AUDIO_EXT.test(f.name);
export const isImageFile = (f: File) => f.type.startsWith('image/') || IMAGE_EXT.test(f.name);

const clean = (s?: string) => (s || '').replace(/\0+/g, ' ').replace(/\s+/g, ' ').trim() || undefined;

// ---------- names ----------

const KEY_RE = /^([A-G])\s*(#|b|♯|♭)?\s*(maj(?:or)?|min(?:or)?|m)?$/i;

function normaliseKey(raw: string): string | undefined {
  const m = raw.trim().match(KEY_RE);
  if (!m) return undefined;
  const note = m[1].toUpperCase();
  const acc = m[2] ? (m[2] === '♯' ? '#' : m[2] === '♭' ? 'b' : m[2]) : '';
  const q = (m[3] || '').toLowerCase();
  const quality = !q ? '' : q === 'm' || q.startsWith('min') ? ' Minor' : ' Major';
  return `${note}${acc}${quality}`;
}

/**
 * Reads details from a file or folder name, for example
 * "GUITTARA - 118 BPM - A Minor - Urban, Rap - Prod by Jonna Rincon",
 * "Jonna Rincon - Nachtlicht (2025)" or "03. Nachtlicht".
 * mode 'track': two parts mean "Artist - Title"; mode 'beat': first part is the title.
 */
export function parseName(name: string, mode: 'track' | 'beat'): NameParts {
  const out: NameParts = {};
  let base = name.replace(/\.[a-z0-9]{2,4}$/i, '').replace(/_/g, ' ').trim();

  const num = base.match(/^(\d{1,2})\s*[.)\-_ ]\s*(?=\D)/);
  if (num) {
    out.trackNumber = parseInt(num[1], 10);
    base = base.slice(num[0].length).trim();
  }

  const year = base.match(/[([]\s*((?:19|20)\d{2})\s*[)\]]/);
  if (year) {
    out.year = parseInt(year[1], 10);
    base = base.replace(year[0], '').trim();
  }

  const rest: string[] = [];
  for (let part of base.split(/\s+[-–—|]\s+/)) {
    part = part.trim();
    if (!part) continue;
    const prod = part.match(/^(?:prod(?:\.|uced)?|produced)\s*(?:by|\.)?\s*(.+)$/i);
    if (prod) { out.artist = prod[1].trim(); continue; }
    const bpmOnly = part.match(/^(\d{2,3})\s*bpm$/i);
    if (bpmOnly) { out.bpm = parseInt(bpmOnly[1], 10); continue; }
    const key = normaliseKey(part);
    if (key) { out.key = key; continue; }
    // BPM or key hidden inside a part: "GUITTARA 118bpm Am"
    const bpmIn = part.match(/\b(\d{2,3})\s*bpm\b/i);
    if (bpmIn) {
      out.bpm = out.bpm ?? parseInt(bpmIn[1], 10);
      part = part.replace(bpmIn[0], '').trim();
      const tailKey = part.match(/\s([A-G](?:#|b)?\s*(?:maj(?:or)?|min(?:or)?|m)?)$/i);
      if (tailKey && !out.key) {
        const k = normaliseKey(tailKey[1]);
        if (k) { out.key = k; part = part.slice(0, tailKey.index).trim(); }
      }
      if (!part) continue;
    }
    rest.push(part);
  }

  if (mode === 'track' && rest.length >= 2 && !out.artist) {
    out.artist = rest[0];
    out.title = rest.slice(1).join(' - ');
  } else if (rest.length) {
    out.title = rest[0];
    if (rest.length > 1) out.genre = rest.slice(1).join(', ');
  }
  return out;
}

// ---------- tags ----------

function decodeText(bytes: Uint8Array, enc: number): string {
  if (!bytes.length) return '';
  try {
    if (enc === 1) {
      if (bytes[0] === 0xfe && bytes[1] === 0xff) return new TextDecoder('utf-16be').decode(bytes.subarray(2));
      if (bytes[0] === 0xff && bytes[1] === 0xfe) return new TextDecoder('utf-16le').decode(bytes.subarray(2));
      return new TextDecoder('utf-16le').decode(bytes);
    }
    if (enc === 2) return new TextDecoder('utf-16be').decode(bytes);
    if (enc === 3) return new TextDecoder('utf-8').decode(bytes);
    return new TextDecoder('windows-1252').decode(bytes);
  } catch {
    return '';
  }
}

/** Index of the end of a null-terminated string in the given encoding. */
function findNull(b: Uint8Array, from: number, enc: number): number {
  if (enc === 1 || enc === 2) {
    for (let i = from; i + 1 < b.length; i += 2) if (b[i] === 0 && b[i + 1] === 0) return i;
  } else {
    for (let i = from; i < b.length; i++) if (b[i] === 0) return i;
  }
  return b.length;
}

const syncsafe = (b: Uint8Array, o: number) => (b[o] << 21) | (b[o + 1] << 14) | (b[o + 2] << 7) | b[o + 3];
const be32 = (b: Uint8Array, o: number) => ((b[o] << 24) >>> 0) + (b[o + 1] << 16) + (b[o + 2] << 8) + b[o + 3];
const le32 = (b: Uint8Array, o: number) => b[o] + (b[o + 1] << 8) + (b[o + 2] << 16) + ((b[o + 3] << 24) >>> 0);
const ascii = (b: Uint8Array, o: number, n: number) => String.fromCharCode(...b.subarray(o, o + n));

function cleanGenre(g?: string) {
  const s = clean(g?.replace(/\(\d+\)/g, ''));
  return s && !/^\d+$/.test(s) ? s : undefined;
}

function applyDate(meta: AudioMeta, raw?: string) {
  const s = clean(raw);
  if (!s) return;
  const full = s.match(/^((?:19|20)\d{2})-(\d{2})-(\d{2})/);
  if (full) { meta.date = meta.date || `${full[1]}-${full[2]}-${full[3]}`; meta.year = meta.year || parseInt(full[1], 10); return; }
  const y = s.match(/(19|20)\d{2}/);
  if (y) meta.year = meta.year || parseInt(y[0], 10);
}

/** Parses an ID3v2 tag that starts at offset 0 of `b`. */
function parseId3(b: Uint8Array, meta: AudioMeta) {
  if (ascii(b, 0, 3) !== 'ID3') return;
  const ver = b[3];
  const flags = b[5];
  const end = Math.min(b.length, 10 + syncsafe(b, 6));
  let p = 10;
  if (flags & 0x40) p += ver === 4 ? syncsafe(b, p) : be32(b, p) + 4;
  const v22 = ver === 2;
  const idLen = v22 ? 3 : 4;
  const hdr = v22 ? 6 : 10;

  while (p + hdr < end) {
    const id = ascii(b, p, idLen);
    if (!/^[A-Z0-9]+$/.test(id)) break;
    const size = v22 ? (b[p + 3] << 16) | (b[p + 4] << 8) | b[p + 5] : ver === 4 ? syncsafe(b, p + 4) : be32(b, p + 4);
    const start = p + hdr;
    const data = b.subarray(start, Math.min(start + size, end));
    p = start + size;
    if (!size || !data.length) continue;

    if (id === 'APIC' || id === 'PIC') {
      if (meta.picture) continue;
      const enc = data[0];
      let q = 1;
      let mime: string;
      if (v22) { const fmt = ascii(data, 1, 3).toLowerCase(); mime = fmt === 'png' ? 'image/png' : 'image/jpeg'; q = 4; }
      else { const z = findNull(data, 1, 0); mime = ascii(data, 1, z - 1) || 'image/jpeg'; q = z + 1; }
      q += 1; // picture type
      q = findNull(data, q, enc) + (enc === 1 || enc === 2 ? 2 : 1);
      const img = data.slice(q);
      if (img.length > 100) {
        if (!mime.includes('/')) mime = `image/${mime.toLowerCase() === 'png' ? 'png' : 'jpeg'}`;
        const ext = mime.includes('png') ? 'png' : 'jpg';
        meta.picture = new File([img], `cover.${ext}`, { type: mime });
      }
      continue;
    }

    if (id[0] !== 'T') continue;
    const text = clean(decodeText(data.subarray(1), data[0]).split('\0').filter(Boolean).join(', '));
    if (!text) continue;
    switch (id) {
      case 'TIT2': case 'TT2': meta.title = meta.title || text; break;
      case 'TPE1': case 'TP1': meta.artist = meta.artist || text; break;
      case 'TALB': case 'TAL': meta.album = meta.album || text; break;
      case 'TCON': case 'TCO': meta.genre = meta.genre || cleanGenre(text); break;
      case 'TBPM': case 'TBP': { const n = Math.round(parseFloat(text)); if (n > 0) meta.bpm = meta.bpm || n; break; }
      case 'TKEY': case 'TKE': meta.key = meta.key || normaliseKey(text) || text; break;
      case 'TRCK': case 'TRK': { const n = parseInt(text, 10); if (n > 0) meta.trackNumber = meta.trackNumber || n; break; }
      case 'TDRL': case 'TDRC': case 'TYER': case 'TYE': case 'TDOR': case 'TORY': applyDate(meta, text); break;
    }
  }
}

async function readBytes(file: File, from: number, len: number) {
  return new Uint8Array(await file.slice(from, from + len).arrayBuffer());
}

async function parseWav(file: File, meta: AudioMeta) {
  let p = 12;
  for (let guard = 0; guard < 64 && p + 8 <= file.size; guard++) {
    const h = await readBytes(file, p, 8);
    const id = ascii(h, 0, 4);
    const size = le32(h, 4);
    const body = p + 8;
    if (id === 'LIST' && size < 1_000_000) {
      const b = await readBytes(file, body, size);
      if (ascii(b, 0, 4) === 'INFO') {
        let q = 4;
        while (q + 8 <= b.length) {
          const sid = ascii(b, q, 4);
          const ssize = le32(b, q + 4);
          const val = clean(new TextDecoder('windows-1252').decode(b.subarray(q + 8, q + 8 + ssize)));
          if (val) {
            if (sid === 'INAM') meta.title = meta.title || val;
            if (sid === 'IART') meta.artist = meta.artist || val;
            if (sid === 'IPRD') meta.album = meta.album || val;
            if (sid === 'IGNR') meta.genre = meta.genre || cleanGenre(val);
            if (sid === 'ICRD') applyDate(meta, val);
          }
          q += 8 + ssize + (ssize & 1);
        }
      }
    } else if ((id === 'id3 ' || id === 'ID3 ') && size < 30_000_000) {
      parseId3(await readBytes(file, body, size), meta);
    }
    p = body + size + (size & 1);
  }
}

function readDuration(file: File): Promise<string | undefined> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const a = new Audio();
    const done = (v?: string) => { clearTimeout(t); URL.revokeObjectURL(url); a.src = ''; resolve(v); };
    const t = setTimeout(() => done(undefined), 8000);
    a.preload = 'metadata';
    a.onloadedmetadata = () => {
      const s = a.duration;
      if (!isFinite(s) || s <= 0) return done(undefined);
      const r = Math.round(s);
      done(`${Math.floor(r / 60)}:${String(r % 60).padStart(2, '0')}`);
    };
    a.onerror = () => done(undefined);
    a.src = url;
  });
}

/** Reads tags, cover and duration from an audio file. Never throws. */
export async function readAudioMeta(file: File): Promise<AudioMeta> {
  const meta: AudioMeta = {};
  try {
    const head = await readBytes(file, 0, 12);
    if (ascii(head, 0, 3) === 'ID3') {
      const size = syncsafe(head, 6) + 10;
      parseId3(await readBytes(file, 0, Math.min(size, 30_000_000)), meta);
    } else if (ascii(head, 0, 4) === 'RIFF' && ascii(head, 8, 4) === 'WAVE') {
      await parseWav(file, meta);
    }
  } catch (e) {
    console.warn('Tags lezen mislukt', e);
  }
  meta.duration = await readDuration(file);
  return meta;
}

// ---------- folders ----------

export interface PickedFiles {
  /** Name of the dropped or chosen folder, if a folder was used. */
  folderName?: string;
  files: File[];
}

async function readEntry(entry: any, out: File[]) {
  if (entry.isFile) {
    const f: File = await new Promise((res, rej) => entry.file(res, rej));
    if (!f.name.startsWith('.')) {
      try { Object.defineProperty(f, 'relPath', { value: entry.fullPath || f.name }); } catch { /* ignore */ }
      out.push(f);
    }
  } else if (entry.isDirectory) {
    const reader = entry.createReader();
    for (;;) {
      const batch: any[] = await new Promise((res, rej) => reader.readEntries(res, rej));
      if (!batch.length) break;
      for (const e of batch) await readEntry(e, out);
    }
  }
}

/** Collects files (and folder contents) from a drop event. Call synchronously inside onDrop. */
export function filesFromDrop(dt: DataTransfer): Promise<PickedFiles> {
  const items = Array.from(dt.items || []);
  const entries = items.map((i) => (i as any).webkitGetAsEntry?.()).filter(Boolean);
  const plain = Array.from(dt.files || []);
  return (async () => {
    const dir = entries.find((e: any) => e.isDirectory);
    if (dir) {
      const files: File[] = [];
      await readEntry(dir, files);
      return { folderName: dir.name, files };
    }
    return { files: plain };
  })();
}

/** Files from an <input type="file" webkitdirectory>. */
export function filesFromFolderInput(list: FileList | null): PickedFiles {
  const files = Array.from(list || []).filter((f) => !f.name.startsWith('.'));
  const rel = (files[0] as any)?.webkitRelativePath as string | undefined;
  return { folderName: rel ? rel.split('/')[0] : undefined, files };
}

/** Picks the main audio file: mp3 first, then wav, skipping stems and tagged previews when possible. */
export function pickMainAudio(files: File[]): File | undefined {
  const audio = files.filter(isAudioFile);
  const main = audio.filter((f) => !/stem|tagged|preview/i.test(f.name) && !/\/stems?\//i.test((f as any).relPath || (f as any).webkitRelativePath || ''));
  const pool = main.length ? main : audio;
  return pool.find((f) => /\.mp3$/i.test(f.name)) || pool.find((f) => /\.wav$/i.test(f.name)) || pool[0];
}

/** A zip with the stems, if the folder has one. */
export function pickStemsZip(files: File[]): File | undefined {
  const zips = files.filter((f) => /\.(zip|rar|7z)$/i.test(f.name));
  return zips.find((f) => /stem/i.test(f.name)) || zips[0];
}

export function pickCover(files: File[]): File | undefined {
  const imgs = files.filter(isImageFile);
  return imgs.find((f) => /cover|artwork|art|front/i.test(f.name)) || imgs[0];
}
