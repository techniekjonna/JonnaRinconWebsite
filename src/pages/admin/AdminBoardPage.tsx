import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { AdminChatContent } from './ChatPage';
import { db } from '../../lib/firebase/config';
import {
  collection, query, orderBy, onSnapshot, doc, updateDoc,
  deleteDoc, Timestamp,
} from 'firebase/firestore';
import { Check, X, Clock, UserPlus, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import LoadingSpinner from '../../components/LoadingSpinner';

type BoardTab = 'artist-requests' | 'chat';

// ─── Artist Role Requests ──────────────────────────────────────────────────
interface ArtistRoleRequest {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  artistName: string;
  region: string;
  city: string;
  roles: string[];
  instagram: string;
  spotify: string;
  additionalInfo: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Timestamp;
}

const ArtistRequestsSection: React.FC = () => {
  const [requests, setRequests] = useState<ArtistRoleRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'artistRoleRequests'), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snap) => {
      const reqs: ArtistRoleRequest[] = [];
      snap.forEach((d) => reqs.push({ id: d.id, ...d.data() } as ArtistRoleRequest));
      setRequests(reqs);
      setLoading(false);
    });
  }, []);

  const handleApprove = async (req: ArtistRoleRequest) => {
    if (!confirm(`Approve ${req.artistName} as an artist?`)) return;
    try {
      await updateDoc(doc(db, 'artistRoleRequests', req.id), { status: 'approved' });
      await updateDoc(doc(db, 'users', req.userId), {
        role: 'artist', artistName: req.artistName, region: req.region,
        city: req.city, artistRoles: req.roles, instagram: req.instagram, spotify: req.spotify,
      });
    } catch (err) { console.error(err); alert('❌ Failed to approve. Check user document exists.'); }
  };

  const handleReject = async (id: string) => {
    if (!confirm('Reject this request?')) return;
    await updateDoc(doc(db, 'artistRoleRequests', id), { status: 'rejected' });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Permanently delete this request?')) return;
    await deleteDoc(doc(db, 'artistRoleRequests', id));
  };

  const filtered = requests.filter((r) => filter === 'all' || r.status === filter);

  const statusPill = (status: ArtistRoleRequest['status']) =>
    status === 'pending' ? 'bg-yellow-500/15 text-yellow-400' :
    status === 'approved' ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400';

  const statusLabel = (status: ArtistRoleRequest['status']) =>
    status === 'pending' ? 'Open' : status === 'approved' ? 'Goedgekeurd' : 'Afgewezen';

  const filterLabels: Record<typeof filter, string> = { pending: 'Open', all: 'Alles', approved: 'Goedgekeurd', rejected: 'Afgewezen' };

  return (
    <div className="space-y-3">
      <div className="flex gap-1 p-1 bg-white/[0.04] border border-white/[0.06] rounded-xl w-full sm:w-fit overflow-x-auto">
        {(['pending', 'all', 'approved', 'rejected'] as const).map((s) => {
          const count = s === 'all' ? requests.length : requests.filter((r) => r.status === s).length;
          return (
            <button key={s} onClick={() => setFilter(s)}
              className={`h-8 px-3 rounded-lg text-xs font-semibold whitespace-nowrap flex items-center gap-1.5 transition-colors ${filter === s ? 'bg-white/[0.12] text-white' : 'text-white/45 hover:text-white/80'}`}>
              {filterLabels[s]}
              <span className={`text-[10px] px-1.5 rounded-full ${s === 'pending' && count > 0 ? 'bg-yellow-500/20 text-yellow-400' : 'bg-white/[0.08] text-white/40'}`}>{count}</span>
            </button>
          );
        })}
      </div>

      {loading ? <LoadingSpinner text="Aanvragen laden..." /> :
       filtered.length === 0 ? (
        <div className="border border-dashed border-white/[0.1] rounded-xl py-8 text-center">
          <UserPlus size={24} className="mx-auto mb-2 text-white/20" />
          <p className="text-white/40 text-sm">Geen aanvragen{filter !== 'all' ? ` (${filterLabels[filter].toLowerCase()})` : ''}</p>
        </div>
      ) : (
        <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] divide-y divide-white/[0.06] overflow-hidden">
          {filtered.map((req) => {
            const open = openId === req.id;
            const hasDetails = !!req.additionalInfo || !!req.spotify;
            return (
              <div key={req.id} className="px-3 py-2.5 sm:px-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-600 to-red-700 flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
                    {req.artistName?.[0]?.toUpperCase() || '?'}
                  </div>
                  <button
                    onClick={() => hasDetails && setOpenId(open ? null : req.id)}
                    className={`flex-1 min-w-0 text-left ${hasDetails ? 'cursor-pointer' : 'cursor-default'}`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{req.artistName}</p>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full flex-shrink-0 inline-flex items-center gap-1 ${statusPill(req.status)}`}>
                        {req.status === 'pending' && <Clock size={9} />}{statusLabel(req.status)}
                      </span>
                      {hasDetails && (open ? <ChevronUp size={14} className="text-white/30 flex-shrink-0" /> : <ChevronDown size={14} className="text-white/30 flex-shrink-0" />)}
                    </div>
                    <p className="text-xs text-white/40 truncate">
                      {[req.userName, req.city && req.region ? `${req.city}, ${req.region}` : req.city || req.region, req.instagram, req.createdAt?.toDate?.()?.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })].filter(Boolean).join(' · ')}
                    </p>
                    {req.roles?.length > 0 && (
                      <div className="hidden md:flex flex-wrap gap-1 mt-1">
                        {req.roles.map((role) => (
                          <span key={role} className="px-1.5 py-0.5 bg-purple-600/15 text-purple-300 rounded text-[10px]">{role}</span>
                        ))}
                      </div>
                    )}
                  </button>
                  <div className="flex gap-1.5 flex-shrink-0">
                    {req.status === 'pending' ? <>
                      <button onClick={() => handleApprove(req)} title="Goedkeuren" aria-label="Goedkeuren" className="w-10 h-10 sm:w-auto sm:px-3 sm:h-9 rounded-lg bg-green-600/15 border border-green-600/30 text-green-400 hover:bg-green-600/25 text-xs font-semibold flex items-center justify-center gap-1 transition"><Check size={14} /><span className="hidden sm:inline">Goedkeuren</span></button>
                      <button onClick={() => handleReject(req.id)} title="Afwijzen" aria-label="Afwijzen" className="w-10 h-10 sm:w-auto sm:px-3 sm:h-9 rounded-lg bg-red-600/15 border border-red-600/30 text-red-400 hover:bg-red-600/25 text-xs font-semibold flex items-center justify-center gap-1 transition"><X size={14} /><span className="hidden sm:inline">Afwijzen</span></button>
                    </> : (
                      <button onClick={() => handleDelete(req.id)} title="Verwijderen" aria-label="Verwijderen" className="w-10 h-10 sm:h-9 sm:w-9 rounded-lg bg-white/[0.05] text-white/40 hover:text-white hover:bg-white/[0.1] flex items-center justify-center transition"><Trash2 size={14} /></button>
                    )}
                  </div>
                </div>
                {open && (
                  <div className="mt-2 ml-12 space-y-2 text-xs">
                    {req.roles?.length > 0 && (
                      <div className="flex md:hidden flex-wrap gap-1">
                        {req.roles.map((role) => (
                          <span key={role} className="px-1.5 py-0.5 bg-purple-600/15 text-purple-300 rounded text-[10px]">{role}</span>
                        ))}
                      </div>
                    )}
                    <p className="text-white/40">{req.userEmail}{req.spotify ? <> · <a href={req.spotify} target="_blank" rel="noreferrer" className="text-green-400 hover:underline">Spotify</a></> : null}</p>
                    {req.additionalInfo && <p className="text-white/65 bg-black/30 rounded-lg p-2.5 whitespace-pre-wrap">{req.additionalInfo}</p>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ─── MAIN PAGE ─────────────────────────────────────────────────────────────
const AdminBoardPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<BoardTab>('chat');

  const tabs: { key: BoardTab; label: string }[] = [
    { key: 'chat',             label: 'CHAT' },
    { key: 'artist-requests',  label: 'ARTIST REQUESTS' },
  ];

  return (
    <AdminLayout>
      <div className="space-y-4">
        <div>
          <h1 className="text-xl font-bold text-white">Artist Support</h1>
          <p className="text-white/40 mt-1 text-sm">Beheer artist requests, samenwerkingen en chat</p>
        </div>

        {/* Section tabs */}
        <div className="flex gap-1 border-b border-white/[0.1]">
          {tabs.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`px-4 py-2.5 font-semibold text-sm transition-all relative ${
                activeTab === key ? 'text-white' : 'text-white/40 hover:text-white'
              }`}
            >
              {label}
              {activeTab === key && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-red-600 to-pink-600" />}
            </button>
          ))}
        </div>

        {activeTab === 'artist-requests' && <ArtistRequestsSection />}
        {activeTab === 'chat'            && <AdminChatContent />}
      </div>
    </AdminLayout>
  );
};

export default AdminBoardPage;
