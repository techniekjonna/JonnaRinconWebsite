import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Send, ArrowRight, Radio, Headphones, Check } from 'lucide-react';
import Footer from '../components/Footer';
import LoginModal from '../components/LoginModal';
import { useAuth } from '../contexts/AuthContext';
import { useScrollToTop } from '../hooks/useScrollToTop';
import { useServices } from '../hooks/useServices';
import { getAgendaDaysByMonth } from '../lib/firebase/services/agendaService';
import { Service } from '../lib/firebase/types';
import { db } from '../lib/firebase/config';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { useT } from '../contexts/LanguageContext';

interface HourRate {
  hours: number;
  price: number;
}

// Same fallback cover used on the services list / detail pages so this
// standalone page shows the same photo instead of no image at all.
const FALLBACK_IMAGE = '/stu.png';

const isStudioService = (s: Service) => {
  const n = s.name.toLowerCase();
  const sl = (s.slug || '').toLowerCase();
  return n.includes('studio') || sl.includes('studio');
};

export default function StudioSessionPage() {
  useScrollToTop();
  const navigate = useNavigate();
  const t = useT();
  const { user } = useAuth();
  const { services, loading } = useServices({ status: 'published' });

  const service = services.find(isStudioService) ?? null;
  const image = service?.coverUrl || FALLBACK_IMAGE;

  const [page, setPage] = useState<'overview' | 'calendar'>('overview');
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedRate, setSelectedRate] = useState<HourRate | null>(null);
  const [studioAvailableDays, setStudioAvailableDays] = useState<Set<string>>(new Set());
  const [bookingSent, setBookingSent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const hourRates: HourRate[] = [
    { hours: 2, price: 200 },
    { hours: 4, price: 350 },
  ];

  useEffect(() => {
    const load = async () => {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const days = await getAgendaDaysByMonth(year, month);
      const set = new Set<string>();
      days.forEach(d => { if (d.statusId === 'beschikbaar_studio') set.add(d.date); });
      setStudioAvailableDays(set);
    };
    load();
  }, [currentDate]);

  const getDaysInMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  const getFirstDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1).getDay();
  const fmt = (y: number, m: number, day: number) =>
    `${y}-${String(m + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  const monthString = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const daysInMonth = getDaysInMonth(currentDate);
  const firstDay = getFirstDay(currentDate);
  const calendarDays: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) calendarDays.push(null);
  for (let d = 1; d <= daysInMonth; d++) calendarDays.push(d);

  const selectDate = (day: number) => {
    const dateStr = fmt(currentDate.getFullYear(), currentDate.getMonth(), day);
    if (studioAvailableDays.has(dateStr)) setSelectedDate(dateStr);
  };

  const handleBookSession = async () => {
    if (!selectedDate || !selectedRate || !service) return;
    if (!user) { setShowLoginModal(true); return; }
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'supportMessages'), {
        senderId: user.uid,
        senderName: user.displayName || 'Customer',
        senderEmail: user.email,
        senderRole: 'customer',
        recipientGroup: 'support',
        category: 'Studio Session',
        message: `New Studio Session booking request.\n\nDate: ${selectedDate}\nDuration: ${selectedRate.hours}h\nPrice: €${selectedRate.price}`,
        createdAt: serverTimestamp(),
        status: 'sent',
      });
      setBookingSent(true);
    } catch (err) {
      console.error('Failed to submit studio session booking:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen text-white">
      <main className="pt-32 pb-24 px-4 max-w-6xl mx-auto">
        {loading && (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-white/20 border-t-red-600 rounded-full animate-spin" />
          </div>
        )}

        {!loading && !service && (
          <div className="text-center py-20">
            <Radio className="w-12 h-12 text-white/20 mx-auto mb-4" />
            <p className="text-white/40">{t('No studio session service available at the moment.', 'Momenteel geen studio sessie beschikbaar.')}</p>
            <p className="text-white/25 text-sm mt-2">{t('Check back soon or contact directly.', 'Kom later terug of neem direct contact op.')}</p>
          </div>
        )}

        {!loading && service && bookingSent && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 bg-green-500/20 border border-green-500/40 flex items-center justify-center mb-4">
              <Send size={26} className="text-green-400" />
            </div>
            <h3 className="text-2xl font-black text-white uppercase mb-2">{t('Request Sent!', 'Aanvraag Verzonden!')}</h3>
            <p className="text-white/50 text-sm mb-6 max-w-sm">
              {t('Your studio session request for', 'Jouw studio sessie aanvraag voor')} {selectedDate} {t('has been received. Jonna will get back to you to confirm.', 'is ontvangen. Jonna neemt contact met je op om te bevestigen.')}
            </p>
            <button
              onClick={() => navigate('/shop/services')}
              className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold uppercase tracking-wider transition-all"
            >
              {t('Back to Services', 'Terug naar Diensten')}
            </button>
          </div>
        )}

        {!loading && service && !bookingSent && (
          <>
            {page === 'overview' ? (
              <div>
                {/* Hero row — flowing text paired with the same photo used
                    for this service on the services list, instead of
                    stacked stat boxes */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-center mb-16">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.4em] text-red-500 mb-3 flex items-center gap-2">
                      <Headphones size={13} />
                      {t('Service', 'Dienst')}
                    </p>
                    <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter text-white leading-[0.95] mb-5">
                      {t('Studio Session', 'Studio Sessie')}
                    </h1>
                    <p className="text-white/60 text-base leading-relaxed mb-6 max-w-md">
                      {service.description || t(
                        "Come to the studio and create something real. Jonna works with you directly — from recording to production to mixing.",
                        'Kom naar de studio en creëer iets echts. Jonna werkt direct met je samen — van opname tot productie tot mixing.'
                      )}
                    </p>

                    <ul className="space-y-2.5 mb-8">
                      {[
                        t('Artistic studio with art made by Jonna Rincon', 'Artistieke studio met kunst gemaakt door Jonna Rincon'),
                        t('Self-made studio environment', 'Zelfgemaakte studio-omgeving'),
                        t('Good vibes & creative atmosphere', 'Goede vibe & creatieve sfeer'),
                        t('Mostly experienced in Dutch urban scene', 'Vooral ervaren in de Nederlandse urban scene'),
                      ].map(feat => (
                        <li key={feat} className="flex items-start gap-3">
                          <Check size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
                          <span className="text-white/70 text-sm leading-relaxed">{feat}</span>
                        </li>
                      ))}
                    </ul>

                    <div className="flex items-center gap-5 flex-wrap">
                      <button
                        onClick={() => setPage('calendar')}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-500 text-white font-black text-xs uppercase tracking-widest transition-all duration-300 rounded-full"
                      >
                        {t('Continue to Booking', 'Ga naar Boeking')}
                        <ArrowRight size={14} />
                      </button>
                      <span className="text-sm text-white/30 font-bold uppercase tracking-wider">
                        {t('From', 'Vanaf')} €{service.rate}{t('/hour', '/uur')}
                      </span>
                    </div>
                  </div>

                  {/* Image — same fallback photo used for this service on
                      the services list, with the same soft radial mask */}
                  <div className="relative aspect-[4/3]">
                    <div
                      className="absolute inset-0"
                      style={{
                        maskImage: 'radial-gradient(ellipse 52% 70% at 50% 45%, black 8%, transparent 96%)',
                        WebkitMaskImage: 'radial-gradient(ellipse 52% 70% at 50% 45%, black 8%, transparent 96%)',
                      }}
                    >
                      <img
                        src={image}
                        alt={t('Studio Session', 'Studio Sessie')}
                        className="w-full h-full object-cover"
                        style={{ filter: 'contrast(1.1) brightness(0.7)' }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-b from-red-950/20 via-transparent to-black/50" />
                    </div>
                  </div>
                </div>

                {/* Quick facts & studio setup — plain stat columns, no boxes */}
                <div className="flex flex-wrap items-start gap-x-10 gap-y-6 mb-14 pb-10 border-b border-white/10">
                  <div>
                    <p className="text-white/30 text-xs uppercase tracking-wider mb-1">{t('Experience', 'Ervaring')}</p>
                    <p className="text-3xl font-black text-white">50+</p>
                    <p className="text-white/40 text-xs mt-1">{t('Artists worked with', 'Artiesten mee gewerkt')}</p>
                  </div>
                  <div className="w-px h-14 bg-white/10 hidden sm:block" />
                  <div>
                    <p className="text-white/30 text-xs uppercase tracking-wider mb-1">{t('Studio Hours', 'Studio-uren')}</p>
                    <p className="text-3xl font-black text-white">10K+</p>
                    <p className="text-white/40 text-xs mt-1">{t('Production hours', 'Productie-uren')}</p>
                  </div>
                  <div className="w-px h-14 bg-white/10 hidden sm:block" />
                  {[
                    [t('Recording DAW', 'Opname-DAW'), 'Logic Pro'],
                    [t('Equipment', 'Apparatuur'), t('Professional Software & Hardware', 'Professionele Software & Hardware')],
                    [t('Location', 'Locatie'), t('Limburg, The Netherlands', 'Limburg, Nederland')],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <p className="text-white/30 text-xs uppercase tracking-wider mb-1">{label}</p>
                      <p className="text-white text-sm font-bold">{value}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="max-w-2xl mx-auto space-y-6">
                {/* Back */}
                <button
                  onClick={() => setPage('overview')}
                  className="flex items-center gap-2 text-white/40 hover:text-white text-sm transition-colors"
                >
                  <ChevronLeft size={16} /> {t('Back to overview', 'Terug naar overzicht')}
                </button>

                {/* Calendar */}
                <div className="bg-white/[0.04] border border-white/10 p-6">
                  <div className="flex items-center justify-between mb-5">
                    <button
                      onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}
                      className="p-2 hover:bg-white/10 transition-colors"
                    >
                      <ChevronLeft size={18} className="text-white" />
                    </button>
                    <span className="text-white font-bold uppercase tracking-widest text-sm">{monthString}</span>
                    <button
                      onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}
                      className="p-2 hover:bg-white/10 transition-colors"
                    >
                      <ChevronRight size={18} className="text-white" />
                    </button>
                  </div>

                  <div className="grid grid-cols-7 gap-1 mb-2">
                    {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
                      <div key={d} className="text-center text-[10px] font-semibold text-white/30 py-1 uppercase tracking-wider">{d}</div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-1">
                    {calendarDays.map((day, idx) => {
                      if (day === null) return <div key={`e-${idx}`} />;
                      const dateStr = fmt(currentDate.getFullYear(), currentDate.getMonth(), day);
                      const isAvailable = studioAvailableDays.has(dateStr);
                      const isSelected = selectedDate === dateStr;
                      return (
                        <button
                          key={day}
                          onClick={() => selectDate(day)}
                          disabled={!isAvailable}
                          className={`aspect-square flex items-center justify-center text-xs font-bold transition-all ${
                            isSelected
                              ? 'bg-red-600 text-white'
                              : isAvailable
                              ? 'bg-green-600/20 text-green-400 hover:bg-green-600/30'
                              : 'text-white/20 cursor-not-allowed'
                          }`}
                        >
                          {day}
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex items-center gap-4 mt-4 pt-4 border-t border-white/10">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-600/30 border border-green-600/40" />
                      <span className="text-white/40 text-xs">{t('Available', 'Beschikbaar')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-red-600" />
                      <span className="text-white/40 text-xs">{t('Selected', 'Geselecteerd')}</span>
                    </div>
                  </div>
                </div>

                {/* Duration */}
                <div>
                  <p className="text-white/30 text-xs uppercase tracking-wider mb-3">{t('Select Duration', 'Selecteer Duur')}</p>
                  <div className="grid grid-cols-2 gap-3">
                    {hourRates.map(rate => (
                      <button
                        key={rate.hours}
                        onClick={() => setSelectedRate(rate)}
                        className={`p-4 border-2 transition-all text-left ${
                          selectedRate?.hours === rate.hours
                            ? 'bg-red-600/20 border-red-600/60 text-white'
                            : 'bg-white/[0.04] border-white/10 text-white/60 hover:border-white/20'
                        }`}
                      >
                        <p className="font-black text-lg">{rate.hours}h</p>
                        <p className="text-sm font-bold">€{rate.price}</p>
                        <p className="text-xs text-white/40 mt-1">{t('Studio session', 'Studio sessie')}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Selected summary */}
                {(selectedDate || selectedRate) && (
                  <div className="bg-white/[0.04] border border-white/10 p-4 space-y-2">
                    {selectedDate && (
                      <div className="flex justify-between text-sm">
                        <span className="text-white/40">{t('Date', 'Datum')}</span>
                        <span className="text-white font-medium">{selectedDate}</span>
                      </div>
                    )}
                    {selectedRate && (
                      <div className="flex justify-between text-sm">
                        <span className="text-white/40">{t('Duration', 'Duur')}</span>
                        <span className="text-white font-medium">{selectedRate.hours}h — €{selectedRate.price}</span>
                      </div>
                    )}
                  </div>
                )}

                <button
                  onClick={handleBookSession}
                  disabled={!selectedDate || !selectedRate || isSubmitting}
                  className={`w-full py-4 font-bold uppercase tracking-widest text-sm flex items-center justify-center gap-2 transition-all ${
                    selectedDate && selectedRate && !isSubmitting
                      ? 'bg-red-600 hover:bg-red-700 text-white hover:scale-[1.01]'
                      : 'bg-white/[0.05] text-white/30 cursor-not-allowed'
                  }`}
                >
                  <Send size={18} />
                  {isSubmitting ? t('Sending...', 'Verzenden...') : `${t('Book Session', 'Boek Sessie')}${selectedRate ? ` — €${selectedRate.price}` : ''}`}
                </button>
              </div>
            )}
          </>
        )}
      </main>

      <Footer />
      {showLoginModal && <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />}
    </div>
  );
}
