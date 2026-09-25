import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Music, Headphones } from 'lucide-react';
import Footer from '../../components/Footer';
import { useScrollToTop } from '../../hooks/useScrollToTop';
import { useInView } from '../../hooks/useInView';

interface Category {
  id: string;
  label: string;
  tagline: string;
  description: string;
  href: string;
  image: string;
  icon: React.ComponentType<{ className?: string }>;
}

const categories: Category[] = [
  {
    id: 'beats',
    label: 'Beats',
    tagline: 'Find your sound',
    description: 'High-quality instrumentals across every genre. Exclusive licenses available.',
    href: '/shop/beats',
    image: '/stu.png',
    icon: Music,
  },
  {
    id: 'services',
    label: 'Services',
    tagline: 'Professional audio',
    description: 'Mix & Master, studio sessions, and production consulting — tailored to your project.',
    href: '/shop/services',
    image: '/DJI_20251017150728_0019_D.JPG',
    icon: Headphones,
  },
];

interface CategoryCardProps {
  category: Category;
  index: number;
}

const CategoryCard: React.FC<CategoryCardProps> = ({ category, index }) => {
  const [ref, inView] = useInView({ threshold: 0.1 });
  const Icon = category.icon;

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
        className="group relative min-h-[320px] md:min-h-[420px] overflow-hidden rounded-2xl block border border-white/10 hover:border-red-600/50 transition-all duration-500"
      >
        {/* Background image */}
        <img
          src={category.image}
          alt={category.label}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />

        {/* Gradient overlay — bottom up */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />

        {/* Hover tint */}
        <div className="absolute inset-0 bg-red-600/0 group-hover:bg-red-600/10 transition-all duration-500" />

        {/* Top-left icon badge */}
        <div className="absolute top-5 left-5 w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-white/20 flex items-center justify-center">
          <Icon className="w-5 h-5 text-white/90" />
        </div>

        {/* Content anchored to bottom */}
        <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-7">
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
  const [aboutRef, aboutInView] = useInView({ threshold: 0.1 });
  const [ctaRef, ctaInView] = useInView({ threshold: 0.1 });

  return (
    <div className="min-h-screen text-white">
      <main className="pt-20">

        {/* ─── HEADER ─── */}
        <section
          className="relative w-full flex flex-col items-center justify-center text-center px-6"
          style={{ minHeight: '38vh' }}
        >
          <p className="text-xs font-black uppercase tracking-[0.45em] text-red-500 mb-4">
            JONNA RINCON STORE
          </p>
          <h1
            className="font-black uppercase leading-none tracking-tighter mb-4 text-white"
            style={{ fontSize: 'clamp(3rem, 9vw, 7rem)' }}
          >
            SHOP
          </h1>
          <p className="text-white/70 text-base md:text-lg max-w-xl mx-auto">
            Beats, services, and studio sessions — all in one place.
          </p>
        </section>

        {/* ─── CATEGORIES ─── */}
        <section className="px-4 md:px-8 lg:px-12 py-12">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
              {categories.map((cat, i) => (
                <CategoryCard key={cat.id} category={cat} index={i} />
              ))}
            </div>
          </div>
        </section>

        {/* ─── ABOUT (shop-focused) ─── */}
        <section
          ref={aboutRef as React.RefObject<HTMLElement>}
          className={`px-4 md:px-8 lg:px-12 py-16 transition-all duration-700 ${
            aboutInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              {/* Text */}
              <div>
                <p className="text-xs uppercase tracking-[0.4em] text-red-500 mb-3 font-black">About the Store</p>
                <h2 className="text-4xl md:text-5xl font-black text-white tracking-tighter mb-6 leading-tight">
                  Beats, Sound &amp;<br />Sessions
                </h2>
                <p className="text-white/65 text-base leading-relaxed mb-5">
                  Jonna Rincon is a producer and audio engineer based in Tilburg. The store brings together high-quality beats, professional audio services, and in-studio sessions.
                </p>
                <p className="text-white/50 text-sm leading-relaxed mb-8">
                  10+ years of production experience across Moombahton, Hip Hop, R&amp;B, EDM, and more. Every service and product in this store carries that same standard.
                </p>
                <div className="flex flex-wrap gap-3">
                  {['Beats', 'Mix & Master', 'Studio Sessions'].map((tag) => (
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
                    src="/stu.png"
                    alt=""
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="aspect-square overflow-hidden rounded-xl">
                  <img
                    src="/DJI_20251017150728_0019_D.JPG"
                    alt=""
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="aspect-square overflow-hidden rounded-xl bg-white/[0.04] border border-white/[0.08] flex flex-col items-center justify-center p-4">
                  <img src="/Jonna Rincon Logo WH.png" alt="Jonna Rincon" className="w-24 h-24 md:w-28 md:h-28 object-contain mb-3 opacity-80" />
                  <p className="text-xs font-black uppercase tracking-widest text-white/40 text-center">
                    Jonna Rincon
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── CTA ─── */}
        <section
          ref={ctaRef as React.RefObject<HTMLElement>}
          className={`px-4 md:px-8 py-20 text-center transition-all duration-700 ${
            ctaInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          <div className="max-w-3xl mx-auto">
            <p className="text-xs font-black uppercase tracking-[0.4em] text-red-500 mb-4">JONNA RINCON</p>
            <h2 className="text-4xl md:text-6xl font-black text-white tracking-tighter mb-5 leading-none">
              Ready to create<br />something?
            </h2>
            <p className="text-white/60 text-lg mb-10 leading-relaxed">
              Browse beats, book a service, or reserve a studio session.
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

        <Footer />
      </main>
    </div>
  );
};

export default ShopPage;
