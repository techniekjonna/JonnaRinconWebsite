import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, ShoppingCart, Play, Pause, Zap, Download, Globe, Disc3,
  TrendingUp, Users, Copy, Check, X as XIcon, Mail,
} from 'lucide-react';
import Footer from '../../components/Footer';
import LoadingSpinner from '../../components/LoadingSpinner';
import { Beat } from '../../lib/firebase/types';
import { beatService } from '../../lib/firebase/services';
import { useCart } from '../../hooks/useCart';
import { setCurrentTrack, getCurrentTrack } from '../../components/GlobalAudioPlayer';
import { useScrollToTop } from '../../hooks/useScrollToTop';
import { useT } from '../../contexts/LanguageContext';

const BeatDetailPage: React.FC = () => {
  useScrollToTop();
  const { beatId } = useParams<{ beatId: string }>();
  const navigate = useNavigate();
  const { cartItems, addToCart } = useCart();
  const t = useT();

  const [beat, setBeat] = useState<Beat | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [copiedSlug, setCopiedSlug] = useState(false);

  useEffect(() => {
    if (!beatId) return;
    setLoading(true);
    beatService.getBeatById(beatId)
      .then(setBeat)
      .finally(() => setLoading(false));
  }, [beatId]);

  useEffect(() => {
    setIsPlaying(beat ? getCurrentTrack()?.id === beat.id : false);
  }, [beat]);

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
    setIsPlaying(true);
  };

  const handleCopySlug = () => {
    if (!beat) return;
    navigator.clipboard.writeText(beat.slug || beat.id);
    setCopiedSlug(true);
    setTimeout(() => setCopiedSlug(false), 2000);
  };

  const handleContactAboutBeat = () => {
    if (!beat) return;
    navigate('/contact', { state: { beatTitle: beat.title, beatId: beat.id } });
  };

  if (loading) {
    return (
      <div className="min-h-screen text-white flex items-center justify-center">
        <LoadingSpinner text={t('Loading beat...', 'Beat laden...')} />
      </div>
    );
  }

  if (!beat) {
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
  const hasStems = beat.stemsUrl && beat.stemsUrl.length > 0;

  const premiumFeatures = [
    { icon: Globe, text: t('Commercial Use Rights', 'Commerciële Gebruiksrechten') },
    { icon: Download, text: t('Full Ownership, Unlimited Downloads', 'Volledig Eigendom, Onbeperkte Downloads') },
    { icon: Disc3, text: t('Stems Available', 'Stems Beschikbaar'), available: hasStems },
    { icon: TrendingUp, text: t('Distribution Rights', 'Distributierechten') },
    { icon: Users, text: t('No Attribution Required', 'Geen Naamsvermelding Vereist') },
  ];

  return (
    <div className="min-h-screen text-white">
      <main className="pt-32 pb-24 px-4 md:px-8 max-w-5xl mx-auto">
        <button
          onClick={() => navigate('/shop/beats')}
          className="flex items-center gap-2 text-white/40 hover:text-white text-sm transition-colors mb-8"
        >
          <ArrowLeft size={16} /> {t('Back to Beat Store', 'Terug naar Beat Store')}
        </button>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-8 md:gap-12">
          {/* Left — artwork */}
          <div className="md:col-span-2">
            <div className="relative aspect-square rounded-2xl overflow-hidden group">
              <img
                src={beat.artworkUrl || '/JEIGHTENESIS.jpg'}
                alt={beat.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <button
                onClick={handlePlay}
                className="absolute inset-0 flex items-center justify-center group/play"
              >
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-red-500 to-red-700 shadow-2xl flex items-center justify-center group-hover/play:scale-110 transition-transform duration-300">
                  {isPlaying ? (
                    <Pause className="w-8 h-8 text-white" fill="currentColor" />
                  ) : (
                    <Play className="w-8 h-8 text-white ml-1" fill="currentColor" />
                  )}
                </div>
              </button>
              {beat.featured && (
                <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-red-600/25 to-red-900/20 border border-red-600/30 rounded-full backdrop-blur-md">
                  <Zap size={14} className="text-red-300" />
                  <span className="text-xs font-bold text-red-200 uppercase tracking-wider">{t('Featured', 'Uitgelicht')}</span>
                </div>
              )}
            </div>
          </div>

          {/* Right — everything else, flowing rather than boxed */}
          <div className="md:col-span-3 flex flex-col">
            <p className="text-xs font-black uppercase tracking-[0.4em] text-red-500 mb-2">{t('Beat Shop', 'Beat Shop')}</p>
            <h1 className="text-2xl md:text-4xl font-black text-white mb-1 uppercase tracking-tight leading-tight">
              {beat.title}
            </h1>
            <p className="text-sm md:text-base text-white/60 font-semibold mb-4">{t('By', 'Door')} {beat.artist}</p>

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
              <p className="text-white/50 text-sm md:text-base leading-relaxed mb-5 max-w-xl">{beat.description}</p>
            )}

            {beat.tags && beat.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {beat.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1.5 bg-gradient-to-r from-red-600/15 to-red-900/15 border border-red-600/25 rounded-full text-xs text-red-300 uppercase tracking-wider font-semibold"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {exclusiveLicense && (
              <ul className="space-y-2 mb-6">
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

            {/* Stats — one inline row */}
            <div className="flex items-center gap-5 text-xs text-white/40 mb-6 pb-6 border-b border-white/10">
              <span><span className="text-white font-bold">{beat.plays?.toLocaleString() || '0'}</span> {t('Plays', 'Afspelen')}</span>
              <span><span className="text-white font-bold">{beat.downloads || '0'}</span> {t('Downloads', 'Downloads')}</span>
              <span><span className="text-white font-bold">{beat.likes || '0'}</span> {t('Likes', 'Likes')}</span>
            </div>

            {/* Price & actions — the one real action area on the page */}
            <div className="mt-auto">
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
                    onClick={handlePlay}
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

                  <button
                    onClick={handleContactAboutBeat}
                    className="flex-1 px-6 py-3 border border-white/[0.3] hover:border-white/[0.5] hover:bg-white/[0.1] text-white rounded-xl font-bold uppercase tracking-wider text-sm transition-all duration-200 flex items-center justify-center gap-2"
                  >
                    <Mail size={16} />
                    <span>{t('Contact', 'Contact')}</span>
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
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default BeatDetailPage;
