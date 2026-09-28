import React, { useEffect, useMemo, useState } from 'react';
import { Timestamp } from 'firebase/firestore';
import {
  Users, Plus, X, Link2, Unlink, Search, Download,
  ChevronDown, ChevronUp, FileAudio, FileText, Loader2, Trash2,
} from 'lucide-react';
import { deliverableService, fileUploadService, authService } from '../../lib/firebase/services';
import { ClientDeliverable, DeliverableFile, DeliverableType, User } from '../../lib/firebase/types';
import { useAuth } from '../../contexts/AuthContext';
import { useT } from '../../contexts/LanguageContext';

// ============================================
// Grouping helpers
// ============================================

interface ClientGroup {
  email: string;
  name: string;
  deliverables: ClientDeliverable[];
  linked: boolean;
}

function groupByClient(deliverables: ClientDeliverable[]): ClientGroup[] {
  const map = new Map<string, ClientGroup>();
  for (const d of deliverables) {
    const key = (d.clientEmail || '').toLowerCase().trim();
    if (!key) continue;
    let g = map.get(key);
    if (!g) {
      // `deliverables` is already ordered by completedAt desc (from getAll()),
      // so the first record we see per client is their most recent one —
      // use its name as the display name for the group.
      g = { email: key, name: d.clientName, deliverables: [], linked: false };
      map.set(key, g);
    }
    g.deliverables.push(d);
    if (d.clientUserId) g.linked = true;
  }
  return Array.from(map.values()).sort((a, b) => {
    const at = a.deliverables[0]?.completedAt?.toMillis?.() ?? 0;
    const bt = b.deliverables[0]?.completedAt?.toMillis?.() ?? 0;
    return bt - at;
  });
}

