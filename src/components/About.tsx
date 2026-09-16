import { useState, type ReactNode } from 'react';
import SocialCardCarousel from './SocialCard';
import { useInView } from '../hooks/useInView';

// Soft hyphen in filename — matches actual file on disk
const SCHERM_PREFIX = 'Scherm\u00ADafbeelding';

interface SlideContent {
  title: string;
  text: ReactNode;
  imageSrc: string;
  imageAlt: string;
  location: string;
  caption: string;
  likes: number;
}

const SLIDES: SlideContent[] = [
  {
    title: 'The Story',
    text: (
      <>
        Jonathan aka <span className="text-white font-semibold">Jonna Rincon</span> is a human being with a creative mind which is described by many people as{' '}
        <span className="italic text-gray-300">"not from this world"</span>. You may already recognize his{' '}
        <span className="text-white font-semibold">Jonna Rincon tag</span> at the beginning and/or end of every track, or by the clock sound in his work.
      </>
    ),
    imageSrc: '/DJI_20251115114029_0004_D.JPG',
    imageAlt: 'Jonna Rincon aerial',
    location: 'Netherlands',
    caption: 'Creative mind at work. The story continues...',
    likes: 847,
  },
  {
    title: 'The Sound',
    text: (
      <>
        Mostly known for his raw and authentic{' '}
        <span className="text-white/80 font-medium">moombahton</span> style in tracks or beats. But have in mind that this young man has much to offer. From modern{' '}
        <span className="text-white/80 font-medium">rap beats</span> to the dirty old classic{' '}
        <span className="text-white/80 font-medium">hip hop</span> beats, from warm and smooth{' '}
        <span className="text-white/80 font-medium">r&b</span> instrumentals to the world of{' '}
        <span className="text-white/80 font-medium">EDM</span> to studying to jonna's{' '}
        <span className="text-white/80 font-medium">lo-fi</span> instrumentals which he made on his trip on earth.
      </>
    ),
    imageSrc: '/DJ Screenshot 3-2-26.png',
    imageAlt: 'Jonna Rincon DJ',
    location: 'DJ Set',
    caption: 'Raw and authentic. From moombahton to lo-fi.',
    likes: 623,
  },
  {
    title: 'The Journey',
    text: (
      <>
        Born in <span className="text-white font-semibold">Maastricht, The Netherlands</span> & based in{' '}
        <span className="text-white font-semibold">Tilburg</span> he began making music when first made contact with any music instrument nearby. When he visited his nephews in{' '}
        <span className="text-white font-semibold">Dominican Republic</span>, he was shown{' '}
        <span className="text-white font-semibold">FL Studio</span> for the first time. When Jonna saw that it was possible to make a track with a PC, he made his first track immediately together with his oldest nephew and that's where the music production journey started.
      </>
    ),
    imageSrc: `/${SCHERM_PREFIX} 2025-12-16 om 17.09.27.png`,
    imageAlt: 'Jonna Rincon studio',
    location: 'In the studio',
    caption: 'Where it all began. FL Studio changed everything.',
    likes: 512,
  },
  {
    title: 'The Grind',
    text: (
      <>
        With over <span className="text-white font-semibold">10+ years</span> of production under his belt, Jonna continues to push boundaries. From his home base in{' '}
        <span className="text-white font-semibold">Tilburg</span> he works with artists worldwide, always staying true to his roots while exploring new sounds.
      </>
    ),
    imageSrc: '/IMG_1027.jpg',
    imageAlt: 'Jonna Rincon',
    location: 'Tilburg, NL',
    caption: '10+ years of production. The grind never stops.',
    likes: 934,
  },
  {
    title: 'The Roots',
    text: (
      <>
        <span className="text-white font-semibold">Jonna Rincon</span> — his tag and his nickname. Everything started in{' '}
        <span className="text-white font-semibold">Maastricht</span>. The city where the roots are. Born and raised, now based in the Netherlands working with artists worldwide.
      </>
    ),
    imageSrc: '/Maastricht Screenshot 15-12-25.png',
    imageAlt: 'Jonna Rincon Maastricht',
    location: 'Maastricht, NL',
    caption: 'Where the roots are. Born and raised.',
    likes: 718,
  },
];

export default function About() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [ref] = useInView();

  return (
    <section
      ref={ref}
      id="about"
      className="py-12 md:py-20 px-4 bg-transparent"
    >
      <div className="max-w-[1100px] mx-auto">

        {/* Centered carousel only */}
        <div className="flex justify-center">
          <SocialCardCarousel
            slides={SLIDES.map((s) => ({
              imageSrc: s.imageSrc,
              imageAlt: s.imageAlt,
              location: s.caption,
              caption: s.text,
              likes: s.likes,
            }))}
            activeIndex={activeIndex}
            onIndexChange={setActiveIndex}
          />
        </div>

      </div>
    </section>
  );
}
