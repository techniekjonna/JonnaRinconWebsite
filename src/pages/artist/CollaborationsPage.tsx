import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { collaborationService } from '../../lib/firebase/services/collaborationService';
import { Collaboration } from '../../lib/firebase/types';
import ArtistLayout from '../../components/artist/ArtistLayout';
import { Handshake, Mail, MessageSquare, Send, X } from 'lucide-react';
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

const ArtistCollaborations: React.FC = () => {
  const { user } = useAuth();
  const [collaborations, setCollaborations] = useState<Collaboration[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'in_progress' | 'completed' | 'inquiry'>('all');

  // Messaging state
  const [openChatCollabId, setOpenChatCollabId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Record<string, CollabMessage[]>>({});
  const [newMessage, setNewMessage] = useState('');

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

  const filteredCollaborations = collaborations.filter((collab) => {
    if (filter === 'all') return true;
    return collab.status === filter;
  });

  if (loading) {
    return (
      <ArtistLayout>
        <div className="flex justify-center items-center h-64">
          <div className="text-xl text-white">Loading collaborations...</div>
        </div>
      </ArtistLayout>
    );
  }

  return (
    <ArtistLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-white">My Collaborations</h1>
          <p className="text-gray-400 mt-2">Manage your collaboration projects with Jonna Rincon</p>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-4 mb-8 border-b border-gray-700">
          {(['all', 'inquiry', 'in_progress', 'completed'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 capitalize transition ${
                filter === status
                  ? 'border-b-2 border-purple-500 text-white'
                  : 'text-gray-400 hover:text-white'
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
          <div className="text-center py-12 bg-gray-800 rounded-lg">
            <div className="text-4xl mb-4">🤝</div>
            <p className="text-xl mb-2">No collaborations found</p>
            <p className="text-gray-400 mb-6">
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
              <div key={collab.id} className="bg-gray-800 rounded-lg overflow-hidden">
                {/* Collaboration Header */}
                <div className="bg-gray-700 p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-xl mb-2">{collab.title}</h3>
                      <div className="flex items-center gap-4 text-sm text-gray-400">
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
                          : 'bg-gray-600 text-gray-300'
                      }`}
                    >
                      {collab.status.replace('_', ' ')}
                    </div>
                  </div>
                </div>

                {/* Collaboration Details */}
                <div className="p-6">
                  <div className="mb-4">
                    <div className="text-sm text-gray-400 mb-1">Description</div>
                    <p className="text-gray-200">{collab.description}</p>
                  </div>

                  {/* Timeline */}
                  {(collab.startDate || collab.endDate || collab.deadline) && (
                    <div className="mb-4 pb-4 border-b border-gray-700">
                      <div className="text-sm text-gray-400 mb-2">Timeline</div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        {collab.startDate && (
                          <div>
                            <span className="text-gray-400">Start: </span>
                            {collab.startDate.toDate?.()?.toLocaleDateString() || 'N/A'}
                          </div>
                        )}
                        {collab.deadline && (
                          <div>
                            <span className="text-gray-400">Deadline: </span>
                            <span className="text-yellow-400">
                              {collab.deadline.toDate?.()?.toLocaleDateString() || 'N/A'}
                            </span>
                          </div>
                        )}
                        {collab.endDate && (
                          <div>
                            <span className="text-gray-400">End: </span>
                            {collab.endDate.toDate?.()?.toLocaleDateString() || 'N/A'}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Payment Info */}
                  {collab.budget && (
                    <div className="mb-4 pb-4 border-b border-gray-700">
                      <div className="text-sm text-gray-400 mb-2">Payment</div>
                      <div className="flex gap-8 text-sm">
                        <div>
                          <span className="text-gray-400">Budget: </span>€{collab.budget.toFixed(2)}
                        </div>
                        <div>
                          <span className="text-gray-400">Paid: </span>€{collab.paidAmount.toFixed(2)}
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
                      <div className="text-sm text-gray-400 mb-2">Documents</div>
                      <div className="flex gap-2">
                        {collab.contractPDF && (
                          <a
                            href={collab.contractPDF}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded text-sm transition"
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
                            className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded text-sm transition"
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
                      <div className="text-sm text-gray-400 mb-1">Notes</div>
                      <p className="text-sm text-gray-300">{collab.notes}</p>
                    </div>
                  )}

                  {/* Messaging Section */}
                  <div className="mt-4 pt-4 border-t border-gray-700">
                    {openChatCollabId === collab.id ? (
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <h4 className="text-lg font-semibold text-white flex items-center gap-2">
                            <MessageSquare size={20} className="text-blue-400" />
                            Messages
                          </h4>
                          <button
                            onClick={() => setOpenChatCollabId(null)}
                            className="text-gray-400 hover:text-white transition"
                          >
                            <X size={20} />
                          </button>
                        </div>

                        {/* Messages List */}
                        <div className="bg-gray-900 rounded-lg p-4 max-h-96 overflow-y-auto space-y-3">
                          {messages[collab.id]?.length === 0 ? (
                            <div className="text-center text-gray-400 py-8">
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
                                    : 'bg-gray-800 mr-8'
                                }`}
                              >
                                <div className="flex justify-between items-start mb-1">
                                  <span className="font-semibold text-sm text-white">
                                    {msg.senderId === user?.uid ? 'You' : msg.senderName}
                                  </span>
                                  <span className="text-xs text-gray-400">
                                    {msg.createdAt?.toDate?.()?.toLocaleString() || 'Just now'}
                                  </span>
                                </div>
                                <p className="text-gray-300 text-sm">{msg.message}</p>
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
                            className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
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
      </div>
    </ArtistLayout>
  );
};

export default ArtistCollaborations;
