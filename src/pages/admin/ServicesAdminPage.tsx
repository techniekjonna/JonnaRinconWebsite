import React, { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout';
import { ServiceFormModal } from './ServicesPage';
import { AgendaContent } from './AgendaPage';
import { SocialPlannerContent } from './ContentPage';
import ComingUpTab from '../../components/admin/ComingUpTab';
import { useServices } from '../../hooks/useServices';
import { serviceService } from '../../lib/firebase/services';
import { Service } from '../../lib/firebase/types';
import { useT } from '../../contexts/LanguageContext';
import {
  Plus,
  Pencil,
  Eye,
  EyeOff,
  Star,
  ExternalLink,
  Calendar,
  Instagram,
  Sparkles,
  Info,
  MessageSquare,
  Archive,
  ChevronDown,
} from 'lucide-react';

// One place to see and change what Jonna offers right now. New services are rare,
// so the focus is on the current ones: pick one, see everything, change it.
// The studio session also carries TIME (agenda, social planner, coming up),
// because the agenda decides which days can be booked on /studio-session.

const isStudioService = (s: Service) => {
  const n = (s.name || '').toLowerCase();
  const sl = (s.slug || '').toLowerCase();
  return n.includes('studio') || sl.includes('studio');
};

const isMixService = (s: Service) => {
  const n = (s.name || '').toLowerCase();
  const sl = (s.slug || '').toLowerCase();
  return n.includes('mix') || sl.includes('mix');
};

const publicLink = (s: Service) =>
  isStudioService(s) ? '/studio-session' : isMixService(s) ? '/mix-master' : `/shop/services/${s.id}`;

const euro = (n?: number) =>
  typeof n === 'number' && !isNaN(n) ? `€${n.toLocaleString('nl-NL', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}` : null;

type DetailTab = 'info' | 'agenda' | 'social' | 'coming-up';

const StatusBadge: React.FC<{ status: Service['status'] }> = ({ status }) => {
  const t = useT();
  const map = {
    published: { label: t('Live', 'Live'), cls: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20' },
    draft: { label: t('Draft', 'Concept'), cls: 'bg-amber-500/15 text-amber-400 border-amber-500/20' },
    archived: { label: t('Archived', 'Gearchiveerd'), cls: 'bg-white/[0.06] text-white/40 border-white/10' },
  } as const;
  const m = map[status] ?? map.draft;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-widest ${m.cls}`}>
      {m.label}
    </span>
  );
};

const Cover: React.FC<{ service: Service; className?: string }> = ({ service, className = '' }) =>
  service.coverUrl ? (
    <img src={service.coverUrl} alt={service.name} className={`object-cover ${className}`} />
  ) : (
    <div className={`bg-gradient-to-br ${service.gradient || 'from-red-600 to-orange-600'} ${className}`} />
  );

const ServicesAdminPage: React.FC = () => {
  const t = useT();
  const { services, loading } = useServices();
  const [params, setParams] = useSearchParams();
  const [editing, setEditing] = useState<Service | null>(null);
  const [creating, setCreating] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [busy, setBusy] = useState(false);

  // Live and draft first (live on top), archived tucked away
  const current = useMemo(
    () =>
      services
        .filter((s) => s.status !== 'archived')
        .sort((a, b) => (a.status === b.status ? a.name.localeCompare(b.name) : a.status === 'published' ? -1 : 1)),
    [services]
  );
  const archived = useMemo(() => services.filter((s) => s.status === 'archived'), [services]);

  const selectedId = params.get('service');
  const selected =
    services.find((s) => s.id === selectedId) ??
    (params.get('tijd') ? services.find(isStudioService) : undefined) ??
    current[0] ??
    null;
  const isStudio = !!selected && isStudioService(selected);

  const tabParam = params.get('tijd') as DetailTab | null;
  const activeTab: DetailTab = isStudio && tabParam && ['agenda', 'social', 'coming-up'].includes(tabParam) ? tabParam : 'info';

  const select = (id: string) =>
    setParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('service', id);
      next.delete('tijd');
      return next;
    });

  const setTab = (tab: DetailTab) =>
    setParams((prev) => {
      const next = new URLSearchParams(prev);
      if (selected) next.set('service', selected.id);
      if (tab === 'info') next.delete('tijd');
      else next.set('tijd', tab);
      return next;
    });

  // Keep the edit modal in sync with live data after saving
  useEffect(() => {
    if (editing) {
      const fresh = services.find((s) => s.id === editing.id);
      if (fresh && fresh !== editing) setEditing(fresh);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [services]);

  const setStatus = async (s: Service, status: Service['status']) => {
    setBusy(true);
    try {
      await serviceService.updateService(s.id, { status });
    } catch (e: any) {
      alert(e?.message || t('Could not save', 'Opslaan lukte niet'));
    } finally {
      setBusy(false);
    }
  };

  const toggleFeatured = async (s: Service) => {
    setBusy(true);
    try {
      await serviceService.updateService(s.id, { featured: !s.featured });
    } catch (e: any) {
      alert(e?.message || t('Could not save', 'Opslaan lukte niet'));
    } finally {
      setBusy(false);
    }
  };

  const tabs: { id: DetailTab; label: string; icon: React.ReactNode }[] = [
    { id: 'info', label: t('Service', 'Service'), icon: <Info size={15} /> },
    ...(isStudio
      ? [
          { id: 'agenda' as DetailTab, label: t('Agenda', 'Agenda'), icon: <Calendar size={15} /> },
          { id: 'social' as DetailTab, label: t('Social planner', 'Social planner'), icon: <Instagram size={15} /> },
          { id: 'coming-up' as DetailTab, label: t('Coming up', 'Coming up'), icon: <Sparkles size={15} /> },
        ]
      : []),
  ];

  const ServiceRow: React.FC<{ s: Service }> = ({ s }) => {
    const active = selected?.id === s.id;
    return (
      <button
        onClick={() => select(s.id)}
        className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
          active
            ? 'bg-white/[0.09] border-red-500/40'
            : 'bg-white/[0.03] border-white/[0.06] hover:bg-white/[0.06] hover:border-white/[0.12]'
        }`}
      >
        <Cover service={s} className="w-12 h-12 rounded-lg flex-shrink-0" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-white truncate">{s.name}</p>
            {s.featured && <Star size={12} className="text-amber-400 fill-amber-400 flex-shrink-0" />}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <StatusBadge status={s.status} />
            <span className="text-xs text-white/40">
              {t('from', 'vanaf')} {euro(s.rate)}
              {isStudioService(s) ? t('/hour', '/uur') : ''}
            </span>
          </div>
        </div>
      </button>
    );
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">Services</h1>
            <p className="text-white/40 mt-2">
              {t(
                'What you offer right now. Pick a service to view and change it.',
                'Wat je nu aanbiedt. Kies een service om hem in te zien en te wijzigen.'
              )}
            </p>
          </div>
          <button
            onClick={() => setCreating(true)}
            className="inline-flex items-center gap-2 min-h-[44px] px-4 rounded-xl border border-white/[0.1] text-sm font-semibold text-white/70 hover:text-white hover:bg-white/[0.06] transition-colors"
          >
            <Plus size={16} />
            {t('New service', 'Nieuwe service')}
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-white/20 border-t-red-600 rounded-full animate-spin" />
          </div>
        ) : services.length === 0 ? (
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-10 text-center">
            <p className="text-white/60">{t('No services yet.', 'Nog geen services.')}</p>
            <button
              onClick={() => setCreating(true)}
              className="mt-4 inline-flex items-center gap-2 min-h-[44px] px-5 rounded-xl bg-red-600 hover:bg-red-500 text-sm font-semibold text-white transition-colors"
            >
              <Plus size={16} />
              {t('Add your first service', 'Eerste service toevoegen')}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6 items-start">
            {/* List of services */}
            <aside className="space-y-2 lg:sticky lg:top-28">
              <p className="text-[11px] font-bold uppercase tracking-widest text-white/30 px-1">
                {t('Current services', 'Huidige services')} · {current.length}
              </p>
              {current.map((s) => (
                <ServiceRow key={s.id} s={s} />
              ))}
              {archived.length > 0 && (
                <div className="pt-2">
                  <button
                    onClick={() => setShowArchived((v) => !v)}
                    className="w-full flex items-center justify-between px-1 py-2 text-[11px] font-bold uppercase tracking-widest text-white/30 hover:text-white/60"
                  >
                    <span className="inline-flex items-center gap-1.5">
                      <Archive size={12} /> {t('Archived', 'Gearchiveerd')} · {archived.length}
                    </span>
                    <ChevronDown size={14} className={`transition-transform ${showArchived ? 'rotate-180' : ''}`} />
                  </button>
                  {showArchived && (
                    <div className="space-y-2 mt-1">
                      {archived.map((s) => (
                        <ServiceRow key={s.id} s={s} />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </aside>

            {/* Selected service */}
            {selected && (
              <section className="min-w-0 rounded-2xl border border-white/[0.08] bg-white/[0.03] overflow-hidden">
                <div className="relative">
                  <Cover service={selected} className="absolute inset-0 w-full h-full opacity-30 blur-2xl scale-110" />
                  <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-black/80" />
                  <div className="relative flex flex-col sm:flex-row gap-5 p-5 sm:p-6">
                    <Cover service={selected} className="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl flex-shrink-0 shadow-2xl" />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusBadge status={selected.status} />
                        {selected.featured && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-amber-400">
                            <Star size={11} className="fill-amber-400" /> {t('Featured', 'Uitgelicht')}
                          </span>
                        )}
                      </div>
                      <h2 className="text-2xl sm:text-3xl font-bold text-white mt-2 break-words">{selected.name}</h2>
                      <p className="text-white/50 text-sm mt-1">
                        {t('from', 'vanaf')} <span className="text-white font-semibold">{euro(selected.rate)}</span>
                        {isStudio ? t(' per hour', ' per uur') : ''}
                      </p>
                      <div className="flex flex-wrap gap-2 mt-4">
                        <button
                          onClick={() => setEditing(selected)}
                          className="inline-flex items-center gap-2 min-h-[44px] px-4 rounded-xl bg-red-600 hover:bg-red-500 text-sm font-semibold text-white transition-colors"
                        >
                          <Pencil size={15} /> {t('Edit', 'Wijzigen')}
                        </button>
                        {selected.status === 'published' ? (
                          <button
                            disabled={busy}
                            onClick={() => setStatus(selected, 'draft')}
                            className="inline-flex items-center gap-2 min-h-[44px] px-4 rounded-xl border border-white/[0.12] text-sm font-semibold text-white/70 hover:text-white hover:bg-white/[0.06] disabled:opacity-50 transition-colors"
                          >
                            <EyeOff size={15} /> {t('Take offline', 'Offline halen')}
                          </button>
                        ) : (
                          <button
                            disabled={busy}
                            onClick={() => setStatus(selected, 'published')}
                            className="inline-flex items-center gap-2 min-h-[44px] px-4 rounded-xl border border-emerald-500/30 text-sm font-semibold text-emerald-400 hover:bg-emerald-500/10 disabled:opacity-50 transition-colors"
                          >
                            <Eye size={15} /> {t('Put live', 'Live zetten')}
                          </button>
                        )}
                        {selected.status === 'published' && (
                          <Link
                            to={publicLink(selected)}
                            target="_blank"
                            className="inline-flex items-center gap-2 min-h-[44px] px-4 rounded-xl border border-white/[0.12] text-sm font-semibold text-white/70 hover:text-white hover:bg-white/[0.06] transition-colors"
                          >
                            <ExternalLink size={15} /> {t('View on site', 'Bekijk op site')}
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {tabs.length > 1 && (
                  <nav className="flex items-center gap-1 border-b border-white/[0.08] px-3 sm:px-5 overflow-x-auto">
                    {tabs.map((tab) => {
                      const active = activeTab === tab.id;
                      return (
                        <button
                          key={tab.id}
                          onClick={() => setTab(tab.id)}
                          className={`flex items-center gap-2 px-3 py-3 min-h-[44px] text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition-colors ${
                            active ? 'border-red-500 text-white' : 'border-transparent text-white/40 hover:text-white/70'
                          }`}
                        >
                          <span className={active ? 'text-red-400' : 'text-white/30'}>{tab.icon}</span>
                          {tab.label}
                        </button>
                      );
                    })}
                  </nav>
                )}

                <div className="p-5 sm:p-6">
                  {activeTab === 'info' && (
                    <div className="space-y-6">
                      {isStudio && (
                        <button
                          onClick={() => setTab('agenda')}
                          className="w-full flex items-center gap-3 p-4 rounded-xl bg-red-500/[0.08] border border-red-500/20 text-left hover:bg-red-500/[0.12] transition-colors"
                        >
                          <Calendar size={18} className="text-red-400 flex-shrink-0" />
                          <span className="text-sm text-white/70">
                            {t(
                              'Days you mark as available for studio in the agenda can be booked on the studio session page.',
                              'Dagen die je in de agenda op beschikbaar voor studio zet, zijn te boeken op de studiosessie-pagina.'
                            )}
                          </span>
                        </button>
                      )}

                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-widest text-white/30 mb-2">
                          {t('Description', 'Omschrijving')}
                        </p>
                        <p className="text-white/80 whitespace-pre-line leading-relaxed">
                          {selected.description || t('No description yet.', 'Nog geen omschrijving.')}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {[
                          { label: t('Base price', 'Basisprijs'), value: euro(selected.rate) },
                          { label: t('48 hours', '48 uur'), value: euro(selected.price48h) },
                          { label: t('72 hours', '72 uur'), value: euro(selected.price72h) },
                          { label: t('7 days', '7 dagen'), value: euro(selected.price7days) },
                        ].map((p) => (
                          <div key={p.label} className="rounded-xl bg-white/[0.04] border border-white/[0.06] p-3">
                            <p className="text-[11px] text-white/40">{p.label}</p>
                            <p className={`text-lg font-bold mt-0.5 ${p.value ? 'text-white' : 'text-white/20'}`}>
                              {p.value ?? '-'}
                            </p>
                          </div>
                        ))}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="rounded-xl bg-white/[0.04] border border-white/[0.06] p-4 flex items-center gap-3">
                          <MessageSquare size={18} className="text-white/40" />
                          <div>
                            <p className="text-[11px] text-white/40">{t('Inquiries', 'Aanvragen')}</p>
                            <p className="text-lg font-bold text-white">{selected.inquiries ?? 0}</p>
                          </div>
                        </div>
                        <button
                          disabled={busy}
                          onClick={() => toggleFeatured(selected)}
                          className="rounded-xl bg-white/[0.04] border border-white/[0.06] p-4 flex items-center gap-3 text-left hover:bg-white/[0.07] disabled:opacity-50 transition-colors"
                        >
                          <Star size={18} className={selected.featured ? 'text-amber-400 fill-amber-400' : 'text-white/40'} />
                          <div>
                            <p className="text-[11px] text-white/40">{t('Featured', 'Uitgelicht')}</p>
                            <p className="text-sm font-semibold text-white">
                              {selected.featured ? t('Yes, tap to turn off', 'Ja, tik om uit te zetten') : t('No, tap to turn on', 'Nee, tik om aan te zetten')}
                            </p>
                          </div>
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
                        <div>
                          <p className="text-[11px] text-white/40">{t('Button text', 'Knoptekst')}</p>
                          <p className="text-white/80">{selected.cta || '-'}</p>
                        </div>
                        <div>
                          <p className="text-[11px] text-white/40">Slug</p>
                          <p className="text-white/80 break-all">{selected.slug || '-'}</p>
                        </div>
                        <div>
                          <p className="text-[11px] text-white/40">{t('Search title', 'Titel in Google')}</p>
                          <p className="text-white/80">{selected.metaTitle || '-'}</p>
                        </div>
                        <div>
                          <p className="text-[11px] text-white/40">{t('Download link', 'Downloadlink')}</p>
                          {selected.downloadUrl ? (
                            <a href={selected.downloadUrl} target="_blank" rel="noreferrer" className="text-red-400 hover:text-red-300 break-all">
                              {t('Open', 'Openen')}
                            </a>
                          ) : (
                            <p className="text-white/80">-</p>
                          )}
                        </div>
                      </div>

                      <div className="flex justify-end pt-2 border-t border-white/[0.06]">
                        {selected.status !== 'archived' ? (
                          <button
                            disabled={busy}
                            onClick={() => {
                              if (confirm(t('Archive this service? It disappears from the site.', 'Deze service archiveren? Hij verdwijnt van de site.')))
                                setStatus(selected, 'archived');
                            }}
                            className="inline-flex items-center gap-2 min-h-[44px] px-3 text-sm text-white/40 hover:text-white/70 disabled:opacity-50"
                          >
                            <Archive size={15} /> {t('Archive', 'Archiveren')}
                          </button>
                        ) : (
                          <button
                            disabled={busy}
                            onClick={() => setStatus(selected, 'draft')}
                            className="inline-flex items-center gap-2 min-h-[44px] px-3 text-sm text-white/60 hover:text-white disabled:opacity-50"
                          >
                            <Archive size={15} /> {t('Restore as draft', 'Terugzetten als concept')}
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {isStudio && activeTab === 'agenda' && <AgendaContent />}
                  {isStudio && activeTab === 'social' && (
                    <div className="space-y-3">
                      <Link to="/admin/social" className="inline-flex items-center gap-1.5 text-xs text-white/50 hover:text-white min-h-[44px]">
                        {t('Open the full Social page (analytics, all channels)', 'Open de hele Social-pagina (analytics, alle kanalen)')} →
                      </Link>
                      <SocialPlannerContent />
                    </div>
                  )}
                  {isStudio && activeTab === 'coming-up' && <ComingUpTab />}
                </div>
              </section>
            )}
          </div>
        )}
      </div>

      {(editing || creating) && (
        <ServiceFormModal
          service={editing}
          onClose={() => {
            setEditing(null);
            setCreating(false);
          }}
          onSave={() => {
            setEditing(null);
            setCreating(false);
          }}
        />
      )}
    </AdminLayout>
  );
};

export default ServicesAdminPage;
