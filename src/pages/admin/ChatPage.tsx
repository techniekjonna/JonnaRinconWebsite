import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { MessageSquare, Send, Search, Filter } from 'lucide-react';
import { db } from '../../lib/firebase/config';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, Timestamp, where } from 'firebase/firestore';
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

const AdminChat: React.FC = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'customer' | 'artist' | 'manager'>('all');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  useEffect(() => {
    // Load all support messages
    const messagesRef = collection(db, 'supportMessages');
    let q = query(messagesRef, orderBy('createdAt', 'desc'));

    // Apply role filter
    if (roleFilter !== 'all') {
      q = query(messagesRef, where('senderRole', '==', roleFilter), orderBy('createdAt', 'desc'));
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs: ChatMessage[] = [];
      snapshot.forEach((doc) => {
        msgs.push({ id: doc.id, ...doc.data() } as ChatMessage);
      });
      setMessages(msgs);
    });

    return () => unsubscribe();
  }, [roleFilter]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !selectedUserId) return;

    try {
      await addDoc(collection(db, 'supportMessages'), {
        senderId: user.uid,
        senderName: user.displayName || 'Admin',
        senderEmail: user.email,
        senderRole: 'admin',
        recipientId: selectedUserId,
        message: newMessage.trim(),
        createdAt: serverTimestamp(),
      });
      setNewMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const filteredMessages = messages.filter(
    (msg) =>
      (msg.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      msg.senderName.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (!selectedUserId || msg.senderId === selectedUserId || msg.recipientId === selectedUserId)
  );

  // Get unique users from messages
  const uniqueUsers = Array.from(new Map(
    messages.map(msg => [msg.senderId, { id: msg.senderId, name: msg.senderName, role: msg.senderRole, email: msg.senderEmail }])
  ).values());

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-white">Support Chat</h1>
          <p className="text-gray-400 mt-2">Manage customer, artist, and manager communications</p>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search messages..."
              className="w-full pl-12 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
            />
          </div>

          <div className="relative">
            <Filter className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as any)}
              className="w-full pl-12 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-500 appearance-none"
            >
              <option value="all">All Roles</option>
              <option value="customer">Customers</option>
              <option value="artist">Artists</option>
              <option value="manager">Managers</option>
            </select>
          </div>

          <div>
            <select
              value={selectedUserId || ''}
              onChange={(e) => setSelectedUserId(e.target.value || null)}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
            >
              <option value="">All Users</option>
              {uniqueUsers.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name} ({user.role})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Chat Container */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden flex flex-col" style={{ height: 'calc(100vh - 450px)' }}>
          {/* Messages List */}
          <div className="flex-1 p-6 overflow-y-auto space-y-4">
            {filteredMessages.length === 0 ? (
              <div className="text-center text-gray-400 py-12">
                <MessageSquare size={48} className="mx-auto mb-4 opacity-50" />
                <p>No messages found</p>
              </div>
            ) : (
              filteredMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`p-4 rounded-lg ${
                    msg.senderId === user?.uid
                      ? 'bg-purple-900/30 ml-12'
                      : 'bg-gray-700 mr-12'
                  }`}
                  onClick={() => setSelectedUserId(msg.senderId)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="font-semibold text-white">
                        {msg.senderId === user?.uid ? 'You (Admin)' : msg.senderName}
                      </span>
                      <span className={`ml-2 px-2 py-0.5 rounded text-xs capitalize ${
                        msg.senderRole === 'customer' ? 'bg-blue-600 text-blue-100' :
                        msg.senderRole === 'artist' ? 'bg-purple-600 text-purple-100' :
                        msg.senderRole === 'manager' ? 'bg-cyan-600 text-cyan-100' :
                        'bg-gray-600 text-gray-100'
                      }`}>
                        {msg.senderRole}
                      </span>
                      <span className="ml-2 text-xs text-gray-400">{msg.senderEmail}</span>
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
          {selectedUserId && (
            <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-700 bg-gray-750">
              <div className="mb-2 text-sm text-gray-400">
                Replying to: <span className="text-white font-semibold">
                  {uniqueUsers.find(u => u.id === selectedUserId)?.name}
                </span>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your reply..."
                  className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 px-6 py-3 rounded-lg text-white font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <Send size={20} />
                  Send
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
            <p className="text-gray-400 text-sm">Total Messages</p>
            <p className="text-2xl font-bold text-white mt-1">{messages.length}</p>
          </div>
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
            <p className="text-gray-400 text-sm">Customers</p>
            <p className="text-2xl font-bold text-blue-400 mt-1">
              {messages.filter(m => m.senderRole === 'customer').length}
            </p>
          </div>
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
            <p className="text-gray-400 text-sm">Artists</p>
            <p className="text-2xl font-bold text-purple-400 mt-1">
              {messages.filter(m => m.senderRole === 'artist').length}
            </p>
          </div>
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
            <p className="text-gray-400 text-sm">Managers</p>
            <p className="text-2xl font-bold text-cyan-400 mt-1">
              {messages.filter(m => m.senderRole === 'manager').length}
            </p>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminChat;
