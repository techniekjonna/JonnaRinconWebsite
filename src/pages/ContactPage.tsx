import { useState } from 'react';
import Footer from '../components/Footer';
import { Mail, Phone, MapPin, ChevronLeft, ChevronRight, Send, Check } from 'lucide-react';
import { useScrollToTop } from '../hooks/useScrollToTop';
import { useContactCategories } from '../hooks/useContactCategories';
import { db } from '../lib/firebase/config';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';

const MAX_MESSAGE_LENGTH = 3000; // roughly one A4 page of text

type ContactStep = 'compose' | 'details' | 'sent';

export default function ContactPage() {
  useScrollToTop();
  const { categories } = useContactCategories();

  const [contactStep, setContactStep] = useState<ContactStep>('compose');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(false);

  const canSendMessage = selectedCategory && message.trim().length > 0;

  const handleSend = () => {
    if (!canSendMessage) return;
    setContactStep('details');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !selectedCategory) return;

    setIsSubmitting(true);
    setSubmitError(false);
    try {
      await addDoc(collection(db, 'supportMessages'), {
        senderId: `contact:${email.trim().toLowerCase()}`,
        senderName: name.trim(),
        senderEmail: email.trim(),
        senderRole: 'contact',
        recipientGroup: 'support',
        category: selectedCategory,
        message: message.trim(),
        createdAt: serverTimestamp(),
        status: 'sent',
      });
      setContactStep('sent');
    } catch (error) {
      console.error('Contact form submission error:', error);
      setSubmitError(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setContactStep('compose');
    setSelectedCategory(null);
    setMessage('');
    setName('');
    setEmail('');
    setSubmitError(false);
  };

  return (
    <div className="min-h-screen text-white">
      <div className="relative pt-[120px] md:pt-[160px] pb-12 px-6 md:px-10">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-black uppercase mb-4 tracking-tight">
            Get In Touch
          </h1>
          <p className="text-white/60 text-lg md:text-xl mb-12">
            Have a serious inquiry? Fill out the form below and we'll get back to you as soon as possible.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            {[
              {
                icon: Mail,
                label: 'Email',
                value: 'contact@jonnarincon.com',
                href: 'mailto:contact@jonnarincon.com',
              },
              {
                icon: Phone,
                label: 'Phone',
                value: '+31 (0) 6 123 456 78',
                href: 'tel:+31612345678',
              },
              {
                icon: MapPin,
                label: 'Location',
                value: 'Netherlands',
                href: '#',
              },
            ].map((item, idx) => {
              const Icon = item.icon;
              return (
                <a
                  key={idx}
                  href={item.href}
                  className="group p-6 bg-white/[0.02] border border-white/10 rounded-2xl hover:bg-white/[0.05] transition-all duration-300"
                >
                  <div className="flex items-center gap-4 mb-2">
                    <div className="p-3 bg-red-600/20 rounded-lg group-hover:bg-red-600/30 transition-colors">
                      <Icon className="w-5 h-5 text-red-500" />
                    </div>
                    <span className="text-white/60 text-sm uppercase tracking-wider">{item.label}</span>
                  </div>
                  <p className="text-white font-semibold group-hover:text-red-400 transition-colors">
                    {item.value}
                  </p>
                </a>
              );
            })}
          </div>
        </div>
      </div>

      <div className="relative px-6 md:px-10 pb-24">
        <div className="max-w-2xl mx-auto">
          <div className="bg-gradient-to-br from-white/[0.08] to-white/[0.02] border border-white/10 rounded-3xl overflow-hidden">

            {/* Step indicator */}
            <div className="flex items-center border-b border-white/[0.06] px-6 py-4">
              {(['compose', 'details', 'sent'] as ContactStep[]).map((step, i) => {
                const isActive = contactStep === step;
                const isDone = (['compose', 'details', 'sent'] as ContactStep[]).indexOf(contactStep) > i;
                return (
                  <div key={step} className="flex items-center">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black transition-all ${
                      isDone ? 'bg-red-600 text-white' : isActive ? 'bg-white text-black' : 'bg-white/[0.08] text-white/30'
                    }`}>
                      {isDone ? <Check size={11} /> : i + 1}
                    </div>
                    <span className={`ml-2 text-xs font-bold uppercase tracking-wider transition-colors ${isActive ? 'text-white' : 'text-white/25'}`}>
                      {step === 'compose' ? 'Message' : step === 'details' ? 'Your Info' : 'Sent'}
                    </span>
                    {i < 2 && <ChevronRight size={14} className="mx-4 text-white/20" />}
                  </div>
                );
              })}
            </div>

            {/* ── STEP 1: Compose ── */}
            {contactStep === 'compose' && (
              <div className="p-6 md:p-8 space-y-6">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-white/40 mb-3">Category</p>
                  <div className="flex flex-wrap gap-2">
                    {categories.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-4 py-2.5 rounded-2xl text-sm font-bold uppercase tracking-wide transition-all border ${
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

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-bold uppercase tracking-widest text-white/40">Message</p>
                    <p className={`text-[10px] font-medium ${message.length >= MAX_MESSAGE_LENGTH ? 'text-red-400' : 'text-white/25'}`}>
                      {message.length} / {MAX_MESSAGE_LENGTH}
                    </p>
                  </div>
                  <textarea
                    rows={7}
                    value={message}
                    onChange={(e) => setMessage(e.target.value.slice(0, MAX_MESSAGE_LENGTH))}
                    maxLength={MAX_MESSAGE_LENGTH}
                    placeholder="Type your message here..."
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 text-white placeholder-white/30 rounded-xl focus:outline-none focus:border-white/30 focus:bg-white/10 transition-all text-sm resize-none"
                  />
                  <p className="text-[10px] text-white/25 mt-2">Max. one A4 page of text.</p>
                </div>

                <button
                  onClick={handleSend}
                  disabled={!canSendMessage}
                  className="w-full py-4 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all duration-300 text-sm uppercase tracking-widest flex items-center justify-center gap-2"
                >
                  <Send size={16} />
                  Continue
                </button>
              </div>
            )}

            {/* ── STEP 2: Details ── */}
            {contactStep === 'details' && (
              <div className="p-6 md:p-8 space-y-6">
                <div className="p-4 bg-white/[0.04] rounded-xl border border-white/[0.08] text-sm">
                  <p className="text-white/40 text-xs mb-1">{selectedCategory}</p>
                  <p className="text-white/80 leading-relaxed line-clamp-3">{message}</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="name" className="block text-xs font-bold uppercase tracking-widest text-white/40 mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your name"
                      required
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 text-white placeholder-white/30 rounded-xl focus:outline-none focus:border-white/30 focus:bg-white/10 transition-all text-sm"
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-xs font-bold uppercase tracking-widest text-white/40 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      required
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 text-white placeholder-white/30 rounded-xl focus:outline-none focus:border-white/30 focus:bg-white/10 transition-all text-sm"
                    />
                  </div>

                  {submitError && (
                    <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs">
                      Something went wrong. Please try again.
                    </div>
                  )}

                  <div className="flex gap-3 pt-1">
                    <button
                      type="button"
                      onClick={() => setContactStep('compose')}
                      className="px-5 py-3.5 bg-white/[0.06] border border-white/[0.1] text-white/60 hover:text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-1.5"
                    >
                      <ChevronLeft size={14} /> Back
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting || !name.trim() || !email.trim()}
                      className="flex-1 py-3.5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all text-sm uppercase tracking-widest flex items-center justify-center gap-2"
                    >
                      <Send size={15} /> {isSubmitting ? 'Sending...' : 'Submit'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* ── STEP 3: Sent ── */}
            {contactStep === 'sent' && (
              <div className="p-10 text-center space-y-4">
                <div className="w-14 h-14 rounded-full bg-red-600/20 border border-red-500/30 flex items-center justify-center mx-auto">
                  <Check size={24} className="text-red-400" />
                </div>
                <h3 className="text-xl font-black uppercase tracking-tight text-white">Message Sent!</h3>
                <p className="text-white/40 text-sm leading-relaxed">
                  Thanks, {name}. Your message has been received and will be replied to as soon as possible at{' '}
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
      </div>

      <Footer />
    </div>
  );
}