function formatDate(ts?: Timestamp): string {
  if (!ts) return '—';
  try {
    return ts.toDate().toLocaleDateString('nl-NL', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return '—';
  }
}

function formatBytes(bytes?: number): string {
  if (!bytes) return '';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.max(0, Math.floor(Math.log(bytes) / Math.log(k)));
  return `${Math.round((bytes / Math.pow(k, i)) * 10) / 10} ${sizes[i]}`;
}

// ============================================
// Main content
// ============================================

export function ClientsContent() {
  const t = useT();
  const [deliverables, setDeliverables] = useState<ClientDeliverable[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');

  const [showAddModal, setShowAddModal] = useState(false);
  const [prefillClient, setPrefillClient] = useState<{ name: string; email: string } | null>(null);
  const [linkTarget, setLinkTarget] = useState<ClientGroup | null>(null);

  const load = () => {
    setLoading(true);
    setError(null);
    deliverableService
      .getAll()
      .then(setDeliverables)
      .catch((e) => setError(e.message || 'Failed to load'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const groups = useMemo(() => groupByClient(deliverables), [deliverables]);

  const filteredGroups = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return groups;
    return groups.filter(
      (g) => g.name.toLowerCase().includes(q) || g.email.toLowerCase().includes(q)
    );
  }, [groups, search]);

  const toggleExpanded = (email: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(email)) next.delete(email);
      else next.add(email);
      return next;
    });
  };

  const openAddForClient = (g: ClientGroup | null) => {
    setPrefillClient(g ? { name: g.name, email: g.email } : null);
    setShowAddModal(true);
  };

  const handleAdded = (deliverable: ClientDeliverable) => {
    setDeliverables((prev) => [deliverable, ...prev]);
    setShowAddModal(false);
    setPrefillClient(null);
  };

  const handleUnlink = async (g: ClientGroup) => {
    if (!confirm(t(`Unlink ${g.name} from their account?`, `${g.name} loskoppelen van hun account?`))) return;
    try {
      await Promise.all(g.deliverables.map((d) => deliverableService.unlinkFromUser(d.id)));
      setDeliverables((prev) =>
        prev.map((d) =>
          (d.clientEmail || '').toLowerCase().trim() === g.email
            ? { ...d, clientUserId: undefined }
            : d
        )
      );
    } catch (e: any) {
      alert(e.message || 'Failed to unlink');
    }
  };

  const handleLinked = (g: ClientGroup, uid: string, email: string) => {
    setDeliverables((prev) =>
      prev.map((d) =>
        (d.clientEmail || '').toLowerCase().trim() === g.email
          ? { ...d, clientUserId: uid, clientEmail: email.toLowerCase().trim() }
          : d
      )
    );
    setLinkTarget(null);
  };

  const handleDelete = async (d: ClientDeliverable) => {
    if (!confirm(t(`Delete "${d.title}"? This cannot be undone.`, `"${d.title}" verwijderen? Dit kan niet ongedaan gemaakt worden.`))) return;
    try {
      await deliverableService.delete(d.id);
      setDeliverables((prev) => prev.filter((x) => x.id !== d.id));
    } catch (e: any) {
      alert(e.message || 'Failed to delete');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white">{t('Clients', 'Klanten')}</h2>
          <p className="text-sm text-white/40 mt-1">
            {t(
              'Per-client archive of delivered mix & master and studio session work.',
              'Per-klant archief van geleverde mix & master en studio sessie werk.'
            )}
          </p>
        </div>
        <button
          onClick={() => openAddForClient(null)}
          className="bg-gradient-to-r from-red-600 to-orange-600 text-white px-5 py-2.5 rounded-lg font-semibold hover:from-red-700 hover:to-orange-700 transition-all flex items-center justify-center gap-2 flex-shrink-0"
        >
          <Plus size={18} />
          {t('Add deliverable', 'Levering toevoegen')}
        </button>
      </div>

      <div className="relative max-w-sm">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('Search clients by name or email...', 'Zoek klanten op naam of e-mail...')}
          className="w-full pl-9 pr-3 py-2 bg-white/[0.06] border border-white/[0.08] rounded-lg text-sm text-white placeholder-white/30 focus:outline-none focus:border-white/[0.2]"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-white/40 gap-2">
          <Loader2 size={18} className="animate-spin" />
          {t('Loading...', 'Laden...')}
        </div>
      ) : error ? (
        <p className="text-red-400 text-sm">{error}</p>
      ) : filteredGroups.length === 0 ? (
        <div className="text-center py-16 text-white/30">
          <Users size={32} className="mx-auto mb-3 opacity-40" />
          <p className="text-sm">{t('No clients yet.', 'Nog geen klanten.')}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredGroups.map((g) => {
            const isOpen = expanded.has(g.email);
            return (
              <div
                key={g.email}
                className="rounded-xl bg-white/[0.05] border border-white/[0.08] overflow-hidden"
              >
                <button
                  onClick={() => toggleExpanded(g.email)}
                  className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-white/[0.03] transition-colors"
                >
                  <span
                    className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                      g.linked ? 'bg-green-500' : 'bg-amber-400'
                    }`}
                    title={g.linked ? t('Linked to an account', 'Gekoppeld aan een account') : t('Not linked to an account', 'Niet gekoppeld aan een account')}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-white truncate">{g.name}</p>
                    <p className="text-xs text-white/40 truncate">{g.email}</p>
                  </div>
                  <span className="text-xs text-white/40 flex-shrink-0">
                    {g.deliverables.length} {g.deliverables.length === 1 ? t('item', 'item') : t('items', 'items')}
                  </span>
                  {isOpen ? <ChevronUp size={16} className="text-white/40 flex-shrink-0" /> : <ChevronDown size={16} className="text-white/40 flex-shrink-0" />}
                </button>

                {isOpen && (
                  <div className="border-t border-white/[0.08] px-4 py-4 space-y-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => openAddForClient(g)}
                        className="text-xs font-medium px-3 py-1.5 rounded-lg bg-white/[0.06] border border-white/[0.08] text-white/70 hover:text-white hover:bg-white/[0.1] transition-colors flex items-center gap-1.5"
                      >
                        <Plus size={13} />
                        {t('Add deliverable', 'Levering toevoegen')}
                      </button>
                      {g.linked ? (
                        <button
                          onClick={() => handleUnlink(g)}
                          className="text-xs font-medium px-3 py-1.5 rounded-lg bg-white/[0.06] border border-white/[0.08] text-white/70 hover:text-white hover:bg-white/[0.1] transition-colors flex items-center gap-1.5"
                        >
                          <Unlink size={13} />
                          {t('Unlink account', 'Account loskoppelen')}
                        </button>
                      ) : (
                        <button
                          onClick={() => setLinkTarget(g)}
                          className="text-xs font-medium px-3 py-1.5 rounded-lg bg-white/[0.06] border border-white/[0.08] text-white/70 hover:text-white hover:bg-white/[0.1] transition-colors flex items-center gap-1.5"
                        >
                          <Link2 size={13} />
                          {t('Link to account', 'Koppelen aan account')}
                        </button>
                      )}
                    </div>

                    <div className="space-y-2">
                      {g.deliverables.map((d) => (
                        <div
                          key={d.id}
                          className="rounded-lg bg-black/20 border border-white/[0.06] p-3.5"
                        >
                          <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span
                                  className={`text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full ${
                                    d.type === 'mix-master'
                                      ? 'bg-purple-500/20 text-purple-300'
                                      : 'bg-blue-500/20 text-blue-300'
                                  }`}
                                >
                                  {d.type === 'mix-master' ? t('Mix & Master', 'Mix & Master') : t('Studio Session', 'Studio Sessie')}
                                </span>
                                <p className="text-sm font-semibold text-white">{d.title}</p>
                              </div>
                              <p className="text-xs text-white/40 mt-1">
                                {t('Completed', 'Afgerond')}: {formatDate(d.completedAt)}
                              </p>
                              {d.notes && <p className="text-xs text-white/50 mt-1.5 whitespace-pre-wrap">{d.notes}</p>}
                            </div>
                            <button
                              onClick={() => handleDelete(d)}
                              className="text-white/25 hover:text-red-400 transition-colors flex-shrink-0"
                              title={t('Delete', 'Verwijderen')}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                          {d.files?.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2">
                              {d.files.map((f, idx) => (
                                <a
                                  key={idx}
                                  href={f.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  download
                                  className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg bg-white/[0.06] border border-white/[0.08] text-white/70 hover:text-white hover:bg-white/[0.1] transition-colors"
                                >
                                  <Download size={12} />
                                  <span className="max-w-[14rem] truncate">{f.name}</span>
                                  {f.sizeBytes ? <span className="text-white/30">({formatBytes(f.sizeBytes)})</span> : null}
                                </a>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {showAddModal && (
        <AddDeliverableModal
          prefill={prefillClient}
          onClose={() => {
            setShowAddModal(false);
            setPrefillClient(null);
          }}
          onSaved={handleAdded}
        />
      )}

      {linkTarget && (
        <LinkAccountModal
          client={linkTarget}
          onClose={() => setLinkTarget(null)}
          onLinked={(uid, email) => handleLinked(linkTarget, uid, email)}
        />
      )}
    </div>
  );
}

// ============================================
// Add Deliverable Modal
// ============================================

interface PendingFile {
  file: File;
  status: 'pending' | 'uploading' | 'done' | 'error';
  result?: DeliverableFile;
  error?: string;
}

function AddDeliverableModal({
  prefill,
  onClose,
  onSaved,
}: {
  prefill: { name: string; email: string } | null;
  onClose: () => void;
  onSaved: (d: ClientDeliverable) => void;
}) {
  const t = useT();
  const { user } = useAuth();
  const [clientName, setClientName] = useState(prefill?.name || '');
  const [clientEmail, setClientEmail] = useState(prefill?.email || '');
  const [type, setType] = useState<DeliverableType>('mix-master');
  const [title, setTitle] = useState('');
  const [completedAt, setCompletedAt] = useState(() => new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState('');
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFilesSelected = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    const newEntries: PendingFile[] = Array.from(fileList).map((file) => ({ file, status: 'pending' }));
    setPendingFiles((prev) => [...prev, ...newEntries]);

    for (const entry of newEntries) {
      setPendingFiles((prev) =>
        prev.map((p) => (p.file === entry.file ? { ...p, status: 'uploading' } : p))
      );
      try {
        const uploadType = entry.file.type.startsWith('audio/')
          ? 'audio'
          : entry.file.type.startsWith('video/')
          ? 'video'
          : 'document';
        const res = await fileUploadService.uploadFile({
          file: entry.file,
          type: uploadType,
          folder: 'deliverables',
        });
        if (res.success && res.url) {
          setPendingFiles((prev) =>
            prev.map((p) =>
              p.file === entry.file
                ? { ...p, status: 'done', result: { name: entry.file.name, url: res.url!, sizeBytes: entry.file.size } }
                : p
            )
          );
        } else {
          setPendingFiles((prev) =>
            prev.map((p) => (p.file === entry.file ? { ...p, status: 'error', error: res.error || 'Upload failed' } : p))
          );
        }
      } catch (e: any) {
        setPendingFiles((prev) =>
          prev.map((p) => (p.file === entry.file ? { ...p, status: 'error', error: e.message || 'Upload failed' } : p))
        );
      }
    }
  };

  const removeFile = (file: File) => {
    setPendingFiles((prev) => prev.filter((p) => p.file !== file));
  };

  const isUploading = pendingFiles.some((p) => p.status === 'uploading');
  const readyFiles = pendingFiles.filter((p) => p.status === 'done' && p.result).map((p) => p.result!);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!clientName.trim() || !clientEmail.trim() || !title.trim()) {
      setError(t('Please fill in client name, email and title.', 'Vul klantnaam, e-mail en titel in.'));
      return;
    }
    if (isUploading) {
      setError(t('Please wait for file uploads to finish.', 'Wacht tot de bestanden klaar zijn met uploaden.'));
      return;
    }

    setSaving(true);
    try {
      const id = await deliverableService.create({
        type,
        title: title.trim(),
        clientName: clientName.trim(),
        clientEmail: clientEmail.trim(),
        files: readyFiles,
        notes: notes.trim() || undefined,
        completedAt: Timestamp.fromDate(new Date(completedAt)),
        createdBy: user?.uid || '',
      });
      const created = await deliverableService.getById(id);
      if (created) onSaved(created);
    } catch (e: any) {
      setError(e.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xl z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white/[0.10] backdrop-blur-2xl border border-white/[0.10] rounded-2xl max-w-lg w-full my-auto max-h-[90vh] flex flex-col">
        <div className="p-6 border-b border-white/[0.08] bg-white/[0.10] flex-shrink-0 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">{t('Add Deliverable', 'Levering Toevoegen')}</h2>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {error && <p className="text-red-400 text-sm">{error}</p>}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white/60 mb-2">
                {t('Client name', 'Klantnaam')} <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="w-full px-4 py-2 bg-white/[0.06] border border-white/[0.08] rounded-lg text-white"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/60 mb-2">
                {t('Client email', 'Klant e-mail')} <span className="text-red-400">*</span>
              </label>
              <input
                type="email"
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
                className="w-full px-4 py-2 bg-white/[0.06] border border-white/[0.08] rounded-lg text-white"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white/60 mb-2">{t('Type', 'Type')}</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as DeliverableType)}
                className="w-full px-4 py-2 bg-white/[0.06] border border-white/[0.08] rounded-lg text-white"
              >
                <option value="mix-master" className="bg-neutral-900">{t('Mix & Master', 'Mix & Master')}</option>
                <option value="studio-session" className="bg-neutral-900">{t('Studio Session', 'Studio Sessie')}</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-white/60 mb-2">{t('Completed on', 'Afgerond op')}</label>
              <input
                type="date"
                value={completedAt}
                onChange={(e) => setCompletedAt(e.target.value)}
                className="w-full px-4 py-2 bg-white/[0.06] border border-white/[0.08] rounded-lg text-white"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-white/60 mb-2">
              {t('Title', 'Titel')} <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t('e.g. "Midnight Drive - Final Mix"', 'bijv. "Midnight Drive - Final Mix"')}
              className="w-full px-4 py-2 bg-white/[0.06] border border-white/[0.08] rounded-lg text-white"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white/60 mb-2">{t('Notes', 'Notities')}</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-4 py-2 bg-white/[0.06] border border-white/[0.08] rounded-lg text-white resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white/60 mb-2">{t('Files', 'Bestanden')}</label>
            <label className="flex items-center justify-center gap-2 w-full px-4 py-4 border-2 border-dashed border-white/[0.15] rounded-lg text-white/50 hover:text-white/70 hover:border-white/[0.25] cursor-pointer transition-colors text-sm">
              <FileAudio size={16} />
              {t('Click to select files to upload', 'Klik om bestanden te selecteren')}
              <input
                type="file"
                multiple
                onChange={(e) => handleFilesSelected(e.target.files)}
                className="hidden"
              />
            </label>

            {pendingFiles.length > 0 && (
              <div className="mt-3 space-y-1.5">
                {pendingFiles.map((p, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 text-xs px-3 py-2 rounded-lg bg-white/[0.05] border border-white/[0.08]"
                  >
                    <FileText size={13} className="text-white/40 flex-shrink-0" />
                    <span className="truncate flex-1 text-white/70">{p.file.name}</span>
                    {p.status === 'uploading' && <Loader2 size={13} className="animate-spin text-white/40" />}
                    {p.status === 'done' && <span className="text-green-400">{t('Uploaded', 'Geupload')}</span>}
                    {p.status === 'error' && <span className="text-red-400" title={p.error}>{t('Failed', 'Mislukt')}</span>}
                    <button type="button" onClick={() => removeFile(p.file)} className="text-white/30 hover:text-white flex-shrink-0">
                      <X size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center justify-end space-x-4 pt-4 border-t border-white/[0.06] bg-white/[0.10] -mx-6 px-6 py-4 flex-shrink-0">
            <button type="button" onClick={onClose} className="px-6 py-2 text-white/40 hover:text-white transition-colors">
              {t('Cancel', 'Annuleren')}
            </button>
            <button
              type="submit"
              disabled={saving || isUploading}
              className="bg-gradient-to-r from-red-600 to-orange-600 text-white px-6 py-2 rounded-lg font-semibold hover:from-red-700 hover:to-orange-700 transition-all disabled:opacity-50"
            >
              {saving ? t('Saving...', 'Opslaan...') : t('Save', 'Opslaan')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============================================
// Link Account Modal
// ============================================

function LinkAccountModal({
  client,
  onClose,
  onLinked,
}: {
  client: ClientGroup;
  onClose: () => void;
  onLinked: (uid: string, email: string) => void;
}) {
  const t = useT();
  const [search, setSearch] = useState(client.name || client.email);
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [selected, setSelected] = useState<User | null>(null);
  const [linking, setLinking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    authService
      .getAllUsers()
      .then(setUsers)
      .finally(() => setLoadingUsers(false));
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) => (u.displayName || '').toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
    );
  }, [users, search]);

  const handleConfirm = async () => {
    if (!selected) return;
    setLinking(true);
    setError(null);
    try {
      await Promise.all(
        client.deliverables.map((d) => deliverableService.linkToUser(d.id, selected.uid, selected.email))
      );
      onLinked(selected.uid, selected.email);
    } catch (e: any) {
      setError(e.message || 'Failed to link');
    } finally {
      setLinking(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-black/95 border border-white/[0.12] rounded-2xl p-6 max-w-md w-full max-h-[30rem] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between mb-4 flex-shrink-0">
          <h3 className="text-lg font-semibold text-white">{t('Link to account', 'Koppelen aan account')}</h3>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>
        <p className="text-xs text-white/40 mb-4 flex-shrink-0">
          {t(
            `Linking will match every deliverable for ${client.name} (${client.email}) to the selected account.`,
            `Koppelen matcht alle leveringen voor ${client.name} (${client.email}) aan het gekozen account.`
          )}
        </p>

        {error && <p className="text-red-400 text-xs mb-3 flex-shrink-0">{error}</p>}

        {!selected ? (
          <>
            <div className="relative mb-4 flex-shrink-0">
              <Search size={14} className="absolute left-3 top-3 text-white/30" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t('Search users by name or email...', 'Zoek gebruikers op naam of e-mail...')}
                className="w-full pl-10 pr-3 py-2 bg-white/[0.06] border border-white/[0.1] rounded-lg text-sm text-white placeholder-white/30 focus:outline-none focus:border-white/[0.2]"
              />
            </div>
            <div className="flex-1 overflow-y-auto space-y-2 min-h-0">
              {loadingUsers ? (
                <p className="text-center text-white/30 text-sm py-8">{t('Loading users...', 'Gebruikers laden...')}</p>
              ) : filtered.length === 0 ? (
                <p className="text-center text-white/30 text-sm py-8">{t('No users found', 'Geen gebruikers gevonden')}</p>
              ) : (
                filtered.map((u) => (
                  <button
                    key={u.uid}
                    onClick={() => setSelected(u)}
                    className="w-full p-3 rounded-lg bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.08] text-left transition-colors"
                  >
                    <p className="text-sm font-semibold text-white truncate">{u.displayName || u.email}</p>
                    <p className="text-xs text-white/40 truncate">{u.email}</p>
                  </button>
                ))
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col min-h-0">
            <div className="mb-4 p-3 rounded-lg bg-white/[0.05] border border-white/[0.08] flex items-center justify-between flex-shrink-0">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white truncate">{selected.displayName || selected.email}</p>
                <p className="text-xs text-white/40 truncate">{selected.email}</p>
              </div>
              <button onClick={() => setSelected(null)} className="text-white/40 hover:text-white transition-colors flex-shrink-0">
                <X size={16} />
              </button>
            </div>
            <div className="flex-1" />
            <button
              onClick={handleConfirm}
              disabled={linking}
              className="w-full bg-gradient-to-r from-red-600 to-orange-600 text-white px-4 py-2.5 rounded-lg font-semibold hover:from-red-700 hover:to-orange-700 transition-all disabled:opacity-50 flex-shrink-0"
            >
              {linking ? t('Linking...', 'Koppelen...') : t('Confirm link', 'Koppeling bevestigen')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
