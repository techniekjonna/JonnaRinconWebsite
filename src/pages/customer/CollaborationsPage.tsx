import React, { useState, useEffect } from 'react';
import CustomerLayout from '../../components/customer/CustomerLayout';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../lib/firebase/config';
import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { Handshake, MessageSquare, Send, ChevronDown, ChevronUp } from 'lucide-react';
import { Collaboration } from '../../lib/firebase/types';

interface CollabMessage {
  id?: string;
  collaborationId: string;
  senderId: string;
  senderName: string;
  senderEmail: string;
  message: string;
  createdAt: Timestamp;
}

const CustomerCollaborations: React.FC = () => {
  const { user } = useAuth();
  const [collaborations, setCollaborations] = useState<Collaboration[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedCollabId, setExpandedCollabId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Record<string, CollabMessage[]>>({});
  const [newMessage, setNewMessage] = useState('');

  // Load collaborations for this customer
  useEffect(() => {
    if (!user) return;

    const collabsRef = collection(db, 'collaborations');
    const q = query(
      collabsRef,
      where('clientEmail', '==', user.email),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const collabs: Collaboration[] = [];
      snapshot.forEach((doc) => {
        collabs.push({ id: doc.id, ...doc.data() } as Collaboration);
      });
      setCollaborations(collabs);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

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
        senderName: user.displayName || 'Customer',
        senderEmail: user.email,
        message: newMessage.trim(),
        createdAt: serverTimestamp(),
      });
      setNewMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  if (loading) {
    return (
      <CustomerLayout>
        <div className="flex justify-center items-center h-64">
          <div className="text-xl text-white">Loading collaborations...</div>
        </div>
      </CustomerLayout>
    );
  }

  return (
    <CustomerLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-white">My Collaborations</h1>
          <p className="text-gray-400 mt-2">Track your collaborations with Jonna Rincon</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
            <p className="text-gray-400 text-sm">Total</p>
            <p className="text-2xl font-bold text-white mt-1">{collaborations.length}</p>
          </div>
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
            <p className="text-gray-400 text-sm">Active</p>
            <p className="text-2xl font-bold text-blue-400 mt-1">
              {collaborations.filter((c) => ['agreed', 'contract_sent', 'signed', 'in_progress'].includes(c.status)).length}
            </p>
          </div>
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
            <p className="text-gray-400 text-sm">Completed</p>
            <p className="text-2xl font-bold text-green-400 mt-1">
              {collaborations.filter((c) => c.status === 'completed').length}
            </p>
          </div>
        </div>

        {/* Collaborations List */}
        {collaborations.length === 0 ? (
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-12 text-center">
            <Handshake size={64} className="mx-auto mb-4 text-gray-600" />
            <h2 className="text-2xl font-bold text-white mb-2">No collaborations yet</h2>
            <p className="text-gray-400">When you start a collaboration, it will appear here</p>
          </div>
        ) : (
          <div className="space-y-4">
            {collaborations.map((collab) => (
              <div key={collab.id} className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
                {/* Header - Clickable */}
                <div
                  onClick={() => setExpandedCollabId(expandedCollabId === collab.id ? null : collab.id!)}
                  className="p-6 cursor-pointer hover:bg-gray-750 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold text-white">{collab.title}</h3>
                        <span
                          className={`px-2 py-1 rounded text-xs ${
                            collab.status === 'completed'
                              ? 'bg-green-600/20 text-green-400'
                              : collab.status === 'in_progress'
                              ? 'bg-cyan-500/20 text-cyan-400'
                              : collab.status === 'signed'
                              ? 'bg-green-500/20 text-green-400'
                              : 'bg-gray-500/20 text-gray-400'
                          }`}
                        >
                          {collab.status.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-400">Type:</span>
                          <p className="text-white font-medium capitalize">{collab.type}</p>
                        </div>
                        <div>
                          <span className="text-gray-400">Budget:</span>
                          <p className="text-white font-medium">
                            {collab.budget ? `€${collab.budget.toFixed(2)}` : 'N/A'}
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-400">Payment:</span>
                          <p
                            className={`font-medium ${
                              collab.paymentStatus === 'paid'
                                ? 'text-green-400'
                                : collab.paymentStatus === 'partial'
                                ? 'text-yellow-400'
                                : 'text-gray-400'
                            }`}
                          >
                            €{collab.paidAmount.toFixed(2)} ({collab.paymentStatus})
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-400">Started:</span>
                          <p className="text-white font-medium">
                            {collab.startDate?.toDate?.()?.toLocaleDateString() || 'TBD'}
                          </p>
                        </div>
                      </div>
                    </div>
                    <button className="text-gray-400 hover:text-white transition ml-4">
                      {expandedCollabId === collab.id ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
                    </button>
                  </div>
                </div>

                {/* Expanded Details */}
                {expandedCollabId === collab.id && (
                  <div className="border-t border-gray-700 p-6 space-y-6">
                    {/* Description */}
                    <div>
                      <h4 className="text-sm font-semibold text-gray-300 mb-2">Description</h4>
                      <p className="text-gray-200">{collab.description}</p>
                    </div>

                    {/* Chat Section */}
                    <div className="bg-gray-900 rounded-lg p-4">
                      <h4 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
                        <MessageSquare size={20} className="text-blue-400" />
                        Collaboration Chat
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
                                  ? 'bg-blue-900/30 ml-8'
                                  : 'bg-gray-700 mr-8'
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
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </CustomerLayout>
  );
};

export default CustomerCollaborations;
