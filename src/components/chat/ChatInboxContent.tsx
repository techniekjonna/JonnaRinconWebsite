import React, { useEffect, useMemo, useRef, useState } from 'react';
import { MessageSquare, Send, Check, CheckCheck, Mail, Users as UsersIcon, ArrowLeft, Search, Plus, X, Handshake } from 'lucide-react';
import { db } from '../../lib/firebase/config';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, Timestamp, updateDoc, doc } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';
import { authService } from '../../lib/firebase/services';
import { User } from '../../lib/firebase/types';
import { useT } from '../../contexts/LanguageContext';

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
  // Collaboration-request details — only ever present on the message that
  // started a 'Collaboration' category conversation (from the artist's
  // request form). Optional and additive: every other supportMessages use
  // (contact form, plain staff chat) never sets these.
  collabType?: string;
  collabBudget?: number | null;
  collabPreferredStartDate?: string | null;
  collabStatus?: 'pending' | 'approved' | 'rejected';
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
  const t = useT();
  const { user } = useAuth();
  const [allMessages, setAllMessages] = useState<ChatMessage[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' && window.innerWidth < 900);
  const [listFilter, setListFilter] = useState<'all' | 'contact' | 'users'>('all');

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
      // Contact section = a visitor's own contact-form thread, OR any
      // thread whose latest message is a Collaboration request — whether
      // that came from the anonymous contact form or a logged-in artist's
      // dedicated request form. Everything else (plain chat with staff)
      // goes to Users, unaffected.
      if (last.senderRole === 'contact' || last.category === 'Collaboration') contact.push(entry);
      else users.push(entry);
    });

    const byRecency = (a: Conversation, b: Conversation) => (b.lastMessageTime?.toMillis?.() || 0) - (a.lastMessageTime?.toMillis?.() || 0);
    return { contactConversations: contact.sort(byRecency), userConversations: users.sort(byRecency) };
  }, [allMessages]);

  const matchesSearch = (c: Conversation) =>
    !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.email.toLowerCase().includes(search.toLowerCase());
  const filteredContactConversations = contactConversations.filter(matchesSearch);
  const filteredUserConversations = userConversations.filter(matchesSearch);

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

  // The message that carries this conversation's collab-request details —
  // prefer the one with actual collabType/collabBudget/collabPreferredStartDate
  // (the artist request form), falling back to the first non-staff message
  // (a plain visitor who picked "Collaboration" in the public contact form
  // never has those fields, but their original message is still "the request").
  const collabSourceMessage = useMemo(() => {
    if (!selectedConversation || selectedConversation.category !== 'Collaboration') return null;
    const withDetails = threadMessages.find(
      (m) => !isStaffRole(m.senderRole) && (m.collabType !== undefined || m.collabBudget !== undefined || m.collabPreferredStartDate !== undefined)
    );
    return withDetails || threadMessages.find((m) => !isStaffRole(m.senderRole)) || null;
  }, [selectedConversation, threadMessages]);

  const collabStatus: 'pending' | 'approved' | 'rejected' = collabSourceMessage?.collabStatus || 'pending';

  const handleApproveCollab = async () => {
    if (!selectedConversation || !collabSourceMessage) return;
    try {
      const firstLine = (collabSourceMessage.message || '').split('\n')[0].trim();
      await addDoc(collection(db, 'collaborations'), {
        clientName: selectedConversation.name,
        clientEmail: selectedConversation.email,
        assignedTo: selectedConversation.id,
        title: firstLine || `Collaboration — ${selectedConversation.name}`,
        type: collabSourceMessage.collabType || 'other',
        description: collabSourceMessage.message || '',
        budget: collabSourceMessage.collabBudget || 0,
        paidAmount: 0,
        paymentStatus: 'unpaid',
        status: 'inquiry',
        startDate: collabSourceMessage.collabPreferredStartDate ? new Date(collabSourceMessage.collabPreferredStartDate) : null,
        deadline: null,
        endDate: null,
        contractPDF: null,
        attachments: [],
        notes: '',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      if (collabSourceMessage.id) {
        await updateDoc(doc(db, 'supportMessages', collabSourceMessage.id), { collabStatus: 'approved' });
      }
    } catch (err) {
      console.error('Failed to approve collaboration request:', err);
    }
  };

  const handleRejectCollab = async () => {
    if (!collabSourceMessage?.id) return;
    if (!confirm('Are you sure you want to reject this collaboration request?')) return;
    try {
      await updateDoc(doc(db, 'supportMessages', collabSourceMessage.id), { collabStatus: 'rejected' });
    } catch (err) {
      console.error('Failed to reject collaboration request:', err);
    }
  };

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

  const hasSelection = !!selectedConversation;
  const showListPane = !isMobile || !hasSelection;
  const showThreadPane = !isMobile || hasSelection;

  const filteredNewMsgUsers = allUsers.filter((u) =>
    (u.displayName || '').toLowerCase().includes(newMsgSearch.toLowerCase()) ||
    u.email.toLowerCase().includes(newMsgSearch.toLowerCase())
  );

  const contactUnread = contactConversations.reduce((n, c) => n + c.unreadCount, 0);
  const usersUnread = userConversations.reduce((n, c) => n + c.unreadCount, 0);

  const listItems = useMemo(() => {
    const items: (Conversation & { kind: 'contact' | 'users' })[] = [];
    if (listFilter !== 'users') filteredContactConversations.forEach((c) => items.push({ ...c, kind: 'contact' }));
    if (listFilter !== 'contact') filteredUserConversations.forEach((c) => items.push({ ...c, kind: 'users' }));
    return items.sort((a, b) => (b.lastMessageTime?.toMillis?.() || 0) - (a.lastMessageTime?.toMillis?.() || 0));
  }, [listFilter, filteredContactConversations, filteredUserConversations]);

  const formatListTime = (ts?: Timestamp) => {
    const d = ts?.toDate?.();
    if (!d) return '';
    const now = new Date();
    if (d.toDateString() === now.toDateString()) return d.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' });
    return d.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' });
  };

  const filterTabs: { key: 'all' | 'contact' | 'users'; label: string; unread: number }[] = [
    { key: 'all', label: t('All', 'Alles'), unread: contactUnread + usersUnread },
    { key: 'contact', label: t('Contact', 'Contact'), unread: contactUnread },
    { key: 'users', label: t('Users', 'Gebruikers'), unread: usersUnread },
  ];

  return (
    <>
      <div className="flex rounded-2xl border border-white/[0.1] bg-white/[0.03] overflow-hidden h-[calc(100dvh-220px)] min-h-[460px]">

        {/* Conversation list */}
        {showListPane && (
          <aside className="w-full md:w-[320px] lg:w-[340px] md:flex-shrink-0 md:border-r border-white/[0.08] flex flex-col min-h-0">
            <div className="p-3 space-y-3 border-b border-white/[0.08] flex-shrink-0">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder={t('Search conversations', 'Zoek gesprekken')}
                    className="w-full h-10 pl-9 pr-3 bg-white/[0.06] border border-white/[0.08] rounded-xl text-sm text-white placeholder-white/30 focus:outline-none focus:border-white/[0.2]"
                  />
                </div>
                <button
                  onClick={openNewMessageModal}
                  title={t('New message', 'Nieuw bericht')}
                  aria-label={t('New message', 'Nieuw bericht')}
                  className="w-10 h-10 rounded-xl bg-red-600 hover:bg-red-500 text-white flex items-center justify-center flex-shrink-0 transition-colors"
                >
                  <Plus size={18} />
                </button>
              </div>
              <div className="flex gap-1 p-1 bg-white/[0.04] rounded-xl">
                {filterTabs.map((f) => (
                  <button
                    key={f.key}
                    onClick={() => setListFilter(f.key)}
                    className={`flex-1 h-8 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                      listFilter === f.key ? 'bg-white/[0.12] text-white' : 'text-white/45 hover:text-white/80'
                    }`}
                  >
                    {f.label}
                    {f.unread > 0 && (
                      <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-red-600 text-[10px] text-white flex items-center justify-center">{f.unread}</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto min-h-0">
              {listItems.length === 0 ? (
                <div className="px-6 py-12 text-center">
                  <MessageSquare size={28} className="mx-auto mb-3 text-white/15" />
                  <p className="text-sm text-white/35">{search ? t('No results', 'Geen resultaten') : t('No conversations yet', 'Nog geen gesprekken')}</p>
                </div>
              ) : (
                listItems.map((c) => {
                  const active = selectedId === c.id;
                  return (
                    <button
                      key={c.id}
                      onClick={() => handleSelectConversation(c.id)}
                      className={`relative w-full px-3 py-3 text-left flex items-center gap-3 border-b border-white/[0.04] transition-colors ${
                        active ? 'bg-white/[0.08]' : 'hover:bg-white/[0.04]'
                      }`}
                    >
                      {active && <span className="absolute left-0 top-2 bottom-2 w-0.5 rounded-full bg-red-500" />}
                      <Avatar name={c.name} role={c.role} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className={`text-sm truncate flex-1 ${c.unreadCount > 0 ? 'font-bold text-white' : 'font-semibold text-white/90'}`}>{c.name}</p>
                          <span className="text-[11px] text-white/35 flex-shrink-0">{formatListTime(c.lastMessageTime)}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          {c.kind === 'contact' ? (
                            c.category === 'Collaboration'
                              ? <Handshake size={12} className="text-purple-300 flex-shrink-0" />
                              : <Mail size={12} className="text-red-400 flex-shrink-0" />
                          ) : (
                            <UsersIcon size={12} className="text-blue-400 flex-shrink-0" />
                          )}
                          <p className={`text-xs truncate flex-1 ${c.unreadCount > 0 ? 'text-white/75' : 'text-white/40'}`}>{c.lastMessage || t('No messages yet', 'Nog geen berichten')}</p>
                          {c.unreadCount > 0 && (
                            <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-red-600 text-[10px] font-bold text-white flex items-center justify-center flex-shrink-0">{c.unreadCount}</span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </aside>
        )}

        {/* Thread */}
        {showThreadPane && (
          <section className="flex-1 min-w-0 flex flex-col min-h-0">
            {!selectedConversation ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
                <div className="w-14 h-14 rounded-2xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center mb-4">
                  <MessageSquare size={24} className="text-white/30" />
                </div>
                <p className="text-sm font-semibold text-white/70">{t('Pick a conversation', 'Kies een gesprek')}</p>
                <p className="text-xs text-white/35 mt-1">{t('Or start a new one with the + button', 'Of begin een nieuw gesprek met de + knop')}</p>
              </div>
            ) : (
              <>
                <div className="px-4 py-3 border-b border-white/[0.08] flex items-center gap-3 flex-shrink-0">
                  {isMobile && (
                    <button onClick={() => setSelectedId(null)} aria-label={t('Back', 'Terug')} className="w-10 h-10 -ml-2 flex items-center justify-center text-white/50 hover:text-white transition-colors">
                      <ArrowLeft size={18} />
                    </button>
                  )}
                  <Avatar name={selectedConversation.name} role={selectedConversation.role} />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white text-sm truncate">{selectedConversation.name}</p>
                    <p className="text-xs text-white/40 truncate">{selectedConversation.email}</p>
                  </div>
                  {selectedConversation.category && selectedConversation.category !== 'General' && (
                    <span className="hidden sm:inline text-[10px] px-2 py-1 bg-white/[0.06] border border-white/[0.08] rounded-full text-white/50 uppercase tracking-wide">{selectedConversation.category}</span>
                  )}
                </div>

                {selectedConversation.category === 'Collaboration' && (
                  <div className="px-4 py-3 border-b border-white/[0.08] bg-gradient-to-br from-purple-500/[0.1] to-pink-500/[0.04] flex-shrink-0 flex flex-wrap items-center gap-x-5 gap-y-2">
                    <div className="flex items-center gap-2">
                      <Handshake size={14} className="text-purple-300" />
                      <p className="text-[11px] font-bold uppercase tracking-wider text-purple-200">{t('Collaboration Request', 'Samenwerkingsverzoek')}</p>
                    </div>
                    {collabSourceMessage?.collabType && (
                      <span className="text-xs"><span className="text-white/40">{t('Type', 'Type')}: </span><span className="text-white font-medium capitalize">{collabSourceMessage.collabType.replace(/_/g, ' ')}</span></span>
                    )}
                    {collabSourceMessage?.collabBudget != null && (
                      <span className="text-xs"><span className="text-white/40">{t('Budget', 'Budget')}: </span><span className="text-white font-medium">€{collabSourceMessage.collabBudget.toFixed(2)}</span></span>
                    )}
                    {collabSourceMessage?.collabPreferredStartDate && (
                      <span className="text-xs"><span className="text-white/40">{t('Preferred start', 'Gewenste start')}: </span><span className="text-white font-medium">{new Date(collabSourceMessage.collabPreferredStartDate).toLocaleDateString('nl-NL')}</span></span>
                    )}
                    <div className="ml-auto flex gap-2">
                      {collabStatus === 'pending' ? (
                        <>
                          <button onClick={handleApproveCollab} className="h-8 px-3 rounded-lg bg-green-600/20 border border-green-600/30 text-green-400 hover:bg-green-600/30 text-xs font-semibold flex items-center gap-1.5 transition">
                            <Check size={12} /> {t('Approve', 'Goedkeuren')}
                          </button>
                          <button onClick={handleRejectCollab} className="h-8 px-3 rounded-lg bg-red-600/20 border border-red-600/30 text-red-400 hover:bg-red-600/30 text-xs font-semibold flex items-center gap-1.5 transition">
                            <X size={12} /> {t('Reject', 'Afwijzen')}
                          </button>
                        </>
                      ) : (
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${collabStatus === 'approved' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                          {collabStatus === 'approved' ? <Check size={12} /> : <X size={12} />}
                          {collabStatus === 'approved' ? t('Approved', 'Goedgekeurd') : t('Rejected', 'Afgewezen')}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2 min-h-0">
                  {threadMessages.filter((m) => m.message).length === 0 ? (
                    <div className="text-center text-white/30 py-16"><MessageSquare size={28} className="mx-auto mb-3 opacity-30" /><p className="text-sm">{t('No messages yet', 'Nog geen berichten')}</p></div>
                  ) : threadMessages.filter((m) => m.message).map((msg) => {
                    const mine = isStaffRole(msg.senderRole);
                    return (
                      <div key={msg.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] sm:max-w-md px-3.5 py-2 rounded-2xl text-sm ${mine ? 'bg-red-600 text-white rounded-br-md' : 'bg-white/[0.08] text-white rounded-bl-md border border-white/[0.08]'}`}>
                          <p className="break-words leading-relaxed whitespace-pre-wrap">{msg.message}</p>
                          <div className="flex items-center gap-1 mt-1 justify-end">
                            <span className="text-[10px] opacity-60">{msg.createdAt?.toDate?.()?.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}</span>
                            {mine && getStatusIcon(msg.status)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                <form onSubmit={handleSendReply} className="px-3 py-3 border-t border-white/[0.08] flex-shrink-0">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder={t(`Reply to ${selectedConversation.name}...`, `Antwoord aan ${selectedConversation.name}...`)}
                      className="flex-1 min-w-0 h-11 bg-white/[0.06] border border-white/[0.1] rounded-full px-4 text-white placeholder-white/30 focus:outline-none focus:border-white/[0.25] text-base sm:text-sm"
                    />
                    <button
                      type="submit"
                      disabled={!newMessage.trim()}
                      aria-label={t('Send', 'Versturen')}
                      className="w-11 h-11 bg-red-600 hover:bg-red-500 disabled:bg-white/[0.06] disabled:text-white/30 text-white rounded-full transition flex items-center justify-center flex-shrink-0"
                    >
                      <Send size={16} />
                    </button>
                  </div>
                </form>
              </>
            )}
          </section>
        )}
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
