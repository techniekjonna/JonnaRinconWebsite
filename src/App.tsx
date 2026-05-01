import { useState } from 'react';
import Hero from './components/Hero';
import Footer from './components/Footer';
import LoadingScreen from './components/LoadingScreen';
import SectionCards from './components/SectionCards';
import MusicPreview from './components/MusicPreview';

// Hidden for now, kept for later use:
// import BeatStore from './components/BeatStore';
// import Music from './components/Music';
// import Socials from './components/Socials';
// import LiveStudio from './components/LiveStudio';
// import Marquee from './components/Marquee';
// import MarqueeRed from './components/MarqueeRed';
// import WaveformDivider from './components/WaveformDivider';

function App() {
  const [contentVisible, setContentVisible] = useState(false);

  return (
    <div className="min-h-screen text-white">
      <LoadingScreen onLoadingComplete={() => {
        setTimeout(() => setContentVisible(true), 100);
      }} />

      <main
        className="pt-20"
        style={{
          opacity: contentVisible ? 1 : 0,
          transition: 'opacity 1.2s ease-in-out',
        }}
      >
        <div id="hero" style={{ height: 'calc(100vh - 5rem)', overflow: 'hidden' }}><Hero /></div>
        <SectionCards />
        <MusicPreview />
        <Footer />
      </main>
    </div>
  );
}

export default App;
