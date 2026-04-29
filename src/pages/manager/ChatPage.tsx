import React, { useState, useEffect, useRef } from 'react';
import ManagerLayout from '../../components/manager/ManagerLayout';
import { MessageSquare, Send, Check, CheckCheck, Briefcase, Headphones, ArrowLeft, Search, SlidersHorizontal, ChevronDown, Plus, X, Edit2 } from 'lucide-react';
import { db } from '../../lib/firebase/config';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, Timestamp, where, updateDoc, doc } from 'firebase/firestore';
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

interface UserEntry {
  userId: string;
  userName: string;
  userEmail: string;
  userRole: string;
  lastMessage: string;
  lastMessageTime: Timestamp;
  categories: string[];
}

interface ChatThread {
  id: string;
  category: string;
  lastMessage: string;
  lastMessageTime: Timestamp;
}

type RecipientGroup = 'manager' | 'support' | 'private';
type LeftView = 'contacts' | 'users' | 'threads';
type SortOrder = 'newest' | 'oldest';
type CategoryFilter = 'all' | 'CATALOGUE' | 'SHOP' | 'SOCIAL MEDIA' | 'DASHBOARD';

const contactDefs: Record<RecipientGroup, { name: string; description: string }> = {
  manager: { name: 'Manager', description: 'Business inquiries & samenwerking' },
  support: { name: 'Support Team', description: 'Vragen, hulp en ondersteuning' },
  private: { name: 'Privé', description: 'Privé chats' },
};

const categoryGroups: Record<string, string[]> = {
  CATALOGUE: ['Tracks', 'Remixes', 'Support'],
  SHOP: ['Beats', 'Services', 'Merchandise', 'Art'],
  'SOCIAL MEDIA': ['Content', 'Collaboration'],
  DASHBOARD: ['Orders', 'Downloads'],
  SUPPORT: ['Support', 'Overig'],
};

const getCategoryGroup = (category: string): string => {
  for (const [group, items] of Object.entries(categoryGroups)) {
    if (items.includes(category)) return group;
  }
  return 'OVERIG';
};

const ContactAvatar = ({ group, size = 'md' }: { group: RecipientGroup; size?: 'sm' | 'md' }) => {
  const cls = size === 'sm' ? 'w-8 h-8' : 'w-10 h-10';
  if (group === 'manager') return (
    <div className={`${cls} rounded-full flex-shrink-0 bg-gradient-to-br from-neutral-700 to-neutral-900 border border-white/10 flex items-center justify-center`}>
      <Briefcase size={size === 'sm' ? 14 : 18} className="text-white/70" />
    </div>
  );
  return (
    <div className={`${cls} rounded-full flex-shrink-0 bg-gradient-to-br from-red-900/60 to-neutral-900 border border-red-500/20 flex items-center justify-center`}>
      <Headphones size={size === 'sm' ? 14 : 18} className="text-red-400/80" />
    </div>
  );
};

