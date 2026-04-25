import { useEffect, useRef, useState, ReactNode } from 'react';
import SocialCardCarousel from './SocialCard';

const TARGET_TEXT = 'JONNA RINCON';
const GLYPHS = '!@#$%^&*0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';

function useCyberDecode(text: string, startDelay = 300) {
  const [display, setDisplay] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    let lockedCount = 0;
    let interval: ReturnType<typeof setInterval>;
    let tickCount = 0;

    const timeout = setTimeout(() => {
      interval = setInterval(() => {
        tickCount++;

        if (tickCount % 5 === 0 && lockedCount < text.length) {
          lockedCount++;
        }

        let result = '';
        for (let i = 0; i < text.length; i++) {
          if (i < lockedCount) {
            result += text[i];
          } else if (text[i] === ' ') {
            result += ' ';
          } else {
            result += GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
          }
        }
        setDisplay(result);

        if (lockedCount >= text.length) {
          clearInterval(interval);
          setDone(true);
        }
      }, 30);
    }, startDelay);

    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, [text, startDelay]);

  return { display, done };
}

// Carousel slides data
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
        Jonathan aka <span className="text-white font-semibold">j18</span> is a human being with a creative mind which is described by many people as{' '}
        <span className="italic text-gray-300">"not from this world"</span>. You may already recognize his{' '}
        <span className="text-white font-semibold">J18 tag</span> at the beginning and/or end of every track, or by the clock sound in his work.
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
    imageSrc: '/Scherm afbeelding 2025-12-16 om 17.09.27.png',
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
        <span className="italic text-gray-300">(J18=Jeighteen)</span> — his tag, his clothing brand & his nickname. Everything started in{' '}
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

export default function Hero() {
  const imgRef = useRef<HTMLImageElement>(null);
  const { display, done } = useCyberDecode(TARGET_TEXT);
  const [activeCarouselIndex, setActiveCarouselIndex] = useState(0);

  return (
    <section className="relative w-full min-h-screen flex items-center justify-center">
      {/* Fullscreen Background Image - FIXED */}
      <div className="fixed inset-0 w-full h-screen -z-10">
        <img
          ref={imgRef}
          src="/JEIGHTENESIS.jpg"
          alt="Jonna Rincon"
          className="w-full h-full object-cover transition-opacity duration-500"
          style={{objectPosition: 'center'}}
        />
        {/* Static Overlay - 70% like other public pages */}
        <div className="absolute inset-0 bg-black/70" />
      </div>

      {/* Content — two columns: left text, right carousel */}
      <div className="relative z-10 w-full h-screen flex flex-col lg:flex-row items-center justify-center px-4 md:px-6 gap-8">

        {/* LEFT: Text content */}
        <div className="flex flex-col items-center lg:items-start justify-center max-w-lg flex-1">
          {/* Banner — top badge */}
          <div
            className="mb-8 px-4 py-2 border border-white/30 rounded-full text-xs uppercase tracking-widest text-white/70 transition-opacity duration-700"
            style={{ opacity: done ? 1 : 0 }}
          >
            ✨ ARTIST THAT LOVES TO CREATE ART
          </div>

          {/* JONNA RINCON — cyber decode animatie */}
          <h1
            className="text-white font-black uppercase leading-none tracking-tighter text-center lg:text-left select-none"
            style={{
              fontSize: 'clamp(2.6rem, 8vw, 5rem)',
              fontFamily: 'inherit',
              minHeight: '1.1em',
            }}
          >
            {display || ' '}
          </h1>

          {/* Subtekst */}
          <p
            className="text-white/70 text-lg md:text-xl text-center lg:text-left mt-4 transition-opacity duration-700"
            style={{ opacity: done ? 1 : 0 }}
          >
            Your soon to be favourite artist
          </p>

          {/* Highlights — Artist, Producer, DJ, Engineer */}
          <div
            className="mt-8 flex flex-wrap justify-center lg:justify-start gap-4 md:gap-6 transition-opacity duration-700"
            style={{ opacity: done ? 1 : 0 }}
          >
            <div className="text-center lg:text-left">
              <p className="text-white/50 text-xs uppercase tracking-wider">Artist</p>
            </div>
            <div className="hidden sm:block text-white/30">•</div>
            <div className="text-center lg:text-left">
              <p className="text-white/50 text-xs uppercase tracking-wider">Producer</p>
            </div>
            <div className="hidden sm:block text-white/30">•</div>
            <div className="text-center lg:text-left">
              <p className="text-white/50 text-xs uppercase tracking-wider">DJ</p>
            </div>
            <div className="hidden sm:block text-white/30">•</div>
            <div className="text-center lg:text-left">
              <p className="text-white/50 text-xs uppercase tracking-wider">Sound Engineer</p>
            </div>
          </div>

          {/* Buttons — centered on mobile, left on desktop */}
          <div
            className="mt-12 flex flex-col sm:flex-row gap-3 transition-opacity duration-700 flex-wrap justify-center lg:justify-start"
            style={{ opacity: done ? 1 : 0 }}
          >
            <a
              href="/shop"
              className="px-8 py-3.5 bg-white text-black font-bold text-sm uppercase tracking-widest hover:bg-gray-200 transition-all duration-300 hover:scale-105 active:scale-95 text-center min-w-[180px]"
            >
              SHOP
            </a>
            <a
              href="/my-tracks"
              className="px-8 py-3.5 bg-white text-black font-bold text-sm uppercase tracking-widest hover:bg-gray-200 transition-all duration-300 hover:scale-105 active:scale-95 text-center min-w-[180px]"
            >
              Listen Now
            </a>
            <a
              href="/contact"
              className="px-8 py-3.5 bg-white text-black font-bold text-sm uppercase tracking-widest hover:bg-gray-200 transition-all duration-300 hover:scale-105 active:scale-95 text-center min-w-[180px]"
            >
              Contact
            </a>
          </div>
        </div>

        {/* RIGHT: Instagram Carousel */}
        <div
          className="flex-1 flex justify-center transition-opacity duration-700"
          style={{ opacity: done ? 1 : 0 }}
        >
          <SocialCardCarousel
            slides={SLIDES.map((s) => ({
              imageSrc: s.imageSrc,
              imageAlt: s.imageAlt,
              location: s.caption,
              caption: s.text,
              likes: s.likes,
            }))}
            activeIndex={activeCarouselIndex}
            onIndexChange={setActiveCarouselIndex}
          />
        </div>
      </div>
    </section>
  );
}
