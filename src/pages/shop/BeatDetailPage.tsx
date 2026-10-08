import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, ShoppingCart, Play, Pause, Zap, Download, Globe, Disc3,
  TrendingUp, Users, Copy, Check, X as XIcon, Mail, Lock, Crown,
  ChevronDown, ChevronLeft, Send, HelpCircle,
} from 'lucide-react';
import Footer from '../../components/Footer';
import LoadingSpinner from '../../components/LoadingSpinner';
import { Beat } from '../../lib/firebase/types';
import { beatService } from '../../lib/firebase/services';
import { useCart } from '../../hooks/useCart';
import {
  setCurrentTrack, getCurrentTrack, getIsPlaying, subscribeToPlayerState,
  subscribeToProgress, seekTo, togglePlayPause,
} from '../../components/GlobalAudioPlayer';
import { useScrollToTop } from '../../hooks/useScrollToTop';
import { useT } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../lib/firebase/config';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { formatDuration } from '../../lib/utils/audioMetadata';
import { extractAccentColor, toRgbaString, DEFAULT_ACCENT_COLOR, ExtractedColor } from '../../lib/utils/imageColor';

type ContactStep = 'compose' | 'details' | 'sent';

const SIMILAR_PER_BATCH = 5;
const SIMILAR_MAX_CLICKS = 4; // 4 extra batches of 5 on top of the initial 5 = 25 total

