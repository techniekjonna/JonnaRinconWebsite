import React, { useState, useMemo, useCallback } from 'react';
import { Heart, Share2, Lock, ShoppingCart } from 'lucide-react';
import Navigation from '../../components/Navigation';
import Footer from '../../components/Footer';
import { useCyberDecodeInView } from '../../hooks/useCyberDecode';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useArt } from '../../hooks/useArt';
import { Art } from '../../lib/firebase/types';
import { useScrollToTop } from '../../hooks/useScrollToTop';

const artTypes = ['Painting', 'Hardware', 'Furniture', 'Clothing'] as const;

const ArtPage: React.FC = () => {
  useScrollToTop();
  const heroTitle = useCyberDecodeInView('Art');
  const { art: artPieces, loading } = useArt({ status: 'published' });
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedArt, setSelectedArt] = useState<Art | null>(null);
  const [likedPieces, setLikedPieces] = useState<string[]>([]);
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());

  const handleImageLoad = useCallback((id: string) => {
    setLoadedImages(prev => new Set(prev).add(id));
  }, []);

  const categories = Array.from(new Set(artPieces.map(piece => piece.category))).sort();

  const filteredPieces = useMemo(() => {
    let filtered = artPieces;
    if (selectedCategory) {
      filtered = filtered.filter(piece => piece.category === selectedCategory);
    }
    if (selectedType) {
      filtered = filtered.filter(piece => piece.type === selectedType);
    }
    return filtered;
  }, [artPieces, selectedCategory, selectedType]);

  const handleLike = (pieceId: string, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (likedPieces.includes(pieceId)) {
      setLikedPieces(likedPieces.filter(id => id !== pieceId));
    } else {
      setLikedPieces([...likedPieces, pieceId]);
    }
  };

  const getPriceDisplay = (piece: Art) => {
    if (!piece.forSale) return 'NOT FOR SALE';
    if (piece.isFree) return 'FREE';
    return `€${piece.price?.toFixed(2) || '0.00'}`;
  };

  return (
    <div className="min-h-screen text-white">
      {/* Fixed Dark Overlay */}
      <div className="fixed inset-0 w-full h-screen -z-10 bg-black/20" />

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

      {/* Type Filter */}
      <section className="px-6 md:px-12 py-6 border-b border-white/[0.06]">
        <div className="max-w-7xl mx-auto">
          <p className="text-xs uppercase tracking-wider text-white/40 mb-3 font-bold">Filter by Type</p>
          <div className="flex gap-3 overflow-x-auto pb-2">
            <button
              onClick={() => setSelectedType(null)}
              className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all ${
                selectedType === null
                  ? 'bg-red-600 text-white'
                  : 'bg-white/[0.06] border border-white/[0.08] text-white/60 hover:bg-white/[0.10]'
              }`}
            >
              All Types
            </button>
            {artTypes.map(type => (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all ${
                  selectedType === type
                    ? 'bg-red-600 text-white'
                    : 'bg-white/[0.06] border border-white/[0.08] text-white/60 hover:bg-white/[0.10]'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Category Filter */}
      <section className="px-6 md:px-12 py-6 border-b border-white/[0.06]">
        <div className="max-w-7xl mx-auto">
          <p className="text-xs uppercase tracking-wider text-white/40 mb-3 font-bold">Filter by Category</p>
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
                      {/* Skeleton while loading */}
                      {!loadedImages.has(piece.id) && (
                        <div className="absolute inset-0 bg-white/[0.04] animate-pulse flex items-center justify-center">
                          <div className="w-10 h-10 border-2 border-white/10 border-t-white/40 rounded-full animate-spin" />
                        </div>
                      )}
                      <img
                        src={piece.image}
                        alt={piece.title}
                        loading="lazy"
                        onLoad={() => handleImageLoad(piece.id)}
                        className={`w-full h-full object-cover group-hover:scale-105 transition-all duration-500 ${
                          loadedImages.has(piece.id) ? 'opacity-100' : 'opacity-0'
                        }`}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

                      {/* Out of Stock Overlay */}
                      {piece.sold && (
                        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center">
                          <div className="text-center">
                            <Lock size={32} className="text-red-400 mx-auto mb-2" />
                            <p className="text-white font-bold text-lg">Sold Out</p>
                          </div>
                        </div>
                      )}

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

                      {/* Price Badge */}
                      <div className="absolute bottom-3 left-3">
                        <span className={`px-3 py-1.5 backdrop-blur-sm border text-[10px] font-bold rounded-full uppercase tracking-wider ${
                          piece.forSale
                            ? piece.isFree
                              ? 'bg-green-600/30 border-green-500/50 text-green-200'
                              : 'bg-blue-600/30 border-blue-500/50 text-blue-200'
                            : 'bg-gray-600/30 border-gray-500/50 text-gray-200'
                        }`}>
                          {getPriceDisplay(piece)}
                        </span>
                      </div>
                    </div>

                    {/* Artwork Info */}
                    <div className="p-5 md:p-6">
                      <h3 className="text-base md:text-lg font-bold text-white mb-1 line-clamp-2">{piece.title}</h3>
                      <p className="text-xs text-white/40 mb-4">{piece.medium}</p>

                      {piece.subtype && (
                        <p className="text-xs text-white/30 mb-2 uppercase tracking-wider">{piece.type} • {piece.subtype}</p>
                      )}

                      <p className="text-white/50 text-sm leading-relaxed mb-5 line-clamp-3">{piece.description}</p>

                      {/* Footer */}
                      <div className="flex items-center justify-between pt-5 border-t border-white/[0.06]">
                        <span className="text-xs text-white/30 uppercase tracking-wider font-medium">By {piece.artist}</span>
                        <button
                          onClick={(e) => handleLike(piece.id, e)}
                          className={`p-2 rounded-lg transition-all ${
                            likedPieces.includes(piece.id)
                              ? 'bg-red-600/20 text-red-400'
                              : 'bg-white/[0.04] text-white/40 hover:bg-white/[0.08]'
                          }`}
                        >
                          <Heart size={14} fill={likedPieces.includes(piece.id) ? 'currentColor' : 'none'} />
                        </button>
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
                      Try selecting a different type or category, or check back later for new pieces.
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

      {/* Detail Modal */}
      {selectedArt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white/[0.08] backdrop-blur-md border border-white/[0.1] rounded-3xl max-w-3xl w-full my-auto max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white/[0.08] border-b border-white/[0.1] z-10 flex items-center justify-between p-4">
              <h2 className="text-xl font-bold text-white">{selectedArt.title}</h2>
              <button
                onClick={() => setSelectedArt(null)}
                className="w-10 h-10 bg-white/[0.06] rounded-full flex items-center justify-center text-white hover:bg-white/[0.10] transition-all"
              >
                ✕
              </button>
            </div>

            <div className="p-6 md:p-8">
              {/* Image */}
              <div className="relative mb-8 rounded-2xl overflow-hidden">
                <img src={selectedArt.image} alt={selectedArt.title} className="w-full aspect-square object-cover" />
                {selectedArt.sold && (
                  <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center">
                    <div className="text-center">
                      <Lock size={48} className="text-red-400 mx-auto mb-3" />
                      <p className="text-white font-bold text-2xl">SOLD OUT</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Title and Description */}
              <div className="mb-6">
                <p className="text-white/40 text-sm mb-2">{selectedArt.medium} • {selectedArt.year}</p>
                <p className="text-white/60 leading-relaxed">{selectedArt.description}</p>
              </div>

              {/* Info Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8 pb-8 border-b border-white/[0.06]">
                <div>
                  <div className="text-xs text-white/40 mb-1 uppercase tracking-wider font-bold">Artist</div>
                  <div className="text-base font-bold text-white">{selectedArt.artist}</div>
                </div>
                <div>
                  <div className="text-xs text-white/40 mb-1 uppercase tracking-wider font-bold">Type</div>
                  <div className="text-base font-bold text-white">{selectedArt.type}</div>
                </div>
                {selectedArt.subtype && (
                  <div>
                    <div className="text-xs text-white/40 mb-1 uppercase tracking-wider font-bold">Subtype</div>
                    <div className="text-base font-bold text-white">{selectedArt.subtype}</div>
                  </div>
                )}
                <div>
                  <div className="text-xs text-white/40 mb-1 uppercase tracking-wider font-bold">Price</div>
                  <div className={`text-base font-bold ${
                    selectedArt.forSale
                      ? selectedArt.isFree
                        ? 'text-green-400'
                        : 'text-blue-400'
                      : 'text-gray-400'
                  }`}>
                    {getPriceDisplay(selectedArt)}
                  </div>
                </div>
                {selectedArt.category && (
                  <div>
                    <div className="text-xs text-white/40 mb-1 uppercase tracking-wider font-bold">Category</div>
                    <div className="text-base font-bold text-white">{selectedArt.category}</div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => handleLike(selectedArt.id)}
                  className={`flex-1 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${
                    likedPieces.includes(selectedArt.id)
                      ? 'bg-red-600 text-white'
                      : 'bg-white/[0.06] border border-white/[0.1] text-white hover:bg-white/[0.10]'
                  }`}
                >
                  <Heart size={18} fill={likedPieces.includes(selectedArt.id) ? 'currentColor' : 'none'} />
                  {likedPieces.includes(selectedArt.id) ? 'Liked' : 'Like'}
                </button>

                {selectedArt.forSale && !selectedArt.sold ? (
                  <button className="flex-1 py-3 px-6 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2">
                    <ShoppingCart size={18} />
                    Add to Cart
                  </button>
                ) : (
                  <button disabled className="flex-1 py-3 px-6 bg-white/[0.06] border border-white/[0.1] text-white/40 rounded-xl font-bold cursor-not-allowed">
                    {selectedArt.sold ? 'Sold Out' : 'Not For Sale'}
                  </button>
                )}
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
