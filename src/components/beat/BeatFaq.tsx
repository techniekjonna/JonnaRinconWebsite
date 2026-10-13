import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useT } from '../../contexts/LanguageContext';

export default function BeatFaq({ accent }: { accent: string }) {
  const t = useT();
  const [open, setOpen] = useState<number | null>(0);

  const items: { q: string; a: string }[] = [
    {
      q: t('Can I cut or rearrange the beat?', 'Kan ik de beat knippen of anders indelen?'),
      a: t(
        'Yes. The beat is easy to cut for a different arrangement: shorter intro, longer hook, extra verse. With the stems you can rebuild any part.',
        'Ja. De beat is makkelijk te knippen voor een andere verdeling: kortere intro, langere hook, een extra couplet. Met de stems bouw je elk deel opnieuw op.'
      ),
    },
    {
      q: t('What about the producer tags?', 'Hoe zit het met de producer tags?'),
      a: t(
        'Keep them all in or remove them all. No half work: it is all or nothing.',
        'Laat ze er allemaal in of haal ze allemaal weg. Geen half werk: alles of niets.'
      ),
    },
    {
      q: t('Who made the chords and melodies?', 'Wie heeft de akkoorden en melodieën gemaakt?'),
      a: t(
        'All chords and melodies are made from scratch by Jonna Rincon.',
        'Alle akkoorden en melodieën zijn van scratch gemaakt door Jonna Rincon.'
      ),
    },
    {
      q: t('Will I get copyright claims?', 'Krijg ik copyright claims?'),
      a: t(
        'No. Made with legal, paid software and samples. No copyright claims.',
        'Nee. Gemaakt met legale en betaalde software en samples. Geen copyright claims.'
      ),
    },
    {
      q: t('Are the stems included?', 'Zijn de stems inbegrepen?'),
      a: t(
        'Yes. You get all separate audio files per instrument and track, so your engineer can mix it exactly the way you want.',
        'Ja. Je krijgt alle losse audiobestanden per instrument en track, zodat je engineer het precies kan mixen zoals jij wilt.'
      ),
    },
    {
      q: t('Which files do I receive?', 'Welke bestanden krijg ik?'),
      a: t(
        'WAV and MP3, named with the title and details (BPM, key), at 44.1 kHz. Delivered between -7 and -5 dB, so there is headroom left for your vocals and master.',
        'WAV en MP3, met de titel en gegevens (BPM, key) in de naam, in 44,1 kHz. Afgeleverd tussen -7 en -5 dB, zodat er ruimte overblijft voor je vocals en de master.'
      ),
    },
    {
      q: t('Can I read the terms first?', 'Kan ik de voorwaarden eerst inzien?'),
      a: t(
        'Of course. The full terms of this beat are listed above under "Terms of this beat". Questions? Ask them below.',
        'Natuurlijk. De volledige voorwaarden van deze beat staan hierboven onder "Voorwaarden van deze beat". Vragen? Stel ze hieronder.'
      ),
    },
    {
      q: t('Can I reach Jonna directly?', 'Kan ik Jonna direct bereiken?'),
      a: t(
        'Yes. Direct service and contact with Jonna Rincon & management. Use the question form on this page.',
        'Ja. Directe service en contact met Jonna Rincon & management. Gebruik het vraagformulier op deze pagina.'
      ),
    },
  ];

  return (
    <section aria-labelledby="beat-faq-title">
      <p className="text-xs font-black uppercase tracking-[0.4em] mb-2" style={{ color: accent }}>FAQ</p>
      <h2 id="beat-faq-title" className="text-2xl md:text-3xl font-black uppercase tracking-tight text-white mb-6">
        {t('Frequently asked', 'Veelgestelde vragen')}
      </h2>
      <div className="divide-y divide-white/10 border-y border-white/10">
        {items.map((item, i) => {
          const isOpen = open === i;
          return (
            <div key={i}>
              <button
                onClick={() => setOpen(isOpen ? null : i)}
                aria-expanded={isOpen}
                className="w-full flex items-center justify-between gap-4 py-4 text-left min-h-[56px] group"
              >
                <span className={`font-bold text-sm md:text-base transition-colors ${isOpen ? 'text-white' : 'text-white/75 group-hover:text-white'}`}>{item.q}</span>
                <Plus
                  size={18}
                  className="flex-shrink-0 transition-transform duration-300"
                  style={{ color: isOpen ? accent : 'rgba(255,255,255,0.4)', transform: isOpen ? 'rotate(45deg)' : 'none' }}
                />
              </button>
              <div className={`grid transition-all duration-300 ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                <div className="overflow-hidden">
                  <p className="text-white/55 text-sm leading-relaxed pb-5 max-w-2xl">{item.a}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
