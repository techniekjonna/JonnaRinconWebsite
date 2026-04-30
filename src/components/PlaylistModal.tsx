import React, { useState, useEffect, useRef } from 'react';
import { X, Plus, Music } from 'lucide-react';
import { playlistService } from '../lib/firebase/services';
import { useAuth } from '../hooks/useAuth';
import { Playlist } from '../lib/firebase/types';

interface PlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPlaylistSelect?: (playlist: Playlist) => void;
}

export default function PlaylistModal({
  isOpen,
  onClose,
  onPlaylistSelect,
}: PlaylistModalProps) {
  const { user } = useAuth();
  const modalRef = useRef<HTMLDivElement>(null);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Subscribe to user playlists
  useEffect(() => {
    if (!isOpen || !user) return;

    setIsLoading(true);
    const unsubscribe = playlistService.subscribeToUserPlaylists(
      user.uid,
      (fetchedPlaylists) => {
        setPlaylists(fetchedPlaylists);
        setIsLoading(false);
      },
      (err) => {
        console.error('Error loading playlists:', err);
        setError('Failed to load playlists');
        setIsLoading(false);
      }
    );

    return unsubscribe;
  }, [isOpen, user]);

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

  // Prevent body scroll when modal is open
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

  const handleCreatePlaylist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlaylistName.trim() || !user) {
      setError('Playlist name is required');
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      const newPlaylist = await playlistService.createPlaylist(
        newPlaylistName.trim(),
        user.uid
      );
      setNewPlaylistName('');
      onPlaylistSelect?.(newPlaylist);
    } catch (err) {
      console.error('Create playlist error:', err);
      setError('Failed to create playlist');
    } finally {
      setIsCreating(false);
    }
  };

  if (!isOpen || !user) return null;

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
        className="relative w-full max-w-2xl bg-white/[0.08] backdrop-blur-xl border border-white/[0.15] rounded-3xl overflow-hidden shadow-2xl max-h-[90vh] flex flex-col"
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
          <h2 className="text-lg font-bold text-white">Your Playlists</h2>
          <p className="text-sm text-white/50 mt-1">
            {playlists.length} playlist{playlists.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Create Playlist Form */}
          <div className="p-6 border-b border-white/[0.08]">
            <form onSubmit={handleCreatePlaylist} className="flex gap-2">
              <input
                type="text"
                value={newPlaylistName}
                onChange={(e) => setNewPlaylistName(e.target.value)}
                placeholder="New playlist name..."
                className="flex-1 bg-white/[0.06] border border-white/[0.1] rounded-lg px-4 py-2 text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-red-500/50 focus:border-red-500/30 transition-all"
              />
              <button
                type="submit"
                disabled={isCreating || !newPlaylistName.trim()}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-600/50 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition-colors"
              >
                <Plus size={18} />
                <span className="hidden sm:inline">Create</span>
              </button>
            </form>
            {error && (
              <p className="text-red-400 text-sm mt-2">{error}</p>
            )}
          </div>

          {/* Playlists List */}
          <div className="p-6 space-y-3">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <p className="text-white/50">Loading playlists...</p>
              </div>
            ) : playlists.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8">
                <Music size={32} className="text-white/30 mb-2" />
                <p className="text-white/50">No playlists yet</p>
                <p className="text-white/30 text-sm">Create one to get started!</p>
              </div>
            ) : (
              playlists.map((playlist) => (
                <PlaylistItem
                  key={playlist.id}
                  playlist={playlist}
                  onSelect={onPlaylistSelect}
                  onClose={onClose}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

interface PlaylistItemProps {
  playlist: Playlist;
  onSelect?: (playlist: Playlist) => void;
  onClose?: () => void;
}

function PlaylistItem({ playlist, onSelect, onClose }: PlaylistItemProps) {
  const handleClick = () => {
    onSelect?.(playlist);
    onClose?.();
  };

  return (
    <button
      onClick={handleClick}
      className="w-full rounded-xl p-3 flex items-center gap-4 hover:bg-white/[0.08] transition-all duration-300 border bg-white/[0.04] border-white/[0.06] hover:border-white/[0.1]"
    >
      {/* Cover Art */}
      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-red-600/40 to-red-900/20 border border-white/[0.08] flex-shrink-0 flex items-center justify-center overflow-hidden">
        {playlist.coverImage ? (
          <img
            src={playlist.coverImage}
            alt={playlist.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <Music size={20} className="text-white/30" />
        )}
      </div>

      {/* Playlist Info */}
      <div className="flex-1 min-w-0 text-left">
        <h3 className="font-semibold text-white truncate">
          {playlist.name}
        </h3>
        <p className="text-xs text-white/50">
          {playlist.trackIds.length} track{playlist.trackIds.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Public indicator */}
      {playlist.isPublic && (
        <div className="text-xs px-2 py-1 bg-blue-500/20 border border-blue-500/30 rounded-full text-blue-300 flex-shrink-0">
          Public
        </div>
      )}
    </button>
  );
}
