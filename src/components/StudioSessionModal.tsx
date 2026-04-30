import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, ShoppingCart, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Service } from '../lib/firebase/types';
import { useAuth } from '../contexts/AuthContext';
import { useCartContext } from '../contexts/CartContext';
import LoginModal from './LoginModal';
import {
  getAgendaDaysByMonth,
} from '../lib/firebase/services/agendaService';

interface StudioSessionModalProps {
  service: Service | null;
  isOpen: boolean;
  onClose: () => void;
}

interface HourRate {
  hours: number;
  price: number;
}

const StudioSessionModal: React.FC<StudioSessionModalProps> = ({ service, isOpen, onClose }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addItem } = useCartContext();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [page, setPage] = useState<'overview' | 'calendar'>('overview');

  // Pricing
  const [useCustomHours, setUseCustomHours] = useState(false);
  const [hourRates, setHourRates] = useState<HourRate[]>([
    { hours: 2, price: 200 },
    { hours: 4, price: 350 },
  ]);

  // Calendar
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedRate, setSelectedRate] = useState<HourRate | null>(null);
  const [studioAvailableDays, setStudioAvailableDays] = useState<Set<string>>(new Set());

  useEffect(() => {
    const loadStudioDays = async () => {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const days = await getAgendaDaysByMonth(year, month);

      const studioDays = new Set<string>();
      days.forEach(day => {
        if (day.statusId === 'beschikbaar_studio') {
          studioDays.add(day.date);
        }
      });

      setStudioAvailableDays(studioDays);
    };

    loadStudioDays();
  }, [currentDate]);

  if (!isOpen || !service) return null;

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const formatDate = (year: number, month: number, day: number) => {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };

  const monthString = currentDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  const daysInMonth = getDaysInMonth(currentDate);
  const firstDay = getFirstDayOfMonth(currentDate);

  const calendarDays = [];
  for (let i = 0; i < firstDay; i++) {
    calendarDays.push(null);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }

  const handleAddRate = () => {
    if (hourRates.length < 5) {
      setHourRates([...hourRates, { hours: 1, price: 100 }]);
    }
  };

  const handleRemoveRate = (idx: number) => {
    setHourRates(hourRates.filter((_, i) => i !== idx));
  };

  const handleUpdateRate = (idx: number, field: 'hours' | 'price', value: number) => {
    const updated = [...hourRates];
    updated[idx][field] = value;
    setHourRates(updated);
  };

  const handleAddToCart = () => {
    if (!selectedDate || !selectedRate) {
      alert('Please select both a date and duration');
      return;
    }

    if (!user) {
      setShowLoginModal(true);
      return;
    }

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
    onClose();
  };

  const selectDate = (day: number) => {
    const dateStr = formatDate(currentDate.getFullYear(), currentDate.getMonth(), day);
    if (studioAvailableDays.has(dateStr)) {
      setSelectedDate(dateStr);
    }
  };

  return (
    <>
      <div className={`fixed inset-0 z-50 transition-all duration-300 ${isOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`}>
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

        <div className="fixed inset-0 flex items-center justify-center p-4 overflow-y-auto">
          <div className="relative bg-black border border-white/10 rounded-3xl max-w-2xl w-full my-8">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-black/80 backdrop-blur-sm border-b border-white/10 px-6 md:px-8 py-5 flex items-center justify-between rounded-t-3xl">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-white">{service.name}</h2>
                <p className="text-white/40 text-xs mt-1">{page === 'overview' ? 'Configure your session' : 'Select available date'}</p>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                <X size={24} className="text-white/60 hover:text-white" />
              </button>
            </div>

            {/* Content */}
            <div className="px-6 md:px-8 py-6">
              {page === 'overview' ? (
                // PAGE 1: Overview
                <div className="space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto">
                  {/* Service Description */}
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold text-white/60 uppercase">About</h3>
                    <p className="text-white/70 text-sm">{service.description}</p>
                  </div>

                  {/* Studio Highlights - Experience */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white/[0.05] border border-white/10 rounded-xl p-3">
                      <p className="text-white/40 text-xs uppercase">Experience</p>
                      <p className="text-xl font-bold text-white">50+</p>
                      <p className="text-xs text-white/50">Artists worked with</p>
                    </div>
                    <div className="bg-white/[0.05] border border-white/10 rounded-xl p-3">
                      <p className="text-white/40 text-xs uppercase">Studio Hours</p>
                      <p className="text-xl font-bold text-white">10K+</p>
                      <p className="text-xs text-white/50">Production hours</p>
                    </div>
                  </div>

                  {/* Equipment & Setup */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-white/60 uppercase">Studio Setup</h3>
                    <div className="bg-white/[0.03] border border-white/10 rounded-xl p-4 space-y-3">
                      <div className="space-y-1">
                        <p className="text-xs text-white/40 uppercase">Recording DAW</p>
                        <p className="text-white text-sm">Logic Pro</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-white/40 uppercase">Equipment</p>
                        <p className="text-white text-sm">Professional Software & Hardware</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-white/40 uppercase">Location</p>
                        <p className="text-white text-sm">Limburg, The Netherlands</p>
                      </div>
                    </div>
                  </div>

                  {/* Studio Vibe & Features */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-white/60 uppercase">Studio Features</h3>
                    <div className="bg-white/[0.03] border border-white/10 rounded-xl p-4 space-y-2">
                      <div className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 bg-red-600 rounded-full mt-1 flex-shrink-0" />
                        <p className="text-white/70 text-sm">Artistic studio with art made by Jonna Rincon</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 bg-red-600 rounded-full mt-1 flex-shrink-0" />
                        <p className="text-white/70 text-sm">Self-made studio environment</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 bg-red-600 rounded-full mt-1 flex-shrink-0" />
                        <p className="text-white/70 text-sm">Good vibes & creative atmosphere</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 bg-red-600 rounded-full mt-1 flex-shrink-0" />
                        <p className="text-white/70 text-sm">Mostly experienced in Dutch urban scene</p>
                      </div>
                    </div>
                  </div>

                  {/* Base Rate */}
                  <div className="bg-white/[0.05] border border-white/10 rounded-xl p-4">
                    <p className="text-white/40 text-xs uppercase">Base Rate</p>
                    <p className="text-2xl font-bold text-white">€{service.rate}<span className="text-sm text-white/40">/hour</span></p>
                  </div>

                  {/* Next Button */}
                  <button
                    onClick={() => setPage('calendar')}
                    className="w-full py-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold transition-all flex items-center justify-center gap-2"
                  >
                    Continue to Booking <ArrowRight size={18} />
                  </button>
                </div>
              ) : (
                // PAGE 2: Calendar & Selection
                <div className="space-y-4">
                  {/* Compact Calendar */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between bg-white/[0.05] rounded-lg p-3">
                      <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))} className="p-1 hover:bg-white/10 rounded">
                        <ChevronLeft size={16} className="text-white" />
                      </button>
                      <span className="text-sm font-semibold text-white">{monthString}</span>
                      <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))} className="p-1 hover:bg-white/10 rounded">
                        <ChevronRight size={16} className="text-white" />
                      </button>
                    </div>

                    {/* Calendar Grid - Compact */}
                    <div className="bg-white/[0.03] border border-white/10 rounded-xl p-3 space-y-2">
                      <div className="grid grid-cols-7 gap-1">
                        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => (
                          <div key={d} className="text-center text-[10px] font-semibold text-white/40 py-1">
                            {d}
                          </div>
                        ))}
                      </div>

                      <div className="grid grid-cols-7 gap-1">
                        {calendarDays.map((day, idx) => {
                          if (day === null) return <div key={`empty-${idx}`} />;

                          const dateStr = formatDate(currentDate.getFullYear(), currentDate.getMonth(), day);
                          const isAvailable = studioAvailableDays.has(dateStr);
                          const isSelected = selectedDate === dateStr;

                          return (
                            <button
                              key={day}
                              onClick={() => selectDate(day)}
                              disabled={!isAvailable}
                              className={`aspect-square flex items-center justify-center text-xs font-semibold rounded transition-all ${
                                isSelected
                                  ? 'bg-red-600 text-white'
                                  : isAvailable
                                  ? 'bg-green-600/20 text-green-400 hover:bg-green-600/30'
                                  : 'bg-white/[0.02] text-white/20'
                              }`}
                            >
                              {day}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Duration Selection */}
                  {useCustomHours ? (
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-white/60 uppercase">Select Duration</label>
                      <div className="grid grid-cols-1 gap-2">
                        {hourRates.map(rate => (
                          <button
                            key={`${rate.hours}-${rate.price}`}
                            onClick={() => setSelectedRate(rate)}
                            className={`p-3 rounded-lg border-2 transition-all text-left ${
                              selectedRate?.hours === rate.hours && selectedRate?.price === rate.price
                                ? 'bg-red-600/20 border-red-600/40 text-red-400'
                                : 'bg-white/[0.05] border-white/10 text-white/60 hover:bg-white/[0.08]'
                            }`}
                          >
                            <div className="font-semibold text-sm">{rate.hours}h Session</div>
                            <div className="text-xs text-white/40">€{rate.price}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white/[0.05] border border-white/10 rounded-xl p-4">
                      <p className="text-xs text-white/40 uppercase mb-2">Price</p>
                      <p className="text-2xl font-bold text-white">€{service.rate}<span className="text-sm text-white/40">/hour</span></p>
                      <p className="text-xs text-white/50 mt-2">Enter hours at checkout</p>
                    </div>
                  )}

                  {selectedDate && (
                    <div className="bg-green-600/10 border border-green-600/30 rounded-lg p-3">
                      <p className="text-green-400 text-xs font-semibold uppercase">Selected Date</p>
                      <p className="text-white text-sm font-medium">{selectedDate}</p>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    <button
                      onClick={() => setPage('overview')}
                      className="flex-1 py-3 rounded-xl bg-white/[0.05] border border-white/10 text-white font-semibold hover:bg-white/[0.08]"
                    >
                      Back
                    </button>
                    <button
                      onClick={handleAddToCart}
                      disabled={!selectedDate || (!useCustomHours && !selectedRate)}
                      className={`flex-1 py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
                        selectedDate && (useCustomHours ? selectedRate : true)
                          ? 'bg-red-600 hover:bg-red-700 text-white cursor-pointer'
                          : 'bg-white/[0.05] text-white/40 cursor-not-allowed'
                      }`}
                    >
                      <ShoppingCart size={18} />
                      Add to Cart {selectedRate && `- €${selectedRate.price}`}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {showLoginModal && <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />}
    </>
  );
};

export default StudioSessionModal;
