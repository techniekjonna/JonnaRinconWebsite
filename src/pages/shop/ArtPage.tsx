import React, { useState } from 'react';
import { Heart, Share2, Eye } from 'lucide-react';
import Navigation from '../../components/Navigation';
import Footer from '../../components/Footer';
import { useCyberDecodeInView } from '../../hooks/useCyberDecode';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useArt } from '../../hooks/useArt';
import { Art } from '../../lib/firebase/types';
import { useScrollToTop } from '../../hooks/useScrollToTop';

const ArtPage: React.FC = () => {
  useScrollToTop();
  const heroTitle = useCyberDecodeInView('Art');
  const { art: artPieces, loading } = useArt({ status: 'published' });
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [likedPieces, setLikedPieces] = useState<string[]>([]);
  const [selectedArt, setSelectedArt] = useState<Art | null>(null);

  const categories = Array.from(new Set(artPieces.map(piece => piece.category))).sort();

  const filteredPieces = selectedCategory
    ? artPieces.filter(piece => piece.category === selectedCategory)
    : artPieces;

  const handleLike = (pieceId: string) => {
    if (likedPieces.includes(pieceId)) {
      setLikedPieces(likedPieces.filter(id => id !== pieceId));
    } else {
      setLikedPieces([...likedPieces, pieceId]);
    }
  };

  return (
    <div className="min-h-screen text-white">
      {/* Fixed JEIGHTENESIS Background */}
      <div className="fixed inset-0 w-full h-screen -z-10">
        <img src="/JEIGHTENESIS.jpg" alt="" className="w-full h-full object-cover" style={{ objectPosition: 'center' }} />
        <div className="absolute inset-0 bg-black/80" />
      </div>

      <Navigation isDarkOverlay={true} isLightMode={false} />

      {/* Hero Section - Centered Layout */}
      <section className="relative pt-40 px-6 md:px-12 pb-4">
        <div className="relative z-10 max-w-7xl mx-auto w-full">
          <h1 ref={heroTitle.ref as React.RefObject<HTMLHeadingElement>} style={{fontSize: 'clamp(1.875rem, 8vw, 10.2rem)'}} className="font-black uppercase leading-[0.85] tracking-tighter mb-8 text-center">
            {heroTitle.display}
          </h1>

          {/* Description */}
          <p className="text-white/30 text-sm md:text-base text-center max-w-2xl mx-auto">
            A curated portfolio of digital art, cover designs, visual art, and conceptual work. From album artwork to experimental visuals.
          </p>
        </div>
      </section>

      {/* Category Filter */}
      <section className="px-6 md:px-12 py-6 border-b border-white/[0.06]">
        <div className="max-w-7xl mx-auto">
          <div className="flex gap-3 overflow-x-auto pb-2">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all ${
                selectedCategory === null
                  ? 'bg-red-600 text-white'
                  : 'bg-white/[0.06] border border-white/[0.08] text-white/60 hover:bg-white/[0.10]'
              }`}
            >
              All Works
            </button>
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all ${
                  selectedCategory === category
                    ? 'bg-red-600 text-white'
                    : 'bg-white/[0.06] border border-white/[0.08] text-white/60 hover:bg-white/[0.10]'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Art Gallery Grid */}
      <section className="px-6 md:px-12 py-16 md:py-24">
        <div className="max-w-7xl mx-auto">
          {/* Loading State */}
          {loading && (
            <div className="text-center py-20">
              <div className="bg-white/[0.04] backdrop-blur-md border border-white/[0.06] rounded-2xl p-12 max-w-md mx-auto">
                <LoadingSpinner text="Loading artwork..." />
              </div>
            </div>
          )}

          {!loading && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredPieces.map((piece) => (
                  <button
                    key={piece.id}
                    onClick={() => setSelectedArt(piece)}
                    className="group text-left bg-white/[0.04] backdrop-blur-md border border-white/[0.06] rounded-2xl overflow-hidden hover:border-white/[0.12] transition-all duration-500 hover:scale-[1.02] hover:bg-white/[0.08]"
                  >
                    {/* Artwork Image */}
                    <div className="relative aspect-square overflow-hidden bg-white/[0.02]">
                      <img
                        src={piece.image}
                        alt={piece.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

                      {/* Overlay Stats */}
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm">
                        <div className="flex gap-6">
                          <div className="text-center">
                            <Eye size={20} className="text-white/60 mx-auto mb-1" />
                            <span className="text-sm font-bold text-white">{(piece.views / 1000).toFixed(1)}k</span>
                          </div>
                          <div className="text-center">
                            <Heart size={20} className="text-red-400 mx-auto mb-1" />
                            <span className="text-sm font-bold text-white">{piece.likes}</span>
                          </div>
                        </div>
                      </div>

                      {/* Category Badge */}
                      <div className="absolute top-3 left-3">
                        <span className="px-3 py-1.5 bg-white/[0.08] backdrop-blur-sm border border-white/[0.1] text-white text-[10px] font-bold rounded-full uppercase tracking-wider">
                          {piece.category}
                        </span>
                      </div>

                      {/* Year Badge */}
                      <div className="absolute top-3 right-3">
                        <span className="px-3 py-1.5 bg-red-600/20 backdrop-blur-sm border border-red-500/30 text-red-200 text-[10px] font-bold rounded-full uppercase tracking-wider">
                          {piece.year}
                        </span>
                      </div>
                    </div>

                    {/* Artwork Info */}
                    <div className="p-5 md:p-6">
                      <h3 className="text-base md:text-lg font-bold text-white mb-1 line-clamp-2">{piece.title}</h3>
                      <p className="text-xs text-white/40 mb-4">{piece.medium}</p>

                      <p className="text-white/50 text-sm leading-relaxed mb-5 line-clamp-3">{piece.description}</p>

                      {/* Footer Stats */}
                      <div className="flex items-center justify-between pt-5 border-t border-white/[0.06]">
                        <span className="text-xs text-white/30 uppercase tracking-wider font-medium">By {piece.artist}</span>
                        <div className="flex gap-2">
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              handleLike(piece.id);
                            }}
                            className={`p-2 rounded-lg transition-all ${
                              likedPieces.includes(piece.id)
                                ? 'bg-red-600/20 text-red-400'
                                : 'bg-white/[0.04] text-white/40 hover:bg-white/[0.08]'
                            }`}
                          >
                            <Heart size={14} fill={likedPieces.includes(piece.id) ? 'currentColor' : 'none'} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                            }}
                            className="p-2 rounded-lg bg-white/[0.04] text-white/40 hover:bg-white/[0.08] transition-all"
                          >
                            <Share2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              {/* Empty State */}
              {filteredPieces.length === 0 && (
                <div className="text-center py-20">
                  <div className="bg-white/[0.04] backdrop-blur-md border border-white/[0.06] rounded-2xl p-12 max-w-md mx-auto">
                    <p className="text-xl font-bold mb-2">No artwork found</p>
                    <p className="text-white/40 text-sm">
                      Try selecting a different category or check back later for new pieces.
                    </p>
                  </div>
                </div>
              )}

              {/* Results Count */}
              {filteredPieces.length > 0 && (
                <div className="mt-10 text-center">
                  <span className="text-[10px] uppercase tracking-widest text-white/20">
                    Showing {filteredPieces.length} artwork{filteredPieces.length !== 1 ? 's' : ''}
                  </span>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* Detail Modal - Simple version shown when art is selected */}
      {selectedArt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-6">
          <div className="bg-white/[0.08] backdrop-blur-md border border-white/[0.1] rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="relative">
              <img src={selectedArt.image} alt={selectedArt.title} className="w-full aspect-square object-cover rounded-t-3xl" />
              <button
                onClick={() => setSelectedArt(null)}
                className="absolute top-4 right-4 w-10 h-10 bg-black/60 rounded-full flex items-center justify-center text-white hover:bg-black/80 transition-all"
              >
                ✕
              </button>
            </div>

            <div className="p-8">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-3xl font-black text-white mb-2">{selectedArt.title}</h2>
                  <p className="text-white/40">{selectedArt.medium} • {selectedArt.year}</p>
                </div>
              </div>

              <p className="text-white/60 leading-relaxed mb-8">{selectedArt.description}</p>

              <div className="grid grid-cols-3 gap-4 mb-8 pb-8 border-b border-white/[0.06]">
                <div>
                  <div className="text-sm text-white/40 mb-1">Artist</div>
                  <div className="text-lg font-bold text-white">{selectedArt.artist}</div>
                </div>
                <div>
                  <div className="text-sm text-white/40 mb-1">Views</div>
                  <div className="text-lg font-bold text-white">{(selectedArt.views / 1000).toFixed(1)}k</div>
                </div>
                <div>
                  <div className="text-sm text-white/40 mb-1">Likes</div>
                  <div className="text-lg font-bold text-white">{selectedArt.likes}</div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => handleLike(selectedArt.id)}
                  className={`flex-1 py-3 rounded-xl font-bold transition-all ${
                    likedPieces.includes(selectedArt.id)
                      ? 'bg-red-600 text-white'
                      : 'bg-white/[0.06] border border-white/[0.1] text-white hover:bg-white/[0.10]'
                  }`}
                >
                  <Heart className="inline mr-2" size={18} fill={likedPieces.includes(selectedArt.id) ? 'currentColor' : 'none'} />
                  {likedPieces.includes(selectedArt.id) ? 'Liked' : 'Like'}
                </button>
                <button className="flex-1 py-3 px-6 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition-all">
                  View Full Resolution
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default ArtPage;
