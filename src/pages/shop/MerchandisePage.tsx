import React, { useState } from 'react';
import { ShoppingCart, Star, ChevronLeft, ChevronRight } from 'lucide-react';
import ShopFooter from '../../components/ShopFooter';
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
    <div className="min-h-screen text-white bg-[#0a0a0a]">

      {/* Hero Section — image extends behind header and ShopNav */}
      <section className="relative overflow-hidden -mt-28 sm:-mt-32">
        <div className="absolute inset-0">
          <img src="/Menu Foto 1.png" alt="" className="w-full h-full object-cover" style={{ objectPosition: 'center 40%' }} />
          <div className="absolute inset-0 bg-gradient-to-br from-black/75 via-black/55 to-black/75" />
          <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 30% 50%, rgba(220,38,38,0.06) 0%, transparent 60%)' }} />
          <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-[#0a0a0a] to-transparent" />
        </div>
        <div className="relative z-10 pt-52 sm:pt-56 pb-12 px-6 md:px-12 max-w-7xl mx-auto w-full">
          <p className="text-xs font-black uppercase tracking-[0.45em] text-red-500 mb-4">JONNA RINCON STORE</p>
          <h1 ref={heroTitle.ref as React.RefObject<HTMLHeadingElement>} style={{fontSize: 'clamp(2.5rem, 9vw, 10.2rem)'}} className="font-black uppercase leading-[0.85] tracking-tighter mb-5 text-white">
            {heroTitle.display}
          </h1>
          <p className="text-white/50 text-sm md:text-base max-w-xl">
            Exclusive merchandise and limited-edition items. Show your support and grab high-quality apparel, vinyl, and more.
          </p>
        </div>
      </section>

      {/* Category Filter */}
      <section className="px-6 md:px-12 py-5 border-b border-white/[0.06]">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <span className="text-[10px] uppercase tracking-widest text-white/25 font-bold flex-shrink-0 mr-1">Filter</span>
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-4 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider whitespace-nowrap transition-all flex-shrink-0 ${
                selectedCategory === null
                  ? 'bg-red-600 text-white shadow-[0_0_12px_rgba(220,38,38,0.3)]'
                  : 'bg-white/[0.05] border border-white/[0.08] text-white/50 hover:bg-white/[0.09] hover:text-white/80'
              }`}
            >
              All
            </button>
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider whitespace-nowrap transition-all flex-shrink-0 ${
                  selectedCategory === category
                    ? 'bg-red-600 text-white shadow-[0_0_12px_rgba(220,38,38,0.3)]'
                    : 'bg-white/[0.05] border border-white/[0.08] text-white/50 hover:bg-white/[0.09] hover:text-white/80'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Merchandise Grid */}
      <section className="px-6 md:px-12 py-12 md:py-16">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className="group bg-white/[0.03] border border-white/[0.07] rounded-2xl overflow-hidden hover:border-white/[0.14] hover:bg-white/[0.06] transition-all duration-400 hover:-translate-y-0.5 hover:shadow-[0_16px_40px_rgba(0,0,0,0.5)] flex flex-col cursor-pointer"
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
                <div className="p-4 md:p-5 flex-1 flex flex-col">
                  <h3 className="text-sm md:text-base font-bold text-white mb-3 line-clamp-2 leading-snug">{item.name}</h3>

                  {/* Price and Button */}
                  <div className="mt-auto flex items-center justify-between pt-3 border-t border-white/[0.06]">
                    <span className="text-base md:text-lg font-black text-white">
                      €{item.price.toFixed(2)}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddToCart(item.id);
                      }}
                      disabled={(item.totalStock ?? 0) === 0}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wide transition-all ${
                        (item.totalStock ?? 0) > 0
                          ? 'bg-red-600 hover:bg-red-700 text-white'
                          : 'bg-white/[0.04] text-white/25 cursor-not-allowed'
                      }`}
                    >
                      <ShoppingCart size={12} />
                      {(item.totalStock ?? 0) === 0 ? 'Sold out' : 'Add'}
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

      <ShopFooter />

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
