import React, { useState, useEffect } from 'react';
import { db } from '../../lib/firebase/config';
import {
  collection, query, orderBy, onSnapshot, addDoc, updateDoc, deleteDoc,
  doc, serverTimestamp, Timestamp,
} from 'firebase/firestore';
import { Plus, X, Trash2, Edit2, Link, Music, ShoppingBag, Calendar, Video, Mic2, ChevronDown } from 'lucide-react';
import { projectService } from '../../lib/firebase/services';
import { Project } from '../../lib/firebase/types';

type ItemType = 'single' | 'album' | 'ep' | 'video' | 'merch' | 'event' | 'collaboration' | 'other';

interface ComingUpItem {
  id: string;
  title: string;
  type: ItemType;
  date: string;
  description?: string;
  coverUrl?: string;
  linkedProjectId?: string;
  linkedProjectTitle?: string;
  order: number;
  createdAt?: Timestamp;
}

const TYPE_CONFIG: Record<ItemType, { label: string; color: string; icon: React.ReactNode }> = {
  single:        { label: 'Single',         color: 'bg-red-500/20 text-red-400 border-red-500/30',         icon: <Music size={12} /> },
  album:         { label: 'Album',          color: 'bg-purple-500/20 text-purple-400 border-purple-500/30', icon: <Music size={12} /> },
  ep:            { label: 'EP',             color: 'bg-pink-500/20 text-pink-400 border-pink-500/30',       icon: <Music size={12} /> },
  video:         { label: 'Video',          color: 'bg-blue-500/20 text-blue-400 border-blue-500/30',       icon: <Video size={12} /> },
  merch:         { label: 'Merch Drop',     color: 'bg-amber-500/20 text-amber-400 border-amber-500/30',    icon: <ShoppingBag size={12} /> },
  event:         { label: 'Event',          color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', icon: <Calendar size={12} /> },
  collaboration: { label: 'Collaboration',  color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',       icon: <Mic2 size={12} /> },
  other:         { label: 'Other',          color: 'bg-white/10 text-white/60 border-white/20',             icon: <ChevronDown size={12} /> },
};

const FILTER_TYPES: Array<ItemType | 'all'> = ['all', 'single', 'album', 'ep', 'video', 'merch', 'event', 'collaboration', 'other'];

const emptyForm = (): Omit<ComingUpItem, 'id' | 'order' | 'createdAt'> => ({
  title: '',
  type: 'single',
  date: '',
  description: '',
  coverUrl: '',
  linkedProjectId: '',
  linkedProjectTitle: '',
});

const ComingUpTab: React.FC = () => {
  const [items, setItems] = useState<ComingUpItem[]>([]);
  const [filter, setFilter] = useState<ItemType | 'all'>('all');
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<ComingUpItem | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [projects, setProjects] = useState<Project[]>([]);
  const [showProjectPicker, setShowProjectPicker] = useState(false);
  const [saving, setSaving] = useState(false);

  // Load coming-up items from Firestore
  useEffect(() => {
    const q = query(collection(db, 'comingUpItems'), orderBy('date', 'asc'));
    const unsub = onSnapshot(q, (snap) => {
      setItems(snap.docs.map(d => ({ id: d.id, ...d.data() } as ComingUpItem)));
    });
    return unsub;
  }, []);

  // Load projects for linking
  useEffect(() => {
    projectService.getAllProjects().then(setProjects);
  }, []);

  const openAdd = () => {
    setEditingItem(null);
    setForm(emptyForm());
    setShowForm(true);
  };

  const openEdit = (item: ComingUpItem) => {
    setEditingItem(item);
    setForm({
      title: item.title,
      type: item.type,
      date: item.date,
      description: item.description || '',
      coverUrl: item.coverUrl || '',
      linkedProjectId: item.linkedProjectId || '',
      linkedProjectTitle: item.linkedProjectTitle || '',
    });
    setShowForm(true);
  };

  const linkProject = (project: Project) => {
    setForm(f => ({
      ...f,
      linkedProjectId: project.id,
      linkedProjectTitle: project.title,
      coverUrl: f.coverUrl || project.coverUrl || '',
      description: f.description || project.description || '',
      title: f.title || project.title,
    }));
    setShowProjectPicker(false);
  };

  const unlinkProject = () => {
    setForm(f => ({ ...f, linkedProjectId: '', linkedProjectTitle: '' }));
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.date) return;
    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        type: form.type,
        date: form.date,
        description: form.description?.trim() || '',
        coverUrl: form.coverUrl?.trim() || '',
        linkedProjectId: form.linkedProjectId || '',
        linkedProjectTitle: form.linkedProjectTitle || '',
        order: editingItem?.order ?? Date.now(),
      };
      if (editingItem) {
        await updateDoc(doc(db, 'comingUpItems', editingItem.id), payload);
      } else {
        await addDoc(collection(db, 'comingUpItems'), { ...payload, createdAt: serverTimestamp() });
      }
      setShowForm(false);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    await deleteDoc(doc(db, 'comingUpItems', id));
  };

  const filtered = filter === 'all' ? items : items.filter(i => i.type === filter);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcoming = filtered.filter(i => new Date(i.date) >= today);
  const past = filtered.filter(i => new Date(i.date) < today);

  return (
    <div className="space-y-4">
      {/* Header row */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        {/* Filter pills */}
        <div className="flex gap-1.5 flex-wrap">
          {FILTER_TYPES.map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all border ${
                filter === f
                  ? 'bg-red-600/20 border-red-600/40 text-red-400'
                  : 'bg-white/[0.04] border-white/[0.08] text-white/40 hover:text-white/70'
              }`}
            >
              {f === 'all' ? 'All' : TYPE_CONFIG[f].label}
            </button>
          ))}
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600/20 hover:bg-red-600/30 border border-red-600/30 text-red-400 rounded-xl text-sm font-medium transition-all"
        >
          <Plus size={14} />
          Add Item
        </button>
      </div>

      {/* Upcoming section */}
      {upcoming.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-white/30 uppercase font-semibold tracking-wider">Upcoming</p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {upcoming.map(item => (
              <ItemCard key={item.id} item={item} onEdit={openEdit} onDelete={handleDelete} />
            ))}
          </div>
        </div>
      )}

      {/* Past section */}
      {past.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-white/30 uppercase font-semibold tracking-wider">Past</p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 opacity-50">
            {past.map(item => (
              <ItemCard key={item.id} item={item} onEdit={openEdit} onDelete={handleDelete} />
            ))}
          </div>
        </div>
      )}

      {filtered.length === 0 && (
        <div className="bg-white/[0.04] border border-white/[0.06] rounded-2xl p-10 text-center">
          <p className="text-white/40 text-sm">No items yet. Click <span className="text-red-400">Add Item</span> to get started.</p>
        </div>
      )}

      {/* Add / Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowForm(false)} />
          <div className="relative bg-neutral-950 border border-white/[0.08] rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-neutral-950/90 backdrop-blur-sm border-b border-white/[0.06] px-5 py-4 flex items-center justify-between z-10">
              <h2 className="text-base font-bold text-white">{editingItem ? 'Edit Item' : 'Add Coming Up Item'}</h2>
              <button onClick={() => setShowForm(false)} className="text-white/40 hover:text-white transition-colors">
                <X size={18} />
              </button>
            </div>

            <div className="px-5 py-4 space-y-4">
              {/* Title */}
              <div>
                <label className="text-xs text-white/40 uppercase font-semibold mb-1.5 block">Title</label>
                <input
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. Summer Single Release"
                  className="w-full px-3 py-2 rounded-xl bg-white/[0.06] border border-white/[0.08] text-white text-sm placeholder-white/20 focus:outline-none focus:border-red-500/40"
                />
              </div>

              {/* Type + Date */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-white/40 uppercase font-semibold mb-1.5 block">Type</label>
                  <select
                    value={form.type}
                    onChange={e => setForm(f => ({ ...f, type: e.target.value as ItemType }))}
                    className="w-full px-3 py-2 rounded-xl bg-white/[0.06] border border-white/[0.08] text-white text-sm focus:outline-none focus:border-red-500/40"
                  >
                    {(Object.keys(TYPE_CONFIG) as ItemType[]).map(t => (
                      <option key={t} value={t}>{TYPE_CONFIG[t].label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-white/40 uppercase font-semibold mb-1.5 block">Date</label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl bg-white/[0.06] border border-white/[0.08] text-white text-sm focus:outline-none focus:border-red-500/40"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="text-xs text-white/40 uppercase font-semibold mb-1.5 block">Description</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Short description..."
                  rows={3}
                  className="w-full px-3 py-2 rounded-xl bg-white/[0.06] border border-white/[0.08] text-white text-sm placeholder-white/20 resize-none focus:outline-none focus:border-red-500/40"
                />
              </div>

              {/* Cover URL */}
              <div>
                <label className="text-xs text-white/40 uppercase font-semibold mb-1.5 block">Cover Image URL</label>
                <input
                  value={form.coverUrl}
                  onChange={e => setForm(f => ({ ...f, coverUrl: e.target.value }))}
                  placeholder="https://..."
                  className="w-full px-3 py-2 rounded-xl bg-white/[0.06] border border-white/[0.08] text-white text-sm placeholder-white/20 focus:outline-none focus:border-red-500/40"
                />
              </div>

              {/* Link project */}
              <div>
                <label className="text-xs text-white/40 uppercase font-semibold mb-1.5 block">Link Project</label>
                {form.linkedProjectId ? (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.06] border border-white/[0.08]">
                    <Link size={14} className="text-white/40 flex-shrink-0" />
                    <span className="text-sm text-white flex-1 truncate">{form.linkedProjectTitle}</span>
                    <button onClick={unlinkProject} className="text-white/30 hover:text-red-400 transition-colors"><X size={14} /></button>
                  </div>
                ) : (
                  <div className="relative">
                    <button
                      onClick={() => setShowProjectPicker(v => !v)}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.06] border border-white/[0.08] text-white/40 hover:text-white/70 text-sm transition-colors"
                    >
                      <Link size={14} />
                      <span>Select a project...</span>
                    </button>
                    {showProjectPicker && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-neutral-900 border border-white/[0.08] rounded-xl overflow-hidden z-10 max-h-48 overflow-y-auto shadow-xl">
                        {projects.length === 0 && (
                          <p className="px-3 py-2 text-xs text-white/30">No projects found</p>
                        )}
                        {projects.map(p => (
                          <button
                            key={p.id}
                            onClick={() => linkProject(p)}
                            className="w-full flex items-center gap-2 px-3 py-2 hover:bg-white/[0.06] text-left text-sm text-white/70 hover:text-white transition-colors"
                          >
                            {p.coverUrl && <img src={p.coverUrl} alt="" className="w-6 h-6 rounded object-cover flex-shrink-0" />}
                            <span className="truncate">{p.title}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Buttons */}
              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => setShowForm(false)}
                  className="flex-1 py-2 rounded-xl bg-white/[0.06] border border-white/[0.08] text-white/60 text-sm hover:bg-white/[0.10] transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={!form.title.trim() || !form.date || saving}
                  className="flex-1 py-2 rounded-xl bg-red-600/80 hover:bg-red-600 text-white text-sm font-semibold transition-all disabled:opacity-40"
                >
                  {saving ? 'Saving...' : editingItem ? 'Save Changes' : 'Add Item'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Item Card ────────────────────────────────────────────────────────────────

const ItemCard: React.FC<{
  item: ComingUpItem;
  onEdit: (item: ComingUpItem) => void;
  onDelete: (id: string) => void;
}> = ({ item, onEdit, onDelete }) => {
  const cfg = TYPE_CONFIG[item.type];
  const dateObj = new Date(item.date + 'T00:00:00');
  const daysAway = Math.ceil((dateObj.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

  return (
    <div className="bg-white/[0.04] border border-white/[0.06] rounded-2xl overflow-hidden hover:border-white/[0.10] transition-all group">
      {/* Cover */}
      {item.coverUrl ? (
        <div className="w-full h-32 overflow-hidden">
          <img src={item.coverUrl} alt={item.title} className="w-full h-full object-cover" />
        </div>
      ) : (
        <div className="w-full h-32 bg-white/[0.03] flex items-center justify-center">
          <span className="text-white/10 text-4xl">{cfg.icon}</span>
        </div>
      )}

      <div className="p-4 space-y-2">
        {/* Type badge */}
        <div className="flex items-center gap-2 justify-between">
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${cfg.color}`}>
            {cfg.icon}
            {cfg.label}
          </span>
          {daysAway >= 0 && (
            <span className="text-[10px] text-white/30">
              {daysAway === 0 ? 'Today' : daysAway === 1 ? 'Tomorrow' : `${daysAway}d`}
            </span>
          )}
        </div>

        {/* Title */}
        <p className="text-sm font-semibold text-white leading-snug">{item.title}</p>

        {/* Date */}
        <p className="text-xs text-white/30">
          {dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </p>

        {/* Description */}
        {item.description && (
          <p className="text-xs text-white/40 line-clamp-2">{item.description}</p>
        )}

        {/* Linked project */}
        {item.linkedProjectTitle && (
          <div className="flex items-center gap-1 text-[10px] text-white/30">
            <Link size={10} />
            <span className="truncate">{item.linkedProjectTitle}</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-1 pt-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onEdit(item)}
            className="flex-1 py-1.5 rounded-lg text-xs text-white/50 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] transition-all flex items-center justify-center gap-1"
          >
            <Edit2 size={11} /> Edit
          </button>
          <button
            onClick={() => onDelete(item.id)}
            className="py-1.5 px-2 rounded-lg text-xs text-white/30 hover:text-red-400 bg-white/[0.04] hover:bg-red-500/10 transition-all"
          >
            <Trash2 size={11} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ComingUpTab;
