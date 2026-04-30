import React, { useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import LinkInput from '../../components/admin/LinkInput';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useEdits } from '../../hooks/useEdits';
import { editService } from '../../lib/firebase/services';
import { Edit } from '../../lib/firebase/types';
import { Plus, Edit as EditIcon, Trash2, Play, Pause } from 'lucide-react';

const EditsPage: React.FC = () => {
  const { edits, loading } = useEdits();
  const [showModal, setShowModal] = useState(false);
  const [editingEdit, setEditingEdit] = useState<Edit | null>(null);
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);

  const handleCreate = () => {
    setEditingEdit(null);
    setShowModal(true);
  };

  const handleEdit = (edit: Edit) => {
    setEditingEdit(edit);
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this edit?')) return;

    try {
      await editService.deleteEdit(id);
      alert('Edit deleted successfully');
    } catch (error: any) {
      alert(error.message);
    }
  };

  const togglePlay = (editId: string) => {
    if (currentlyPlaying === editId) {
      setCurrentlyPlaying(null);
    } else {
      setCurrentlyPlaying(editId);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Edits Management</h1>
            <p className="text-white/40 mt-2">Manage your edits, bootlegs, and mashups</p>
          </div>
          <button
            onClick={handleCreate}
            className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-all flex items-center space-x-2"
          >
            <Plus size={20} />
            <span>Add Edit</span>
          </button>
        </div>

        <div className="bg-white/[0.08] border border-white/[0.06] rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/[0.06]">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white/60">Edit</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white/60">Type</th>
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
                      <LoadingSpinner text="Loading edits..." />
                    </td>
                  </tr>
                ) : edits.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-white/40">
                      No edits yet. Create your first edit!
                    </td>
                  </tr>
                ) : (
                  edits.map((edit) => (
                    <tr key={edit.id} className="hover:bg-white/[0.06]">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <img
                            src={edit.artworkUrl}
                            alt={edit.title}
                            className="w-12 h-12 rounded object-cover"
                          />
                          <div>
                            <p className="font-medium text-white">{edit.title}</p>
                            <p className="text-sm text-white/40">{edit.artist}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-sm capitalize">
                          {edit.editType}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded text-sm">
                          {edit.genre}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-white/60">
                        {edit.bpm} BPM / {edit.key}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2 py-1 rounded text-sm ${
                            edit.status === 'published'
                              ? 'bg-green-500/20 text-green-400'
                              : edit.status === 'draft'
                              ? 'bg-yellow-500/20 text-yellow-400'
                              : 'bg-white/[0.06] text-white/40'
                          }`}
                        >
                          {edit.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-white/60">{edit.plays}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => togglePlay(edit.id)}
                            className="p-2 text-white/40 hover:text-purple-400 transition-colors"
                            title="Play preview"
                          >
                            {currentlyPlaying === edit.id ? <Pause size={18} /> : <Play size={18} />}
                          </button>
                          <button
                            onClick={() => handleEdit(edit)}
                            className="p-2 text-white/40 hover:text-blue-400 transition-colors"
                            title="Edit"
                          >
                            <EditIcon size={18} />
                          </button>
                          <button
                            onClick={() => handleDelete(edit.id)}
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
        <EditFormModal
          edit={editingEdit}
          onClose={() => setShowModal(false)}
          onSave={() => {
            setShowModal(false);
            setEditingEdit(null);
          }}
        />
      )}
    </AdminLayout>
  );
};

interface EditFormModalProps {
  edit: Edit | null;
  onClose: () => void;
  onSave: () => void;
}

const EditFormModal: React.FC<EditFormModalProps> = ({ edit, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    title: edit?.title || '',
    artist: edit?.artist || 'Jonna Rincon',
    originalArtist: edit?.originalArtist || '',
    editType: edit?.editType || 'bootleg',
    bpm: edit?.bpm || 120,
    key: edit?.key || '',
    genre: edit?.genre || '',
    tags: edit?.tags?.join(', ') || '',
    audioUrl: edit?.audioUrl || '',
    artworkUrl: edit?.artworkUrl || '',
    slug: edit?.slug || '',
    status: edit?.status || 'draft',
    featured: edit?.featured || false,
    isFree: edit?.isFree || false,
    basicPrice: edit?.licenses?.basic?.price || 5,
    premiumPrice: edit?.licenses?.premium?.price || 12,
    exclusivePrice: edit?.licenses?.exclusive?.price || 59,
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const editData: any = {
        title: formData.title,
        artist: formData.artist,
        originalArtist: formData.originalArtist,
        editType: formData.editType,
        bpm: formData.bpm,
        key: formData.key,
        genre: formData.genre,
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
            price: formData.basicPrice,
            features: ['MP3 Download', 'Personal use'],
            downloads: 1,
            streams: 5000,
            videos: 1,
            distribution: false,
          },
          premium: {
            type: 'premium' as const,
            price: formData.premiumPrice,
            features: ['WAV + MP3', 'Commercial use', 'Unlimited streams'],
            downloads: 5,
            streams: 500000,
            videos: 5,
            distribution: true,
          },
          exclusive: {
            type: 'exclusive' as const,
            price: formData.exclusivePrice,
            features: ['All files', 'Exclusive rights', 'Full ownership'],
            downloads: -1,
            streams: -1,
            videos: -1,
            distribution: true,
          },
        },
      };

      if (edit) {
        await editService.updateEdit(edit.id, editData);
        alert('Edit updated successfully');
      } else {
        await editService.createEdit(editData);
        alert('Edit created successfully');
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
            {edit ? 'Edit Item' : 'Add New Edit'}
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
              <label className="block text-sm font-medium text-white/60 mb-2">Artist <span className="text-red-400">*</span></label>
              <input
                type="text"
                value={formData.artist}
                onChange={(e) => setFormData({ ...formData, artist: e.target.value })}
                className="w-full px-4 py-2 bg-white/[0.06] border border-white/[0.08] rounded-lg text-white"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/60 mb-2">Original Artist</label>
              <input
                type="text"
                value={formData.originalArtist}
                onChange={(e) => setFormData({ ...formData, originalArtist: e.target.value })}
                className="w-full px-4 py-2 bg-white/[0.06] border border-white/[0.08] rounded-lg text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/60 mb-2">Edit Type</label>
              <select
                value={formData.editType}
                onChange={(e) => setFormData({ ...formData, editType: e.target.value as any })}
                className="w-full px-4 py-2 bg-white/[0.06] border border-white/[0.08] rounded-lg text-white"
              >
                <option value="bootleg">Bootleg</option>
                <option value="mashup">Mashup</option>
                <option value="rework">Rework</option>
                <option value="flip">Flip</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-white/60 mb-2">BPM <span className="text-red-400">*</span></label>
              <input
                type="number"
                value={formData.bpm}
                onChange={(e) => setFormData({ ...formData, bpm: parseInt(e.target.value) })}
                className="w-full px-4 py-2 bg-white/[0.06] border border-white/[0.08] rounded-lg text-white"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/60 mb-2">Key <span className="text-red-400">*</span></label>
              <input
                type="text"
                value={formData.key}
                onChange={(e) => setFormData({ ...formData, key: e.target.value })}
                className="w-full px-4 py-2 bg-white/[0.06] border border-white/[0.08] rounded-lg text-white"
                required
              />
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
              <label className="block text-sm font-medium text-white/60 mb-2">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as Edit['status'] })}
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
              placeholder="bootleg, edit, mashup"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white/60 mb-2">Slug</label>
            <input
              type="text"
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              className="w-full px-4 py-2 bg-white/[0.06] border border-white/[0.08] rounded-lg text-white"
              placeholder="auto-generated"
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

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-white/60 mb-2">Basic Price (€)</label>
              <input
                type="number"
                value={formData.basicPrice}
                onChange={(e) => setFormData({ ...formData, basicPrice: parseFloat(e.target.value) })}
                className="w-full px-4 py-2 bg-white/[0.06] border border-white/[0.08] rounded-lg text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/60 mb-2">Premium Price (€)</label>
              <input
                type="number"
                value={formData.premiumPrice}
                onChange={(e) => setFormData({ ...formData, premiumPrice: parseFloat(e.target.value) })}
                className="w-full px-4 py-2 bg-white/[0.06] border border-white/[0.08] rounded-lg text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/60 mb-2">Exclusive Price (€)</label>
              <input
                type="number"
                value={formData.exclusivePrice}
                onChange={(e) => setFormData({ ...formData, exclusivePrice: parseFloat(e.target.value) })}
                className="w-full px-4 py-2 bg-white/[0.06] border border-white/[0.08] rounded-lg text-white"
              />
            </div>
          </div>

          <div>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.featured}
                onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                className="w-4 h-4"
              />
              <span className="text-sm text-white/60">Featured Edit</span>
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
              {saving ? 'Saving...' : edit ? 'Update Edit' : 'Create Edit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditsPage;
