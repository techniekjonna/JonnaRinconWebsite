import { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, SkipForward, Lock, Music, Radio, Disc3 } from 'lucide-react';
import { useBeats } from '../hooks/useBeats';
import { useTracks } from '../hooks/useTracks';
import { useRemixes } from '../hooks/useRemixes';
import { useAuth } from '../contexts/AuthContext';
import { setCurrentTrack, subscribeToPlayerState } from './GlobalAudioPlayer';

type TabKey = 'beats' | 'tracks' | 'remixes';

const MAX_PER_TAB = 5;
const SESSION_COUNTS_KEY = 'jr_tab_plays';   // { beats: n, tracks: n, remixes: n }
const SESSION_IDS_KEY    = 'jr_preview_ids'; // { beats: [...], tracks: [...], remixes: [...] }
const SESSION_SEED_KEY   = 'jr_seed';

interface PreviewItem {
  id: string;
  title: string;
  artist: string;
  audioUrl: string;
  coverUrl: string;
  tab: TabKey;
  label: string;
}

type TabItems = Record<TabKey, PreviewItem[]>;
type TabCounts = Record<TabKey, number>;

const TAB_CONFIG: { key: TabKey; label: string; icon: typeof Music }[] = [
  { key: 'beats',   label: 'Beats',   icon: Music  },
  { key: 'tracks',  label: 'Tracks',  icon: Disc3  },
  { key: 'remixes', label: 'Remixes', icon: Radio  },
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

function toDirectUrl(url: string): string {
  if (!url) return url;
  if (url.includes('/index.php/s/') && !url.endsWith('/download')) {
    return url.replace(/\/?$/, '/download');
  }
  return url;
}

function buildByTab(beats: any[], tracks: any[], remixes: any[]): TabItems {
  return {
    beats: beats
      .filter(b => b.title && (b.audioUrl || b.audio_url))
      .map(b => ({
        id: `beat-${b.id}`,
        title: b.title,
        artist: b.artist || 'Jonna Rincon',
        audioUrl: toDirectUrl(b.audioUrl || b.audio_url || ''),
        coverUrl: toDirectUrl(b.artworkUrl || b.artwork_url || ''),
        tab: 'beats' as TabKey,
        label: 'Beat',
      })),
    tracks: tracks
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
    remixes: remixes
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
  };
}

export default function MusicPreview() {
  const { isAuthenticated } = useAuth();
  const { beats, loading: beatsLoading } = useBeats({ status: 'published' });
  const { tracks, loading: tracksLoading } = useTracks({ status: 'published' });
  const { remixes, loading: remixesLoading } = useRemixes({ status: 'published' });

  const [activeTab, setActiveTab] = useState<TabKey>('beats');
  const [tabCounts, setTabCounts] = useState<TabCounts>({ beats: 0, tracks: 0, remixes: 0 });
  const [sessionItems, setSessionItems] = useState<TabItems>({ beats: [], tracks: [], remixes: [] });
  const [built, setBuilt] = useState(false);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showGate, setShowGate] = useState(false);
  const autoTabRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const userPickedTab = useRef(false);

  // Restore session counts
  useEffect(() => {
    const stored = sessionStorage.getItem(SESSION_COUNTS_KEY);
    if (stored) setTabCounts(JSON.parse(stored));
    if (!sessionStorage.getItem(SESSION_SEED_KEY)) {
      sessionStorage.setItem(SESSION_SEED_KEY, String(Date.now()));
    }
  }, []);

  const allLoaded = !beatsLoading && !tracksLoading && !remixesLoading;

  useEffect(() => {
    if (!allLoaded || built) return;
    const seed = parseInt(sessionStorage.getItem(SESSION_SEED_KEY) || String(Date.now()), 10);
    const byTab = buildByTab(beats, tracks, remixes);
    if (!byTab.beats.length && !byTab.tracks.length && !byTab.remixes.length) return;

    const storedRaw = sessionStorage.getItem(SESSION_IDS_KEY);
    let chosen: TabItems;

    if (storedRaw) {
      const storedIds: Record<TabKey, string[]> = JSON.parse(storedRaw);
      chosen = {
        beats:   (storedIds.beats   ?? []).map(id => byTab.beats.find(i => i.id === id)).filter(Boolean) as PreviewItem[],
        tracks:  (storedIds.tracks  ?? []).map(id => byTab.tracks.find(i => i.id === id)).filter(Boolean) as PreviewItem[],
        remixes: (storedIds.remixes ?? []).map(id => byTab.remixes.find(i => i.id === id)).filter(Boolean) as PreviewItem[],
      };
      // If we got enough, use them; otherwise fall through to reshuffle
      const ok = (['beats','tracks','remixes'] as TabKey[]).every(
        k => chosen[k].length >= Math.min(MAX_PER_TAB, byTab[k].length)
      );
      if (ok) { setSessionItems(chosen); setBuilt(true); pickDefaultTab(chosen); return; }
    }

    chosen = {
      beats:   seededShuffle(byTab.beats,   seed).slice(0, MAX_PER_TAB),
      tracks:  seededShuffle(byTab.tracks,  seed + 1).slice(0, MAX_PER_TAB),
      remixes: seededShuffle(byTab.remixes, seed + 2).slice(0, MAX_PER_TAB),
    };
    setSessionItems(chosen);
    setBuilt(true);
    sessionStorage.setItem(SESSION_IDS_KEY, JSON.stringify({
      beats:   chosen.beats.map(i => i.id),
      tracks:  chosen.tracks.map(i => i.id),
      remixes: chosen.remixes.map(i => i.id),
    }));
    pickDefaultTab(chosen);
  }, [allLoaded, built, beats, tracks, remixes]);

  function pickDefaultTab(items: TabItems) {
    if (userPickedTab.current) return;
    for (const tab of ['beats', 'tracks', 'remixes'] as TabKey[]) {
      if (items[tab].length > 0) { setActiveTab(tab); return; }
    }
  }

  // Auto-rotate tabs every 4s
  useEffect(() => {
    if (!built || userPickedTab.current) return;
    const tabs = TAB_CONFIG.map(t => t.key).filter(k => sessionItems[k].length > 0);
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

  useEffect(() => {
    return subscribeToPlayerState((state) => {
      setIsPlaying(state.isPlaying && state.currentTrack?.id === currentId);
    });
  }, [currentId]);

  const play = useCallback((item: PreviewItem) => {
    const count = tabCounts[item.tab];
    if (count >= MAX_PER_TAB) {
      setShowGate(true);
      return;
    }
    const tabQueue = sessionItems[item.tab].map(i => ({
      id: i.id, title: i.title, artist: i.artist, audioUrl: i.audioUrl, coverArt: i.coverUrl,
    }));
    setCurrentTrack(
      { id: item.id, title: item.title, artist: item.artist, audioUrl: item.audioUrl, coverArt: item.coverUrl },
      tabQueue
    );
    setCurrentId(item.id);
    setIsPlaying(true);
    const next = { ...tabCounts, [item.tab]: count + 1 };
    setTabCounts(next);
    sessionStorage.setItem(SESSION_COUNTS_KEY, JSON.stringify(next));
  }, [tabCounts, sessionItems]);

  const playRandom = useCallback(() => {
    const count = tabCounts[activeTab];
    if (count >= MAX_PER_TAB) { setShowGate(true); return; }
    const pool = sessionItems[activeTab];
    if (!pool.length) return;
    play(pool[Math.floor(Math.random() * pool.length)]);
  }, [activeTab, tabCounts, sessionItems, play]);

  const visibleItems = sessionItems[activeTab];
  const playsLeft = Math.max(0, MAX_PER_TAB - tabCounts[activeTab]);
  const isLocked = tabCounts[activeTab] >= MAX_PER_TAB;
  const loading = !allLoaded || (!built && !Object.values(sessionItems).some(a => a.length > 0));

  return (
    <section className="relative z-20 py-12 px-4">
      <div className="max-w-4xl mx-auto">

        <div className="mb-8 flex items-center gap-4">
          <div className="h-px flex-1 bg-white/10" />
          <span className="text-white/30 text-xs uppercase tracking-widest">Preview</span>
          <div className="h-px flex-1 bg-white/10" />
        </div>

        <div className="text-center mb-8">
          <h2 className="text-white font-black uppercase tracking-tight text-2xl md:text-3xl mb-2">
            Hear What You've Been Missing
          </h2>
          <p className="text-white/30 text-xs uppercase tracking-widest">
            {playsLeft} preview{playsLeft !== 1 ? 's' : ''} left in this tab
          </p>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 mb-6 border-b border-white/10">
          {TAB_CONFIG.map(({ key, label, icon: Icon }) => {
            const hasItems = sessionItems[key].length > 0;
            const tabLeft = Math.max(0, MAX_PER_TAB - tabCounts[key]);
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
                {built && hasItems && (
                  <span className={`text-[10px] ml-1 ${tabCounts[key] >= MAX_PER_TAB ? 'text-red-500/60' : 'text-white/20'}`}>
                    {tabLeft}/{MAX_PER_TAB}
                  </span>
                )}
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
              <p className="text-white/25 text-sm">No {activeTab} available</p>
            </div>
          )}
          {!loading && visibleItems.map((item) => {
            const active = currentId === item.id;
            const locked = tabCounts[item.tab] >= MAX_PER_TAB;
            return (
              <button
                key={item.id}
                onClick={() => play(item)}
                className={`w-full flex items-center gap-4 px-4 py-3 border transition-all group text-left ${
                  active ? 'border-red-600/40 bg-red-600/10'
                  : locked ? 'border-white/[0.04] bg-white/[0.02] opacity-50 cursor-not-allowed'
                  : 'border-white/[0.06] bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.06]'
                }`}
              >
                <div className="relative w-10 h-10 flex-shrink-0 overflow-hidden bg-white/10">
                  {item.coverUrl && <img src={item.coverUrl} alt={item.title} className="w-full h-full object-cover" />}
                  <div className={`absolute inset-0 flex items-center justify-center bg-black/50 transition-opacity ${active ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                    {locked ? <Lock size={12} className="text-white/50" />
                      : active && isPlaying ? <Pause size={14} className="text-white" />
                      : <Play size={14} className="text-white" />}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`font-bold text-sm truncate ${active ? 'text-red-400' : 'text-white'}`}>{item.title}</p>
                  <p className="text-white/40 text-xs truncate">{item.artist}</p>
                </div>
                <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 border flex-shrink-0 ${
                  item.tab === 'beats' ? 'border-red-600/40 text-red-400 bg-red-600/10'
                  : item.tab === 'remixes' ? 'border-purple-500/40 text-purple-400 bg-purple-500/10'
                  : 'border-blue-500/40 text-blue-400 bg-blue-500/10'
                }`}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Play random + links */}
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
            Play Something Random
          </button>

          <p className="text-white/25 text-xs text-center leading-relaxed">
            or listen to all the{' '}
            <a href="/catalogue" className="text-white/60 font-bold hover:text-red-400 transition-colors">Tracks</a>
            {', '}
            <a href="/catalogue" className="text-white/60 font-bold hover:text-red-400 transition-colors">Remixes</a>
            {' '}or{' '}
            <a href="/shop/beats" className="text-white/60 font-bold hover:text-red-400 transition-colors">Beats</a>
          </p>
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

      {/* Gate modal */}
      {showGate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={() => setShowGate(false)}>
          <div className="bg-black border border-white/10 p-8 max-w-sm w-full mx-4 text-center" onClick={e => e.stopPropagation()}>
            <Lock className="w-10 h-10 text-red-500 mx-auto mb-4" />
            <h3 className="text-white font-black uppercase text-xl mb-2">5 previews heard</h3>
            <p className="text-white/40 text-sm mb-2 leading-relaxed">
              You've used all {MAX_PER_TAB} previews for this tab.
            </p>
            <p className="text-white/30 text-xs mb-6">Switch tabs for more, or visit the full catalogue.</p>
            <div className="flex flex-col gap-3">
              {isAuthenticated ? (
                <>
                  <a href="/catalogue" className="py-3 bg-red-600 hover:bg-red-700 text-white font-bold uppercase tracking-widest text-sm transition-all">Full Catalogue</a>
                  <a href="/shop/beats" className="py-3 bg-white/10 border border-white/20 text-white font-bold uppercase tracking-widest text-sm hover:bg-white/20 transition-all">Beat Shop</a>
                </>
              ) : (
                <>
                  <a href="/login" className="py-3 bg-red-600 hover:bg-red-700 text-white font-bold uppercase tracking-widest text-sm transition-all">Log In</a>
                  <a href="/register" className="py-3 bg-white/10 border border-white/20 text-white font-bold uppercase tracking-widest text-sm hover:bg-white/20 transition-all">Create Account</a>
                </>
              )}
              <button onClick={() => setShowGate(false)} className="text-white/30 text-xs hover:text-white/60 transition-colors">Maybe later</button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
