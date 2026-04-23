import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import LinkInput from '../../components/admin/LinkInput';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useBeats } from '../../hooks/useBeats';
import { beatService, beatPackService } from '../../lib/firebase/services';
import { Beat, BeatPack, BeatPackItem } from '../../lib/firebase/types';
import { Plus, Edit, Trash2, Play, Pause, ArrowUp, ArrowDown, Package, ChevronLeft, ChevronRight, X } from 'lucide-react';

const BeatsPage: React.FC = () => {
  const { beats, loading } = useBeats();
  const [showModal, setShowModal] = useState(false);
  const [editingBeat, setEditingBeat] = useState<Beat | null>(null);
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);
  const [packs, setPacks] = useState<BeatPack[]>([]);
  const [showPackModal, setShowPackModal] = useState(false);
  const [editingPack, setEditingPack] = useState<BeatPack | null>(null);

  useEffect(() => {
    beatPackService.getAllPacks().then(setPacks).catch((e) => console.error(e));
  }, [showPackModal]);

  const handleCreate = () => {
    setEditingBeat(null);
    setShowModal(true);
  };

  const handleCreatePack = () => {
    setEditingPack(null);
    setShowPackModal(true);
  };

  const handleEditPack = (pack: BeatPack) => {
    setEditingPack(pack);
    setShowPackModal(true);
  };

  const handleDeletePack = async (id: string) => {
    if (!confirm('Delete this beat pack?')) return;
    try {
      await beatPackService.deletePack(id);
      setPacks((p) => p.filter((x) => x.id !== id));
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleEdit = (beat: Beat) => {
    setEditingBeat(beat);
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this beat?')) return;

    try {
      await beatService.deleteBeat(id);
      alert('Beat deleted successfully');
    } catch (error: any) {
      alert(error.message);
    }
  };

  const togglePlay = (beatId: string) => {
    if (currentlyPlaying === beatId) {
      setCurrentlyPlaying(null);
    } else {
      setCurrentlyPlaying(beatId);
    }
  };

  const moveBeatUp = async (beatId: string) => {
    const index = beats.findIndex(b => b.id === beatId);
    if (index > 0) {
      const beat = beats[index];
      const prevBeat = beats[index - 1];

      // Swap sortOrder values
      const tempSort = beat.sortOrder ?? index;
      await beatService.updateBeat(beat.id, { sortOrder: prevBeat.sortOrder ?? (index - 1) });
      await beatService.updateBeat(prevBeat.id, { sortOrder: tempSort });
    }
  };

  const moveBeatDown = async (beatId: string) => {
    const index = beats.findIndex(b => b.id === beatId);
    if (index < beats.length - 1) {
      const beat = beats[index];
      const nextBeat = beats[index + 1];

      // Swap sortOrder values
      const tempSort = beat.sortOrder ?? index;
      await beatService.updateBeat(beat.id, { sortOrder: nextBeat.sortOrder ?? (index + 1) });
      await beatService.updateBeat(nextBeat.id, { sortOrder: tempSort });
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Beats Management</h1>
            <p className="text-white/40 mt-2">Manage your beat catalog</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleCreatePack}
              className="bg-gradient-to-r from-orange-600 to-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-orange-700 hover:to-red-700 transition-all flex items-center space-x-2"
            >
              <Package size={20} />
              <span>Add Pack</span>
            </button>
            <button
              onClick={handleCreate}
              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-all flex items-center space-x-2"
            >
              <Plus size={20} />
              <span>Add Beat</span>
            </button>
          </div>
        </div>

        {/* Beat Packs Section */}
        {packs.length > 0 && (
          <div className="bg-white/[0.08] border border-white/[0.06] rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-white/[0.06] flex items-center justify-between">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Package size={18} /> Beat Packs
              </h2>
              <span className="text-sm text-white/40">{packs.length} pack{packs.length !== 1 ? 's' : ''}</span>
            </div>
            <div className="divide-y divide-white/[0.06]">
              {packs.map((pack) => (
                <div key={pack.id} className="px-6 py-4 flex items-center gap-4 hover:bg-white/[0.04]">
                  <img src={pack.coverUrl} alt={pack.title} className="w-14 h-14 rounded object-cover flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-white truncate">{pack.title}</p>
                    <p className="text-xs text-white/40">{pack.beats.length} beat{pack.beats.length !== 1 ? 's' : ''} · €{pack.price}</p>
                  </div>
                  <span className={`px-2 py-1 rounded text-sm ${pack.status === 'published' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                    {pack.status}
                  </span>
                  <button onClick={() => handleEditPack(pack)} className="p-2 text-white/40 hover:text-blue-400 transition-colors"><Edit size={18} /></button>
                  <button onClick={() => handleDeletePack(pack.id)} className="p-2 text-white/40 hover:text-red-400 transition-colors"><Trash2 size={18} /></button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Beats Table */}
        <div className="bg-white/[0.08] border border-white/[0.06] rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/[0.06]">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white/60">
                    Beat
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white/60">
                    Genre
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white/60">
                    BPM / Key
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white/60">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white/60">
                    Type
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white/60">
                    Plays
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-white/60">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06]">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12">
                      <LoadingSpinner text="Loading beats..." />
                    </td>
                  </tr>
                ) : beats.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-white/40">
                      No beats yet. Create your first beat!
                    </td>
                  </tr>
                ) : (
                  beats.map((beat) => (
                    <tr key={beat.id} className="hover:bg-white/[0.06]">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <img
                            src={beat.artworkUrl}
                            alt={beat.title}
                            className="w-12 h-12 rounded object-cover"
                          />
                          <div>
                            <p className="font-medium text-white">{beat.title}</p>
                            <p className="text-sm text-white/40">{beat.artist}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded text-sm">
                          {beat.genre}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-white/60">
                        {beat.bpm} BPM / {beat.key}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2 py-1 rounded text-sm ${
                            beat.status === 'published'
                              ? 'bg-green-500/20 text-green-400'
                              : beat.status === 'draft'
                              ? 'bg-yellow-500/20 text-yellow-400'
                              : 'bg-white/[0.06] text-white/40'
                          }`}
                        >
                          {beat.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2 py-1 rounded text-sm capitalize ${
                            beat.beatType === 'free'
                              ? 'bg-green-500/20 text-green-400'
                              : beat.beatType === 'exclusive'
                              ? 'bg-orange-500/20 text-orange-400'
                              : 'bg-gray-500/20 text-gray-400'
                          }`}
                        >
                          {beat.beatType || 'free'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-white/60">{beat.plays}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => moveBeatUp(beat.id)}
                            disabled={beats.findIndex(b => b.id === beat.id) === 0}
                            className="p-2 text-white/40 hover:text-white disabled:opacity-30 transition-colors"
                            title="Move up"
                          >
                            <ArrowUp size={18} />
                          </button>
                          <button
                            onClick={() => moveBeatDown(beat.id)}
                            disabled={beats.findIndex(b => b.id === beat.id) === beats.length - 1}
                            className="p-2 text-white/40 hover:text-white disabled:opacity-30 transition-colors"
                            title="Move down"
                          >
                            <ArrowDown size={18} />
                          </button>
                          <button
                            onClick={() => togglePlay(beat.id)}
                            className="p-2 text-white/40 hover:text-purple-400 transition-colors"
                            title="Play preview"
                          >
                            {currentlyPlaying === beat.id ? <Pause size={18} /> : <Play size={18} />}
                          </button>
                          <button
                            onClick={() => handleEdit(beat)}
                            className="p-2 text-white/40 hover:text-blue-400 transition-colors"
                            title="Edit"
                          >
                            <Edit size={18} />
                          </button>
                          <button
                            onClick={() => handleDelete(beat.id)}
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

      {/* Beat Form Modal */}
      {showModal && (
        <BeatFormModal
          beat={editingBeat}
          onClose={() => setShowModal(false)}
          onSave={() => {
            setShowModal(false);
            setEditingBeat(null);
          }}
        />
      )}

      {/* Beat Pack Form Modal */}
      {showPackModal && (
        <BeatPackFormModal
          pack={editingPack}
          onClose={() => setShowPackModal(false)}
          onSave={() => {
            setShowPackModal(false);
            setEditingPack(null);
          }}
        />
      )}
    </AdminLayout>
  );
};

interface BeatFormModalProps {
  beat: Beat | null;
  onClose: () => void;
  onSave: () => void;
}

const BeatFormModal: React.FC<BeatFormModalProps> = ({ beat, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    title: beat?.title || '',
    artist: beat?.artist || 'Jonna Rincon',
    bpm: beat?.bpm || 120,
    key: beat?.key || '',
    genre: beat?.genre || '',
    duration: beat?.duration || '0:00',
    tags: beat?.tags?.join(', ') || '',
    audioUrl: beat?.audioUrl || '',
    artworkUrl: beat?.artworkUrl || '',
    stemsUrl: beat?.stemsUrl || '',
    slug: beat?.slug || '',
    status: beat?.status || 'draft',
    beatType: beat?.beatType || 'free',
    featured: beat?.featured || false,
    exclusivePrice: beat?.licenses?.exclusive?.price || 199,
  });
  const [saving, setSaving] = useState(false);

  // Update form data when beat prop changes (for editing)
  React.useEffect(() => {
    if (beat) {
      setFormData({
        title: beat.title || '',
        artist: beat.artist || 'Jonna Rincon',
        bpm: beat.bpm || 120,
        key: beat.key || '',
        genre: beat.genre || '',
        duration: beat.duration || '0:00',
        tags: beat.tags?.join(', ') || '',
        audioUrl: beat.audioUrl || '',
        artworkUrl: beat.artworkUrl || '',
        stemsUrl: beat.stemsUrl || '',
        slug: beat.slug || '',
        status: beat.status || 'draft',
        beatType: beat.beatType || 'free',
        featured: beat.featured || false,
        exclusivePrice: beat.licenses?.exclusive?.price || 199,
      });
    }
  }, [beat]);

  // Parse beat filename and auto-fill fields
  const parseAudioUrl = (url: string) => {
    try {
      // Extract filename from URL (everything after the last /)
      const filename = url.split('/').pop() || '';
      // Remove file extension
      const nameWithoutExt = filename.replace(/\.[^/.]+$/, '');

      // Pattern: <titel> - <bpm> - <key> - <genre,genre2> - prod by <artiest>
      // Example: GUITTARA - 118 BPM - A Minor - Urban, Rap - Prod by Jonna Rincon
      const regex = /^(.+?)\s*-\s*(\d+)\s*BPM\s*-\s*([A-Za-z#♭\s]+)\s*-\s*(.+?)\s*-\s*(?:prod|Prod)\s+by\s+(.+)$/i;
      const match = nameWithoutExt.match(regex);

      if (match) {
        const [, title, bpm, key, genres, artist] = match;

        return {
          title: title.trim(),
          bpm: parseInt(bpm, 10),
          key: key.trim(),
          genre: genres.trim(), // Keep all genres
          artist: artist.trim(),
          tags: genres, // Use all genres as tags
        };
      }
    } catch (error) {
      console.error('Error parsing audio URL:', error);
    }

    return null;
  };

  const handleAudioUrlChange = (url: string) => {
    setFormData({ ...formData, audioUrl: url });

    // Auto-fill fields if parsing succeeds
    const parsed = parseAudioUrl(url);
    if (parsed) {
      setFormData(prev => ({
        ...prev,
        title: parsed.title,
        bpm: parsed.bpm,
        key: parsed.key,
        genre: parsed.genre,
        artist: parsed.artist,
        tags: parsed.tags,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      // Ensure exclusive price is a valid number
      const exclusivePrice = typeof formData.exclusivePrice === 'string'
        ? parseFloat(formData.exclusivePrice)
        : formData.exclusivePrice;

      if (isNaN(exclusivePrice) || exclusivePrice < 0) {
        alert('Please enter a valid exclusive price');
        setSaving(false);
        return;
      }

      const beatData: any = {
        title: formData.title,
        artist: formData.artist,
        bpm: formData.bpm,
        key: formData.key,
        genre: formData.genre,
        duration: formData.duration,
        tags: formData.tags.split(',').map((t) => t.trim()),
        audioUrl: formData.audioUrl,
        artworkUrl: formData.artworkUrl,
        stemsUrl: formData.stemsUrl || undefined,
        slug: formData.slug || formData.title.toLowerCase().replace(/\s+/g, '-'),
        status: formData.status,
        beatType: formData.beatType,
        featured: formData.featured,
        trending: false,
      };

      // Always include the complete licenses object with exclusive license
      beatData.licenses = {
        exclusive: {
          type: 'exclusive' as const,
          price: exclusivePrice,
          features: ['All files', 'Exclusive rights', 'Full ownership', 'Unlimited use'],
          downloads: -1,
          streams: -1,
          videos: -1,
          distribution: true,
        },
      };

      if (beat) {
        // For updates, merge with existing licenses to preserve other license data
        const existingBeat = beat as any;
        if (existingBeat.licenses && Object.keys(existingBeat.licenses).length > 0) {
          beatData.licenses = {
            ...existingBeat.licenses,
            exclusive: beatData.licenses.exclusive,
          };
        }

        await beatService.updateBeat(beat.id, beatData);
        alert('Beat updated successfully');
      } else {
        await beatService.createBeat(beatData);
        alert('Beat created successfully');
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
      <div className="bg-white/[0.10] backdrop-blur-2xl border border-white/[0.10] rounded-2xl max-w-2xl w-full my-auto max-h-[90vh] flex flex-col">
        <div className="p-6 border-b border-white/[0.08] bg-white/[0.10] flex-shrink-0">
          <h2 className="text-2xl font-bold text-white">
            {beat ? 'Edit Beat' : 'Add New Beat'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
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
                onChange={(e) => setFormData({ ...formData, status: e.target.value as Beat['status'] })}
                className="w-full px-4 py-2 bg-white/[0.06] border border-white/[0.08] rounded-lg text-white"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-white/60 mb-2">Beat Type</label>
              <select
                value={formData.beatType}
                onChange={(e) => setFormData({ ...formData, beatType: e.target.value as any })}
                className="w-full px-4 py-2 bg-white/[0.06] border border-white/[0.08] rounded-lg text-white"
              >
                <option value="free">Free</option>
                <option value="exclusive">Exclusive</option>
              </select>
              <p className="text-xs text-white/40 mt-1">
                Classify this beat (free beats have no cost, exclusive beats require purchase)
              </p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-white/60 mb-2">
              Tags (comma separated)
            </label>
            <input
              type="text"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              className="w-full px-4 py-2 bg-white/[0.06] border border-white/[0.08] rounded-lg text-white"
              placeholder="trap, dark, atmospheric"
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

          {/* Audio and Artwork URLs */}
          <div className="grid grid-cols-2 gap-4">
            <LinkInput
              label="Audio URL"
              name="audioUrl"
              type="audio"
              onChange={handleAudioUrlChange}
              defaultValue={formData.audioUrl}
              placeholder="https://nextcloud.example.com/index.php/s/abc123"
              required
            />
            <LinkInput
              label="Artwork URL"
              name="artworkUrl"
              type="image"
              onChange={(url) => setFormData({ ...formData, artworkUrl: url })}
              defaultValue={formData.artworkUrl}
              placeholder="https://example.com/image.jpg"
              required
            />
          </div>

          <div>
            <LinkInput
              label="Stems URL (Zip File)"
              name="stemsUrl"
              type="audio"
              onChange={(url) => setFormData({ ...formData, stemsUrl: url })}
              defaultValue={formData.stemsUrl}
              placeholder="https://nextcloud.example.com/index.php/s/xyz789"
            />
            <p className="text-xs text-white/30 mt-1">Link to a zip file containing the beat stems (optional)</p>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-white/60 mb-2">Exclusive License Price (€) <span className="text-red-400">*</span></label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.exclusivePrice}
                onChange={(e) => setFormData({ ...formData, exclusivePrice: parseFloat(e.target.value) || 0 })}
                className="w-full px-4 py-2 bg-white/[0.06] border border-white/[0.08] rounded-lg text-white"
                placeholder="199"
                required
              />
              <p className="text-xs text-white/40 mt-1">Price for exclusive license (full ownership, unlimited rights)</p>
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
              <span className="text-sm text-white/60">Featured Beat</span>
            </label>
          </div>

          <div className="flex items-center justify-end space-x-4 pt-4 border-t border-white/[0.06] bg-white/[0.10] -mx-6 px-6 py-4 flex-shrink-0">
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
              {saving ? 'Saving...' : beat ? 'Update Beat' : 'Create Beat'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ============================================
// BEAT PACK FORM MODAL
// ============================================

interface BeatPackFormModalProps {
  pack: BeatPack | null;
  onClose: () => void;
  onSave: () => void;
}

const emptyBeat = (): BeatPackItem => ({
  title: '',
  artist: 'Jonna Rincon',
  bpm: 120,
  key: '',
  genre: '',
  audioUrl: '',
  downloadUrl: '',
});

const BeatPackFormModal: React.FC<BeatPackFormModalProps> = ({ pack, onClose, onSave }) => {
  const { beats: allBeats } = useBeats();
  const [title, setTitle] = useState(pack?.title || '');
  const [description, setDescription] = useState(pack?.description || '');
  const [coverUrl, setCoverUrl] = useState(pack?.coverUrl || '');
  const [price, setPrice] = useState<number>(pack?.price || 99);
  const [status, setStatus] = useState<'draft' | 'published'>(pack?.status || 'draft');
  const [beats, setBeats] = useState<BeatPackItem[]>(pack?.beats && pack.beats.length > 0 ? pack.beats : []);
  const [currentPage, setCurrentPage] = useState(0); // 0 = pack details, 1 = beat selection, 2 = arrange, 3+ = beat edit
  const [saving, setSaving] = useState(false);

  // Beat selection state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBeatIds, setSelectedBeatIds] = useState<Set<string>>(
    new Set(pack?.beats.map((b, i) => `beat-${i}`) || [])
  );
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);

  const totalPages = 3 + (beats.length > 0 ? beats.length : 0); // 0=details, 1=select, 2=arrange, 3+=beats

  const parseBeatAudio = (url: string, idx: number) => {
    try {
      const filename = url.split('/').pop() || '';
      const nameWithoutExt = filename.replace(/\.[^/.]+$/, '');
      const regex = /^(.+?)\s*-\s*(\d+)\s*BPM\s*-\s*([A-Za-z#♭\s]+)\s*-\s*(.+?)\s*-\s*(?:prod|Prod)\s+by\s+(.+)$/i;
      const match = nameWithoutExt.match(regex);
      if (match) {
        const [, t, bpm, k, genres, artist] = match;
        setBeats((prev) => prev.map((b, i) => i === idx ? {
          ...b,
          title: t.trim(),
          bpm: parseInt(bpm, 10),
          key: k.trim(),
          genre: genres.trim(),
          artist: artist.trim(),
          audioUrl: url,
        } : b));
        return;
      }
    } catch {}
    setBeats((prev) => prev.map((b, i) => i === idx ? { ...b, audioUrl: url } : b));
  };

  const addBeat = () => {
    setBeats([...beats, emptyBeat()]);
    setCurrentPage(beats.length + 1);
  };

  const removeBeat = (idx: number) => {
    if (beats.length <= 1) return;
    const newBeats = beats.filter((_, i) => i !== idx);
    setBeats(newBeats);
    if (currentPage > newBeats.length) setCurrentPage(newBeats.length);
  };

  const updateBeat = (idx: number, field: keyof BeatPackItem, value: any) => {
    setBeats((prev) => prev.map((b, i) => i === idx ? { ...b, [field]: value } : b));
  };

  // Beat selection functions
  const filteredBeats = allBeats.filter(beat => {
    const query = searchQuery.toLowerCase();
    return (
      beat.title.toLowerCase().includes(query) ||
      beat.artist.toLowerCase().includes(query) ||
      beat.genre.toLowerCase().includes(query) ||
      beat.tags?.some(tag => tag.toLowerCase().includes(query))
    );
  });

  const getSelectedBeats = (): Beat[] => {
    return Array.from(selectedBeatIds)
      .map(id => {
        const idx = parseInt(id.replace('beat-', ''));
        return allBeats[idx];
      })
      .filter(b => b);
  };

  const convertToPackItems = (selectedBeats: Beat[]): BeatPackItem[] => {
    return selectedBeats.map(beat => ({
      title: beat.title,
      artist: beat.artist,
      bpm: beat.bpm,
      key: beat.key,
      genre: beat.genre,
      duration: beat.duration || '0:00',
      audioUrl: beat.audioUrl,
      downloadUrl: '',
    }));
  };

  const proceedToArrange = () => {
    const selected = getSelectedBeats();
    if (selected.length === 0) {
      alert('Please select at least 1 beat');
      return;
    }
    setBeats(convertToPackItems(selected));
    setCurrentPage(2);
  };

  // Drag and drop functions
  const handleDragStart = (idx: number) => {
    setDraggingIndex(idx);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (targetIdx: number) => {
    if (draggingIndex === null || draggingIndex === targetIdx) return;
    const newBeats = [...beats];
    const draggedBeat = newBeats[draggingIndex];
    newBeats.splice(draggingIndex, 1);
    newBeats.splice(targetIdx, 0, draggedBeat);
    setBeats(newBeats);
    setDraggingIndex(null);
  };

  const handleSubmit = async () => {
    if (!title.trim() || !coverUrl.trim()) {
      alert('Pack title and cover image are required');
      return;
    }
    if (beats.length === 0) {
      alert('Please select at least 1 beat for this pack');
      return;
    }
    const invalidBeat = beats.find((b) => !b.title.trim() || !b.audioUrl.trim());
    if (invalidBeat) {
      alert('Every beat needs a title and audio URL');
      return;
    }
    setSaving(true);
    try {
      const data = { title, description, coverUrl, beats, price, status };
      if (pack) {
        await beatPackService.updatePack(pack.id, data);
      } else {
        await beatPackService.createPack(data);
      }
      onSave();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xl z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white/[0.10] backdrop-blur-2xl border border-white/[0.10] rounded-2xl max-w-2xl w-full my-auto max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-white/[0.08] bg-white/[0.10] flex-shrink-0 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">
            {pack ? 'Edit Beat Pack' : 'New Beat Pack'}
          </h2>
          <button onClick={onClose} className="text-white/40 hover:text-white"><X size={22} /></button>
        </div>

        {/* Page indicator */}
        <div className="px-6 py-3 border-b border-white/[0.06] flex items-center justify-between bg-white/[0.03] flex-shrink-0">
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={() => setCurrentPage(0)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${currentPage === 0 ? 'bg-orange-600 text-white' : 'bg-white/[0.06] text-white/60 hover:bg-white/[0.12]'}`}>
              Pack Details
            </button>
            <button onClick={() => setCurrentPage(1)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${currentPage === 1 ? 'bg-blue-600 text-white' : 'bg-white/[0.06] text-white/60 hover:bg-white/[0.12]'}`}>
              Select Beats
            </button>
            {beats.length > 0 && (
              <button onClick={() => setCurrentPage(2)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${currentPage === 2 ? 'bg-green-600 text-white' : 'bg-white/[0.06] text-white/60 hover:bg-white/[0.12]'}`}>
                Arrange ({beats.length})
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          {currentPage === 0 && (
            <>
              <div>
                <label className="block text-sm font-medium text-white/60 mb-2">Pack Title <span className="text-red-400">*</span></label>
                <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-2 bg-white/[0.06] border border-white/[0.08] rounded-lg text-white" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/60 mb-2">Description (optional)</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3}
                  className="w-full px-4 py-2 bg-white/[0.06] border border-white/[0.08] rounded-lg text-white" />
              </div>
              <LinkInput
                label="Cover Image"
                name="coverUrl"
                type="image"
                onChange={setCoverUrl}
                defaultValue={coverUrl}
                placeholder="https://example.com/cover.jpg"
              />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white/60 mb-2">Price (€)</label>
                  <input type="number" step="0.01" min="0" value={price}
                    onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
                    className="w-full px-4 py-2 bg-white/[0.06] border border-white/[0.08] rounded-lg text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/60 mb-2">Status</label>
                  <select value={status} onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full px-4 py-2 bg-white/[0.06] border border-white/[0.08] rounded-lg text-white">
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                  </select>
                </div>
              </div>
              <div className="mt-4 p-3 rounded-lg bg-white/[0.04] border border-white/[0.06]">
                <p className="text-xs text-white/60">Next: Select beats to add to this pack.</p>
              </div>
            </>
          )}

          {currentPage === 1 && (
            <>
              <div className="mb-4">
                <input type="text" placeholder="Search beats by title, artist, genre..." value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 bg-white/[0.06] border border-white/[0.08] rounded-lg text-white mb-3" />
                <p className="text-xs text-white/40 mb-3">{filteredBeats.length} beat{filteredBeats.length !== 1 ? 's' : ''} found</p>
              </div>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredBeats.length === 0 ? (
                  <p className="text-center text-white/40 py-8">No beats found matching your search</p>
                ) : (
                  filteredBeats.map((beat, idx) => (
                    <label key={beat.id} className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] cursor-pointer transition">
                      <input type="checkbox" checked={selectedBeatIds.has(`beat-${idx}`)}
                        onChange={(e) => {
                          const newSelected = new Set(selectedBeatIds);
                          if (e.target.checked) newSelected.add(`beat-${idx}`);
                          else newSelected.delete(`beat-${idx}`);
                          setSelectedBeatIds(newSelected);
                        }}
                        className="w-4 h-4 rounded" />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-white text-sm truncate">{beat.title}</p>
                        <p className="text-xs text-white/40 truncate">{beat.artist} • {beat.bpm} BPM • {beat.key} • {beat.genre}</p>
                      </div>
                    </label>
                  ))
                )}
              </div>
              <div className="mt-4 p-3 rounded-lg bg-blue-600/20 border border-blue-600/30">
                <p className="text-xs text-blue-200">Selected: <strong>{selectedBeatIds.size}</strong> beat{selectedBeatIds.size !== 1 ? 's' : ''}</p>
              </div>
            </>
          )}

          {currentPage === 2 && (
            <>
              <p className="text-sm text-white/60 mb-4">Drag to reorder beats. Set download links for buyers.</p>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {beats.map((beat, idx) => (
                  <div key={idx} draggable onDragStart={() => handleDragStart(idx)} onDragOver={handleDragOver}
                    onDrop={() => handleDrop(idx)}
                    className={`p-4 rounded-lg border transition ${draggingIndex === idx ? 'opacity-50 bg-white/[0.08]' : 'bg-white/[0.04] hover:bg-white/[0.06] border-white/[0.06] cursor-move'}`}>
                    <div className="flex items-start gap-3 mb-3">
                      <div className="text-white/40 font-semibold text-sm mt-1">⋮⋮</div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-white text-sm">{idx + 1}. {beat.title}</p>
                        <p className="text-xs text-white/40">{beat.artist} • {beat.bpm} BPM • {beat.key} • {beat.genre}</p>
                      </div>
                      <button onClick={() => { if (beats.length > 1) setBeats(beats.filter((_, i) => i !== idx)); }}
                        className="text-red-400 hover:text-red-300 transition"><Trash2 size={16} /></button>
                    </div>
                    <LinkInput label="Download Link" name={`dl-${idx}`} type="audio"
                      onChange={(url) => updateBeat(idx, 'downloadUrl', url)}
                      defaultValue={beat.downloadUrl}
                      placeholder="https://example.com/beat-download" />
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-4 px-6 py-4 border-t border-white/[0.06] bg-white/[0.10] flex-shrink-0">
          <div className="flex items-center gap-2">
            <button onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
              disabled={currentPage === 0}
              className="p-2 rounded-lg bg-white/[0.06] text-white/60 hover:bg-white/[0.12] disabled:opacity-30">
              <ChevronLeft size={18} />
            </button>
            {currentPage === 1 && (
              <button onClick={proceedToArrange}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition">
                Proceed to Arrange →
              </button>
            )}
            {currentPage !== 1 && (
              <button onClick={() => setCurrentPage(Math.min(2, currentPage + 1))}
                disabled={currentPage === 2 || (currentPage === 0 && beats.length === 0)}
                className="p-2 rounded-lg bg-white/[0.06] text-white/60 hover:bg-white/[0.12] disabled:opacity-30">
                <ChevronRight size={18} />
              </button>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button type="button" onClick={onClose} className="px-5 py-2 text-white/60 hover:text-white transition-colors">
              Cancel
            </button>
            <button type="button" onClick={handleSubmit} disabled={saving || beats.length === 0}
              className="bg-gradient-to-r from-orange-600 to-red-600 text-white px-6 py-2 rounded-lg font-semibold hover:from-orange-700 hover:to-red-700 transition-all disabled:opacity-50">
              {saving ? 'Saving...' : pack ? 'Update Pack' : 'Create Pack'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BeatsPage;
