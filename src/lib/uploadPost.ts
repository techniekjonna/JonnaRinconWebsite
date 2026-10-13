import { auth } from './firebase/config';

// Talks to Upload-Post (social posting + analytics) through our own
// /api/upload-post server function. The API key never reaches the browser.

export class UploadPostError extends Error {
  code?: string;
  status: number;
  constructor(message: string, status: number, code?: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

function endpoint(pad: string) {
  const base = (import.meta.env.BASE_URL || '/').replace(/\/?$/, '/');
  return `${base}api/upload-post?pad=${encodeURIComponent(pad)}`;
}

/** Call an Upload-Post endpoint, e.g. upCall('/uploadposts/history?limit=50'). */
export async function upCall<T = any>(pad: string, init?: RequestInit): Promise<T> {
  const user = auth.currentUser;
  if (!user) throw new UploadPostError('Log eerst in als admin', 401);
  const token = await user.getIdToken();
  const res = await fetch(endpoint(pad), {
    ...init,
    headers: { Authorization: `Bearer ${token}`, ...(init?.headers || {}) },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data?.success === false) {
    if ((res.status === 404 || res.status === 501) && !data?.error) {
      throw new UploadPostError('Dit werkt alleen op de live site (na publiceren), niet in de preview.', res.status, 'preview');
    }
    throw new UploadPostError(data?.error || data?.message || `Upload-Post fout (${res.status})`, res.status, data?.code);
  }
  return data as T;
}

/** POST JSON to Upload-Post. */
export function upPost<T = any>(pad: string, body: unknown) {
  return upCall<T>(pad, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

// The Upload-Post profile that holds the connected social accounts.
const PROFILE_KEY = 'uploadpost_username';
export const getProfileName = () => localStorage.getItem(PROFILE_KEY) || '';
export const setProfileName = (name: string) => localStorage.setItem(PROFILE_KEY, name);

export interface SocialAccount {
  handle?: string;
  username?: string;
  display_name?: string;
  social_images?: string;
  reauth_required?: boolean;
}

export interface UploadPostProfile {
  username: string;
  created_at?: string;
  social_accounts?: Record<string, SocialAccount | string | null>;
}

/** Only the platforms that really have an account linked. */
export function connectedAccounts(profile?: UploadPostProfile | null): Record<string, SocialAccount> {
  const out: Record<string, SocialAccount> = {};
  Object.entries(profile?.social_accounts || {}).forEach(([platform, acc]) => {
    if (!acc) return;
    if (typeof acc === 'string') {
      if (acc.trim()) out[platform] = { handle: acc };
      return;
    }
    if (Object.keys(acc).length) out[platform] = acc;
  });
  return out;
}

export interface PlatformInfo {
  id: string;
  label: string;
  color: string; // brand colour for dots and charts
  video: boolean;
  photo: boolean;
  text: boolean;
  analytics: boolean;
}

// Platforms Upload-Post supports, with what each can post and measure.
export const PLATFORMS: PlatformInfo[] = [
  { id: 'instagram', label: 'Instagram', color: '#E1306C', video: true, photo: true, text: false, analytics: true },
  { id: 'tiktok', label: 'TikTok', color: '#25F4EE', video: true, photo: true, text: false, analytics: true },
  { id: 'youtube', label: 'YouTube', color: '#FF0000', video: true, photo: false, text: false, analytics: true },
  { id: 'facebook', label: 'Facebook', color: '#1877F2', video: true, photo: true, text: true, analytics: true },
  { id: 'x', label: 'X', color: '#E7E9EA', video: true, photo: true, text: true, analytics: true },
  { id: 'threads', label: 'Threads', color: '#A0A0A0', video: true, photo: true, text: true, analytics: true },
  { id: 'linkedin', label: 'LinkedIn', color: '#0A66C2', video: true, photo: true, text: true, analytics: true },
  { id: 'pinterest', label: 'Pinterest', color: '#E60023', video: true, photo: true, text: false, analytics: true },
  { id: 'bluesky', label: 'Bluesky', color: '#1185FE', video: true, photo: true, text: true, analytics: false },
  { id: 'reddit', label: 'Reddit', color: '#FF4500', video: true, photo: true, text: true, analytics: true },
];

export const platformInfo = (id: string) =>
  PLATFORMS.find((p) => p.id === id) || { id, label: id, color: '#888888', video: true, photo: true, text: true, analytics: false };

export interface PlatformStats {
  followers?: number;
  reach?: number;
  views?: number;
  impressions?: number;
  profileViews?: number;
  likes?: number;
  comments?: number;
  shares?: number;
  saves?: number;
  video_count?: number;
  following?: number;
  reach_timeseries?: { date: string; value: number }[];
}

export const fmtNum = (n?: number) => {
  if (n === undefined || n === null || Number.isNaN(n)) return '-';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace('.0', '')}M`;
  if (n >= 10_000) return `${Math.round(n / 1000)}K`;
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace('.0', '')}K`;
  return String(Math.round(n));
};
