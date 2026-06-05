import React, { useRef, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Headphones, ChevronDown, Mic2, Package } from 'lucide-react';
import ShopFooter from '../../components/ShopFooter';
import { useScrollToTop } from '../../hooks/useScrollToTop';
import { useInView } from '../../hooks/useInView';

interface Category {
  id: string;
  label: string;
  tagline: string;
  description: string;
  href: string;
  image: string;
  overlayClass: string;
}

const categories: Category[] = [
  {
    id: 'beats',
    label: 'Beat Shop',
    tagline: 'Find your sound',
    description: 'High-quality instrumentals across every genre. Exclusive licenses available.',
    href: '/shop/beats',
    image: '/stu.png',
    overlayClass: 'from-black/80 via-black/40 to-transparent',
  },
  {
    id: 'services',
    label: 'Services',
    tagline: 'Professional audio',
    description: 'Mix & Master, Studio Sessions, and production consulting — tailored to your project.',
    href: '/shop/services',
    image: '/DJI_20251017150728_0019_D.JPG',
    overlayClass: 'from-black/80 via-black/40 to-transparent',
  },
  {
    id: 'merchandise',
    label: 'Merchandise',
    tagline: 'Wear the brand',
    description: 'Official Jonna Rincon / JEIGHTEEN apparel and accessories.',
    href: '/shop/merchandise',
    image: '/Menu Foto 1.png',
    overlayClass: 'from-black/80 via-black/40 to-transparent',
  },
  {
    id: 'art',
    label: 'Art',
    tagline: 'Original pieces',
    description: 'Limited edition digital and physical artwork from the J18 collection.',
    href: '/shop/art',
    image: 'https://internedata.nl/index.php/s/KvBJM9BKu8iAwdZ/download',
    overlayClass: 'from-black/80 via-black/40 to-transparent',
  },
];

interface CategoryCardProps {
  category: Category;
  index: number;
}

