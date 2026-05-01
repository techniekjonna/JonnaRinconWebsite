import { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, SkipForward, Lock, Music, Radio, Disc3 } from 'lucide-react';
import { useBeats } from '../hooks/useBeats';
import { useTracks } from '../hooks/useTracks';
import { useRemixes } from '../hooks/useRemixes';
import { useAuth } from '../contexts/AuthContext';
import { setCurrentTrack } from './GlobalAudioPlayer';
import { subscribeToPlayerState } from './GlobalAudioPlayer';

type TabKey = 'beats' | 'tracks' | 'remixes';

const MAX_FREE_PLAYS = 5;
const SESSION_KEY = 'jr_preview_plays';
const SESSION_IDS_KEY = 'jr_preview_ids';

interface PreviewItem {
  id: string;
  title: string;
  artist: string;
  audioUrl: string;
  coverUrl: string;
  tab: TabKey;
  label: string;
}

const TAB_CONFIG: { key: TabKey; label: string; icon: typeof Music }[] = [
  { key: 'beats', label: 'Beats', icon: Music },
  { key: 'tracks', label: 'Tracks', icon: Disc3 },
  { key: 'remixes', label: 'Remixes', icon: Radio },
];

function seededShuffle<T>(arr: T[], seed: number): T[] {
  const a = [...arr];
  let s = seed;
  for (let i = a.length - 1; i > 0; i--) {
    s = (s * 9301 + 49297) % 233280;
    const j = Math.floor((s / 233280) * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function MusicPreview() {
  const { isAuthenticated } = useAuth();
  const { beats } = useBeats({ status: 'published' });
  const { tracks } = useTracks({ status: 'published' });
  const { remixes } = useRemixes({ status: 'published' });

  const [activeTab, setActiveTab] = useState<TabKey>('beats');
  const [playCount, setPlayCount] = useState(0);
  const [sessionItems, setSessionItems] = useState<PreviewItem[]>([]);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showGate, setShowGate] = useState(false);
  const autoTabRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const userPickedTab = useRef(false);
  const sessionSeed = useRef(Date.now());

  // Restore play count from sessionStorage
  useEffect(() => {
    const stored = sessionStorage.getItem(SESSION_KEY);
    if (stored) setPlayCount(parseInt(stored, 10));
    const seed = sessionStorage.getItem('jr_seed');
    if (seed) sessionSeed.current = parseInt(seed, 10);
    else sessionStorage.setItem('jr_seed', String(sessionSeed.current));
  }, []);

  // Build session items once data is loaded, keep same 5 per session
  useEffect(() => {
    if (!beats.length && !tracks.length && !remixes.length) return;
    const storedIds = sessionStorage.getItem(SESSION_IDS_KEY);
    if (storedIds) {
      // Rebuild from stored IDs
      const ids: string[] = JSON.parse(storedIds);
      const allItems = buildAll(beats, tracks, remixes);
      const ordered = ids.map(id => allItems.find(i => i.id === id)).filter(Boolean) as PreviewItem[];
      if (ordered.length >= MAX_FREE_PLAYS) { setSessionItems(ordered.slice(0, MAX_FREE_PLAYS)); return; }
    }
    const allItems = buildAll(beats, tracks, remixes);
    const shuffled = seededShuffle(allItems, sessionSeed.current);
    const chosen = shuffled.slice(0, MAX_FREE_PLAYS);
    setSessionItems(chosen);
    sessionStorage.setItem(SESSION_IDS_KEY, JSON.stringify(chosen.map(i => i.id)));
  }, [beats.length, tracks.length, remixes.length]);

  // Auto-rotate tab every 4s unless user picked one
  useEffect(() => {
    if (userPickedTab.current) return;
    const tabs: TabKey[] = ['beats', 'tracks', 'remixes'];
    autoTabRef.current = setInterval(() => {
      if (!userPickedTab.current) {
        setActiveTab(prev => {
          const idx = tabs.indexOf(prev);
          return tabs[(idx + 1) % tabs.length];
        });
      }
    }, 4000);
    return () => { if (autoTabRef.current) clearInterval(autoTabRef.current); };
  }, []);

  // Subscribe to player state to sync play/pause
  useEffect(() => {
    return subscribeToPlayerState((state) => {
      setIsPlaying(state.isPlaying && state.currentTrack?.id === currentId);
    });
  }, [currentId]);

  const visibleItems = sessionItems.filter(i => i.tab === activeTab);
  const allVisible = sessionItems; // for "play random"

  const play = useCallback((item: PreviewItem) => {
    if (!isAuthenticated && playCount >= MAX_FREE_PLAYS) {
      setShowGate(true);
      return;
    }
    const queue = sessionItems.map(i => ({
      id: i.id,
      title: i.title,
      artist: i.artist,
      audioUrl: i.audioUrl,
      coverArt: i.coverUrl,
    }));
    setCurrentTrack({ id: item.id, title: item.title, artist: item.artist, audioUrl: item.audioUrl, coverArt: item.coverUrl }, queue);
    setCurrentId(item.id);
    setIsPlaying(true);
    if (!isAuthenticated) {
      const next = playCount + 1;
      setPlayCount(next);
      sessionStorage.setItem(SESSION_KEY, String(next));
    }
  }, [isAuthenticated, playCount, sessionItems]);

  const playRandom = useCallback(() => {
    if (!isAuthenticated && playCount >= MAX_FREE_PLAYS) { setShowGate(true); return; }
    const pool = allVisible.length ? allVisible : sessionItems;
    if (!pool.length) return;
    const item = pool[Math.floor(Math.random() * pool.length)];
    play(item);
  }, [allVisible, sessionItems, play]);

  const playsLeft = Math.max(0, MAX_FREE_PLAYS - playCount);

  return (
    <section className="relative z-20 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-white font-black uppercase tracking-tight text-2xl md:text-3xl mb-2">
            Hear What You've Been Missing
          </h2>
          <p className="text-white/30 text-xs uppercase tracking-widest">
            {isAuthenticated ? 'Unlimited listening' : `${playsLeft} free preview${playsLeft !== 1 ? 's' : ''} left`}
          </p>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 mb-6 border-b border-white/10">
          {TAB_CONFIG.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => { setActiveTab(key); userPickedTab.current = true; if (autoTabRef.current) clearInterval(autoTabRef.current); }}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold uppercase tracking-widest transition-all border-b-2 -mb-px ${
                activeTab === key
                  ? 'border-red-600 text-white'
                  : 'border-transparent text-white/30 hover:text-white/60'
              }`}
            >
              <Icon size={13} />
              {label}
            </button>
          ))}
          <div className="ml-auto">
            {/* Auto-rotate dot indicator */}
            {!userPickedTab.current && (
              <span className="text-white/20 text-[10px] uppercase tracking-widest">auto</span>
            )}
          </div>
        </div>

        {/* Track list */}
        <div className="space-y-2 mb-6">
          {visibleItems.length === 0 && (
            <div className="text-center py-8 text-white/20 text-sm">Loading...</div>
          )}
          {visibleItems.map((item) => {
            const active = currentId === item.id;
            return (
              <button
                key={item.id}
                onClick={() => play(item)}
                className={`w-full flex items-center gap-4 px-4 py-3 border transition-all group ${
                  active
                    ? 'border-red-600/40 bg-red-600/10'
                    : 'border-white/[0.06] bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.06]'
                }`}
              >
                {/* Cover */}
                <div className="relative w-10 h-10 flex-shrink-0 overflow-hidden bg-white/10">
                  {item.coverUrl && <img src={item.coverUrl} alt={item.title} className="w-full h-full object-cover" />}
                  <div className={`absolute inset-0 flex items-center justify-center transition-opacity ${active ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`} style={{ background: 'rgba(0,0,0,0.5)' }}>
                    {active && isPlaying ? <Pause size={14} className="text-white" /> : <Play size={14} className="text-white" />}
                  </div>
                </div>

                {/* Info */}
                <div className="flex-1 text-left min-w-0">
                  <p className={`font-bold text-sm truncate ${active ? 'text-red-400' : 'text-white'}`}>{item.title}</p>
                  <p className="text-white/40 text-xs truncate">{item.artist}</p>
                </div>

                {/* Type badge */}
                <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 border flex-shrink-0 ${
                  item.tab === 'beats' ? 'border-red-600/40 text-red-400 bg-red-600/10' :
                  item.tab === 'remixes' ? 'border-purple-500/40 text-purple-400 bg-purple-500/10' :
                  'border-blue-500/40 text-blue-400 bg-blue-500/10'
                }`}>
                  {item.label}
                </span>

                {/* Lock if gate hit */}
                {!isAuthenticated && playCount >= MAX_FREE_PLAYS && (
                  <Lock size={14} className="text-white/30 flex-shrink-0" />
                )}
              </button>
            );
          })}
        </div>

        {/* Play random CTA */}
        <div className="flex flex-col items-center gap-3">
          <button
            onClick={playRandom}
            className={`flex items-center gap-3 px-8 py-4 font-black uppercase tracking-widest text-sm transition-all ${
              !isAuthenticated && playCount >= MAX_FREE_PLAYS
                ? 'bg-white/5 border border-white/10 text-white/30 cursor-not-allowed'
                : 'bg-red-600 hover:bg-red-700 text-white hover:scale-105 active:scale-95'
            }`}
          >
            <SkipForward size={18} />
            {!isAuthenticated && playCount >= MAX_FREE_PLAYS ? 'Login to Keep Listening' : 'Play Something Random'}
          </button>

          {!isAuthenticated && (
            <p className="text-white/25 text-xs text-center">
              {playCount >= MAX_FREE_PLAYS
                ? 'You\'ve heard the free previews —'
                : `${playsLeft} preview${playsLeft !== 1 ? 's' : ''} remaining —`}
              {' '}
              <a href="/catalogue" className="text-white/50 hover:text-red-400 transition-colors underline underline-offset-2">
                visit the catalogue
              </a>{' '}
              or{' '}
              <a href="/login" className="text-white/50 hover:text-red-400 transition-colors underline underline-offset-2">
                log in
              </a>
              {' '}for unlimited access
            </p>
          )}
        </div>

        {/* Login gate overlay */}
        {showGate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={() => setShowGate(false)}>
            <div className="bg-black border border-white/10 p-8 max-w-sm w-full mx-4 text-center" onClick={e => e.stopPropagation()}>
              <Lock className="w-10 h-10 text-red-500 mx-auto mb-4" />
              <h3 className="text-white font-black uppercase text-xl mb-2">Free previews used</h3>
              <p className="text-white/40 text-sm mb-6 leading-relaxed">
                You've listened to {MAX_FREE_PLAYS} free tracks. Log in or visit the catalogue for unlimited access.
              </p>
              <div className="flex flex-col gap-3">
                <a href="/login" className="py-3 bg-red-600 hover:bg-red-700 text-white font-bold uppercase tracking-widest text-sm transition-all">
                  Log In
                </a>
                <a href="/register" className="py-3 bg-white/10 border border-white/20 text-white font-bold uppercase tracking-widest text-sm hover:bg-white/20 transition-all">
                  Create Account
                </a>
                <button onClick={() => setShowGate(false)} className="text-white/30 text-xs hover:text-white/60 transition-colors">
                  Maybe later
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

// ---- Helpers ----

function buildAll(beats: any[], tracks: any[], remixes: any[]): PreviewItem[] {
  return [
    ...beats.filter(b => b.audioUrl).map(b => ({
      id: `beat-${b.id}`,
      title: b.title,
      artist: b.artist,
      audioUrl: b.audioUrl,
      coverUrl: b.artworkUrl || '',
      tab: 'beats' as TabKey,
      label: 'Beat',
    })),
    ...tracks.filter(t => t.audioUrl).map(t => ({
      id: `track-${t.id}`,
      title: t.title,
      artist: t.artist,
      audioUrl: t.audioUrl,
      coverUrl: t.artworkUrl || '',
      tab: 'tracks' as TabKey,
      label: 'Track',
    })),
    ...remixes.filter(r => r.audioUrl).map(r => ({
      id: `remix-${r.id}`,
      title: r.title,
      artist: r.remixArtist,
      audioUrl: r.audioUrl,
      coverUrl: r.artworkUrl || '',
      tab: 'remixes' as TabKey,
      label: r.remixType || 'Remix',
    })),
  ];
}
