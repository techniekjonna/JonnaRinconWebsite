import React, { useState, useMemo } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import LoadingSpinner from '../../components/LoadingSpinner';
import { usePlaylists } from '../../hooks/usePlaylists';
import { useTracks } from '../../hooks/useTracks';
import { playlistService } from '../../lib/firebase/services';
import { Playlist, Track } from '../../lib/firebase/types';
import { Plus, Edit, Trash2, Music, Globe, Lock, Star } from 'lucide-react';

const PlaylistsPage: React.FC = () => {
  const { playlists, loading } = usePlaylists();
  const { tracks } = useTracks('admin');
  const [showModal, setShowModal] = useState(false);
  const [editingPlaylist, setEditingPlaylist] = useState<Playlist | null>(null);
  const [selectedTracks, setSelectedTracks] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isPublic: false,
    isFeatured: false,
  });

  const handleCreate = () => {
    setEditingPlaylist(null);
    setSelectedTracks([]);
    setFormData({
      name: '',
      description: '',
      isPublic: false,
      isFeatured: false,
    });
    setShowModal(true);
  };

  const handleEdit = (playlist: Playlist) => {
    setEditingPlaylist(playlist);
    setSelectedTracks(playlist.trackIds);
    setFormData({
      name: playlist.name,
      description: playlist.description || '',
      isPublic: playlist.isPublic,
      isFeatured: playlist.isFeatured,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this playlist? This cannot be undone.')) return;

    try {
      await playlistService.deletePlaylist(id);
      alert('Playlist deleted successfully');
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleToggleFeatured = async (id: string, currentFeatured: boolean) => {
    try {
      await playlistService.setFeatured(id, !currentFeatured);
      alert(`Playlist ${!currentFeatured ? 'marked as featured' : 'removed from featured'}`);
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleAddTrack = (trackId: string) => {
    if (!selectedTracks.includes(trackId)) {
      setSelectedTracks([...selectedTracks, trackId]);
    }
  };

  const handleRemoveTrack = (trackId: string) => {
    setSelectedTracks(selectedTracks.filter((id) => id !== trackId));
  };

  const handleSavePlaylist = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      alert('Playlist name is required');
      return;
    }

    try {
      if (editingPlaylist) {
        // Update existing playlist
        await playlistService.updatePlaylist(editingPlaylist.id, {
          name: formData.name,
          description: formData.description || undefined,
          isPublic: formData.isPublic,
          isFeatured: formData.isFeatured,
        });

        // Handle track changes
        const tracksToAdd = selectedTracks.filter(
          (id) => !editingPlaylist.trackIds.includes(id)
        );
        const tracksToRemove = editingPlaylist.trackIds.filter(
          (id) => !selectedTracks.includes(id)
        );

        for (const trackId of tracksToAdd) {
          await playlistService.addTrackToPlaylist(editingPlaylist.id, trackId);
        }

        for (const trackId of tracksToRemove) {
          await playlistService.removeTrackFromPlaylist(editingPlaylist.id, trackId);
        }

        alert('Playlist updated successfully');
      } else {
        // Create new playlist
        const newPlaylist = await playlistService.createPlaylistFromForm({
          name: formData.name,
          description: formData.description || undefined,
          trackIds: selectedTracks,
          coverImage: '', // Will be updated based on first track
          isPublic: formData.isPublic,
          isFeatured: formData.isFeatured,
        });

        alert('Playlist created successfully');
      }

      setShowModal(false);
      setEditingPlaylist(null);
      setSelectedTracks([]);
      setFormData({
        name: '',
        description: '',
        isPublic: false,
        isFeatured: false,
      });
    } catch (error: any) {
      alert(error.message);
    }
  };

  // Get track details for selected tracks
  const selectedTracksDetails = useMemo(() => {
    return selectedTracks
      .map((trackId) => tracks.find((t) => t.id === trackId))
      .filter((t) => t !== undefined) as Track[];
  }, [selectedTracks, tracks]);

  // Get available tracks (not already in the form selection)
  const availableTracks = useMemo(() => {
    return tracks.filter((t) => !selectedTracks.includes(t.id));
  }, [tracks, selectedTracks]);

  // Get cover image from first track
  const coverImage = useMemo(() => {
    const firstTrack = selectedTracksDetails[0];
    return firstTrack?.artworkUrl || '';
  }, [selectedTracksDetails]);

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-screen">
          <LoadingSpinner text="Loading playlists..." />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Playlists Management</h1>
            <p className="text-white/40 mt-2">Create and manage your playlists</p>
          </div>
          <button
            onClick={handleCreate}
            className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-all flex items-center space-x-2"
          >
            <Plus size={20} />
            <span>Create Playlist</span>
          </button>
        </div>

        {/* Playlists Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {playlists.map((playlist) => {
            const firstTrack = playlist.trackIds
              .map((id) => tracks.find((t) => t.id === id))
              .find((t) => t !== undefined);

            return (
              <div
                key={playlist.id}
                className="bg-white/[0.05] border border-white/[0.06] rounded-2xl overflow-hidden hover:border-white/[0.12] transition-all group"
              >
                {/* Cover Image */}
                {firstTrack?.artworkUrl ? (
                  <img
                    src={firstTrack.artworkUrl}
                    alt={playlist.name}
                    className="w-full h-48 object-cover"
                  />
                ) : (
                  <div className="w-full h-48 bg-gradient-to-br from-purple-600/20 to-pink-600/20 flex items-center justify-center">
                    <Music size={48} className="text-white/20" />
                  </div>
                )}

                {/* Content */}
                <div className="p-4 space-y-4">
                  {/* Title & Status */}
                  <div>
                    <h3 className="text-lg font-semibold text-white truncate">
                      {playlist.name}
                    </h3>
                    {playlist.description && (
                      <p className="text-sm text-white/40 line-clamp-2 mt-1">
                        {playlist.description}
                      </p>
                    )}
                  </div>

                  {/* Meta Info */}
                  <div className="flex items-center gap-2 text-sm text-white/60">
                    <Music size={16} />
                    <span>{playlist.trackIds.length} tracks</span>
                  </div>

                  {/* Status Badges */}
                  <div className="flex gap-2 flex-wrap">
                    {playlist.isPublic ? (
                      <span className="inline-flex items-center gap-1 bg-white/[0.08] px-3 py-1 rounded-full text-xs text-white/70">
                        <Globe size={12} />
                        Public
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 bg-white/[0.08] px-3 py-1 rounded-full text-xs text-white/70">
                        <Lock size={12} />
                        Private
                      </span>
                    )}
                    {playlist.isFeatured && (
                      <span className="inline-flex items-center gap-1 bg-yellow-600/20 px-3 py-1 rounded-full text-xs text-yellow-300">
                        <Star size={12} fill="currentColor" />
                        Featured
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2 border-t border-white/[0.06]">
                    <button
                      onClick={() => handleEdit(playlist)}
                      className="flex-1 flex items-center justify-center gap-2 bg-white/[0.08] hover:bg-white/[0.12] text-white/80 py-2 rounded-lg transition-all text-sm"
                    >
                      <Edit size={16} />
                      Edit
                    </button>
                    <button
                      onClick={() =>
                        handleToggleFeatured(playlist.id, playlist.isFeatured)
                      }
                      className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg transition-all text-sm ${
                        playlist.isFeatured
                          ? 'bg-yellow-600/20 text-yellow-300'
                          : 'bg-white/[0.08] hover:bg-white/[0.12] text-white/80'
                      }`}
                    >
                      <Star size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(playlist.id)}
                      className="flex-1 flex items-center justify-center gap-2 bg-red-600/10 hover:bg-red-600/20 text-red-400 py-2 rounded-lg transition-all text-sm"
                    >
                      <Trash2 size={16} />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty State */}
        {playlists.length === 0 && !loading && (
          <div className="text-center py-12">
            <Music size={48} className="mx-auto text-white/20 mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">No playlists yet</h3>
            <p className="text-white/40 mb-6">Create your first playlist to get started</p>
            <button
              onClick={handleCreate}
              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-2 rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-all"
            >
              Create Playlist
            </button>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-neutral-950 border border-white/[0.06] rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 flex items-center justify-between p-6 border-b border-white/[0.06] bg-neutral-950/95 backdrop-blur">
              <h2 className="text-xl font-bold text-white">
                {editingPlaylist ? 'Edit Playlist' : 'Create Playlist'}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingPlaylist(null);
                  setSelectedTracks([]);
                  setFormData({
                    name: '',
                    description: '',
                    isPublic: false,
                    isFeatured: false,
                  });
                }}
                className="text-white/40 hover:text-white text-2xl"
              >
                ×
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSavePlaylist} className="p-6 space-y-6">
              {/* Basic Info */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Playlist Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="Enter playlist name"
                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-4 py-2 text-white placeholder-white/30 focus:outline-none focus:border-white/[0.16]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="Enter playlist description (optional)"
                    rows={3}
                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-4 py-2 text-white placeholder-white/30 focus:outline-none focus:border-white/[0.16] resize-none"
                  />
                </div>

                {/* Toggle Options */}
                <div className="space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isPublic}
                      onChange={(e) =>
                        setFormData({ ...formData, isPublic: e.target.checked })
                      }
                      className="w-4 h-4 rounded border-white/[0.16] cursor-pointer"
                    />
                    <span className="text-sm text-white">Make Public</span>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isFeatured}
                      onChange={(e) =>
                        setFormData({ ...formData, isFeatured: e.target.checked })
                      }
                      className="w-4 h-4 rounded border-white/[0.16] cursor-pointer"
                    />
                    <span className="text-sm text-white">Mark as Featured</span>
                  </label>
                </div>
              </div>

              {/* Track Selection */}
              <div className="space-y-4 border-t border-white/[0.06] pt-6">
                <div>
                  <h3 className="text-sm font-semibold text-white mb-3">
                    Add Tracks ({selectedTracks.length})
                  </h3>

                  {/* Available Tracks */}
                  {availableTracks.length > 0 ? (
                    <div className="space-y-2 max-h-40 overflow-y-auto mb-4">
                      {availableTracks.map((track) => (
                        <div
                          key={track.id}
                          className="flex items-center justify-between bg-white/[0.04] rounded-lg p-3 border border-white/[0.08] hover:border-white/[0.12]"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-white truncate">
                              {track.title}
                            </p>
                            <p className="text-xs text-white/40 truncate">
                              {track.artist}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleAddTrack(track.id)}
                            className="ml-2 bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded text-xs font-medium transition-colors"
                          >
                            Add
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-white/40 mb-4">
                      All tracks have been added
                    </p>
                  )}

                  {/* Selected Tracks */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold text-white/60 uppercase">
                      Selected Tracks ({selectedTracks.length})
                    </h4>
                    {selectedTracks.length > 0 ? (
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {selectedTracksDetails.map((track, index) => (
                          <div
                            key={track.id}
                            className="flex items-center justify-between bg-white/[0.08] rounded-lg p-3 border border-white/[0.12]"
                          >
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-white truncate">
                                {index + 1}. {track.title}
                              </p>
                              <p className="text-xs text-white/40 truncate">
                                {track.artist}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveTrack(track.id)}
                              className="ml-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 px-3 py-1 rounded text-xs font-medium transition-colors"
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-white/40">
                        No tracks added yet
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-white/[0.06]">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingPlaylist(null);
                    setSelectedTracks([]);
                    setFormData({
                      name: '',
                      description: '',
                      isPublic: false,
                      isFeatured: false,
                    });
                  }}
                  className="flex-1 bg-white/[0.08] hover:bg-white/[0.12] text-white px-4 py-2 rounded-lg font-semibold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-4 py-2 rounded-lg font-semibold transition-all"
                >
                  {editingPlaylist ? 'Update Playlist' : 'Create Playlist'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default PlaylistsPage;