const CategoryCard: React.FC<CategoryCardProps> = ({ category, index }) => {
  const [ref, inView] = useInView({ threshold: 0.1 });

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ${
        inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
      }`}
      style={{ transitionDelay: `${index * 100}ms` }}
    >
    <Link
      to={category.href}
      className="group relative min-h-[300px] md:min-h-[360px] overflow-hidden rounded-2xl block"
    >
      {/* Background image */}
      <img
        src={category.image}
        alt={category.label}
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
      />

      {/* Gradient overlay — bottom up */}
      <div className={`absolute inset-0 bg-gradient-to-t ${category.overlayClass}`} />

      {/* Hover tint */}
      <div className="absolute inset-0 bg-red-600/0 group-hover:bg-red-600/10 transition-all duration-500" />

      {/* Top-right badge */}
      <div className="absolute top-5 right-5 px-3 py-1.5 bg-black/40 backdrop-blur-md border border-white/20 rounded-full">
        <span className="text-xs font-bold uppercase tracking-wider text-white/90">
          {category.label}
        </span>
      </div>

      {/* Content anchored to bottom */}
      <div className="absolute inset-0 flex flex-col justify-end p-5 md:p-6">
        <span className="text-xs font-black uppercase tracking-[0.35em] text-red-400 mb-1.5">
          {category.tagline}
        </span>
        <h2 className="text-2xl md:text-3xl font-black text-white mb-2 leading-none tracking-tighter">
          {category.label}
        </h2>
        <p className="text-white/65 text-xs leading-relaxed max-w-xs mb-4">
          {category.description}
        </p>
        <div className="flex items-center gap-2">
          <span className="text-xs font-black uppercase tracking-widest text-white group-hover:text-red-400 transition-colors duration-300">
            Explore
          </span>
          <ArrowUpRight className="w-3.5 h-3.5 text-white/50 group-hover:text-red-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-300" />
        </div>
      </div>
    </Link>
    </div>
  );
};

const ShopPage: React.FC = () => {
  useScrollToTop();
  const categoriesRef = useRef<HTMLElement>(null);
  const [aboutRef, aboutInView] = useInView({ threshold: 0.1 });
  const [ctaRef, ctaInView] = useInView({ threshold: 0.1 });
  const [heroReady, setHeroReady] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setHeroReady(true), 150);
    return () => clearTimeout(t);
  }, []);

  const scrollToCategories = () => {
    categoriesRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen text-white">

      {/* ─── HERO ─── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden -mt-28 sm:-mt-32">
        {/* Background video with image fallback */}
        <div className="absolute inset-0">
          <video
            autoPlay
            muted
            loop
            playsInline
            poster="/DJI_20251018172151_0031_D.JPG"
            className="absolute inset-0 w-full h-full object-cover"
            style={{ objectPosition: 'center 35%' }}
          >
            <source src="/Shop home video.mp4" type="video/mp4" />
          </video>
          {/* Overlay — fades in from transparent */}
          <div
            className="absolute inset-0 transition-all duration-1000"
            style={{ backgroundColor: heroReady ? 'rgba(0,0,0,0.45)' : 'rgba(0,0,0,0)' }}
          />
          {/* Bottom fade into next section */}
          <div
            className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-black to-transparent transition-opacity duration-1000"
            style={{ opacity: heroReady ? 1 : 0 }}
          />
        </div>

        {/* Hero content — fades + slides up */}
        <div
          className="relative z-10 text-center px-6 max-w-4xl mx-auto pt-32 transition-all duration-700"
          style={{
            opacity: heroReady ? 1 : 0,
            transform: heroReady ? 'translateY(0)' : 'translateY(24px)',
            transitionDelay: heroReady ? '400ms' : '0ms',
          }}
        >
          <p className="text-xs font-black uppercase tracking-[0.45em] text-red-500 mb-5">
            JEIGHTEEN STORE
          </p>
          <h1
            className="font-black uppercase leading-none tracking-tighter mb-6 text-white"
            style={{ fontSize: 'clamp(4rem, 14vw, 11rem)' }}
          >
            SHOP
          </h1>
          <p className="text-white/75 text-lg md:text-xl max-w-xl mx-auto mb-10 leading-relaxed">
            Beats, services, merchandise, and original art — all in one place.
          </p>

          {/* Category quick-jump buttons */}
          <div className="flex flex-wrap gap-3 justify-center mb-6">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                to={cat.href}
                className="px-5 py-2.5 bg-white/[0.12] border border-white/25 backdrop-blur-sm text-white text-xs font-black uppercase tracking-widest hover:bg-red-600 hover:border-red-600 transition-all duration-300 rounded-full"
              >
                {cat.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Scroll indicator — delayed fade in */}
        <button
          onClick={scrollToCategories}
          className="absolute bottom-10 left-0 right-0 flex flex-col items-center gap-2 text-white/40 hover:text-white/70 transition-all duration-700 cursor-pointer"
          style={{
            opacity: heroReady ? 1 : 0,
            transitionDelay: heroReady ? '700ms' : '0ms',
          }}
        >
          <span className="text-xs uppercase tracking-[0.3em] font-semibold">Scroll</span>
          <ChevronDown className="w-5 h-5 animate-bounce" />
        </button>
      </section>

      {/* ─── CATEGORY CARDS ─── */}
      <section ref={categoriesRef} className="px-4 md:px-8 lg:px-12 py-12 bg-[#0a0a0a]">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <p className="text-xs uppercase tracking-[0.4em] text-red-500 mb-2 font-black">Browse</p>
            <h2 className="text-3xl md:text-4xl font-black text-white tracking-tighter">Categories</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
            {categories.map((cat, i) => (
              <CategoryCard key={cat.id} category={cat} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* ─── SERVICES SPOTLIGHT ─── */}
      <section className="px-4 md:px-8 lg:px-12 py-16 bg-[#0f0f0f] border-t border-white/[0.04]">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-red-500 mb-2 font-black">Professional Audio</p>
              <h2 className="text-4xl md:text-5xl font-black text-white tracking-tighter">Services</h2>
            </div>
            <Link
              to="/shop/services"
              className="text-xs font-black uppercase tracking-widest text-white/40 hover:text-white transition-colors flex items-center gap-2 pb-1"
            >
              All Services <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Mix & Master */}
            <Link
              to="/shop/services"
              className="group glass-shop rounded-2xl p-7 flex flex-col hover:border-red-600/30 transition-all duration-300"
            >
              <div className="mb-5 w-14 h-14 rounded-xl bg-red-600/10 border border-red-600/20 flex items-center justify-center">
                <Headphones className="w-7 h-7 text-red-500" />
              </div>
              <h3 className="text-xl font-black text-white mb-2">Mix &amp; Master</h3>
              <p className="text-white/55 text-sm leading-relaxed flex-1 mb-5">
                Professional mixing and mastering for your tracks. Radio-ready sound, tailored to your genre.
              </p>
              <span className="text-xs font-black uppercase tracking-widest text-red-500 group-hover:text-red-400 transition-colors">
                Book Now →
              </span>
            </Link>

            {/* Studio Sessions */}
            <Link
              to="/shop/services"
              className="group glass-shop rounded-2xl p-7 flex flex-col hover:border-red-600/30 transition-all duration-300"
            >
              <div className="mb-5 w-14 h-14 rounded-xl bg-white/[0.07] border border-white/[0.12] flex items-center justify-center">
                <Mic2 className="w-7 h-7 text-white/70" />
              </div>
              <h3 className="text-xl font-black text-white mb-2">Studio Sessions</h3>
              <p className="text-white/55 text-sm leading-relaxed flex-1 mb-5">
                In-studio recording and production sessions. Collaborative, creative, and hands-on.
              </p>
              <span className="text-xs font-black uppercase tracking-widest text-red-500 group-hover:text-red-400 transition-colors">
                Book Now →
              </span>
            </Link>

            {/* Production consulting */}
            <Link
              to="/shop/services"
              className="group glass-shop rounded-2xl p-7 flex flex-col hover:border-red-600/30 transition-all duration-300"
            >
              <div className="mb-5 w-14 h-14 rounded-xl bg-white/[0.07] border border-white/[0.12] flex items-center justify-center">
                <Package className="w-7 h-7 text-white/70" />
              </div>
              <h3 className="text-xl font-black text-white mb-2">Custom Packages</h3>
              <p className="text-white/55 text-sm leading-relaxed flex-1 mb-5">
                Need something specific? Get a custom production package that fits your project and budget.
              </p>
              <span className="text-xs font-black uppercase tracking-widest text-red-500 group-hover:text-red-400 transition-colors">
                Get In Touch →
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* ─── ABOUT (shop-focused) ─── */}
      <section
        ref={aboutRef as React.RefObject<HTMLElement>}
        className={`px-4 md:px-8 lg:px-12 py-16 bg-[#0a0a0a] border-t border-white/[0.04] transition-all duration-700 ${
          aboutInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}
      >
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Text */}
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-red-500 mb-3 font-black">About the Store</p>
              <h2 className="text-4xl md:text-5xl font-black text-white tracking-tighter mb-6 leading-tight">
                Music, Art &amp;<br />Brand — All J18
              </h2>
              <p className="text-white/65 text-base leading-relaxed mb-5">
                JEIGHTEEN is the creative brand of Jonna Rincon — a producer, DJ, and visual artist from Tilburg. The store brings together everything that comes out of that creative process: high-quality beats for your music, professional audio services, original artwork, and branded merchandise.
              </p>
              <p className="text-white/50 text-sm leading-relaxed mb-8">
                10+ years of production experience across Moombahton, Hip Hop, R&amp;B, EDM, and more. Every service and product in this store carries that same standard.
              </p>
              <div className="flex flex-wrap gap-3">
                {['Beats', 'Mix & Master', 'Studio', 'Merchandise', 'Art'].map((tag) => (
                  <span
                    key={tag}
                    className="px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-white/70 bg-white/[0.06] border border-white/[0.1] rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Visual block — photo grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="aspect-square overflow-hidden rounded-xl">
                <img
                  src="/DJI_20251115114029_0004_D.JPG"
                  alt=""
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="aspect-square overflow-hidden rounded-xl">
                <img
                  src="/Menu Foto 1.png"
                  alt=""
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="aspect-square overflow-hidden rounded-xl">
                <img
                  src="/edited-j18.png"
                  alt=""
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="aspect-square overflow-hidden rounded-xl bg-white/[0.04] border border-white/[0.08] flex flex-col items-center justify-center p-4">
                <img src="/JEIGHTEEN-logo.png" alt="JEIGHTEEN" className="w-20 h-20 object-contain mb-3 opacity-80" />
                <p className="text-xs font-black uppercase tracking-widest text-white/40 text-center">
                  Est. J18
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── CTA BANNER ─── */}
      <section
        ref={ctaRef as React.RefObject<HTMLElement>}
        className={`relative py-28 px-4 md:px-8 overflow-hidden transition-all duration-700 ${
          ctaInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}
      >
        <div className="absolute inset-0">
          <img
            src="/DJI_20251018172151_0031_D.JPG"
            alt=""
            className="w-full h-full object-cover"
            style={{ objectPosition: 'center 35%' }}
          />
          <div className="absolute inset-0 bg-black/75" />
        </div>
        <div className="relative z-10 max-w-3xl mx-auto text-center">
          <p className="text-xs font-black uppercase tracking-[0.4em] text-red-500 mb-4">JEIGHTEEN</p>
          <h2 className="text-4xl md:text-6xl font-black text-white tracking-tighter mb-5 leading-none">
            Ready to create<br />something?
          </h2>
          <p className="text-white/60 text-lg mb-10 leading-relaxed">
            Browse beats, book a session, grab some merch, or pick up original art.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              to="/shop/beats"
              className="px-8 py-3.5 bg-red-600 hover:bg-red-700 text-white font-black text-sm uppercase tracking-widest transition-all duration-300 hover:scale-105 rounded-full"
            >
              Browse Beats
            </Link>
            <Link
              to="/shop/services"
              className="px-8 py-3.5 bg-white/10 border border-white/25 backdrop-blur-sm text-white font-black text-sm uppercase tracking-widest hover:bg-white/20 transition-all duration-300 rounded-full"
            >
              Book a Service
            </Link>
          </div>
        </div>
      </section>

      <ShopFooter />
    </div>
  );
};

export default ShopPage;
