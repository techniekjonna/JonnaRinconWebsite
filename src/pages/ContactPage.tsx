import { useState } from 'react';
import Navigation from '../components/Navigation';
import Footer from '../components/Footer';
import { Mail, Phone, MapPin, ArrowUpRight } from 'lucide-react';
import { useScrollToTop } from '../hooks/useScrollToTop';

export default function ContactPage() {
  useScrollToTop();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    category: 'general',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      console.log('Form submitted:', formData);
      setSubmitStatus('success');
      setTimeout(() => {
        setFormData({
          name: '',
          email: '',
          subject: '',
          category: 'general',
          message: '',
        });
        setSubmitStatus('idle');
      }, 3000);
    } catch (error) {
      setSubmitStatus('error');
      console.error('Form submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen text-white">
      {/* Fixed Dark Overlay — lets the site background show through */}
      <div className="fixed inset-0 w-full h-screen -z-10 bg-black/20" />
      <Navigation isDarkOverlay={true} isLightMode={false} />

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

      <div className="relative px-6 md:px-10 pb-12">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-br from-white/[0.08] to-white/[0.02] border border-white/10 rounded-3xl p-8 md:p-12">
            <h2 className="text-3xl font-bold mb-8 uppercase tracking-tight">Send us a message</h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-semibold text-white/80 mb-2 uppercase tracking-wider">
                  Full Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-5 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-white/30 focus:bg-white/10 transition-all"
                  placeholder="Your name"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-white/80 mb-2 uppercase tracking-wider">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="w-full px-5 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-white/30 focus:bg-white/10 transition-all"
                  placeholder="your@email.com"
                />
              </div>

              <div>
                <label htmlFor="subject" className="block text-sm font-semibold text-white/80 mb-2 uppercase tracking-wider">
                  Subject
                </label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleInputChange}
                  required
                  className="w-full px-5 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-white/30 focus:bg-white/10 transition-all"
                  placeholder="What is this about?"
                />
              </div>

              <div>
                <label htmlFor="category" className="block text-sm font-semibold text-white/80 mb-2 uppercase tracking-wider">
                  Category
                </label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full px-5 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-white/30 focus:bg-white/10 transition-all cursor-pointer"
                >
                  <option value="general" className="bg-black">General Inquiry</option>
                  <option value="booking" className="bg-black">Booking Request</option>
                  <option value="collaboration" className="bg-black">Collaboration</option>
                  <option value="business" className="bg-black">Business Proposal</option>
                  <option value="other" className="bg-black">Other</option>
                </select>
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-semibold text-white/80 mb-2 uppercase tracking-wider">
                  Message
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  required
                  rows={6}
                  className="w-full px-5 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-white/30 focus:bg-white/10 transition-all resize-none"
                  placeholder="Tell us more about your inquiry..."
                />
              </div>

              {submitStatus === 'success' && (
                <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-xl text-green-400 text-sm">
                  ✓ Your message has been sent successfully! We'll be in touch soon.
                </div>
              )}
              {submitStatus === 'error' && (
                <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
                  ✗ Something went wrong. Please try again or contact us directly.
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full px-8 py-4 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold uppercase tracking-wider rounded-xl transition-all duration-300 flex items-center justify-center gap-2 group"
              >
                <span>{isSubmitting ? 'Sending...' : 'Send Message'}</span>
                <ArrowUpRight className="w-5 h-5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </button>
            </form>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
