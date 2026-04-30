import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { settingsService } from '../../lib/firebase/services';
import { SiteBackground } from '../../lib/firebase/types';
import { toDirectUrl } from '../../lib/utils/urlUtils';
import { Trash2, Check, Image } from 'lucide-react';

// Background management tool - allows admins to change site background
const BackgroundToolPage: React.FC = () => {
  // Force component to be included in bundle
  console.log('BackgroundToolPage loaded');
  const [activeTab, setActiveTab] = useState<'set' | 'history'>('set');
  const [backgrounds, setBackgrounds] = useState<SiteBackground[]>([]);
  const [loading, setLoading] = useState(true);
  const [imageUrl, setImageUrl] = useState('');
  const [name, setName] = useState('');
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const activeBackground = backgrounds.find((bg) => bg.isActive) || null;

  useEffect(() => {
    const unsubscribe = settingsService.subscribeToBackgrounds((data) => {
      setBackgrounds(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleApplyBackground = async () => {
    if (!imageUrl.trim()) {
      setError('Please enter an image URL');
      return;
    }

    setApplying(true);
    setError('');
    setSuccess('');

    try {
      const directUrl = toDirectUrl(imageUrl.trim());
      await settingsService.addBackground(directUrl, name.trim() || undefined);
      setSuccess('Background applied successfully');
      setImageUrl('');
      setName('');
    } catch (err: any) {
      setError(err.message || 'Failed to apply background');
    } finally {
      setApplying(false);
    }
  };

  const handleActivate = async (id: string) => {
    setError('');
    setSuccess('');

    try {
      await settingsService.setActiveBackground(id);
      setSuccess('Background activated successfully');
    } catch (err: any) {
      setError(err.message || 'Failed to activate background');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this background?')) return;

    setError('');
    setSuccess('');

    try {
      await settingsService.deleteBackground(id);
      setSuccess('Background deleted successfully');
    } catch (err: any) {
      setError(err.message || 'Failed to delete background');
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Unknown';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-white">Background Manager</h1>
          <p className="text-white/40 mt-2">
            Change the site background by uploading an image URL
          </p>
        </div>

        {/* Status Messages */}
        {error && (
          <div className="bg-red-500/20 border border-red-500/40 rounded-lg px-4 py-3 text-red-300">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-500/20 border border-green-500/40 rounded-lg px-4 py-3 text-green-300">
            {success}
          </div>
        )}

        {/* Tabs */}
        <div className="flex space-x-2">
          <button
            onClick={() => setActiveTab('set')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              activeTab === 'set'
                ? 'bg-white/[0.08] text-white'
                : 'text-white/40 hover:text-white/60'
            }`}
          >
            Set Background
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              activeTab === 'history'
                ? 'bg-white/[0.08] text-white'
                : 'text-white/40 hover:text-white/60'
            }`}
          >
            History
          </button>
        </div>

        {/* Set Background Tab */}
        {activeTab === 'set' && (
          <div className="space-y-6">
            {/* Input Form */}
            <div className="bg-white/[0.08] border border-white/[0.06] rounded-xl p-6 space-y-4">
              <div>
                <label className="block text-white/60 text-sm font-medium mb-2">
                  Image URL
                </label>
                <input
                  type="text"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://example.com/background.jpg"
                  className="w-full px-4 py-2 bg-white/[0.06] border border-white/[0.08] rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-purple-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-white/60 text-sm font-medium mb-2">
                  Name (optional)
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="My Background"
                  className="w-full px-4 py-2 bg-white/[0.06] border border-white/[0.08] rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-purple-500 transition-colors"
                />
              </div>

              {/* Preview */}
              {imageUrl.trim() && (
                <div>
                  <label className="block text-white/60 text-sm font-medium mb-2">
                    Preview
                  </label>
                  <div className="relative w-full h-48 rounded-lg overflow-hidden border border-white/[0.08]">
                    <img
                      src={imageUrl}
                      alt="Preview"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                </div>
              )}

              <button
                onClick={handleApplyBackground}
                disabled={applying || !imageUrl.trim()}
                className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {applying ? 'Applying...' : 'Apply Background'}
              </button>
            </div>

            {/* Current Active Background */}
            {activeBackground && (
              <div className="bg-white/[0.08] border border-white/[0.06] rounded-xl p-6 space-y-4">
                <h2 className="text-lg font-semibold text-white">
                  Current Active Background
                </h2>
                <div className="flex items-start space-x-4">
                  <div className="w-40 h-24 rounded-lg overflow-hidden border border-white/[0.08] flex-shrink-0">
                    <img
                      src={activeBackground.imageUrl}
                      alt={activeBackground.name || 'Active background'}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-medium">
                      {activeBackground.name || 'Untitled'}
                    </p>
                    <p className="text-white/40 text-sm mt-1">
                      Added {formatDate(activeBackground.createdAt)}
                    </p>
                    <div className="flex items-center gap-3 mt-4">
                      <span className="inline-flex items-center px-2 py-1 bg-green-500/20 border border-green-500/40 rounded text-green-300 text-xs font-medium">
                        <Check size={12} className="mr-1" />
                        Active
                      </span>
                      <button
                        onClick={() => {
                          if (imageUrl.trim()) {
                            handleApplyBackground();
                          }
                        }}
                        disabled={!imageUrl.trim() || applying}
                        className="px-3 py-1 text-xs bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded font-medium transition-all"
                      >
                        Replace
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <div>
            {loading ? (
              <div className="text-white/40 text-center py-12">
                Loading backgrounds...
              </div>
            ) : backgrounds.length === 0 ? (
              <div className="bg-white/[0.08] border border-white/[0.06] rounded-xl p-12 text-center">
                <Image size={48} className="mx-auto text-white/20 mb-4" />
                <p className="text-white/40">No backgrounds added yet</p>
                <p className="text-white/30 text-sm mt-1">
                  Use the "Set Background" tab to add your first background
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {backgrounds.map((bg) => (
                  <div
                    key={bg.id}
                    className={`bg-white/[0.08] border rounded-xl overflow-hidden ${
                      bg.isActive
                        ? 'border-green-500/60'
                        : 'border-white/[0.06]'
                    }`}
                  >
                    {/* Thumbnail */}
                    <div className="relative w-full h-40 overflow-hidden">
                      <img
                        src={bg.imageUrl}
                        alt={bg.name || 'Background'}
                        className="w-full h-full object-cover"
                      />
                      {bg.isActive && (
                        <div className="absolute top-2 right-2 px-2 py-1 bg-green-500/80 rounded text-white text-xs font-medium flex items-center">
                          <Check size={12} className="mr-1" />
                          Active
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="p-4 space-y-3">
                      <div>
                        <p className="text-white font-medium truncate">
                          {bg.name || 'Untitled'}
                        </p>
                        <p className="text-white/40 text-sm">
                          {formatDate(bg.createdAt)}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex space-x-2">
                        {!bg.isActive && (
                          <button
                            onClick={() => handleActivate(bg.id)}
                            className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:from-purple-700 hover:to-pink-700 transition-all"
                          >
                            Activate
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(bg.id)}
                          className="px-3 py-2 bg-white/[0.06] border border-white/[0.08] rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default BackgroundToolPage;
