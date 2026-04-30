import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Download, ArrowRight } from 'lucide-react';
import Navigation from '../components/Navigation';
import Footer from '../components/Footer';

export default function CheckoutSuccessPage() {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/customer/dashboard');
    }, 8000);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-black flex flex-col">
      <Navigation isDarkOverlay={true} isLightMode={false} />

      <div className="flex-1 flex items-center justify-center px-4 py-20">
        <div className="text-center max-w-md">
          <div className="bg-white/[0.08] border border-white/[0.12] rounded-2xl p-12 space-y-6">
            {/* Success Icon */}
            <div className="flex justify-center">
              <div className="w-20 h-20 rounded-full bg-green-600/20 border border-green-500/30 flex items-center justify-center animate-scale-in">
                <Check className="w-10 h-10 text-green-400" strokeWidth={3} />
              </div>
            </div>

            {/* Success Message */}
            <div>
              <h1 className="text-3xl font-black text-white mb-2">Purchase Complete!</h1>
              <p className="text-white/60">Your order has been processed successfully.</p>
            </div>

            {/* Details */}
            <div className="bg-white/[0.04] border border-white/[0.08] rounded-xl p-4 text-left space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-white/40">Order Status</span>
                <span className="text-green-400 font-semibold">Confirmed</span>
              </div>
              <div className="flex justify-between text-sm border-t border-white/[0.08] pt-3">
                <span className="text-white/40">Downloads</span>
                <span className="text-white font-semibold">Available in Dashboard</span>
              </div>
            </div>

            {/* Call to Action */}
            <div className="space-y-3">
              <button
                onClick={() => navigate('/customer/dashboard')}
                className="w-full flex items-center justify-center gap-2 px-8 py-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-all"
              >
                <Download size={18} />
                Download Your Products
                <ArrowRight size={18} />
              </button>
              <p className="text-xs text-white/30">
                You'll be redirected in a few seconds...
              </p>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
