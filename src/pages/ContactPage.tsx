import { useState } from 'react';
import { Link } from 'react-router-dom';
import Navigation from '../components/Navigation';
import Footer from '../components/Footer';
import { Mail, Instagram, Youtube, Music, Cloud as CloudIcon, ArrowUpRight } from 'lucide-react';
import { useCyberDecodeInView } from '../hooks/useCyberDecode';
import { useScrollToTop } from '../hooks/useScrollToTop';

const socialLinks = [
  { name: 'Instagram', icon: Instagram, url: 'https://www.instagram.com/jonnarincon/' },
  { name: 'YouTube', icon: Youtube, url: 'https://www.youtube.com/jonnarincon' },
  { name: 'SoundCloud', icon: CloudIcon, url: 'https://soundcloud.com/jonnarincon' },
  { name: 'Spotify', icon: Music, url: 'https://open.spotify.com/artist/6o3BlWTeK4EKUyByo35y6F' },
];

export default function ContactPage() {
  useScrollToTop();
  const [formData, setFormData] = useState({ name: '', email: '', subject: 'commission', message: '' });
  const heroTitle = useCyberDecodeInView('Contact');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
  };

  return (
    <div className="min-h-screen text-white">
      {/* Fixed JEIGHTENESIS Background */}
      <div className="fixed inset-0 w-full h-screen -z-10">
        <img src="/JEIGHTENESIS.jpg" alt="" className="w-full h-full object-cover" style={{objectPosition: 'center'}} />
        <div className="absolute inset-0 bg-black/80" />
      </div>

      <Navigation isDarkOverlay={true} isLightMode={false} />

      {/* Hero */}
      <section className="relative min-h-[60vh] flex items-end pb-16 md:pb-24 pt-40 px-6 md:px-12">
        <div className="relative z-10 max-w-7xl mx-auto w-full">
          <p className="text-[10px] md:text-xs text-red-500/60 uppercase tracking-[0.4em] mb-4">Reach Out</p>
          <h1 ref={heroTitle.ref as React.RefObject<HTMLHeadingElement>} className="text-6xl md:text-[8rem] lg:text-[10rem] font-black uppercase leading-[0.85] tracking-tighter whitespace-nowrap neon-glow">
            {heroTitle.display}
          </h1>
          <p className="text-white/30 text-sm md:text-base mt-6 max-w-md">
            Let's create something amazing together. Get in touch for collaborations, commissions, or bookings.
          </p>
        </div>
      </section>

      {/* Contact Grid */}
      <section className="px-6 md:px-12 py-16 md:py-24">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-6 md:gap-10">

          {/* Left - Info */}
          <div className="space-y-5">
            <div className="bg-white/[0.04] backdrop-blur-md border border-white/[0.06] rounded-3xl p-6 md:p-8">
              <h3 className="text-2xl font-black uppercase tracking-tight mb-6">Info</h3>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-2xl bg-white/[0.06] flex items-center justify-center flex-shrink-0">
                    <Mail size={18} className="text-white/30" />
                  </div>
                  <div>
                    <p className="font-bold text-sm text-white mb-0.5">Email</p>
                    <a href="mailto:contact@jonnarincon.com" className="text-white/30 hover:text-white transition-colors text-sm">
                      contact@jonnarincon.com
                    </a>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-2xl bg-white/[0.06] flex items-center justify-center flex-shrink-0">
                    <Music size={18} className="text-white/30" />
                  </div>
                  <div>
                    <p className="font-bold text-sm text-white mb-0.5">Response Time</p>
                    <p className="text-white/30 text-sm">Usually within 24 hours</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white/[0.04] backdrop-blur-md border border-white/[0.06] rounded-3xl p-6 md:p-8">
              <h3 className="text-xl font-black uppercase tracking-tight mb-5">Connect</h3>
              <div className="space-y-2">
                {socialLinks.map((link) => {
                  const Icon = link.icon;
                  return (
                    <a
                      key={link.name}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-center justify-between p-3.5 bg-white/[0.03] hover:bg-white/[0.06] rounded-2xl transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <Icon size={18} className="text-white/25" />
                        <span className="font-bold text-sm text-white">{link.name}</span>
                      </div>
                      <ArrowUpRight size={14} className="text-white/10 group-hover:text-white/40 transition-colors" />
                    </a>
                  );
                })}
              </div>
            </div>

            {/* Services */}
            <div className="bg-white/[0.04] backdrop-blur-md border border-white/[0.06] rounded-3xl p-6 md:p-8">
              <h3 className="text-xl font-black uppercase tracking-tight mb-5">Services</h3>
              <div className="grid grid-cols-2 gap-2">
                {['Beat Production', 'Mixing & Mastering', 'Collaborations', 'DJ Bookings', 'Custom Beats', 'Sound Design'].map((service) => (
                  <div key={service} className="px-3 py-2.5 bg-white/[0.03] rounded-xl text-center">
                    <span className="text-xs font-bold text-white/50 uppercase tracking-wider">{service}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right - Form */}
          <div className="bg-white/[0.04] backdrop-blur-md border border-white/[0.06] rounded-3xl p-6 md:p-8 h-fit">
            <h3 className="text-2xl font-black uppercase tracking-tight mb-6">Send a Message</h3>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-[10px] font-bold mb-2 text-white/30 uppercase tracking-[0.2em]">Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3.5 bg-white/[0.05] border border-white/[0.08] text-white placeholder-white/15 rounded-2xl focus:outline-none focus:border-red-500/40 transition-all"
                  placeholder="Your name"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold mb-2 text-white/30 uppercase tracking-[0.2em]">Email</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3.5 bg-white/[0.05] border border-white/[0.08] text-white placeholder-white/15 rounded-2xl focus:outline-none focus:border-red-500/40 transition-all"
                  placeholder="your@email.com"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold mb-2 text-white/30 uppercase tracking-[0.2em]">Subject</label>
                <select
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full px-4 py-3.5 bg-white/[0.05] border border-white/[0.08] text-white rounded-2xl focus:outline-none focus:border-red-500/40 transition-all appearance-none cursor-pointer"
                >
                  <option value="commission">Beat Commission</option>
                  <option value="collaboration">Collaboration</option>
                  <option value="booking">Booking</option>
                  <option value="general">General Inquiry</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold mb-2 text-white/30 uppercase tracking-[0.2em]">Message</label>
                <textarea
                  required
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  rows={5}
                  className="w-full px-4 py-3.5 bg-white/[0.05] border border-white/[0.08] text-white placeholder-white/15 rounded-2xl focus:outline-none focus:border-red-500/40 transition-all resize-none"
                  placeholder="Tell me about your project..."
                />
              </div>
              <button
                type="submit"
                className="w-full py-4 bg-white text-black rounded-2xl font-black text-sm uppercase tracking-widest transition-all hover:bg-white/90 hover:scale-[1.02]"
              >
                Send Message
              </button>
            </form>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
