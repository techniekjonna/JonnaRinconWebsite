import { useState } from 'react';
import Navigation from '../components/Navigation';
import Footer from '../components/Footer';
import { Instagram, Youtube, Music2, ExternalLink, ChevronLeft, ChevronRight, Send, Check } from 'lucide-react';
import { useScrollToTop } from '../hooks/useScrollToTop';
import { useAuth } from '../hooks/useAuth';
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

const contactCategories = {
  'Jonna Rincon': ['Productions', 'Remixes & Edits', 'DJ Sets', 'Community', 'Other'],
  'Shop': ['Beat Shop', 'Mix & Master', 'Studio Sessions', 'Merchandise', 'Art', 'Other'],
};

type CategoryKey = keyof typeof contactCategories;

type ContactStep = 'compose' | 'details' | 'sent';

export default function SocialsPage() {
  useScrollToTop();
  const { isAuthenticated } = useAuth();

  // Contact form state
  const [contactStep, setContactStep] = useState<ContactStep>('compose');
  const [selectedCategory, setSelectedCategory] = useState<CategoryKey | null>(null);
  const [selectedSub, setSelectedSub] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  const canSendMessage = selectedCategory && selectedSub && message.trim().length > 0;

  const handleSend = () => {
    if (!canSendMessage) return;
    setContactStep('details');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;
    setContactStep('sent');
  };

  const resetForm = () => {
    setContactStep('compose');
    setSelectedCategory(null);
    setSelectedSub(null);
    setMessage('');
    setName('');
    setEmail('');
  };

  return (
    <div className="min-h-screen text-white">
      <div className="fixed inset-0 w-full h-screen -z-10 bg-black/20" />
      <Navigation isDarkOverlay={true} isLightMode={false} />

      {/* Hero spacer */}
      <section className="relative pt-28 px-6 md:px-12 pb-4" />

      {/* Social Icons Row */}
      <section className="px-6 md:px-12 pb-10">
        <div className="max-w-7xl mx-auto">
          <p className="text-xs font-black uppercase tracking-[0.4em] text-white/30 mb-5">Follow</p>
          <div className="flex flex-wrap gap-3">
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
                    <p className="text-[10px] text-white/30 truncate leading-none mt-0.5">{platform.handle}</p>
                  </div>
                  <ExternalLink size={11} className="text-white/20 group-hover:text-white/50 transition-colors flex-shrink-0" />
                </a>
              );
            })}
          </div>
        </div>
      </section>

      {/* Contact section */}
      <section className="px-6 md:px-12 pb-24">
        <div className="max-w-2xl mx-auto">
          <p className="text-xs font-black uppercase tracking-[0.4em] text-red-500 mb-3">Get In Touch</p>
          <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tighter mb-8">Contact</h2>

          <div className="bg-white/[0.04] border border-white/[0.08] rounded-3xl overflow-hidden">

            {/* Step indicator */}
            <div className="flex items-center border-b border-white/[0.06] px-5 py-3">
              {(['compose', 'details', 'sent'] as ContactStep[]).map((step, i) => {
                const isActive = contactStep === step;
                const isDone = (['compose', 'details', 'sent'] as ContactStep[]).indexOf(contactStep) > i;
                return (
                  <div key={step} className="flex items-center">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black transition-all ${
                      isDone ? 'bg-red-600 text-white' : isActive ? 'bg-white text-black' : 'bg-white/[0.08] text-white/30'
                    }`}>
                      {isDone ? <Check size={10} /> : i + 1}
                    </div>
                    <span className={`ml-2 text-[10px] font-bold uppercase tracking-wider transition-colors ${isActive ? 'text-white' : 'text-white/25'}`}>
                      {step === 'compose' ? 'Message' : step === 'details' ? 'Your Info' : 'Sent'}
                    </span>
                    {i < 2 && <ChevronRight size={12} className="mx-3 text-white/20" />}
                  </div>
                );
              })}
            </div>

            {/* ── STEP 1: Compose ── */}
            {contactStep === 'compose' && (
              <div className="p-5 space-y-5">
                {/* Category selection */}
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2">Category</p>
                  <div className="grid grid-cols-2 gap-2">
                    {(Object.keys(contactCategories) as CategoryKey[]).map((cat) => (
                      <button
                        key={cat}
                        onClick={() => { setSelectedCategory(cat); setSelectedSub(null); }}
                        className={`py-3 px-4 rounded-2xl text-sm font-bold uppercase tracking-wider transition-all border ${
                          selectedCategory === cat
                            ? 'bg-red-600 border-red-500 text-white shadow-md shadow-red-600/30'
                            : 'bg-white/[0.04] border-white/[0.08] text-white/50 hover:text-white hover:bg-white/[0.08]'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sub-category */}
                {selectedCategory && (
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2">Subject</p>
                    <div className="flex flex-wrap gap-2">
                      {contactCategories[selectedCategory].map((sub) => (
                        <button
                          key={sub}
                          onClick={() => setSelectedSub(sub)}
                          className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide transition-all ${
                            selectedSub === sub
                              ? 'bg-white text-black'
                              : 'bg-white/[0.06] border border-white/[0.08] text-white/50 hover:text-white hover:bg-white/[0.12]'
                          }`}
                        >
                          {sub}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Message */}
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2">Message</p>
                  <textarea
                    rows={5}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Type your message here..."
                    className="w-full px-4 py-3 bg-white/[0.04] border border-white/[0.08] text-white placeholder-white/20 rounded-2xl focus:outline-none focus:border-red-500/50 transition-all text-sm resize-none"
                  />
                  {isAuthenticated && (
                    <p className="text-[10px] text-white/25 mt-2 leading-relaxed">
                      Als je ingelogd bent kun je ook gebruik maken van de chat in het{' '}
                      <Link to="/customer/messages" className="text-white/40 hover:text-white/60 underline transition-colors">
                        dashboard
                      </Link>.
                    </p>
                  )}
                  {!isAuthenticated && (
                    <p className="text-[10px] text-white/25 mt-2 leading-relaxed">
                      Ingelogde gebruikers kunnen ook gebruik maken van de chat in het dashboard.
                    </p>
                  )}
                </div>

                <button
                  onClick={handleSend}
                  disabled={!canSendMessage}
                  className="w-full py-3.5 bg-red-600 hover:bg-red-500 disabled:bg-white/[0.05] disabled:text-white/20 text-white font-bold rounded-2xl transition-all hover:scale-[1.02] disabled:scale-100 text-sm uppercase tracking-widest flex items-center justify-center gap-2"
                >
                  <Send size={15} />
                  Send Message
                </button>
              </div>
            )}

            {/* ── STEP 2: Details ── */}
            {contactStep === 'details' && (
              <div className="p-5 space-y-5">
                <div className="p-4 bg-white/[0.04] rounded-2xl border border-white/[0.06] text-sm">
                  <p className="text-white/40 text-xs mb-1">{selectedCategory} › {selectedSub}</p>
                  <p className="text-white/80 leading-relaxed line-clamp-3">{message}</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-3">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2">Your Name</p>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="First name / Artist name"
                      required
                      className="w-full px-4 py-3 bg-white/[0.04] border border-white/[0.08] text-white placeholder-white/20 rounded-2xl focus:outline-none focus:border-red-500/50 transition-all text-sm"
                    />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2">Email Address</p>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      required
                      className="w-full px-4 py-3 bg-white/[0.04] border border-white/[0.08] text-white placeholder-white/20 rounded-2xl focus:outline-none focus:border-red-500/50 transition-all text-sm"
                    />
                  </div>

                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setContactStep('compose')}
                      className="px-4 py-3 bg-white/[0.06] border border-white/[0.1] text-white/60 hover:text-white rounded-2xl font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-1.5"
                    >
                      <ChevronLeft size={14} /> Back
                    </button>
                    <button
                      type="submit"
                      disabled={!name.trim() || !email.trim()}
                      className="flex-1 py-3 bg-red-600 hover:bg-red-500 disabled:bg-white/[0.05] disabled:text-white/20 text-white font-bold rounded-2xl transition-all hover:scale-[1.01] text-sm uppercase tracking-widest flex items-center justify-center gap-2"
                    >
                      <Send size={15} /> Submit
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* ── STEP 3: Sent ── */}
            {contactStep === 'sent' && (
              <div className="p-8 text-center space-y-4">
                <div className="w-14 h-14 rounded-full bg-red-600/20 border border-red-500/30 flex items-center justify-center mx-auto">
                  <Check size={24} className="text-red-400" />
                </div>
                <h3 className="text-xl font-black uppercase tracking-tight text-white">Message Sent!</h3>
                <p className="text-white/40 text-sm leading-relaxed">
                  Thanks, {name}. Your message has been received and will be replied to within 24 hours at{' '}
                  <span className="text-white/60">{email}</span>.
                </p>
                <button
                  onClick={resetForm}
                  className="px-6 py-2.5 bg-white/[0.08] border border-white/[0.12] text-white/60 hover:text-white rounded-2xl font-bold text-xs uppercase tracking-wider transition-all"
                >
                  New Message
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
