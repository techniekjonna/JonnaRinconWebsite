import React, { useMemo, useState } from 'react';
import { Zap, Headphones, Music, Volume2, Users, Palette, ArrowRight } from 'lucide-react';
import Navigation from '../../components/Navigation';
import Footer from '../../components/Footer';
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
    <div className="min-h-screen text-white">
      {/* Fixed Dark Overlay */}
      <div className="fixed inset-0 w-full h-screen -z-10 bg-black/20" />

      <Navigation isDarkOverlay={true} isLightMode={false} />

      {/* Hero Section */}
      <section className="relative pt-40 px-6 md:px-12 pb-4">
        <div className="relative z-10 max-w-7xl mx-auto w-full">
          <h1
            ref={heroTitle.ref as React.RefObject<HTMLHeadingElement>}
            style={{ fontSize: 'clamp(1.875rem, 8vw, 10.2rem)' }}
            className="font-black uppercase leading-[0.85] tracking-tighter mb-8 text-center"
          >
            {heroTitle.display}
          </h1>
          <p className="text-white/30 text-sm md:text-base text-center max-w-2xl mx-auto">
            Professional music production services to elevate your sound. Get expert guidance from
            an experienced electronic music artist.
          </p>
        </div>
      </section>

      {/* Services Grid */}
      <section className="px-6 md:px-12 py-16 md:py-24">
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {formattedServices.map((service) => {
                const Icon = getIcon(service.icon);
                return (
                  <button
                    key={service.id}
                    onClick={() => handleServiceClick(service)}
                    className="group relative bg-white/[0.04] backdrop-blur-md border border-white/[0.06] rounded-3xl p-6 md:p-8 hover:border-white/[0.12] transition-all duration-500 hover:scale-[1.02] hover:bg-white/[0.08] flex flex-col text-left cursor-pointer"
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
      <section className="px-6 md:px-12 py-16 md:py-24">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white/[0.04] backdrop-blur-md border border-white/[0.06] rounded-3xl p-8 md:p-12 text-center">
            <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tight mb-3">
              Ready to Work Together?
            </h2>
            <p className="text-white/30 text-sm md:text-base mb-8 max-w-md mx-auto">
              Have a custom project or want to discuss something specific? Get in touch to get
              started.
            </p>
            <button className="px-8 md:px-10 py-3.5 bg-red-600 hover:bg-red-500 text-white rounded-2xl font-bold transition-all hover:scale-[1.03]">
              Contact Me
            </button>
          </div>
        </div>
      </section>

      <Footer />

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
