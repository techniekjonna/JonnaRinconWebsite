import { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, SkipForward, Lock, Music, Radio, Disc3 } from 'lucide-react';
import { useBeats } from '../hooks/useBeats';
import { useTracks } from '../hooks/useTracks';
import { useRemixes } from '../hooks/useRemixes';
import { useAuth } from '../contexts/AuthContext';
import { setCurrentTrack, subscribeToPlayerState } from './GlobalAudioPlayer';

type TabKey = 'beats' | 'tracks' | 'remixes';

const MAX_FREE_PLAYS = 5;
const SESSION_COUNT_KEY = 'jr_preview_plays';
const SESSION_IDS_KEY = 'jr_preview_ids';
const SESSION_SEED_KEY = 'jr_seed';

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

function buildAll(beats: any[], tracks: any[], remixes: any[]): PreviewItem[] {
  return [
    ...beats
      .filter(b => b.audioUrl && b.title)
      .map(b => ({
        id: `beat-${b.id}`,
        title: b.title,
        artist: b.artist || 'Jonna Rincon',
        audioUrl: b.audioUrl,
        coverUrl: b.artworkUrl || '',
        tab: 'beats' as TabKey,
        label: 'Beat',
      })),
    ...tracks
      .filter(t => t.audioUrl && t.title)
      .map(t => ({
        id: `track-${t.id}`,
        title: t.title,
        artist: t.artist || 'Jonna Rincon',
        audioUrl: t.audioUrl,
        coverUrl: t.artworkUrl || '',
        tab: 'tracks' as TabKey,
        label: 'Track',
      })),
    ...remixes
      .filter(r => r.audioUrl && r.title)
      .map(r => ({
        id: `remix-${r.id}`,
        title: r.title,
        artist: r.remixArtist || r.artist || 'Jonna Rincon',
        audioUrl: r.audioUrl,
        coverUrl: r.artworkUrl || '',
        tab: 'remixes' as TabKey,
        label: r.remixType || 'Remix',
      })),
  ];
}

