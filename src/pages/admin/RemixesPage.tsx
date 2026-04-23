import React, { useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import LinkInput from '../../components/admin/LinkInput';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useRemixes } from '../../hooks/useRemixes';
import { remixService } from '../../lib/firebase/services';
import { Remix } from '../../lib/firebase/types';
import { Plus, Edit, Trash2, Play, Pause, ArrowUp, ArrowDown } from 'lucide-react';

const RemixesPage: React.FC = () => {
  const { remixes, loading } = useRemixes();
  const [showModal, setShowModal] = useState(false);
  const [editingRemix, setEditingRemix] = useState<Remix | null>(null);
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);

  const handleCreate = () => {
    setEditingRemix(null);
    setShowModal(true);
  };

  const handleEdit = (remix: Remix) => {
    setEditingRemix(remix);
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this remix?')) return;
    try {
      await remixService.deleteRemix(id);
      alert('Remix deleted successfully');
    } catch (error: any) {
      alert(error.message);
    }
  };

  const togglePlay = (remixId: string) => {
    if (currentlyPlaying === remixId) {
      setCurrentlyPlaying(null);
    } else {
      setCurrentlyPlaying(remixId);
    }
  };

  const moveRemixUp = async (remixId: string) => {
    const index = remixes.findIndex(r => r.id === remixId);
    if (index > 0) {
      const remix = remixes[index];
      const prevRemix = remixes[index - 1];

      // Swap sortOrder values
      const tempSort = remix.sortOrder ?? index;
      await remixService.updateRemix(remix.id, { sortOrder: prevRemix.sortOrder ?? (index - 1) });
      await remixService.updateRemix(prevRemix.id, { sortOrder: tempSort });
    }
  };

  const moveRemixDown = async (remixId: string) => {
    const index = remixes.findIndex(r => r.id === remixId);
    if (index < remixes.length - 1) {
      const remix = remixes[index];
      const nextRemix = remixes[index + 1];

      // Swap sortOrder values
      const tempSort = remix.sortOrder ?? index;
      await remixService.updateRemix(remix.id, { sortOrder: nextRemix.sortOrder ?? (index + 1) });
      await remixService.updateRemix(nextRemix.id, { sortOrder: tempSort });
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Remixes Management</h1>
            <p className="text-white/40 mt-2">Manage your remix catalog</p>
          </div>
          <button
            onClick={handleCreate}
            className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-all flex items-center space-x-2"
          >
            <Plus size={20} />
            <span>Add Remix</span>
          </button>
        </div>

        <div className="bg-white/[0.08] border border-white/[0.06] rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/[0.06]">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white/60">Remix</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white/60">Original</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white/60">Genre</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white/60">BPM / Key</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white/60">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white/60">Plays</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-white/60">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06]">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12">
                      <LoadingSpinner text="Loading remixes..." />
                    </td>
                  </tr>
                ) : remixes.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-white/40">
                      No remixes yet. Create your first remix!
                    </td>
                  </tr>
                ) : (
                  remixes.map((remix) => (
                    <tr key={remix.id} className="hover:bg-white/[0.06]">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <img
                            src={remix.artworkUrl}
                            alt={remix.title}
                            className="w-12 h-12 rounded object-cover"
                          />
                          <div>
                            <p className="font-medium text-white">{remix.title}</p>
                            <p className="text-sm text-white/40">{remix.remixArtist}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-sm text-white">{remix.originalArtist}</p>
                          <p className="text-xs text-white/40">{remix.originalTrackTitle}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded text-sm">
                          {remix.genre}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-white/60">
                        {remix.bpm} BPM / {remix.key}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2 py-1 rounded text-sm ${
                            remix.status === 'published'
                              ? 'bg-green-500/20 text-green-400'
                              : remix.status === 'draft'
                              ? 'bg-yellow-500/20 text-yellow-400'
                              : 'bg-white/[0.06] text-white/40'
                          }`}
                        >
                          {remix.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-white/60">{remix.plays}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => moveRemixUp(remix.id)}
                            disabled={remixes.findIndex(r => r.id === remix.id) === 0}
                            className="p-2 text-white/40 hover:text-white disabled:opacity-30 transition-colors"
                            title="Move up"
                          >
                            <ArrowUp size={18} />
                          </button>
                          <button
                            onClick={() => moveRemixDown(remix.id)}
                            disabled={remixes.findIndex(r => r.id === remix.id) === remixes.length - 1}
                            className="p-2 text-white/40 hover:text-white disabled:opacity-30 transition-colors"
                            title="Move down"
                          >
                            <ArrowDown size={18} />
                          </button>
                          <button
                            onClick={() => togglePlay(remix.id)}
                            className="p-2 text-white/40 hover:text-purple-400 transition-colors"
                            title="Play preview"
                          >
                            {currentlyPlaying === remix.id ? <Pause size={18} /> : <Play size={18} />}
                          </button>
                          <button
                            onClick={() => handleEdit(remix)}
                            className="p-2 text-white/40 hover:text-blue-400 transition-colors"
                            title="Edit"
                          >
                            <Edit size={18} />
                          </button>
                          <button
                            onClick={() => handleDelete(remix.id)}
                            className="p-2 text-white/40 hover:text-red-400 transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showModal && (
        <RemixFormModal
          remix={editingRemix}
          onClose={() => setShowModal(false)}
          onSave={() => {
            setShowModal(false);
            setEditingRemix(null);
          }}
        />
      )}
    </AdminLayout>
  );
};

interface RemixFormModalProps {
  remix: Remix | null;
  onClose: () => void;
  onSave: () => void;
}

const RemixFormModal: React.FC<RemixFormModalProps> = ({ remix, onClose, onSave }) => {
  const currentYear = new Date().getFullYear();
  const [formData, setFormData] = useState({
    title: remix?.title || '',
    remixArtist: remix?.remixArtist || 'Jonna Rincon',
    originalArtist: remix?.originalArtist || '',
    originalTrackTitle: remix?.originalTrackTitle || '',
    genre: remix?.genre || '',
    remixType: remix?.remixType || 'Remix',
    year: remix?.year || currentYear,
    collab: remix?.collab || 'Solo',
    duration: remix?.duration || '0:00',
    tags: remix?.tags?.join(', ') || '',
    audioUrl: remix?.audioUrl || '',
    artworkUrl: remix?.artworkUrl || '',
    slug: remix?.slug || '',
    status: remix?.status || 'draft',
    featured: remix?.featured || false,
    isFree: remix?.isFree || false,
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const remixData: any = {
        title: formData.title,
        remixArtist: formData.remixArtist,
        originalArtist: formData.originalArtist,
        originalTrackTitle: formData.originalTrackTitle,
        genre: formData.genre,
        remixType: formData.remixType,
        year: formData.year,
        collab: formData.collab,
        duration: formData.duration,
        tags: formData.tags.split(',').map((t) => t.trim()),
        audioUrl: formData.audioUrl,
        artworkUrl: formData.artworkUrl,
        slug: formData.slug || formData.title.toLowerCase().replace(/\s+/g, '-'),
        status: formData.status,
        featured: formData.featured,
        isFree: formData.isFree,
        licenses: {
          basic: {
            type: 'basic' as const,
            price: 9,
            features: ['MP3 Download', 'Non-exclusive rights', 'Personal use'],
            downloads: 1,
            streams: 10000,
            videos: 1,
            distribution: false,
          },
          premium: {
            type: 'premium' as const,
            price: 19,
            features: ['WAV + MP3', 'Non-exclusive rights', 'Commercial use', 'Unlimited streams'],
            downloads: 5,
            streams: 1000000,
            videos: 5,
            distribution: true,
          },
          exclusive: {
            type: 'exclusive' as const,
            price: 99,
            features: ['All files', 'Exclusive rights', 'Full ownership', 'Unlimited use'],
            downloads: -1,
            streams: -1,
            videos: -1,
            distribution: true,
          },
        },
      };

      if (remix) {
        await remixService.updateRemix(remix.id, remixData);
        alert('Remix updated successfully');
      } else {
        await remixService.createRemix(remixData);
        alert('Remix created successfully');
      }

      onSave();
    } catch (error: any) {
      alert(error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xl z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white/[0.10] backdrop-blur-2xl border border-white/[0.10] rounded-2xl max-w-2xl w-full my-8">
        <div className="p-6 border-b border-white/[0.08]">
          <h2 className="text-2xl font-bold text-white">
            {remix ? 'Edit Remix' : 'Add New Remix'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white/60 mb-2">Title <span className="text-red-400">*</span></label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2 bg-white/[0.06] border border-white/[0.08] rounded-lg text-white"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/60 mb-2">Remix Artist <span className="text-red-400">*</span></label>
              <input
                type="text"
                value={formData.remixArtist}
                onChange={(e) => setFormData({ ...formData, remixArtist: e.target.value })}
                className="w-full px-4 py-2 bg-white/[0.06] border border-white/[0.08] rounded-lg text-white"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/60 mb-2">Original Artist <span className="text-red-400">*</span></label>
              <input
                type="text"
                value={formData.originalArtist}
                onChange={(e) => setFormData({ ...formData, originalArtist: e.target.value })}
                className="w-full px-4 py-2 bg-white/[0.06] border border-white/[0.08] rounded-lg text-white"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/60 mb-2">Original Track Title</label>
              <input
                type="text"
                value={formData.originalTrackTitle}
                onChange={(e) => setFormData({ ...formData, originalTrackTitle: e.target.value })}
                className="w-full px-4 py-2 bg-white/[0.06] border border-white/[0.08] rounded-lg text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/60 mb-2">Type <span className="text-red-400">*</span></label>
              <select
                value={formData.remixType}
                onChange={(e) => setFormData({ ...formData, remixType: e.target.value as 'Remix' | 'Edit' | 'Bootleg' })}
                className="w-full px-4 py-2 bg-white/[0.06] border border-white/[0.08] rounded-lg text-white"
                required
              >
                <option value="Remix">Remix</option>
                <option value="Edit">Edit</option>
                <option value="Bootleg">Bootleg</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-white/60 mb-2">Year <span className="text-red-400">*</span></label>
              <input
                type="number"
                value={formData.year}
                onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                className="w-full px-4 py-2 bg-white/[0.06] border border-white/[0.08] rounded-lg text-white"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/60 mb-2">Collab <span className="text-red-400">*</span></label>
              <select
                value={formData.collab}
                onChange={(e) => setFormData({ ...formData, collab: e.target.value as 'Solo' | 'Collab' })}
                className="w-full px-4 py-2 bg-white/[0.06] border border-white/[0.08] rounded-lg text-white"
                required
              >
                <option value="Solo">Solo</option>
                <option value="Collab">Collab</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-white/60 mb-2">Genre <span className="text-red-400">*</span></label>
              <input
                type="text"
                value={formData.genre}
                onChange={(e) => setFormData({ ...formData, genre: e.target.value })}
                className="w-full px-4 py-2 bg-white/[0.06] border border-white/[0.08] rounded-lg text-white"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/60 mb-2">Duration</label>
              <input
                type="text"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                className="w-full px-4 py-2 bg-white/[0.06] border border-white/[0.08] rounded-lg text-white"
                placeholder="e.g. 3:45"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/60 mb-2">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as Remix['status'] })}
                className="w-full px-4 py-2 bg-white/[0.06] border border-white/[0.08] rounded-lg text-white"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-white/60 mb-2">Tags (comma separated)</label>
            <input
              type="text"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              className="w-full px-4 py-2 bg-white/[0.06] border border-white/[0.08] rounded-lg text-white"
              placeholder="electronic, remix, bootleg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white/60 mb-2">Slug</label>
            <input
              type="text"
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              className="w-full px-4 py-2 bg-white/[0.06] border border-white/[0.08] rounded-lg text-white"
              placeholder="auto-generated from title"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <LinkInput
              label="Audio URL"
              name="audioUrl"
              type="audio"
              onChange={(url) => setFormData({ ...formData, audioUrl: url })}
              defaultValue={formData.audioUrl}
              placeholder="https://nextcloud.example.com/index.php/s/abc123"
            />
            <LinkInput
              label="Artwork URL"
              name="artworkUrl"
              type="image"
              onChange={(url) => setFormData({ ...formData, artworkUrl: url })}
              defaultValue={formData.artworkUrl}
              placeholder="https://example.com/image.jpg"
            />
          </div>

          <div>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.featured}
                onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                className="w-4 h-4"
              />
              <span className="text-sm text-white/60">Featured Remix</span>
            </label>
          </div>

          <div>
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isFree}
                onChange={(e) => setFormData({ ...formData, isFree: e.target.checked })}
                className="w-5 h-5 rounded bg-white/[0.06] border-white/[0.08] text-purple-500 focus:ring-purple-500"
              />
              <div>
                <span className="text-sm font-medium text-white/60">Free Download</span>
                <p className="text-xs text-white/30">Enable to offer this track as a free download</p>
              </div>
            </label>
          </div>

          <div className="flex items-center justify-end space-x-4 pt-4 border-t border-white/[0.06]">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 text-white/40 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-2 rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50"
            >
              {saving ? 'Saving...' : remix ? 'Update Remix' : 'Create Remix'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RemixesPage;
