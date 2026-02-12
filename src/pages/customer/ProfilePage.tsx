import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { authService } from '../../lib/firebase/services/authService';
import CustomerLayout from '../../components/customer/CustomerLayout';
import { User, Mail, Lock, Save, LogOut, Music2, Instagram as InstagramIcon, Music } from 'lucide-react';
import { db } from '../../lib/firebase/config';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const CustomerProfile: React.FC = () => {
  const { user, signOut } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Artist role request state
  const [showArtistForm, setShowArtistForm] = useState(false);
  const [artistRequest, setArtistRequest] = useState({
    artistName: '',
    region: '',
    city: '',
    roles: {
      producer: false,
      beatmaker: false,
      engineer: false,
      rapper: false,
      vocalist: false,
      songwriter: false,
    },
    instagram: '',
    spotify: '',
  });

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      await authService.updateUserProfile({ displayName });
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      setIsEditing(false);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to update profile' });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match' });
      setLoading(false);
      return;
    }

    if (newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters' });
      setLoading(false);
      return;
    }

    try {
      await authService.updateUserPassword(newPassword);
      setMessage({ type: 'success', text: 'Password updated successfully!' });
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to update password' });
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const handleArtistRoleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      // Check if at least one role is selected
      const hasRole = Object.values(artistRequest.roles).some(role => role);
      if (!hasRole) {
        setMessage({ type: 'error', text: 'Please select at least one artist role' });
        setLoading(false);
        return;
      }

      // Submit artist role request to Firebase
      await addDoc(collection(db, 'artistRoleRequests'), {
        userId: user?.uid,
        userEmail: user?.email,
        artistName: artistRequest.artistName,
        region: artistRequest.region,
        city: artistRequest.city,
        roles: Object.entries(artistRequest.roles)
          .filter(([_, value]) => value)
          .map(([key, _]) => key),
        instagram: artistRequest.instagram,
        spotify: artistRequest.spotify,
        status: 'pending',
        createdAt: serverTimestamp(),
      });

      setMessage({ type: 'success', text: 'Artist role request submitted successfully! We will review your request soon.' });
      setShowArtistForm(false);
      // Reset form
      setArtistRequest({
        artistName: '',
        region: '',
        city: '',
        roles: {
          producer: false,
          beatmaker: false,
          engineer: false,
          rapper: false,
          vocalist: false,
          songwriter: false,
        },
        instagram: '',
        spotify: '',
      });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to submit artist role request' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <CustomerLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Profile Settings</h1>
          <p className="text-gray-400 mt-2">Manage your account information</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 text-center">
              <div className="w-24 h-24 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-full flex items-center justify-center text-4xl mx-auto mb-4">
                {user?.displayName?.charAt(0)?.toUpperCase() || <User size={32} className="text-white" />}
              </div>
              <h3 className="font-bold text-xl text-white mb-1">{user?.displayName || 'Customer'}</h3>
              <p className="text-gray-400 text-sm mb-4">{user?.email}</p>
              <div className="inline-block px-3 py-1 bg-blue-900/30 text-blue-300 rounded-full text-xs font-semibold border border-blue-700">
                Customer Account
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-6">
            {message && (
              <div className={`p-4 rounded-lg border ${message.type === 'success' ? 'bg-green-900/30 border-green-700 text-green-300' : 'bg-red-900/30 border-red-700 text-red-300'}`}>
                {message.text}
              </div>
            )}

            <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-white">Profile Information</h2>
                {!isEditing && (
                  <button onClick={() => setIsEditing(true)} className="text-blue-400 hover:text-blue-300 text-sm font-medium">
                    Edit
                  </button>
                )}
              </div>

              {isEditing ? (
                <form onSubmit={handleUpdateProfile}>
                  <div className="mb-4">
                    <label className="block text-sm font-semibold text-gray-300 mb-2">
                      <User size={16} className="inline mr-1" /> Display Name
                    </label>
                    <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)}
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500" required />
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-semibold text-gray-300 mb-2">
                      <Mail size={16} className="inline mr-1" /> Email
                    </label>
                    <input type="email" value={user?.email || ''}
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-gray-400 opacity-50 cursor-not-allowed" disabled />
                    <p className="text-xs text-gray-400 mt-1">Email cannot be changed</p>
                  </div>
                  <div className="flex gap-4">
                    <button type="submit" disabled={loading}
                      className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 px-6 py-2 rounded-lg text-white font-medium transition-all disabled:opacity-50 flex items-center gap-2">
                      <Save size={16} /> {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button type="button" onClick={() => { setIsEditing(false); setDisplayName(user?.displayName || ''); }}
                      className="bg-gray-700 hover:bg-gray-600 px-6 py-2 rounded-lg text-white font-medium transition-all">
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <div>
                  <div className="mb-4">
                    <div className="text-sm text-gray-400 mb-1">Display Name</div>
                    <div className="font-semibold text-white">{user?.displayName || 'Not set'}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-400 mb-1">Email</div>
                    <div className="font-semibold text-white">{user?.email}</div>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
              <h2 className="text-xl font-bold text-white mb-6">Change Password</h2>
              <form onSubmit={handleUpdatePassword}>
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-300 mb-2">
                    <Lock size={16} className="inline mr-1" /> New Password
                  </label>
                  <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                    placeholder="Enter new password" minLength={6} />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-300 mb-2">
                    <Lock size={16} className="inline mr-1" /> Confirm New Password
                  </label>
                  <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                    placeholder="Confirm new password" minLength={6} />
                </div>
                <button type="submit" disabled={loading || !newPassword || !confirmPassword}
                  className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 px-6 py-2 rounded-lg text-white font-medium transition-all disabled:opacity-50 flex items-center gap-2">
                  <Save size={16} /> {loading ? 'Updating...' : 'Update Password'}
                </button>
              </form>
            </div>

            <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Music2 size={24} className="text-purple-400" />
                    Request Artist Role
                  </h2>
                  <p className="text-sm text-gray-400 mt-1">Apply to become an artist on the platform</p>
                </div>
                {!showArtistForm && (
                  <button
                    onClick={() => setShowArtistForm(true)}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 px-4 py-2 rounded-lg text-white font-medium transition-all text-sm"
                  >
                    Apply Now
                  </button>
                )}
              </div>

              {showArtistForm ? (
                <form onSubmit={handleArtistRoleRequest} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-300 mb-2">
                        Artist Name *
                      </label>
                      <input
                        type="text"
                        value={artistRequest.artistName}
                        onChange={(e) => setArtistRequest({ ...artistRequest, artistName: e.target.value })}
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
                        placeholder="Your stage name"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-300 mb-2">
                        Region *
                      </label>
                      <input
                        type="text"
                        value={artistRequest.region}
                        onChange={(e) => setArtistRequest({ ...artistRequest, region: e.target.value })}
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
                        placeholder="e.g., North Holland"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-300 mb-2">
                        City *
                      </label>
                      <input
                        type="text"
                        value={artistRequest.city}
                        onChange={(e) => setArtistRequest({ ...artistRequest, city: e.target.value })}
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
                        placeholder="e.g., Amsterdam"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-300 mb-2">
                        <InstagramIcon size={16} className="inline mr-1" /> Instagram
                      </label>
                      <input
                        type="text"
                        value={artistRequest.instagram}
                        onChange={(e) => setArtistRequest({ ...artistRequest, instagram: e.target.value })}
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
                        placeholder="@username or full URL"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-gray-300 mb-2">
                        <Music size={16} className="inline mr-1" /> Spotify Link
                      </label>
                      <input
                        type="url"
                        value={artistRequest.spotify}
                        onChange={(e) => setArtistRequest({ ...artistRequest, spotify: e.target.value })}
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
                        placeholder="https://open.spotify.com/artist/..."
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-3">
                      Artist Roles * (Select all that apply)
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {[
                        { key: 'producer', label: 'Producer' },
                        { key: 'beatmaker', label: 'Beatmaker' },
                        { key: 'engineer', label: 'Engineer' },
                        { key: 'rapper', label: 'Rapper' },
                        { key: 'vocalist', label: 'Vocalist/Singer' },
                        { key: 'songwriter', label: 'Songwriter' },
                      ].map((role) => (
                        <label key={role.key} className="flex items-center space-x-2 p-3 bg-gray-700/50 rounded-lg cursor-pointer hover:bg-gray-700 transition-colors">
                          <input
                            type="checkbox"
                            checked={artistRequest.roles[role.key as keyof typeof artistRequest.roles]}
                            onChange={(e) =>
                              setArtistRequest({
                                ...artistRequest,
                                roles: {
                                  ...artistRequest.roles,
                                  [role.key]: e.target.checked,
                                },
                              })
                            }
                            className="w-4 h-4 rounded border-gray-600 text-purple-600 focus:ring-purple-500"
                          />
                          <span className="text-sm text-gray-300">{role.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-4 pt-4">
                    <button
                      type="submit"
                      disabled={loading}
                      className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 px-6 py-2 rounded-lg text-white font-medium transition-all disabled:opacity-50 flex items-center gap-2"
                    >
                      <Save size={16} /> {loading ? 'Submitting...' : 'Submit Request'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowArtistForm(false)}
                      className="bg-gray-700 hover:bg-gray-600 px-6 py-2 rounded-lg text-white font-medium transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <Music2 size={48} className="mx-auto mb-4 text-purple-400 opacity-50" />
                  <p>Become an artist and start collaborating with others!</p>
                  <p className="text-sm mt-2">Click "Apply Now" to submit your artist application.</p>
                </div>
              )}
            </div>

            <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
              <h2 className="text-xl font-bold text-white mb-6">Account Actions</h2>
              <button onClick={handleSignOut}
                className="w-full bg-red-600 hover:bg-red-700 py-3 rounded-lg text-white font-medium transition-all flex items-center justify-center gap-2">
                <LogOut size={20} /> Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>
    </CustomerLayout>
  );
};

export default CustomerProfile;
