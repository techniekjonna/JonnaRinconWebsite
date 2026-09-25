import React, { useEffect, useMemo, useRef, useState } from 'react';
import { MessageSquare, Send, Check, CheckCheck, Mail, Users as UsersIcon, ArrowLeft, Search, Plus, X } from 'lucide-react';
import { db } from '../../lib/firebase/config';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, Timestamp, updateDoc, doc } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';
import { authService } from '../../lib/firebase/services';
import { User } from '../../lib/firebase/types';

interface ChatMessage {
  id?: string;
  senderId: string;
  senderName: string;
  senderEmail: string;
  senderRole: string;
  category: string;
  recipientId?: string;
  message: string;
  createdAt: Timestamp;
  status: 'sent' | 'delivered' | 'read';
}

interface Conversation {
  id: string; // senderId
  name: string;
  email: string;
  role: string;
  lastMessage: string;
  lastMessageTime: Timestamp;
  unreadCount: number;
  category: string;
}

type Tab = 'contact' | 'users';

interface ChatInboxContentProps {
  role: 'admin' | 'manager';
}

const isStaffRole = (role: string) => role === 'admin' || role === 'manager';

const Avatar: React.FC<{ name: string; role: string; size?: 'sm' | 'md' }> = ({ name, role, size = 'md' }) => {
  const cls = size === 'sm' ? 'w-8 h-8 text-xs' : 'w-10 h-10 text-sm';
  const gradient = role === 'contact'
    ? 'from-red-700 to-neutral-900 border-red-500/20'
    : role === 'artist'
    ? 'from-orange-600 to-red-700 border-white/10'
    : 'from-blue-700 to-cyan-700 border-white/10';
  return (
    <div className={`${cls} rounded-full flex-shrink-0 bg-gradient-to-br ${gradient} border flex items-center justify-center text-white font-bold`}>
      {name[0]?.toUpperCase() || '?'}
    </div>
  );
};

