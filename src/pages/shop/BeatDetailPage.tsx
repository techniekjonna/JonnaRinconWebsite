import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, ShoppingCart, Play, Pause, Music, Zap, Download, Globe, Disc3,
  TrendingUp, BadgeCheck, Users, Headphones, Copy, Check,
} from 'lucide-react';
import Footer from '../../components/Footer';
import LoadingSpinner from '../../components/LoadingSpinner';
import { Beat } from '../../lib/firebase/types';
import { beatService } from '../../lib/firebase/services';
import { useCart } from '../../hooks/useCart';
import { setCurrentTrack, getCurrentTrack } from '../../components/GlobalAudioPlayer';
import { useScrollToTop } from '../../hooks/useScrollToTop';

const BeatDetailPage: React.FC = () => {
  useScrollToTop();
  const { beatId } = useParams<{ beatId: string }>();
  const navigate = useNavigate();
  const { cartItems, addToCart } = useCart();

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

  if (loading) {
    return (
      <div className="min-h-screen text-white flex items-center justify-center">
        <LoadingSpinner text="Loading beat..." />
      </div>
    );
  }

  if (!beat) {
    return (
      <div className="min-h-screen text-white flex flex-col items-center justify-center px-6 text-center">
        <p className="text-white/50 mb-6">This beat could not be found.</p>
        <button
          onClick={() => navigate('/shop/beats')}
          className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold uppercase tracking-wider rounded-xl transition-all"
        >
          Back to Beat Store
        </button>
      </div>
    );
  }

  const exclusiveLicense = beat.licenses?.exclusive;
  const hasStems = beat.stemsUrl && beat.stemsUrl.length > 0;

  const premiumFeatures = [
    { icon: Globe, text: 'Commercial Use Rights', description: 'Use in monetized content' },
    { icon: Download, text: 'Full Ownership', description: 'Exclusive rights to the beat' },
    { icon: Music, text: 'Unlimited Downloads', description: 'Download as many times as needed' },
    { icon: Disc3, text: 'Stems Available', description: 'Individual track stems included', available: hasStems },
    { icon: TrendingUp, text: 'Distribution Rights', description: 'Distribute across all platforms' },
    { icon: Users, text: 'No Attribution Required', description: 'Use without crediting producer' },
  ];

  return (
    <div className="min-h-screen text-white">
      <main className="pt-32 pb-24 px-4 md:px-8 max-w-5xl mx-auto">
        <button
          onClick={() => navigate('/shop/beats')}
          className="flex items-center gap-2 text-white/40 hover:text-white text-sm transition-colors mb-8"
        >
          <ArrowLeft size={16} /> Back to Beat Store
        </button>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
          {/* Left column — artwork & specs */}
          <div className="md:col-span-2">
            <div className="relative aspect-square rounded-2xl overflow-hidden mb-4 group">
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
                  <BadgeCheck size={14} className="text-red-300" />
                  <span className="text-xs font-bold text-red-200 uppercase tracking-wider">Featured</span>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="bg-white/[0.04] rounded-xl p-4 border border-white/[0.08]">
                <p className="text-white/40 text-xs uppercase tracking-wider font-semibold mb-3">Beat Specifications</p>
                <div className="space-y-3">
                  {beat.bpm && (
                    <div className="flex items-center justify-between">
                      <span className="text-white/50 text-sm">BPM</span>
                      <span className="text-white font-bold text-lg">{beat.bpm}</span>
                    </div>
                  )}
                  {beat.key && (
                    <div className="flex items-center justify-between">
                      <span className="text-white/50 text-sm">Key</span>
                      <span className="text-white font-bold text-lg">{beat.key}</span>
                    </div>
                  )}
                  {beat.genre && (
                    <div className="flex items-center justify-between">
                      <span className="text-white/50 text-sm">Genre</span>
                      <span className="text-white font-bold text-lg capitalize">{beat.genre}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white/[0.04] rounded-xl p-3 border border-white/[0.08] text-center">
                <p className="text-white/40 text-xs uppercase tracking-wider">Type</p>
                <p className="text-white font-black text-sm mt-1 uppercase">{beat.beatType || 'Free'}</p>
              </div>
            </div>
          </div>

          {/* Right column — details */}
          <div className="md:col-span-3 flex flex-col">
            <div className="mb-4">
              <h1 className="text-2xl md:text-4xl font-black text-white mb-1 uppercase tracking-tight leading-tight">
                {beat.title}
              </h1>
              <p className="text-sm md:text-base text-white/60 font-semibold">By {beat.artist}</p>

              {exclusiveLicense && (
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500/20 to-yellow-500/20 border border-orange-400/30 rounded-lg mt-4">
                  <Zap size={16} className="text-orange-300" />
                  <span className="font-bold text-orange-200 uppercase text-xs tracking-wider">Exclusive License</span>
                </div>
              )}

              {beat.description && (
                <p className="text-white/50 text-sm md:text-base leading-relaxed mt-4">{beat.description}</p>
              )}
            </div>

            {beat.tags && beat.tags.length > 0 && (
              <div className="mb-6">
                <p className="text-white/40 text-xs uppercase tracking-wider font-semibold mb-3">Tags &amp; Mood</p>
                <div className="flex flex-wrap gap-2">
                  {beat.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1.5 bg-gradient-to-r from-red-600/15 to-red-900/15 border border-red-600/25 rounded-full text-xs text-red-300 uppercase tracking-wider font-semibold"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="mb-6 p-4 bg-white/[0.06] border border-white/[0.1] rounded-xl">
              <p className="text-white/40 text-xs uppercase tracking-wider font-semibold mb-2">Producer</p>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-600/25 to-red-900/25 border border-red-600/20 flex items-center justify-center flex-shrink-0">
                  <Headphones size={20} className="text-red-300" />
                </div>
                <div>
                  <p className="text-white font-bold text-sm">{beat.artist}</p>
                  <p className="text-white/40 text-xs">Producer &amp; Engineer</p>
                </div>
              </div>
            </div>

            {exclusiveLicense && (
              <div className="mb-6">
                <p className="text-white/40 text-xs uppercase tracking-wider font-semibold mb-3">Premium Features Included</p>
                <div className="grid grid-cols-1 gap-2.5">
                  {premiumFeatures.map((feature, idx) => {
                    const FeatIcon = feature.icon;
                    const isAvailable = feature.available !== false;
                    return (
                      <div
                        key={idx}
                        className={`flex items-start gap-3 px-4 py-3 rounded-lg border transition-all ${
                          isAvailable
                            ? 'bg-gradient-to-r from-white/[0.08] to-white/[0.04] border-white/[0.1]'
                            : 'bg-white/[0.02] border-white/[0.05]'
                        }`}
                      >
                        <FeatIcon size={18} className={isAvailable ? 'text-orange-300 flex-shrink-0 mt-0.5' : 'text-white/20 flex-shrink-0 mt-0.5'} />
                        <div className="flex-1">
                          <p className={`text-xs font-bold uppercase tracking-wider ${isAvailable ? 'text-white' : 'text-white/40'}`}>
                            {feature.text}
                          </p>
                          <p className={`text-xs mt-0.5 ${isAvailable ? 'text-white/50' : 'text-white/30'}`}>
                            {feature.description}
                          </p>
                        </div>
                        {isAvailable && <Check size={16} className="text-green-400 flex-shrink-0 mt-0.5" />}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="mb-6 grid grid-cols-3 gap-2.5">
              <div className="bg-white/[0.06] border border-white/[0.1] rounded-lg p-3 text-center">
                <p className="text-white/40 text-[10px] uppercase tracking-wider font-bold mb-1">Total Plays</p>
                <p className="text-white font-black text-lg">{beat.plays?.toLocaleString() || '0'}</p>
              </div>
              <div className="bg-white/[0.06] border border-white/[0.1] rounded-lg p-3 text-center">
                <p className="text-white/40 text-[10px] uppercase tracking-wider font-bold mb-1">Downloads</p>
                <p className="text-white font-black text-lg">{beat.downloads || '0'}</p>
              </div>
              <div className="bg-white/[0.06] border border-white/[0.1] rounded-lg p-3 text-center">
                <p className="text-white/40 text-[10px] uppercase tracking-wider font-bold mb-1">Likes</p>
                <p className="text-white font-black text-lg">{beat.likes || '0'}</p>
              </div>
            </div>

            {hasStems && (
              <div className="mb-6 p-4 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-400/20 rounded-lg flex items-start gap-3">
                <Disc3 size={18} className="text-cyan-300 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs font-bold text-cyan-200 uppercase tracking-wider">Premium: Stems Available</p>
                  <p className="text-xs text-cyan-200/70 mt-0.5">Individual drum, bass, melody, and other track stems are included for professional remixing and production use.</p>
                </div>
              </div>
            )}

            {/* Price & Action */}
            <div className="border-t border-white/[0.1] pt-6 mt-auto">
              {exclusiveLicense && (
                <div className="mb-6 p-5 bg-gradient-to-br from-red-500/10 to-orange-500/10 border border-red-400/20 rounded-xl">
                  <p className="text-white/40 text-xs uppercase tracking-wider font-bold mb-3">Exclusive Price</p>
                  <p className="text-5xl font-black bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent leading-none">
                    €{exclusiveLicense.price.toFixed(0)}
                  </p>
                  <p className="text-white/50 text-xs mt-2">One-time purchase · Lifetime access</p>
                </div>
              )}

              <div className="space-y-3">
                <button
                  onClick={() => addToCart(beat)}
                  className="w-full px-6 py-4 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white rounded-xl font-bold uppercase tracking-wider transition-all duration-200 hover:shadow-lg hover:shadow-red-500/50 flex items-center justify-center gap-2 group shadow-lg"
                >
                  <ShoppingCart size={20} className="group-hover:scale-110 transition-transform" />
                  <span>Add to Cart</span>
                  {cartItems.length > 0 && (
                    <span className="ml-2 px-2.5 py-0.5 bg-black/40 rounded-full text-xs font-bold">
                      {cartItems.length} item{cartItems.length > 1 ? 's' : ''}
                    </span>
                  )}
                </button>

                <button
                  onClick={handlePlay}
                  className="w-full px-6 py-3.5 border border-white/[0.3] hover:border-white/[0.5] hover:bg-white/[0.1] text-white rounded-xl font-bold uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-2"
                >
                  {isPlaying ? (
                    <>
                      <Pause size={18} className="fill-current text-red-400" />
                      <span>Now Playing</span>
                    </>
                  ) : (
                    <>
                      <Play size={18} className="fill-current ml-0.5" />
                      <span>Preview Beat</span>
                    </>
                  )}
                </button>

                {beat.slug && (
                  <button
                    onClick={handleCopySlug}
                    className="w-full px-6 py-2.5 bg-white/[0.06] border border-white/[0.1] hover:bg-white/[0.1] text-white/70 hover:text-white rounded-lg text-xs font-semibold uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-2"
                  >
                    {copiedSlug ? (
                      <>
                        <Check size={14} className="text-green-400" />
                        <span>Beat ID Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy size={14} />
                        <span>Copy Beat ID</span>
                      </>
                    )}
                  </button>
                )}
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
