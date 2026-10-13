import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ShoppingBag, MessageCircle, UserPlus, CalendarDays, ArrowRight, Music, Disc3, Receipt,
  Sparkles, TrendingUp, TrendingDown, Play, CheckCircle2, Plus, Inbox,
} from 'lucide-react';
import { collection, getDocs, onSnapshot, orderBy, query, limit, where } from 'firebase/firestore';
import AdminLayout from '../../components/admin/AdminLayout';
import { useOrders } from '../../hooks/useOrders';
import { db } from '../../lib/firebase/config';
import { getAgendaTasksByMonth } from '../../lib/firebase/services/agendaService';
import { AgendaTask, Beat } from '../../lib/firebase/types';

const TYPE_LABELS: Record<string, string> = {
  beat: 'Beat', track: 'Track', remix: 'Remix', edit: 'Edit', service: 'Service',
};

const PAID = new Set(['completed', 'processing', 'pending']);
const isStaff = (role?: string) => role === 'admin' || role === 'manager';

const ms = (ts: any): number => (ts?.seconds ? ts.seconds * 1000 : typeof ts === 'number' ? ts : 0);
const euro = (n: number) => `€${n.toLocaleString('nl-NL', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
const ymd = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

function ago(t: number): string {
  if (!t) return '';
  const min = Math.round((Date.now() - t) / 60000);
  if (min < 60) return `${Math.max(1, min)} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `${h} u`;
  const d = Math.round(h / 24);
  return d === 1 ? 'gisteren' : `${d} dagen`;
}

function greeting(): string {
  const h = new Date().getHours();
  if (h < 6) return 'Goedenacht';
  if (h < 12) return 'Goedemorgen';
  if (h < 18) return 'Goedemiddag';
  return 'Goedenavond';
}

interface InboxMsg { id: string; senderId: string; senderName: string; message: string; createdAt: any; status?: string; senderRole?: string; category?: string }
interface ArtistReq { id: string; artistName?: string; status?: string; createdAt?: any }

const Card: React.FC<{ title: string; to?: string; linkLabel?: string; children: React.ReactNode; className?: string }> = ({ title, to, linkLabel = 'Alles bekijken', children, className = '' }) => (
  <section className={`bg-white/[0.06] border border-white/[0.07] rounded-3xl p-5 sm:p-6 ${className}`}>
    <div className="flex items-center justify-between mb-4 gap-3">
      <h2 className="text-base font-bold text-white">{title}</h2>
      {to && (
        <Link to={to} className="inline-flex items-center gap-1 text-xs text-white/40 hover:text-white transition-colors min-h-[44px] px-1">
          {linkLabel} <ArrowRight size={12} />
        </Link>
      )}
    </div>
    {children}
  </section>
);

const Empty: React.FC<{ icon: React.ElementType; text: string }> = ({ icon: Icon, text }) => (
  <div className="flex flex-col items-center justify-center py-8 text-center">
    <Icon size={22} className="text-white/20 mb-2" aria-hidden="true" />
    <p className="text-sm text-white/35">{text}</p>
  </div>
);

