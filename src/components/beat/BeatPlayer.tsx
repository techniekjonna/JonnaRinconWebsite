import { useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';
import {
  getIsPlaying, setIsPlaying as setGlobalPlaying, setCurrentTrack, seekPlayer, subscribeToPlayerTime, PlayerTime,
} from '../GlobalAudioPlayer';
import { withAlpha } from '../../lib/coverColor';
import { useT } from '../../contexts/LanguageContext';

interface Props {
  src: string;
  seed: string;
  accent: string;
  /** Track info for the site-wide player at the bottom of the page */
  track: { id: string; title: string; artist: string; coverArt?: string };
  /** Length as stored on the beat, shown before the audio has loaded */
  durationLabel?: string;
  onFirstPlay?: () => void;
}

const BAR_COUNT = 72;

function toDirect(url: string): string {
  if (url && url.includes('/index.php/s/') && !url.endsWith('/download')) {
    return url.replace(/\/?$/, '/download');
  }
  return url;
}

function fmt(sec: number): string {
  if (!isFinite(sec) || sec < 0) return '0:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

// A decorative waveform that is stable per beat (seeded by its id)
function bars(seed: string): number[] {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  const out: number[] = [];
  for (let i = 0; i < BAR_COUNT; i++) {
    h = (h * 1103515245 + 12345) >>> 0;
    const rnd = (h % 1000) / 1000;
    const shape = 0.55 + 0.45 * Math.sin((i / BAR_COUNT) * Math.PI);
    out.push(Math.max(0.12, Math.min(1, shape * (0.45 + rnd * 0.6))));
  }
  return out;
}

/**
 * Plays the beat through the site-wide player (bottom bar), so the music keeps
 * going while you scroll or open another page. This waveform shows and controls
 * the same playback.
 */
export default function BeatPlayer({ src, seed, accent, track, durationLabel, onFirstPlay }: Props) {
  const t = useT();
  const trackRef = useRef<HTMLDivElement>(null);
  const firstPlayDone = useRef(false);
  const pendingRatio = useRef<number | null>(null);
  const [live, setLive] = useState<PlayerTime>({ trackId: null, currentTime: 0, duration: 0, playing: false });
  const [dragTime, setDragTime] = useState<number | null>(null);
  const [dragging, setDragging] = useState(false);
  const wave = useMemo(() => bars(seed), [seed]);

  useEffect(() => subscribeToPlayerTime(setLive), []);

  const isCurrent = live.trackId === track.id;
  const playing = isCurrent && live.playing;
  const duration = isCurrent && live.duration ? live.duration : 0;
  const time = dragTime ?? (isCurrent ? live.currentTime : 0);

  // A tap on the waveform before playing: jump there once the audio is loaded
  useEffect(() => {
    if (isCurrent && duration && pendingRatio.current !== null) {
      seekPlayer(pendingRatio.current * duration);
      pendingRatio.current = null;
    }
  }, [isCurrent, duration]);

  const startHere = () => {
    setCurrentTrack({ ...track, audioUrl: toDirect(src), _isBeat: true } as any, [{ ...track, audioUrl: toDirect(src), _isBeat: true } as any]);
    if (!firstPlayDone.current) { firstPlayDone.current = true; onFirstPlay?.(); }
  };

  const toggle = () => {
    if (!isCurrent) { startHere(); return; }
    setGlobalPlaying(!getIsPlaying());
  };

  const ratioAt = (clientX: number) => {
    const el = trackRef.current;
    if (!el) return 0;
    const rect = el.getBoundingClientRect();
    return Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
  };

  const onPointerDown = (e: React.PointerEvent) => {
    const ratio = ratioAt(e.clientX);
    if (!isCurrent || !duration) {
      pendingRatio.current = ratio;
      if (!isCurrent) startHere();
      return;
    }
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    setDragging(true);
    setDragTime(ratio * duration);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (dragging && duration) setDragTime(ratioAt(e.clientX) * duration);
  };
  const onPointerUp = () => {
    if (dragging && dragTime !== null) seekPlayer(dragTime);
    setDragging(false);
    setDragTime(null);
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (!isCurrent || !duration) return;
    if (e.key === 'ArrowRight') { seekPlayer(Math.min(duration, time + 5)); e.preventDefault(); }
    if (e.key === 'ArrowLeft') { seekPlayer(Math.max(0, time - 5)); e.preventDefault(); }
  };

  const progress = duration ? time / duration : 0;

  return (
    <div
      className="rounded-2xl border p-4 md:p-5 backdrop-blur-md"
      style={{ borderColor: withAlpha(accent, 0.25), background: `linear-gradient(135deg, ${withAlpha(accent, 0.12)}, rgba(255,255,255,0.03))` }}
    >
      <div className="flex items-center gap-4">
        <button
          onClick={toggle}
          aria-label={playing ? t('Pause', 'Pauzeren') : t('Play', 'Afspelen')}
          className="w-14 h-14 flex-shrink-0 rounded-full flex items-center justify-center text-white shadow-lg transition-transform hover:scale-105 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
          style={{ background: accent, boxShadow: `0 10px 30px ${withAlpha(accent, 0.45)}` }}
        >
          {playing ? <Pause size={22} fill="currentColor" /> : <Play size={22} fill="currentColor" className="ml-1" />}
        </button>

        <div className="flex-1 min-w-0">
          <div
            ref={trackRef}
            role="slider"
            tabIndex={0}
            aria-label={t('Seek', 'Doorspoelen')}
            aria-valuemin={0}
            aria-valuemax={Math.round(duration) || 0}
            aria-valuenow={Math.round(time)}
            aria-valuetext={`${fmt(time)} / ${fmt(duration)}`}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            onKeyDown={onKey}
            className="relative h-14 flex items-center gap-[2px] cursor-pointer touch-none select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 rounded"
          >
            {wave.map((v, i) => {
              const played = i / BAR_COUNT < progress;
              return (
                <span
                  key={i}
                  className="flex-1 rounded-full transition-colors duration-150"
                  style={{ height: `${v * 100}%`, background: played ? accent : 'rgba(255,255,255,0.18)' }}
                />
              );
            })}
            <span
              className="absolute top-0 bottom-0 w-0.5 bg-white rounded-full pointer-events-none"
              style={{ left: `${progress * 100}%`, opacity: duration ? 1 : 0 }}
            />
          </div>
          <div className="flex items-center justify-between mt-1.5 text-xs tabular-nums text-white/50">
            <span>{fmt(time)}</span>
            <button
              onClick={() => { if (isCurrent) seekPlayer(0); }}
              className="inline-flex items-center gap-1 hover:text-white transition-colors"
              aria-label={t('Back to start', 'Terug naar begin')}
            >
              <RotateCcw size={11} />
            </button>
            <span>{duration ? fmt(duration) : (durationLabel || '0:00')}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
