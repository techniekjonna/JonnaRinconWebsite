import React, { useState } from 'react';
import { ShoppingCart, Star, ChevronLeft, ChevronRight } from 'lucide-react';
import Navigation from '../../components/Navigation';
import Footer from '../../components/Footer';
import MerchandiseDetailModal from '../../components/MerchandiseDetailModal';
import { useCyberDecodeInView } from '../../hooks/useCyberDecode';
import { useMerchandise } from '../../hooks/useMerchandise';
import { useCart } from '../../hooks/useCart';
import { Merchandise } from '../../lib/firebase/types';
import { useScrollToTop } from '../../hooks/useScrollToTop';

const merchandiseItems: any[] = [
  {
    id: 'tshirt-1',
    name: 'Jonna Rincon Logo T-Shirt',
    price: 24.99,
    category: 'T-Shirts',
    image: '/JEIGHTENESIS.jpg',
    inStock: true,
    rating: 4.8,
  },
  {
    id: 'tshirt-2',
    name: 'Electronic Vibes T-Shirt',
    price: 24.99,
    category: 'T-Shirts',
    image: '/JEIGHTENESIS.jpg',
    inStock: true,
    rating: 4.9,
  },
  {
    id: 'hoodie-1',
    name: 'Black Signature Hoodie',
    price: 59.99,
    category: 'Hoodies',
    image: '/JEIGHTENESIS.jpg',
    inStock: true,
    rating: 5.0,
  },
  {
    id: 'hoodie-2',
    name: 'Red Gradient Hoodie',
    price: 59.99,
    category: 'Hoodies',
    image: '/JEIGHTENESIS.jpg',
    inStock: true,
    rating: 4.7,
  },
  {
    id: 'hat-1',
    name: 'Classic Black Baseball Cap',
    price: 29.99,
    category: 'Hats',
    image: '/JEIGHTENESIS.jpg',
    inStock: true,
    rating: 4.6,
  },
  {
    id: 'hat-2',
    name: 'Embroidered Beanie',
    price: 34.99,
    category: 'Hats',
    image: '/JEIGHTENESIS.jpg',
    inStock: true,
    rating: 4.9,
  },
  {
    id: 'poster-1',
    name: 'Tour Poster A2',
    price: 19.99,
    category: 'Posters',
    image: '/JEIGHTENESIS.jpg',
    inStock: true,
    rating: 4.8,
  },
  {
    id: 'poster-2',
    name: 'Album Art Poster',
    price: 19.99,
    category: 'Posters',
    image: '/JEIGHTENESIS.jpg',
    inStock: true,
    rating: 4.7,
  },
  {
    id: 'vinyl-1',
    name: 'Latest Album - Vinyl',
    price: 34.99,
    category: 'Vinyl',
    image: '/JEIGHTENESIS.jpg',
    inStock: true,
    rating: 5.0,
  },
  {
    id: 'vinyl-2',
    name: 'Remixes Collection - Vinyl',
    price: 34.99,
    category: 'Vinyl',
    image: '/JEIGHTENESIS.jpg',
    inStock: false,
    rating: 4.9,
  },
  {
    id: 'cd-1',
    name: 'Discography Box Set',
    price: 49.99,
    category: 'Albums',
    image: '/JEIGHTENESIS.jpg',
    inStock: true,
    rating: 4.9,
  },
  {
    id: 'cd-2',
    name: 'Latest Album - CD',
    price: 14.99,
    category: 'Albums',
    image: '/JEIGHTENESIS.jpg',
    inStock: true,
    rating: 5.0,
  },
];

