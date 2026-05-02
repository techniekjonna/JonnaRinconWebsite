import React, { useEffect, useState, useRef } from 'react';
import ArtistLayout from '../../components/artist/ArtistLayout';
import { useAuth } from '../../contexts/AuthContext';
import { collaborationService } from '../../lib/firebase/services/collaborationService';
import { Collaboration } from '../../lib/firebase/types';
import LoadingSpinner from '../../components/LoadingSpinner';
import {
  Handshake, MessageSquare, Send, X, AlertCircle, Plus, Check, CheckCheck,
  Info, Briefcase, Headphones, ArrowLeft, Edit2,
} from 'lucide-react';
import { db } from '../../lib/firebase/config';
import {
  collection, addDoc, serverTimestamp, query, where, orderBy,
  onSnapshot, Timestamp, or, updateDoc, doc,
} from 'firebase/firestore';

type BoardSection = 'collabs' | 'requests' | 'chat';
type CollabFilter = 'all' | 'inquiry' | 'in_progress' | 'completed';

// ─── Collab message type ───────────────────────────────────────────────────
interface CollabMessage {
  id?: string;
  collaborationId: string;
  senderId: string;
  senderName: string;
  senderEmail: string;
  message: string;
  createdAt: Timestamp;
}

// ─── Chat types ────────────────────────────────────────────────────────────
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
  jonna:   { name: 'Jonna Rincon', description: 'Direct contact — artiest is veel bezig, verwacht geen snel antwoord!' },
  manager: { name: 'Manager',      description: 'Business inquiries, collaborations & partnerships' },
  support: { name: 'Support Team', description: 'Questions, help and support' },
  private: { name: 'Privé',        description: 'Privé chats met admins' },
};

const categoryOptions: Record<string, string[]> = {
  CATALOGUE:    ['Tracks', 'Remixes', 'Support'],
  SHOP:         ['Beats', 'Services', 'Merchandise', 'Art'],
  'SOCIAL MEDIA': ['Content', 'Collaboration'],
  DASHBOARD:    ['Orders', 'Downloads'],
  SUPPORT:      ['Support', 'Overig'],
};

const ContactAvatar = ({ group, size = 'md' }: { group: RecipientGroup; size?: 'sm' | 'md' }) => {
  const cls = size === 'sm' ? 'w-9 h-9' : 'w-12 h-12';
  if (group === 'jonna')
    return <div className={`${cls} rounded-full overflow-hidden flex-shrink-0 border-2 border-white/20`}><img src="/JEIGHTENESIS.jpg" alt="Jonna Rincon" className="w-full h-full object-cover object-top" /></div>;
  if (group === 'manager')
    return <div className={`${cls} rounded-full flex-shrink-0 bg-gradient-to-br from-neutral-700 to-neutral-900 border border-white/10 flex items-center justify-center`}><Briefcase size={size === 'sm' ? 16 : 20} className="text-white/70" /></div>;
  return <div className={`${cls} rounded-full flex-shrink-0 bg-gradient-to-br from-red-900/60 to-neutral-900 border border-red-500/20 flex items-center justify-center`}><Headphones size={size === 'sm' ? 16 : 20} className="text-red-400/80" /></div>;
};

