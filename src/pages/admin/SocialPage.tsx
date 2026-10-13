import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  AlertCircle, BarChart3, CalendarDays, CheckCircle2, ExternalLink, Eye, Heart, LayoutDashboard,
  Link2, MessageCircle, Plug, RefreshCw, Share2, Users, Bookmark, Clock, Plus,
} from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';
import { SocialPlannerContent } from './ContentPage';
import { useT } from '../../contexts/LanguageContext';
import {
  upCall, upPost, UploadPostError, PLATFORMS, platformInfo, connectedAccounts, fmtNum,
  getProfileName, setProfileName, type UploadPostProfile, type PlatformStats, type SocialAccount,
} from '../../lib/uploadPost';

// Social: one place for everything social, like Metricool. Overview of all
// accounts, the planner, analytics per platform and the account connections.
// Everything runs through Upload-Post via our own /api/upload-post function.

type Tab = 'overzicht' | 'planner' | 'analytics' | 'koppelingen';
const TABS: Tab[] = ['overzicht', 'planner', 'analytics', 'koppelingen'];

interface MediaItem {
  id: string;
  caption?: string | null;
  media_type?: string;
  media_url?: string | null;
  thumbnail_url?: string | null;
  permalink?: string | null;
  timestamp?: string;
  like_count?: number;
  comments_count?: number;
}

interface Scheduled {
  id: string;
  title: string;
  platforms: string[];
  date: string;
}

const engagementOf = (s?: PlatformStats) =>
  (s?.likes || 0) + (s?.comments || 0) + (s?.shares || 0) + (s?.saves || 0);

// ---------- small building blocks ----------

const Card: React.FC<{ className?: string; children: React.ReactNode }> = ({ className = '', children }) => (
  <div className={`rounded-2xl border border-white/[0.08] bg-white/[0.04] backdrop-blur-xl ${className}`}>{children}</div>
);

const Stat: React.FC<{ icon: React.ReactNode; label: string; value?: number; hint?: string }> = ({ icon, label, value, hint }) => (
  <Card className="p-4">
    <div className="flex items-center gap-2 text-white/45 text-xs uppercase tracking-widest font-semibold">
      {icon}
      {label}
    </div>
    <p className="mt-2 text-3xl font-black text-white tracking-tight">{fmtNum(value)}</p>
    {hint && <p className="text-xs text-white/35 mt-1">{hint}</p>}
  </Card>
);

const PlatformDot: React.FC<{ id: string; size?: number }> = ({ id, size = 10 }) => (
  <span className="inline-block rounded-full flex-shrink-0" style={{ width: size, height: size, backgroundColor: platformInfo(id).color }} />
);

// Simple line chart in SVG (no extra package). Series share one time axis.
const LineChart: React.FC<{ series: { id: string; points: { date: string; value: number }[] }[]; empty: string }> = ({ series, empty }) => {
  const all = series.flatMap((s) => s.points);
  if (all.length < 2) return <p className="text-sm text-white/35 py-10 text-center">{empty}</p>;
  const dates = Array.from(new Set(all.map((p) => p.date))).sort();
  const max = Math.max(1, ...all.map((p) => p.value));
  const W = 600, H = 180, P = 8;
  const x = (d: string) => P + (dates.indexOf(d) / Math.max(1, dates.length - 1)) * (W - 2 * P);
  const y = (v: number) => H - P - (v / max) * (H - 2 * P);
  const fmtDate = (d: string) => new Date(d).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' });
  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-44" preserveAspectRatio="none" role="img" aria-label="Bereik over tijd">
        {[0.25, 0.5, 0.75].map((f) => (
          <line key={f} x1={0} x2={W} y1={H * f} y2={H * f} stroke="rgba(255,255,255,0.06)" />
        ))}
        {series.map((s) => {
          const pts = [...s.points].sort((a, b) => a.date.localeCompare(b.date));
          if (pts.length < 2) return null;
          const d = pts.map((p, i) => `${i ? 'L' : 'M'}${x(p.date).toFixed(1)},${y(p.value).toFixed(1)}`).join(' ');
          const color = platformInfo(s.id).color;
          return (
            <g key={s.id}>
              <path d={`${d} L${x(pts[pts.length - 1].date)},${H} L${x(pts[0].date)},${H} Z`} fill={color} opacity={0.08} />
              <path d={d} fill="none" stroke={color} strokeWidth={2.5} vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
            </g>
          );
        })}
      </svg>
      <div className="flex justify-between text-[11px] text-white/30 mt-1">
        <span>{fmtDate(dates[0])}</span>
        <span>{fmtDate(dates[dates.length - 1])}</span>
      </div>
    </div>
  );
};

