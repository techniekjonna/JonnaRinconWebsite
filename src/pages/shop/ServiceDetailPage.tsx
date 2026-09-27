import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Check, Send, ArrowLeft, Zap, Headphones, Music, Volume2, Users, Palette } from 'lucide-react';
import Footer from '../../components/Footer';
import LoadingSpinner from '../../components/LoadingSpinner';
import LoginModal from '../../components/LoginModal';
import { useAuth } from '../../contexts/AuthContext';
import { useScrollToTop } from '../../hooks/useScrollToTop';
import { serviceService } from '../../lib/firebase/services';
import { Service } from '../../lib/firebase/types';
import { db } from '../../lib/firebase/config';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { useT, type TFn } from '../../contexts/LanguageContext';

const iconMap: Record<string, typeof Zap> = {
  Zap, Headphones, Music, Volume2, Users, Palette,
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

// Same sensible defaults as the services list, so a service still looks
// and reads well before an admin sets a custom photo or writes features.
const getFallbackImage = (service: Service): string | null => {
  if (isStudioSessionService(service)) return '/stu.png';
  if (isMixMasterService(service)) return '/DJI_20251018172151_0031_D.JPG';
  return null;
};

const getFeatures = (service: Service, t: TFn): string[] => {
  if (isStudioSessionService(service)) {
    return [
      t('In-person recording, production and mixing in one session', 'Persoonlijke opname, productie en mixing in één sessie'),
      t('Artistic, self-built studio environment in Limburg', 'Artistieke, zelfgebouwde studio-omgeving in Limburg'),
      t('Direct, hands-on collaboration with Jonna', 'Directe, hands-on samenwerking met Jonna'),
    ];
  }
  if (isMixMasterService(service)) {
    return [
      t('Radio-ready loudness and clarity, genre-matched', 'Radioklaar volume en helderheid, aangepast aan het genre'),
      t("Unlimited revisions until you're happy with the result", 'Onbeperkte revisies totdat je tevreden bent met het resultaat'),
      t('Fast turnaround, usually within a few days', 'Snelle doorlooptijd, meestal binnen een paar dagen'),
    ];
  }
  return [
    t('Professional quality, every time', 'Professionele kwaliteit, elke keer'),
    t('Direct, personal communication with Jonna', 'Directe, persoonlijke communicatie met Jonna'),
    t('Fast turnaround', 'Snelle doorlooptijd'),
  ];
};

const ServiceDetailPage: React.FC = () => {
  useScrollToTop();
  const { serviceId } = useParams<{ serviceId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const t = useT();

  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [requestSent, setRequestSent] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  useEffect(() => {
    if (!serviceId) return;
    setLoading(true);
    serviceService.getServiceById(serviceId)
      .then(setService)
      .finally(() => setLoading(false));
  }, [serviceId]);

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!service) return;
    if (!user) { setShowLoginModal(true); return; }

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'supportMessages'), {
        senderId: user.uid,
        senderName: user.displayName || t('Customer', 'Klant'),
        senderEmail: user.email,
        senderRole: 'customer',
        recipientGroup: 'support',
        category: service.name,
        message: `New booking request for "${service.name}".${message.trim() ? `\n\n${message.trim()}` : ''}`,
        createdAt: serverTimestamp(),
        status: 'sent',
      });
      setRequestSent(true);
    } catch (err) {
      console.error('Failed to submit service request:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen text-white flex items-center justify-center">
        <LoadingSpinner text={t('Loading service...', 'Dienst laden...')} />
      </div>
    );
  }

  if (!service) {
    return (
      <div className="min-h-screen text-white flex flex-col items-center justify-center px-6 text-center">
        <p className="text-white/50 mb-6">{t('This service could not be found.', 'Deze dienst kon niet worden gevonden.')}</p>
        <button
          onClick={() => navigate('/shop/services')}
          className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold uppercase tracking-wider rounded-xl transition-all"
        >
          {t('Back to Services', 'Terug naar Diensten')}
        </button>
      </div>
    );
  }

  const Icon = iconMap[service.icon] || Zap;
  const image = service.coverUrl || getFallbackImage(service);
  const features = getFeatures(service, t);

  return (
    <div className="min-h-screen text-white">
      <main className="pt-28 pb-20 px-4 md:px-8 max-w-4xl mx-auto">
        <button
          onClick={() => navigate('/shop/services')}
          className="flex items-center gap-2 text-white/40 hover:text-white text-sm transition-colors mb-5"
        >
          <ArrowLeft size={16} /> {t('Back to services', 'Terug naar diensten')}
        </button>

        {requestSent ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-full bg-green-500/20 border border-green-500/40 flex items-center justify-center mb-5">
              <Check size={30} className="text-green-400" />
            </div>
            <h3 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tight mb-2">{t('Request Sent!', 'Aanvraag Verzonden!')}</h3>
            <p className="text-white/50 text-sm mb-8 max-w-sm">
              {t('Your request for', 'Jouw aanvraag voor')} {service.name} {t('has been received. Jonna will get back to you to confirm details.', 'is ontvangen. Jonna neemt contact met je op om de details te bevestigen.')}
            </p>
            <button
              onClick={() => navigate('/shop/services')}
              className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold uppercase tracking-wider rounded-xl transition-all"
            >
              {t('Back to Services', 'Terug naar Diensten')}
            </button>
          </div>
        ) : (
          <>
            {/* Hero banner — image, title, description and rate all in one
                flowing header instead of separate boxes */}
            <div className="relative w-full aspect-[16/9] md:aspect-[3/1] overflow-hidden rounded-2xl mb-8">
              {image ? (
                <img
                  src={image}
                  alt={service.name}
                  className="absolute inset-0 w-full h-full object-cover"
                  style={{ filter: 'contrast(1.1) brightness(0.55)' }}
                />
              ) : (
                <div className={`absolute inset-0 bg-gradient-to-br ${service.gradient} flex items-center justify-center`}>
                  <Icon className="w-20 h-20 text-white/80" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-black/10" />
              <div className="absolute inset-0 flex flex-col justify-end p-5 md:p-8">
                <p className="text-xs font-black uppercase tracking-[0.4em] text-red-400 mb-2 flex items-center gap-2">
                  <Icon size={13} /> {t('Service', 'Dienst')}
                </p>
                <div className="flex items-end justify-between gap-4 flex-wrap">
                  <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tighter leading-tight">
                    {service.name}
                  </h1>
                  <p className="text-2xl md:text-3xl font-black text-white flex-shrink-0">
                    €{service.rate}<span className="text-white/40 text-xs font-normal ml-1">{t('excl. VAT', 'excl. BTW')}</span>
                  </p>
                </div>
              </div>
            </div>

            <p className="text-white/60 text-sm md:text-base leading-relaxed mb-6 max-w-2xl">{service.description}</p>

            <ul className="grid sm:grid-cols-2 gap-x-6 gap-y-2.5 mb-8">
              {features.map((feature) => (
                <li key={feature} className="flex items-start gap-2.5">
                  <Check size={15} className="text-red-500 flex-shrink-0 mt-0.5" />
                  <span className="text-white/70 text-sm leading-relaxed">{feature}</span>
                </li>
              ))}
            </ul>

            {/* Booking — the one real "card" on the page, kept tight so
                the action is close and quick, not buried after scrolling */}
            <form onSubmit={handleRequest} className="border-t border-white/10 pt-6 flex flex-col sm:flex-row gap-3">
              <textarea
                rows={2}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={t('Tell Jonna a bit about what you need... (optional)', 'Vertel Jonna kort wat je nodig hebt... (optioneel)')}
                className="flex-1 px-4 py-3 bg-white/[0.04] border border-white/10 rounded-xl text-white placeholder-white/25 focus:outline-none focus:border-red-500/30 transition-all text-sm resize-none"
              />
              <button
                type="submit"
                disabled={isSubmitting}
                className="sm:w-56 flex-shrink-0 px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 disabled:opacity-50 text-white rounded-xl font-bold uppercase tracking-widest text-sm flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
              >
                <Send size={16} />
                {isSubmitting ? t('Sending...', 'Verzenden...') : t('Send Request', 'Verstuur Aanvraag')}
              </button>
            </form>
          </>
        )}
      </main>

      <Footer />
      {showLoginModal && (
        <LoginModal
          isOpen={showLoginModal}
          onClose={() => setShowLoginModal(false)}
          title={t('Sign In to Request', 'Log In om Aan te Vragen')}
          description={t('You need an account to request this service.', 'Je hebt een account nodig om deze dienst aan te vragen.')}
        />
      )}
    </div>
  );
};

export default ServiceDetailPage;
