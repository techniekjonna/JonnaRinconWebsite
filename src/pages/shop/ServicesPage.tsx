import React, { useMemo, useState } from 'react';
import { Zap, Headphones, Music, Volume2, Users, Palette, ArrowRight } from 'lucide-react';
import ShopFooter from '../../components/ShopFooter';
import { useCyberDecodeInView } from '../../hooks/useCyberDecode';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useServices } from '../../hooks/useServices';
import { Service } from '../../lib/firebase/types';
import { useScrollToTop } from '../../hooks/useScrollToTop';
import MixMasterModal from '../../components/MixMasterModal';
import StudioSessionModal from '../../components/StudioSessionModal';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Zap,
  Headphones,
  Music,
  Volume2,
  Users,
  Palette,
};

const getIcon = (iconName: string): React.ComponentType<{ className?: string }> => {
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
  const heroTitle = useCyberDecodeInView('Services');
  const { services, loading } = useServices({ status: 'published' });

  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const formattedServices = useMemo(() => {
    return services.map((service) => ({
      ...service,
      displayRate: formatRate(service.rate),
    }));
  }, [services]);

  const handleServiceClick = (service: Service) => {
    setSelectedService(service);
    setModalOpen(true);
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setSelectedService(null);
  };

  return (
    <div className="min-h-screen text-white bg-[#0a0a0a]">

      {/* Hero Section — image extends behind header and ShopNav */}
      <section className="relative overflow-hidden -mt-28 sm:-mt-32">
        <div className="absolute inset-0">
          <img src="/DJI_20251017150728_0019_D.JPG" alt="" className="w-full h-full object-cover" style={{ objectPosition: 'center 35%' }} />
          <div className="absolute inset-0 bg-gradient-to-br from-black/75 via-black/55 to-black/75" />
          <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 70% 50%, rgba(220,38,38,0.07) 0%, transparent 60%)' }} />
          <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-[#0a0a0a] to-transparent" />
        </div>
        <div className="relative z-10 pt-52 sm:pt-56 pb-12 px-6 md:px-12 max-w-7xl mx-auto w-full">
          <p className="text-xs font-black uppercase tracking-[0.45em] text-red-500 mb-4">JONNA RINCON STORE</p>
          <h1
            ref={heroTitle.ref as React.RefObject<HTMLHeadingElement>}
            style={{ fontSize: 'clamp(2.5rem, 9vw, 10.2rem)' }}
            className="font-black uppercase leading-[0.85] tracking-tighter mb-5 text-white"
          >
            {heroTitle.display}
          </h1>
          <p className="text-white/50 text-sm md:text-base max-w-xl">
            Professional music production services to elevate your sound. Get expert guidance from an experienced electronic music artist.
          </p>
        </div>
      </section>

      {/* Services Grid */}
      <section className="px-6 md:px-12 py-14 md:py-20">
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
              {formattedServices.map((service) => {
                const Icon = getIcon(service.icon);
                return (
                  <button
                    key={service.id}
                    onClick={() => handleServiceClick(service)}
                    className="group relative bg-white/[0.03] border border-white/[0.07] rounded-2xl p-6 md:p-7 hover:border-red-600/30 hover:bg-white/[0.06] transition-all duration-400 hover:-translate-y-0.5 hover:shadow-[0_16px_40px_rgba(0,0,0,0.4)] flex flex-col text-left cursor-pointer"
                  >
                    {service.coverUrl ? (
                      <div className="w-14 h-14 rounded-2xl overflow-hidden mb-6 group-hover:scale-110 transition-transform duration-300 flex-shrink-0">
                        <img
                          src={service.coverUrl}
                          alt={service.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div
                        className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${service.gradient} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}
                      >
                        <Icon className="w-7 h-7 text-white" />
                      </div>
                    )}

                    <h3 className="text-xl font-black text-white mb-3 uppercase tracking-tight">
                      {service.name}
                    </h3>
                    <p className="text-white/50 text-sm leading-relaxed mb-6 flex-1">
                      {service.description}
                    </p>

                    <div className="flex items-center justify-between pt-6 border-t border-white/[0.06]">
                      <span className="text-sm text-white/30 font-bold uppercase tracking-wider">
                        {service.displayRate}
                      </span>
                      <span className="flex items-center gap-2 text-xs text-white/40 group-hover:text-red-400 transition-colors font-bold uppercase tracking-wider group-hover:gap-3">
                        {service.cta}
                        <ArrowRight size={16} />
                      </span>
                    </div>
                  </button>
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

      <ShopFooter />

      {/* Service Modals */}
      {selectedService && isMixMasterService(selectedService) && (
        <MixMasterModal
          service={selectedService}
          isOpen={modalOpen}
          onClose={handleModalClose}
        />
      )}

      {selectedService && isStudioSessionService(selectedService) && (
        <StudioSessionModal
          service={selectedService}
          isOpen={modalOpen}
          onClose={handleModalClose}
        />
      )}
    </div>
  );
};

export default ServicesPage;
