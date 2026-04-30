import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Play, Pause, ShoppingCart, Download, ChevronDown, Plus, Dice5 } from 'lucide-react';
import { getCurrentTrack } from './GlobalAudioPlayer';
import { useAuth } from '../hooks/useAuth';
import { playlistService } from '../lib/firebase/services';
import { Playlist } from '../lib/firebase/types';
import { useWikipediaGenre } from '../hooks/useWikipediaGenre';

interface Track {
  id: string;
  title: string;
  artist: string;
  audioUrl?: string;
  coverArt?: string;
  artworkUrl?: string;
  genre?: string;
  duration?: string;
  year?: number;
  type?: string;
  bpm?: number;
  price?: number;
  isFree?: boolean;
  licenses?: { exclusive?: { price: number } };
  description?: string;
  collab?: string;
  originalArtist?: string;
  remixType?: string;
  key?: string;
  album?: string;
  trackNumber?: number;
  tags?: string[];
}

interface TrackDetailModalProps {
  track: Track | null;
  isOpen: boolean;
  onClose: () => void;
  isPlaying?: boolean;
  onPlay?: (track: Track) => void;
  onBuy?: (track: Track) => void;
  cartItems?: any[];
  relatedTracks?: Track[];
  onAddToPlaylist?: (trackId: string, playlistId: string) => Promise<void>;
}