// ---------- page ----------

const SocialPage: React.FC = () => {
  const t = useT();
  const [params, setParams] = useSearchParams();
  const tab: Tab = TABS.includes(params.get('tab') as Tab) ? (params.get('tab') as Tab) : 'overzicht';
  const setTab = (id: Tab) => setParams((p) => { p.set('tab', id); return p; }, { replace: true });

  const [profiles, setProfiles] = useState<UploadPostProfile[]>([]);
  const [profileName, setProfileNameState] = useState(getProfileName());
  const [plan, setPlan] = useState('');
  const [stats, setStats] = useState<Record<string, PlatformStats>>({});
  const [scheduled, setScheduled] = useState<Scheduled[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const profile = useMemo(
    () => profiles.find((p) => p.username === profileName) || null,
    [profiles, profileName]
  );
  const accounts = useMemo(() => connectedAccounts(profile), [profile]);
  const connectedIds = useMemo(() => Object.keys(accounts), [accounts]);

  const chooseProfile = (name: string) => {
    setProfileName(name);
    setProfileNameState(name);
  };

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [users, me] = await Promise.all([
        upCall<{ profiles?: UploadPostProfile[] }>('/uploadposts/users'),
        upCall<{ plan?: string }>('/uploadposts/me').catch(() => ({ plan: '' })),
      ]);
      const list = users.profiles || [];
      setProfiles(list);
      setPlan(me.plan || '');
      let name = getProfileName();
      if ((!name || !list.some((p) => p.username === name)) && list.length) {
        name = list[0].username;
        chooseProfile(name);
      }
      const prof = list.find((p) => p.username === name);
      const ids = Object.keys(connectedAccounts(prof)).filter((id) => platformInfo(id).analytics);

      const [analytics, sched] = await Promise.all([
        ids.length && name
          ? upCall<Record<string, PlatformStats | { error?: string }>>(
              `/analytics/${encodeURIComponent(name)}?platforms=${ids.join(',')}`
            ).catch(() => ({}))
          : Promise.resolve({}),
        upCall<any>('/uploadposts/schedule').catch(() => ({ scheduled: [] })),
      ]);
      const clean: Record<string, PlatformStats> = {};
      Object.entries(analytics || {}).forEach(([k, v]) => {
        if (v && typeof v === 'object' && !('error' in v) && k !== 'success') clean[k] = v as PlatformStats;
      });
      setStats(clean);
      const raw = sched.scheduled || sched.data || sched.jobs || [];
      setScheduled(
        (Array.isArray(raw) ? raw : [])
          .map((it: any) => ({
            id: String(it.job_id || it.id || it._id || Math.random()),
            title: it.title || it.caption || t('Untitled', 'Zonder titel'),
            platforms: it.platforms || it.platform || [],
            date: it.scheduled_date || it.scheduledDate || it.date || '',
          }))
          .filter((s: Scheduled) => s.date)
          .sort((a: Scheduled, b: Scheduled) => a.date.localeCompare(b.date))
      );
    } catch (e) {
      setError(e instanceof UploadPostError ? e.message : t('Could not load social data', 'Social gegevens laden lukte niet'));
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { load(); }, [load]);

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'overzicht', label: t('Overview', 'Overzicht'), icon: <LayoutDashboard size={15} /> },
    { id: 'planner', label: t('Planner', 'Planner'), icon: <CalendarDays size={15} /> },
    { id: 'analytics', label: 'Analytics', icon: <BarChart3 size={15} /> },
    { id: 'koppelingen', label: t('Connections', 'Koppelingen'), icon: <Plug size={15} /> },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">Social</h1>
            <p className="text-white/40 mt-2">
              {t(
                'Plan, post and measure all your channels in one place.',
                'Plan, post en meet al je kanalen op één plek.'
              )}
              {profileName && <span className="text-white/60"> @{profileName}</span>}
              {plan && <span className="text-white/30"> · Upload-Post {plan}</span>}
            </p>
          </div>
          <button
            onClick={load}
            disabled={loading}
            className="flex items-center gap-2 px-4 min-h-[44px] rounded-xl bg-white/[0.06] border border-white/[0.08] text-white/70 hover:text-white hover:bg-white/[0.1] transition disabled:opacity-50"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            {t('Refresh', 'Vernieuwen')}
          </button>
        </div>

        <div className="flex gap-1 overflow-x-auto pb-1 -mx-1 px-1" role="tablist">
          {tabs.map((tb) => (
            <button
              key={tb.id}
              role="tab"
              aria-selected={tab === tb.id}
              onClick={() => setTab(tb.id)}
              className={`flex items-center gap-2 px-4 min-h-[44px] rounded-xl text-sm font-semibold whitespace-nowrap transition ${
                tab === tb.id ? 'bg-white/[0.1] text-white border border-red-500/40' : 'text-white/45 hover:text-white/80 border border-transparent'
              }`}
            >
              {tb.icon}
              {tb.label}
            </button>
          ))}
        </div>

        {error && tab !== 'planner' && (
          <div className="flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
            <AlertCircle size={18} className="mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {tab === 'overzicht' && (
          <Overview
            loading={loading}
            stats={stats}
            accounts={accounts}
            scheduled={scheduled}
            onGo={setTab}
          />
        )}
        {tab === 'planner' && <SocialPlannerContent />}
        {tab === 'analytics' && (
          <Analytics profileName={profileName} stats={stats} connectedIds={connectedIds} onGo={setTab} />
        )}
        {tab === 'koppelingen' && (
          <Connections
            profiles={profiles}
            profileName={profileName}
            accounts={accounts}
            onChoose={chooseProfile}
            onReload={load}
          />
        )}
      </div>
    </AdminLayout>
  );
};

