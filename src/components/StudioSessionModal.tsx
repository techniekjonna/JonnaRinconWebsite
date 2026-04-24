import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, ShoppingCart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Service } from '../lib/firebase/types';
import { useAuth } from '../contexts/AuthContext';
import { useCartContext } from '../contexts/CartContext';
import LoginModal from './LoginModal';
import {
  getAgendaDaysByMonth,
  getAgendaStatuses,
} from '../lib/firebase/services/agendaService';
import { AgendaStatus } from '../lib/firebase/types';

interface StudioSessionModalProps {
  service: Service | null;
  isOpen: boolean;
  onClose: () => void;
}

const StudioSessionModal: React.FC<StudioSessionModalProps> = ({ service, isOpen, onClose }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addItem } = useCartContext();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [studioAvailableDays, setStudioAvailableDays] = useState<Set<string>>(new Set());
  const [statuses, setStatuses] = useState<AgendaStatus[]>([]);
  const [selectedDelivery, setSelectedDelivery] = useState<'48h' | '72h' | '7days' | null>(null);

  const DELIVERY_OPTIONS = [
    { key: '48h' as const, label: '48H Delivery', price: 250 },
    { key: '72h' as const, label: '72H Delivery', price: 150 },
    { key: '7days' as const, label: '7 Days', price: 100 },
  ];

  useEffect(() => {
    const loadStatuses = async () => {
      const allStatuses = await getAgendaStatuses();
      setStatuses(allStatuses);
    };
    loadStatuses();
  }, []);

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

  const monthString = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const daysInMonth = getDaysInMonth(currentDate);
  const firstDay = getFirstDayOfMonth(currentDate);

  const calendarDays = [];
  for (let i = 0; i < firstDay; i++) {
    calendarDays.push(null);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const handleSelectDate = (day: number) => {
    const dateStr = formatDate(currentDate.getFullYear(), currentDate.getMonth(), day);
    if (studioAvailableDays.has(dateStr)) {
      setSelectedDate(dateStr);
    }
  };

  const handleAddToCart = () => {
    if (!selectedDate || !selectedDelivery) {
      alert('Please select both a date and delivery option');
      return;
    }

    if (!user) {
      setShowLoginModal(true);
      return;
    }

    const deliveryInfo = DELIVERY_OPTIONS.find(opt => opt.key === selectedDelivery);
    const price = deliveryInfo?.price || service.rate;

    addItem({
      id: service.id,
      title: `${service.name} - ${selectedDate}`,
      price: price,
      quantity: 1,
      image: service.coverUrl || '',
      metadata: {
        serviceId: service.id,
        serviceName: service.name,
        bookingDate: selectedDate,
        deliveryOption: selectedDelivery,
      },
    });

    alert('Studio session added to cart!');
    onClose();
  };

  return (
    <>
      <div className={`fixed inset-0 z-50 transition-all duration-300 ${isOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`}>
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

        <div className="fixed inset-0 flex items-center justify-center p-4 overflow-y-auto">
          <div className="relative bg-black border border-white/10 rounded-3xl max-w-2xl w-full my-8">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-black/80 backdrop-blur-sm border-b border-white/10 px-6 md:px-8 py-6 flex items-center justify-between rounded-t-3xl">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-white">{service.name}</h2>
                <p className="text-white/40 text-sm mt-1">Select available studio date</p>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                <X size={24} className="text-white/60 hover:text-white" />
              </button>
            </div>

            {/* Content */}
            <div className="px-6 md:px-8 py-6 space-y-6">
              {/* Calendar Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white">Select Available Date</h3>

                {/* Month Navigation */}
                <div className="flex items-center justify-between bg-white/[0.05] border border-white/10 rounded-xl p-4">
                  <button onClick={handlePrevMonth} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                    <ChevronLeft size={20} className="text-white" />
                  </button>
                  <h4 className="text-white font-semibold min-w-[200px] text-center">{monthString}</h4>
                  <button onClick={handleNextMonth} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                    <ChevronRight size={20} className="text-white" />
                  </button>
                </div>

                {/* Calendar Grid */}
                <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-4 space-y-4">
                  {/* Day Headers */}
                  <div className="grid grid-cols-7 gap-2">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                      <div key={d} className="text-center text-xs font-semibold text-white/40 py-2">
                        {d}
                      </div>
                    ))}
                  </div>

                  {/* Calendar Days */}
                  <div className="grid grid-cols-7 gap-2">
                    {calendarDays.map((day, idx) => {
                      if (day === null) return <div key={`empty-${idx}`} />;

                      const dateStr = formatDate(currentDate.getFullYear(), currentDate.getMonth(), day);
                      const isAvailable = studioAvailableDays.has(dateStr);
                      const isSelected = selectedDate === dateStr;

                      return (
                        <button
                          key={day}
                          onClick={() => handleSelectDate(day)}
                          disabled={!isAvailable}
                          className={`aspect-square flex items-center justify-center rounded-lg font-medium transition-all ${
                            isSelected
                              ? 'bg-red-600 text-white border border-red-500'
                              : isAvailable
                              ? 'bg-green-600/20 text-green-400 border border-green-600/40 hover:bg-green-600/30 cursor-pointer'
                              : 'bg-white/[0.03] text-white/30 border border-white/10 cursor-not-allowed'
                          }`}
                        >
                          {day}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {selectedDate && (
                  <div className="bg-green-600/10 border border-green-600/30 rounded-xl p-4">
                    <p className="text-green-400 font-medium">Selected: {selectedDate}</p>
                  </div>
                )}
              </div>

              {/* Delivery Options */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white">Delivery Option</h3>
                <div className="grid grid-cols-3 gap-3">
                  {DELIVERY_OPTIONS.map(option => (
                    <button
                      key={option.key}
                      onClick={() => setSelectedDelivery(option.key)}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        selectedDelivery === option.key
                          ? 'bg-red-600/20 border-red-600/40 text-red-400'
                          : 'bg-white/[0.05] border-white/10 text-white/60 hover:bg-white/10'
                      }`}
                    >
                      <div className="font-semibold text-sm">{option.label}</div>
                      <div className="text-xs text-white/40 mt-1">€{option.price}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Service Info */}
              <div className="bg-white/[0.05] border border-white/10 rounded-xl p-4 space-y-2">
                <h4 className="font-semibold text-white text-sm">Service Details</h4>
                <p className="text-white/60 text-sm">{service.description}</p>
                <p className="text-white/40 text-xs mt-3">Rate: €{service.rate}/hour</p>
              </div>

              {/* Action Button */}
              <button
                onClick={handleAddToCart}
                disabled={!selectedDate || !selectedDelivery}
                className={`w-full py-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
                  selectedDate && selectedDelivery
                    ? 'bg-red-600 hover:bg-red-700 text-white cursor-pointer'
                    : 'bg-white/[0.05] text-white/40 cursor-not-allowed'
                }`}
              >
                <ShoppingCart size={20} />
                Add to Cart - €{selectedDelivery ? DELIVERY_OPTIONS.find(o => o.key === selectedDelivery)?.price : '0'}
              </button>

              <p className="text-white/40 text-xs text-center">
                You'll confirm booking details and payment in the checkout
              </p>
            </div>
          </div>
        </div>
      </div>

      {showLoginModal && <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />}
    </>
  );
};

export default StudioSessionModal;
