import React, { useState } from 'react';
import ArtistLayout from '../../components/artist/ArtistLayout';
import { useAuth } from '../../contexts/AuthContext';
import { User, Save } from 'lucide-react';
import { updateProfile } from 'firebase/auth';

const ArtistSettings: React.FC = () => {
  const { user } = useAuth();
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !displayName.trim()) return;

    setLoading(true);
    setMessage(null);

    try {
      await updateProfile(user, {
        displayName: displayName.trim(),
      });

      setMessage({ type: 'success', text: '✅ Username updated successfully!' });

      // Reload the page to reflect changes everywhere
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      console.error('Failed to update profile:', error);
      setMessage({ type: 'error', text: '❌ Failed to update username. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ArtistLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-white">Profile Settings</h1>
          <p className="text-gray-400 mt-2">Manage your account information</p>
        </div>

        {/* Settings Form */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
          <form onSubmit={handleSave} className="space-y-6">
            {/* Current User Info */}
            <div className="pb-6 border-b border-gray-700">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white font-semibold text-2xl">
                  {displayName?.[0] || user?.email?.[0] || 'A'}
                </div>
                <div>
                  <p className="text-white font-semibold text-lg">{user?.displayName || 'Artist'}</p>
                  <p className="text-gray-400 text-sm">{user?.email}</p>
                  <span className="px-2 py-0.5 bg-purple-600 text-purple-100 rounded text-xs mt-1 inline-block">
                    Artist
                  </span>
                </div>
              </div>
            </div>

            {/* Display Name */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Display Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Enter your display name"
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500"
              />
              <p className="text-xs text-gray-400 mt-1">
                This name will be displayed across the platform
              </p>
            </div>

            {/* Email (Read Only) */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-gray-500 cursor-not-allowed"
              />
              <p className="text-xs text-gray-400 mt-1">Email cannot be changed</p>
            </div>

            {/* Message */}
            {message && (
              <div
                className={`p-4 rounded-lg ${
                  message.type === 'success'
                    ? 'bg-green-900/30 border border-green-700 text-green-300'
                    : 'bg-red-900/30 border border-red-700 text-red-300'
                }`}
              >
                {message.text}
              </div>
            )}

            {/* Save Button */}
            <button
              type="submit"
              disabled={loading || !displayName.trim()}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 px-6 py-3 rounded-lg text-white font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>Saving...</>
              ) : (
                <>
                  <Save size={20} />
                  Save Changes
                </>
              )}
            </button>
          </form>
        </div>

        {/* Info Box */}
        <div className="bg-purple-900/20 border border-purple-700 rounded-xl p-4">
          <p className="text-sm text-purple-200">
            💡 <strong>Note:</strong> Changing your display name will update how you appear in
            collaborations, messages, and all platform interactions.
          </p>
        </div>
      </div>
    </ArtistLayout>
  );
};

export default ArtistSettings;
