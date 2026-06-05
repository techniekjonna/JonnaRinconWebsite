import React, { useEffect, useRef, useState } from 'react';
import { X, Play, Pause, ShoppingCart, Music } from 'lucide-react';
import { Album, Track } from '../lib/firebase/types';

interface AlbumDetailModalProps {
  album: Album | null;
  tracks: Track[];
  isOpen: boolean;
  onClose: () => void;
  onPlayTrack?: (track: Track) => void;
  onBuyAlbum?: (album: Album) => void;
  onBuyTrack?: (track: Track) => void;
  currentPlayingId?: string;
  isPlaying?: boolean;
  cartItems?: any[];
}

export default function AlbumDetailModal({
  album,
  tracks,
  isOpen,
  onClose,
  onPlayTrack,
  onBuyAlbum,
  onBuyTrack,
  currentPlayingId,
  isPlaying = false,
  cartItems = [],
}: AlbumDetailModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const [isHoveringCover, setIsHoveringCover] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen || !album) return null;

  const isAlbumInCart = cartItems.some(item => item.id === album.id && item.type === 'album');
  const albumTracks = tracks
    .filter(track => album.trackIds.includes(track.id))
    .sort((a, b) => {
      const indexA = album.trackIds.indexOf(a.id);
      const indexB = album.trackIds.indexOf(b.id);
      return indexA - indexB;
    });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        ref={modalRef}
        className="relative w-full max-w-2xl bg-white/[0.08] backdrop-blur-xl border border-white/[0.15] rounded-3xl overflow-hidden shadow-2xl max-h-[82vh] flex flex-col"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 p-2.5 bg-black/50 hover:bg-white/[0.15] border border-white/[0.15] rounded-full text-white/80 hover:text-white transition-all shadow-md"
        >
          <X size={18} />
        </button>

        {/* Content */}
        <div className="overflow-y-auto flex-1 p-8 md:p-12">
          <div className="grid md:grid-cols-[300px_1fr] gap-8 mb-8">
            {/* Cover Art */}
            <div className="flex flex-col items-center">
              <div
                className="relative aspect-square w-full max-w-xs rounded-xl overflow-hidden mb-6 group cursor-pointer"
                onMouseEnter={() => setIsHoveringCover(true)}
                onMouseLeave={() => setIsHoveringCover(false)}
                onClick={() => onPlayTrack?.(albumTracks[0])}
              >
                <img
                  src={album.coverImageUrl || album.artworkUrl}
                  alt={album.title}
                  className="w-full h-full object-cover"
                />
                {isHoveringCover && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <button className="p-3 bg-red-500 hover:bg-red-600 rounded-full transition-colors">
                      <Play size={24} fill="white" className="text-white" />
                    </button>
                  </div>
                )}
              </div>

              {/* Pricing */}
              <div className="w-full space-y-4">
                {!album.isFree && (
                  <>
                    {album.fullAlbumPrice < album.perTrackPrice * albumTracks.length && (
                      <div className="text-center">
                        <p className="text-sm text-white/60 mb-2">Full Album</p>
                        <p className="text-3xl font-bold text-white mb-3">
                          ${album.fullAlbumPrice.toFixed(2)}
                        </p>
                        <button
                          onClick={() => onBuyAlbum?.(album)}
                          className={`w-full py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${
                            isAlbumInCart
                              ? 'bg-white/[0.1] text-white/60'
                              : 'bg-red-500 hover:bg-red-600 text-white'
                          }`}
                          disabled={isAlbumInCart}
                        >
                          <ShoppingCart size={18} />
                          {isAlbumInCart ? 'In Cart' : 'Buy Album'}
                        </button>
                        <p className="text-xs text-white/50 mt-2">
                          Save {Math.round(((album.perTrackPrice * albumTracks.length - album.fullAlbumPrice) / (album.perTrackPrice * albumTracks.length)) * 100)}%
                        </p>
                      </div>
                    )}
                  </>
                )}
                {album.isFree && (
                  <div className="text-center py-4 bg-white/[0.05] rounded-lg">
                    <p className="text-lg font-semibold text-white">Free Download</p>
                  </div>
                )}
              </div>
            </div>

            {/* Info */}
            <div className="flex flex-col justify-center">
              <p className="text-red-500 text-sm font-semibold uppercase tracking-wider mb-2">
                Album
              </p>
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">
                {album.title}
              </h1>
              <p className="text-xl text-white/80 mb-4">{album.artist}</p>

              <div className="flex flex-wrap gap-3 mb-6">
                {album.genre && (
                  <span className="px-3 py-1 bg-white/[0.1] rounded-full text-white/80 text-sm">
                    {album.genre}
                  </span>
                )}
                {album.subGenre && (
                  <span className="px-3 py-1 bg-white/[0.1] rounded-full text-white/80 text-sm">
                    {album.subGenre}
                  </span>
                )}
              </div>

              {album.description && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wide mb-3">
                    About
                  </h3>
                  <p className="text-white/80 leading-relaxed">{album.description}</p>
                </div>
              )}

              <div className="grid grid-cols-3 gap-4 py-4 border-y border-white/[0.1]">
                <div>
                  <p className="text-white/60 text-xs uppercase tracking-wider mb-1">
                    Tracks
                  </p>
                  <p className="text-2xl font-bold text-white">{albumTracks.length}</p>
                </div>
                <div>
                  <p className="text-white/60 text-xs uppercase tracking-wider mb-1">
                    Plays
                  </p>
                  <p className="text-2xl font-bold text-white">
                    {album.plays.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-white/60 text-xs uppercase tracking-wider mb-1">
                    Downloads
                  </p>
                  <p className="text-2xl font-bold text-white">
                    {album.downloads.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Tracklist */}
          <div>
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              <Music size={24} />
              Tracklist
            </h2>

            <div className="space-y-2">
              {albumTracks.map((track, index) => {
                const isCurrentTrackPlaying =
                  currentPlayingId === track.id && isPlaying;
                const isInCart = cartItems.some(item => item.id === track.id);
                const trackPrice = track.price || album.perTrackPrice;

                return (
                  <div
                    key={track.id}
                    className="group p-4 hover:bg-white/[0.08] rounded-lg transition-colors border border-transparent hover:border-white/[0.1]"
                  >
                    <div className="flex items-center gap-4">
                      {/* Track Number */}
                      <div className="text-white/60 font-semibold text-sm w-8 text-center">
                        {index + 1}
                      </div>

                      {/* Play Button */}
                      <button
                        onClick={() => onPlayTrack?.(track)}
                        className="p-2 hover:bg-red-500/20 rounded-full transition-colors"
                      >
                        {isCurrentTrackPlaying ? (
                          <Pause size={18} className="text-red-500" />
                        ) : (
                          <Play
                            size={18}
                            className="text-white/60 group-hover:text-white"
                            fill="currentColor"
                          />
                        )}
                      </button>

                      {/* Track Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-white truncate">
                          {track.title}
                        </h3>
                        <p className="text-sm text-white/60">{track.artist}</p>
                      </div>

                      {/* Genre & BPM */}
                      <div className="hidden sm:flex items-center gap-4 text-xs text-white/60">
                        {track.genre && <span>{track.genre}</span>}
                        {track.bpm && <span>{track.bpm} BPM</span>}
                      </div>

                      {/* Pricing & Cart */}
                      {!album.isFree && (
                        <div className="flex items-center gap-3">
                          <span className="font-semibold text-white">
                            ${trackPrice.toFixed(2)}
                          </span>
                          <button
                            onClick={() => onBuyTrack?.(track)}
                            className={`p-2 rounded-lg transition-all ${
                              isInCart
                                ? 'bg-white/[0.1] text-white/60'
                                : 'hover:bg-red-500/20 text-white/60 group-hover:text-white'
                            }`}
                            title={isInCart ? 'In Cart' : 'Add to Cart'}
                          >
                            <ShoppingCart size={18} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
