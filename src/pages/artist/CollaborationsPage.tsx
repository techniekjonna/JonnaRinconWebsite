import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { collaborationService } from '../../lib/firebase/services/collaborationService';
import { Collaboration } from '../../lib/firebase/types';
import ArtistLayout from '../../components/artist/ArtistLayout';
import LoadingSpinner from '../../components/LoadingSpinner';
import { Handshake, Mail, MessageSquare, Send, X, AlertCircle } from 'lucide-react';
import { db } from '../../lib/firebase/config';
import { collection, addDoc, serverTimestamp, query, where, orderBy, onSnapshot, Timestamp } from 'firebase/firestore';

interface CollabMessage {
  id?: string;
  collaborationId: string;
  senderId: string;
  senderName: string;
  senderEmail: string;
  message: string;
  createdAt: Timestamp;
}

type TabType = 'active' | 'request';

const ArtistCollaborations: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('active');
  const [collaborations, setCollaborations] = useState<Collaboration[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'in_progress' | 'completed' | 'inquiry'>('all');

  // Messaging state
  const [openChatCollabId, setOpenChatCollabId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Record<string, CollabMessage[]>>({});
  const [newMessage, setNewMessage] = useState('');

  // Request form state
  const [requestLoading, setRequestLoading] = useState(false);
  const [requestForm, setRequestForm] = useState({
    title: '',
    type: 'music_video' as 'music_video' | 'live_performance' | 'studio_session' | 'event' | 'other',
    description: '',
    budget: '',
    preferredStartDate: '',
    message: '',
  });

  useEffect(() => {
    if (!user) return;

    const loadCollaborations = async () => {
      try {
        const allCollabs = await collaborationService.getAll();
        // Filter to only show collaborations for this artist
        const userCollabs = allCollabs.filter(
          (c) => c.clientEmail === user.email || c.assignedTo === user.uid
        );
        setCollaborations(userCollabs);
      } catch (error) {
        console.error('Failed to load collaborations:', error);
      } finally {
        setLoading(false);
      }
    };

    loadCollaborations();
  }, [user]);

  // Load messages for a specific collaboration
  useEffect(() => {
    if (!openChatCollabId) return;

    const messagesRef = collection(db, 'collaborationMessages');
    const q = query(
      messagesRef,
      where('collaborationId', '==', openChatCollabId),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs: CollabMessage[] = [];
      snapshot.forEach((doc) => {
        msgs.push({ id: doc.id, ...doc.data() } as CollabMessage);
      });
      setMessages((prev) => ({ ...prev, [openChatCollabId]: msgs }));
    });

    return () => unsubscribe();
  }, [openChatCollabId]);

  const handleSendMessage = async (collaborationId: string) => {
    if (!newMessage.trim() || !user) return;

    try {
      await addDoc(collection(db, 'collaborationMessages'), {
        collaborationId,
        senderId: user.uid,
        senderName: user.displayName || 'Artist',
        senderEmail: user.email,
        message: newMessage.trim(),
        createdAt: serverTimestamp(),
      });
      setNewMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setRequestLoading(true);
    try {
      await addDoc(collection(db, 'collabRequests'), {
        artistId: user.uid,
        artistName: user.displayName || 'Unknown Artist',
        artistEmail: user.email,
        title: requestForm.title,
        type: requestForm.type,
        description: requestForm.description,
        budget: requestForm.budget ? parseFloat(requestForm.budget) : null,
        preferredStartDate: requestForm.preferredStartDate || null,
        message: requestForm.message,
        status: 'pending',
        createdAt: serverTimestamp(),
      });

      alert('✅ Collaboration request submitted! Admin will review it soon.');
      setRequestForm({
        title: '',
        type: 'music_video',
        description: '',
        budget: '',
        preferredStartDate: '',
        message: '',
      });
      setActiveTab('active');
    } catch (error) {
      console.error('Failed to submit collab request:', error);
      alert('❌ Failed to submit request. Please try again.');
    } finally {
      setRequestLoading(false);
    }
  };

  const filteredCollaborations = collaborations.filter((collab) => {
    if (filter === 'all') return true;
    return collab.status === filter;
  });

  if (loading) {
    return (
      <ArtistLayout>
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner text="Loading collaborations..." />
        </div>
      </ArtistLayout>
    );
  }

  return (
    <ArtistLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-white">Collaborations</h1>
          <p className="text-white/40 mt-2">Manage your collaboration projects with Jonna Rincon</p>
        </div>

        {/* Main Tabs */}
        <div className="flex gap-2 border-b border-white/[0.1]">
          {(['active', 'request'] as TabType[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 text-sm font-semibold transition-all border-b-2 ${
                activeTab === tab
                  ? 'text-white border-red-500'
                  : 'text-white/50 border-transparent hover:text-white/70'
              }`}
            >
              {tab === 'active' ? 'My Collaborations' : 'Request Collaboration'}
            </button>
          ))}
        </div>

        {/* ACTIVE COLLABORATIONS TAB */}
        {activeTab === 'active' && (
          <>
            {/* Filter Tabs */}
            <div className="flex gap-4 mb-6 border-b border-white/[0.06]">
              {(['all', 'inquiry', 'in_progress', 'completed'] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setFilter(status)}
                  className={`px-4 py-2 capitalize transition ${
                    filter === status
                      ? 'border-b-2 border-purple-500 text-white'
                      : 'text-white/40 hover:text-white'
                  }`}
                >
                  {status === 'all' ? 'All' : status.replace('_', ' ')}
                  <span className="ml-2 text-sm">
                    (
                    {status === 'all'
                      ? collaborations.length
                      : collaborations.filter((c) => c.status === status).length}
                    )
                  </span>
                </button>
              ))}
            </div>

            {/* Collaborations List */}
            {filteredCollaborations.length === 0 ? (
          <div className="text-center py-12 bg-white/[0.08] rounded-lg">
            <div className="text-4xl mb-4">🤝</div>
            <p className="text-xl mb-2">No collaborations found</p>
            <p className="text-white/40 mb-6">
              {filter === 'all'
                ? 'Start collaborating with Jonna Rincon today'
                : `No ${filter.replace('_', ' ')} collaborations`}
            </p>
            <a
              href="mailto:info@jonnarincon.com"
              className="inline-block bg-purple-600 hover:bg-purple-700 px-6 py-3 rounded-lg transition"
            >
              Contact for Collaboration
            </a>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredCollaborations.map((collab) => (
              <div key={collab.id} className="bg-white/[0.08] rounded-lg overflow-hidden">
                {/* Collaboration Header */}
                <div className="bg-white/[0.06] p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-xl mb-2">{collab.title}</h3>
                      <div className="flex items-center gap-4 text-sm text-white/40">
                        <span className="capitalize">{collab.type}</span>
                        {collab.budget && <span>Budget: €{collab.budget.toFixed(2)}</span>}
                        {collab.startDate && (
                          <span>Started: {collab.startDate.toDate?.()?.toLocaleDateString() || 'N/A'}</span>
                        )}
                      </div>
                    </div>

                    <div
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        collab.status === 'completed'
                          ? 'bg-green-900 text-green-300'
                          : collab.status === 'in_progress'
                          ? 'bg-blue-900 text-blue-300'
                          : collab.status === 'signed'
                          ? 'bg-purple-900 text-purple-300'
                          : collab.status === 'inquiry'
                          ? 'bg-yellow-900 text-yellow-300'
                          : 'bg-white/[0.08] text-white/60'
                      }`}
                    >
                      {collab.status.replace('_', ' ')}
                    </div>
                  </div>
                </div>

                {/* Collaboration Details */}
                <div className="p-6">
                  <div className="mb-4">
                    <div className="text-sm text-white/40 mb-1">Description</div>
                    <p className="text-white/80">{collab.description}</p>
                  </div>

                  {/* Timeline */}
                  {(collab.startDate || collab.endDate || collab.deadline) && (
                    <div className="mb-4 pb-4 border-b border-white/[0.06]">
                      <div className="text-sm text-white/40 mb-2">Timeline</div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        {collab.startDate && (
                          <div>
                            <span className="text-white/40">Start: </span>
                            {collab.startDate.toDate?.()?.toLocaleDateString() || 'N/A'}
                          </div>
                        )}
                        {collab.deadline && (
                          <div>
                            <span className="text-white/40">Deadline: </span>
                            <span className="text-yellow-400">
                              {collab.deadline.toDate?.()?.toLocaleDateString() || 'N/A'}
                            </span>
                          </div>
                        )}
                        {collab.endDate && (
                          <div>
                            <span className="text-white/40">End: </span>
                            {collab.endDate.toDate?.()?.toLocaleDateString() || 'N/A'}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Payment Info */}
                  {collab.budget && (
                    <div className="mb-4 pb-4 border-b border-white/[0.06]">
                      <div className="text-sm text-white/40 mb-2">Payment</div>
                      <div className="flex gap-8 text-sm">
                        <div>
                          <span className="text-white/40">Budget: </span>€{collab.budget.toFixed(2)}
                        </div>
                        <div>
                          <span className="text-white/40">Paid: </span>€{collab.paidAmount.toFixed(2)}
                        </div>
                        <div>
                          <span
                            className={`font-semibold ${
                              collab.paymentStatus === 'paid'
                                ? 'text-green-400'
                                : collab.paymentStatus === 'partial'
                                ? 'text-yellow-400'
                                : 'text-red-400'
                            }`}
                          >
                            {collab.paymentStatus === 'paid'
                              ? 'Paid in Full'
                              : collab.paymentStatus === 'partial'
                              ? 'Partially Paid'
                              : 'Unpaid'}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Documents */}
                  {(collab.contractPDF || (collab.attachments && collab.attachments.length > 0)) && (
                    <div className="mb-4">
                      <div className="text-sm text-white/40 mb-2">Documents</div>
                      <div className="flex gap-2">
                        {collab.contractPDF && (
                          <a
                            href={collab.contractPDF}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-white/[0.06] hover:bg-white/[0.08] px-4 py-2 rounded text-sm transition"
                          >
                            📄 Contract
                          </a>
                        )}
                        {collab.attachments?.map((url, idx) => (
                          <a
                            key={idx}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-white/[0.06] hover:bg-white/[0.08] px-4 py-2 rounded text-sm transition"
                          >
                            📎 Attachment {idx + 1}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Notes */}
                  {collab.notes && (
                    <div className="mb-4">
                      <div className="text-sm text-white/40 mb-1">Notes</div>
                      <p className="text-sm text-white/60">{collab.notes}</p>
                    </div>
                  )}

                  {/* Messaging Section */}
                  <div className="mt-4 pt-4 border-t border-white/[0.06]">
                    {openChatCollabId === collab.id ? (
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <h4 className="text-lg font-semibold text-white flex items-center gap-2">
                            <MessageSquare size={20} className="text-blue-400" />
                            Messages
                          </h4>
                          <button
                            onClick={() => setOpenChatCollabId(null)}
                            className="text-white/40 hover:text-white transition"
                          >
                            <X size={20} />
                          </button>
                        </div>

                        {/* Messages List */}
                        <div className="bg-black rounded-lg p-4 max-h-96 overflow-y-auto space-y-3">
                          {messages[collab.id]?.length === 0 ? (
                            <div className="text-center text-white/40 py-8">
                              <MessageSquare size={48} className="mx-auto mb-2 opacity-50" />
                              <p>No messages yet. Start the conversation!</p>
                            </div>
                          ) : (
                            messages[collab.id]?.map((msg) => (
                              <div
                                key={msg.id}
                                className={`p-3 rounded-lg ${
                                  msg.senderId === user?.uid
                                    ? 'bg-purple-900/30 ml-8'
                                    : 'bg-white/[0.08] mr-8'
                                }`}
                              >
                                <div className="flex justify-between items-start mb-1">
                                  <span className="font-semibold text-sm text-white">
                                    {msg.senderId === user?.uid ? 'You' : msg.senderName}
                                  </span>
                                  <span className="text-xs text-white/40">
                                    {msg.createdAt?.toDate?.()?.toLocaleString() || 'Just now'}
                                  </span>
                                </div>
                                <p className="text-white/60 text-sm">{msg.message}</p>
                              </div>
                            ))
                          )}
                        </div>

                        {/* Message Input */}
                        <form
                          onSubmit={(e) => {
                            e.preventDefault();
                            handleSendMessage(collab.id!);
                          }}
                          className="flex gap-2"
                        >
                          <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Type your message..."
                            className="flex-1 bg-white/[0.06] border border-white/[0.08] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                          />
                          <button
                            type="submit"
                            disabled={!newMessage.trim()}
                            className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 px-4 py-2 rounded-lg text-white font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                          >
                            <Send size={18} />
                            Send
                          </button>
                        </form>
                      </div>
                    ) : (
                      <button
                        onClick={() => setOpenChatCollabId(collab.id!)}
                        className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 px-4 py-3 rounded-lg text-white font-medium transition-all flex items-center justify-center gap-2"
                      >
                        <MessageSquare size={20} />
                        Open Messages
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
            )}
          </>
        )}

        {/* REQUEST COLLABORATION TAB */}
        {activeTab === 'request' && (
          <div className="max-w-2xl space-y-6">
            <div className="bg-white/[0.08] border border-white/[0.06] rounded-xl p-6 space-y-6">
              {/* Form Header */}
              <div>
                <h2 className="text-xl font-bold text-white mb-2">Submit a Collaboration Request</h2>
                <p className="text-white/40">Tell us about your collaboration idea</p>
              </div>

              <form onSubmit={handleSubmitRequest} className="space-y-6">
                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-white/60 mb-2">
                    Project Title <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={requestForm.title}
                    onChange={(e) => setRequestForm({ ...requestForm, title: e.target.value })}
                    placeholder="e.g., Music Video for Summer Track"
                    className="w-full bg-white/[0.06] border border-white/[0.08] rounded-lg px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-red-500"
                  />
                </div>

                {/* Type */}
                <div>
                  <label className="block text-sm font-medium text-white/60 mb-2">
                    Collaboration Type <span className="text-red-400">*</span>
                  </label>
                  <select
                    required
                    value={requestForm.type}
                    onChange={(e) => setRequestForm({ ...requestForm, type: e.target.value as any })}
                    className="w-full bg-white/[0.06] border border-white/[0.08] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-red-500"
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
                    value={requestForm.description}
                    onChange={(e) => setRequestForm({ ...requestForm, description: e.target.value })}
                    placeholder="Describe what you want to collaborate on..."
                    className="w-full bg-white/[0.06] border border-white/[0.08] rounded-lg px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-red-500"
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
                    value={requestForm.budget}
                    onChange={(e) => setRequestForm({ ...requestForm, budget: e.target.value })}
                    placeholder="e.g., 5000"
                    className="w-full bg-white/[0.06] border border-white/[0.08] rounded-lg px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-red-500"
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
                    value={requestForm.preferredStartDate}
                    onChange={(e) => setRequestForm({ ...requestForm, preferredStartDate: e.target.value })}
                    className="w-full bg-white/[0.06] border border-white/[0.08] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-red-500"
                  />
                </div>

                {/* Additional Message */}
                <div>
                  <label className="block text-sm font-medium text-white/60 mb-2">
                    Additional Message
                  </label>
                  <textarea
                    rows={3}
                    value={requestForm.message}
                    onChange={(e) => setRequestForm({ ...requestForm, message: e.target.value })}
                    placeholder="Any additional information you'd like to share..."
                    className="w-full bg-white/[0.06] border border-white/[0.08] rounded-lg px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-red-500"
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={requestLoading}
                  className="w-full bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 px-6 py-4 rounded-lg text-white font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {requestLoading ? (
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
              <div className="bg-blue-900/20 border border-blue-700 rounded-xl p-4 flex gap-3">
                <AlertCircle size={20} className="text-blue-300 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-200 mb-1">What happens next?</p>
                  <p className="text-sm text-blue-200">Your request will be reviewed by the admin team. You'll receive an email once your request is approved or if we need more information.</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </ArtistLayout>
  );
};

export default ArtistCollaborations;
