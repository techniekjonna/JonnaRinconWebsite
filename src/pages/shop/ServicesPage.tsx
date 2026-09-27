import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, Headphones, Music, Volume2, Users, Palette, ArrowRight, Radio } from 'lucide-react';
import Footer from '../../components/Footer';
import { useCyberDecodeInView } from '../../hooks/useCyberDecode';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useServices } from '../../hooks/useServices';
import { Service } from '../../lib/firebase/types';
import { useScrollToTop } from '../../hooks/useScrollToTop';

const iconMap: Record<string, typeof Zap> = {
  Zap,
  Headphones,
  Music,
  Volume2,
  Users,
  Palette,
};

const getIcon = (iconName: string): typeof Zap => {
  return iconMap[iconName] || Zap;
};

const formatRate = (rate: number): string => {
  return `From €${rate}`;
};

const isMixMasterService = (service: Service): boolean => {
  const name = service.name.toLowerCase();
  const slug = (service.slug || '').toLowerCase();
  return name.includes('mix') || slug.includes('mix');
};

const isStudioSessionService = (service: Service): boolean => {
  const name = service.name.toLowerCase();
  const slug = (service.slug || '').toLowerCase();
  return name.includes('studio') || slug.includes('studio');
};

const ServicesPage: React.FC = () => {
  useScrollToTop();
  const navigate = useNavigate();
  const heroTitle = useCyberDecodeInView('Services');
  const { services, loading } = useServices({ status: 'published' });

  const formattedServices = useMemo(() => {
    return services.map((service) => ({
      ...service,
      displayRate: formatRate(service.rate),
    }));
  }, [services]);

  const handleServiceClick = (service: Service) => {
    if (isMixMasterService(service)) {
      navigate('/mix-master');
    } else if (isStudioSessionService(service)) {
      navigate('/studio-session');
    } else {
      navigate(`/shop/services/${service.id}`);
    }
  };

  return (
    <div className="min-h-screen text-white">

      {/* Header */}
      <section
        className="relative w-full flex flex-col items-center justify-center text-center px-6 pt-20"
        style={{ minHeight: '38vh' }}
      >
        <p className="text-xs font-black uppercase tracking-[0.45em] text-red-500 mb-4">JONNA RINCON STORE</p>
        <h1
          ref={heroTitle.ref as React.RefObject<HTMLHeadingElement>}
          style={{ fontSize: 'clamp(2.5rem, 9vw, 7rem)' }}
          className="font-black uppercase leading-[0.9] tracking-tighter mb-4 text-white"
        >
          {heroTitle.display}
        </h1>
        <p className="text-white/70 text-base md:text-lg max-w-xl mx-auto">
          Professional music production services to elevate your sound. Get expert guidance from an experienced electronic music artist.
        </p>
      </section>

      {/* Studio Session callout */}
      <section className="px-6 md:px-12 pb-2">
        <div className="max-w-7xl mx-auto">
          <button
            onClick={() => navigate('/studio-session')}
            className="w-full flex items-center justify-between gap-4 px-6 py-4 bg-white/[0.04] border border-white/[0.08] hover:border-red-600/30 hover:bg-white/[0.06] rounded-2xl transition-all duration-300 text-left"
          >
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-red-600/10 border border-red-600/20 flex items-center justify-center flex-shrink-0">
                <Radio className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <p className="text-white font-bold text-sm">Also booking Studio Sessions</p>
                <p className="text-white/40 text-xs mt-0.5">In-studio recording with Jonna, in Limburg — pick a date and get started.</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-white/40 flex-shrink-0" />
          </button>
        </div>
      </section>

      {/* Services — big, spacious rows matching the homepage sections rather
          than a compact scrollable list; there are only ever a couple of
          these, so they should feel generous, not efficient */}
      <section className="px-6 md:px-12 py-10 md:py-14">
        <div className="max-w-7xl mx-auto">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <LoadingSpinner text="Loading services..." />
            </div>
          ) : formattedServices.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-white/50">No services available at the moment.</div>
            </div>
          ) : (
            <div className="flex flex-col gap-16 md:gap-24">
              {formattedServices.map((service, i) => {
                const Icon = getIcon(service.icon);
                const reverse = i % 2 === 1;
                return (
                  <div
                    key={service.id}
                    className="max-w-[1100px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-center w-full"
                  >
                    {/* Text */}
                    <div className={reverse ? 'lg:order-2' : ''}>
                      <p className="text-xs font-black uppercase tracking-[0.4em] text-red-500 mb-3 flex items-center gap-2">
                        <Icon size={13} />
                        Service
                      </p>
                      <h2 className="text-3xl md:text-5xl font-black text-white tracking-tighter mb-5 leading-tight">
                        {service.name}
                      </h2>
                      <p className="text-white/60 text-base leading-relaxed mb-8 max-w-md">
                        {service.description}
                      </p>
                      <div className="flex items-center gap-5 flex-wrap">
                        <button
                          onClick={() => handleServiceClick(service)}
                          className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 border border-white/20 text-white font-black text-xs uppercase tracking-widest hover:bg-white/20 transition-all duration-300 rounded-full"
                        >
                          {service.cta}
                          <ArrowRight size={14} />
                        </button>
                        <span className="text-sm text-white/30 font-bold uppercase tracking-wider">
                          {service.displayRate}
                        </span>
                      </div>
                    </div>

                    {/* Image — desaturated and darkened with a soft radial
                        mask, matching the homepage sections */}
                    <div className={`relative aspect-[4/3] ${reverse ? 'lg:order-1' : ''}`}>
                      <div
                        className="absolute inset-0"
                        style={{
                          maskImage: 'radial-gradient(ellipse 62% 62% at 50% 45%, black 8%, transparent 92%)',
                          WebkitMaskImage: 'radial-gradient(ellipse 62% 62% at 50% 45%, black 8%, transparent 92%)',
                        }}
                      >
                        {service.coverUrl ? (
                          <img
                            src={service.coverUrl}
                            alt={service.name}
                            className="w-full h-full object-cover"
                            style={{ filter: 'grayscale(1) contrast(1.25) brightness(0.4)' }}
                          />
                        ) : (
                          <div className={`w-full h-full bg-gradient-to-br ${service.gradient} flex items-center justify-center`}>
                            <Icon className="w-20 h-20 text-white/80" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-b from-red-950/25 via-transparent to-black/50" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-6 md:px-12 py-14 md:py-20">
        <div className="max-w-7xl mx-auto">
          <div className="relative overflow-hidden bg-white/[0.03] border border-white/[0.07] rounded-2xl p-8 md:p-12 text-center">
            <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'radial-gradient(ellipse at 50% 0%, rgba(220,38,38,0.08) 0%, transparent 70%)' }} />
            <p className="text-xs font-black uppercase tracking-[0.3em] text-red-500 mb-4">Get In Touch</p>
            <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tight mb-3">
              Ready to Work Together?
            </h2>
            <p className="text-white/40 text-sm md:text-base mb-8 max-w-md mx-auto">
              Have a custom project or want to discuss something specific? Get in touch to get started.
            </p>
            <a href="/contact" className="inline-flex items-center gap-2 px-8 md:px-10 py-3.5 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold transition-all hover:scale-[1.03] uppercase tracking-wider text-sm">
              Contact Me <ArrowRight size={16} />
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default ServicesPage;
