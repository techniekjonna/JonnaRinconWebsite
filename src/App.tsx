import { useEffect } from 'react';
import Hero from './components/Hero';
import Footer from './components/Footer';
import SectionCards from './components/SectionCards';
import MusicPreview from './components/MusicPreview';
import PromoSection from './components/PromoSection';

// Duration the overlay takes to fade in + small buffer
const INTRO_DURATION = 3000;

function App() {
  // Lock scrolling during the intro animation so the user sees it fully
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    const t = setTimeout(() => {
      document.body.style.overflow = '';
    }, INTRO_DURATION);
    return () => {
      clearTimeout(t);
      document.body.style.overflow = '';
    };
  }, []);

  return (
    <div className="min-h-screen text-white">
      <main className="pt-20">
        <div id="hero"><Hero /></div>
        <SectionCards />
        <PromoSection />
        <MusicPreview />
        <Footer />
      </main>
    </div>
  );
}

export default App;