export default function TrackDetailModal({
  track,
  isOpen,
  onClose,
  isPlaying = false,
  onPlay,
  onBuy,
  cartItems = [],
  relatedTracks = [],
  onAddToPlaylist,
}: TrackDetailModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isHoveringCover, setIsHoveringCover] = useState(false);
  const [isPlaylistExpanded, setIsPlaylistExpanded] = useState(false);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);
  const [userPlaylists, setUserPlaylists] = useState<Playlist[]>([]);
  const [isAddingToPlaylist, setIsAddingToPlaylist] = useState(false);
  const [currentRelatedTracks, setCurrentRelatedTracks] = useState(relatedTracks);
  const { content: genreInfo, loading: genreLoading } = useWikipediaGenre(track?.genre);

  // Handle play button click on cover
  const handleCoverClick = () => {
    if (onPlay && track) {
      onPlay(track);
    }
  };

  // Update current related tracks when prop changes
  useEffect(() => {
    setCurrentRelatedTracks(relatedTracks);
  }, [relatedTracks]);

  // Check if track is already in cart
  const isInCart = track ? cartItems.some(item => item.id === track.id) : false;

  // Handle body scroll lock when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  // Handle click outside
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

  // Handle Escape key
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

  // Load user playlists when modal opens
  useEffect(() => {
    if (!isOpen || !user) {
      setUserPlaylists([]);
      return;
    }

    playlistService
      .getPlaylistsByUserId(user.uid)
      .then((playlists) => {
        setUserPlaylists(playlists);
      })
      .catch((error) => {
        console.error('Error loading playlists:', error);
      });
  }, [isOpen, user]);

  // Handle add to playlist
  const handleAddToPlaylist = async () => {
    if (!selectedPlaylistId || !track) return;
    setIsAddingToPlaylist(true);
    try {
      await playlistService.addTrackToPlaylist(selectedPlaylistId, track.id);
      setSelectedPlaylistId(null);
      // Show success message
      console.log('Track added to playlist');
    } catch (error) {
      console.error('Error adding to playlist:', error);
    } finally {
      setIsAddingToPlaylist(false);
    }
  };

  if (!isOpen || !track) return null;

  const isCurrentTrackPlaying = getCurrentTrack()?.id === track.id;

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
        className="relative w-full max-w-4xl bg-white/[0.08] backdrop-blur-xl border border-white/[0.15] rounded-3xl overflow-hidden shadow-2xl max-h-[90vh] flex flex-col"
      >
        {/* Header with Close Button */}
        <div className="sticky top-0 z-10 bg-white/[0.04] backdrop-blur-sm border-b border-white/[0.1] px-6 md:px-8 py-4 flex items-center justify-end">
          <button
            onClick={onClose}
            className="p-2 bg-white/[0.1] hover:bg-white/[0.15] rounded-full text-white/60 hover:text-white transition-all"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="flex flex-col md:flex-row gap-6 p-6 md:p-8">
          {/* Artwork */}
          <div className="w-full md:w-1/3 flex-shrink-0">
            <div
              className="relative aspect-square rounded-2xl overflow-hidden cursor-pointer"
              onMouseEnter={() => setIsHoveringCover(true)}
              onMouseLeave={() => setIsHoveringCover(false)}
              onClick={handleCoverClick}
            >
              <img
                src={track.coverArt || track.artworkUrl || '/JEIGHTENESIS.jpg'}
                alt={track.title}
                className={`w-full h-full object-cover transition-all duration-300 ${
                  isHoveringCover ? 'scale-105 brightness-75' : 'scale-100 brightness-100'
                }`}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

              {/* Play Button Overlay - appears on hover */}
              {onPlay && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCoverClick();
                  }}
                  className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${
                    isHoveringCover ? 'opacity-100' : 'opacity-0'
                  }`}
                >
                  <div className="w-16 h-16 rounded-full bg-red-600/90 backdrop-blur-sm flex items-center justify-center transition-transform duration-300 hover:scale-110">
                    {isCurrentTrackPlaying ? (
                      <Pause className="w-7 h-7 text-red-500 ml-0" fill="currentColor" />
                    ) : (
                      <Play className="w-7 h-7 text-white ml-1" fill="currentColor" />
                    )}
                  </div>
                </button>
              )}
            </div>

            {/* Track Meta Info */}
            <div className="mt-4 space-y-2">
              {track.year && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/40">Year</span>
                  <span className="text-white font-bold">{track.year}</span>
                </div>
              )}
              {track.genre && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/40">Genre</span>
                  <span className="text-white font-bold">{track.genre}</span>
                </div>
              )}
              {track.type && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/40">Type</span>
                  <span className="text-white font-bold">{track.type}</span>
                </div>
              )}
              {track.bpm && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/40">BPM</span>
                  <span className="text-white font-bold">{track.bpm}</span>
                </div>
              )}
              {track.key && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/40">Key</span>
                  <span className="text-white font-bold">{track.key}</span>
                </div>
              )}
              {track.remixType && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/40">Remix Type</span>
                  <span className="text-white font-bold">{track.remixType}</span>
                </div>
              )}
            </div>
          </div>

          {/* Details */}
          <div className="flex-1 flex flex-col justify-between">
            {/* Title & Description */}
            <div>
              <h2 className="text-2xl md:text-3xl font-black text-white mb-1 uppercase tracking-tight">
                {track.title}
              </h2>
              <p className="text-white/40 text-sm md:text-base mb-2">{track.artist}</p>

              {/* Remix Artist Info */}
              {track.originalArtist && (
                <p className="text-white/50 text-xs md:text-sm mb-4">Original by {track.originalArtist}</p>
              )}

              {/* Producer Credits */}
              <p className="text-white/60 text-xs md:text-sm mb-2">Producer: <span className="text-white font-semibold">Jonna Rincon</span></p>

              {/* Mixed & Mastered */}
              <p className="text-white/60 text-xs md:text-sm mb-6">
                <span className="font-bold">Mixed & Mastered</span> by{' '}
                <a href="/services" className="text-red-400 hover:text-red-300 underline font-semibold transition-colors">
                  Jonna Rincon
                </a>
              </p>

              {/* Duration */}
              {track.duration && (
                <div className="mb-4">
                  <p className="text-white/40 text-xs uppercase tracking-wider mb-2">Duration</p>
                  <p className="text-white text-sm">{track.duration}</p>
                </div>
              )}

              {/* Description */}
              {track.description && (
                <div className="mb-6">
                  <p className="text-white/40 text-xs uppercase tracking-wider mb-2">Description</p>
                  <p className="text-white text-sm leading-relaxed">{track.description}</p>
                </div>
              )}

              {/* Collaboration Info */}
              {track.collab && (
                <div className="mb-6">
                  <p className="text-white/40 text-xs uppercase tracking-wider mb-2">Type</p>
                  <p className="text-white text-sm">{track.collab}</p>
                </div>
              )}

              {/* Genre Information from Wikipedia */}
              {track.genre && (
                <div className="mb-6">
                  <p className="text-white/40 text-xs uppercase tracking-wider mb-2">About {track.genre}</p>
                  {genreLoading && (
                    <div className="text-white/50 text-sm">Loading genre information...</div>
                  )}
                  {genreInfo && (
                    <p className="text-white/70 text-sm leading-relaxed">{genreInfo}</p>
                  )}
                  {!genreLoading && !genreInfo && (
                    <p className="text-white/50 text-sm italic">No information available for this genre.</p>
                  )}
                </div>
              )}

              {/* Message */}
              <div className="p-4 bg-white/[0.06] border border-white/[0.1] rounded-2xl mb-6">
                <p className="text-white/80 text-sm leading-relaxed">
                  🎵 <span className="text-red-400 font-bold">Free · Ad-Free · High Quality</span>
                </p>
                <p className="text-white/60 text-xs mt-2">
                  Listen to original tracks and support the artist directly on their own platform
                </p>
              </div>
            </div>

            {/* Add to Playlist Section */}
            <div className="mt-6 border border-white/[0.1] rounded-xl overflow-hidden bg-white/[0.04]">
              <button
                onClick={() => setIsPlaylistExpanded(!isPlaylistExpanded)}
                className="w-full px-6 py-3 flex items-center justify-between text-white font-semibold text-sm uppercase tracking-wider hover:bg-white/[0.06] transition-colors"
              >
                <span>Add to Playlist</span>
                <ChevronDown size={16} className={`transition-transform ${isPlaylistExpanded ? 'rotate-180' : ''}`} />
              </button>

              {isPlaylistExpanded && (
                <div className="border-t border-white/[0.1] p-4 space-y-3">
                  {user ? (
                    <>
                      <button
                        onClick={() => {
                          // For now, just log - in full implementation would open create playlist flow
                          console.log('Create new playlist');
                        }}
                        className="w-full px-4 py-2 bg-red-600/80 hover:bg-red-600 text-white rounded-lg font-semibold text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-colors"
                      >
                        <Plus size={16} />
                        Create New Playlist
                      </button>

                      {userPlaylists.length > 0 && (
                        <div className="space-y-2 max-h-[200px] overflow-y-auto">
                          {userPlaylists.map(playlist => (
                            <label key={playlist.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/[0.06] cursor-pointer transition-colors">
                              <input
                                type="radio"
                                name="playlist"
                                value={playlist.id}
                                checked={selectedPlaylistId === playlist.id}
                                onChange={() => setSelectedPlaylistId(playlist.id)}
                                className="w-4 h-4"
                              />
                              <div className="flex-1 min-w-0">
                                <p className="text-white text-sm font-semibold truncate">
                                  {(playlist as any).name || 'Untitled Playlist'}
                                </p>
                                <p className="text-white/40 text-xs">
                                  {(playlist as any).trackIds?.length || 0} tracks
                                </p>
                              </div>
                            </label>
                          ))}
                        </div>
                      )}

                      {userPlaylists.length === 0 && (
                        <p className="text-white/40 text-sm text-center py-2">
                          No playlists yet. Create one to get started!
                        </p>
                      )}

                      {selectedPlaylistId && (
                        <button
                          onClick={handleAddToPlaylist}
                          disabled={isAddingToPlaylist}
                          className="w-full px-4 py-2 bg-white/[0.1] hover:bg-white/[0.15] disabled:opacity-50 text-white rounded-lg font-semibold text-sm uppercase tracking-wider transition-colors"
                        >
                          {isAddingToPlaylist ? 'Adding...' : 'Add Track'}
                        </button>
                      )}
                    </>
                  ) : (
                    <p className="text-white/40 text-sm text-center py-2">
                      Sign in to add tracks to playlists
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Related Tracks Section */}
            {currentRelatedTracks && currentRelatedTracks.length > 0 && (
              <div className="mt-6 pt-6 border-t border-white/[0.1]">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-white/60 text-xs uppercase tracking-wider font-semibold">
                    Related Tracks
                  </h3>
                  <button
                    onClick={() => setCurrentRelatedTracks([...currentRelatedTracks].sort(() => Math.random() - 0.5))}
                    className="p-1.5 bg-white/[0.06] hover:bg-white/[0.12] rounded-lg text-white/40 hover:text-white transition-all"
                    title="Generate random recommendations"
                  >
                    <Dice5 size={16} />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-2">
                  {currentRelatedTracks.map(relTrack => (
                    <button
                      key={relTrack.id}
                      onClick={() => onPlay?.(relTrack)}
                      className="group rounded-lg bg-white/[0.04] hover:bg-white/[0.08] overflow-hidden flex flex-col transition-all border border-white/[0.08] hover:border-white/[0.12]"
                    >
                      <img
                        src={relTrack.artworkUrl || '/JEIGHTENESIS.jpg'}
                        alt={relTrack.title}
                        className="w-full aspect-square object-cover"
                      />
                      <div className="flex-1 p-2 flex flex-col justify-between min-w-0">
                        <p className="text-xs text-white font-semibold truncate">
                          {relTrack.title}
                        </p>
                        <p className="text-[10px] text-white/50 truncate">
                          {relTrack.artist}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Download Button - routes through gated /download page so the raw storage URL isn't exposed */}
            {track.audioUrl && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  navigate(`/download/${track.id}`);
                }}
                className="w-full px-6 py-3 text-white rounded-xl font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-3 mb-3 bg-red-600/80 hover:bg-red-600 hover:scale-[1.02] active:scale-95"
              >
                <Download size={18} />
                <span>Download Track</span>
              </button>
            )}

            {/* Buy Button - for non-free tracks with a price */}
            {onBuy && track && !track.isFree && track.licenses?.exclusive?.price && (
              <button
                onClick={() => !isInCart && onBuy(track)}
                disabled={isInCart}
                className={`w-full px-6 py-3 text-white rounded-xl font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-3 mb-3 ${
                  isInCart
                    ? 'bg-gradient-to-r from-green-600 to-emerald-600 cursor-default'
                    : 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 hover:scale-[1.02] active:scale-95'
                }`}
              >
                <ShoppingCart size={18} />
                <span>
                  {isInCart ? 'In Cart' : `Add to Cart — €${track.licenses.exclusive.price.toFixed(2)}`}
                </span>
              </button>
            )}

            {/* Close Button for Mobile */}
            <button
              onClick={onClose}
              className="px-6 py-3 bg-white/[0.1] hover:bg-white/[0.15] text-white rounded-xl font-bold uppercase tracking-wider transition-all"
            >
              Close
            </button>
          </div>
          </div>
        </div>
      </div>
    </div>
  );
}
