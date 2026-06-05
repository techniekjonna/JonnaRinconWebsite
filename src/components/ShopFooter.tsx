import { Link } from 'react-router-dom';
import { Music, Instagram, Youtube, Cloud as CloudIcon } from 'lucide-react';

export default function ShopFooter() {
  return (
    <footer className="bg-[#0a0a0a] border-t border-white/[0.06] py-12 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-3 gap-10 mb-8">
          <div>
            <img src="/JEIGHTEEN-logo.png" alt="JEIGHTEEN" className="h-12 w-auto object-contain mb-4 opacity-80" />
            <p className="text-white/30 text-sm leading-relaxed">
              Professional producer and beatmaker crafting premium beats for artists worldwide.
            </p>
            <p className="text-white/40 text-xs mt-3 leading-relaxed">
              Also does: Art, Graphic Design, Editing, Producer Tutorials, Youtube
            </p>
          </div>
          <div>
            <h3 className="text-sm font-black uppercase tracking-widest mb-4 text-white/60">Quick Links</h3>
            <div className="space-y-2.5">
              <Link to="/shop/beats" className="block text-white/30 hover:text-white transition-colors text-sm">Browse Beats</Link>
              <Link to="/shop/services" className="block text-white/30 hover:text-white transition-colors text-sm">Book a Service</Link>
              <Link to="/contact" className="block text-white/30 hover:text-white transition-colors text-sm">Get in Touch</Link>
            </div>
          </div>
          <div>
            <h3 className="text-sm font-black uppercase tracking-widest mb-4 text-white/60">Follow</h3>
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
          <p className="text-white/25 text-xs">Copyright &copy; 2025 Jonna Rincon. All Rights Reserved.</p>
          <div className="flex gap-6 text-xs">
            <a href="#" className="text-white/25 hover:text-white/50 transition-colors">Privacy Policy</a>
            <a href="#" className="text-white/25 hover:text-white/50 transition-colors">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