export default function MusicPreview() {
  const { isAuthenticated } = useAuth();
  const { beats, loading: beatsLoading } = useBeats({ status: 'published' });
  const { tracks, loading: tracksLoading } = useTracks({ status: 'published' });
  const { remixes, loading: remixesLoading } = useRemixes({ status: 'published' });

  const [activeTab, setActiveTab] = useState<TabKey>('beats');
  const [playCount, setPlayCount] = useState(0);
  const [sessionItems, setSessionItems] = useState<PreviewItem[]>([]);
  const [built, setBuilt] = useState(false);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showGate, setShowGate] = useState(false);
  const autoTabRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const userPickedTab = useRef(false);

  // Restore session data
  useEffect(() => {
    const stored = sessionStorage.getItem(SESSION_COUNT_KEY);
    if (stored) setPlayCount(parseInt(stored, 10));
    if (!sessionStorage.getItem(SESSION_SEED_KEY)) {
      sessionStorage.setItem(SESSION_SEED_KEY, String(Date.now()));
    }
  }, []);

  // Build session items once ALL three hooks have finished loading
  const allLoaded = !beatsLoading && !tracksLoading && !remixesLoading;

  useEffect(() => {
    if (!allLoaded || built) return;

    const seed = parseInt(sessionStorage.getItem(SESSION_SEED_KEY) || String(Date.now()), 10);
    const all = buildAll(beats, tracks, remixes);

    if (all.length === 0) return; // wait — data might still arrive

    const storedIds = sessionStorage.getItem(SESSION_IDS_KEY);
    if (storedIds) {
      const ids: string[] = JSON.parse(storedIds);
      const matched = ids.map(id => all.find(i => i.id === id)).filter(Boolean) as PreviewItem[];
      if (matched.length >= Math.min(MAX_FREE_PLAYS, all.length)) {
        setSessionItems(matched.slice(0, MAX_FREE_PLAYS));
        setBuilt(true);
        // Set default tab to whichever has items
        pickDefaultTab(matched);
        return;
      }
    }

    const shuffled = seededShuffle(all, seed);
    const chosen = shuffled.slice(0, MAX_FREE_PLAYS);
    setSessionItems(chosen);
    setBuilt(true);
    sessionStorage.setItem(SESSION_IDS_KEY, JSON.stringify(chosen.map(i => i.id)));
    pickDefaultTab(chosen);
  }, [allLoaded, built, beats, tracks, remixes]);

  function pickDefaultTab(items: PreviewItem[]) {
    if (userPickedTab.current) return;
    // Default to first tab that has items
    for (const tab of ['beats', 'tracks', 'remixes'] as TabKey[]) {
      if (items.some(i => i.tab === tab)) { setActiveTab(tab); return; }
    }
  }

  // Auto-rotate tab every 4s unless user picked one
  useEffect(() => {
    if (!built || userPickedTab.current) return;
    const tabs = TAB_CONFIG.map(t => t.key).filter(k => sessionItems.some(i => i.tab === k));
    if (tabs.length <= 1) return;
    autoTabRef.current = setInterval(() => {
      if (!userPickedTab.current) {
        setActiveTab(prev => {
          const idx = tabs.indexOf(prev);
          return tabs[(idx + 1) % tabs.length];
        });
      }
    }, 4000);
    return () => { if (autoTabRef.current) clearInterval(autoTabRef.current); };
  }, [built, sessionItems]);

  // Sync play/pause with global player
  useEffect(() => {
    return subscribeToPlayerState((state) => {
      setIsPlaying(state.isPlaying && state.currentTrack?.id === currentId);
    });
  }, [currentId]);

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
    setCurrentTrack(
      { id: item.id, title: item.title, artist: item.artist, audioUrl: item.audioUrl, coverArt: item.coverUrl },
      queue
    );
    setCurrentId(item.id);
    setIsPlaying(true);
    if (!isAuthenticated) {
      const next = playCount + 1;
      setPlayCount(next);
      sessionStorage.setItem(SESSION_COUNT_KEY, String(next));
    }
  }, [isAuthenticated, playCount, sessionItems]);

  const playRandom = useCallback(() => {
    if (!isAuthenticated && playCount >= MAX_FREE_PLAYS) { setShowGate(true); return; }
    if (!sessionItems.length) return;
    const item = sessionItems[Math.floor(Math.random() * sessionItems.length)];
    play(item);
  }, [sessionItems, play, isAuthenticated, playCount]);

  const visibleItems = sessionItems.filter(i => i.tab === activeTab);
  const playsLeft = Math.max(0, MAX_FREE_PLAYS - playCount);
  const isLocked = !isAuthenticated && playCount >= MAX_FREE_PLAYS;
  const loading = !allLoaded || (!built && sessionItems.length === 0);

  return (
    <section className="relative z-20 py-12 px-4">
      <div className="max-w-4xl mx-auto">

        {/* Section header */}
        <div className="mb-8 flex items-center gap-4">
          <div className="h-px flex-1 bg-white/10" />
          <span className="text-white/30 text-xs uppercase tracking-widest">Preview</span>
          <div className="h-px flex-1 bg-white/10" />
        </div>

        {/* Title */}
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
          {TAB_CONFIG.map(({ key, label, icon: Icon }) => {
            const hasItems = sessionItems.some(i => i.tab === key);
            return (
              <button
                key={key}
                onClick={() => {
                  setActiveTab(key);
                  userPickedTab.current = true;
                  if (autoTabRef.current) clearInterval(autoTabRef.current);
                }}
                disabled={!hasItems && built}
                className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold uppercase tracking-widest transition-all border-b-2 -mb-px ${
                  activeTab === key
                    ? 'border-red-600 text-white'
                    : hasItems || !built
                    ? 'border-transparent text-white/30 hover:text-white/60'
                    : 'border-transparent text-white/15 cursor-not-allowed'
                }`}
              >
                <Icon size={13} />
                {label}
              </button>
            );
          })}
          {!userPickedTab.current && built && (
            <span className="ml-auto text-white/20 text-[10px] uppercase tracking-widest">auto</span>
          )}
        </div>

        {/* Track list */}
        <div className="space-y-2 mb-6 min-h-[120px]">
          {loading && (
            <div className="flex items-center justify-center py-10">
              <div className="w-6 h-6 border-2 border-white/20 border-t-red-600 rounded-full animate-spin" />
            </div>
          )}

          {!loading && visibleItems.length === 0 && (
            <div className="text-center py-10">
              <p className="text-white/25 text-sm">No {activeTab} available right now</p>
              <p className="text-white/15 text-xs mt-1">Try another tab</p>
            </div>
          )}

          {!loading && visibleItems.map((item) => {
            const active = currentId === item.id;
            return (
              <button
                key={item.id}
                onClick={() => play(item)}
                className={`w-full flex items-center gap-4 px-4 py-3 border transition-all group text-left ${
                  active
                    ? 'border-red-600/40 bg-red-600/10'
                    : 'border-white/[0.06] bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.06]'
                }`}
              >
                {/* Cover */}
                <div className="relative w-10 h-10 flex-shrink-0 overflow-hidden bg-white/10">
                  {item.coverUrl && (
                    <img src={item.coverUrl} alt={item.title} className="w-full h-full object-cover" />
                  )}
                  <div
                    className={`absolute inset-0 flex items-center justify-center transition-opacity bg-black/50 ${
                      active ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                    }`}
                  >
                    {active && isPlaying
                      ? <Pause size={14} className="text-white" />
                      : <Play size={14} className="text-white" />
                    }
                  </div>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className={`font-bold text-sm truncate ${active ? 'text-red-400' : 'text-white'}`}>
                    {item.title}
                  </p>
                  <p className="text-white/40 text-xs truncate">{item.artist}</p>
                </div>

                {/* Type badge */}
                <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 border flex-shrink-0 ${
                  item.tab === 'beats'
                    ? 'border-red-600/40 text-red-400 bg-red-600/10'
                    : item.tab === 'remixes'
                    ? 'border-purple-500/40 text-purple-400 bg-purple-500/10'
                    : 'border-blue-500/40 text-blue-400 bg-blue-500/10'
                }`}>
                  {item.label}
                </span>

                {isLocked && <Lock size={13} className="text-white/25 flex-shrink-0" />}
              </button>
            );
          })}
        </div>

        {/* Play random CTA */}
        <div className="flex flex-col items-center gap-3 mb-8">
          <button
            onClick={playRandom}
            disabled={isLocked || loading}
            className={`flex items-center gap-3 px-8 py-4 font-black uppercase tracking-widest text-sm transition-all ${
              isLocked || loading
                ? 'bg-white/5 border border-white/10 text-white/30 cursor-not-allowed'
                : 'bg-red-600 hover:bg-red-700 text-white hover:scale-105 active:scale-95'
            }`}
          >
            <SkipForward size={18} />
            {isLocked ? 'Login to Keep Listening' : 'Play Something Random'}
          </button>

          {!isAuthenticated && (
            <p className="text-white/25 text-xs text-center">
              {isLocked ? 'Free previews used —' : `${playsLeft} left —`}
              {' '}
              <a href="/catalogue" className="text-white/40 hover:text-red-400 transition-colors underline underline-offset-2">
                full catalogue
              </a>
              {' '}or{' '}
              <a href="/login" className="text-white/40 hover:text-red-400 transition-colors underline underline-offset-2">
                log in
              </a>
              {' '}for unlimited access
            </p>
          )}
        </div>

        {/* Mix master CTA */}
        <a
          href="/services"
          className="flex items-center justify-between px-4 py-4 border border-white/10 hover:border-red-600/40 bg-white/[0.03] hover:bg-white/[0.06] transition-all duration-300 group"
        >
          <span className="text-white/40 text-sm group-hover:text-white/70 transition-colors">
            Need a Mix master or want to book a studio session?
          </span>
          <span className="text-red-500 text-sm font-bold uppercase tracking-widest group-hover:text-red-400 transition-colors">
            Click here →
          </span>
        </a>
      </div>

      {/* Login gate overlay */}
      {showGate && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={() => setShowGate(false)}
        >
          <div
            className="bg-black border border-white/10 p-8 max-w-sm w-full mx-4 text-center"
            onClick={e => e.stopPropagation()}
          >
            <Lock className="w-10 h-10 text-red-500 mx-auto mb-4" />
            <h3 className="text-white font-black uppercase text-xl mb-2">Free previews used</h3>
            <p className="text-white/40 text-sm mb-6 leading-relaxed">
              You've listened to {MAX_FREE_PLAYS} free tracks. Log in for unlimited access.
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
    </section>
  );
}
