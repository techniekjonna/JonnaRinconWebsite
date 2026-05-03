import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { AdminChatContent } from './ChatPage';
import { db } from '../../lib/firebase/config';
import {
  collection, query, orderBy, onSnapshot, doc, updateDoc,
  addDoc, deleteDoc, serverTimestamp, Timestamp,
} from 'firebase/firestore';
import { Check, X, Clock, Handshake, UserPlus } from 'lucide-react';
import LoadingSpinner from '../../components/LoadingSpinner';

type BoardTab = 'artist-requests' | 'collab-requests' | 'chat';

// ─── Collab Requests ───────────────────────────────────────────────────────
interface CollabRequest {
  id: string;
  artistId: string;
  artistName: string;
  artistEmail: string;
  title: string;
  type: string;
  description: string;
  budget: number | null;
  preferredStartDate: string | null;
  message: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Timestamp;
}

const CollabRequestsSection: React.FC = () => {
  const [requests, setRequests] = useState<CollabRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');

  useEffect(() => {
    const q = query(collection(db, 'collabRequests'), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snap) => {
      const reqs: CollabRequest[] = [];
      snap.forEach((d) => reqs.push({ id: d.id, ...d.data() } as CollabRequest));
      setRequests(reqs);
      setLoading(false);
    });
  }, []);

  const handleApprove = async (req: CollabRequest) => {
    try {
      await addDoc(collection(db, 'collaborations'), {
        clientName: req.artistName, clientEmail: req.artistEmail,
        assignedTo: req.artistId, title: req.title, type: req.type,
        description: req.description, budget: req.budget || 0,
        paidAmount: 0, paymentStatus: 'unpaid', status: 'inquiry',
        startDate: req.preferredStartDate ? new Date(req.preferredStartDate) : null,
        deadline: null, endDate: null, contractPDF: null,
        attachments: [], notes: req.message || '',
        createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
      });
      await updateDoc(doc(db, 'collabRequests', req.id), { status: 'approved' });
    } catch (err) { console.error(err); }
  };

  const handleReject = async (id: string) => {
    if (!confirm('Reject this request?')) return;
    await updateDoc(doc(db, 'collabRequests', id), { status: 'rejected' });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Permanently delete this request?')) return;
    await deleteDoc(doc(db, 'collabRequests', id));
  };

  const filtered = requests.filter((r) => filter === 'all' || r.status === filter);

  return (
    <div className="space-y-4">
      {/* Sub-filter */}
      <div className="flex gap-1 border-b border-white/[0.06]">
        {(['pending', 'all', 'approved', 'rejected'] as const).map((s) => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-4 py-2 text-xs font-semibold capitalize transition-all relative ${filter === s ? 'text-white' : 'text-white/40 hover:text-white'}`}>
            {s} ({s === 'all' ? requests.length : requests.filter((r) => r.status === s).length})
            {filter === s && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/40" />}
          </button>
        ))}
      </div>

      {loading ? <LoadingSpinner text="Loading requests..." /> :
       filtered.length === 0 ? (
        <div className="bg-white/[0.08] border border-white/[0.06] rounded-xl p-8 text-center">
          <Handshake size={32} className="mx-auto mb-3 text-white/20" />
          <p className="text-white/40 text-sm">No {filter !== 'all' ? filter : ''} collab requests</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((req) => (
            <div key={req.id} className={`bg-white/[0.05] border rounded-xl p-4 ${
              req.status === 'pending' ? 'border-yellow-600/40' :
              req.status === 'approved' ? 'border-green-600/40' : 'border-red-600/40'
            }`}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-white">{req.title}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      req.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                      req.status === 'approved' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                    }`}>
                      {req.status === 'pending' && <Clock size={10} className="inline mr-1" />}{req.status}
                    </span>
                  </div>
                  <p className="text-sm text-white">{req.artistName}</p>
                  <p className="text-xs text-white/40">{req.artistEmail}</p>
                  <p className="text-xs text-white/30 mt-0.5">{req.createdAt?.toDate?.()?.toLocaleString()}</p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  {req.status === 'pending' && <>
                    <button onClick={() => handleApprove(req)} className="px-3 py-1.5 rounded-lg bg-green-600/20 border border-green-600/30 text-green-400 hover:bg-green-600/30 text-xs flex items-center gap-1 transition"><Check size={12} />Approve</button>
                    <button onClick={() => handleReject(req.id)} className="px-3 py-1.5 rounded-lg bg-red-600/20 border border-red-600/30 text-red-400 hover:bg-red-600/30 text-xs flex items-center gap-1 transition"><X size={12} />Reject</button>
                  </>}
                  {req.status !== 'pending' && <button onClick={() => handleDelete(req.id)} className="px-3 py-1.5 rounded-lg bg-white/[0.06] text-white/40 hover:text-white text-xs transition">Delete</button>}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 text-xs mb-3">
                <div><span className="text-white/40">Type:</span><p className="text-white capitalize">{req.type.replace('_', ' ')}</p></div>
                <div><span className="text-white/40">Budget:</span><p className="text-white">{req.budget ? `€${req.budget.toFixed(2)}` : 'N/A'}</p></div>
                <div><span className="text-white/40">Start:</span><p className="text-white">{req.preferredStartDate ? new Date(req.preferredStartDate).toLocaleDateString() : 'Flexible'}</p></div>
              </div>
              <p className="text-sm text-white/70 bg-black/30 rounded-lg p-3">{req.description}</p>
              {req.message && <p className="text-xs text-white/50 mt-2 bg-black/20 rounded-lg p-3">{req.message}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

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

  return (
    <div className="space-y-4">
      <div className="flex gap-1 border-b border-white/[0.06]">
        {(['pending', 'all', 'approved', 'rejected'] as const).map((s) => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-4 py-2 text-xs font-semibold capitalize transition-all relative ${filter === s ? 'text-white' : 'text-white/40 hover:text-white'}`}>
            {s} ({s === 'all' ? requests.length : requests.filter((r) => r.status === s).length})
            {filter === s && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/40" />}
          </button>
        ))}
      </div>

      {loading ? <LoadingSpinner text="Loading requests..." /> :
       filtered.length === 0 ? (
        <div className="bg-white/[0.08] border border-white/[0.06] rounded-xl p-8 text-center">
          <UserPlus size={32} className="mx-auto mb-3 text-white/20" />
          <p className="text-white/40 text-sm">No {filter !== 'all' ? filter : ''} artist requests</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((req) => (
            <div key={req.id} className={`bg-white/[0.05] border rounded-xl p-4 ${
              req.status === 'pending' ? 'border-yellow-600/40' :
              req.status === 'approved' ? 'border-green-600/40' : 'border-red-600/40'
            }`}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-white">{req.artistName}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      req.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                      req.status === 'approved' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                    }`}>
                      {req.status === 'pending' && <Clock size={10} className="inline mr-1" />}{req.status}
                    </span>
                  </div>
                  <p className="text-sm text-white">{req.userName}</p>
                  <p className="text-xs text-white/40">{req.userEmail}</p>
                  <p className="text-xs text-white/30 mt-0.5">{req.createdAt?.toDate?.()?.toLocaleString()}</p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  {req.status === 'pending' && <>
                    <button onClick={() => handleApprove(req)} className="px-3 py-1.5 rounded-lg bg-green-600/20 border border-green-600/30 text-green-400 hover:bg-green-600/30 text-xs flex items-center gap-1 transition"><Check size={12} />Approve</button>
                    <button onClick={() => handleReject(req.id)} className="px-3 py-1.5 rounded-lg bg-red-600/20 border border-red-600/30 text-red-400 hover:bg-red-600/30 text-xs flex items-center gap-1 transition"><X size={12} />Reject</button>
                  </>}
                  {req.status !== 'pending' && <button onClick={() => handleDelete(req.id)} className="px-3 py-1.5 rounded-lg bg-white/[0.06] text-white/40 hover:text-white text-xs transition">Delete</button>}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 text-xs mb-3">
                <div><span className="text-white/40">Location:</span><p className="text-white">{req.city}, {req.region}</p></div>
                <div><span className="text-white/40">Instagram:</span><p className="text-white">{req.instagram || 'N/A'}</p></div>
                <div><span className="text-white/40">Spotify:</span><p className="text-white">{req.spotify ? 'Yes' : 'N/A'}</p></div>
              </div>
              {req.roles?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {req.roles.map((role) => (
                    <span key={role} className="px-2 py-0.5 bg-purple-600/20 text-purple-300 rounded-full text-xs">{role}</span>
                  ))}
                </div>
              )}
              {req.additionalInfo && <p className="text-xs text-white/60 bg-black/30 rounded-lg p-3">{req.additionalInfo}</p>}
            </div>
          ))}
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
    { key: 'collab-requests',  label: 'COLLAB REQUESTS' },
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

        {activeTab === 'collab-requests' && <CollabRequestsSection />}
        {activeTab === 'artist-requests' && <ArtistRequestsSection />}
        {activeTab === 'chat'            && <AdminChatContent />}
      </div>
    </AdminLayout>
  );
};

export default AdminBoardPage;
