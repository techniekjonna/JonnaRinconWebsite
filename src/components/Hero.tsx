import { useEffect, useState } from 'react';
import { ArrowRight, Play } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const roles = [
  { label: 'Artist', to: '/catalogue' },
  { label: 'Producer', to: '/about' },
  { label: 'DJ', to: '/dj' },
  { label: 'Sound Engineer', to: '/mix-master' },
];

const browseLabels = [
  { text: 'Browse Beats', to: '/shop/beats' },
  { text: 'Merchandise', to: '/shop/merchandise' },
  { text: 'Art', to: '/shop/art' },
  { text: 'Mix Master', to: '/mix-master' },
  { text: 'Studio Session', to: '/studio-session' },
  { text: 'Shop', to: '/shop' },
  { text: 'Services', to: '/shop/services' },
];

export default function Hero() {
  const navigate = useNavigate();
  // Delayed so background is fully visible before content appears (intro animation)
  const [visible, setVisible] = useState(false);
  const [roleIndex, setRoleIndex] = useState(0);
  const [roleFading, setRoleFading] = useState(false);
  const [browseIndex, setBrowseIndex] = useState(0);
  const [browseFading, setBrowseFading] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 1200);
    return () => clearTimeout(t);
  }, []);

  // Cycle roles every 8 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setRoleFading(true);
      setTimeout(() => { setRoleIndex(i => (i + 1) % roles.length); setRoleFading(false); }, 400);
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  // Cycle browse button text every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setBrowseFading(true);
      setTimeout(() => { setBrowseIndex(i => (i + 1) % browseLabels.length); setBrowseFading(false); }, 300);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const currentRole = roles[roleIndex];
  const currentBrowse = browseLabels[browseIndex];

  return (
    <section
      className="relative w-full flex flex-col items-center justify-center"
      style={{ minHeight: '68vh' }}
    >
      <div
        className="relative z-10 flex flex-col items-center text-center px-6 max-w-4xl mx-auto"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(16px)',
          transition: 'opacity 0.8s ease, transform 0.8s ease',
        }}
      >
        {/* Subtitle with cycling role — inline on desktop, block-centered on mobile */}
        <p className="text-white/50 text-base md:text-lg uppercase tracking-widest mb-10">
          Your soon to be favourite{' '}
          {/* On mobile: breaks to its own centered line. On sm+: stays inline. */}
          <br className="block sm:hidden" />
          <Link
            to={currentRole.to}
            className="text-white hover:text-red-400 transition-colors duration-300 hover:[text-shadow:0_0_14px_rgba(255,255,255,0.6)] sm:inline-block"
            style={{
              opacity: roleFading ? 0 : 1,
              transform: roleFading ? 'translateY(-6px)' : 'translateY(0)',
              transition: 'opacity 0.4s ease, transform 0.4s ease',
              display: 'inline-block',
              verticalAlign: 'baseline',
            }}
          >
            {currentRole.label}
          </Link>
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Browse button — cycling text, icon pinned right */}
          <button
            onClick={() => navigate(currentBrowse.to)}
            className="flex items-center py-3.5 bg-red-600 text-white font-bold text-sm uppercase tracking-widest hover:bg-red-700 transition-all duration-300 hover:scale-105 active:scale-95 rounded-xl"
            style={{ width: '220px', paddingLeft: '20px', paddingRight: '12px' }}
          >
            <span
              className="flex-1 text-center whitespace-nowrap overflow-hidden"
              style={{
                opacity: browseFading ? 0 : 1,
                transform: browseFading ? 'translateY(-6px)' : 'translateY(0)',
                transition: 'opacity 0.3s ease, transform 0.3s ease',
              }}
            >
              {currentBrowse.text}
            </span>
            <ArrowRight size={16} className="flex-shrink-0 ml-2" />
          </button>

          {/* Listen Now — static, no cycling */}
          <button
            onClick={() => navigate('/catalogue')}
            className="flex items-center justify-center gap-2 py-3.5 bg-white/10 border border-white/20 text-white font-bold text-sm uppercase tracking-widest hover:bg-white/20 transition-all duration-300 hover:scale-105 active:scale-95 backdrop-blur-sm rounded-xl"
            style={{ width: '220px' }}
          >
            <Play size={16} className="flex-shrink-0" />
            Listen Now
          </button>
        </div>

        {/* Studio session + contact */}
        <div className="mt-5 flex flex-col items-center gap-2">
          <a href="/studio-session" className="group flex items-center gap-2">
            <span className="text-white/35 text-xs uppercase tracking-widest group-hover:text-red-500 transition-colors duration-300">
              Studio session with Jonna?
            </span>
            <span className="text-white/70 text-xs font-bold uppercase tracking-widest group-hover:text-white group-hover:[text-shadow:0_0_12px_rgba(255,255,255,0.6)] transition-all duration-300">
              Book here →
            </span>
          </a>
          <a
            href="/contact"
            className="text-white/25 text-[10px] uppercase tracking-widest hover:text-white/50 transition-colors duration-300"
          >
            Contact
          </a>
        </div>
      </div>
    </section>
  );
}