// ─── ARTIST COLLABS ────────────────────────────────────────────────────────
const CollabsSection: React.FC = () => {
  const { user } = useAuth();
  const [collaborations, setCollaborations] = useState<Collaboration[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<CollabFilter>('all');
  const [openChatCollabId, setOpenChatCollabId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Record<string, CollabMessage[]>>({});
  const [newMessage, setNewMessage] = useState('');

  useEffect(() => {
    if (!user) return;
    collaborationService.getAll().then((all) => {
      setCollaborations(all.filter((c) => c.clientEmail === user.email || c.assignedTo === user.uid));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [user]);

  useEffect(() => {
    if (!openChatCollabId) return;
    const q = query(collection(db, 'collaborationMessages'), where('collaborationId', '==', openChatCollabId), orderBy('createdAt', 'asc'));
    return onSnapshot(q, (snap) => {
      const msgs: CollabMessage[] = [];
      snap.forEach((d) => msgs.push({ id: d.id, ...d.data() } as CollabMessage));
      setMessages((prev) => ({ ...prev, [openChatCollabId]: msgs }));
    });
  }, [openChatCollabId]);

  const handleSendMessage = async (collaborationId: string) => {
    if (!newMessage.trim() || !user) return;
    await addDoc(collection(db, 'collaborationMessages'), {
      collaborationId,
      senderId: user.uid,
      senderName: user.displayName || 'Artist',
      senderEmail: user.email,
      message: newMessage.trim(),
      createdAt: serverTimestamp(),
    });
    setNewMessage('');
  };

  const filtered = collaborations.filter((c) => filter === 'all' || c.status === filter);

  if (loading) return <div className="flex justify-center py-16"><LoadingSpinner text="Loading collaborations..." /></div>;

  return (
    <div className="space-y-4">
      {/* Sub-filter tabs */}
      <div className="flex gap-1 border-b border-white/[0.06]">
        {(['all', 'inquiry', 'in_progress', 'completed'] as CollabFilter[]).map((s) => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-4 py-2 text-xs font-semibold transition-all relative ${filter === s ? 'text-white' : 'text-white/40 hover:text-white'}`}>
            {s === 'all' ? 'ALL' : s.replace('_', ' ').toUpperCase()}
            <span className="ml-1 text-white/30">
              ({s === 'all' ? collaborations.length : collaborations.filter((c) => c.status === s).length})
            </span>
            {filter === s && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/40" />}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white/[0.08] border border-white/[0.06] rounded-xl p-8 text-center">
          <Handshake size={32} className="mx-auto mb-3 text-white/20" />
          <p className="text-white/50 mb-1">{filter === 'all' ? 'No collaborations yet' : `No ${filter.replace('_', ' ')} collaborations`}</p>
          <p className="text-white/30 text-sm">Contact via Requests to start collaborating</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((collab) => (
            <div key={collab.id} className="bg-white/[0.05] border border-white/[0.06] rounded-xl overflow-hidden">
              <div className="bg-white/[0.04] px-4 py-3 flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-white">{collab.title}</h3>
                  <div className="flex items-center gap-3 text-xs text-white/40 mt-1">
                    <span className="capitalize">{collab.type}</span>
                    {collab.budget && <span>€{collab.budget.toFixed(2)}</span>}
                  </div>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                  collab.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                  collab.status === 'in_progress' ? 'bg-blue-500/20 text-blue-400' :
                  collab.status === 'inquiry' ? 'bg-yellow-500/20 text-yellow-400' :
                  'bg-white/10 text-white/60'
                }`}>{collab.status.replace('_', ' ')}</span>
              </div>
              <div className="px-4 py-3 space-y-3">
                <p className="text-sm text-white/60">{collab.description}</p>
                {collab.notes && <p className="text-xs text-white/40">{collab.notes}</p>}

                {/* Messaging */}
                <div className="pt-2 border-t border-white/[0.06]">
                  {openChatCollabId === collab.id ? (
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <h4 className="text-sm font-semibold text-white flex items-center gap-2"><MessageSquare size={16} className="text-blue-400" />Messages</h4>
                        <button onClick={() => setOpenChatCollabId(null)} className="text-white/40 hover:text-white"><X size={16} /></button>
                      </div>
                      <div className="bg-black/40 rounded-lg p-3 max-h-64 overflow-y-auto space-y-2">
                        {!messages[collab.id]?.length ? (
                          <p className="text-center text-white/30 text-xs py-4">No messages yet</p>
                        ) : messages[collab.id]?.map((msg) => (
                          <div key={msg.id} className={`p-2 rounded-lg text-sm ${msg.senderId === user?.uid ? 'bg-purple-900/30 ml-8' : 'bg-white/[0.06] mr-8'}`}>
                            <p className="text-xs text-white/40 mb-0.5">{msg.senderId === user?.uid ? 'You' : msg.senderName}</p>
                            <p className="text-white/80">{msg.message}</p>
                          </div>
                        ))}
                      </div>
                      <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(collab.id!); }} className="flex gap-2">
                        <input value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Type a message..."
                          className="flex-1 bg-white/[0.06] border border-white/[0.08] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500/40" />
                        <button type="submit" disabled={!newMessage.trim()} className="px-3 py-2 rounded-lg bg-blue-600/20 border border-blue-600/30 text-blue-400 hover:bg-blue-600/30 disabled:opacity-40 transition">
                          <Send size={14} />
                        </button>
                      </form>
                    </div>
                  ) : (
                    <button onClick={() => setOpenChatCollabId(collab.id!)}
                      className="w-full py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white/60 hover:text-white hover:bg-white/[0.08] text-sm transition flex items-center justify-center gap-2">
                      <MessageSquare size={14} />Open Messages
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── REQUESTS ─────────────────────────────────────────────────────────────
const RequestsSection: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    title: '', type: 'music_video' as 'music_video' | 'live_performance' | 'studio_session' | 'event' | 'other',
    description: '', budget: '', preferredStartDate: '', message: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    try {
      await addDoc(collection(db, 'collabRequests'), {
        artistId: user.uid,
        artistName: user.displayName || 'Unknown Artist',
        artistEmail: user.email,
        title: form.title, type: form.type, description: form.description,
        budget: form.budget ? parseFloat(form.budget) : null,
        preferredStartDate: form.preferredStartDate || null,
        message: form.message,
        status: 'pending',
        createdAt: serverTimestamp(),
      });
      setSubmitted(true);
      setForm({ title: '', type: 'music_video', description: '', budget: '', preferredStartDate: '', message: '' });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (submitted)
    return (
      <div className="bg-white/[0.08] border border-white/[0.06] rounded-xl p-8 text-center">
        <div className="text-4xl mb-4">✅</div>
        <p className="text-white font-semibold mb-2">Request submitted!</p>
        <p className="text-white/40 text-sm mb-6">Admin will review it and get back to you via email.</p>
        <button onClick={() => setSubmitted(false)} className="px-4 py-2 rounded-lg bg-white/[0.08] text-white/70 hover:text-white text-sm transition">Submit another</button>
      </div>
    );

  return (
    <div className="max-w-2xl space-y-4">
      <div className="bg-white/[0.05] border border-white/[0.06] rounded-xl p-6">
        <h2 className="text-lg font-bold text-white mb-1">Submit a Collaboration Request</h2>
        <p className="text-white/40 text-sm mb-6">Tell us about your collaboration idea</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-white/50 mb-1.5">Project Title <span className="text-red-400">*</span></label>
            <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g., Music Video for Summer Track"
              className="w-full bg-white/[0.06] border border-white/[0.08] rounded-lg px-3 py-2.5 text-white text-sm placeholder-white/30 focus:outline-none focus:border-red-500/50" />
          </div>
          <div>
            <label className="block text-xs font-medium text-white/50 mb-1.5">Collaboration Type <span className="text-red-400">*</span></label>
            <select required value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as any })}
              className="w-full bg-white/[0.06] border border-white/[0.08] rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-red-500/50">
              <option value="music_video">Music Video</option>
              <option value="live_performance">Live Performance</option>
              <option value="studio_session">Studio Session</option>
              <option value="event">Event</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-white/50 mb-1.5">Description <span className="text-red-400">*</span></label>
            <textarea required rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Describe what you want to collaborate on..."
              className="w-full bg-white/[0.06] border border-white/[0.08] rounded-lg px-3 py-2.5 text-white text-sm placeholder-white/30 focus:outline-none focus:border-red-500/50" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-white/50 mb-1.5">Budget (€)</label>
              <input type="number" step="0.01" min="0" value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })}
                placeholder="Optional"
                className="w-full bg-white/[0.06] border border-white/[0.08] rounded-lg px-3 py-2.5 text-white text-sm placeholder-white/30 focus:outline-none focus:border-red-500/50" />
            </div>
            <div>
              <label className="block text-xs font-medium text-white/50 mb-1.5">Preferred Start Date</label>
              <input type="date" value={form.preferredStartDate} onChange={(e) => setForm({ ...form, preferredStartDate: e.target.value })}
                className="w-full bg-white/[0.06] border border-white/[0.08] rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-red-500/50" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-white/50 mb-1.5">Additional Message</label>
            <textarea rows={3} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })}
              placeholder="Any additional information..."
              className="w-full bg-white/[0.06] border border-white/[0.08] rounded-lg px-3 py-2.5 text-white text-sm placeholder-white/30 focus:outline-none focus:border-red-500/50" />
          </div>
          <button type="submit" disabled={loading}
            className="w-full bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 px-6 py-3 rounded-xl text-white font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-sm">
            {loading ? 'Submitting...' : <><Send size={16} />Submit Request</>}
          </button>
        </form>
      </div>
      <div className="bg-blue-900/20 border border-blue-700/40 rounded-xl p-4 flex gap-3">
        <AlertCircle size={18} className="text-blue-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-blue-300 mb-1">What happens next?</p>
          <p className="text-sm text-blue-200/70">Your request will be reviewed by the admin team. You'll receive an email once approved or if we need more information.</p>
        </div>
      </div>
    </div>
  );
};

