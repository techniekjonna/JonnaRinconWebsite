import React, { useRef, useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Play, Pause, SkipBack, SkipForward, Shuffle, Repeat, Volume2, VolumeX, X } from 'lucide-react';
import { formatDuration } from '../lib/utils/audioMetadata';
import {
  toggleShuffle,
  getIsShuffle,
  getCurrentIndex,
  getQueue
} from './GlobalAudioPlayer';
import ModalPortal from './ModalPortal';
import { useT } from '../contexts/LanguageContext';

interface PlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  audioRef: React.RefObject<HTMLAudioElement>;
  isPlaying: boolean;
  onPlayPauseClick: () => void;
  currentTime: number;
  duration: number;
  onProgressChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  volume: number;
  onVolumeChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isMuted: boolean;
  onMuteToggle: () => void;
  repeat: 'off' | 'all' | 'one';
  onRepeatToggle: () => void;
  onPreviousClick: () => void;
  onNextClick: () => void;
  onInfoClick?: () => void;
  track: { title: string; artist: string; coverArt?: string } | null;
  trackDetail?: any;
}

export default function PlayerModal({
  isOpen,
  onClose,
  isPlaying,
  onPlayPauseClick,
  currentTime,
  duration,
  onProgressChange,
  volume,
  onVolumeChange,
  isMuted,
  onMuteToggle,
  repeat,
  onRepeatToggle,
  onPreviousClick,
  onNextClick,
  track,
  trackDetail,
}: PlayerModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const isShuffle = getIsShuffle();
  const [page, setPage] = useState<'player' | 'info'>('player');
  const t = useT();

  // Panel open/close mechanics — mirrors Navigation.tsx's side panel:
  // keep rendering (with the slide-out animation) for a beat after isOpen
  // goes false, instead of unmounting immediately.
  const [isClosing, setIsClosing] = useState(false);
  const wasOpenRef = useRef(false);
  const closeTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (closeTimeout.current) {
        clearTimeout(closeTimeout.current);
        closeTimeout.current = null;
      }
      setIsClosing(false);
      wasOpenRef.current = true;
    } else if (wasOpenRef.current) {
      wasOpenRef.current = false;
      setIsClosing(true);
      closeTimeout.current = setTimeout(() => {
        setIsClosing(false);
      }, 500);
    }
  }, [isOpen]);

  useEffect(() => {
    return () => {
      if (closeTimeout.current) clearTimeout(closeTimeout.current);
    };
  }, []);

  // Reset to player view when modal closes or track changes
  useEffect(() => {
    if (!isOpen) setPage('player');
  }, [isOpen]);

  useEffect(() => {
    setPage('player');
  }, [track?.title]);

  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  const panelVisible = isOpen || isClosing;

  useEffect(() => {
    document.body.style.overflow = panelVisible ? 'hidden' : 'auto';
    return () => { document.body.style.overflow = 'auto'; };
  }, [panelVisible]);

  if (!panelVisible || !track) return null;

  const progressPct = duration ? (currentTime / duration) * 100 : 0;
  const volumePct = (isMuted ? 0 : volume) * 100;
  const queueLen = getQueue().length;
  const queueIdx = getCurrentIndex() || 0;

  const detail = trackDetail || track;
  const hasDetail = !!(detail?.genre || detail?.bpm || detail?.key || detail?.year || detail?.type || detail?.remixType || detail?.collab);

  return (
    <ModalPortal>
      {/* Backdrop — subtle dark overlay, same mechanics as the nav side panel */}
      <div
        className={`fixed inset-0 z-[300] transition-opacity duration-500 ${
          isClosing ? 'opacity-0' : 'opacity-100'
        }`}
        style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
        onClick={onClose}
      />

      {/* Side Panel — slides in from the left (the player button lives on the
          left of the header, unlike the hamburger menu's panel on the right),
          same sizing/timing as Navigation.tsx otherwise */}
      <div
        ref={modalRef}
        className={`fixed top-0 left-0 bottom-0 z-[301] w-full md:w-[480px] lg:w-[520px] md:border-r md:border-white/[0.06] ${
          isClosing ? 'animate-panel-slide-out' : 'animate-panel-slide-in'
        }`}
      >
        {/* Panel background — glassmorphism, matches nav panel */}
        <div className="absolute inset-0 bg-black/70 backdrop-blur-2xl" style={{ WebkitBackdropFilter: 'blur(40px)' }} />

        {/* Panel content */}
        <div className="relative z-10 h-full flex flex-col px-6 md:px-10" onClick={(e) => e.stopPropagation()}>

          {/* Top bar */}
          <div className="flex items-center justify-between py-5 md:py-6 flex-shrink-0">
            <button
              onClick={page === 'info' ? () => setPage('player') : onClose}
              className="p-2 rounded-full text-white/40 hover:text-white hover:bg-white/[0.08] transition-all"
              title={page === 'info' ? t('Back', 'Terug') : t('Close', 'Sluiten')}
            >
              {page === 'info' ? <ChevronLeft size={22} /> : <X size={22} />}
            </button>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/30">
              {page === 'info' ? t('Track Info', 'Track Info') : (queueLen > 0 ? `${queueIdx + 1} / ${queueLen}` : t('Now Playing', 'Nu Speelt'))}
            </p>
            {page === 'player' && hasDetail ? (
              <button
                onClick={() => setPage('info')}
                className="p-2 rounded-full text-white/40 hover:text-white hover:bg-white/[0.08] transition-all text-[10px] font-bold uppercase tracking-wider"
                title={t('Track details', 'Track details')}
              >
                <ChevronRight size={18} />
              </button>
            ) : (
              <div className="w-9" />
            )}
          </div>

          {/* Divider */}
          <div className="w-full h-px bg-white/[0.06] mb-4 flex-shrink-0" />

          {/* Scrollable content */}
          <div className="overflow-y-auto flex-1 pb-10">

            {/* ── PLAYER PAGE ── */}
            {page === 'player' && (
              <>
                {/* Cover Art */}
                <div className="pt-1 pb-5 max-w-sm mx-auto">
                  {track.coverArt ? (
                    <div className="relative aspect-square rounded-2xl overflow-hidden shadow-2xl shadow-black/60">
                      <img src={track.coverArt} alt={track.title} className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="aspect-square rounded-2xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center">
                      <div className="w-16 h-16 rounded-full bg-red-600/20 flex items-center justify-center">
                        <Play size={28} className="text-red-400 ml-1" />
                      </div>
                    </div>
                  )}
                </div>

                {/* Track info */}
                <div className="pb-5 max-w-sm mx-auto">
                  <h2 className="text-2xl font-black text-white truncate leading-tight">{track.title}</h2>
                  <p className="text-base text-white/50 mt-0.5 truncate">{track.artist}</p>
                </div>

                {/* Progress bar */}
                <div className="pb-2 max-w-sm mx-auto">
                  <input
                    type="range"
                    min="0"
                    max={duration || 0}
                    value={currentTime}
                    onChange={onProgressChange}
                    className="player-modal-range w-full cursor-pointer"
                    style={{
                      WebkitAppearance: 'none',
                      appearance: 'none',
                      height: '5px',
                      borderRadius: '99px',
                      background: `linear-gradient(to right, #fff 0%, #fff ${progressPct}%, rgba(255,255,255,0.15) ${progressPct}%, rgba(255,255,255,0.15) 100%)`,
                    }}
                  />
                  <div className="flex justify-between text-xs text-white/30 mt-2">
                    <span>{formatDuration(currentTime)}</span>
                    <span>{formatDuration(duration)}</span>
                  </div>
                </div>

                {/* Main controls */}
                <div className="py-4 flex items-center justify-between max-w-sm mx-auto">
                  <button
                    onClick={toggleShuffle}
                    className={`p-2 rounded-full transition-all relative ${isShuffle ? 'text-red-400' : 'text-white/30 hover:text-white'}`}
                    title="Shuffle"
                  >
                    <Shuffle size={20} />
                    {isShuffle && (
                      <span className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-red-400" />
                    )}
                  </button>

                  <button
                    onClick={onPreviousClick}
                    className="p-3 text-white/70 hover:text-white transition-colors"
                    title="Previous"
                  >
                    <SkipBack size={26} fill="currentColor" />
                  </button>

                  <button
                    onClick={onPlayPauseClick}
                    className="w-16 h-16 rounded-full bg-white hover:bg-white/90 active:scale-95 flex items-center justify-center transition-all shadow-lg"
                    title={isPlaying ? 'Pause' : 'Play'}
                  >
                    {isPlaying ? (
                      <Pause size={28} className="text-black" fill="currentColor" />
                    ) : (
                      <Play size={28} className="text-black ml-1" fill="currentColor" />
                    )}
                  </button>

                  <button
                    onClick={onNextClick}
                    className="p-3 text-white/70 hover:text-white transition-colors"
                    title="Next"
                  >
                    <SkipForward size={26} fill="currentColor" />
                  </button>

                  <button
                    onClick={onRepeatToggle}
                    className={`p-2 rounded-full transition-all relative ${repeat !== 'off' ? 'text-red-400' : 'text-white/30 hover:text-white'}`}
                    title={repeat === 'off' ? 'Repeat off' : repeat === 'all' ? 'Repeat all' : 'Repeat 1x'}
                  >
                    <Repeat size={20} />
                    {repeat === 'one' && (
                      <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
                        1
                      </span>
                    )}
                    {repeat !== 'off' && (
                      <span className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-red-400" />
                    )}
                  </button>
                </div>

                {/* Volume control */}
                <div className="pb-7 flex items-center gap-3 max-w-sm mx-auto">
                  <button onClick={onMuteToggle} className="text-white/30 hover:text-white transition-colors flex-shrink-0">
                    {isMuted || volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={isMuted ? 0 : volume}
                    onChange={onVolumeChange}
                    className="player-modal-volume flex-1 cursor-pointer"
                    title="Volume"
                    style={{
                      WebkitAppearance: 'none',
                      appearance: 'none',
                      height: '4px',
                      borderRadius: '99px',
                      background: `linear-gradient(to right, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0.7) ${volumePct}%, rgba(255,255,255,0.15) ${volumePct}%, rgba(255,255,255,0.15) 100%)`,
                      opacity: isMuted ? 0.4 : 1,
                    }}
                  />
                  <Volume2 size={18} className="text-white/30 flex-shrink-0" />
                </div>

                {/* Hint to details */}
                {hasDetail && (
                  <div className="flex items-center justify-center pb-4 gap-2 text-white/20">
                    <span className="text-[10px] uppercase tracking-wider">{t('Track info', 'Track info')}</span>
                    <ChevronRight size={12} />
                  </div>
                )}
              </>
            )}

            {/* ── INFO PAGE ── */}
            {page === 'info' && (
              <div className="pt-4 pb-8 max-w-sm mx-auto">
                {/* Cover + Title */}
                <div className="flex items-center gap-4 mb-6">
                  {track.coverArt ? (
                    <img src={track.coverArt} alt={track.title} className="w-16 h-16 rounded-xl object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-white/[0.06] flex items-center justify-center flex-shrink-0">
                      <Play size={20} className="text-red-400 ml-0.5" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <h2 className="text-base font-black text-white truncate">{track.title}</h2>
                    <p className="text-sm text-white/50 truncate">{track.artist}</p>
                  </div>
                </div>

                {/* Mini player controls */}
                <div className="flex items-center justify-between bg-white/[0.04] rounded-2xl px-5 py-3 mb-6 border border-white/[0.06]">
                  <button onClick={onPreviousClick} className="text-white/50 hover:text-white transition-colors">
                    <SkipBack size={20} fill="currentColor" />
                  </button>
                  <button
                    onClick={onPlayPauseClick}
                    className="w-11 h-11 rounded-full bg-white hover:bg-white/90 flex items-center justify-center transition-all"
                  >
                    {isPlaying ? (
                      <Pause size={20} className="text-black" fill="currentColor" />
                    ) : (
                      <Play size={20} className="text-black ml-0.5" fill="currentColor" />
                    )}
                  </button>
                  <button onClick={onNextClick} className="text-white/50 hover:text-white transition-colors">
                    <SkipForward size={20} fill="currentColor" />
                  </button>
                </div>

                {/* Metadata */}
                <div className="space-y-1">
                  {detail?.year && (
                    <div className="flex items-center justify-between py-2.5 border-b border-white/[0.05]">
                      <span className="text-xs text-white/40 uppercase tracking-wider">Year</span>
                      <span className="text-sm font-bold text-white">{detail.year}</span>
                    </div>
                  )}
                  {detail?.genre && (
                    <div className="flex items-center justify-between py-2.5 border-b border-white/[0.05]">
                      <span className="text-xs text-white/40 uppercase tracking-wider">Genre</span>
                      <span className="text-sm font-bold text-white text-right max-w-[60%] leading-tight">{detail.genre}</span>
                    </div>
                  )}
                  {detail?.type && (
                    <div className="flex items-center justify-between py-2.5 border-b border-white/[0.05]">
                      <span className="text-xs text-white/40 uppercase tracking-wider">Type</span>
                      <span className="text-sm font-bold text-white">{detail.type}</span>
                    </div>
                  )}
                  {detail?.remixType && (
                    <div className="flex items-center justify-between py-2.5 border-b border-white/[0.05]">
                      <span className="text-xs text-white/40 uppercase tracking-wider">Remix Type</span>
                      <span className="text-sm font-bold text-white">{detail.remixType}</span>
                    </div>
                  )}
                  {detail?.bpm && (
                    <div className="flex items-center justify-between py-2.5 border-b border-white/[0.05]">
                      <span className="text-xs text-white/40 uppercase tracking-wider">BPM</span>
                      <span className="text-sm font-bold text-white">{detail.bpm}</span>
                    </div>
                  )}
                  {detail?.key && (
                    <div className="flex items-center justify-between py-2.5 border-b border-white/[0.05]">
                      <span className="text-xs text-white/40 uppercase tracking-wider">Key</span>
                      <span className="text-sm font-bold text-white">{detail.key}</span>
                    </div>
                  )}
                  {detail?.duration && (
                    <div className="flex items-center justify-between py-2.5 border-b border-white/[0.05]">
                      <span className="text-xs text-white/40 uppercase tracking-wider">Duration</span>
                      <span className="text-sm font-bold text-white">{detail.duration}</span>
                    </div>
                  )}
                  {detail?.collab && (
                    <div className="flex items-center justify-between py-2.5 border-b border-white/[0.05]">
                      <span className="text-xs text-white/40 uppercase tracking-wider">Collab</span>
                      <span className="text-sm font-bold text-white">{detail.collab}</span>
                    </div>
                  )}
                  {detail?.album && (
                    <div className="flex items-center justify-between py-2.5 border-b border-white/[0.05]">
                      <span className="text-xs text-white/40 uppercase tracking-wider">Album</span>
                      <span className="text-sm font-bold text-white">{detail.album}</span>
                    </div>
                  )}
                </div>

                {/* Credits */}
                <div className="mt-5 p-4 bg-white/[0.04] border border-white/[0.06] rounded-2xl space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-white/40">Producer</span>
                    <span className="text-white font-semibold">Jonna Rincon</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-white/40">Mix & Master</span>
                    <span className="text-white font-semibold">Jonna Rincon</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes panel-slide-in {
          from {
            transform: translateX(-100%);
          }
          to {
            transform: translateX(0);
          }
        }
        .animate-panel-slide-in {
          animation: panel-slide-in 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @media (max-width: 768px) {
          .animate-panel-slide-in {
            animation: panel-slide-in 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          }
        }

        @keyframes panel-slide-out {
          from {
            transform: translateX(0);
          }
          to {
            transform: translateX(-100%);
          }
        }
        .animate-panel-slide-out {
          animation: panel-slide-out 0.5s cubic-bezier(0.7, 0, 0.84, 0) forwards;
        }
        @media (max-width: 768px) {
          .animate-panel-slide-out {
            animation: panel-slide-out 0.2s cubic-bezier(0.7, 0, 0.84, 0) forwards;
          }
        }
      `}</style>
    </ModalPortal>
  );
}
