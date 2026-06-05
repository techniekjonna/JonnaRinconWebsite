import { useState, useEffect, useCallback } from 'react';
import { Play, Pause, ChevronLeft, ChevronRight, Lock } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { promoSectionService, PromoSectionData } from '../lib/firebase/services/promoSectionService';
import { setCurrentTrack, subscribeToPlayerState } from './GlobalAudioPlayer';

export default function PromoSection() {
  const { isAuthenticated } = useAuth();
  const [promo, setPromo] = useState<PromoSectionData | null>(null);
  const [carouselIdx, setCarouselIdx] = useState(0);
  const [isTrackPlaying, setIsTrackPlaying] = useState(false);

  useEffect(() => {
    promoSectionService.get().then(setPromo);
  }, []);

  useEffect(() => {
    if (!promo?.trackId) return;
    return subscribeToPlayerState((state) => {
      setIsTrackPlaying(state.isPlaying && state.currentTrack?.id === promo.trackId);
    });
  }, [promo?.trackId]);

  // Auto-advance carousel
  useEffect(() => {
    const images = promo?.images?.filter(Boolean) ?? [];
    if (images.length <= 1) return;
    const timer = setInterval(() => {
      setCarouselIdx((i) => (i + 1) % images.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [promo?.images]);

  const handlePlayTrack = useCallback(() => {
    if (!isAuthenticated) {
      window.location.href = '/login';
      return;
    }
    if (promo?.trackId && promo.trackAudioUrl) {
      setCurrentTrack({
        id: promo.trackId,
        title: promo.trackTitle || 'Track',
        artist: promo.trackArtist || 'Jonna Rincon',
        audioUrl: promo.trackAudioUrl,
        coverArt: promo.trackArtworkUrl,
      });
    }
  }, [isAuthenticated, promo]);

  if (!promo || !promo.enabled) return null;

  const images = (promo.images ?? []).filter(Boolean);
  const hasTrack = Boolean(promo.trackId && promo.trackAudioUrl);

  const prevSlide = () => setCarouselIdx((i) => (i - 1 + images.length) % images.length);
  const nextSlide = () => setCarouselIdx((i) => (i + 1) % images.length);

  return (
    <section className="relative z-20 py-16 md:py-24 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Section divider line */}
        <div className="flex items-center gap-4 mb-14">
          <div className="h-px flex-1 bg-white/[0.07]" />
          <span className="text-white/20 text-[10px] uppercase tracking-[0.35em]">Featured</span>
          <div className="h-px flex-1 bg-white/[0.07]" />
        </div>

        <div className={`grid gap-12 items-center ${images.length > 0 ? 'grid-cols-1 lg:grid-cols-[1.1fr_0.9fr]' : 'grid-cols-1 max-w-3xl'}`}>
          {/* Left: Text content */}
          <div className="space-y-7">
            {/* Upper label */}
            {promo.upperTitle && (
              <p
                className="text-red-500 text-[11px] font-bold uppercase tracking-[0.35em]"
                style={{ letterSpacing: '0.3em' }}
              >
                {promo.upperTitle}
              </p>
            )}

            {/* Main title */}
            {promo.title && (
              <h2 className="text-white font-black leading-[0.92] uppercase" style={{ fontSize: 'clamp(2.4rem, 6vw, 4.5rem)' }}>
                {promo.title}
              </h2>
            )}

            {/* Subtitle */}
            {promo.subtitle && (
              <p className="text-white/45 text-[15px] leading-relaxed max-w-md">
                {promo.subtitle}
              </p>
            )}

            {/* Inline track player */}
            {hasTrack && (
              <div className="inline-flex items-center gap-3 py-3 px-4 bg-white/[0.04] border border-white/[0.08] group">
                <button
                  onClick={handlePlayTrack}
                  aria-label={isAuthenticated ? 'Play track' : 'Login to play'}
                  className="w-9 h-9 bg-red-600 hover:bg-red-500 flex items-center justify-center transition-colors flex-shrink-0"
                >
                  {!isAuthenticated ? (
                    <Lock size={13} className="text-white" />
                  ) : isTrackPlaying ? (
                    <Pause size={13} className="text-white" />
                  ) : (
                    <Play size={13} className="text-white ml-0.5" />
                  )}
                </button>
                <div className="min-w-0">
                  <p className="text-white text-sm font-bold leading-tight truncate">{promo.trackTitle || 'Track'}</p>
                  <p className="text-white/35 text-xs truncate">{promo.trackArtist || 'Jonna Rincon'}</p>
                </div>
                {!isAuthenticated && (
                  <span className="text-white/25 text-[10px] uppercase tracking-wider ml-1 flex-shrink-0">Login to play</span>
                )}
              </div>
            )}

            {/* CTA Buttons */}
            {promo.buttons && promo.buttons.length > 0 && (
              <div className="flex flex-wrap gap-3 pt-1">
                {promo.buttons.map((btn) =>
                  btn.variant === 'primary' ? (
                    <a
                      key={btn.id}
                      href={btn.url}
                      className="inline-flex items-center px-7 py-3 bg-red-600 hover:bg-red-500 text-white font-bold uppercase tracking-widest text-xs transition-all hover:scale-[1.03] active:scale-[0.97]"
                    >
                      {btn.label}
                    </a>
                  ) : (
                    <a
                      key={btn.id}
                      href={btn.url}
                      className="inline-flex items-center px-7 py-3 border border-white/20 hover:border-white/50 text-white font-bold uppercase tracking-widest text-xs transition-all hover:bg-white/[0.05]"
                    >
                      {btn.label}
                    </a>
                  )
                )}
              </div>
            )}
          </div>

          {/* Right: Image / Carousel */}
          {images.length > 0 && (
            <div className="relative flex flex-col gap-4">
              {/* Carousel frame */}
              <div className="relative aspect-[4/3] overflow-hidden bg-white/[0.03] border border-white/[0.06] rounded-2xl">
                {images.map((src, i) => (
                  <img
                    key={i}
                    src={src}
                    alt=""
                    className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${
                      i === carouselIdx ? 'opacity-100' : 'opacity-0 pointer-events-none'
                    }`}
                  />
                ))}

                {/* Gradient overlay at bottom */}
                <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />

                {/* Arrow controls */}
                {images.length > 1 && (
                  <>
                    <button
                      onClick={prevSlide}
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/60 hover:bg-black/90 flex items-center justify-center transition-all opacity-70 hover:opacity-100"
                      aria-label="Previous image"
                    >
                      <ChevronLeft size={16} className="text-white" />
                    </button>
                    <button
                      onClick={nextSlide}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/60 hover:bg-black/90 flex items-center justify-center transition-all opacity-70 hover:opacity-100"
                      aria-label="Next image"
                    >
                      <ChevronRight size={16} className="text-white" />
                    </button>
                  </>
                )}
              </div>

              {/* Dot indicators */}
              {images.length > 1 && (
                <div className="flex justify-center items-center gap-2">
                  {images.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCarouselIdx(i)}
                      className={`transition-all duration-300 rounded-none ${
                        i === carouselIdx
                          ? 'w-7 h-[3px] bg-red-500'
                          : 'w-[5px] h-[3px] bg-white/20 hover:bg-white/40'
                      }`}
                      aria-label={`Go to image ${i + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
