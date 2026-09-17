import Navigation from '../components/Navigation';
import Footer from '../components/Footer';
import { Instagram, Youtube, Music2, ExternalLink, Mail, ArrowRight } from 'lucide-react';
import { useScrollToTop } from '../hooks/useScrollToTop';
import { Link } from 'react-router-dom';

const platforms = [
  {
    name: 'Instagram',
    handle: '@jonnarincon',
    icon: Instagram,
    url: 'https://www.instagram.com/jonnarincon/',
    color: 'from-purple-600 via-pink-500 to-orange-400',
  },
  {
    name: 'YouTube',
    handle: 'Jonna Rincon',
    icon: Youtube,
    url: 'https://www.youtube.com/jonnarincon',
    color: 'from-red-600 to-red-500',
  },
  {
    name: 'Spotify',
    handle: 'Jonna Rincon',
    icon: Music2,
    url: 'https://open.spotify.com/artist/6o3BlWTeK4EKUyByo35y6F',
    color: 'from-green-600 to-green-500',
  },
  {
    name: 'SoundCloud',
    handle: 'jonnarincon',
    icon: Music2,
    url: 'https://soundcloud.com/jonnarincon',
    color: 'from-orange-500 to-orange-400',
  },
  {
    name: 'TikTok',
    handle: '@jonnarincon',
    icon: Music2,
    url: '#',
    color: 'from-cyan-500 to-pink-500',
  },
  {
    name: 'Apple Music',
    handle: 'Jonna Rincon',
    icon: Music2,
    url: '#',
    color: 'from-pink-500 to-red-500',
  },
];

export default function SocialsPage() {
  useScrollToTop();

  return (
    <div className="min-h-screen text-white">
      <Navigation isDarkOverlay={true} isLightMode={false} />

      {/* Hero spacer */}
      <section className="relative pt-28 px-6 md:px-12 pb-4" />

      {/* Social Icons Row */}
      <section className="px-6 md:px-12 pb-10">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-xs font-black uppercase tracking-[0.4em] text-white/30 mb-5">Follow</p>
          <div className="flex flex-wrap gap-3 justify-center">
            {platforms.map((platform) => {
              const Icon = platform.icon;
              return (
                <a
                  key={platform.name}
                  href={platform.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={`${platform.name} — ${platform.handle}`}
                  className="group flex items-center gap-2.5 px-4 py-2.5 bg-white/[0.05] border border-white/[0.08] rounded-2xl hover:bg-white/[0.10] hover:border-white/[0.15] transition-all duration-300"
                >
                  <div className={`w-7 h-7 rounded-xl bg-gradient-to-br ${platform.color} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="w-3.5 h-3.5 text-white" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white truncate leading-none">{platform.name}</p>
                    <p className="text-[10px] text-white/30 truncate leading-none mt-1.5">{platform.handle}</p>
                  </div>
                  <ExternalLink size={11} className="text-white/20 group-hover:text-white/50 transition-colors flex-shrink-0" />
                </a>
              );
            })}
          </div>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="px-6 md:px-12 pb-24">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white/[0.04] border border-white/[0.08] rounded-3xl p-8 md:p-10 text-center">
            <div className="w-12 h-12 rounded-full bg-red-600/20 border border-red-500/30 flex items-center justify-center mx-auto mb-5">
              <Mail size={20} className="text-red-400" />
            </div>
            <p className="text-xs font-black uppercase tracking-[0.4em] text-red-500 mb-3">Get In Touch</p>
            <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tighter mb-3">Have Something To Say?</h2>
            <p className="text-white/50 text-sm mb-7 max-w-md mx-auto leading-relaxed">
              Bookings, collaborations, business proposals or just a question — head over to the contact page.
            </p>
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 px-7 py-3.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-2xl transition-all hover:scale-[1.02] text-sm uppercase tracking-widest"
            >
              Contact Me
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
