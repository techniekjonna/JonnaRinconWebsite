import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Music, Headphones, ShoppingBag, Palette, ArrowUpRight } from 'lucide-react';
import Navigation from '../../components/Navigation';
import Footer from '../../components/Footer';
import { useCyberDecodeInView } from '../../hooks/useCyberDecode';
import { useScrollToTop } from '../../hooks/useScrollToTop';

interface ShopCategory {
  id: string;
  label: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  color: string;
  description: string;
}

const ShopPage: React.FC = () => {
  useScrollToTop();
  const heroTitle = useCyberDecodeInView('SHOP');
  const [selectedFilter, setSelectedFilter] = useState<string>('All');

  const categories: ShopCategory[] = [
    {
      id: 'beat-shop',
      label: 'Beat Shop',
      subtitle: 'Browse instrumentals',
      icon: Music,
      href: '/shop/beats',
      color: 'from-red-600 to-red-500',
      description: 'Explore our collection of high-quality beats across multiple genres. Find the perfect instrumental for your project.',
    },
    {
      id: 'services',
      label: 'Services',
      subtitle: 'Professional audio services',
      icon: Headphones,
      href: '/shop/services',
      color: 'from-pink-600 to-pink-500',
      description: 'Production, mixing, mastering, and music lessons. Get professional audio services from an experienced producer.',
    },
    {
      id: 'merchandise',
      label: 'Merchandise',
      subtitle: 'Official branded products',
      icon: ShoppingBag,
      href: '/shop/merchandise',
      color: 'from-purple-600 to-purple-500',
      description: 'T-shirts, hoodies, posters, and more. Show your support with official Jonna Rincon merchandise.',
    },
    {
      id: 'art',
      label: 'Art',
      subtitle: 'Digital & visual art',
      icon: Palette,
      href: '/shop/art',
      color: 'from-cyan-600 to-cyan-500',
      description: 'Original digital artwork and visual assets. Limited edition pieces from the Jonna Rincon collection.',
    },
  ];

  const filterOptions = ['All', 'Beat Shop', 'Services', 'Merchandise', 'Art'];

  const filteredCategories =
    selectedFilter === 'All'
      ? categories
      : categories.filter(
          (cat) =>
            (selectedFilter === 'Beat Shop' && cat.id === 'beat-shop') ||
            (selectedFilter === 'Services' && cat.id === 'services') ||
            (selectedFilter === 'Merchandise' && cat.id === 'merchandise') ||
            (selectedFilter === 'Art' && cat.id === 'art')
        );

  return (
    <div className="min-h-screen text-white">
      {/* Fixed Dark Overlay */}
      <div className="fixed inset-0 w-full h-screen -z-10 bg-black/20" />

      <Navigation isDarkOverlay={true} />

      {/* Hero Section */}
      <section className="relative pt-40 px-6 md:px-12 pb-16">
        <div className="relative z-10 max-w-7xl mx-auto w-full text-center">
          <h1
            ref={heroTitle.ref as React.RefObject<HTMLHeadingElement>}
            style={{fontSize: 'clamp(1.875rem, 8vw, 10.2rem)'}} className="font-black uppercase leading-[0.85] tracking-tighter mb-8"
          >
            {heroTitle.display}
          </h1>
          <p className="text-lg md:text-xl text-white/60 max-w-2xl mx-auto">
            Explore our complete catalog of beats, services, merchandise, and art
          </p>
        </div>
      </section>

      {/* Filter Section */}
      <section className="px-6 md:px-12 py-8 border-b border-white/[0.06]">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-wrap gap-3 justify-center">
            {filterOptions.map((option) => (
              <button
                key={option}
                onClick={() => setSelectedFilter(option)}
                className={`px-6 py-2.5 rounded-full font-semibold uppercase tracking-wider text-sm transition-all duration-300 ${
                  selectedFilter === option
                    ? 'bg-red-600 text-white shadow-lg shadow-red-600/50'
                    : 'bg-white/[0.06] border border-white/[0.1] text-white/70 hover:text-white hover:bg-white/[0.12]'
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Category Grid */}
      <section className="px-6 md:px-12 py-20">
        <div className="max-w-7xl mx-auto">
          {filteredCategories.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {filteredCategories.map((category, index) => {
                const IconComponent = category.icon;
                return (
                  <Link
                    key={category.id}
                    to={category.href}
                    className="group relative h-[420px]"
                    style={{
                      animation: `fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${0.1 + index * 0.08}s both`,
                    }}
                  >
                    {/* Glassmorphism Card */}
                    <div className="absolute inset-0 bg-white/[0.05] backdrop-blur-xl border border-white/[0.08] rounded-2xl overflow-hidden hover:border-white/[0.15] transition-all duration-500 hover:scale-[1.02] hover:bg-white/[0.08]">
                      {/* Gradient Background */}
                      <div
                        className={`absolute inset-0 bg-gradient-to-br ${category.color} opacity-0 group-hover:opacity-10 transition-opacity duration-500`}
                      />

                      {/* Content */}
                      <div className="relative z-10 h-full flex flex-col p-8 md:p-6">
                        {/* Icon */}
                        <div className="mb-6">
                          <div className="w-16 h-16 rounded-xl bg-white/[0.08] border border-white/[0.12] flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                            <IconComponent className="w-8 h-8 text-white/80 group-hover:text-white transition-colors" />
                          </div>
                        </div>

                        {/* Text Content */}
                        <div className="flex-1">
                          <h3 className="text-2xl md:text-xl font-bold mb-2 text-white group-hover:text-white transition-colors">
                            {category.label}
                          </h3>
                          <p className="text-sm text-white/50 mb-4 group-hover:text-white/70 transition-colors">
                            {category.subtitle}
                          </p>
                          <p className="text-sm text-white/40 leading-relaxed group-hover:text-white/60 transition-colors">
                            {category.description}
                          </p>
                        </div>

                        {/* CTA Arrow */}
                        <div className="flex items-center justify-between mt-8 pt-6 border-t border-white/[0.06]">
                          <span className="text-xs font-semibold uppercase tracking-widest text-white/30 group-hover:text-white/60 transition-colors">
                            Explore
                          </span>
                          <ArrowUpRight className="w-5 h-5 text-white/20 group-hover:text-white/60 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-300" />
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-20">
              <p className="text-xl text-white/60">No items found for this filter</p>
            </div>
          )}
        </div>
      </section>

      <Footer />

      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default ShopPage;
