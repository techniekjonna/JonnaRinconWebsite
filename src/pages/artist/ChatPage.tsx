import React, { useState, useEffect, useRef } from 'react';
import ArtistLayout from '../../components/artist/ArtistLayout';
import { MessageSquare, Send, Plus, Check, CheckCheck, Info, Briefcase, Headphones, ArrowLeft, Edit2, X } from 'lucide-react';
import { db } from '../../lib/firebase/config';
import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp, Timestamp, or, updateDoc, doc } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';

interface ChatMessage {
  id?: string;
  senderId: string;
  senderName: string;
  senderEmail: string;
  senderRole: string;
  category: string;
  recipientGroup: 'jonna' | 'manager' | 'support' | 'private';
  recipientId?: string;
  message: string;
  createdAt: Timestamp;
  status: 'sent' | 'delivered' | 'read';
}

interface ChatThread {
  id: string;
  category: string;
  lastMessage: string;
  lastMessageTime: Timestamp;
}

type RecipientGroup = 'jonna' | 'manager' | 'support' | 'private';
type LeftView = 'contacts' | 'threads';

const recipientGroups: Record<RecipientGroup, { name: string; description: string }> = {
  jonna: {
    name: 'Jonna Rincon',
    description: 'Direct contact — artiest is veel bezig, verwacht geen snel antwoord!',
  },
  manager: {
    name: 'Manager',
    description: 'Business inquiries, collaborations & partnerships',
  },
  support: {
    name: 'Support Team',
    description: 'Questions, help and support',
  },
  private: {
    name: 'Privé',
    description: 'Privé chats met admins',
  },
};

const categoryOptions: Record<string, string[]> = {
  CATALOGUE: ['Tracks', 'Remixes', 'Support'],
  SHOP: ['Beats', 'Services', 'Merchandise', 'Art'],
  'SOCIAL MEDIA': ['Content', 'Collaboration'],
  DASHBOARD: ['Orders', 'Downloads'],
  SUPPORT: ['Support', 'Overig'],
};

const ContactAvatar = ({ group, size = 'md' }: { group: RecipientGroup; size?: 'sm' | 'md' }) => {
  const cls = size === 'sm' ? 'w-9 h-9' : 'w-12 h-12';
  if (group === 'jonna') {
    return (
      <div className={`${cls} rounded-full overflow-hidden flex-shrink-0 border-2 border-white/20`}>
        <img src="/JEIGHTENESIS.jpg" alt="Jonna Rincon" className="w-full h-full object-cover object-top" />
      </div>
    );
  }
  if (group === 'manager') {
    return (
      <div className={`${cls} rounded-full flex-shrink-0 bg-gradient-to-br from-neutral-700 to-neutral-900 border border-white/10 flex items-center justify-center`}>
        <Briefcase size={size === 'sm' ? 16 : 20} className="text-white/70" />
      </div>
    );
  }
  return (
    <div className={`${cls} rounded-full flex-shrink-0 bg-gradient-to-br from-red-900/60 to-neutral-900 border border-red-500/20 flex items-center justify-center`}>
      <Headphones size={size === 'sm' ? 16 : 20} className="text-red-400/80" />
    </div>
  );
};

