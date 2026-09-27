import { Music, Instagram, Youtube, Cloud as CloudIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useT } from '../contexts/LanguageContext';

export default function Footer() {
  const t = useT();
  return (
    <footer className="border-t border-white/[0.06] py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-3 gap-10 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <img
                src="/Jonna Rincon Logo WH.png"
                alt="Jonna Rincon"
                className="h-[100px] md:h-[130px] w-auto"
              />
            </div>
            <p className="text-white/30 text-sm leading-relaxed">
              {t('Professional producer and beatmaker crafting premium beats for artists worldwide.', 'Professioneel producer en beatmaker die premium beats maakt voor artiesten wereldwijd.')}
            </p>
            <p className="text-white/40 text-xs mt-3 leading-relaxed">
              {t('Also does: Art, Graphic Design, Editing, Producer Tutorials, Youtube', 'Doet ook: Kunst, Grafisch Ontwerp, Editing, Producer Tutorials, Youtube')}
            </p>
          </div>

          <div>
            <h3 className="text-lg font-bold mb-4 text-white">{t('Quick Links', 'Snelle Links')}</h3>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2">
              <Link to="/" className="block text-white/30 hover:text-white transition-colors text-sm">{t('Home', 'Home')}</Link>
              <Link to="/catalogue" className="block text-white/30 hover:text-white transition-colors text-sm">{t('Music', 'Muziek')}</Link>
              <Link to="/shop/beats" className="block text-white/30 hover:text-white transition-colors text-sm">{t('Beats', 'Beats')}</Link>
              <Link to="/shop/services" className="block text-white/30 hover:text-white transition-colors text-sm">{t('Services', 'Diensten')}</Link>
              <Link to="/remixes" className="block text-white/30 hover:text-white transition-colors text-sm">{t('Remixes', 'Remixes')}</Link>
              <Link to="/dj-sets" className="block text-white/30 hover:text-white transition-colors text-sm">{t('DJ Sets', 'Dj-sets')}</Link>
              <Link to="/studio-session" className="block text-white/30 hover:text-white transition-colors text-sm">{t('Studio Session', 'Studiosessie')}</Link>
              <Link to="/mix-master" className="block text-white/30 hover:text-white transition-colors text-sm">{t('Mix & Master', 'Mix & Master')}</Link>
              <Link to="/about" className="block text-white/30 hover:text-white transition-colors text-sm">{t('About', 'Over')}</Link>
              <Link to="/contact" className="block text-white/30 hover:text-white transition-colors text-sm">{t('Contact Me', 'Contact')}</Link>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-bold mb-4 text-white">{t('Follow', 'Volgen')}</h3>
            <div className="flex gap-3">
              <a href="https://www.instagram.com/jonnarincon/" target="_blank" rel="noopener noreferrer"
                className="p-3 bg-white/[0.04] border border-white/[0.06] rounded-full transition-all duration-300 hover:scale-110 hover:bg-white/[0.08]">
                <Instagram className="w-4 h-4 text-white/60" />
              </a>
              <a href="https://www.youtube.com/jonnarincon" target="_blank" rel="noopener noreferrer"
                className="p-3 bg-white/[0.04] border border-white/[0.06] rounded-full transition-all duration-300 hover:scale-110 hover:bg-white/[0.08]">
                <Youtube className="w-4 h-4 text-white/60" />
              </a>
              <a href="https://soundcloud.com/jonnarincon" target="_blank" rel="noopener noreferrer"
                className="p-3 bg-white/[0.04] border border-white/[0.06] rounded-full transition-all duration-300 hover:scale-110 hover:bg-white/[0.08]">
                <CloudIcon className="w-4 h-4 text-white/60" />
              </a>
              <a href="https://open.spotify.com/artist/6o3BlWTeK4EKUyByo35y6F" target="_blank" rel="noopener noreferrer"
                className="p-3 bg-white/[0.04] border border-white/[0.06] rounded-full transition-all duration-300 hover:scale-110 hover:bg-white/[0.08]">
                <Music className="w-4 h-4 text-white/60" />
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-white/[0.06] pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-white/25 text-xs">
            {t('Copyright', 'Copyright')} &copy; 2025 Jonna Rincon. {t('All Rights Reserved.', 'Alle Rechten Voorbehouden.')}
          </p>
          <div className="flex gap-6 text-xs">
            <a href="#" className="text-white/25 hover:text-white/50 transition-colors">{t('Privacy Policy', 'Privacybeleid')}</a>
            <a href="#" className="text-white/25 hover:text-white/50 transition-colors">{t('Terms of Service', 'Servicevoorwaarden')}</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
