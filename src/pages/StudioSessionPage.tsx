import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ShoppingCart, ArrowRight, Radio } from 'lucide-react';
import Navigation from '../components/Navigation';
import Footer from '../components/Footer';
import LoginModal from '../components/LoginModal';
import { useAuth } from '../contexts/AuthContext';
import { useCartContext } from '../contexts/CartContext';
import { useScrollToTop } from '../hooks/useScrollToTop';
import { useServices } from '../hooks/useServices';
import { getAgendaDaysByMonth } from '../lib/firebase/services/agendaService';
import { Service } from '../lib/firebase/types';

interface HourRate {
  hours: number;
  price: number;
}

const isStudioService = (s: Service) => {
  const n = s.name.toLowerCase();
  const sl = (s.slug || '').toLowerCase();
  return n.includes('studio') || sl.includes('studio');
};

export default function StudioSessionPage() {
  useScrollToTop();
  const { user } = useAuth();
  const { addItem } = useCartContext();
  const { services, loading } = useServices({ status: 'published' });

  const service = services.find(isStudioService) ?? null;

  const [page, setPage] = useState<'overview' | 'calendar'>('overview');
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedRate, setSelectedRate] = useState<HourRate | null>(null);
  const [studioAvailableDays, setStudioAvailableDays] = useState<Set<string>>(new Set());

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

  const handleAddToCart = () => {
    if (!selectedDate || !selectedRate || !service) {
      alert('Please select a date and duration');
      return;
    }
    if (!user) { setShowLoginModal(true); return; }
    addItem({
      id: service.id,
      title: `${service.name} - ${selectedRate.hours}h - ${selectedDate}`,
      price: selectedRate.price,
      quantity: 1,
      image: service.coverUrl || '',
      metadata: {
        serviceId: service.id,
        serviceName: service.name,
        bookingDate: selectedDate,
        duration: `${selectedRate.hours}h`,
        price: selectedRate.price,
      },
    });
    alert('Studio session added to cart!');
  };

  return (
    <div className="min-h-screen text-white">
      <Navigation />

      {/* Fixed background */}
      <div className="fixed inset-0 -z-10">
        <img src="/JEIGHTENESIS.jpg" alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/80" />
      </div>

      <main className="pt-32 pb-24 px-4 max-w-3xl mx-auto">
        {/* Page header */}
        <div className="mb-12 text-center">
          <p className="text-white/30 text-xs uppercase tracking-widest mb-3">Services</p>
          <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter text-white">
            Studio Session
          </h1>
          <p className="text-white/40 text-sm mt-4 max-w-md mx-auto">
            Book a session at Jonna Rincon's studio in Limburg, The Netherlands.
          </p>
        </div>

        {loading && (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-white/20 border-t-red-600 rounded-full animate-spin" />
          </div>
        )}

        {!loading && !service && (
          <div className="text-center py-20">
            <Radio className="w-12 h-12 text-white/20 mx-auto mb-4" />
            <p className="text-white/40">No studio session service available at the moment.</p>
            <p className="text-white/25 text-sm mt-2">Check back soon or contact directly.</p>
          </div>
        )}

        {!loading && service && (
          <>
            {page === 'overview' ? (
              <div className="space-y-6">
                {/* Stats */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/[0.05] border border-white/10 p-5">
                    <p className="text-white/30 text-xs uppercase tracking-wider mb-1">Experience</p>
                    <p className="text-3xl font-black text-white">50+</p>
                    <p className="text-white/40 text-xs mt-1">Artists worked with</p>
                  </div>
                  <div className="bg-white/[0.05] border border-white/10 p-5">
                    <p className="text-white/30 text-xs uppercase tracking-wider mb-1">Studio Hours</p>
                    <p className="text-3xl font-black text-white">10K+</p>
                    <p className="text-white/40 text-xs mt-1">Production hours</p>
                  </div>
                </div>

                {/* About */}
                <div className="bg-white/[0.04] border border-white/10 p-6">
                  <p className="text-white/30 text-xs uppercase tracking-wider mb-3">About</p>
                  <p className="text-white/70 text-sm leading-relaxed">
                    {service.description || 'Come to the studio and create something real. Jonna works with you directly — from recording to production to mixing.'}
                  </p>
                </div>

                {/* Setup */}
                <div className="bg-white/[0.04] border border-white/10 p-6">
                  <p className="text-white/30 text-xs uppercase tracking-wider mb-4">Studio Setup</p>
                  <div className="space-y-3">
                    {[
                      ['Recording DAW', 'Logic Pro'],
                      ['Equipment', 'Professional Software & Hardware'],
                      ['Location', 'Limburg, The Netherlands'],
                    ].map(([label, value]) => (
                      <div key={label} className="flex justify-between items-baseline border-b border-white/[0.06] pb-3 last:border-0 last:pb-0">
                        <span className="text-white/30 text-xs uppercase tracking-wider">{label}</span>
                        <span className="text-white text-sm font-medium">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Features */}
                <div className="bg-white/[0.04] border border-white/10 p-6">
                  <p className="text-white/30 text-xs uppercase tracking-wider mb-4">Studio Features</p>
                  <div className="space-y-2.5">
                    {[
                      'Artistic studio with art made by Jonna Rincon',
                      'Self-made studio environment',
                      'Good vibes & creative atmosphere',
                      'Mostly experienced in Dutch urban scene',
                    ].map(feat => (
                      <div key={feat} className="flex items-start gap-3">
                        <div className="w-1.5 h-1.5 bg-red-600 rounded-full mt-1.5 flex-shrink-0" />
                        <p className="text-white/60 text-sm">{feat}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Rate */}
                <div className="bg-white/[0.05] border border-white/10 p-6 flex items-baseline justify-between">
                  <p className="text-white/30 text-xs uppercase tracking-wider">Base Rate</p>
                  <p className="text-white text-2xl font-black">
                    €{service.rate}<span className="text-white/40 text-sm font-normal">/hour</span>
                  </p>
                </div>

                <button
                  onClick={() => setPage('calendar')}
                  className="w-full py-4 bg-red-600 hover:bg-red-700 text-white font-bold uppercase tracking-widest text-sm flex items-center justify-center gap-2 transition-all hover:scale-[1.01]"
                >
                  Continue to Booking <ArrowRight size={18} />
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Back */}
                <button
                  onClick={() => setPage('overview')}
                  className="flex items-center gap-2 text-white/40 hover:text-white text-sm transition-colors"
                >
                  <ChevronLeft size={16} /> Back to overview
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
                      <span className="text-white/40 text-xs">Available</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-red-600" />
                      <span className="text-white/40 text-xs">Selected</span>
                    </div>
                  </div>
                </div>

                {/* Duration */}
                <div>
                  <p className="text-white/30 text-xs uppercase tracking-wider mb-3">Select Duration</p>
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
                        <p className="text-xs text-white/40 mt-1">Studio session</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Selected summary */}
                {(selectedDate || selectedRate) && (
                  <div className="bg-white/[0.04] border border-white/10 p-4 space-y-2">
                    {selectedDate && (
                      <div className="flex justify-between text-sm">
                        <span className="text-white/40">Date</span>
                        <span className="text-white font-medium">{selectedDate}</span>
                      </div>
                    )}
                    {selectedRate && (
                      <div className="flex justify-between text-sm">
                        <span className="text-white/40">Duration</span>
                        <span className="text-white font-medium">{selectedRate.hours}h — €{selectedRate.price}</span>
                      </div>
                    )}
                  </div>
                )}

                <button
                  onClick={handleAddToCart}
                  disabled={!selectedDate || !selectedRate}
                  className={`w-full py-4 font-bold uppercase tracking-widest text-sm flex items-center justify-center gap-2 transition-all ${
                    selectedDate && selectedRate
                      ? 'bg-red-600 hover:bg-red-700 text-white hover:scale-[1.01]'
                      : 'bg-white/[0.05] text-white/30 cursor-not-allowed'
                  }`}
                >
                  <ShoppingCart size={18} />
                  Book Session{selectedRate ? ` — €${selectedRate.price}` : ''}
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
