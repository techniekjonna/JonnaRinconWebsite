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
      <main className="pt-32 pb-24 px-4 max-w-3xl mx-auto">
        <button
          onClick={() => navigate('/shop/services')}
          className="flex items-center gap-2 text-white/40 hover:text-white text-sm transition-colors mb-8"
        >
          <ArrowLeft size={16} /> Back to services
        </button>

        {requestSent ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 bg-green-500/20 border border-green-500/40 flex items-center justify-center mb-4">
              <Check size={32} className="text-green-400" />
            </div>
            <h3 className="text-2xl font-black text-white uppercase mb-2">Request Sent!</h3>
            <p className="text-white/50 text-sm mb-6 max-w-sm">
              Your request for {service.name} has been received. Jonna will get back to you to confirm details.
            </p>
            <button
              onClick={() => navigate('/shop/services')}
              className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold uppercase tracking-wider transition-all"
            >
              Back to Services
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start gap-5">
              {service.coverUrl ? (
                <img src={service.coverUrl} alt={service.name} className="w-16 h-16 rounded-2xl object-cover flex-shrink-0" />
              ) : (
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${service.gradient} flex items-center justify-center flex-shrink-0`}>
                  <Icon className="w-8 h-8 text-white" />
                </div>
              )}
              <div>
                <p className="text-white/30 text-xs uppercase tracking-widest mb-1">Services</p>
                <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tighter text-white leading-tight">
                  {service.name}
                </h1>
              </div>
            </div>

            {/* About */}
            <div className="bg-white/[0.04] border border-white/10 p-6">
              <p className="text-white/30 text-xs uppercase tracking-wider mb-3">About</p>
              <p className="text-white/70 text-sm leading-relaxed">{service.description}</p>
            </div>

            {/* Rate */}
            <div className="bg-white/[0.05] border border-white/10 p-6 flex items-baseline justify-between">
              <p className="text-white/30 text-xs uppercase tracking-wider">Rate</p>
              <p className="text-white text-2xl font-black">
                €{service.rate}<span className="text-white/40 text-sm font-normal"> excl. BTW</span>
              </p>
            </div>

            {/* Request form */}
            <form onSubmit={handleRequest} className="bg-white/[0.04] border border-white/10 p-6 space-y-4">
              <p className="text-white/30 text-xs uppercase tracking-wider">Request to Book</p>
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
                className="w-full py-4 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold uppercase tracking-widest text-sm flex items-center justify-center gap-2 transition-all hover:scale-[1.01]"
              >
                <Send size={18} />
                {isSubmitting ? 'Sending...' : 'Send Request'}
              </button>
            </form>
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
