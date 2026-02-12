import React, { useState, useEffect } from 'react';
import ArtistLayout from '../../components/artist/ArtistLayout';
import { MessageSquare, Send } from 'lucide-react';
import { db } from '../../lib/firebase/config';
import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp, Timestamp, or } from 'firebase/firestore';
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

interface Conversation {
  userId: string;
  userName: string;
  userEmail: string;
  lastMessage: string;
  lastMessageTime: Timestamp;
  unreadCount: number;
}

const ArtistChat: React.FC = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [allMessages, setAllMessages] = useState<ChatMessage[]>([]);

  // Load ALL messages (sent and received)
  useEffect(() => {
    if (!user) return;

    const messagesRef = collection(db, 'supportMessages');

    const q = query(
      messagesRef,
      or(
        where('senderId', '==', user.uid),
        where('recipientId', '==', user.uid)
      ),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs: ChatMessage[] = [];
      snapshot.forEach((doc) => {
        msgs.push({ id: doc.id, ...doc.data() } as ChatMessage);
      });
      setAllMessages(msgs);
    });

    return () => unsubscribe();
  }, [user]);

  // Build conversations from all messages
  useEffect(() => {
    if (!user || allMessages.length === 0) return;

    const conversationMap = new Map<string, Conversation>();

    allMessages.forEach((msg) => {
      const otherUserId = msg.senderId === user.uid ? msg.recipientId : msg.senderId;
      if (!otherUserId) return;

      const otherUserName = msg.senderId === user.uid ? 'Support' : msg.senderName;
      const otherUserEmail = msg.senderId === user.uid ? '' : msg.senderEmail;

      if (!conversationMap.has(otherUserId)) {
        conversationMap.set(otherUserId, {
          userId: otherUserId,
          userName: otherUserName,
          userEmail: otherUserEmail,
          lastMessage: msg.message,
          lastMessageTime: msg.createdAt,
          unreadCount: 0,
        });
      } else {
        const existing = conversationMap.get(otherUserId)!;
        if (msg.createdAt.toMillis() > existing.lastMessageTime.toMillis()) {
          existing.lastMessage = msg.message;
          existing.lastMessageTime = msg.createdAt;
        }
      }
    });

    const convos = Array.from(conversationMap.values()).sort(
      (a, b) => b.lastMessageTime.toMillis() - a.lastMessageTime.toMillis()
    );

    setConversations(convos);

    if (!selectedConversation && convos.length > 0) {
      setSelectedConversation(convos[0].userId);
    }
  }, [allMessages, user, selectedConversation]);

  // Filter messages for selected conversation
  useEffect(() => {
    if (!selectedConversation || !user) {
      setMessages([]);
      return;
    }

    const filtered = allMessages.filter(
      (msg) =>
        (msg.senderId === user.uid && msg.recipientId === selectedConversation) ||
        (msg.senderId === selectedConversation && msg.recipientId === user.uid) ||
        (msg.senderId === selectedConversation && !msg.recipientId) ||
        (msg.senderId === user.uid && !msg.recipientId)
    );

    setMessages(filtered);
  }, [selectedConversation, allMessages, user]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !selectedConversation) return;

    try {
      await addDoc(collection(db, 'supportMessages'), {
        senderId: user.uid,
        senderName: user.displayName || 'Artist',
        senderEmail: user.email,
        senderRole: 'artist',
        recipientId: selectedConversation,
        message: newMessage.trim(),
        createdAt: serverTimestamp(),
      });
      setNewMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  if (conversations.length === 0) {
    return (
      <ArtistLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-white">Support Chat</h1>
            <p className="text-gray-400 mt-2">Get help from the Jonna Rincon team</p>
          </div>

          <div className="bg-gray-800 border border-gray-700 rounded-xl p-12 text-center">
            <MessageSquare size={64} className="mx-auto mb-4 text-gray-600" />
            <h2 className="text-2xl font-bold text-white mb-2">No conversations yet</h2>
            <p className="text-gray-400 mb-6">
              Start a conversation with our support team
            </p>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!newMessage.trim() || !user) return;

                try {
                  await addDoc(collection(db, 'supportMessages'), {
                    senderId: user.uid,
                    senderName: user.displayName || 'Artist',
                    senderEmail: user.email,
                    senderRole: 'artist',
                    message: newMessage.trim(),
                    createdAt: serverTimestamp(),
                  });
                  setNewMessage('');
                } catch (error) {
                  console.error('Failed to send message:', error);
                }
              }}
              className="max-w-2xl mx-auto"
            >
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your message to support..."
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
          </div>
        </div>
      </ArtistLayout>
    );
  }

  return (
    <ArtistLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Support Chat</h1>
          <p className="text-gray-400 mt-2">Get help from the Jonna Rincon team</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Conversations Sidebar */}
          <div className="lg:col-span-1 bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-gray-700">
              <h2 className="font-semibold text-white">Conversations</h2>
            </div>
            <div className="overflow-y-auto" style={{ maxHeight: 'calc(100vh - 350px)' }}>
              {conversations.map((convo) => (
                <button
                  key={convo.userId}
                  onClick={() => setSelectedConversation(convo.userId)}
                  className={`w-full p-4 text-left transition border-b border-gray-700 ${
                    selectedConversation === convo.userId
                      ? 'bg-purple-900/30 border-l-4 border-l-purple-500'
                      : 'hover:bg-gray-750'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white font-semibold flex-shrink-0">
                      {convo.userName[0] || 'S'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-semibold text-white text-sm truncate">
                          {convo.userName}
                        </p>
                        <span className="text-xs text-gray-400">
                          {convo.lastMessageTime?.toDate?.()?.toLocaleDateString() || ''}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 truncate">{convo.lastMessage}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Chat Window */}
          <div className="lg:col-span-2 bg-gray-800 border border-gray-700 rounded-xl overflow-hidden flex flex-col" style={{ height: 'calc(100vh - 300px)' }}>
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-700 bg-gray-750">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white font-semibold">
                  {conversations.find((c) => c.userId === selectedConversation)?.userName[0] || 'S'}
                </div>
                <div>
                  <p className="font-semibold text-white">
                    {conversations.find((c) => c.userId === selectedConversation)?.userName || 'Support'}
                  </p>
                  <p className="text-xs text-gray-400">
                    {conversations.find((c) => c.userId === selectedConversation)?.userEmail || ''}
                  </p>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 p-6 overflow-y-auto space-y-4">
              {messages.length === 0 ? (
                <div className="text-center text-gray-400 py-12">
                  <MessageSquare size={48} className="mx-auto mb-4 opacity-50" />
                  <p>No messages yet</p>
                </div>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`p-4 rounded-lg ${
                      msg.senderId === user?.uid
                        ? 'bg-purple-900/30 ml-12'
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
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-purple-900/20 border border-purple-700 rounded-xl p-4">
          <p className="text-sm text-purple-200">
            💬 <strong>Support Hours:</strong> Our team typically responds within 24 hours during business days.
          </p>
        </div>
      </div>
    </ArtistLayout>
  );
};

export default ArtistChat;