const MerchandisePage: React.FC = () => {
  useScrollToTop();
  const heroTitle = useCyberDecodeInView('Merchandise');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedMerchandise, setSelectedMerchandise] = useState<Merchandise | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { merchandise, loading } = useMerchandise({ status: 'published' });
  const { addTrackToCart, cartItems = [] } = useCart();

  // Use real data from Firebase, fallback to demo if empty
  const displayItems = merchandise.length > 0 ? merchandise : merchandiseItems;

  const categories = Array.from(new Set(displayItems.map(item => item.category))).sort();

  const filteredItems = selectedCategory
    ? displayItems.filter(item => item.category === selectedCategory)
    : displayItems;

  const handleAddToCart = (itemId: string) => {
    const item = displayItems.find(m => m.id === itemId);
    if (item) {
      addTrackToCart(item as any);
    }
  };

  const handleOpenModal = (item: any) => {
    setSelectedMerchandise(item as Merchandise);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedMerchandise(null);
  };

  const handleModalAddToCart = (merchandise: Merchandise) => {
    addTrackToCart(merchandise as any);
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
            Exclusive merchandise and limited-edition items. Show your support and grab high-quality apparel, vinyl, and more.
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
              All Items
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

      {/* Merchandise Grid */}
      <section className="px-6 md:px-12 py-16 md:py-24">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className="group bg-white/[0.04] backdrop-blur-md border border-white/[0.06] rounded-2xl overflow-hidden hover:border-white/[0.12] transition-all duration-500 hover:scale-[1.02] hover:bg-white/[0.08] flex flex-col cursor-pointer"
                onClick={() => handleOpenModal(item)}
              >
                {/* Product Image */}
                <div className="relative aspect-square overflow-hidden bg-white/[0.02]">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />

                  {/* Stock Badge - Show only when totalStock is 0 */}
                  {(item.totalStock ?? 0) === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                      <span className="text-white font-bold text-lg">Out of Stock</span>
                    </div>
                  )}

                  {/* Logos */}
                  <div className="absolute top-3 left-3 right-3 flex justify-between items-start gap-2">
                    {item.showJonnaRinconLogo && (
                      <div className="w-12 h-12 flex items-center justify-center flex-shrink-0 drop-shadow-lg">
                        <img
                          src="/Jonna Rincon Logo WH.png"
                          alt="Jonna Rincon"
                          className="w-full h-full object-contain"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                    {item.showJeighteenLogo && (
                      <div className="w-12 h-12 flex items-center justify-center flex-shrink-0 drop-shadow-lg">
                        <img
                          src="/JEIGHTEEN-logo.png"
                          alt="JEIGHTEEN"
                          className="w-full h-full object-contain brightness-0 drop-shadow-md"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Category Badge */}
                  <div className="absolute bottom-3 left-3">
                    <span className="px-3 py-1.5 bg-white/[0.08] backdrop-blur-sm border border-white/[0.1] text-white text-[10px] font-bold rounded-full uppercase tracking-wider">
                      {item.category}
                    </span>
                  </div>
                </div>

                {/* Product Info */}
                <div className="p-5 md:p-6 flex-1 flex flex-col">
                  <h3 className="text-base md:text-lg font-bold text-white mb-2 line-clamp-2">{item.name}</h3>

                  {/* Rating */}
                  <div className="flex items-center gap-1 mb-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        size={14}
                        className={i < Math.floor(item.rating || 0) ? 'fill-yellow-400 text-yellow-400' : 'text-white/20'}
                      />
                    ))}
                    <span className="text-xs text-white/40 ml-1">({item.rating?.toFixed(1) || 'N/A'})</span>
                  </div>

                  {/* Price and Button */}
                  <div className="mt-auto flex items-center justify-between pt-5 border-t border-white/[0.06]">
                    <span className="text-lg md:text-xl font-black text-red-500">
                      ${item.price.toFixed(2)}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddToCart(item.id);
                      }}
                      disabled={(item.totalStock ?? 0) === 0}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all group-hover:scale-105 ${
                        (item.totalStock ?? 0) > 0
                          ? 'bg-red-600 hover:bg-red-700 text-white'
                          : 'bg-white/[0.04] text-white/30 cursor-not-allowed'
                      }`}
                    >
                      <ShoppingCart size={14} />
                      {(item.totalStock ?? 0) === 0 ? 'Out of Stock' : 'Add'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Empty State */}
          {filteredItems.length === 0 && (
            <div className="text-center py-20">
              <div className="bg-white/[0.04] backdrop-blur-md border border-white/[0.06] rounded-2xl p-12 max-w-md mx-auto">
                <p className="text-xl font-bold mb-2">No items found</p>
                <p className="text-white/40 text-sm">
                  Try selecting a different category or check back later for new merchandise.
                </p>
              </div>
            </div>
          )}

          {/* Results Count */}
          {filteredItems.length > 0 && (
            <div className="mt-10 text-center">
              <span className="text-[10px] uppercase tracking-widest text-white/20">
                Showing {filteredItems.length} item{filteredItems.length !== 1 ? 's' : ''}
              </span>
            </div>
          )}
        </div>
      </section>

      <Footer />

      {/* Merchandise Detail Modal */}
      <MerchandiseDetailModal
        merchandise={selectedMerchandise}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onAddToCart={handleModalAddToCart}
        cartItems={cartItems}
      />
    </div>
  );
};

export default MerchandisePage;
