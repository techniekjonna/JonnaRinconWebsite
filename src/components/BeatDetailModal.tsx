import React, { useEffect, useRef } from 'react';
import { X, ShoppingCart, Play, Pause, Music, Zap, Download, Globe, Disc3, TrendingUp, BadgeCheck, Users, Headphones, Radio, Copy, Check } from 'lucide-react';
import { Beat } from '../lib/firebase/types';
import { getCurrentTrack } from './GlobalAudioPlayer';

interface BeatDetailModalProps {
  beat: Beat | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (beat: Beat) => void;
  isPlaying: boolean;
  onPlay: (beat: Beat) => void;
  cartCount: number;
}

export default function BeatDetailModal({
  beat,
  isOpen,
  onClose,
  onAddToCart,
  isPlaying,
  onPlay,
  cartCount,
}: BeatDetailModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const [copiedSlug, setCopiedSlug] = React.useState(false);

  // Handle click outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  // Handle Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  if (!isOpen || !beat) return null;

  const isCurrentBeatPlaying = getCurrentTrack()?.id === beat.id;
  const exclusiveLicense = beat.licenses?.exclusive;
  const hasStems = beat.stemsUrl && beat.stemsUrl.length > 0;

  const handleCopySlug = () => {
    navigator.clipboard.writeText(beat.slug || beat.id);
    setCopiedSlug(true);
    setTimeout(() => setCopiedSlug(false), 2000);
  };

  // Premium features for exclusive license
  const premiumFeatures = [
    { icon: Globe, text: 'Commercial Use Rights', description: 'Use in monetized content' },
    { icon: Download, text: 'Full Ownership', description: 'Exclusive rights to the beat' },
    { icon: Music, text: 'Unlimited Downloads', description: 'Download as many times as needed' },
    { icon: Disc3, text: 'Stems Available', description: 'Individual track stems included', available: hasStems },
    { icon: TrendingUp, text: 'Distribution Rights', description: 'Distribute across all platforms' },
    { icon: Users, text: 'No Attribution Required', description: 'Use without crediting producer' },
  ];

  // License type badge color
  const getLicenseColor = () => {
    if (exclusiveLicense) return 'from-orange-500/30 to-amber-500/30 border-orange-400/40';
    return 'from-purple-500/20 to-pink-500/20 border-purple-400/30';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 max-h-screen overflow-y-auto">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        ref={modalRef}
        className="relative w-full max-w-2xl bg-gradient-to-br from-white/[0.12] to-white/[0.05] backdrop-blur-2xl border border-white/[0.2] rounded-3xl overflow-hidden shadow-2xl my-4 max-h-[90vh]"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 z-20 p-2 bg-white/[0.1] hover:bg-white/[0.2] rounded-full text-white/60 hover:text-white transition-all duration-200"
        >
          <X size={24} />
        </button>

        {/* Featured Badge */}
        {beat.featured && (
          <div className="absolute top-6 left-6 z-20 flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-purple-500/30 to-pink-500/30 border border-purple-400/30 rounded-full">
            <BadgeCheck size={14} className="text-purple-300" />
            <span className="text-xs font-bold text-purple-200 uppercase tracking-wider">Featured</span>
          </div>
        )}

        {/* Main Content */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-0 overflow-y-auto max-h-[calc(90vh-60px)]">
          {/* Left Column - Artwork & Quick Stats */}
          <div className="md:col-span-2 bg-gradient-to-b from-white/[0.08] to-transparent p-4 md:p-6 pt-16 md:pt-6 border-b md:border-b-0 md:border-r border-white/[0.1]">
            {/* Artwork */}
            <div className="relative aspect-square rounded-2xl overflow-hidden mb-4 group">
              <img
                src={beat.artworkUrl || '/JEIGHTENESIS.jpg'}
                alt={beat.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

              {/* Play Button Overlay */}
              <button
                onClick={() => onPlay(beat)}
                className="absolute inset-0 flex items-center justify-center group/play"
              >
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-red-500 to-red-700 shadow-2xl flex items-center justify-center group-hover/play:scale-110 transition-transform duration-300">
                  {isCurrentBeatPlaying ? (
                    <Pause className="w-8 h-8 text-white" fill="currentColor" />
                  ) : (
                    <Play className="w-8 h-8 text-white ml-1" fill="currentColor" />
                  )}
                </div>
              </button>
            </div>

            {/* Beat Specs */}
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

              {/* Stats */}
              <div className="bg-white/[0.04] rounded-xl p-3 border border-white/[0.08] text-center">
                <p className="text-white/40 text-xs uppercase tracking-wider">Type</p>
                <p className="text-white font-black text-sm mt-1 uppercase">{beat.beatType || 'Free'}</p>
              </div>
            </div>
          </div>

          {/* Right Column - Details */}
          <div className="md:col-span-3 p-4 md:p-6 flex flex-col justify-between">
            {/* Header */}
            <div className="mb-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h2 className="text-2xl md:text-3xl font-black text-white mb-1 uppercase tracking-tight leading-tight">
                    {beat.title}
                  </h2>
                  <p className="text-sm md:text-base text-white/60 font-semibold">By {beat.artist}</p>
                </div>
              </div>

              {/* License Type Badge */}
              {exclusiveLicense && (
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500/20 to-yellow-500/20 border border-orange-400/30 rounded-lg mb-4">
                  <Zap size={16} className="text-orange-300" />
                  <span className="font-bold text-orange-200 uppercase text-xs tracking-wider">Exclusive License</span>
                </div>
              )}

              {/* Description */}
              {beat.description && (
                <p className="text-white/50 text-sm md:text-base leading-relaxed mt-4">
                  {beat.description}
                </p>
              )}
            </div>

            {/* Tags */}
            {beat.tags && beat.tags.length > 0 && (
              <div className="mb-6">
                <p className="text-white/40 text-xs uppercase tracking-wider font-semibold mb-3">Tags & Mood</p>
                <div className="flex flex-wrap gap-2">
                  {beat.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1.5 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-400/30 rounded-full text-xs text-purple-200 uppercase tracking-wider font-semibold"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Producer Info Card */}
            <div className="mb-6 p-4 bg-white/[0.06] border border-white/[0.1] rounded-xl">
              <p className="text-white/40 text-xs uppercase tracking-wider font-semibold mb-2">Producer</p>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500/30 to-pink-500/30 border border-purple-400/20 flex items-center justify-center flex-shrink-0">
                  <Headphones size={20} className="text-purple-300" />
                </div>
                <div>
                  <p className="text-white font-bold text-sm">{beat.artist}</p>
                  <p className="text-white/40 text-xs">Producer & Engineer</p>
                </div>
              </div>
            </div>

            {/* Premium Features */}
            {exclusiveLicense && (
              <div className="mb-6">
                <p className="text-white/40 text-xs uppercase tracking-wider font-semibold mb-3">Premium Features Included</p>
                <div className="grid grid-cols-1 gap-2.5">
                  {premiumFeatures.map((feature, idx) => {
                    const Icon = feature.icon;
                    const isAvailable = feature.available !== false;
                    return (
                      <div
                        key={idx}
                        className={`flex items-start gap-3 px-4 py-3 rounded-lg border transition-all ${
                          isAvailable
                            ? 'bg-gradient-to-r from-white/[0.08] to-white/[0.04] border-white/[0.1] hover:border-white/[0.15]'
                            : 'bg-white/[0.02] border-white/[0.05]'
                        }`}
                      >
                        <Icon size={18} className={isAvailable ? 'text-orange-300 flex-shrink-0 mt-0.5' : 'text-white/20 flex-shrink-0 mt-0.5'} />
                        <div className="flex-1">
                          <p className={`text-xs font-bold uppercase tracking-wider ${
                            isAvailable ? 'text-white' : 'text-white/40'
                          }`}>
                            {feature.text}
                          </p>
                          <p className={`text-xs mt-0.5 ${
                            isAvailable ? 'text-white/50' : 'text-white/30'
                          }`}>
                            {feature.description}
                          </p>
                        </div>
                        {isAvailable && (
                          <Check size={16} className="text-green-400 flex-shrink-0 mt-0.5" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Beat Stats */}
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

            {/* Stems Info */}
            {hasStems && (
              <div className="mb-6 p-4 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-400/20 rounded-lg flex items-start gap-3">
                <Disc3 size={18} className="text-cyan-300 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs font-bold text-cyan-200 uppercase tracking-wider">Premium: Stems Available</p>
                  <p className="text-xs text-cyan-200/70 mt-0.5">Individual drum, bass, melody, and other track stems are included for professional remixing and production use.</p>
                </div>
              </div>
            )}

            {/* Beat Details Grid */}
            <div className="mb-6 grid grid-cols-2 gap-3">
              {beat.bpm && (
                <div className="bg-white/[0.06] border border-white/[0.1] rounded-lg p-3">
                  <p className="text-white/40 text-[10px] uppercase tracking-wider font-bold">Tempo</p>
                  <p className="text-white font-bold text-sm mt-1">{beat.bpm} BPM</p>
                </div>
              )}
              {beat.key && (
                <div className="bg-white/[0.06] border border-white/[0.1] rounded-lg p-3">
                  <p className="text-white/40 text-[10px] uppercase tracking-wider font-bold">Key</p>
                  <p className="text-white font-bold text-sm mt-1">{beat.key}</p>
                </div>
              )}
              {beat.genre && (
                <div className="bg-white/[0.06] border border-white/[0.1] rounded-lg p-3">
                  <p className="text-white/40 text-[10px] uppercase tracking-wider font-bold">Genre</p>
                  <p className="text-white font-bold text-sm mt-1 capitalize">{beat.genre}</p>
                </div>
              )}
              {beat.beatType && (
                <div className="bg-white/[0.06] border border-white/[0.1] rounded-lg p-3">
                  <p className="text-white/40 text-[10px] uppercase tracking-wider font-bold">License Type</p>
                  <p className="text-white font-bold text-sm mt-1 uppercase">{beat.beatType}</p>
                </div>
              )}
            </div>

            {/* License Description */}
            {exclusiveLicense && (
              <div className="mb-8">
                <div className="p-4 bg-gradient-to-br from-orange-500/10 to-amber-500/10 border border-orange-400/20 rounded-xl">
                  <p className="text-white/80 text-xs leading-relaxed font-medium">
                    <span className="font-bold text-orange-200 block mb-2">Exclusive License Rights:</span>
                    This exclusive license grants you complete ownership and all rights to use, modify, distribute, and monetize this beat across any platform without attribution requirements. You get unlimited downloads and can use it in unlimited projects.
                  </p>
                </div>

                <div className="mt-4 p-3 bg-white/[0.03] border border-white/[0.08] rounded-lg">
                  <p className="text-white/40 text-[10px] uppercase tracking-wider font-bold mb-2">What You Can Do:</p>
                  <ul className="space-y-1.5 text-xs text-white/60">
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-400 flex-shrink-0"></span>
                      <span>Use in commercial projects and monetized content</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-400 flex-shrink-0"></span>
                      <span>Modify and remix the beat to fit your needs</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-400 flex-shrink-0"></span>
                      <span>Distribute across streaming platforms (Spotify, Apple Music, etc.)</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-400 flex-shrink-0"></span>
                      <span>No attribution required (mention us if you want!)</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-400 flex-shrink-0"></span>
                      <span>Use in unlimited projects</span>
                    </li>
                  </ul>
                </div>
              </div>
            )}

            {/* Price & Action */}
            <div className="border-t border-white/[0.1] pt-6">
              {exclusiveLicense && (
                <div className="mb-6 p-5 bg-gradient-to-br from-red-500/10 to-orange-500/10 border border-red-400/20 rounded-xl">
                  <p className="text-white/40 text-xs uppercase tracking-wider font-bold mb-3">Exclusive Price</p>
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-5xl font-black bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent leading-none">
                        €{exclusiveLicense.price.toFixed(0)}
                      </p>
                      <p className="text-white/50 text-xs mt-2">One-time purchase • Lifetime access</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <button
                  onClick={() => {
                    onAddToCart(beat);
                    onClose();
                  }}
                  className="w-full px-6 py-4 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white rounded-xl font-bold uppercase tracking-wider transition-all duration-200 hover:shadow-lg hover:shadow-red-500/50 flex items-center justify-center gap-2 group shadow-lg"
                >
                  <ShoppingCart size={20} className="group-hover:scale-110 transition-transform" />
                  <span>Add to Cart</span>
                  {cartCount > 0 && (
                    <span className="ml-2 px-2.5 py-0.5 bg-black/40 rounded-full text-xs font-bold">
                      {cartCount} item{cartCount > 1 ? 's' : ''}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => onPlay(beat)}
                  className="w-full px-6 py-3.5 border border-white/[0.3] hover:border-white/[0.5] hover:bg-white/[0.1] text-white rounded-xl font-bold uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-2 group"
                >
                  {isCurrentBeatPlaying ? (
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
      </div>
    </div>
  );
}
