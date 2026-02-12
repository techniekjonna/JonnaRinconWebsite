import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { useCollaborations } from '../../hooks/useCollaborations';
import { CollaborationStatus } from '../../lib/firebase/types';
import { MessageSquare, Send, X, ChevronDown, ChevronUp } from 'lucide-react';
import { db } from '../../lib/firebase/config';
import { collection, addDoc, serverTimestamp, query, where, orderBy, onSnapshot, Timestamp } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';

interface CollabMessage {
  id?: string;
  collaborationId: string;
  senderId: string;
  senderName: string;
  senderEmail: string;
  message: string;
  createdAt: Timestamp;
}

const CollaborationsPage: React.FC = () => {
  const { collaborations, loading } = useCollaborations();
  const { user } = useAuth();
  const [expandedCollabId, setExpandedCollabId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Record<string, CollabMessage[]>>({});
  const [newMessage, setNewMessage] = useState('');

  const getStatusColor = (status: CollaborationStatus) => {
    const colors: Record<CollaborationStatus, string> = {
      inquiry: 'bg-gray-500/20 text-gray-400',
      negotiating: 'bg-yellow-500/20 text-yellow-400',
      agreed: 'bg-blue-500/20 text-blue-400',
      contract_sent: 'bg-purple-500/20 text-purple-400',
      signed: 'bg-green-500/20 text-green-400',
      in_progress: 'bg-cyan-500/20 text-cyan-400',
      completed: 'bg-green-600/20 text-green-500',
      cancelled: 'bg-red-500/20 text-red-400',
    };
    return colors[status];
  };

  // Load messages for expanded collaboration
  useEffect(() => {
    if (!expandedCollabId) return;

    const messagesRef = collection(db, 'collaborationMessages');
    const q = query(
      messagesRef,
      where('collaborationId', '==', expandedCollabId),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs: CollabMessage[] = [];
      snapshot.forEach((doc) => {
        msgs.push({ id: doc.id, ...doc.data() } as CollabMessage);
      });
      setMessages((prev) => ({ ...prev, [expandedCollabId]: msgs }));
    });

    return () => unsubscribe();
  }, [expandedCollabId]);

  const handleSendMessage = async (collaborationId: string) => {
    if (!newMessage.trim() || !user) return;

    try {
      await addDoc(collection(db, 'collaborationMessages'), {
        collaborationId,
        senderId: user.uid,
        senderName: user.displayName || 'Admin',
        senderEmail: user.email,
        message: newMessage.trim(),
        createdAt: serverTimestamp(),
      });
      setNewMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Collaborations & Contracts</h1>
          <p className="text-gray-400 mt-2">Manage partnerships and deals</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
            <p className="text-gray-400 text-sm">Total</p>
            <p className="text-2xl font-bold text-white mt-1">{collaborations.length}</p>
          </div>
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
            <p className="text-gray-400 text-sm">Active</p>
            <p className="text-2xl font-bold text-blue-400 mt-1">
              {collaborations.filter(c => ['agreed', 'contract_sent', 'signed', 'in_progress'].includes(c.status)).length}
            </p>
          </div>
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
            <p className="text-gray-400 text-sm">Completed</p>
            <p className="text-2xl font-bold text-green-400 mt-1">
              {collaborations.filter(c => c.status === 'completed').length}
            </p>
          </div>
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
            <p className="text-gray-400 text-sm">Total Revenue</p>
            <p className="text-2xl font-bold text-white mt-1">
              €{collaborations.reduce((sum, c) => sum + c.paidAmount, 0).toFixed(2)}
            </p>
          </div>
        </div>

        {/* Collaborations List */}
        <div className="space-y-4">
          {loading ? (
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-12 text-center text-gray-400">
              Loading...
            </div>
          ) : collaborations.length === 0 ? (
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-12 text-center text-gray-400">
              No collaborations yet
            </div>
          ) : (
            collaborations.map((collab) => (
              <div key={collab.id} className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
                {/* Header - Clickable - Compact View */}
                <div
                  onClick={() => setExpandedCollabId(expandedCollabId === collab.id ? null : collab.id!)}
                  className="p-4 cursor-pointer hover:bg-gray-750 transition-colors"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <h3 className="text-lg font-bold text-white truncate">{collab.title}</h3>
                      <span className={`px-2 py-1 rounded text-xs flex-shrink-0 ${getStatusColor(collab.status)}`}>
                        {collab.status.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 flex-shrink-0">
                      <div className="text-sm text-gray-400 hidden md:block">
                        <span className="text-white font-medium">{collab.clientName}</span>
                      </div>
                      <button className="text-gray-400 hover:text-white transition">
                        {expandedCollabId === collab.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {expandedCollabId === collab.id && (
                  <div className="border-t border-gray-700 p-6 space-y-6">
                    {/* Details Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div>
                        <span className="text-gray-400 text-sm">Client:</span>
                        <p className="text-white font-medium">{collab.clientName}</p>
                        <p className="text-gray-400 text-xs">{collab.clientEmail}</p>
                      </div>
                      <div>
                        <span className="text-gray-400 text-sm">Type:</span>
                        <p className="text-white font-medium capitalize">{collab.type}</p>
                      </div>
                      <div>
                        <span className="text-gray-400 text-sm">Budget:</span>
                        <p className="text-white font-medium">
                          {collab.budget ? `€${collab.budget.toFixed(2)}` : 'N/A'}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-400 text-sm">Payment:</span>
                        <p className={`font-medium ${
                          collab.paymentStatus === 'paid' ? 'text-green-400' :
                          collab.paymentStatus === 'partial' ? 'text-yellow-400' : 'text-gray-400'
                        }`}>
                          €{collab.paidAmount.toFixed(2)} ({collab.paymentStatus})
                        </p>
                      </div>
                    </div>

                    {/* Description */}
                    <div>
                      <h4 className="text-sm font-semibold text-gray-300 mb-2">Description</h4>
                      <p className="text-gray-200">{collab.description}</p>
                    </div>

                    {/* Messaging Section */}
                    <div className="bg-gray-900 rounded-lg p-4">
                      <h4 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
                        <MessageSquare size={20} className="text-blue-400" />
                        Messages
                      </h4>

                      {/* Messages List */}
                      <div className="bg-gray-800 rounded-lg p-4 max-h-80 overflow-y-auto space-y-3 mb-4">
                        {(!messages[collab.id!] || messages[collab.id!].length === 0) ? (
                          <div className="text-center text-gray-400 py-8">
                            <MessageSquare size={48} className="mx-auto mb-2 opacity-50" />
                            <p>No messages yet. Start the conversation!</p>
                          </div>
                        ) : (
                          messages[collab.id!]?.map((msg) => (
                            <div
                              key={msg.id}
                              className={`p-3 rounded-lg ${
                                msg.senderId === user?.uid
                                  ? 'bg-purple-900/30 ml-8'
                                  : 'bg-gray-700 mr-8'
                              }`}
                            >
                              <div className="flex justify-between items-start mb-1">
                                <span className="font-semibold text-sm text-white">
                                  {msg.senderId === user?.uid ? 'You (Admin)' : msg.senderName}
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
                          placeholder="Type your message to the artist..."
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
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default CollaborationsPage;