// How closely a candidate beat matches the one being viewed — weighted sum of
// genre match + BPM proximity + shared tags + a couple of minor signals.
// Higher is more similar; ties keep their original (createdAt desc) order.
function scoreSimilarBeat(target: Beat, candidate: Beat): number {
  let score = 0;

  if (target.genre && candidate.genre && target.genre.toLowerCase() === candidate.genre.toLowerCase()) {
    score += 50;
  }
  if (target.subGenre && candidate.subGenre && target.subGenre.toLowerCase() === candidate.subGenre.toLowerCase()) {
    score += 15;
  }
  if (target.bpm && candidate.bpm) {
    const bpmDiff = Math.abs(target.bpm - candidate.bpm);
    score += Math.max(0, 25 - bpmDiff); // within ~25 BPM scores higher the closer it is
  }
  const targetTags = new Set((target.tags || []).map((tag) => tag.toLowerCase()));
  const sharedTags = (candidate.tags || []).filter((tag) => targetTags.has(tag.toLowerCase())).length;
  score += sharedTags * 12;
  if (target.beatType && candidate.beatType && target.beatType === candidate.beatType) {
    score += 5;
  }

  return score;
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
  const [copiedSlug, setCopiedSlug] = useState(false);

  // Inline player — mirrors the shared global player's state for this beat
  // specifically, so the seek bar only ever reflects/controls this track.
  const [isPlaying, setIsPlaying] = useState(false);
  const [isCurrentBeat, setIsCurrentBeat] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // Per-beat accent color, sampled from the hero artwork once it loads.
  const [accentColor, setAccentColor] = useState<ExtractedColor | null>(null);

  // Similar Beats — scored pool + how much of it is currently revealed.
  const [similarPool, setSimilarPool] = useState<Beat[]>([]);
  const [similarVisibleCount, setSimilarVisibleCount] = useState(SIMILAR_PER_BATCH);
  const [similarClicks, setSimilarClicks] = useState(0);

  // Inline "ask about this beat" compose form.
  const [contactStep, setContactStep] = useState<ContactStep>('compose');
  const [contactMessage, setContactMessage] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactSubmitting, setContactSubmitting] = useState(false);
  const [contactError, setContactError] = useState(false);

  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  useEffect(() => {
    if (!beatId) return;
    setLoading(true);
    beatService.getBeatById(beatId)
      .then(setBeat)
      .finally(() => setLoading(false));
  }, [beatId]);

  // VIP-exclusive ('private-user') beats only render for the specific allowed
  // user (or an admin/manager) — this is client-side/route-level gating,
  // consistent with the rest of this app's access checks, not a database rule.
  // 'private-link' beats need no user check: anyone with the direct URL may view.
  const isVipBeat = beat?.visibility === 'private-user';
  const isAllowedToView =
    !isVipBeat ||
    user?.uid === beat?.allowedUserId ||
    user?.role === 'admin' ||
    user?.role === 'manager';

  // Reset the extracted accent and the contact form whenever the viewed beat
  // changes (e.g. navigating from one beat's page to another's).
  useEffect(() => {
    setAccentColor(null);
    setContactStep('compose');
    setContactMessage('');
    setContactName('');
    setContactEmail('');
    setContactError(false);
  }, [beat?.id]);

  // Keep local playback state in sync with the shared global player, so the
  // inline player bar and the Preview button reflect reality even when
  // playback was started/stopped from elsewhere on the site.
  useEffect(() => {
    if (!beat) return;
    const applyStoreState = (store: { currentTrack: { id: string } | null; isPlaying: boolean }) => {
      const isThisBeat = !!store.currentTrack && store.currentTrack.id === beat.id;
      setIsCurrentBeat(isThisBeat);
      setIsPlaying(isThisBeat && store.isPlaying);
    };
    applyStoreState({ currentTrack: getCurrentTrack(), isPlaying: getIsPlaying() });
    return subscribeToPlayerState(applyStoreState);
  }, [beat?.id]);

  // Live playback progress for the inline seek bar.
  useEffect(() => {
    return subscribeToProgress((ct, d) => {
      setCurrentTime(ct);
      setDuration(d);
    });
  }, []);

  // Similar Beats — fetch the published (publicly-visible) catalogue once per
  // beat, score every other beat against this one, and keep the full sorted
  // pool so "show more" can reveal further batches without re-fetching.
  useEffect(() => {
    if (!beat) return;
    let cancelled = false;
    beatService.getPublishedBeats().then((beats) => {
      if (cancelled) return;
      const scored = beats
        .filter((b) => b.id !== beat.id)
        .map((b) => ({ beat: b, score: scoreSimilarBeat(beat, b) }))
        .sort((a, b) => b.score - a.score)
        .map((entry) => entry.beat);
      setSimilarPool(scored);
      setSimilarVisibleCount(SIMILAR_PER_BATCH);
      setSimilarClicks(0);
    });
    return () => { cancelled = true; };
  }, [beat?.id]);

  // Sample the accent color from a separate, invisible Image() rather than
  // the hero <img> itself. The hero image must render with a plain (no
  // crossOrigin) request, since most artwork is hosted on a self-hosted
  // Nextcloud share link (see urlUtils.ts) that sends no CORS headers — a
  // crossOrigin="anonymous" request to that host would simply fail to load,
  // breaking the hero banner. This sampler image can safely fail/taint on
  // its own; extractAccentColor already falls back to null on any error.
  useEffect(() => {
    const src = beat?.artworkUrl;
    if (!src) return;
    let cancelled = false;
    const sampler = new Image();
    sampler.crossOrigin = 'anonymous';
    sampler.onload = () => {
      if (cancelled) return;
      extractAccentColor(sampler).then((color) => {
        if (!cancelled && color) setAccentColor(color);
      }).catch(() => {});
    };
    sampler.src = src;
    return () => { cancelled = true; };
  }, [beat?.artworkUrl]);

  const handlePlay = () => {
    if (!beat) return;
    if (beat.id) {
      setTimeout(() => {
        beatService.incrementPlays(beat.id!).catch((error) => {
          console.error('Failed to increment beat plays:', error);
        });
      }, 15000);
    }
    const trackBeat = {
      id: beat.id,
      title: beat.title,
      artist: beat.artist || 'Unknown',
      audioUrl: beat.audioUrl,
      coverArt: beat.artworkUrl,
      duration: '0:00',
      genre: beat.genre || '',
      type: 'Single' as const,
      year: new Date().getFullYear(),
      collab: 'Solo' as const,
      createdAt: beat.createdAt?.seconds ? beat.createdAt.seconds * 1000 : Date.now(),
      _isBeat: true,
      _beatData: beat,
    } as any;
    setCurrentTrack(trackBeat, [trackBeat]);
  };

  // Single control used by the hero's center button, the inline player bar,
  // and the Preview action — toggles if this beat is already loaded, or
  // starts it fresh otherwise.
  const handleTogglePlayback = () => {
    if (!beat) return;
    if (isCurrentBeat) {
      togglePlayPause();
    } else {
      handlePlay();
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    seekTo(parseFloat(e.target.value));
  };

  const handleCopySlug = () => {
    if (!beat) return;
    navigator.clipboard.writeText(beat.slug || beat.id);
    setCopiedSlug(true);
    setTimeout(() => setCopiedSlug(false), 2000);
  };

  const submitBeatInquiry = async () => {
    if (!beat) return;
    setContactSubmitting(true);
    setContactError(false);
    try {
      const isLoggedIn = !!user;
      await addDoc(collection(db, 'supportMessages'), {
        senderId: isLoggedIn ? user!.uid : `contact:${contactEmail.trim().toLowerCase()}`,
        senderName: isLoggedIn ? (user!.displayName || t('Customer', 'Klant')) : contactName.trim(),
        senderEmail: isLoggedIn ? user!.email : contactEmail.trim(),
        senderRole: isLoggedIn ? 'customer' : 'contact',
        recipientGroup: 'support',
        category: 'Beat',
        relatedBeatId: beat.id,
        relatedBeatTitle: beat.title,
        relatedBeatGenre: beat.genre,
        relatedBeatBpm: beat.bpm,
        message: contactMessage.trim(),
        createdAt: serverTimestamp(),
        status: 'sent',
      });
      setContactStep('sent');
    } catch (error) {
      console.error('Failed to submit beat inquiry:', error);
      setContactError(true);
    } finally {
      setContactSubmitting(false);
    }
  };

  const handleContactContinue = () => {
    if (!contactMessage.trim()) return;
    if (user) {
      submitBeatInquiry();
    } else {
      setContactStep('details');
    }
  };

  const handleContactSubmitDetails = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName.trim() || !contactEmail.trim()) return;
    submitBeatInquiry();
  };

  const resetContactForm = () => {
    setContactStep('compose');
    setContactMessage('');
    setContactName('');
    setContactEmail('');
    setContactError(false);
  };

  const handleShowMoreSimilar = () => {
    setSimilarClicks((c) => c + 1);
    setSimilarVisibleCount((v) => Math.min(v + SIMILAR_PER_BATCH, similarPool.length));
  };

  // While the beat is loading, or (for a VIP-exclusive beat) while we're still
  // resolving who's signed in, show the spinner rather than briefly flashing
  // "not found" for a visitor who will turn out to be allowed.
  if (loading || (isVipBeat && authLoading)) {
    return (
      <div className="min-h-screen text-white flex items-center justify-center">
        <LoadingSpinner text={t('Loading beat...', 'Beat laden...')} />
      </div>
    );
  }

  // A VIP-exclusive beat a visitor isn't allowed to see must look identical to
  // a beat that doesn't exist — no separate "access denied" state.
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

  const exclusiveLicense = beat.licenses?.exclusive;
  const hasStems = !!(beat.stemsUrl && beat.stemsUrl.length > 0);

  const premiumFeatures = [
    { icon: Globe, text: t('Commercial Use Rights', 'Commerciële Gebruiksrechten') },
    { icon: Download, text: t('Full Ownership, Unlimited Downloads', 'Volledig Eigendom, Onbeperkte Downloads') },
    { icon: Disc3, text: t('Stems Available', 'Stems Beschikbaar'), available: hasStems },
    { icon: TrendingUp, text: t('Distribution Rights', 'Distributierechten') },
    { icon: Users, text: t('No Attribution Required', 'Geen Naamsvermelding Vereist') },
  ];

  // Per-beat accent — always a usable color (falls back to the site's default
  // red the moment extraction hasn't resolved yet or failed outright).
  const accent = accentColor || DEFAULT_ACCENT_COLOR;
  const accentSolid = `rgb(${accent.r}, ${accent.g}, ${accent.b})`;
  const accentSoft = toRgbaString(accent, 0.45);

  const seekPct = duration > 0 ? (currentTime / duration) * 100 : 0;
  const visibleSimilarBeats = similarPool.slice(0, similarVisibleCount);
  const canShowMoreSimilar = similarClicks < SIMILAR_MAX_CLICKS && similarVisibleCount < similarPool.length;

  const faqItems = [
    {
      q: t("Can the beat's structure be rearranged?", 'Kan de structuur van de beat worden aangepast?'),
      a: t(
        "Yes — it can easily be cut and re-edited into a different arrangement to fit your song.",
        'Ja — de beat kan eenvoudig anders gemonteerd of herschikt worden om bij jouw track te passen.'
      ),
    },
    {
      q: t('Can I remove the producer tags?', 'Kan ik de producer tags verwijderen?'),
      a: t(
        "It's all-or-nothing: you can keep every producer tag in, or remove all of them — there's no in-between.",
        'Het is alles-of-niets: je houdt alle producer tags erin, of je verwijdert ze allemaal — een tussenweg is niet mogelijk.'
      ),
    },
    {
      q: t('Are the melodies original?', 'Zijn de melodieën origineel?'),
      a: t(
        'Yes — every chord and melody is created completely from scratch by Jonna Rincon.',
        'Ja — elk akkoord en elke melodie is volledig from scratch gemaakt door Jonna Rincon.'
      ),
    },
    {
      q: t('Will this beat get copyright-claimed (e.g. on YouTube)?', 'Krijg ik een copyright-claim op deze beat (bijvoorbeeld op YouTube)?'),
      a: t(
        "No — it's made entirely with legally licensed software and samples, so you won't run into copyright claims.",
        'Nee — de beat is volledig gemaakt met legaal gelicentieerde software en samples, dus je krijgt geen copyright-claims.'
      ),
    },
    {
      q: t('Do I get support after buying?', 'Krijg ik support na aankoop?'),
      a: t(
        'Yes — you get direct contact and service with Jonna Rincon and management after your purchase.',
        'Ja — je krijgt direct contact en service met Jonna Rincon en het management na je aankoop.'
      ),
    },
    {
      q: t('Are stems included?', 'Zijn de stems inbegrepen?'),
      a: hasStems
        ? t(
            "Yes — stems are available for this beat (see \"Stems Available\" above).",
            'Ja — voor deze beat zijn stems beschikbaar (zie "Stems Beschikbaar" hierboven).'
          )
        : t(
            "Not for this beat — stems aren't available on every beat, and this one doesn't include them.",
            'Niet voor deze beat — stems zijn niet bij elke beat beschikbaar, en deze bevat ze niet.'
          ),
    },
    {
      q: t('Can I see the full license terms?', 'Kan ik de volledige licentievoorwaarden bekijken?'),
      a: t(
        'Yes — see the Commercial Use Rights, Full Ownership and Distribution Rights details listed above on this page.',
        'Ja — zie de Commerciële Gebruiksrechten, Volledig Eigendom en Distributierechten hierboven op deze pagina.'
      ),
    },
    {
      q: t('What audio format and quality do I get?', 'Welk audioformaat en welke kwaliteit krijg ik?'),
      a: t(
        "You'll receive WAV and MP3 files at 44.1kHz, named with the track's details, mastered to a loudness between -7 and -5dB.",
        'Je ontvangt WAV- en MP3-bestanden op 44.1kHz, genoemd naar de details van de track, gemasterd op een loudness tussen -7 en -5dB.'
      ),
    },
  ];

  return (
    <div className="min-h-screen text-white">
      <main className="pt-32 pb-24 px-4 md:px-8 max-w-5xl mx-auto">
        <button
          onClick={() => navigate('/shop/beats')}
          className="flex items-center gap-2 text-white/40 hover:text-white text-sm transition-colors mb-6"
        >
          <ArrowLeft size={16} /> {t('Back to Beat Store', 'Terug naar Beat Store')}
        </button>

        {/* Hero banner — the beat's own artwork, full-width, with the same
            dark gradient overlay used on the other de-boxed detail pages so
            any artwork reads legibly as a backdrop. The per-beat accent
            (sampled from this same image) shows up subtly here — an eyebrow
            dot and a glow under the title — never as a wholesale re-theme. */}
        <div className="relative w-full aspect-[16/9] md:aspect-[3/1] overflow-hidden rounded-2xl mb-6">
          <img
            src={beat.artworkUrl || '/JEIGHTENESIS.jpg'}
            alt={beat.title}
            className="absolute inset-0 w-full h-full object-cover"
            style={{ filter: 'contrast(1.1) brightness(0.55)' }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-black/10" />

          <div className="absolute top-4 left-4 flex flex-col items-start gap-2 z-10">
            {beat.featured && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-red-600/25 to-red-900/20 border border-red-600/30 rounded-full backdrop-blur-md">
                <Zap size={14} className="text-red-300" />
                <span className="text-xs font-bold text-red-200 uppercase tracking-wider">{t('Featured', 'Uitgelicht')}</span>
              </div>
            )}
            {beat.visibility === 'private-link' && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-amber-500/25 to-yellow-700/20 border border-amber-400/30 rounded-full backdrop-blur-md">
                <Lock size={14} className="text-amber-300" />
                <span className="text-xs font-bold text-amber-200 uppercase tracking-wider">{t('Super Exclusive', 'Super Exclusief')}</span>
              </div>
            )}
            {beat.visibility === 'private-user' && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-amber-400/30 to-yellow-500/25 border border-amber-300/40 rounded-full backdrop-blur-md">
                <Crown size={14} className="text-amber-200" />
                <span className="text-xs font-bold text-amber-100 uppercase tracking-wider">{t('VIP Exclusive', 'VIP Exclusief')}</span>
              </div>
            )}
          </div>

          <button
            onClick={handleTogglePlayback}
            aria-label={isPlaying ? t('Pause', 'Pauzeren') : t('Play preview', 'Speel voorbeeld af')}
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 group/play"
          >
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-br from-red-500 to-red-700 shadow-2xl flex items-center justify-center group-hover/play:scale-110 transition-transform duration-300">
              {isPlaying ? (
                <Pause className="w-7 h-7 md:w-8 md:h-8 text-white" fill="currentColor" />
              ) : (
                <Play className="w-7 h-7 md:w-8 md:h-8 text-white ml-1" fill="currentColor" />
              )}
            </div>
          </button>

          <div className="absolute inset-0 flex flex-col justify-end p-5 md:p-8 pointer-events-none z-10">
            <p className="text-xs font-black uppercase tracking-[0.4em] text-red-400 mb-2 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full inline-block flex-shrink-0" style={{ backgroundColor: accentSolid }} />
              {t('Beat Shop', 'Beat Shop')}
            </p>
            <h1 className="text-2xl md:text-5xl font-black text-white uppercase tracking-tight leading-tight">
              {beat.title}
            </h1>
            <div
              className="h-[3px] w-14 rounded-full mt-3"
              style={{ backgroundColor: accentSolid, boxShadow: `0 0 12px ${accentSoft}` }}
            />
            <p className="text-sm md:text-base text-white/70 font-semibold mt-3">{t('By', 'Door')} {beat.artist}</p>
          </div>
        </div>

        {/* Inline player — current time, a draggable seek bar and total
            duration, controlling the same shared audio element as the rest
            of the site. Only live/seekable once this beat is the loaded
            track; otherwise a simple affordance to start it. */}
        <div className="flex items-center gap-4 mb-8 pb-6 border-b border-white/10">
          <button
            onClick={handleTogglePlayback}
            aria-label={isPlaying ? t('Pause', 'Pauzeren') : t('Play', 'Afspelen')}
            className="w-11 h-11 rounded-full bg-white/[0.08] hover:bg-white/[0.14] border border-white/[0.12] flex items-center justify-center flex-shrink-0 transition-colors"
          >
            {isPlaying ? (
              <Pause size={18} className="text-white" fill="currentColor" />
            ) : (
              <Play size={18} className="text-white ml-0.5" fill="currentColor" />
            )}
          </button>

          {isCurrentBeat ? (
            <div className="flex-1 flex items-center gap-3 min-w-0">
              <span className="text-xs text-white/40 font-semibold tabular-nums flex-shrink-0 w-9 text-right">
                {formatDuration(currentTime)}
              </span>
              <input
                type="range"
                min="0"
                max={duration || 0}
                value={currentTime}
                onChange={handleSeek}
                aria-label={t('Seek', 'Spoelen')}
                className="player-modal-range flex-1 cursor-pointer"
                style={{
                  WebkitAppearance: 'none',
                  appearance: 'none',
                  height: '5px',
                  borderRadius: '99px',
                  background: `linear-gradient(to right, #fff 0%, #fff ${seekPct}%, rgba(255,255,255,0.15) ${seekPct}%, rgba(255,255,255,0.15) 100%)`,
                }}
              />
              <span className="text-xs text-white/40 font-semibold tabular-nums flex-shrink-0 w-9">
                {formatDuration(duration)}
              </span>
            </div>
          ) : (
            <button
              onClick={handleTogglePlayback}
              className="flex-1 text-left text-sm text-white/40 hover:text-white/70 transition-colors"
            >
              {t('Play to start listening', 'Speel af om te luisteren')}
            </button>
          )}
        </div>

        {/* Specs — one inline line instead of separate boxes */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-white/50 mb-5">
          {beat.bpm && <span><span className="text-white font-bold">{beat.bpm}</span> BPM</span>}
          {beat.key && <span className="text-white font-bold">{beat.key}</span>}
          {beat.genre && <span className="capitalize">{beat.genre}</span>}
          <span className="uppercase text-xs tracking-wide">{beat.beatType || t('Free', 'Gratis')}</span>
          {exclusiveLicense && (
            <span className="inline-flex items-center gap-1.5 text-orange-300 font-bold uppercase text-xs tracking-wider">
              <Zap size={13} /> {t('Exclusive License', 'Exclusieve Licentie')}
            </span>
          )}
        </div>

        {beat.description && (
          <p className="text-white/50 text-sm md:text-base leading-relaxed mb-5 max-w-2xl">{beat.description}</p>
        )}

        {beat.tags && beat.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {beat.tags.map((tag) => (
              <span
                key={tag}
                className="px-3 py-1.5 bg-gradient-to-r from-red-600/15 to-red-900/15 rounded-full text-xs text-red-300 uppercase tracking-wider font-semibold border"
                style={{ borderColor: accentSoft }}
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Stats — one inline row */}
        <div className="flex items-center gap-5 text-xs text-white/40 mb-8 pb-8 border-b border-white/10">
          <span><span className="text-white font-bold">{beat.plays?.toLocaleString() || '0'}</span> {t('Plays', 'Afspelen')}</span>
          <span><span className="text-white font-bold">{beat.downloads || '0'}</span> {t('Downloads', 'Downloads')}</span>
          <span><span className="text-white font-bold">{beat.likes || '0'}</span> {t('Likes', 'Likes')}</span>
        </div>

        {/* Feature / rights checklist — now after all of the beat's own
            info, right before the price & action area */}
        {exclusiveLicense && (
          <ul id="beat-rights" className="space-y-2 mb-10">
            {premiumFeatures.map((feature) => {
              const FeatIcon = feature.icon;
              const isAvailable = feature.available !== false;
              return (
                <li key={feature.text} className="flex items-center gap-2.5">
                  {isAvailable ? (
                    <Check size={15} className="text-green-400 flex-shrink-0" />
                  ) : (
                    <XIcon size={15} className="text-white/20 flex-shrink-0" />
                  )}
                  <FeatIcon size={14} className={isAvailable ? 'text-orange-300 flex-shrink-0' : 'text-white/20 flex-shrink-0'} />
                  <span className={`text-sm ${isAvailable ? 'text-white/70' : 'text-white/25'}`}>{feature.text}</span>
                </li>
              );
            })}
          </ul>
        )}

        {/* Price & actions */}
        <div className="mb-10">
          {exclusiveLicense && (
            <div className="flex items-baseline justify-between mb-4">
              <p className="text-white/40 text-xs uppercase tracking-wider font-bold">{t('Exclusive Price', 'Exclusieve Prijs')}</p>
              <p className="text-4xl font-black bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent leading-none">
                €{exclusiveLicense.price.toFixed(0)}
              </p>
            </div>
          )}

          <div className="space-y-3">
            <button
              onClick={() => addToCart(beat)}
              className="w-full px-6 py-4 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white rounded-xl font-bold uppercase tracking-wider transition-all duration-200 hover:shadow-lg hover:shadow-red-500/50 flex items-center justify-center gap-2 group shadow-lg"
            >
              <ShoppingCart size={20} className="group-hover:scale-110 transition-transform" />
              <span>{t('Add to Cart', 'In Winkelwagen')}</span>
              {cartItems.length > 0 && (
                <span className="ml-2 px-2.5 py-0.5 bg-black/40 rounded-full text-xs font-bold">
                  {cartItems.length} item{cartItems.length > 1 ? 's' : ''}
                </span>
              )}
            </button>

            <div className="flex gap-3">
              <button
                onClick={handleTogglePlayback}
                className="flex-1 px-6 py-3 border border-white/[0.3] hover:border-white/[0.5] hover:bg-white/[0.1] text-white rounded-xl font-bold uppercase tracking-wider text-sm transition-all duration-200 flex items-center justify-center gap-2"
              >
                {isPlaying ? (
                  <>
                    <Pause size={16} className="fill-current text-red-400" />
                    <span>{t('Now Playing', 'Nu Speelt')}</span>
                  </>
                ) : (
                  <>
                    <Play size={16} className="fill-current ml-0.5" />
                    <span>{t('Preview', 'Voorbeeld')}</span>
                  </>
                )}
              </button>

              {beat.slug && (
                <button
                  onClick={handleCopySlug}
                  className="px-4 py-3 bg-white/[0.06] border border-white/[0.1] hover:bg-white/[0.1] text-white/70 hover:text-white rounded-xl text-xs font-semibold uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-2 flex-shrink-0"
                >
                  {copiedSlug ? (
                    <Check size={14} className="text-green-400" />
                  ) : (
                    <Copy size={14} />
                  )}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Inline "ask about this beat" compose form — replaces navigating
            to the separate Contact page. No category step: the category is
            implicit ('Beat'). */}
        <div className="border-t border-white/10 pt-8 mb-12">
          <div className="bg-gradient-to-br from-white/[0.08] to-white/[0.02] border border-white/10 rounded-3xl overflow-hidden max-w-xl">
            {contactStep === 'compose' && (
              <div className="p-6">
                <p className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                  <Mail size={15} className="text-red-400" />
                  {t('Have a question about this beat?', 'Heb je een vraag over deze beat?')}
                </p>
                <textarea
                  rows={4}
                  value={contactMessage}
                  onChange={(e) => setContactMessage(e.target.value)}
                  placeholder={t('Type your question here...', 'Typ hier je vraag...')}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 text-white placeholder-white/30 rounded-xl focus:outline-none focus:border-white/30 focus:bg-white/10 transition-all text-sm resize-none"
                />
                <button
                  onClick={handleContactContinue}
                  disabled={!contactMessage.trim() || contactSubmitting}
                  className="w-full mt-4 py-3.5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all duration-300 text-sm uppercase tracking-widest flex items-center justify-center gap-2"
                >
                  <Send size={15} />
                  {user
                    ? (contactSubmitting ? t('Sending...', 'Verzenden...') : t('Send', 'Versturen'))
                    : t('Continue', 'Doorgaan')}
                </button>
              </div>
            )}

            {contactStep === 'details' && (
              <div className="p-6 space-y-4">
                <div className="p-3 bg-white/[0.04] rounded-xl border border-white/[0.08] text-sm">
                  <p className="text-white/80 leading-relaxed line-clamp-3">{contactMessage}</p>
                </div>
                <form onSubmit={handleContactSubmitDetails} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-widest text-white/40 mb-2">
                        {t('Full Name', 'Volledige Naam')}
                      </label>
                      <input
                        type="text"
                        value={contactName}
                        onChange={(e) => setContactName(e.target.value)}
                        placeholder={t('Your name', 'Jouw naam')}
                        required
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 text-white placeholder-white/30 rounded-xl focus:outline-none focus:border-white/30 focus:bg-white/10 transition-all text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-widest text-white/40 mb-2">
                        {t('Email Address', 'E-mailadres')}
                      </label>
                      <input
                        type="email"
                        value={contactEmail}
                        onChange={(e) => setContactEmail(e.target.value)}
                        placeholder="your@email.com"
                        required
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 text-white placeholder-white/30 rounded-xl focus:outline-none focus:border-white/30 focus:bg-white/10 transition-all text-sm"
                      />
                    </div>
                  </div>

                  {contactError && (
                    <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs">
                      {t('Something went wrong. Please try again.', 'Er is iets misgegaan. Probeer het opnieuw.')}
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setContactStep('compose')}
                      className="px-5 py-3.5 bg-white/[0.06] border border-white/[0.1] text-white/60 hover:text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-1.5"
                    >
                      <ChevronLeft size={14} /> {t('Back', 'Terug')}
                    </button>
                    <button
                      type="submit"
                      disabled={contactSubmitting || !contactName.trim() || !contactEmail.trim()}
                      className="flex-1 py-3.5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all text-sm uppercase tracking-widest flex items-center justify-center gap-2"
                    >
                      <Send size={15} /> {contactSubmitting ? t('Sending...', 'Verzenden...') : t('Submit', 'Verzenden')}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {contactStep === 'sent' && (
              <div className="p-8 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-red-600/20 border border-red-500/30 flex items-center justify-center mx-auto">
                  <Check size={20} className="text-red-400" />
                </div>
                <h3 className="text-base font-black uppercase tracking-tight text-white">{t('Message Sent!', 'Bericht Verzonden!')}</h3>
                <p className="text-white/40 text-sm leading-relaxed">
                  {t("Thanks — we'll get back to you about this beat as soon as possible.", 'Bedankt — we nemen zo snel mogelijk contact met je op over deze beat.')}
                </p>
                <button
                  onClick={resetContactForm}
                  className="px-5 py-2.5 bg-white/[0.08] border border-white/[0.12] text-white/60 hover:text-white rounded-2xl font-bold text-xs uppercase tracking-wider transition-all"
                >
                  {t('New Message', 'Nieuw Bericht')}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Similar Beats — same list-item visual style as the homepage's
            beat preview list, scored by genre + BPM proximity + shared tags */}
        <div className="border-t border-white/10 pt-8 mb-12">
          <h2 className="text-lg font-black uppercase tracking-tight text-white mb-4 flex items-center gap-2">
            <Disc3 size={18} className="text-white/40" />
            {t('Similar Beats', 'Vergelijkbare Beats')}
          </h2>

          {visibleSimilarBeats.length === 0 ? (
            <p className="text-white/30 text-sm">{t('No similar beats found yet.', 'Nog geen vergelijkbare beats gevonden.')}</p>
          ) : (
            <div className="space-y-2">
              {visibleSimilarBeats.map((b) => (
                <Link
                  key={b.id}
                  to={`/shop/beats/${b.id}`}
                  className="w-full flex items-center gap-4 px-4 py-3 border border-white/[0.06] bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.06] transition-all group text-left"
                >
                  <div className="relative w-10 h-10 flex-shrink-0 overflow-hidden bg-white/10">
                    {b.artworkUrl && <img src={b.artworkUrl} alt={b.title} className="w-full h-full object-cover" />}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Play size={14} className="text-white" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm truncate text-white">{b.title}</p>
                    <p className="text-white/40 text-xs truncate">{b.artist}</p>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 border flex-shrink-0 border-red-600/40 text-red-400 bg-red-600/10">
                    {t('Beat', 'Beat')}
                  </span>
                </Link>
              ))}
            </div>
          )}

          {canShowMoreSimilar && (
            <button
              onClick={handleShowMoreSimilar}
              className="mt-4 px-6 py-3 bg-white/[0.06] border border-white/[0.1] hover:bg-white/[0.1] text-white/70 hover:text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all"
            >
              {t('Show more similar beats', 'Toon meer vergelijkbare beats')}
            </button>
          )}
        </div>

        {/* FAQ — flat stacked Q&A, consistent with the site's minimal aesthetic */}
        <div className="border-t border-white/10 pt-8">
          <h2 className="text-lg font-black uppercase tracking-tight text-white mb-2 flex items-center gap-2">
            <HelpCircle size={18} className="text-white/40" />
            {t('Frequently Asked Questions', 'Veelgestelde Vragen')}
          </h2>
          <div className="divide-y divide-white/10">
            {faqItems.map((item, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div key={idx} className="py-4">
                  <button
                    onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                    className="w-full flex items-center justify-between gap-4 text-left"
                  >
                    <span className="text-sm font-semibold text-white">{item.q}</span>
                    <ChevronDown
                      size={16}
                      className={`text-white/30 flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                    />
                  </button>
                  {isOpen && (
                    <p className="text-white/50 text-sm leading-relaxed mt-3 max-w-2xl">{item.a}</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default BeatDetailPage;
