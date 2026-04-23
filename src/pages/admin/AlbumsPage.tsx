import React, { useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import LinkInput from '../../components/admin/LinkInput';
import { useAlbums } from '../../hooks/useAlbums';
import { useTracks } from '../../hooks/useTracks';
import { albumService, trackService } from '../../lib/firebase/services';
import { Album, Track } from '../../lib/firebase/types';
import {
  Plus,
  Edit,
  Trash2,
  Music,
  Calendar,
  DollarSign,
  Eye,
  EyeOff,
} from 'lucide-react';
import { Timestamp } from 'firebase/firestore';

const AlbumsPage: React.FC = () => {
  const { albums, loading, error } = useAlbums();
  const { tracks } = useTracks();
  const [showModal, setShowModal] = useState(false);
  const [editingAlbum, setEditingAlbum] = useState<Album | null>(null);
  const [formData, setFormData] = useState<Partial<Album>>({
    title: '',
    artist: '',
    description: '',
    genre: '',
    coverImageUrl: '',
    trackIds: [],
    perTrackPrice: 0,
    fullAlbumPrice: 0,
    isFree: false,
    featured: false,
    status: 'draft',
  });
  const [selectedTracks, setSelectedTracks] = useState<string[]>([]);

  const handleCreate = () => {
    setEditingAlbum(null);
    setFormData({
      title: '',
      artist: '',
      description: '',
      genre: '',
      coverImageUrl: '',
      trackIds: [],
      perTrackPrice: 0,
      fullAlbumPrice: 0,
      isFree: false,
      featured: false,
      status: 'draft',
    });
    setSelectedTracks([]);
    setShowModal(true);
  };

  const handleEdit = (album: Album) => {
    setEditingAlbum(album);
    setFormData(album);
    setSelectedTracks(album.trackIds || []);
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this album?')) return;
    try {
      await albumService.deleteAlbum(id);
      alert('Album deleted successfully');
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleToggleFeatured = async (album: Album) => {
    try {
      await albumService.updateAlbum(album.id, { featured: !album.featured });
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleToggleStatus = async (album: Album) => {
    const newStatus = album.status === 'published' ? 'draft' : 'published';
    try {
      await albumService.updateAlbum(album.id, {
        status: newStatus,
        publishedAt: newStatus === 'published' ? Timestamp.now() : undefined,
      });
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleTrackToggle = (trackId: string) => {
    setSelectedTracks((prev) =>
      prev.includes(trackId)
        ? prev.filter((id) => id !== trackId)
        : [...prev, trackId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const slugTitle = (formData.title || '')
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^\w-]+/g, '');

      const albumData = {
        ...formData,
        trackIds: selectedTracks,
        trackCount: selectedTracks.length,
        slug: slugTitle,
      } as Omit<Album, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'lastUpdatedBy'>;

      if (editingAlbum) {
        await albumService.updateAlbum(editingAlbum.id, albumData);
        alert('Album updated successfully');
      } else {
        await albumService.createAlbum(albumData);
        alert('Album created successfully');
      }
      setShowModal(false);
    } catch (error: any) {
      alert(error.message);
    }
  };

  const getAlbumTracks = (album: Album): Track[] => {
    return tracks.filter((track) => album.trackIds?.includes(track.id));
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-screen">
          <p className="text-white/60">Loading albums...</p>
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
            <h1 className="text-4xl font-bold text-white">Albums</h1>
            <p className="text-white/60 mt-2">Manage music albums and collections</p>
          </div>
          <button
            onClick={handleCreate}
            className="flex items-center gap-2 px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold transition-colors"
          >
            <Plus size={20} />
            Create Album
          </button>
        </div>

        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400">
            {error}
          </div>
        )}

        {/* Albums Grid */}
        <div className="grid gap-6">
          {albums.length === 0 ? (
            <div className="text-center py-12 bg-white/[0.05] rounded-lg border border-white/[0.1]">
              <Music size={48} className="mx-auto text-white/40 mb-4" />
              <p className="text-white/60 mb-4">No albums created yet</p>
              <button
                onClick={handleCreate}
                className="px-6 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold transition-colors"
              >
                Create Your First Album
              </button>
            </div>
          ) : (
            albums.map((album) => {
              const albumTracks = getAlbumTracks(album);

              return (
                <div
                  key={album.id}
                  className="p-6 bg-white/[0.05] border border-white/[0.1] rounded-lg hover:border-white/[0.2] transition-all"
                >
                  <div className="flex gap-6">
                    {/* Cover */}
                    <div className="flex-shrink-0">
                      <img
                        src={album.coverImageUrl || album.artworkUrl}
                        alt={album.title}
                        className="w-32 h-32 object-cover rounded-lg"
                      />
                    </div>

                    {/* Info */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h2 className="text-2xl font-bold text-white">
                            {album.title}
                          </h2>
                          <p className="text-white/60">{album.artist}</p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleToggleFeatured(album)}
                            className={`p-2 rounded-lg transition-colors ${
                              album.featured
                                ? 'bg-yellow-500/20 text-yellow-400'
                                : 'bg-white/[0.1] text-white/60 hover:text-white'
                            }`}
                            title={album.featured ? 'Unfeature' : 'Feature'}
                          >
                            {album.featured ? '★' : '☆'}
                          </button>
                          <button
                            onClick={() => handleToggleStatus(album)}
                            className={`p-2 rounded-lg transition-colors ${
                              album.status === 'published'
                                ? 'bg-green-500/20 text-green-400'
                                : 'bg-white/[0.1] text-white/60'
                            }`}
                            title={album.status === 'published' ? 'Unpublish' : 'Publish'}
                          >
                            {album.status === 'published' ? (
                              <Eye size={18} />
                            ) : (
                              <EyeOff size={18} />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="grid grid-cols-4 gap-4 mb-4 text-sm">
                        <div>
                          <p className="text-white/60">Tracks</p>
                          <p className="text-lg font-bold text-white">
                            {albumTracks.length}
                          </p>
                        </div>
                        <div>
                          <p className="text-white/60">Genre</p>
                          <p className="text-lg font-bold text-white">{album.genre}</p>
                        </div>
                        <div>
                          <p className="text-white/60">Per-Track Price</p>
                          <p className="text-lg font-bold text-white">
                            ${album.perTrackPrice.toFixed(2)}
                          </p>
                        </div>
                        <div>
                          <p className="text-white/60">Album Price</p>
                          <p className="text-lg font-bold text-white">
                            {album.isFree ? (
                              <span className="text-green-400">Free</span>
                            ) : (
                              `$${album.fullAlbumPrice.toFixed(2)}`
                            )}
                          </p>
                        </div>
                      </div>

                      {/* Description */}
                      {album.description && (
                        <p className="text-white/60 text-sm mb-4 line-clamp-2">
                          {album.description}
                        </p>
                      )}

                      {/* Actions */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(album)}
                          className="flex items-center gap-2 px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg transition-colors text-sm font-semibold"
                        >
                          <Edit size={16} />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(album.id)}
                          className="flex items-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors text-sm font-semibold"
                        >
                          <Trash2 size={16} />
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowModal(false)} />
            <div className="relative bg-white/[0.08] backdrop-blur-xl border border-white/[0.15] rounded-2xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <button
                onClick={() => setShowModal(false)}
                className="absolute top-4 right-4 text-white/60 hover:text-white"
              >
                ✕
              </button>

              <h2 className="text-2xl font-bold text-white mb-6">
                {editingAlbum ? 'Edit Album' : 'Create Album'}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Info */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-white/80 mb-2">
                      Album Title <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.title || ''}
                      onChange={(e) =>
                        setFormData({ ...formData, title: e.target.value })
                      }
                      required
                      className="w-full px-4 py-2 bg-white/[0.1] border border-white/[0.2] rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-white/[0.3]"
                      placeholder="Album title"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-white/80 mb-2">
                      Artist <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.artist || ''}
                      onChange={(e) =>
                        setFormData({ ...formData, artist: e.target.value })
                      }
                      required
                      className="w-full px-4 py-2 bg-white/[0.1] border border-white/[0.2] rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-white/[0.3]"
                      placeholder="Artist name"
                    />
                  </div>
                </div>

                {/* Genre */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-white/80 mb-2">
                      Genre <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.genre || ''}
                      onChange={(e) =>
                        setFormData({ ...formData, genre: e.target.value })
                      }
                      required
                      className="w-full px-4 py-2 bg-white/[0.1] border border-white/[0.2] rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-white/[0.3]"
                      placeholder="e.g., Electronic, Hip-Hop"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-white/80 mb-2">
                      Sub-Genre (Optional)
                    </label>
                    <input
                      type="text"
                      value={formData.subGenre || ''}
                      onChange={(e) =>
                        setFormData({ ...formData, subGenre: e.target.value })
                      }
                      className="w-full px-4 py-2 bg-white/[0.1] border border-white/[0.2] rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-white/[0.3]"
                      placeholder="e.g., House, Trap"
                    />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-semibold text-white/80 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    rows={4}
                    className="w-full px-4 py-2 bg-white/[0.1] border border-white/[0.2] rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-white/[0.3]"
                    placeholder="Album description"
                  />
                </div>

                {/* Cover Image */}
                <LinkInput
                  label="Cover Image URL"
                  name="coverImageUrl"
                  type="image"
                  onChange={(url) => setFormData({ ...formData, coverImageUrl: url })}
                  defaultValue={formData.coverImageUrl || ''}
                  placeholder="https://example.com/cover.jpg"
                />

                {/* Pricing */}
                <div className="space-y-4 p-4 bg-white/[0.05] rounded-lg border border-white/[0.1]">
                  <h3 className="text-sm font-semibold text-white">Pricing</h3>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-white/80 mb-2">
                        Per-Track Price ($)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.perTrackPrice || 0}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            perTrackPrice: parseFloat(e.target.value),
                          })
                        }
                        className="w-full px-4 py-2 bg-white/[0.1] border border-white/[0.2] rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-white/[0.3]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-white/80 mb-2">
                        Full Album Price ($)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.fullAlbumPrice || 0}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            fullAlbumPrice: parseFloat(e.target.value),
                          })
                        }
                        className="w-full px-4 py-2 bg-white/[0.1] border border-white/[0.2] rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-white/[0.3]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-white/80 mb-2">
                        Is Free?
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.isFree || false}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              isFree: e.target.checked,
                            })
                          }
                          className="w-4 h-4"
                        />
                        <span className="text-white/80 text-sm">Free Album</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Status */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-white/80 mb-2">
                      Status
                    </label>
                    <select
                      value={formData.status || 'draft'}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          status: e.target.value as 'draft' | 'published' | 'archived',
                        })
                      }
                      className="w-full px-4 py-2 bg-white/[0.1] border border-white/[0.2] rounded-lg text-white focus:outline-none focus:border-white/[0.3]"
                    >
                      <option value="draft" className="bg-gray-800">Draft</option>
                      <option value="published" className="bg-gray-800">Published</option>
                      <option value="archived" className="bg-gray-800">Archived</option>
                    </select>
                  </div>
                  <div>
                    <label className="flex items-center gap-2 cursor-pointer mt-7">
                      <input
                        type="checkbox"
                        checked={formData.featured || false}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            featured: e.target.checked,
                          })
                        }
                        className="w-4 h-4"
                      />
                      <span className="text-white/80 font-semibold">Featured Album</span>
                    </label>
                  </div>
                </div>

                {/* Track Selection */}
                <div>
                  <label className="block text-sm font-semibold text-white/80 mb-3">
                    Select Tracks ({selectedTracks.length}/{tracks.length})
                  </label>
                  <div className="space-y-2 max-h-64 overflow-y-auto bg-white/[0.02] rounded-lg p-4 border border-white/[0.1]">
                    {tracks.length === 0 ? (
                      <p className="text-white/60 text-sm">No tracks available. Create tracks first.</p>
                    ) : (
                      tracks.map((track) => (
                        <label
                          key={track.id}
                          className="flex items-center gap-3 p-2 hover:bg-white/[0.05] rounded cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={selectedTracks.includes(track.id)}
                            onChange={() => handleTrackToggle(track.id)}
                            className="w-4 h-4"
                          />
                          <div className="flex-1">
                            <p className="text-white text-sm">{track.title}</p>
                            <p className="text-white/60 text-xs">{track.artist}</p>
                          </div>
                          <span className="text-white/60 text-xs">{track.genre}</span>
                        </label>
                      ))
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-6 border-t border-white/[0.1]">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 px-6 py-2 bg-white/[0.1] hover:bg-white/[0.15] text-white rounded-lg font-semibold transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-6 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold transition-colors"
                  >
                    {editingAlbum ? 'Update Album' : 'Create Album'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AlbumsPage;
