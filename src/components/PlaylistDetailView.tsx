import React, { useState, useEffect, useRef } from 'react';
import { X, Play, Pause, Share2, Lock, Unlock, Trash2, ChevronUp, ChevronDown } from 'lucide-react';
import { playlistService, trackService, remixService } from '../lib/firebase/services';
import { useAuth } from '../hooks/useAuth';
import { Playlist, Track } from '../lib/firebase/types';
import TrackListItem from './TrackListItem';
import { getCurrentTrack, setCurrentTrack } from './GlobalAudioPlayer';

interface PlaylistDetailViewProps {
  playlist: Playlist;
  isOpen: boolean;
  onClose: () => void;
  onPlayTracks?: (tracks: Track[], startIndex?: number) => void;
  isPlaying?: boolean;
}

export default function PlaylistDetailView({
  playlist,
  isOpen,
  onClose,
  onPlayTracks,
  isPlaying = false,
}: PlaylistDetailViewProps) {
  const { user } = useAuth();
  const modalRef = useRef<HTMLDivElement>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [updatedPlaylist, setUpdatedPlaylist] = useState<Playlist>(playlist);
  const [error, setError] = useState<string | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);

  // Check if user is owner
  useEffect(() => {
    setIsOwner(user?.uid === playlist.userId || user?.role === 'admin');
  }, [user, playlist.userId]);

  // Subscribe to playlist updates
  useEffect(() => {
    if (!isOpen) return;

    const unsubscribe = playlistService.subscribeToPlaylist(
      playlist.id,
      (updated) => {
        if (updated) {
          setUpdatedPlaylist(updated);
        }
      },
      (err) => {
        console.error('Error loading playlist:', err);
        setError('Failed to load playlist');
      }
    );

    return unsubscribe;
  }, [isOpen, playlist.id]);

  // Fetch tracks and remixes
  useEffect(() => {
    const fetchTracks = async () => {
      if (!updatedPlaylist.trackIds || updatedPlaylist.trackIds.length === 0) {
        setTracks([]);
        return;
      }

      setIsLoading(true);
      const fetchedTracks: Track[] = [];

      for (const trackId of updatedPlaylist.trackIds) {
        // Try to fetch as track first
        let item = await trackService.getTrackById(trackId);

        // If not found, try as remix
        if (!item) {
          item = await remixService.getRemixById(trackId);
        }

        if (item) {
          fetchedTracks.push(item);
        }
      }

      setTracks(fetchedTracks);
      setIsLoading(false);
    };

    fetchTracks();
  }, [updatedPlaylist.trackIds]);

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

  const handlePlayPlaylist = async () => {
    onPlayTracks?.(tracks, 0);
  };

  const handleTogglePublic = async () => {
    if (!isOwner) return;

    try {
      setError(null);
      await playlistService.updatePlaylist(playlist.id, {
        isPublic: !updatedPlaylist.isPublic,
      });
    } catch (err) {
      console.error('Toggle public error:', err);
      setError('Failed to update playlist');
    }
  };

  const handleRemoveTrack = async (trackId: string) => {
    if (!isOwner) return;

    try {
      setError(null);
      await playlistService.removeTrackFromPlaylist(playlist.id, trackId);
    } catch (err) {
      console.error('Remove track error:', err);
      setError('Failed to remove track');
    }
  };

  const handleDeletePlaylist = async () => {
    if (!isOwner || !confirm('Are you sure you want to delete this playlist?')) return;

    try {
      setError(null);
      await playlistService.deletePlaylist(playlist.id);
      onClose();
    } catch (err) {
      console.error('Delete playlist error:', err);
      setError('Failed to delete playlist');
    }
  };

  const handleDragStart = (index: number) => {
    if (!isOwner) return;
    setDraggingIndex(index);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (dropIndex: number) => {
    if (draggingIndex === null || !isOwner) return;

    const newTrackIds = [...updatedPlaylist.trackIds];
    const [draggedTrack] = newTrackIds.splice(draggingIndex, 1);
    newTrackIds.splice(dropIndex, 0, draggedTrack);

    try {
      await playlistService.reorderPlaylistTracks(playlist.id, newTrackIds);
    } catch (err) {
      console.error('Reorder tracks error:', err);
      setError('Failed to reorder tracks');
    }

    setDraggingIndex(null);
  };

  if (!isOpen) return null;

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
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 bg-white/[0.1] hover:bg-white/[0.15] rounded-full text-white/60 hover:text-white transition-all"
        >
          <X size={20} />
        </button>

        {/* Header */}
        <div className="border-b border-white/[0.08] bg-white/[0.04] p-6">
          <div className="flex gap-4">
            {/* Cover Art */}
            <div className="w-20 h-20 rounded-lg bg-gradient-to-br from-red-600/40 to-red-900/20 border border-white/[0.08] flex-shrink-0 flex items-center justify-center overflow-hidden">
              {updatedPlaylist.coverImage && (
                <img
                  src={updatedPlaylist.coverImage}
                  alt={updatedPlaylist.name}
                  className="w-full h-full object-cover"
                />
              )}
            </div>

            {/* Info */}
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-white">{updatedPlaylist.name}</h2>
              <p className="text-sm text-white/50 mt-1">
                {tracks.length} track{tracks.length !== 1 ? 's' : ''}
              </p>
              {updatedPlaylist.description && (
                <p className="text-sm text-white/60 mt-2">{updatedPlaylist.description}</p>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-start gap-2">
              {isOwner && (
                <>
                  <button
                    onClick={handleTogglePublic}
                    className="p-2 bg-white/[0.1] hover:bg-white/[0.15] rounded-full text-white/60 hover:text-white transition-all"
                    title={updatedPlaylist.isPublic ? 'Make private' : 'Make public'}
                  >
                    {updatedPlaylist.isPublic ? (
                      <Unlock size={18} />
                    ) : (
                      <Lock size={18} />
                    )}
                  </button>
                  <button
                    onClick={handleDeletePlaylist}
                    className="p-2 bg-white/[0.1] hover:bg-red-600/20 rounded-full text-white/60 hover:text-red-400 transition-all"
                    title="Delete playlist"
                  >
                    <Trash2 size={18} />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="border-b border-white/[0.08] bg-white/[0.02] px-6 py-3 flex gap-2">
          <button
            onClick={handlePlayPlaylist}
            disabled={tracks.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-600/50 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition-colors"
          >
            {isPlaying ? <Pause size={18} /> : <Play size={18} />}
            <span>{isPlaying ? 'Pause' : 'Play'} Playlist</span>
          </button>
          <button
            onClick={async () => {
              // Build an internal, app-scoped share URL — never leak storage URLs.
              const slugOrId = (updatedPlaylist as any).slug || updatedPlaylist.id;
              const shareUrl = `${window.location.origin}/playlist/${slugOrId}`;
              try {
                if (navigator.share) {
                  await navigator.share({
                    title: updatedPlaylist.name,
                    text: `Check out this playlist: ${updatedPlaylist.name}`,
                    url: shareUrl,
                  });
                } else {
                  await navigator.clipboard.writeText(shareUrl);
                  setError('Share link copied to clipboard');
                  setTimeout(() => setError(null), 2000);
                }
              } catch {
                // user cancelled share; no-op
              }
            }}
            className="flex items-center gap-2 px-4 py-2 bg-white/[0.1] hover:bg-white/[0.15] text-white rounded-lg font-semibold transition-colors"
          >
            <Share2 size={18} />
            <span>Share</span>
          </button>
        </div>

        {/* Error message */}
        {error && (
          <div className="px-6 pt-3 text-red-400 text-sm">{error}</div>
        )}

        {/* Tracks List */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-white/50">Loading tracks...</p>
            </div>
          ) : tracks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8">
              <p className="text-white/50">No tracks in this playlist</p>
            </div>
          ) : (
            <div className="space-y-2">
              {tracks.map((track, index) => (
                <div
                  key={track.id}
                  draggable={isOwner}
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={handleDragOver}
                  onDrop={() => handleDrop(index)}
                  className={`flex items-center gap-3 ${
                    isOwner ? 'cursor-move' : ''
                  } ${draggingIndex === index ? 'opacity-50' : ''}`}
                >
                  {isOwner && (
                    <div className="flex flex-col gap-1 text-white/30">
                      <ChevronUp size={14} />
                      <ChevronDown size={14} />
                    </div>
                  )}
                  <div className="flex-1">
                    <TrackListItem
                      track={track}
                      showType={false}
                      showYear={false}
                      showGenre={true}
                      showBPM={false}
                      onPlay={() => onPlayTracks?.([track], 0)}
                    />
                  </div>
                  {isOwner && (
                    <button
                      onClick={() => handleRemoveTrack(track.id)}
                      className="flex-shrink-0 p-2 text-white/40 hover:text-red-400 transition-colors"
                      title="Remove from playlist"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
