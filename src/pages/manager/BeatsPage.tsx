import React, { useState } from 'react';
import ManagerLayout from '../../components/manager/ManagerLayout';
import { useBeats } from '../../hooks/useBeats';
import { beatService } from '../../lib/firebase/services';
import { Beat } from '../../lib/firebase/types';
import { Edit, Play, TrendingUp, Star, Eye, Download, Heart } from 'lucide-react';

const ManagerBeats: React.FC = () => {
  const { beats, loading } = useBeats();
  const [filterStatus, setFilterStatus] = useState<'all' | 'published' | 'draft' | 'archived'>('all');
  const [editingBeat, setEditingBeat] = useState<Beat | null>(null);

  const filteredBeats = beats.filter((beat) => {
    if (filterStatus === 'all') return true;
    return beat.status === filterStatus;
  });

  const handleEdit = (beat: Beat) => {
    setEditingBeat(beat);
  };

  const handleUpdate = async (beatId: string, updates: Partial<Beat>) => {
    try {
      await beatService.updateBeat(beatId, updates);
      alert('Beat updated successfully!');
      setEditingBeat(null);
    } catch (error: any) {
      alert('Failed to update beat: ' + error.message);
    }
  };

  return (
    <ManagerLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-white">Beats Management</h1>
          <p className="text-gray-400 mt-2">View and edit beat information</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
            <p className="text-gray-400 text-sm">Total Beats</p>
            <p className="text-2xl font-bold text-white mt-1">{beats.length}</p>
          </div>
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
            <p className="text-gray-400 text-sm">Published</p>
            <p className="text-2xl font-bold text-white mt-1">
              {beats.filter((b) => b.status === 'published').length}
            </p>
          </div>
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
            <p className="text-gray-400 text-sm">Featured</p>
            <p className="text-2xl font-bold text-white mt-1">
              {beats.filter((b) => b.featured).length}
            </p>
          </div>
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
            <p className="text-gray-400 text-sm">Total Plays</p>
            <p className="text-2xl font-bold text-white mt-1">
              {beats.reduce((sum, b) => sum + b.plays, 0).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Filter */}
        <div>
          <label className="text-sm text-gray-400 mb-2 block">Filter by Status</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500"
          >
            <option value="all">All Status</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
            <option value="archived">Archived</option>
          </select>
        </div>

        {/* Beats Table */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-700">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Beat</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Genre</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">BPM</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Stats</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-300">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                      Loading beats...
                    </td>
                  </tr>
                ) : filteredBeats.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                      No beats found
                    </td>
                  </tr>
                ) : (
                  filteredBeats.map((beat) => (
                    <tr key={beat.id} className="hover:bg-gray-700/50">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <img
                            src={beat.artworkUrl}
                            alt={beat.title}
                            className="w-12 h-12 rounded object-cover"
                          />
                          <div>
                            <p className="font-medium text-white">{beat.title}</p>
                            <p className="text-sm text-gray-400">{beat.artist}</p>
                            <div className="flex items-center gap-2 mt-1">
                              {beat.featured && (
                                <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 rounded text-xs">
                                  Featured
                                </span>
                              )}
                              {beat.trending && (
                                <span className="px-2 py-0.5 bg-pink-500/20 text-pink-400 rounded text-xs">
                                  Trending
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-300">{beat.genre}</td>
                      <td className="px-6 py-4 text-gray-300">{beat.bpm}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2 py-1 rounded text-sm capitalize ${
                            beat.status === 'published'
                              ? 'bg-green-500/20 text-green-400'
                              : beat.status === 'draft'
                              ? 'bg-gray-500/20 text-gray-400'
                              : 'bg-orange-500/20 text-orange-400'
                          }`}
                        >
                          {beat.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3 text-sm text-gray-400">
                          <div className="flex items-center space-x-1">
                            <Play size={14} />
                            <span>{beat.plays}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Download size={14} />
                            <span>{beat.downloads}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Heart size={14} />
                            <span>{beat.likes}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end">
                          <button
                            onClick={() => handleEdit(beat)}
                            className="p-2 text-blue-400 hover:bg-blue-500/20 rounded transition-colors"
                            title="Edit"
                          >
                            <Edit size={18} />
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

        {/* Edit Modal */}
        {editingBeat && (
          <EditBeatModal
            beat={editingBeat}
            onClose={() => setEditingBeat(null)}
            onSave={handleUpdate}
          />
        )}
      </div>
    </ManagerLayout>
  );
};

// Simple Edit Modal for Managers
interface EditBeatModalProps {
  beat: Beat;
  onClose: () => void;
  onSave: (beatId: string, updates: Partial<Beat>) => void;
}

const EditBeatModal: React.FC<EditBeatModalProps> = ({ beat, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    title: beat.title,
    genre: beat.genre,
    bpm: beat.bpm,
    key: beat.key,
    tags: beat.tags.join(', '),
    featured: beat.featured,
    trending: beat.trending,
    status: beat.status,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(beat.id, {
      ...formData,
      tags: formData.tags.split(',').map((t) => t.trim()).filter(t => t),
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-xl max-w-2xl w-full p-6">
        <h2 className="text-2xl font-bold text-white mb-6">Edit Beat</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Genre</label>
              <input
                type="text"
                value={formData.genre}
                onChange={(e) => setFormData({ ...formData, genre: e.target.value })}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">BPM</label>
              <input
                type="number"
                value={formData.bpm}
                onChange={(e) => setFormData({ ...formData, bpm: parseInt(e.target.value) })}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Key</label>
              <input
                type="text"
                value={formData.key}
                onChange={(e) => setFormData({ ...formData, key: e.target.value })}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Tags (comma separated)</label>
            <input
              type="text"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          <div className="flex gap-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.featured}
                onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                className="w-4 h-4 rounded"
              />
              <span className="text-sm text-gray-300">Featured</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.trending}
                onChange={(e) => setFormData({ ...formData, trending: e.target.checked })}
                className="w-4 h-4 rounded"
              />
              <span className="text-sm text-gray-300">Trending</span>
            </label>
          </div>

          <div className="flex items-center justify-end space-x-4 pt-4 border-t border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 text-gray-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-6 py-2 rounded-lg font-semibold hover:from-blue-700 hover:to-cyan-700 transition-all"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ManagerBeats;
