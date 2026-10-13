import { useState } from 'react';
import { Send, Check, ChevronLeft, ChevronRight, MessageCircle } from 'lucide-react';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase/config';
import { Beat } from '../../lib/firebase/types';
import { withAlpha } from '../../lib/coverColor';
import { useT } from '../../contexts/LanguageContext';

const MAX_MESSAGE_LENGTH = 3000;
type Step = 'compose' | 'details' | 'sent';

// Same two-step flow as the Contact page, but the category is fixed to this
// beat: "Beat <title> (<genre>) (<bpm> BPM)". The beat id travels along so the
// inbox can link straight back to this page.
export default function BeatQuestionForm({ beat, accent }: { beat: Beat; accent: string }) {
  const t = useT();
  const [step, setStep] = useState<Step>('compose');
  const [message, setMessage] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(false);

  const category = `Beat ${beat.title}${beat.genre ? ` (${beat.genre})` : ''}${beat.bpm ? ` (${beat.bpm} BPM)` : ''}`;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) return;
    setSending(true);
    setError(false);
    try {
      await addDoc(collection(db, 'supportMessages'), {
        senderId: `contact:${email.trim().toLowerCase()}`,
        senderName: name.trim(),
        senderEmail: email.trim(),
        senderRole: 'contact',
        recipientGroup: 'support',
        category,
        message: message.trim(),
        beatId: beat.id,
        beatTitle: beat.title,
        beatGenre: beat.genre || '',
        beatBpm: beat.bpm || null,
        createdAt: serverTimestamp(),
        status: 'sent',
      });
      setStep('sent');
    } catch (err) {
      console.error('Beat question submission error:', err);
      setError(true);
    } finally {
      setSending(false);
    }
  };

  const steps: Step[] = ['compose', 'details', 'sent'];
  const inputCls = 'w-full px-4 py-3 bg-white/5 border border-white/10 text-white placeholder-white/30 rounded-xl focus:outline-none focus:border-white/30 focus:bg-white/10 transition-all text-base md:text-sm';

  return (
    <section aria-labelledby="beat-question-title">
      <div className="flex items-center gap-3 mb-2">
        <MessageCircle size={18} style={{ color: accent }} />
        <h2 id="beat-question-title" className="text-xl md:text-2xl font-black uppercase tracking-tight text-white">
          {t('Question about this beat?', 'Vraag over deze beat?')}
        </h2>
      </div>
      <p className="text-white/50 text-sm mb-6">
        {t('Ask Jonna Rincon & management directly. You will get a personal reply.', 'Stel je vraag direct aan Jonna Rincon & management. Je krijgt persoonlijk antwoord.')}
      </p>

      <div className="border rounded-3xl overflow-hidden backdrop-blur-sm" style={{ background: `linear-gradient(135deg, ${withAlpha(accent, 0.14)}, ${withAlpha(accent, 0.04)})`, borderColor: withAlpha(accent, 0.22) }}>
        <div className="flex items-center border-b border-white/[0.06] px-4 sm:px-6 py-4 overflow-x-auto">
          {steps.map((s, i) => {
            const active = step === s;
            const done = steps.indexOf(step) > i;
            return (
              <div key={s} className="flex items-center flex-shrink-0">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black transition-all ${active ? 'bg-white text-black' : done ? 'text-white' : 'bg-white/[0.08] text-white/30'}`}
                  style={done ? { background: accent } : undefined}
                >
                  {done ? <Check size={11} /> : i + 1}
                </div>
                <span className={`ml-2 text-xs font-bold uppercase tracking-wider ${active ? 'text-white' : 'text-white/25'}`}>
                  {s === 'compose' ? t('Question', 'Vraag') : s === 'details' ? t('Your Info', 'Jouw Gegevens') : t('Sent', 'Verzonden')}
                </span>
                {i < 2 && <ChevronRight size={14} className="mx-3 sm:mx-4 text-white/20" />}
              </div>
            );
          })}
        </div>

        {step === 'compose' && (
          <div className="p-5 md:p-8">
            <div
              className="inline-flex flex-wrap items-center gap-x-2 gap-y-1 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide mb-4 border"
              style={{ borderColor: withAlpha(accent, 0.4), background: withAlpha(accent, 0.12), color: accent }}
            >
              <span>Beat</span>
              <span className="text-white">{beat.title}</span>
              {beat.genre && <span className="text-white/60">({beat.genre})</span>}
              {beat.bpm ? <span className="text-white/60">({beat.bpm} BPM)</span> : null}
            </div>
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="beat-q" className="text-xs font-bold uppercase tracking-widest text-white/40">{t('Your question', 'Je vraag')}</label>
              <span className={`text-[10px] ${message.length >= MAX_MESSAGE_LENGTH ? 'text-red-400' : 'text-white/25'}`}>{message.length} / {MAX_MESSAGE_LENGTH}</span>
            </div>
            <textarea
              id="beat-q"
              rows={5}
              value={message}
              onChange={(e) => setMessage(e.target.value.slice(0, MAX_MESSAGE_LENGTH))}
              placeholder={t('E.g. can I get a shorter version, or is this beat still available exclusively?', 'Bijvoorbeeld: kan ik een kortere versie krijgen, of is deze beat nog exclusief beschikbaar?')}
              className={`${inputCls} resize-none`}
            />
            <button
              onClick={() => message.trim() && setStep('details')}
              disabled={!message.trim()}
              className="w-full mt-5 py-4 text-white font-bold rounded-xl transition-all text-sm uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-110"
              style={{ background: accent }}
            >
              <Send size={16} /> {t('Continue', 'Doorgaan')}
            </button>
          </div>
        )}

        {step === 'details' && (
          <form onSubmit={submit} className="p-5 md:p-8 space-y-4">
            <div className="p-4 bg-white/[0.04] rounded-xl border border-white/[0.08] text-sm">
              <p className="text-white/40 text-xs mb-1">{category}</p>
              <p className="text-white/80 leading-relaxed line-clamp-3 whitespace-pre-wrap">{message}</p>
            </div>
            <div className="md:grid md:grid-cols-2 md:gap-4 space-y-4 md:space-y-0">
              <div>
                <label htmlFor="bq-name" className="block text-xs font-bold uppercase tracking-widest text-white/40 mb-2">{t('Full Name', 'Volledige Naam')}</label>
                <input id="bq-name" value={name} onChange={(e) => setName(e.target.value)} required placeholder={t('Your name', 'Jouw naam')} className={inputCls} />
              </div>
              <div>
                <label htmlFor="bq-email" className="block text-xs font-bold uppercase tracking-widest text-white/40 mb-2">{t('Email Address', 'E-mailadres')}</label>
                <input id="bq-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="your@email.com" className={inputCls} />
              </div>
            </div>
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs">
                {t('Something went wrong. Please try again.', 'Er is iets misgegaan. Probeer het opnieuw.')}
              </div>
            )}
            <div className="flex gap-3 pt-1">
              <button type="button" onClick={() => setStep('compose')} className="px-5 py-3.5 bg-white/[0.06] border border-white/[0.1] text-white/60 hover:text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-1.5">
                <ChevronLeft size={14} /> {t('Back', 'Terug')}
              </button>
              <button
                type="submit"
                disabled={sending || !name.trim() || !email.trim()}
                className="flex-1 py-3.5 text-white font-bold rounded-xl transition-all text-sm uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-110"
                style={{ background: accent }}
              >
                <Send size={15} /> {sending ? t('Sending...', 'Verzenden...') : t('Submit', 'Verzenden')}
              </button>
            </div>
          </form>
        )}

        {step === 'sent' && (
          <div className="p-10 text-center space-y-4">
            <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto border" style={{ background: withAlpha(accent, 0.2), borderColor: withAlpha(accent, 0.4) }}>
              <Check size={24} style={{ color: accent }} />
            </div>
            <h3 className="text-xl font-black uppercase tracking-tight text-white">{t('Question Sent!', 'Vraag Verzonden!')}</h3>
            <p className="text-white/40 text-sm leading-relaxed">
              {t('Thanks,', 'Bedankt,')} {name}. {t('We will reply as soon as possible at', 'We reageren zo snel mogelijk op')} <span className="text-white/60">{email}</span>.
            </p>
            <button
              onClick={() => { setStep('compose'); setMessage(''); }}
              className="px-6 py-2.5 bg-white/[0.08] border border-white/[0.12] text-white/60 hover:text-white rounded-2xl font-bold text-xs uppercase tracking-wider transition-all"
            >
              {t('Ask another question', 'Nog een vraag stellen')}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
