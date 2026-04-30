import React, { useEffect, useRef } from 'react';
import { X, Package, Play, Pause, ShoppingCart, Music } from 'lucide-react';
import { BeatPack } from '../lib/firebase/types';
import { setCurrentTrack, getCurrentTrack, getIsPlaying } from './GlobalAudioPlayer';
import { useCartContext } from '../contexts/CartContext';

interface BeatPackDetailModalProps {
  pack: BeatPack | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function BeatPackDetailModal({ pack, isOpen, onClose }: BeatPackDetailModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const { addPackToCart } = useCartContext();

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
    const handleEscape = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : 'auto';
    return () => { document.body.style.overflow = 'auto'; };
  }, [isOpen]);

  if (!isOpen || !pack) return null;

  const currentTrack = getCurrentTrack();
  const isPackBeatPlaying = (audioUrl: string) => currentTrack?.audioUrl === audioUrl && getIsPlaying();

  const handlePlayBeat = (idx: number) => {
    const beat = pack.beats[idx];
    const track = {
      id: `${pack.id}-beat-${idx}`,
      title: beat.title,
      artist: beat.artist,
      audioUrl: beat.audioUrl,
      coverArt: pack.coverUrl,
      duration: '0:00',
      genre: beat.genre || '',
      type: 'Single' as const,
      year: new Date().getFullYear(),
      collab: 'Solo' as const,
      createdAt: Date.now(),
    } as any;
    const queue = pack.beats.map((b, i) => ({
      id: `${pack.id}-beat-${i}`,
      title: b.title,
      artist: b.artist,
      audioUrl: b.audioUrl,
      coverArt: pack.coverUrl,
      duration: '0:00',
      genre: b.genre || '',
      type: 'Single' as const,
      year: new Date().getFullYear(),
      collab: 'Solo' as const,
      createdAt: Date.now(),
    })) as any;
    setCurrentTrack(track, queue);
  };

  const handleAddToCart = () => {
    addPackToCart(pack);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 max-h-screen overflow-y-auto">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-md" />
      <div
        ref={modalRef}
        className="relative z-10 w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-black/90 backdrop-blur-2xl border border-white/[0.12] rounded-2xl shadow-2xl"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 bg-white/[0.08] hover:bg-white/[0.15] rounded-full transition-all"
        >
          <X className="w-5 h-5 text-white" />
        </button>

        {/* Header */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
          <div className="relative aspect-square pt-12 md:pt-0">
            <img src={pack.coverUrl || '/JEIGHTENESIS.jpg'} alt={pack.title} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/60" />
            <div className="absolute top-4 left-4 px-3 py-1.5 bg-red-600 rounded-full text-xs font-bold uppercase flex items-center gap-1.5">
              <Package size={12} /> Beat Pack
            </div>
          </div>

          <div className="p-6 md:p-8 flex flex-col justify-center">
            <p className="text-xs uppercase tracking-widest text-red-400/80 font-bold mb-2">
              {pack.beats.length} Beat{pack.beats.length !== 1 ? 's' : ''}
            </p>
            <h2 className="text-3xl md:text-4xl font-black text-white mb-4 leading-tight">{pack.title}</h2>
            {pack.description && (
              <p className="text-white/60 text-sm mb-6">{pack.description}</p>
            )}
            <div className="flex items-center justify-between gap-4 mt-auto">
              <div>
                <div className="text-[10px] uppercase tracking-widest text-white/30">Total</div>
                <div className="text-4xl font-black text-red-500">&euro;{pack.price.toFixed(0)}</div>
              </div>
              <button
                onClick={handleAddToCart}
                className="flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 rounded-lg text-sm font-bold uppercase tracking-wider transition-all"
              >
                <ShoppingCart size={16} /> Add Pack
              </button>
            </div>
          </div>
        </div>

        {/* Beat List */}
        <div className="border-t border-white/[0.08] p-6 md:p-8">
          <h3 className="text-lg font-bold text-white uppercase mb-4 flex items-center gap-2">
            <Music size={18} /> Beats in this pack
          </h3>
          <div className="space-y-2">
            {pack.beats.map((b, i) => (
              <div
                key={i}
                className={`flex items-center gap-4 p-3 rounded-xl border transition-all cursor-pointer ${
                  isPackBeatPlaying(b.audioUrl)
                    ? 'bg-red-600/10 border-red-500/30'
                    : 'bg-white/[0.04] border-white/[0.06] hover:bg-white/[0.06]'
                }`}
                onClick={() => handlePlayBeat(i)}
              >
                <span className="text-sm text-white/30 w-6 text-center">{String(i + 1).padStart(2, '0')}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-white truncate text-sm">{b.title}</p>
                  <p className="text-xs text-white/40 truncate">{b.artist}</p>
                </div>
                <div className="hidden md:flex items-center gap-3 text-xs text-white/40">
                  <span>{b.bpm} BPM</span>
                  <span>&middot;</span>
                  <span>{b.key}</span>
                  <span>&middot;</span>
                  <span>{b.genre}</span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePlayBeat(i);
                  }}
                  className="p-3 rounded-full bg-white/[0.08] hover:bg-white/[0.16] transition flex-shrink-0"
                  title={isPackBeatPlaying(b.audioUrl) ? 'Pause' : 'Play'}
                >
                  {isPackBeatPlaying(b.audioUrl) ? (
                    <Pause size={18} className="text-red-500" fill="currentColor" />
                  ) : (
                    <Play size={18} className="text-white/70" fill="currentColor" />
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
