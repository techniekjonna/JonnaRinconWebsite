import React, { useState, useEffect } from 'react';
import CustomerLayout from '../../components/customer/CustomerLayout';
import { MessageSquare, Send } from 'lucide-react';
import { db } from '../../lib/firebase/config';
import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';

interface ChatMessage {
  id?: string;
  senderId: string;
  senderName: string;
  senderEmail: string;
  senderRole: string;
  recipientId?: string;
  message: string;
  createdAt: Timestamp;
}

const CustomerChat: React.FC = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');

  useEffect(() => {
    if (!user) return;

    // Load messages for this customer
    const messagesRef = collection(db, 'supportMessages');
    const q = query(
      messagesRef,
      where('senderId', '==', user.uid),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs: ChatMessage[] = [];
      snapshot.forEach((doc) => {
        msgs.push({ id: doc.id, ...doc.data() } as ChatMessage);
      });
      setMessages(msgs);
    });

    // Also load messages sent TO this customer
    const qIncoming = query(
      messagesRef,
      where('recipientId', '==', user.uid),
      orderBy('createdAt', 'asc')
    );

    const unsubscribeIncoming = onSnapshot(qIncoming, (snapshot) => {
      snapshot.forEach((doc) => {
        const msg = { id: doc.id, ...doc.data() } as ChatMessage;
        // Add if not already in messages
        if (!msgs.find(m => m.id === doc.id)) {
          msgs.push(msg);
        }
      });
      // Sort by createdAt
      msgs.sort((a, b) => {
        const aTime = a.createdAt?.toMillis?.() || 0;
        const bTime = b.createdAt?.toMillis?.() || 0;
        return aTime - bTime;
      });
      setMessages([...msgs]);
    });

    return () => {
      unsubscribe();
      unsubscribeIncoming();
    };
  }, [user]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;

    try {
      await addDoc(collection(db, 'supportMessages'), {
        senderId: user.uid,
        senderName: user.displayName || 'Customer',
        senderEmail: user.email,
        senderRole: 'customer',
        message: newMessage.trim(),
        createdAt: serverTimestamp(),
      });
      setNewMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  return (
    <CustomerLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-white">Support Chat</h1>
          <p className="text-gray-400 mt-2">Get help from the Jonna Rincon team</p>
        </div>

        {/* Chat Container */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden flex flex-col" style={{ height: 'calc(100vh - 300px)' }}>
          {/* Messages List */}
          <div className="flex-1 p-6 overflow-y-auto space-y-4">
            {messages.length === 0 ? (
              <div className="text-center text-gray-400 py-12">
                <MessageSquare size={48} className="mx-auto mb-4 opacity-50" />
                <p>No messages yet</p>
                <p className="text-sm mt-2">Send a message to get support from the team</p>
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`p-4 rounded-lg ${
                    msg.senderId === user?.uid
                      ? 'bg-blue-900/30 ml-12'
                      : 'bg-gray-700 mr-12'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="font-semibold text-white">
                        {msg.senderId === user?.uid ? 'You' : msg.senderName}
                      </span>
                      {msg.senderRole && msg.senderId !== user?.uid && (
                        <span className="ml-2 px-2 py-0.5 bg-purple-600 text-purple-100 rounded text-xs capitalize">
                          {msg.senderRole}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-gray-400">
                      {msg.createdAt?.toDate?.()?.toLocaleString() || 'Just now'}
                    </span>
                  </div>
                  <p className="text-gray-300">{msg.message}</p>
                </div>
              ))
            )}
          </div>

          {/* Message Input */}
          <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-700 bg-gray-750">
            <div className="flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500"
              />
              <button
                type="submit"
                disabled={!newMessage.trim()}
                className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 px-6 py-3 rounded-lg text-white font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Send size={20} />
                Send
              </button>
            </div>
          </form>
        </div>

        {/* Info Box */}
        <div className="bg-blue-900/20 border border-blue-700 rounded-xl p-4">
          <p className="text-sm text-blue-200">
            💬 <strong>Support Hours:</strong> Our team typically responds within 24 hours during business days.
            For urgent matters, please include "URGENT" in your message.
          </p>
        </div>
      </div>
    </CustomerLayout>
  );
};

export default CustomerChat;
