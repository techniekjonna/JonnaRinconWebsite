import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Check, Send, ArrowLeft, Zap, Headphones, Music, Volume2, Users, Palette, BadgeCheck } from 'lucide-react';
import Footer from '../../components/Footer';
import LoadingSpinner from '../../components/LoadingSpinner';
import LoginModal from '../../components/LoginModal';
import { useAuth } from '../../contexts/AuthContext';
import { useScrollToTop } from '../../hooks/useScrollToTop';
import { serviceService } from '../../lib/firebase/services';
import { Service } from '../../lib/firebase/types';
import { db } from '../../lib/firebase/config';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Zap, Headphones, Music, Volume2, Users, Palette,
};

const ServiceDetailPage: React.FC = () => {
  useScrollToTop();
  const { serviceId } = useParams<{ serviceId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

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
        senderName: user.displayName || 'Customer',
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
        <LoadingSpinner text="Loading service..." />
      </div>
    );
  }

  if (!service) {
    return (
      <div className="min-h-screen text-white flex flex-col items-center justify-center px-6 text-center">
        <p className="text-white/50 mb-6">This service could not be found.</p>
        <button
          onClick={() => navigate('/shop/services')}
          className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold uppercase tracking-wider rounded-xl transition-all"
        >
          Back to Services
        </button>
      </div>
    );
  }

  const Icon = iconMap[service.icon] || Zap;

  return (
    <div className="min-h-screen text-white">
      <main className="pt-32 pb-24 px-4 md:px-8 max-w-5xl mx-auto">
        <button
          onClick={() => navigate('/shop/services')}
          className="flex items-center gap-2 text-white/40 hover:text-white text-sm transition-colors mb-8"
        >
          <ArrowLeft size={16} /> Back to services
        </button>

        {requestSent ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-full bg-green-500/20 border border-green-500/40 flex items-center justify-center mb-5">
              <Check size={30} className="text-green-400" />
            </div>
            <h3 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tight mb-2">Request Sent!</h3>
            <p className="text-white/50 text-sm mb-8 max-w-sm">
              Your request for {service.name} has been received. Jonna will get back to you to confirm details.
            </p>
            <button
              onClick={() => navigate('/shop/services')}
              className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold uppercase tracking-wider rounded-xl transition-all"
            >
              Back to Services
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
            {/* Left column — icon & specs */}
            <div className="md:col-span-2">
              <div className="relative aspect-square rounded-2xl overflow-hidden mb-4">
                {service.coverUrl ? (
                  <img src={service.coverUrl} alt={service.name} className="w-full h-full object-cover" />
                ) : (
                  <div className={`w-full h-full bg-gradient-to-br ${service.gradient} flex items-center justify-center`}>
                    <Icon className="w-20 h-20 text-white/90" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 bg-black/40 border border-white/[0.15] rounded-full backdrop-blur-md">
                  <BadgeCheck size={14} className="text-red-300" />
                  <span className="text-xs font-bold text-white/90 uppercase tracking-wider">Service</span>
                </div>
              </div>

              <div className="bg-white/[0.04] rounded-xl p-5 border border-white/[0.08]">
                <p className="text-white/40 text-xs uppercase tracking-wider font-semibold mb-4">Rate</p>
                <p className="text-4xl font-black text-white leading-none mb-1">
                  €{service.rate}
                </p>
                <p className="text-white/40 text-xs">excl. BTW</p>
              </div>
            </div>

            {/* Right column — details */}
            <div className="md:col-span-3 flex flex-col">
              <div className="mb-6">
                <p className="text-white/40 text-xs uppercase tracking-wider font-semibold mb-2">Services</p>
                <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tighter text-white leading-tight mb-4">
                  {service.name}
                </h1>
                <p className="text-white/60 text-sm md:text-base leading-relaxed">{service.description}</p>
              </div>

              {/* Request form */}
              <div className="bg-gradient-to-br from-white/[0.08] to-white/[0.02] border border-white/10 rounded-2xl p-6 mt-auto">
                <p className="text-white/40 text-xs uppercase tracking-wider font-semibold mb-4">Request to Book</p>
                <form onSubmit={handleRequest} className="space-y-4">
                  <textarea
                    rows={5}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Tell Jonna a bit about what you need..."
                    className="w-full px-4 py-3 bg-white/[0.04] border border-white/10 rounded-xl text-white placeholder-white/25 focus:outline-none focus:border-red-500/30 transition-all text-sm resize-none"
                  />
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-4 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 disabled:opacity-50 text-white rounded-xl font-bold uppercase tracking-widest text-sm flex items-center justify-center gap-2 transition-all hover:scale-[1.01]"
                  >
                    <Send size={18} />
                    {isSubmitting ? 'Sending...' : 'Send Request'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
      {showLoginModal && (
        <LoginModal
          isOpen={showLoginModal}
          onClose={() => setShowLoginModal(false)}
          title="Sign In to Request"
          description="You need an account to request this service."
        />
      )}
    </div>
  );
};

export default ServiceDetailPage;