const DashboardPage: React.FC = () => {
  const { orders } = useOrders();
  const [beats, setBeats] = useState<Beat[]>([]);
  const [messages, setMessages] = useState<InboxMsg[]>([]);
  const [requests, setRequests] = useState<ArtistReq[]>([]);
  const [tasks, setTasks] = useState<AgendaTask[]>([]);

  // Whole catalogue (the old count stopped at 20)
  useEffect(() => {
    getDocs(collection(db, 'beats'))
      .then((snap) => setBeats(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Beat))))
      .catch((e) => console.error(e));
  }, []);

  // Latest inbox messages, live
  useEffect(() => {
    const q = query(collection(db, 'supportMessages'), orderBy('createdAt', 'desc'), limit(150));
    return onSnapshot(q, (snap) => setMessages(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }))), (e) => console.error(e));
  }, []);

  // Open artist requests, live
  useEffect(() => {
    const q = query(collection(db, 'artistRoleRequests'), where('status', '==', 'pending'));
    return onSnapshot(q, (snap) => setRequests(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }))), (e) => console.error(e));
  }, []);

  // Agenda: the next 7 days (can span two months)
  useEffect(() => {
    const now = new Date();
    const next = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    Promise.all([
      getAgendaTasksByMonth(now.getFullYear(), now.getMonth()),
      getAgendaTasksByMonth(next.getFullYear(), next.getMonth()),
    ])
      .then(([a, b]) => setTasks([...a, ...b]))
      .catch((e) => console.error(e));
  }, []);

  const today = ymd(new Date());
  const weekEnd = ymd(new Date(Date.now() + 7 * 86400000));

  const upcoming = useMemo(
    () => tasks
      .filter((t) => t.date && t.date >= today && t.date <= weekEnd && !t.completed)
      .sort((a, b) => `${a.date} ${a.time || ''}`.localeCompare(`${b.date} ${b.time || ''}`))
      .slice(0, 6),
    [tasks, today, weekEnd]
  );

  const actionOrders = useMemo(
    () => orders
      .filter((o) => o.status === 'pending' || o.status === 'processing')
      .sort((a, b) => ms(a.createdAt) - ms(b.createdAt)),
    [orders]
  );

  // One row per person with unread messages, newest first
  const unreadThreads = useMemo(() => {
    const map = new Map<string, { msg: InboxMsg; count: number }>();
    messages.forEach((m) => {
      if (isStaff(m.senderRole) || m.status === 'read') return;
      const cur = map.get(m.senderId);
      if (cur) cur.count++;
      else map.set(m.senderId, { msg: m, count: 1 });
    });
    return [...map.values()];
  }, [messages]);

  // Revenue per month, last 6 months
  const revenue = useMemo(() => {
    const now = new Date();
    const months = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
      return { key: `${d.getFullYear()}-${d.getMonth()}`, label: d.toLocaleDateString('nl-NL', { month: 'short' }).replace('.', ''), total: 0, count: 0 };
    });
    orders.forEach((o) => {
      if (!PAID.has(o.status)) return;
      const d = new Date(ms(o.createdAt));
      const m = months.find((x) => x.key === `${d.getFullYear()}-${d.getMonth()}`);
      if (m) { m.total += o.total || 0; m.count++; }
    });
    const cur = months[5];
    const prev = months[4];
    const change = prev.total > 0 ? Math.round(((cur.total - prev.total) / prev.total) * 100) : null;
    const max = Math.max(1, ...months.map((m) => m.total));
    return { months, cur, prev, change, max };
  }, [orders]);

  const catalogue = useMemo(() => {
    const published = beats.filter((b) => b.status === 'published').length;
    const drafts = beats.filter((b) => b.status === 'draft').length;
    const sold = beats.filter((b) => b.status === 'sold').length;
    const top = [...beats].sort((a, b) => (b.plays || 0) - (a.plays || 0)).slice(0, 5);
    const plays = beats.reduce((s, b) => s + (b.plays || 0), 0);
    return { published, drafts, sold, top, plays };
  }, [beats]);

  const todo = [
    { label: 'Bestellingen', sub: 'te verwerken', value: actionOrders.length, icon: ShoppingBag, to: '/admin/orders-stats?tab=orders', tone: 'amber' },
    { label: 'Berichten', sub: 'ongelezen gesprekken', value: unreadThreads.length, icon: MessageCircle, to: '/admin/board', tone: 'sky' },
    { label: 'Artist requests', sub: 'wachten op jou', value: requests.length, icon: UserPlus, to: '/admin/board', tone: 'violet' },
    { label: 'Agenda', sub: 'taken komende 7 dagen', value: upcoming.length, icon: CalendarDays, to: '/admin/services?tijd=agenda', tone: 'emerald' },
  ];
  const toneCls: Record<string, string> = {
    amber: 'bg-amber-500/15 text-amber-300 border-amber-400/25',
    sky: 'bg-sky-500/15 text-sky-300 border-sky-400/25',
    violet: 'bg-violet-500/15 text-violet-300 border-violet-400/25',
    emerald: 'bg-emerald-500/15 text-emerald-300 border-emerald-400/25',
  };
  const openTotal = todo.reduce((s, t) => s + t.value, 0);

  const dateLabel = new Date().toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <AdminLayout>
      <div className="space-y-5 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-white/35 font-bold">{dateLabel}</p>
            <h1 className="text-2xl sm:text-3xl font-black text-white mt-1">{greeting()}, Jonna</h1>
            <p className="text-sm text-white/45 mt-1">
              {openTotal === 0 ? 'Alles is bijgewerkt. Tijd voor muziek.' : `${openTotal} ${openTotal === 1 ? 'ding wacht' : 'dingen wachten'} op je aandacht.`}
            </p>
          </div>
          <div className="flex gap-2 overflow-x-auto -mx-1 px-1 pb-1">
            <Link to="/admin/management?tab=beats" className="inline-flex items-center gap-2 px-4 min-h-[44px] rounded-2xl bg-white text-black text-sm font-bold whitespace-nowrap hover:bg-white/90 transition-colors">
              <Plus size={16} /> Beat
            </Link>
            <Link to="/admin/management?tab=tracks" className="inline-flex items-center gap-2 px-4 min-h-[44px] rounded-2xl bg-white/[0.08] border border-white/10 text-white text-sm font-semibold whitespace-nowrap hover:bg-white/[0.14] transition-colors">
              <Plus size={16} /> Track
            </Link>
            <Link to="/" className="inline-flex items-center gap-2 px-4 min-h-[44px] rounded-2xl bg-white/[0.08] border border-white/10 text-white text-sm font-semibold whitespace-nowrap hover:bg-white/[0.14] transition-colors">
              Naar de site
            </Link>
          </div>
        </div>

        {/* To do now */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {todo.map((t) => {
            const Icon = t.icon;
            const active = t.value > 0;
            return (
              <Link
                key={t.label}
                to={t.to}
                className={`group rounded-3xl p-4 sm:p-5 border transition-all hover:-translate-y-0.5 ${active ? toneCls[t.tone] : 'bg-white/[0.04] border-white/[0.06] text-white/40'}`}
              >
                <div className="flex items-center justify-between">
                  <Icon size={18} aria-hidden="true" />
                  <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden="true" />
                </div>
                <p className={`text-3xl font-black mt-3 tabular-nums ${active ? 'text-white' : 'text-white/40'}`}>{t.value}</p>
                <p className="text-sm font-semibold mt-0.5 text-white/80">{t.label}</p>
                <p className="text-xs opacity-70">{t.sub}</p>
              </Link>
            );
          })}
        </div>

        {/* Revenue + agenda */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 sm:gap-6">
          <Card title="Omzet" to="/admin/analytics" linkLabel="Analytics" className="lg:col-span-3">
            <div className="flex flex-wrap items-end gap-x-6 gap-y-2">
              <div>
                <p className="text-xs text-white/40">Deze maand</p>
                <p className="text-4xl font-black text-white tabular-nums">{euro(revenue.cur.total)}</p>
              </div>
              {revenue.change !== null && (
                <span className={`inline-flex items-center gap-1 text-sm font-bold mb-1 ${revenue.change >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {revenue.change >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                  {revenue.change >= 0 ? '+' : ''}{revenue.change}% t.o.v. vorige maand
                </span>
              )}
            </div>
            <p className="text-xs text-white/40 mt-1">
              {revenue.cur.count} {revenue.cur.count === 1 ? 'bestelling' : 'bestellingen'}
              {revenue.cur.count > 0 && ` · gemiddeld ${euro(revenue.cur.total / revenue.cur.count)}`}
              {` · vorige maand ${euro(revenue.prev.total)}`}
            </p>
            <div className="flex items-end gap-2 sm:gap-3 h-32 mt-6" role="img" aria-label="Omzet per maand, laatste zes maanden">
              {revenue.months.map((m, i) => (
                <div key={m.key} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                  <span className="text-[10px] text-white/40 tabular-nums">{m.total ? euro(m.total) : ''}</span>
                  <div
                    className={`w-full rounded-xl transition-all ${i === 5 ? 'bg-gradient-to-t from-red-600 to-rose-400' : 'bg-white/[0.12]'}`}
                    style={{ height: `${Math.max(4, (m.total / revenue.max) * 100)}%` }}
                  />
                  <span className={`text-[11px] capitalize ${i === 5 ? 'text-white font-bold' : 'text-white/40'}`}>{m.label}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card title="Komende 7 dagen" to="/admin/services?tijd=agenda" linkLabel="Agenda" className="lg:col-span-2">
            {upcoming.length === 0 ? (
              <Empty icon={CalendarDays} text="Niets gepland deze week." />
            ) : (
              <ul className="space-y-2">
                {upcoming.map((t) => {
                  const d = new Date(`${t.date}T12:00:00`);
                  const isToday = t.date === today;
                  return (
                    <li key={t.id} className="flex items-center gap-3 p-3 rounded-2xl bg-white/[0.04]">
                      <div className={`w-11 h-11 rounded-xl flex flex-col items-center justify-center flex-shrink-0 ${isToday ? 'bg-red-600 text-white' : 'bg-white/[0.06] text-white/70'}`}>
                        <span className="text-[9px] uppercase font-bold leading-none">{d.toLocaleDateString('nl-NL', { weekday: 'short' }).replace('.', '')}</span>
                        <span className="text-base font-black leading-tight">{d.getDate()}</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-white font-semibold truncate">{t.title}</p>
                        <p className="text-xs text-white/40 truncate">
                          {isToday ? 'Vandaag' : d.toLocaleDateString('nl-NL', { weekday: 'long' })}
                          {t.time && ` · ${t.time}`}
                          {t.userDisplayName && ` · ${t.userDisplayName}`}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        </div>

        {/* Orders to handle + unread messages */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
          <Card title="Bestellingen om te verwerken" to="/admin/orders-stats?tab=orders">
            {actionOrders.length === 0 ? (
              <Empty icon={CheckCircle2} text="Alle bestellingen zijn verwerkt." />
            ) : (
              <ul className="space-y-2">
                {actionOrders.slice(0, 5).map((o) => {
                  const type = o.items?.[0]?.productType ?? 'beat';
                  return (
                    <li key={o.id}>
                      <Link to="/admin/orders-stats?tab=orders" className="flex items-center gap-3 p-3 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] transition-colors min-h-[56px]">
                        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${o.status === 'pending' ? 'bg-amber-400' : 'bg-sky-400'}`} aria-hidden="true" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm text-white font-semibold truncate">{o.items?.[0]?.productTitle || o.orderNumber}</p>
                          <p className="text-xs text-white/40 truncate">
                            {TYPE_LABELS[type] ?? type} · {o.customerName || o.customerEmail} · {ago(ms(o.createdAt))}
                          </p>
                        </div>
                        <p className="text-sm font-bold text-white tabular-nums">€{(o.total || 0).toFixed(2)}</p>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>

          <Card title="Nieuwe berichten" to="/admin/board" linkLabel="Naar chat">
            {unreadThreads.length === 0 && requests.length === 0 ? (
              <Empty icon={Inbox} text="Geen ongelezen berichten." />
            ) : (
              <ul className="space-y-2">
                {requests.slice(0, 2).map((r) => (
                  <li key={r.id}>
                    <Link to="/admin/board" className="flex items-center gap-3 p-3 rounded-2xl bg-violet-500/[0.08] hover:bg-violet-500/[0.14] transition-colors min-h-[56px]">
                      <UserPlus size={16} className="text-violet-300 flex-shrink-0" aria-hidden="true" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-white font-semibold truncate">{r.artistName || 'Nieuwe artiest'}</p>
                        <p className="text-xs text-white/40">Wil artiest worden · {ago(ms(r.createdAt))}</p>
                      </div>
                    </Link>
                  </li>
                ))}
                {unreadThreads.slice(0, 4).map(({ msg, count }) => (
                  <li key={msg.id}>
                    <Link to="/admin/board" className="flex items-center gap-3 p-3 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] transition-colors min-h-[56px]">
                      <span className="w-9 h-9 rounded-full bg-sky-500/20 text-sky-200 flex items-center justify-center text-sm font-bold flex-shrink-0">
                        {(msg.senderName || '?').charAt(0).toUpperCase()}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-white font-semibold truncate">{msg.senderName || 'Bezoeker'}</p>
                        <p className="text-xs text-white/45 truncate">{msg.message}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        <span className="text-[10px] text-white/35">{ago(ms(msg.createdAt))}</span>
                        {count > 1 && <span className="text-[10px] px-1.5 rounded-full bg-sky-500 text-white font-bold">{count}</span>}
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        {/* Catalogue */}
        <Card title="Beats" to="/admin/management?tab=beats" linkLabel="Beheren">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
            {[
              { label: 'Online', value: catalogue.published, icon: Music },
              { label: 'Concept', value: catalogue.drafts, icon: Disc3 },
              { label: 'Verkocht', value: catalogue.sold, icon: Receipt },
              { label: 'Keer afgespeeld', value: catalogue.plays.toLocaleString('nl-NL'), icon: Play },
            ].map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.label} className="p-4 rounded-2xl bg-white/[0.04]">
                  <Icon size={15} className="text-white/35 mb-2" aria-hidden="true" />
                  <p className="text-2xl font-black text-white tabular-nums">{s.value}</p>
                  <p className="text-xs text-white/40">{s.label}</p>
                </div>
              );
            })}
          </div>
          <p className="text-xs uppercase tracking-widest text-white/35 font-bold mb-2 flex items-center gap-1.5">
            <Sparkles size={12} aria-hidden="true" /> Meest beluisterd
          </p>
          {catalogue.top.length === 0 ? (
            <Empty icon={Music} text="Nog geen beats." />
          ) : (
            <ol className="divide-y divide-white/[0.06]">
              {catalogue.top.map((b, i) => (
                <li key={b.id}>
                  <Link to={`/shop/beats/${b.id}`} className="flex items-center gap-3 py-2.5 min-h-[52px] hover:bg-white/[0.03] rounded-xl px-1 transition-colors">
                    <span className="w-5 text-sm font-black text-white/30 tabular-nums">{i + 1}</span>
                    {b.artworkUrl ? (
                      <img src={b.artworkUrl.includes('/index.php/s/') && !b.artworkUrl.endsWith('/download') ? `${b.artworkUrl.replace(/\/$/, '')}/download` : b.artworkUrl} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" loading="lazy" />
                    ) : (
                      <span className="w-10 h-10 rounded-lg bg-white/[0.06] flex-shrink-0" aria-hidden="true" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-white font-semibold truncate">{b.title}</p>
                      <p className="text-xs text-white/40 truncate">{[b.bpm && `${b.bpm} BPM`, b.key, b.genre].filter(Boolean).join(' · ')}</p>
                    </div>
                    <span className="text-xs text-white/50 tabular-nums flex items-center gap-1"><Play size={11} aria-hidden="true" />{(b.plays || 0).toLocaleString('nl-NL')}</span>
                  </Link>
                </li>
              ))}
            </ol>
          )}
        </Card>
      </div>
    </AdminLayout>
  );
};

export default DashboardPage;