const ManagerChat: React.FC = () => {
  const { user } = useAuth();
  const [allMessages, setAllMessages] = useState<ChatMessage[]>([]);
  const [leftView, setLeftView] = useState<LeftView>('contacts');
  const [selectedGroup, setSelectedGroup] = useState<RecipientGroup | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedThread, setSelectedThread] = useState<string | null>(null);
  const [users, setUsers] = useState<UserEntry[]>([]);
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [showFilter, setShowFilter] = useState(false);
  const [showPrivateChatModal, setShowPrivateChatModal] = useState(false);
  const [editingThreadTitle, setEditingThreadTitle] = useState<string | null>(null);
  const [editingThreadValue, setEditingThreadValue] = useState('');
  const filterRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const q = query(collection(db, 'supportMessages'), orderBy('createdAt', 'asc'));
    return onSnapshot(q, (snap) => {
      const msgs: ChatMessage[] = [];
      snap.forEach((doc) => {
        const d = doc.data();
        msgs.push({ id: doc.id, ...d, category: d.category || 'General', recipientGroup: d.recipientGroup || 'support', status: d.status || 'sent' } as ChatMessage);
      });
      setAllMessages(msgs);
    });
  }, []);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (filterRef.current && !filterRef.current.contains(e.target as Node)) setShowFilter(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  useEffect(() => {
    if (!selectedGroup) return;
    const groupMsgs = allMessages.filter((m) => m.recipientGroup === selectedGroup && m.senderRole !== 'admin' && m.senderRole !== 'manager');
    const map = new Map<string, UserEntry>();
    groupMsgs.forEach((m) => {
      const existing = map.get(m.senderId);
      const userCats = [...new Set(groupMsgs.filter(x => x.senderId === m.senderId).map(x => x.category))];
      if (!existing || (m.createdAt?.toMillis?.() || 0) > (existing.lastMessageTime?.toMillis?.() || 0)) {
        map.set(m.senderId, { userId: m.senderId, userName: m.senderName, userEmail: m.senderEmail, userRole: m.senderRole, lastMessage: m.message, lastMessageTime: m.createdAt, categories: userCats });
      } else {
        existing.categories = userCats;
      }
    });
    setUsers(Array.from(map.values()));
  }, [allMessages, selectedGroup]);

  useEffect(() => {
    if (!selectedUserId || !selectedGroup) { setThreads([]); return; }
    const userMsgs = allMessages.filter((m) => m.recipientGroup === selectedGroup && (m.senderId === selectedUserId || m.recipientId === selectedUserId));
    const map = new Map<string, ChatThread>();
    userMsgs.forEach((m) => {
      const existing = map.get(m.category);
      if (!existing || (m.createdAt?.toMillis?.() || 0) > (existing.lastMessageTime?.toMillis?.() || 0)) {
        map.set(m.category, { id: m.category, category: m.category, lastMessage: m.message, lastMessageTime: m.createdAt });
      }
    });
    setThreads(Array.from(map.values()).sort((a, b) => (b.lastMessageTime?.toMillis?.() || 0) - (a.lastMessageTime?.toMillis?.() || 0)));
  }, [allMessages, selectedUserId, selectedGroup]);

  useEffect(() => {
    if (!selectedThread || !selectedUserId || !selectedGroup) { setMessages([]); return; }
    setMessages(allMessages.filter((m) => m.category === selectedThread && m.recipientGroup === selectedGroup && (m.senderId === selectedUserId || m.recipientId === selectedUserId || m.senderRole === 'admin' || m.senderRole === 'manager')).sort((a, b) => (a.createdAt?.toMillis?.() || 0) - (b.createdAt?.toMillis?.() || 0)));
  }, [selectedThread, selectedUserId, selectedGroup, allMessages]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !selectedUserId || !selectedThread || !selectedGroup) return;
    try {
      await addDoc(collection(db, 'supportMessages'), {
        senderId: user.uid, senderName: user.displayName || 'Manager', senderEmail: user.email, senderRole: 'manager',
        recipientId: selectedUserId, recipientGroup: selectedGroup, category: selectedThread,
        message: newMessage.trim(), createdAt: serverTimestamp(), status: 'sent',
      });
      setNewMessage('');
    } catch (err) { console.error(err); }
  };

  const startPrivateChat = async (adminName: string) => {
    if (!user) return;
    try {
      await addDoc(collection(db, 'supportMessages'), {
        senderId: user.uid,
        senderName: user.displayName || 'Manager',
        senderEmail: user.email,
        senderRole: 'manager',
        recipientGroup: 'private',
        recipientId: adminName,
        category: `chat-${user.uid}-${adminName}`,
        message: '👋',
        createdAt: serverTimestamp(),
        status: 'sent',
      });
      setSelectedGroup('private');
      setSelectedUserId(adminName);
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

  const getRoleColor = (role: string) => {
    if (role === 'artist') return 'from-orange-600 to-red-700';
    return 'from-blue-700 to-cyan-700';
  };

  const getFilteredUsers = () => {
    let result = [...users];
    if (userSearch) result = result.filter((u) => u.userName.toLowerCase().includes(userSearch.toLowerCase()) || u.userEmail.toLowerCase().includes(userSearch.toLowerCase()));
    if (categoryFilter !== 'all') {
      const allowedCats = categoryGroups[categoryFilter] || [];
      result = result.filter((u) => u.categories.some((c) => allowedCats.includes(c)));
    }
    result.sort((a, b) => {
      const diff = (a.lastMessageTime?.toMillis?.() || 0) - (b.lastMessageTime?.toMillis?.() || 0);
      return sortOrder === 'newest' ? -diff : diff;
    });
    return result;
  };

  const getGroupedUsers = (userList: UserEntry[]) => {
    if (categoryFilter !== 'all') return { [categoryFilter]: userList };
    const grouped: Record<string, UserEntry[]> = {};
    userList.forEach((u) => {
      const primaryGroup = u.categories.length > 0 ? getCategoryGroup(u.categories[0]) : 'OVERIG';
      if (!grouped[primaryGroup]) grouped[primaryGroup] = [];
      grouped[primaryGroup].push(u);
    });
    return grouped;
  };

  const filteredUsers = getFilteredUsers();
  const groupedUsers = getGroupedUsers(filteredUsers);
  const groupOrder = ['CATALOGUE', 'SHOP', 'SOCIAL MEDIA', 'DASHBOARD', 'OVERIG'];
  const selectedUserEntry = users.find((u) => u.userId === selectedUserId);

  return (
    <ManagerLayout>
      <div className="grid grid-cols-12 h-[calc(100vh-120px)] gap-3">

        <div className="col-span-4 backdrop-blur-xl bg-gradient-to-b from-white/[0.08] to-white/[0.03] border border-white/[0.12] rounded-xl overflow-hidden flex flex-col">

          {leftView === 'contacts' && (
            <>
              <div className="p-4 border-b border-white/[0.08] flex-shrink-0">
                <p className="text-[10px] text-white/40 uppercase tracking-widest font-semibold">Inbox overzicht</p>
              </div>
              <div className="flex-1 overflow-y-auto py-3 px-3 space-y-2">
                {(Object.entries(contactDefs) as [RecipientGroup, any][]).map(([key, def]) => {
                  const contactMsgs = allMessages.filter(m => m.recipientGroup === key && m.senderRole !== 'admin' && m.senderRole !== 'manager');
                  const uniqueUsers = new Set(contactMsgs.map(m => m.senderId)).size;
                  const cats = [...new Set(contactMsgs.map(m => getCategoryGroup(m.category)))].filter(g => g !== 'OVERIG');
                  return (
                    <button key={key} onClick={() => { setSelectedGroup(key); setSelectedUserId(null); setSelectedThread(null); setCategoryFilter('all'); setUserSearch(''); setLeftView('users'); }}
                      className="w-full p-3 rounded-xl text-left transition-all flex items-center gap-4 hover:bg-white/[0.06] border border-transparent hover:border-white/[0.08]">
                      <ContactAvatar group={key} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white">{def.name}</p>
                        <p className="text-[11px] text-white/40 mt-0.5">{uniqueUsers} gebruiker{uniqueUsers !== 1 ? 's' : ''}</p>
                        {cats.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {cats.slice(0, 3).map((g) => (
                              <span key={g} className="text-[9px] px-1.5 py-0.5 bg-white/[0.06] border border-white/[0.1] rounded-full text-white/50 uppercase tracking-wide">{g}</span>
                            ))}
                          </div>
                        )}
                      </div>
                      {uniqueUsers > 0 && (
                        <div className="w-5 h-5 rounded-full bg-red-600 flex items-center justify-center flex-shrink-0">
                          <span className="text-[10px] text-white font-bold">{uniqueUsers}</span>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {leftView === 'users' && selectedGroup && (
            <>
              <div className="p-3 border-b border-white/[0.08] flex items-center gap-3 flex-shrink-0">
                <button onClick={() => { setLeftView('contacts'); setSelectedUserId(null); setSelectedThread(null); }} className="text-white/40 hover:text-white transition-colors">
                  <ArrowLeft size={18} />
                </button>
                <ContactAvatar group={selectedGroup} size="sm" />
                <p className="text-sm font-semibold text-white flex-1 truncate">{contactDefs[selectedGroup].name}</p>
              </div>

              {/* Search + Filter */}
              <div className="px-3 py-2 border-b border-white/[0.06] flex gap-2 flex-shrink-0">
                <div className="relative flex-1">
                  <Search size={13} className="absolute left-3 top-2.5 text-white/30" />
                  <input type="text" value={userSearch} onChange={(e) => setUserSearch(e.target.value)} placeholder="Zoek gebruiker..."
                    className="w-full pl-8 pr-3 py-1.5 bg-white/[0.06] border border-white/[0.1] rounded-lg text-xs text-white placeholder-white/30 focus:outline-none focus:border-white/[0.2]" />
                </div>
                <div className="relative" ref={filterRef}>
                  <button onClick={() => setShowFilter(!showFilter)}
                    className={`h-full px-2.5 rounded-lg border transition-colors flex items-center gap-1.5 text-xs ${showFilter || categoryFilter !== 'all' || sortOrder !== 'newest' ? 'bg-red-600/20 border-red-600/40 text-red-400' : 'bg-white/[0.06] border-white/[0.1] text-white/50 hover:text-white/80'}`}>
                    <SlidersHorizontal size={13} />
                    <ChevronDown size={11} className={`transition-transform ${showFilter ? 'rotate-180' : ''}`} />
                  </button>
                  {showFilter && (
                    <div className="absolute top-full right-0 mt-1.5 bg-black/95 backdrop-blur-xl border border-white/[0.15] rounded-xl p-3 z-50 w-44 shadow-2xl space-y-3">
                      <div>
                        <p className="text-[10px] text-white/30 uppercase tracking-widest mb-1.5 font-semibold">Volgorde</p>
                        {(['newest', 'oldest'] as SortOrder[]).map((s) => (
                          <button key={s} onClick={() => setSortOrder(s)}
                            className={`block w-full text-left px-2 py-1.5 text-xs rounded-lg transition ${sortOrder === s ? 'text-white bg-white/[0.08]' : 'text-white/50 hover:text-white hover:bg-white/[0.04]'}`}>
                            {s === 'newest' ? 'Nieuwste eerst' : 'Oudste eerst'}
                          </button>
                        ))}
                      </div>
                      <div className="border-t border-white/[0.08] pt-3">
                        <p className="text-[10px] text-white/30 uppercase tracking-widest mb-1.5 font-semibold">Categorie</p>
                        {(['all', 'CATALOGUE', 'SHOP', 'SOCIAL MEDIA', 'DASHBOARD'] as CategoryFilter[]).map((c) => (
                          <button key={c} onClick={() => setCategoryFilter(c)}
                            className={`block w-full text-left px-2 py-1.5 text-xs rounded-lg transition ${categoryFilter === c ? 'text-white bg-white/[0.08]' : 'text-white/50 hover:text-white hover:bg-white/[0.04]'}`}>
                            {c === 'all' ? 'Alle categorieën' : c}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto">
                {filteredUsers.length === 0 ? (
                  <div className="py-10 text-center text-white/30">
                    <MessageSquare size={24} className="mx-auto mb-2 opacity-40" />
                    <p className="text-xs">Geen berichten</p>
                  </div>
                ) : (
                  <div>
                    {groupOrder.filter(g => groupedUsers[g]?.length).map((groupName) => (
                      <div key={groupName}>
                        <div className="px-4 py-2 border-b border-white/[0.04] bg-white/[0.02]">
                          <p className="text-[10px] text-white/30 uppercase tracking-widest font-semibold">{groupName}</p>
                        </div>
                        {groupedUsers[groupName].map((u) => {
                          const userCatGroups = [...new Set(u.categories.map(getCategoryGroup))];
                          return (
                            <button key={u.userId} onClick={() => { setSelectedUserId(u.userId); setSelectedThread(null); setLeftView('threads'); }}
                              className={`w-full px-3 py-3 text-left transition-all border-b border-white/[0.04] flex items-center gap-3 ${selectedUserId === u.userId ? 'bg-white/[0.08]' : 'hover:bg-white/[0.04]'}`}>
                              <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${getRoleColor(u.userRole)} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                                {u.userName[0]?.toUpperCase()}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold text-white truncate">{u.userName}</p>
                                <p className="text-[10px] text-white/40 truncate">{u.categories.join(', ')}</p>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {userCatGroups.map((g) => (
                                    <span key={g} className="text-[9px] px-1 py-0.5 bg-white/[0.05] border border-white/[0.08] rounded text-white/40">{g}</span>
                                  ))}
                                </div>
                              </div>
                              <span className="text-[10px] text-white/30 flex-shrink-0">{u.categories.length} chat{u.categories.length !== 1 ? 's' : ''}</span>
                            </button>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {leftView === 'threads' && selectedGroup && selectedUserEntry && (
            <>
              <div className="p-3 border-b border-white/[0.08] flex items-center gap-3 flex-shrink-0">
                <button onClick={() => { setLeftView('users'); setSelectedThread(null); }} className="text-white/40 hover:text-white transition-colors">
                  <ArrowLeft size={18} />
                </button>
                <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${getRoleColor(selectedUserEntry.userRole)} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                  {selectedUserEntry.userName[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-white truncate">{selectedUserEntry.userName}</p>
                  <p className="text-[10px] text-white/40 truncate">{contactDefs[selectedGroup].name}</p>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto">
                {groupOrder.filter(g => threads.some(t => getCategoryGroup(t.category) === g)).map((groupName) => (
                  <div key={groupName}>
                    <div className="px-4 py-2 border-b border-white/[0.04] bg-white/[0.02]">
                      <p className="text-[10px] text-white/30 uppercase tracking-widest font-semibold">{groupName}</p>
                    </div>
                    {threads.filter(t => getCategoryGroup(t.category) === groupName).map((thread) => (
                      <button key={thread.id} onClick={() => setSelectedThread(thread.id)}
                        className={`w-full px-4 py-3 text-left transition-all border-b border-white/[0.04] flex items-center gap-3 ${selectedThread === thread.id ? 'bg-white/[0.08]' : 'hover:bg-white/[0.04]'}`}>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-white truncate">{thread.category}</p>
                          <p className="text-[10px] text-white/40 truncate mt-0.5">{thread.lastMessage}</p>
                        </div>
                        {selectedThread === thread.id && <div className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />}
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {selectedThread && selectedUserEntry && selectedGroup ? (
          <div className="col-span-8 backdrop-blur-xl bg-gradient-to-br from-white/[0.08] to-white/[0.03] border border-white/[0.12] rounded-xl overflow-hidden flex flex-col">
            <div className="px-4 py-3 border-b border-white/[0.08] flex items-center gap-3 flex-shrink-0 bg-white/[0.04]">
              <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${getRoleColor(selectedUserEntry.userRole)} flex items-center justify-center text-white text-sm font-bold flex-shrink-0`}>
                {selectedUserEntry.userName[0]?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-white text-sm">{selectedUserEntry.userName}</p>
                <p className="text-[11px] text-white/40">{contactDefs[selectedGroup].name} · {getCategoryGroup(selectedThread)} · {selectedThread}</p>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
              {messages.length === 0 ? (
                <div className="text-center text-white/30 py-16"><MessageSquare size={32} className="mx-auto mb-3 opacity-30" /><p className="text-sm">Geen berichten</p></div>
              ) : messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.senderRole === 'admin' || msg.senderRole === 'manager' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-sm px-3 py-2 rounded-xl text-sm ${msg.senderRole === 'admin' || msg.senderRole === 'manager' ? 'bg-red-600 text-white rounded-br-sm' : 'bg-white/[0.1] text-white rounded-bl-sm border border-white/[0.1]'}`}>
                    {msg.senderRole !== 'admin' && msg.senderRole !== 'manager' && <p className="text-[10px] font-semibold text-white/60 mb-1">{msg.senderName}</p>}
                    <p className="break-words leading-relaxed">{msg.message}</p>
                    <div className="flex items-center gap-1 mt-1 justify-end">
                      <span className="text-[10px] opacity-60">{msg.createdAt?.toDate?.()?.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}</span>
                      {(msg.senderRole === 'admin' || msg.senderRole === 'manager') && getStatusIcon(msg.status)}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            <form onSubmit={handleSendMessage} className="px-4 py-3 border-t border-white/[0.08] bg-white/[0.03] flex-shrink-0">
              <div className="flex gap-2">
                <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage(e as any)}
                  placeholder={`Antwoord aan ${selectedUserEntry.userName}...`}
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
              <p className="text-white/30 text-sm">
                {leftView === 'contacts' ? 'Selecteer een inbox' : leftView === 'users' ? 'Selecteer een gebruiker' : 'Selecteer een chat'}
              </p>
            </div>
          </div>
        )}
      </div>
    </ManagerLayout>
  );
};

export default ManagerChat;