// ─── CHAT ──────────────────────────────────────────────────────────────────
const ChatSection: React.FC = () => {
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
    const q = query(collection(db, 'supportMessages'), or(where('senderId', '==', user.uid), where('recipientId', '==', user.uid)), orderBy('createdAt', 'asc'));
    return onSnapshot(q, (snap) => {
      const msgs: ChatMessage[] = [];
      snap.forEach((d) => {
        const data = d.data();
        msgs.push({ id: d.id, ...data, category: data.category || 'General', recipientGroup: data.recipientGroup || 'support', status: data.status || 'sent' } as ChatMessage);
      });
      setAllMessages(msgs);
    });
  }, [user]);

  useEffect(() => {
    const groupMsgs = allMessages.filter((m) => m.recipientGroup === selectedGroup);
    const map = new Map<string, ChatThread>();
    groupMsgs.forEach((m) => {
      const ex = map.get(m.category);
      if (!ex || (m.createdAt?.toMillis?.() || 0) > (ex.lastMessageTime?.toMillis?.() || 0))
        map.set(m.category, { id: m.category, category: m.category, lastMessage: m.message, lastMessageTime: m.createdAt });
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

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !selectedThread) return;
    try {
      await addDoc(collection(db, 'supportMessages'), {
        senderId: user.uid, senderName: user.displayName || 'Artist',
        senderEmail: user.email, senderRole: 'artist',
        recipientGroup: selectedGroup, category: selectedThread,
        message: newMessage.trim(), createdAt: serverTimestamp(), status: 'sent',
      });
      setNewMessage('');
    } catch (err) { console.error(err); }
  };

  const startPrivateChat = async (adminName: string) => {
    if (!user) return;
    await addDoc(collection(db, 'supportMessages'), {
      senderId: user.uid, senderName: user.displayName || 'Artist',
      senderEmail: user.email, senderRole: 'artist',
      recipientGroup: 'private', recipientId: adminName,
      category: `chat-${user.uid}-${adminName}`, message: '👋',
      createdAt: serverTimestamp(), status: 'sent',
    });
    setSelectedGroup('private');
    setSelectedThread(`chat-${user.uid}-${adminName}`);
    setLeftView('threads');
    setShowPrivateChatModal(false);
  };

  const updateThreadTitle = async (oldTitle: string, newTitle: string) => {
    if (!newTitle.trim() || !user) return;
    const q = query(collection(db, 'supportMessages'), where('category', '==', oldTitle));
    onSnapshot(q, async (snap) => {
      for (const d of snap.docs) await updateDoc(doc(db, 'supportMessages', d.id), { category: newTitle.trim() });
    });
    setEditingThreadTitle(null);
    setSelectedThread(newTitle.trim());
  };

  const getStatusIcon = (status: string) => {
    if (status === 'read') return <CheckCheck size={12} className="text-blue-400" />;
    if (status === 'delivered') return <CheckCheck size={12} className="text-white/60" />;
    return <Check size={12} className="text-white/60" />;
  };

  return (
    <div className="grid grid-cols-12 h-[calc(100vh-220px)] gap-3">
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
                  <button onClick={() => { setSelectedGroup(key); setSelectedThread(null); setTooltipOpen(null); setLeftView('threads'); }}
                    className="w-full p-3 rounded-xl text-left transition-all flex items-center gap-4 hover:bg-white/[0.06] border border-transparent hover:border-white/[0.08] group">
                    <ContactAvatar group={key} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white">{group.name}</p>
                      <p className="text-[11px] text-white/40 mt-0.5 truncate">{group.description}</p>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); setTooltipOpen(tooltipOpen === key ? null : key); }} className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
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
              <button onClick={() => { setLeftView('contacts'); setSelectedThread(null); }} className="text-white/40 hover:text-white transition-colors"><ArrowLeft size={18} /></button>
              <ContactAvatar group={selectedGroup} size="sm" />
              <p className="text-sm font-semibold text-white flex-1 truncate">{recipientGroups[selectedGroup].name}</p>
              <div className="relative" ref={pickerRef}>
                <button onClick={() => { selectedGroup === 'private' ? setShowPrivateChatModal(true) : setShowCategoryPicker(!showCategoryPicker); }}
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
                            className="block w-full text-left px-2 py-1.5 text-xs text-white/80 hover:text-white hover:bg-white/[0.08] rounded-lg transition">{item}</button>
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

      {/* Right panel */}
      {selectedThread ? (
        <div className="col-span-8 backdrop-blur-xl bg-gradient-to-br from-white/[0.08] to-white/[0.03] border border-white/[0.12] rounded-xl overflow-hidden flex flex-col">
          <div className="px-4 py-3 border-b border-white/[0.08] flex items-center gap-3 flex-shrink-0 bg-white/[0.04]">
            <ContactAvatar group={selectedGroup} size="sm" />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-white text-sm">{recipientGroups[selectedGroup].name}</p>
              {editingThreadTitle === selectedThread ? (
                <div className="flex gap-1 mt-1">
                  <input value={editingThreadValue} onChange={(e) => setEditingThreadValue(e.target.value)} autoFocus
                    className="flex-1 px-2 py-1 rounded text-xs bg-white/[0.08] border border-white/[0.12] text-white focus:outline-none focus:border-red-500/40"
                    onKeyDown={(e) => { if (e.key === 'Enter') updateThreadTitle(selectedThread, editingThreadValue); if (e.key === 'Escape') setEditingThreadTitle(null); }} />
                  <button onClick={() => setEditingThreadTitle(null)} className="p-1 text-white/40 hover:text-white"><X size={14} /></button>
                </div>
              ) : (
                <p className="text-[11px] text-white/40 flex items-center gap-1 group">
                  {selectedThread}
                  {selectedGroup === 'private' && (
                    <button onClick={() => { setEditingThreadTitle(selectedThread); setEditingThreadValue(selectedThread); }} className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5">
                      <Edit2 size={11} className="text-white/30 hover:text-white/60" />
                    </button>
                  )}
                </p>
              )}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
            {messages.length === 0 ? (
              <div className="text-center text-white/30 py-16"><MessageSquare size={32} className="mx-auto mb-3 opacity-30" /><p className="text-sm">Start the conversation</p></div>
            ) : messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.senderId === user?.uid ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-sm px-3 py-2 rounded-xl text-sm ${msg.senderId === user?.uid ? 'bg-red-600 text-white rounded-br-sm' : 'bg-white/[0.1] text-white rounded-bl-sm border border-white/[0.1]'}`}>
                  <p className="break-words leading-relaxed">{msg.message}</p>
                  <div className="flex items-center gap-1 mt-1 justify-end">
                    <span className="text-[10px] opacity-60">{msg.createdAt?.toDate?.()?.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}</span>
                    {msg.senderId === user?.uid && getStatusIcon(msg.status)}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          <form onSubmit={handleSendMessage} className="px-4 py-3 border-t border-white/[0.08] bg-white/[0.03] flex-shrink-0">
            <div className="flex gap-2">
              <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Type a message..."
                className="flex-1 bg-white/[0.06] border border-white/[0.12] rounded-full px-4 py-2 text-white placeholder-white/30 focus:outline-none focus:border-white/[0.25] text-sm" />
              <button type="submit" disabled={!newMessage.trim()} className="w-9 h-9 bg-red-600 hover:bg-red-700 disabled:bg-white/[0.06] text-white rounded-full transition flex items-center justify-center flex-shrink-0">
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

      {showPrivateChatModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowPrivateChatModal(false)} />
          <div className="relative bg-black border border-white/[0.08] rounded-2xl w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">Kies een admin</h3>
              <button onClick={() => setShowPrivateChatModal(false)} className="text-white/40 hover:text-white"><X size={20} /></button>
            </div>
            <div className="space-y-2">
              {['Admin', 'Support Team'].map((admin) => (
                <button key={admin} onClick={() => startPrivateChat(admin)}
                  className="w-full px-4 py-3 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.08] text-white text-left transition-all">
                  <p className="font-semibold">{admin}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── MAIN PAGE ─────────────────────────────────────────────────────────────
const ArtistBoardPage: React.FC = () => {
  const [activeSection, setActiveSection] = useState<BoardSection>('collabs');

  const sections: { key: BoardSection; label: string }[] = [
    { key: 'collabs',  label: 'ARTIST COLLABS' },
    { key: 'requests', label: 'REQUESTS' },
    { key: 'chat',     label: 'CHAT' },
  ];

  return (
    <ArtistLayout>
      <div className="space-y-4">
        {/* Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-3">Artist Board</h1>

          {/* Section tabs */}
          <div className="flex gap-2 border-b border-white/[0.1] overflow-x-auto">
            {sections.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setActiveSection(key)}
                className={`px-4 py-3 text-sm font-semibold transition-all whitespace-nowrap border-b-2 ${
                  activeSection === key
                    ? 'text-white border-red-500'
                    : 'text-white/50 border-transparent hover:text-white/70'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {activeSection === 'collabs'  && <CollabsSection />}
        {activeSection === 'requests' && <RequestsSection />}
        {activeSection === 'chat'     && <ChatSection />}
      </div>
    </ArtistLayout>
  );
};

export default ArtistBoardPage;