export const ChatInboxContent: React.FC<ChatInboxContentProps> = ({ role }) => {
  const { user } = useAuth();
  const [allMessages, setAllMessages] = useState<ChatMessage[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>('contact');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' && window.innerWidth < 900);

  const [showNewMessageModal, setShowNewMessageModal] = useState(false);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [usersLoaded, setUsersLoaded] = useState(false);
  const [newMsgSearch, setNewMsgSearch] = useState('');
  const [newMsgTarget, setNewMsgTarget] = useState<User | null>(null);
  const [newMsgText, setNewMsgText] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const q = query(collection(db, 'supportMessages'), orderBy('createdAt', 'asc'));
    return onSnapshot(q, (snap) => {
      const msgs: ChatMessage[] = [];
      snap.forEach((d) => {
        const data = d.data();
        msgs.push({
          id: d.id,
          ...data,
          category: data.category || 'General',
          status: data.status || 'sent',
        } as ChatMessage);
      });
      setAllMessages(msgs);
    });
  }, []);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 900);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Build conversation lists: one entry per distinct non-staff sender
  const { contactConversations, userConversations } = useMemo(() => {
    const bySender = new Map<string, ChatMessage[]>();
    allMessages.forEach((m) => {
      if (isStaffRole(m.senderRole)) return; // staff messages are replies, not conversation owners
      if (!bySender.has(m.senderId)) bySender.set(m.senderId, []);
      bySender.get(m.senderId)!.push(m);
    });

    const contact: Conversation[] = [];
    const users: Conversation[] = [];

    bySender.forEach((msgs, senderId) => {
      const last = msgs[msgs.length - 1];
      const allForSender = allMessages.filter((m) => m.senderId === senderId || m.recipientId === senderId);
      const unreadCount = allForSender.filter((m) => !isStaffRole(m.senderRole) && m.status !== 'read').length;
      const entry: Conversation = {
        id: senderId,
        name: last.senderName,
        email: last.senderEmail,
        role: last.senderRole,
        lastMessage: allForSender[allForSender.length - 1]?.message || last.message,
        lastMessageTime: allForSender[allForSender.length - 1]?.createdAt || last.createdAt,
        unreadCount,
        category: last.category,
      };
      if (last.senderRole === 'contact') contact.push(entry);
      else users.push(entry);
    });

    const byRecency = (a: Conversation, b: Conversation) => (b.lastMessageTime?.toMillis?.() || 0) - (a.lastMessageTime?.toMillis?.() || 0);
    return { contactConversations: contact.sort(byRecency), userConversations: users.sort(byRecency) };
  }, [allMessages]);

  const conversations = activeTab === 'contact' ? contactConversations : userConversations;
  const filteredConversations = search
    ? conversations.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()) || c.email.toLowerCase().includes(search.toLowerCase()))
    : conversations;

  const selectedConversation = [...contactConversations, ...userConversations].find((c) => c.id === selectedId) || null;

  const threadMessages = useMemo(() => {
    if (!selectedId) return [];
    return allMessages
      .filter((m) => m.senderId === selectedId || m.recipientId === selectedId)
      .sort((a, b) => (a.createdAt?.toMillis?.() || 0) - (b.createdAt?.toMillis?.() || 0));
  }, [allMessages, selectedId]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [threadMessages]);

  // Mark inbound messages as read when a conversation is opened
  useEffect(() => {
    if (!selectedId) return;
    const unread = threadMessages.filter((m) => !isStaffRole(m.senderRole) && m.status !== 'read');
    unread.forEach((m) => {
      if (m.id) updateDoc(doc(db, 'supportMessages', m.id), { status: 'read' }).catch((err) => console.error(err));
    });
  }, [selectedId, threadMessages]);

  const handleSelectConversation = (id: string) => setSelectedId(id);

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !selectedConversation) return;
    try {
      await addDoc(collection(db, 'supportMessages'), {
        senderId: user.uid,
        senderName: user.displayName || (role === 'admin' ? 'Admin' : 'Manager'),
        senderEmail: user.email,
        senderRole: role,
        recipientId: selectedConversation.id,
        recipientGroup: 'support',
        category: selectedConversation.category || 'General',
        message: newMessage.trim(),
        createdAt: serverTimestamp(),
        status: 'sent',
      });
      setNewMessage('');
    } catch (err) {
      console.error('Failed to send reply:', err);
    }
  };

  const openNewMessageModal = () => {
    setShowNewMessageModal(true);
    if (!usersLoaded) {
      authService.getAllUsers().then((users) => {
        setAllUsers(users.filter((u) => !isStaffRole(u.role)));
        setUsersLoaded(true);
      });
    }
  };

  const closeNewMessageModal = () => {
    setShowNewMessageModal(false);
    setNewMsgSearch('');
    setNewMsgTarget(null);
    setNewMsgText('');
  };

  const handleStartNewMessage = async () => {
    if (!newMsgTarget || !newMsgText.trim() || !user) return;
    try {
      const alreadyExists = userConversations.some((c) => c.id === newMsgTarget.uid);

      await addDoc(collection(db, 'supportMessages'), {
        senderId: user.uid,
        senderName: user.displayName || (role === 'admin' ? 'Admin' : 'Manager'),
        senderEmail: user.email,
        senderRole: role,
        recipientId: newMsgTarget.uid,
        recipientGroup: 'support',
        category: 'General',
        message: newMsgText.trim(),
        createdAt: serverTimestamp(),
        status: 'sent',
      });

      if (!alreadyExists) {
        // A staff-authored message alone won't create a conversation entry
        // (the list is keyed by non-staff senders) — seed a placeholder so
        // this user shows up in the list immediately, even before they reply.
        await addDoc(collection(db, 'supportMessages'), {
          senderId: newMsgTarget.uid,
          senderName: newMsgTarget.displayName || newMsgTarget.email,
          senderEmail: newMsgTarget.email,
          senderRole: newMsgTarget.role,
          category: 'General',
          message: '',
          createdAt: serverTimestamp(),
          status: 'read',
        });
      }

      setActiveTab('users');
      setSelectedId(newMsgTarget.uid);
      closeNewMessageModal();
    } catch (err) {
      console.error('Failed to start new conversation:', err);
    }
  };

  const getStatusIcon = (status: string) => {
    if (status === 'read') return <CheckCheck size={12} className="text-blue-400" />;
    if (status === 'delivered') return <CheckCheck size={12} className="text-white/60" />;
    return <Check size={12} className="text-white/60" />;
  };

  const showListPane = !isMobile || !selectedId;
  const showThreadPane = !isMobile || !!selectedId;

  const filteredNewMsgUsers = allUsers.filter((u) =>
    (u.displayName || '').toLowerCase().includes(newMsgSearch.toLowerCase()) ||
    u.email.toLowerCase().includes(newMsgSearch.toLowerCase())
  );

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 overflow-hidden" style={{ height: 'calc(100dvh - 180px)', maxHeight: 'calc(100dvh - 180px)' }}>

        {/* Left: tabs + conversation list */}
        {showListPane && (
          <div className="md:col-span-4 backdrop-blur-xl bg-gradient-to-b from-white/[0.08] to-white/[0.03] border border-white/[0.12] rounded-xl overflow-hidden flex flex-col">
            <div className="flex items-center gap-2 p-3 border-b border-white/[0.08] flex-shrink-0">
              <button
                onClick={() => { setActiveTab('contact'); setSelectedId(null); }}
                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                  activeTab === 'contact' ? 'bg-red-600 text-white' : 'bg-white/[0.05] text-white/50 hover:text-white'
                }`}
              >
                <Mail size={14} /> Contact
                {contactConversations.some((c) => c.unreadCount > 0) && (
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                )}
              </button>
              <button
                onClick={() => { setActiveTab('users'); setSelectedId(null); }}
                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                  activeTab === 'users' ? 'bg-red-600 text-white' : 'bg-white/[0.05] text-white/50 hover:text-white'
                }`}
              >
                <UsersIcon size={14} /> Users
                {userConversations.some((c) => c.unreadCount > 0) && (
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                )}
              </button>
              {activeTab === 'users' && (
                <button
                  onClick={openNewMessageModal}
                  title="New message"
                  className="p-2 bg-white/[0.06] hover:bg-white/[0.12] rounded-lg text-white/60 hover:text-white transition-colors flex-shrink-0"
                >
                  <Plus size={16} />
                </button>
              )}
            </div>

            <div className="px-3 py-2 border-b border-white/[0.06] flex-shrink-0">
              <div className="relative">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search..."
                  className="w-full pl-8 pr-3 py-1.5 bg-white/[0.06] border border-white/[0.1] rounded-lg text-xs text-white placeholder-white/30 focus:outline-none focus:border-white/[0.2]"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {filteredConversations.length === 0 ? (
                <div className="py-10 text-center text-white/30">
                  <MessageSquare size={24} className="mx-auto mb-2 opacity-40" />
                  <p className="text-xs">{activeTab === 'contact' ? 'No contact messages' : 'No user messages'}</p>
                </div>
              ) : (
                filteredConversations.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => handleSelectConversation(c.id)}
                    className={`w-full px-3 py-3 text-left transition-all border-b border-white/[0.04] flex items-center gap-3 ${
                      selectedId === c.id ? 'bg-white/[0.08]' : 'hover:bg-white/[0.04]'
                    }`}
                  >
                    <Avatar name={c.name} role={c.role} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-semibold text-white truncate">{c.name}</p>
                        <span className="text-[9px] px-1.5 py-0.5 bg-white/[0.06] border border-white/[0.08] rounded-full text-white/40 uppercase tracking-wide flex-shrink-0">{c.category}</span>
                      </div>
                      <p className="text-[10px] text-white/40 truncate mt-0.5">{c.lastMessage || 'No messages yet'}</p>
                    </div>
                    {c.unreadCount > 0 && (
                      <div className="w-5 h-5 rounded-full bg-red-600 flex items-center justify-center flex-shrink-0">
                        <span className="text-[10px] text-white font-bold">{c.unreadCount}</span>
                      </div>
                    )}
                  </button>
                ))
              )}
            </div>
          </div>
        )}

        {/* Right: thread */}
        {showThreadPane && selectedConversation ? (
          <div className="md:col-span-8 backdrop-blur-xl bg-gradient-to-br from-white/[0.08] to-white/[0.03] border border-white/[0.12] rounded-xl overflow-hidden flex flex-col">
            <div className="px-4 py-3 border-b border-white/[0.08] flex items-center gap-3 flex-shrink-0 bg-white/[0.04]">
              {isMobile && (
                <button onClick={() => setSelectedId(null)} className="text-white/40 hover:text-white transition-colors">
                  <ArrowLeft size={18} />
                </button>
              )}
              <Avatar name={selectedConversation.name} role={selectedConversation.role} size="sm" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-white text-sm truncate">{selectedConversation.name}</p>
                <p className="text-[11px] text-white/40 truncate">{selectedConversation.email}</p>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
              {threadMessages.filter((m) => m.message).length === 0 ? (
                <div className="text-center text-white/30 py-16"><MessageSquare size={32} className="mx-auto mb-3 opacity-30" /><p className="text-sm">No messages yet</p></div>
              ) : threadMessages.filter((m) => m.message).map((msg) => (
                <div key={msg.id} className={`flex ${isStaffRole(msg.senderRole) ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-sm px-3 py-2 rounded-xl text-sm ${isStaffRole(msg.senderRole) ? 'bg-red-600 text-white rounded-br-sm' : 'bg-white/[0.1] text-white rounded-bl-sm border border-white/[0.1]'}`}>
                    {!isStaffRole(msg.senderRole) && <p className="text-[10px] font-semibold text-white/60 mb-1">{msg.senderName}</p>}
                    <p className="break-words leading-relaxed whitespace-pre-wrap">{msg.message}</p>
                    <div className="flex items-center gap-1 mt-1 justify-end">
                      <span className="text-[10px] opacity-60">{msg.createdAt?.toDate?.()?.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}</span>
                      {isStaffRole(msg.senderRole) && getStatusIcon(msg.status)}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            <form onSubmit={handleSendReply} className="px-4 py-3 border-t border-white/[0.08] bg-white/[0.03] flex-shrink-0">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder={`Reply to ${selectedConversation.name}...`}
                  className="flex-1 bg-white/[0.06] border border-white/[0.12] rounded-full px-4 py-2 text-white placeholder-white/30 focus:outline-none focus:border-white/[0.25] text-sm"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="w-9 h-9 bg-red-600 hover:bg-red-700 disabled:bg-white/[0.06] text-white rounded-full transition flex items-center justify-center flex-shrink-0"
                >
                  <Send size={16} />
                </button>
              </div>
            </form>
          </div>
        ) : showThreadPane ? (
          <div className="md:col-span-8 backdrop-blur-xl bg-gradient-to-br from-white/[0.08] to-white/[0.03] border border-white/[0.12] rounded-xl flex items-center justify-center">
            <div className="text-center">
              <MessageSquare size={40} className="mx-auto mb-3 text-white/10" />
              <p className="text-white/30 text-sm">Select a conversation</p>
            </div>
          </div>
        ) : null}
      </div>

      {/* New Message Modal */}
      {showNewMessageModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-black/95 border border-white/[0.12] rounded-2xl p-6 max-w-md w-full max-h-[28rem] flex flex-col shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">New Message</h3>
              <button onClick={closeNewMessageModal} className="text-white/40 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>

            {!newMsgTarget ? (
              <>
                <div className="relative mb-4 flex-shrink-0">
                  <Search size={14} className="absolute left-3 top-3 text-white/30" />
                  <input
                    type="text"
                    value={newMsgSearch}
                    onChange={(e) => setNewMsgSearch(e.target.value)}
                    placeholder="Search users by name or email..."
                    className="w-full pl-10 pr-3 py-2 bg-white/[0.06] border border-white/[0.1] rounded-lg text-sm text-white placeholder-white/30 focus:outline-none focus:border-white/[0.2]"
                  />
                </div>
                <div className="flex-1 overflow-y-auto space-y-2 min-h-0">
                  {!usersLoaded ? (
                    <p className="text-center text-white/30 text-sm py-8">Loading users...</p>
                  ) : filteredNewMsgUsers.length === 0 ? (
                    <p className="text-center text-white/30 text-sm py-8">No users found</p>
                  ) : (
                    filteredNewMsgUsers.map((u) => (
                      <button
                        key={u.uid}
                        onClick={() => setNewMsgTarget(u)}
                        className="w-full p-3 rounded-lg bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.08] text-left transition-colors flex items-center gap-3"
                      >
                        <Avatar name={u.displayName || u.email} role={u.role} size="sm" />
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-white truncate">{u.displayName || u.email}</p>
                          <p className="text-xs text-white/40 truncate">{u.email}</p>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </>
            ) : (
              <>
                <div className="mb-4 p-3 rounded-lg bg-white/[0.05] border border-white/[0.08] flex items-center justify-between flex-shrink-0">
                  <div className="flex items-center gap-3">
                    <Avatar name={newMsgTarget.displayName || newMsgTarget.email} role={newMsgTarget.role} size="sm" />
                    <div>
                      <p className="text-sm font-semibold text-white">{newMsgTarget.displayName || newMsgTarget.email}</p>
                      <p className="text-xs text-white/40">{newMsgTarget.email}</p>
                    </div>
                  </div>
                  <button onClick={() => setNewMsgTarget(null)} className="text-white/40 hover:text-white transition-colors">
                    <X size={16} />
                  </button>
                </div>
                <textarea
                  rows={5}
                  value={newMsgText}
                  onChange={(e) => setNewMsgText(e.target.value)}
                  placeholder="Type your message..."
                  className="w-full flex-1 px-4 py-3 bg-white/[0.06] border border-white/[0.1] rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-white/[0.2] text-sm resize-none min-h-0"
                />
                <button
                  onClick={handleStartNewMessage}
                  disabled={!newMsgText.trim()}
                  className="mt-4 w-full px-4 py-3 rounded-lg bg-red-600 hover:bg-red-700 disabled:bg-white/[0.06] disabled:text-white/40 text-white transition-colors text-sm font-medium flex items-center justify-center gap-2 flex-shrink-0"
                >
                  <Send size={15} /> Send
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default ChatInboxContent;
