import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, ShoppingCart, Zap, Download, Globe, Disc3, TrendingUp, Users,
  Copy, Check, X as XIcon, Lock, Crown, FileAudio, Gauge, Music2, Clock, Layers, Volume2, ScrollText,
} from 'lucide-react';
import Footer from '../../components/Footer';
import LoadingSpinner from '../../components/LoadingSpinner';
import BeatPlayer from '../../components/beat/BeatPlayer';
import SimilarBeats from '../../components/beat/SimilarBeats';
import BeatFaq from '../../components/beat/BeatFaq';
import BeatQuestionForm from '../../components/beat/BeatQuestionForm';
import { Beat } from '../../lib/firebase/types';
import { beatService } from '../../lib/firebase/services';
import { useCart } from '../../hooks/useCart';
import { useScrollToTop } from '../../hooks/useScrollToTop';
import { useT } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { FALLBACK_ACCENT, getCoverAccent, withAlpha } from '../../lib/coverColor';

function toDirect(url: string): string {
  if (url && url.includes('/index.php/s/') && !url.endsWith('/download')) {
    return url.replace(/\/?$/, '/download');
  }
  return url;
}

const BeatDetailPage: React.FC = () => {
  useScrollToTop();
  const { beatId } = useParams<{ beatId: string }>();
  const navigate = useNavigate();
  const { cartItems, addToCart } = useCart();
  const t = useT();
  const { user, loading: authLoading } = useAuth();

  const [beat, setBeat] = useState<Beat | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [accent, setAccent] = useState(FALLBACK_ACCENT);

  useEffect(() => {
    if (!beatId) return;
    setLoading(true);
    window.scrollTo(0, 0);
    beatService.getBeatById(beatId)
      .then(setBeat)
      .finally(() => setLoading(false));
  }, [beatId]);

  // Each beat gets its own accent colour, taken from its cover
  useEffect(() => {
    let alive = true;
    setAccent(FALLBACK_ACCENT);
    getCoverAccent(beat?.artworkUrl).then(c => { if (alive) setAccent(c); });
    return () => { alive = false; };
  }, [beat?.artworkUrl]);

  useEffect(() => {
    if (!beat) return;
    const prev = document.title;
    document.title = `${beat.title}${beat.bpm ? ` · ${beat.bpm} BPM` : ''} | Beat by Jonna Rincon`;
    return () => { document.title = prev; };
  }, [beat]);

  // VIP-exclusive ('private-user') beats only render for the specific allowed
  // user (or an admin/manager): client-side gating like the rest of the app.
  // 'private-link' beats need no user check: anyone with the direct URL may view.
  const isVipBeat = beat?.visibility === 'private-user';
  const isAllowedToView =
    !isVipBeat ||
    user?.uid === beat?.allowedUserId ||
    user?.role === 'admin' ||
    user?.role === 'manager';

  const countPlay = () => {
    if (!beat?.id) return;
    setTimeout(() => {
      beatService.incrementPlays(beat.id).catch((error) => console.error('Failed to increment beat plays:', error));
    }, 15000);
  };

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading || (isVipBeat && authLoading)) {
    return (
      <div className="min-h-screen text-white flex items-center justify-center">
        <LoadingSpinner text={t('Loading beat...', 'Beat laden...')} />
      </div>
    );
  }

  // A VIP-exclusive beat a visitor isn't allowed to see looks identical to a
  // beat that doesn't exist.
  if (!beat || !isAllowedToView) {
    return (
      <div className="min-h-screen text-white flex flex-col items-center justify-center px-6 text-center">
        <p className="text-white/50 mb-6">{t('This beat could not be found.', 'Deze beat kon niet worden gevonden.')}</p>
        <button
          onClick={() => navigate('/shop/beats')}
          className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold uppercase tracking-wider rounded-xl transition-all"
        >
          {t('Back to Beat Store', 'Terug naar Beat Store')}
        </button>
      </div>
    );
  }

  const cover = beat.artworkUrl ? toDirect(beat.artworkUrl) : '/JEIGHTENESIS.jpg';
  const exclusiveLicense = beat.licenses?.exclusive;
  const hasStems = !!(beat.stemsUrl && beat.stemsUrl.length > 0);
  const genres = (beat.genre || '').split(',').map(g => g.trim()).filter(Boolean);

  const specs = [
    { icon: Gauge, label: 'BPM', value: beat.bpm ? String(beat.bpm) : null },
    { icon: Music2, label: t('Key', 'Toonsoort'), value: beat.key || null },
    { icon: Clock, label: t('Length', 'Lengte'), value: beat.duration || null },
    { icon: Disc3, label: t('Genre', 'Genre'), value: beat.genre || null },
  ].filter(s => s.value);

  const delivery = [
    { icon: FileAudio, label: t('Formats', 'Formaten'), value: 'WAV + MP3' },
    { icon: Volume2, label: t('Sample rate', 'Samplerate'), value: '44,1 kHz' },
    { icon: Gauge, label: t('Level', 'Niveau'), value: t('-7 to -5 dB', '-7 tot -5 dB') },
    { icon: Layers, label: 'Stems', value: hasStems ? t('Included', 'Inbegrepen') : t('On request', 'Op aanvraag') },
  ];

  const rights = [
    { icon: Globe, text: t('Commercial Use Rights', 'Commerciële Gebruiksrechten'), sub: t('Release, perform and monetise your song.', 'Releasen, optreden en geld verdienen met je nummer.') },
    { icon: Download, text: t('Full Ownership, Unlimited Downloads', 'Volledig Eigendom, Onbeperkte Downloads'), sub: t('The beat is yours, no stream or sales caps.', 'De beat is van jou, geen limiet op streams of verkoop.') },
    { icon: Disc3, text: t('Stems Available', 'Stems Beschikbaar'), sub: t('Every instrument as a separate audio file.', 'Elk instrument als los audiobestand.'), available: hasStems },
    { icon: TrendingUp, text: t('Distribution Rights', 'Distributierechten'), sub: t('Spotify, Apple Music, YouTube and all other platforms.', 'Spotify, Apple Music, YouTube en alle andere platforms.') },
    { icon: Users, text: t('No Attribution Required', 'Geen Naamsvermelding Vereist'), sub: t('Crediting "Prod. by Jonna Rincon" is appreciated, not required.', '"Prod. by Jonna Rincon" vermelden wordt gewaardeerd, maar is niet verplicht.') },
  ];

  const terms = [
    t('After purchase the beat is sold exclusively to you and removed from the store.', 'Na aankoop wordt de beat exclusief aan jou verkocht en uit de shop gehaald.'),
    t('You may use the beat for one or more songs, music videos, live shows and commercial releases.', 'Je mag de beat gebruiken voor een of meer nummers, videoclips, optredens en commerciële releases.'),
    t('Producer tags: keep them all in or remove them all.', 'Producer tags: laat ze allemaal staan of haal ze allemaal weg.'),
    t('You may cut, rearrange and remix the beat for your song.', 'Je mag de beat knippen, anders indelen en remixen voor je nummer.'),
    t('Reselling or giving away the beat itself (with or without changes) is not allowed.', 'De beat zelf doorverkopen of weggeven (met of zonder aanpassingen) is niet toegestaan.'),
    t('The original composition (chords and melodies) was made by Jonna Rincon.', 'De oorspronkelijke compositie (akkoorden en melodieën) is gemaakt door Jonna Rincon.'),
  ];

  return (
    <div className="relative isolate min-h-screen text-white overflow-hidden">
      {/* ── The beat's colour runs over the whole page, not only the hero ── */}
      <div className="absolute inset-0 -z-10 pointer-events-none" aria-hidden="true">
        <div className="absolute inset-0" style={{ background: `linear-gradient(180deg, ${withAlpha(accent, 0.22)} 0%, ${withAlpha(accent, 0.12)} 35%, ${withAlpha(accent, 0.16)} 70%, ${withAlpha(accent, 0.08)} 100%), #070707` }} />
        <div className="absolute left-[-20%] top-[30%] w-[80%] h-[30%] rounded-full blur-[140px]" style={{ background: withAlpha(accent, 0.22) }} />
        <div className="absolute right-[-25%] top-[55%] w-[70%] h-[25%] rounded-full blur-[140px]" style={{ background: withAlpha(accent, 0.18) }} />
        <div className="absolute left-[10%] bottom-[2%] w-[80%] h-[20%] rounded-full blur-[160px]" style={{ background: withAlpha(accent, 0.2) }} />
      </div>
      {/* ── Hero: blurred cover as backdrop, tinted with the beat's own colour ── */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 -z-0 pointer-events-none" aria-hidden="true">
          <img src={cover} alt="" className="w-full h-full object-cover scale-125 blur-3xl opacity-45" />
          <div className="absolute inset-0" style={{ background: `radial-gradient(ellipse 70% 60% at 30% 40%, ${withAlpha(accent, 0.28)}, transparent 70%)` }} />
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-transparent" />
        </div>

        <div className="relative pt-28 md:pt-36 pb-14 md:pb-20 px-4 md:px-8 max-w-6xl mx-auto">
          <button
            onClick={() => navigate('/shop/beats')}
            className="inline-flex items-center gap-2 text-white/50 hover:text-white text-sm transition-colors mb-8 min-h-[44px]"
          >
            <ArrowLeft size={16} /> {t('Back to Beat Store', 'Terug naar Beat Store')}
          </button>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12 items-center">
            {/* Cover */}
            <div className="md:col-span-5">
              <div
                className="relative aspect-square rounded-2xl overflow-hidden max-w-sm mx-auto md:max-w-none"
                style={{ boxShadow: `0 30px 80px ${withAlpha(accent, 0.35)}, 0 0 0 1px ${withAlpha(accent, 0.25)}` }}
              >
                <img src={cover} alt={`${t('Cover of', 'Cover van')} ${beat.title}`} className="w-full h-full object-cover" />
                <div className="absolute top-3 left-3 flex flex-col items-start gap-2">
                  {beat.featured && (
                    <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full backdrop-blur-md border text-xs font-bold uppercase tracking-wider text-white" style={{ background: withAlpha(accent, 0.3), borderColor: withAlpha(accent, 0.5) }}>
                      <Zap size={13} /> {t('Featured', 'Uitgelicht')}
                    </span>
                  )}
                  {beat.visibility === 'private-link' && (
                    <span className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/25 border border-amber-400/30 rounded-full backdrop-blur-md text-xs font-bold text-amber-200 uppercase tracking-wider">
                      <Lock size={13} /> {t('Super Exclusive', 'Super Exclusief')}
                    </span>
                  )}
                  {beat.visibility === 'private-user' && (
                    <span className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-400/30 border border-amber-300/40 rounded-full backdrop-blur-md text-xs font-bold text-amber-100 uppercase tracking-wider">
                      <Crown size={13} /> {t('VIP Exclusive', 'VIP Exclusief')}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Info + player */}
            <div className="md:col-span-7 flex flex-col">
              <p className="text-xs font-black uppercase tracking-[0.4em] mb-3" style={{ color: accent }}>Beat</p>
              <h1
                className="font-black text-white uppercase tracking-tighter leading-[0.95] mb-3 break-words"
                style={{ fontSize: 'clamp(2.2rem, 6vw, 4.5rem)', textShadow: `0 0 40px ${withAlpha(accent, 0.45)}` }}
              >
                {beat.title}
              </h1>
              <p className="text-white/60 font-semibold mb-5">
                {t('Prod. by', 'Prod. by')} <span className="text-white">{beat.artist || 'Jonna Rincon'}</span>
              </p>

              <div className="flex flex-wrap gap-2 mb-6">
                {beat.bpm ? <span className="px-3 py-1.5 rounded-full text-xs font-bold border border-white/15 bg-white/[0.06]">{beat.bpm} BPM</span> : null}
                {beat.key && <span className="px-3 py-1.5 rounded-full text-xs font-bold border border-white/15 bg-white/[0.06]">{beat.key}</span>}
                {genres.map(g => (
                  <span key={g} className="px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border" style={{ borderColor: withAlpha(accent, 0.4), color: accent, background: withAlpha(accent, 0.1) }}>{g}</span>
                ))}
              </div>

              {beat.audioUrl && (
                <div className="mb-6">
                  <BeatPlayer
                    src={beat.audioUrl}
                    seed={beat.id}
                    accent={accent}
                    durationLabel={beat.duration}
                    track={{ id: beat.id, title: beat.title, artist: beat.artist || 'Jonna Rincon', coverArt: cover }}
                    onFirstPlay={countPlay}
                  />
                </div>
              )}

              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                {exclusiveLicense && (
                  <div className="sm:mr-2">
                    <p className="text-white/40 text-[10px] uppercase tracking-widest font-bold">{t('Exclusive', 'Exclusief')}</p>
                    <p className="text-4xl font-black leading-none" style={{ color: accent }}>€{exclusiveLicense.price.toFixed(0)}</p>
                    <p className="mt-1.5 text-white/60 text-[11px] uppercase tracking-widest font-bold">{t('Only 1 available', 'Nog maar 1 beschikbaar')}</p>
                  </div>
                )}
                <div className="flex gap-3 flex-1">
                  <button
                    onClick={() => addToCart(beat)}
                    className="flex-1 px-6 py-4 text-white rounded-xl font-bold uppercase tracking-wider transition-all duration-200 hover:brightness-110 flex items-center justify-center gap-2 group"
                    style={{ background: accent, boxShadow: `0 12px 30px ${withAlpha(accent, 0.35)}` }}
                  >
                    <ShoppingCart size={20} className="group-hover:scale-110 transition-transform" />
                    <span>{t('Add to Cart', 'In Winkelwagen')}</span>
                    {cartItems.length > 0 && (
                      <span className="ml-1 px-2 py-0.5 bg-black/30 rounded-full text-xs font-bold">{cartItems.length}</span>
                    )}
                  </button>
                  <button
                    onClick={copyLink}
                    aria-label={t('Copy link', 'Link kopiëren')}
                    title={t('Copy link', 'Link kopiëren')}
                    className="w-14 flex-shrink-0 bg-white/[0.06] border border-white/[0.12] hover:bg-white/[0.12] text-white/70 hover:text-white rounded-xl transition-all flex items-center justify-center"
                  >
                    {copied ? <Check size={18} className="text-green-400" /> : <Copy size={18} />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="px-4 md:px-8 max-w-6xl mx-auto pb-24 space-y-20 md:space-y-24">
        {/* ── 1. All beat info ── */}
        <section aria-labelledby="info-title" className="pt-4">
          <p className="text-xs font-black uppercase tracking-[0.4em] mb-2" style={{ color: accent }}>{t('About this beat', 'Over deze beat')}</p>
          <h2 id="info-title" className="text-2xl md:text-3xl font-black uppercase tracking-tight text-white mb-6">{t('Beat info', 'Beat info')}</h2>

          {beat.description && (
            <p className="text-white/60 text-base leading-relaxed mb-8 max-w-2xl whitespace-pre-line">{beat.description}</p>
          )}

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[...specs, ...delivery].map(s => {
              const Icon = s.icon;
              return (
                <div key={s.label} className="p-4 rounded-2xl border backdrop-blur-sm"
                  style={{ background: withAlpha(accent, 0.07), borderColor: withAlpha(accent, 0.18) }}>
                  <Icon size={16} className="mb-3" style={{ color: accent }} />
                  <p className="text-white/40 text-[10px] uppercase tracking-widest font-bold mb-1">{s.label}</p>
                  <p className="text-white font-bold text-sm md:text-base break-words">{s.value}</p>
                </div>
              );
            })}
          </div>

          {beat.tags && beat.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-6">
              {beat.tags.map(tag => (
                <span key={tag} className="px-3 py-1.5 rounded-full text-xs uppercase tracking-wider font-semibold bg-white/[0.04] border border-white/10 text-white/60">#{tag}</span>
              ))}
            </div>
          )}

          <div className="flex items-center gap-6 text-xs text-white/40 mt-6">
            <span><span className="text-white font-bold">{beat.plays?.toLocaleString() || '0'}</span> {t('Plays', 'Keer afgespeeld')}</span>
            <span><span className="text-white font-bold">{beat.likes || '0'}</span> Likes</span>
          </div>
        </section>

        {/* ── 2. Rights + terms ── */}
        <section aria-labelledby="rights-title" className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.4em] mb-2" style={{ color: accent }}>{t('Exclusive license', 'Exclusieve licentie')}</p>
            <h2 id="rights-title" className="text-2xl md:text-3xl font-black uppercase tracking-tight text-white mb-6">{t('What you get', 'Wat je krijgt')}</h2>
            <ul className="space-y-4">
              {rights.map(r => {
                const Icon = r.icon;
                const ok = r.available !== false;
                return (
                  <li key={r.text} className="flex items-start gap-4">
                    <span
                      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border"
                      style={ok ? { background: withAlpha(accent, 0.12), borderColor: withAlpha(accent, 0.3) } : { background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.08)' }}
                    >
                      <Icon size={17} style={{ color: ok ? accent : 'rgba(255,255,255,0.25)' }} />
                    </span>
                    <div>
                      <p className={`font-bold text-sm md:text-base flex items-center gap-2 ${ok ? 'text-white' : 'text-white/30'}`}>
                        {r.text}
                        {ok ? <Check size={14} className="text-green-400" /> : <XIcon size={14} className="text-white/25" />}
                      </p>
                      <p className={`text-sm ${ok ? 'text-white/50' : 'text-white/25'}`}>{r.sub}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>

          <div id="voorwaarden" className="scroll-mt-28 p-6 md:p-8 rounded-3xl border backdrop-blur-sm self-start"
            style={{ background: withAlpha(accent, 0.07), borderColor: withAlpha(accent, 0.2) }}>
            <div className="flex items-center gap-3 mb-5">
              <ScrollText size={18} style={{ color: accent }} />
              <h3 className="text-lg font-black uppercase tracking-tight text-white">{t('Terms of this beat', 'Voorwaarden van deze beat')}</h3>
            </div>
            <ol className="space-y-3">
              {terms.map((line, i) => (
                <li key={i} className="flex gap-3 text-sm text-white/60 leading-relaxed">
                  <span className="font-black tabular-nums flex-shrink-0" style={{ color: accent }}>{String(i + 1).padStart(2, '0')}</span>
                  <span>{line}</span>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ── 3. Similar beats ── */}
        <SimilarBeats beat={beat} accent={accent} />

        {/* ── 4. FAQ + question ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-14">
          <BeatFaq accent={accent} />
          <BeatQuestionForm beat={beat} accent={accent} />
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default BeatDetailPage;