const ArtistChat: React.FC = () => {
  const { user } = useAuth();
  const [leftView, setLeftView] = useState<LeftView>('contacts');
  const [selectedGroup, setSelectedGroup] = useState<RecipientGroup>('support');
  const [selectedThread, setSelectedThread] = useState<string | null>(null);
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [allMessages, setAllMessages] = useState<ChatMessage[]>([]);
  const [tooltipOpen, setTooltipOpen] = useState<RecipientGroup | null>(null);
  const [showPrivateChatModal, setShowPrivateChatModal] = useState(false);
  const [editingThreadTitle, setEditingThreadTitle] = useState<string | null>(null);
  const [editingThreadValue, setEditingThreadValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'supportMessages'),
      or(where('senderId', '==', user.uid), where('recipientId', '==', user.uid)),
      orderBy('createdAt', 'asc')
    );
    return onSnapshot(q, (snap) => {
      const msgs: ChatMessage[] = [];
      snap.forEach((doc) => {
        const d = doc.data();
        msgs.push({ id: doc.id, ...d, category: d.category || 'General', recipientGroup: d.recipientGroup || 'support', status: d.status || 'sent' } as ChatMessage);
      });
      setAllMessages(msgs);
    });
  }, [user]);

  useEffect(() => {
    const groupMsgs = allMessages.filter((m) => m.recipientGroup === selectedGroup);
    const map = new Map<string, ChatThread>();
    groupMsgs.forEach((m) => {
      const existing = map.get(m.category);
      if (!existing || (m.createdAt?.toMillis?.() || 0) > (existing.lastMessageTime?.toMillis?.() || 0)) {
        map.set(m.category, { id: m.category, category: m.category, lastMessage: m.message, lastMessageTime: m.createdAt });
      }
    });
    setThreads(Array.from(map.values()).sort((a, b) => (b.lastMessageTime?.toMillis?.() || 0) - (a.lastMessageTime?.toMillis?.() || 0)));
  }, [allMessages, selectedGroup]);

  useEffect(() => {
    if (!selectedThread) { setMessages([]); return; }
    setMessages(allMessages.filter((m) => m.category === selectedThread && m.recipientGroup === selectedGroup));
  }, [selectedThread, selectedGroup, allMessages]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) setShowCategoryPicker(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const handleContactClick = (group: RecipientGroup) => {
    setSelectedGroup(group);
    setSelectedThread(null);
    setTooltipOpen(null);
    setLeftView('threads');
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !selectedThread) return;
    try {
      await addDoc(collection(db, 'supportMessages'), {
        senderId: user.uid,
        senderName: user.displayName || 'Artist',
        senderEmail: user.email,
        senderRole: 'artist',
        recipientGroup: selectedGroup,
        category: selectedThread,
        message: newMessage.trim(),
        createdAt: serverTimestamp(),
        status: 'sent',
      });
      setNewMessage('');
    } catch (err) { console.error(err); }
  };

  const startPrivateChat = async (adminName: string) => {
    if (!user) return;
    try {
      const timestamp = serverTimestamp();
      await addDoc(collection(db, 'supportMessages'), {
        senderId: user.uid,
        senderName: user.displayName || 'Artist',
        senderEmail: user.email,
        senderRole: 'artist',
        recipientGroup: 'private',
        recipientId: adminName,
        category: `chat-${user.uid}-${adminName}`,
        message: '👋',
        createdAt: timestamp,
        status: 'sent',
      });
      setSelectedGroup('private');
      setSelectedThread(`chat-${user.uid}-${adminName}`);
      setLeftView('threads');
      setShowPrivateChatModal(false);
    } catch (err) { console.error(err); }
  };

  const updateThreadTitle = async (oldTitle: string, newTitle: string) => {
    if (!newTitle.trim() || !user) return;
    try {
      const q = query(collection(db, 'supportMessages'), where('category', '==', oldTitle));
      const snap = await onSnapshot(q, async (snapshot) => {
        for (const docSnap of snapshot.docs) {
          await updateDoc(doc(db, 'supportMessages', docSnap.id), { category: newTitle.trim() });
        }
      });
      setEditingThreadTitle(null);
      setSelectedThread(newTitle.trim());
    } catch (err) { console.error(err); }
  };

  const getStatusIcon = (status: string) => {
    if (status === 'read') return <CheckCheck size={12} className="text-blue-400" />;
    if (status === 'delivered') return <CheckCheck size={12} className="text-white/60" />;
    return <Check size={12} className="text-white/60" />;
  };

  return (
    <ArtistLayout>
      <div className="grid grid-cols-12 h-[calc(100vh-120px)] gap-3">

        {/* Left panel */}
        <div className="col-span-4 backdrop-blur-xl bg-gradient-to-b from-white/[0.08] to-white/[0.03] border border-white/[0.12] rounded-xl overflow-hidden flex flex-col">

          {leftView === 'contacts' && (
            <>
              <div className="p-4 border-b border-white/[0.08] flex-shrink-0">
                <p className="text-[10px] text-white/40 uppercase tracking-widest font-semibold">Kies een contact</p>
              </div>
              <div className="flex-1 overflow-y-auto py-3 px-3 space-y-2">
                {(Object.entries(recipientGroups) as [RecipientGroup, any][]).map(([key, group]) => (
                  <div key={key} className="relative">
                    <button
                      onClick={() => handleContactClick(key)}
                      className="w-full p-3 rounded-xl text-left transition-all flex items-center gap-4 hover:bg-white/[0.06] border border-transparent hover:border-white/[0.08] group"
                    >
                      <ContactAvatar group={key} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white">{group.name}</p>
                        <p className="text-[11px] text-white/40 mt-0.5 truncate">{group.description}</p>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); setTooltipOpen(tooltipOpen === key ? null : key); }}
                        className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Info size={14} className="text-white/40 hover:text-white/70" />
                      </button>
                    </button>
                    {tooltipOpen === key && (
                      <div className="absolute left-full top-0 ml-2 z-50 w-52 bg-black/90 backdrop-blur-xl border border-white/[0.15] rounded-xl p-3 shadow-2xl">
                        <p className="text-xs font-semibold text-white mb-1">{group.name}</p>
                        <p className="text-[11px] text-white/60 leading-relaxed">{group.description}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}

          {leftView === 'threads' && (
            <>
              <div className="p-3 border-b border-white/[0.08] flex items-center gap-3 flex-shrink-0">
                <button onClick={() => { setLeftView('contacts'); setSelectedThread(null); }} className="text-white/40 hover:text-white transition-colors">
                  <ArrowLeft size={18} />
                </button>
                <ContactAvatar group={selectedGroup} size="sm" />
                <p className="text-sm font-semibold text-white flex-1 truncate">{recipientGroups[selectedGroup].name}</p>
                <div className="relative" ref={pickerRef}>
                  <button onClick={() => {
                      if (selectedGroup === 'private') {
                        setShowPrivateChatModal(true);
                      } else {
                        setShowCategoryPicker(!showCategoryPicker);
                      }
                    }}
                    className="w-7 h-7 rounded-full bg-red-600/20 hover:bg-red-600/40 border border-red-600/30 flex items-center justify-center transition-colors">
                    <Plus size={14} className="text-red-400" />
                  </button>
                  {showCategoryPicker && selectedGroup !== 'private' && (
                    <div className="absolute top-full right-0 mt-2 bg-black/95 backdrop-blur-xl border border-white/[0.15] rounded-xl p-2 z-50 w-44 shadow-2xl">
                      {Object.entries(categoryOptions).map(([grp, items]) => (
                        <div key={grp}>
                          <p className="text-[10px] text-white/30 px-2 py-1.5 font-semibold uppercase tracking-widest">{grp}</p>
                          {items.map((item) => (
                            <button key={item} onClick={() => { setSelectedThread(item); setShowCategoryPicker(false); }}
                              className="block w-full text-left px-2 py-1.5 text-xs text-white/80 hover:text-white hover:bg-white/[0.08] rounded-lg transition">
                              {item}
                            </button>
                          ))}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex-1 overflow-y-auto">
                {threads.length === 0 ? (
                  <div className="py-12 text-center text-white/30">
                    <MessageSquare size={24} className="mx-auto mb-3 opacity-40" />
                    <p className="text-[11px] font-semibold uppercase tracking-widest leading-relaxed">Start een<br />nieuwe chat</p>
                  </div>
                ) : (
                  <div className="py-1">
                    {threads.map((thread) => (
                      <button key={thread.id} onClick={() => setSelectedThread(thread.id)}
                        className={`w-full px-4 py-3 text-left transition-all border-b border-white/[0.04] flex items-center gap-3 ${selectedThread === thread.id ? 'bg-white/[0.08]' : 'hover:bg-white/[0.04]'}`}>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-white truncate">{thread.category}</p>
                          <p className="text-[11px] text-white/40 truncate mt-0.5">{thread.lastMessage}</p>
                        </div>
                        {selectedThread === thread.id && <div className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Right panel: chat */}
        {selectedThread ? (
          <div className="col-span-8 backdrop-blur-xl bg-gradient-to-br from-white/[0.08] to-white/[0.03] border border-white/[0.12] rounded-xl overflow-hidden flex flex-col">
            <div className="px-4 py-3 border-b border-white/[0.08] flex items-center gap-3 flex-shrink-0 bg-white/[0.04]">
              <ContactAvatar group={selectedGroup} size="sm" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-white text-sm">{recipientGroups[selectedGroup].name}</p>
                {editingThreadTitle === selectedThread ? (
                  <div className="flex gap-1 mt-1">
                    <input
                      type="text"
                      value={editingThreadValue}
                      onChange={(e) => setEditingThreadValue(e.target.value)}
                      className="flex-1 px-2 py-1 rounded text-xs bg-white/[0.08] border border-white/[0.12] text-white focus:outline-none focus:border-red-500/40"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') updateThreadTitle(selectedThread, editingThreadValue);
                        if (e.key === 'Escape') setEditingThreadTitle(null);
                      }}
                    />
                    <button
                      onClick={() => setEditingThreadTitle(null)}
                      className="p-1 text-white/40 hover:text-white"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <p className="text-[11px] text-white/40 flex items-center gap-1 group">
                    {selectedThread}
                    {selectedGroup === 'private' && (
                      <button
                        onClick={() => {
                          setEditingThreadTitle(selectedThread);
                          setEditingThreadValue(selectedThread);
                        }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5"
                        title="Edit title"
                      >
                        <Edit2 size={11} className="text-white/30 hover:text-white/60" />
                      </button>
                    )}
                  </p>
                )}
              </div>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
              {messages.length === 0 ? (
                <div className="text-center text-white/30 py-16">
                  <MessageSquare size={32} className="mx-auto mb-3 opacity-30" />
                  <p className="text-sm">Start the conversation</p>
                </div>
              ) : (
                messages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.senderId === user?.uid ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-sm px-3 py-2 rounded-xl text-sm ${msg.senderId === user?.uid ? 'bg-red-600 text-white rounded-br-sm' : 'bg-white/[0.1] text-white rounded-bl-sm border border-white/[0.1]'}`}>
                      <p className="break-words leading-relaxed">{msg.message}</p>
                      <div className="flex items-center gap-1 mt-1 justify-end">
                        <span className="text-[10px] opacity-60">{msg.createdAt?.toDate?.()?.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}</span>
                        {msg.senderId === user?.uid && getStatusIcon(msg.status)}
                      </div>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>
            <form onSubmit={handleSendMessage} className="px-4 py-3 border-t border-white/[0.08] bg-white/[0.03] flex-shrink-0">
              <div className="flex gap-2">
                <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage(e as any)}
                  placeholder="Type a message..."
                  className="flex-1 bg-white/[0.06] border border-white/[0.12] rounded-full px-4 py-2 text-white placeholder-white/30 focus:outline-none focus:border-white/[0.25] text-sm" />
                <button type="submit" disabled={!newMessage.trim()}
                  className="w-9 h-9 bg-red-600 hover:bg-red-700 disabled:bg-white/[0.06] text-white rounded-full transition flex items-center justify-center flex-shrink-0">
                  <Send size={16} />
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="col-span-8 backdrop-blur-xl bg-gradient-to-br from-white/[0.08] to-white/[0.03] border border-white/[0.12] rounded-xl flex items-center justify-center">
            <div className="text-center">
              <MessageSquare size={40} className="mx-auto mb-3 text-white/10" />
              <p className="text-white/30 text-sm">{leftView === 'contacts' ? 'Kies een contact om te chatten' : 'Kies een chat of start een nieuwe'}</p>
            </div>
          </div>
        )}

        {/* Private Chat Modal */}
        {showPrivateChatModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowPrivateChatModal(false)} />
            <div className="relative bg-black border border-white/[0.08] rounded-2xl w-full max-w-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white">Kies een admin</h3>
                <button onClick={() => setShowPrivateChatModal(false)} className="text-white/40 hover:text-white">
                  <X size={20} />
                </button>
              </div>
              <div className="space-y-2">
                {['Admin', 'Support Team'].map((admin) => (
                  <button
                    key={admin}
                    onClick={() => startPrivateChat(admin)}
                    className="w-full px-4 py-3 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.08] text-white text-left transition-all"
                  >
                    <p className="font-semibold">{admin}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </ArtistLayout>
  );
};

export default ArtistChat;
