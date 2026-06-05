import React, { useRef, useEffect } from 'react';
import { ChevronDown, Play, Pause, SkipBack, SkipForward, Shuffle, Repeat, Volume2, VolumeX, Info } from 'lucide-react';
import { formatDuration } from '../lib/utils/audioMetadata';
import {
  toggleShuffle,
  getIsShuffle,
  getCurrentIndex,
  getQueue
} from './GlobalAudioPlayer';
import ModalPortal from './ModalPortal';

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
  onInfoClick,
  track,
}: PlayerModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const isShuffle = getIsShuffle();

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : 'auto';
    return () => { document.body.style.overflow = 'auto'; };
  }, [isOpen]);

  if (!isOpen || !track) return null;

  const progressPct = duration ? (currentTime / duration) * 100 : 0;
  const volumePct = (isMuted ? 0 : volume) * 100;
  const queueLen = getQueue().length;
  const queueIdx = getCurrentIndex() || 0;

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[300] flex items-end sm:items-center justify-center sm:p-6 bg-black/70 backdrop-blur-md">
        <div
          ref={modalRef}
          className="relative w-full sm:max-w-sm bg-[#111] border border-white/[0.08] rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden"
          style={{ maxHeight: '95dvh' }}
        >
          {/* Drag handle (mobile) */}
          <div className="sm:hidden flex justify-center pt-3 pb-1 flex-shrink-0">
            <div className="w-10 h-1 rounded-full bg-white/20" />
          </div>

          {/* Top bar */}
          <div className="flex items-center justify-between px-5 pt-3 pb-1 flex-shrink-0">
            <button
              onClick={onClose}
              className="p-2 rounded-full text-white/40 hover:text-white hover:bg-white/[0.08] transition-all"
              title="Close"
            >
              <ChevronDown size={22} />
            </button>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/30">
              {queueLen > 0 ? `${queueIdx + 1} / ${queueLen}` : 'Now Playing'}
            </p>
            {onInfoClick ? (
              <button
                onClick={onInfoClick}
                className="p-2 rounded-full text-white/40 hover:text-white hover:bg-white/[0.08] transition-all"
                title="Track details"
              >
                <Info size={18} />
              </button>
            ) : (
              <div className="w-9" />
            )}
          </div>

          {/* Scrollable content */}
          <div className="overflow-y-auto flex-1">
            {/* Cover Art */}
            <div className="px-6 pt-3 pb-5">
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
            <div className="px-6 pb-5">
              <h2 className="text-2xl font-black text-white truncate leading-tight">{track.title}</h2>
              <p className="text-base text-white/50 mt-0.5 truncate">{track.artist}</p>
            </div>

            {/* Progress bar — full width of modal */}
            <div className="px-6 pb-2">
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
            <div className="px-6 py-4 flex items-center justify-between">
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
            <div className="px-6 pb-7 flex items-center gap-3">
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
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}