// ---------- Overzicht ----------

const Overview: React.FC<{
  loading: boolean;
  stats: Record<string, PlatformStats>;
  accounts: Record<string, SocialAccount>;
  scheduled: Scheduled[];
  onGo: (t: Tab) => void;
}> = ({ loading, stats, accounts, scheduled, onGo }) => {
  const t = useT();
  const ids = Object.keys(accounts);
  const sum = (k: keyof PlatformStats) =>
    Object.values(stats).reduce((acc, s) => acc + (typeof s[k] === 'number' ? (s[k] as number) : 0), 0);
  const views = Object.values(stats).reduce((a, s) => a + (s.views ?? s.impressions ?? 0), 0);
  const engagement = Object.values(stats).reduce((a, s) => a + engagementOf(s), 0);
  const upcoming = scheduled.filter((s) => new Date(s.date) >= new Date()).slice(0, 5);

  if (!loading && ids.length === 0) {
    return (
      <Card className="p-8 text-center">
        <Plug className="mx-auto text-white/30" size={32} />
        <h2 className="text-xl font-bold text-white mt-3">{t('No accounts connected yet', 'Nog geen accounts gekoppeld')}</h2>
        <p className="text-white/45 mt-2 max-w-md mx-auto">
          {t(
            'Connect Instagram, TikTok, YouTube and more once. After that, numbers and planning show up here.',
            'Koppel één keer Instagram, TikTok, YouTube en meer. Daarna verschijnen hier je cijfers en planning.'
          )}
        </p>
        <button
          onClick={() => onGo('koppelingen')}
          className="mt-5 inline-flex items-center gap-2 px-5 min-h-[44px] rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm uppercase tracking-widest transition"
        >
          <Link2 size={16} />
          {t('Connect accounts', 'Accounts koppelen')}
        </button>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat icon={<Users size={14} />} label={t('Followers', 'Volgers')} value={loading ? undefined : sum('followers')} hint={t('All channels', 'Alle kanalen')} />
        <Stat icon={<Eye size={14} />} label={t('Views', 'Weergaven')} value={loading ? undefined : views} />
        <Stat icon={<Share2 size={14} />} label={t('Reach', 'Bereik')} value={loading ? undefined : sum('reach')} />
        <Stat
          icon={<Heart size={14} />}
          label={t('Engagement', 'Interactie')}
          value={loading ? undefined : engagement}
          hint={views ? `${((engagement / views) * 100).toFixed(1)}% ${t('of views', 'van weergaven')}` : undefined}
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="p-5 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-white">{t('Reach over time', 'Bereik over tijd')}</h2>
            <div className="flex flex-wrap gap-3">
              {Object.keys(stats).filter((k) => stats[k].reach_timeseries?.length).map((k) => (
                <span key={k} className="flex items-center gap-1.5 text-xs text-white/50"><PlatformDot id={k} size={8} />{platformInfo(k).label}</span>
              ))}
            </div>
          </div>
          <div className="mt-4">
            <LineChart
              series={Object.entries(stats).map(([id, s]) => ({ id, points: s.reach_timeseries || [] }))}
              empty={loading ? t('Loading...', 'Laden...') : t('No reach history yet', 'Nog geen bereikgeschiedenis')}
            />
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-white">{t('Coming up', 'Gepland')}</h2>
            <button onClick={() => onGo('planner')} className="text-xs text-white/45 hover:text-white min-h-[44px] px-2">
              {t('Planner', 'Planner')} →
            </button>
          </div>
          {upcoming.length === 0 ? (
            <div className="py-6 text-center">
              <p className="text-sm text-white/40">{t('Nothing scheduled', 'Niets ingepland')}</p>
              <button
                onClick={() => onGo('planner')}
                className="mt-3 inline-flex items-center gap-2 px-4 min-h-[40px] rounded-lg bg-white/[0.08] hover:bg-white/[0.12] text-white text-sm transition"
              >
                <Plus size={14} />{t('Plan a post', 'Post inplannen')}
              </button>
            </div>
          ) : (
            <ul className="mt-2 divide-y divide-white/[0.06]">
              {upcoming.map((s) => (
                <li key={s.id} className="py-3">
                  <p className="text-sm text-white truncate">{s.title}</p>
                  <div className="flex items-center gap-2 mt-1 text-xs text-white/40">
                    <Clock size={12} />
                    {new Date(s.date).toLocaleString('nl-NL', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    <span className="flex gap-1 ml-1">{s.platforms.map((p) => <PlatformDot key={p} id={p} size={8} />)}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <div>
        <h2 className="font-bold text-white mb-3">{t('Per channel', 'Per kanaal')}</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {ids.map((id) => {
            const s = stats[id];
            const acc = accounts[id];
            return (
              <Card key={id} className="p-4">
                <div className="flex items-center gap-3">
                  {acc.social_images ? (
                    <img src={acc.social_images} alt="" className="w-10 h-10 rounded-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <span className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: `${platformInfo(id).color}26` }}>
                      <PlatformDot id={id} />
                    </span>
                  )}
                  <div className="min-w-0">
                    <p className="font-semibold text-white">{platformInfo(id).label}</p>
                    <p className="text-xs text-white/40 truncate">{acc.handle ? `@${acc.handle.replace(/^@/, '')}` : acc.display_name || ''}</p>
                  </div>
                </div>
                {s ? (
                  <div className="grid grid-cols-3 gap-2 mt-4 text-center">
                    <div><p className="text-lg font-black text-white">{fmtNum(s.followers)}</p><p className="text-[10px] uppercase tracking-widest text-white/35">{t('Followers', 'Volgers')}</p></div>
                    <div><p className="text-lg font-black text-white">{fmtNum(s.views ?? s.impressions)}</p><p className="text-[10px] uppercase tracking-widest text-white/35">{t('Views', 'Weergaven')}</p></div>
                    <div><p className="text-lg font-black text-white">{fmtNum(engagementOf(s))}</p><p className="text-[10px] uppercase tracking-widest text-white/35">{t('Interact.', 'Interactie')}</p></div>
                  </div>
                ) : (
                  <p className="text-xs text-white/35 mt-4">
                    {platformInfo(id).analytics
                      ? (loading ? t('Loading...', 'Laden...') : t('No numbers yet', 'Nog geen cijfers'))
                      : t('No analytics for this platform', 'Geen analytics voor dit platform')}
                  </p>
                )}
                {acc.reauth_required && (
                  <p className="mt-3 text-xs text-amber-300 flex items-center gap-1.5"><AlertCircle size={12} />{t('Reconnect needed', 'Opnieuw koppelen nodig')}</p>
                )}
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// ---------- Analytics ----------

const Analytics: React.FC<{
  profileName: string;
  stats: Record<string, PlatformStats>;
  connectedIds: string[];
  onGo: (t: Tab) => void;
}> = ({ profileName, stats, connectedIds, onGo }) => {
  const t = useT();
  const ids = connectedIds.filter((id) => platformInfo(id).analytics);
  const [platform, setPlatform] = useState(ids[0] || '');
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loadingMedia, setLoadingMedia] = useState(false);

  useEffect(() => {
    if (!platform && ids.length) setPlatform(ids[0]);
  }, [ids, platform]);

  useEffect(() => {
    if (!platform || !profileName) return;
    let cancel = false;
    setLoadingMedia(true);
    upCall<{ media?: MediaItem[] }>(`/uploadposts/media?platform=${platform}&user=${encodeURIComponent(profileName)}&limit=12`)
      .then((r) => { if (!cancel) setMedia(r.media || []); })
      .catch(() => { if (!cancel) setMedia([]); })
      .finally(() => { if (!cancel) setLoadingMedia(false); });
    return () => { cancel = true; };
  }, [platform, profileName]);

  if (!ids.length) {
    return (
      <Card className="p-8 text-center">
        <BarChart3 className="mx-auto text-white/30" size={32} />
        <p className="text-white/50 mt-3">{t('Connect a channel to see analytics.', 'Koppel een kanaal om analytics te zien.')}</p>
        <button onClick={() => onGo('koppelingen')} className="mt-4 px-5 min-h-[44px] rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm transition">
          {t('Connections', 'Koppelingen')}
        </button>
      </Card>
    );
  }

  const s = stats[platform];
  const views = s?.views ?? s?.impressions;
  const eng = engagementOf(s);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        {ids.map((id) => (
          <button
            key={id}
            onClick={() => setPlatform(id)}
            aria-pressed={platform === id}
            className={`flex items-center gap-2 px-4 min-h-[44px] rounded-xl text-sm font-semibold border transition ${
              platform === id ? 'text-white' : 'text-white/45 border-white/[0.08] bg-white/[0.03] hover:text-white/80'
            }`}
            style={platform === id ? { borderColor: platformInfo(id).color, backgroundColor: `${platformInfo(id).color}1f` } : {}}
          >
            <PlatformDot id={id} />
            {platformInfo(id).label}
          </button>
        ))}
      </div>

      {!s ? (
        <Card className="p-6 text-sm text-white/45">{t('No numbers from this channel yet.', 'Nog geen cijfers van dit kanaal.')}</Card>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Stat icon={<Users size={14} />} label={t('Followers', 'Volgers')} value={s.followers} />
            <Stat icon={<Eye size={14} />} label={t('Views', 'Weergaven')} value={views} />
            <Stat icon={<Share2 size={14} />} label={t('Reach', 'Bereik')} value={s.reach} />
            <Stat icon={<Users size={14} />} label={t('Profile views', 'Profielbezoeken')} value={s.profileViews} />
            <Stat icon={<Heart size={14} />} label="Likes" value={s.likes} />
            <Stat icon={<MessageCircle size={14} />} label={t('Comments', 'Reacties')} value={s.comments} />
            <Stat icon={<Bookmark size={14} />} label={t('Saves', 'Opgeslagen')} value={s.saves} />
            <Stat
              icon={<BarChart3 size={14} />}
              label={t('Eng. rate', 'Interactie %')}
              value={undefined}
              hint={views ? `${((eng / views) * 100).toFixed(2)}%` : t('No views yet', 'Nog geen weergaven')}
            />
          </div>

          <Card className="p-5">
            <h2 className="font-bold text-white">{t('Reach over time', 'Bereik over tijd')}</h2>
            <div className="mt-4">
              <LineChart series={[{ id: platform, points: s.reach_timeseries || [] }]} empty={t('No reach history yet', 'Nog geen bereikgeschiedenis')} />
            </div>
          </Card>
        </>
      )}

      <Card className="p-5">
        <h2 className="font-bold text-white">{t('Recent posts', 'Recente posts')}</h2>
        {loadingMedia ? (
          <p className="text-sm text-white/35 py-6">{t('Loading...', 'Laden...')}</p>
        ) : media.length === 0 ? (
          <p className="text-sm text-white/35 py-6">{t('No posts found.', 'Geen posts gevonden.')}</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mt-4">
            {media.map((m) => {
              const img = m.thumbnail_url || (m.media_type !== 'VIDEO' ? m.media_url : null);
              return (
                <a
                  key={m.id}
                  href={m.permalink || undefined}
                  target="_blank"
                  rel="noreferrer"
                  className="group rounded-xl overflow-hidden border border-white/[0.06] bg-white/[0.03] hover:border-white/[0.15] transition"
                >
                  <div className="aspect-square bg-white/[0.04] flex items-center justify-center overflow-hidden">
                    {img ? (
                      <img src={img} alt={m.caption?.slice(0, 80) || 'Post'} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" referrerPolicy="no-referrer" />
                    ) : (
                      <PlatformDot id={platform} size={14} />
                    )}
                  </div>
                  <div className="p-2.5">
                    <p className="text-xs text-white/70 line-clamp-2 min-h-[2rem]">{m.caption || t('No caption', 'Geen tekst')}</p>
                    <div className="flex items-center justify-between mt-1.5 text-[11px] text-white/35">
                      <span>{m.timestamp ? new Date(m.timestamp).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' }) : ''}</span>
                      <span className="flex items-center gap-2">
                        {m.like_count !== undefined && <span className="flex items-center gap-0.5"><Heart size={10} />{fmtNum(m.like_count)}</span>}
                        {m.comments_count !== undefined && <span className="flex items-center gap-0.5"><MessageCircle size={10} />{fmtNum(m.comments_count)}</span>}
                        {m.permalink && <ExternalLink size={10} />}
                      </span>
                    </div>
                  </div>
                </a>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
};

// ---------- Koppelingen ----------

const Connections: React.FC<{
  profiles: UploadPostProfile[];
  profileName: string;
  accounts: Record<string, SocialAccount>;
  onChoose: (name: string) => void;
  onReload: () => void;
}> = ({ profiles, profileName, accounts, onChoose, onReload }) => {
  const t = useT();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [newName, setNewName] = useState('jonnarincon');

  const connect = async () => {
    if (!profileName) return;
    setBusy(true);
    setMsg('');
    try {
      const r = await upPost<{ access_url?: string }>('/uploadposts/users/generate-jwt', {
        username: profileName,
        redirect_url: `${window.location.origin}/admin/social?tab=koppelingen`,
        logo_image: `${window.location.origin}/Jonna%20Rincon%20Logo%20WH.png`,
        redirect_button_text: t('Back to dashboard', 'Terug naar dashboard'),
        connect_title: 'Jonna Rincon',
      });
      if (r.access_url) {
        window.open(r.access_url, '_blank', 'noopener');
        setMsg(t(
          'The connect page opened in a new tab. Come back here and press Refresh when done.',
          'De koppelpagina is in een nieuw tabblad geopend. Kom hier terug en druk op Vernieuwen als je klaar bent.'
        ));
      }
    } catch (e: any) {
      setMsg(e?.message || t('Could not open the connect page', 'Koppelpagina openen lukte niet'));
    } finally {
      setBusy(false);
    }
  };

  const createProfile = async () => {
    const name = newName.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
    if (!name) return;
    setBusy(true);
    setMsg('');
    try {
      await upPost('/uploadposts/users', { username: name });
      onChoose(name);
      onReload();
    } catch (e: any) {
      setMsg(e?.message || t('Could not create profile', 'Profiel maken lukte niet'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      <Card className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="font-bold text-white">{t('Upload-Post profile', 'Upload-Post-profiel')}</h2>
            <p className="text-sm text-white/45 mt-1">
              {t(
                'All channels hang under one profile. Connecting is done safely on the platform itself; no passwords are stored here.',
                'Alle kanalen hangen onder één profiel. Koppelen gebeurt veilig bij het platform zelf; hier worden geen wachtwoorden bewaard.'
              )}
            </p>
          </div>
          {profiles.length > 0 && (
            <div className="flex items-center gap-2">
              <select
                value={profileName}
                onChange={(e) => onChoose(e.target.value)}
                className="min-h-[44px] px-3 rounded-xl bg-white/[0.06] border border-white/[0.1] text-white"
                aria-label={t('Profile', 'Profiel')}
              >
                {profiles.map((p) => <option key={p.username} value={p.username} className="bg-neutral-900">@{p.username}</option>)}
              </select>
              <button
                onClick={connect}
                disabled={busy || !profileName}
                className="flex items-center gap-2 px-5 min-h-[44px] rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm transition disabled:opacity-50"
              >
                <Link2 size={16} />
                {t('Connect / manage', 'Koppelen / beheren')}
              </button>
            </div>
          )}
        </div>

        {profiles.length === 0 && (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="min-h-[44px] px-3 rounded-xl bg-white/[0.06] border border-white/[0.1] text-white"
              aria-label={t('Profile name', 'Profielnaam')}
            />
            <button
              onClick={createProfile}
              disabled={busy}
              className="flex items-center gap-2 px-5 min-h-[44px] rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm transition disabled:opacity-50"
            >
              <Plus size={16} />{t('Create profile', 'Profiel maken')}
            </button>
          </div>
        )}
        {msg && <p className="mt-3 text-sm text-white/60">{msg}</p>}
      </Card>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {PLATFORMS.map((p) => {
          const acc = accounts[p.id];
          return (
            <Card key={p.id} className="p-4 flex items-center gap-3">
              <span className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${p.color}26` }}>
                {acc?.social_images ? (
                  <img src={acc.social_images} alt="" className="w-10 h-10 rounded-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <PlatformDot id={p.id} />
                )}
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-white">{p.label}</p>
                <p className="text-xs text-white/40 truncate">
                  {acc ? (acc.handle ? `@${acc.handle.replace(/^@/, '')}` : acc.display_name || t('Connected', 'Gekoppeld')) : t('Not connected', 'Niet gekoppeld')}
                </p>
              </div>
              {acc ? (
                acc.reauth_required ? (
                  <AlertCircle size={18} className="text-amber-400" aria-label={t('Reconnect needed', 'Opnieuw koppelen nodig')} />
                ) : (
                  <CheckCircle2 size={18} className="text-emerald-400" aria-label={t('Connected', 'Gekoppeld')} />
                )
              ) : (
                <span className="text-[10px] uppercase tracking-widest text-white/25">{p.analytics ? 'Post + stats' : 'Post'}</span>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default SocialPage;
