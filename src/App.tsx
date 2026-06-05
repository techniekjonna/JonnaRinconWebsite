import Hero from './components/Hero';
import Footer from './components/Footer';
import SectionCards from './components/SectionCards';
import MusicPreview from './components/MusicPreview';

function App() {
  return (
    <div className="min-h-screen text-white">
      <main className="pt-20">
        <div id="hero"><Hero /></div>
        <SectionCards />
        <MusicPreview />
        <Footer />
      </main>
    </div>
  );
}

export default App;
