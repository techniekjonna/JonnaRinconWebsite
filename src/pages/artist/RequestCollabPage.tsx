import React, { useState } from 'react';
import ArtistLayout from '../../components/artist/ArtistLayout';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../lib/firebase/config';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { Handshake, Send } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const RequestCollabPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    type: 'music_video' as 'music_video' | 'live_performance' | 'studio_session' | 'event' | 'other',
    description: '',
    budget: '',
    preferredStartDate: '',
    message: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      // Collaboration requests live in the same supportMessages collection
      // as every other chat, as a 'Collaboration' category conversation —
      // the admin/manager Contact chat picks it up and shows the details
      // below plus Approve/Reject right there. The project title has no
      // dedicated field on a chat message, so it leads the message text.
      const messageParts = [formData.title.trim(), formData.description.trim()];
      if (formData.message.trim()) messageParts.push(formData.message.trim());

      await addDoc(collection(db, 'supportMessages'), {
        senderId: user.uid,
        senderName: user.displayName || 'Unknown Artist',
        senderEmail: user.email,
        senderRole: 'artist',
        recipientGroup: 'support',
        category: 'Collaboration',
        collabType: formData.type,
        collabBudget: formData.budget ? parseFloat(formData.budget) : null,
        collabPreferredStartDate: formData.preferredStartDate || null,
        collabStatus: 'pending',
        message: messageParts.filter(Boolean).join('\n\n'),
        createdAt: serverTimestamp(),
        status: 'sent',
      });

      alert('✅ Collaboration request submitted! The team will review it soon.');
      navigate('/artist/board');
    } catch (error) {
      console.error('Failed to submit collab request:', error);
      alert('❌ Failed to submit request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ArtistLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-4 rounded-full">
              <Handshake size={48} className="text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Request Collaboration</h1>
          <p className="text-white/40">
            Submit a collaboration request to work with Jonna Rincon
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white/[0.08] border border-white/[0.06] rounded-xl p-6 space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-white/60 mb-2">
              Project Title <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Music Video for Summer Track"
              className="w-full bg-white/[0.06] border border-white/[0.08] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500"
            />
          </div>

          {/* Type */}
          <div>
            <label className="block text-sm font-medium text-white/60 mb-2">
              Collaboration Type <span className="text-red-400">*</span>
            </label>
            <select
              required
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
              className="w-full bg-white/[0.06] border border-white/[0.08] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500"
            >
              <option value="music_video">Music Video</option>
              <option value="live_performance">Live Performance</option>
              <option value="studio_session">Studio Session</option>
              <option value="event">Event</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-white/60 mb-2">
              Project Description <span className="text-red-400">*</span>
            </label>
            <textarea
              required
              rows={5}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe what you want to collaborate on..."
              className="w-full bg-white/[0.06] border border-white/[0.08] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500"
            />
          </div>

          {/* Budget */}
          <div>
            <label className="block text-sm font-medium text-white/60 mb-2">
              Budget (€)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.budget}
              onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
              placeholder="e.g., 5000"
              className="w-full bg-white/[0.06] border border-white/[0.08] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500"
            />
            <p className="text-xs text-white/40 mt-1">Optional - if you have a budget in mind</p>
          </div>

          {/* Preferred Start Date */}
          <div>
            <label className="block text-sm font-medium text-white/60 mb-2">
              Preferred Start Date
            </label>
            <input
              type="date"
              value={formData.preferredStartDate}
              onChange={(e) => setFormData({ ...formData, preferredStartDate: e.target.value })}
              className="w-full bg-white/[0.06] border border-white/[0.08] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500"
            />
          </div>

          {/* Additional Message */}
          <div>
            <label className="block text-sm font-medium text-white/60 mb-2">
              Additional Message
            </label>
            <textarea
              rows={3}
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              placeholder="Any additional information you'd like to share..."
              className="w-full bg-white/[0.06] border border-white/[0.08] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 px-6 py-4 rounded-lg text-white font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>Submitting...</>
            ) : (
              <>
                <Send size={20} />
                Submit Request
              </>
            )}
          </button>
        </form>

        {/* Info Box */}
        <div className="bg-blue-900/20 border border-blue-700 rounded-xl p-4">
          <p className="text-sm text-blue-200">
            💡 <strong>What happens next?</strong> Your request will be reviewed by the admin team.
            You'll receive an email once your request is approved or if we need more information.
          </p>
        </div>
      </div>
    </ArtistLayout>
  );
};

export default RequestCollabPage;
