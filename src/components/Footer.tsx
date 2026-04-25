import { Music, Instagram, Youtube, Cloud as CloudIcon } from 'lucide-react';

export default function Footer() {
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
            <p className="text-white/50 text-xs uppercase tracking-wider mb-2">
              Management by Get Major Gigs
            </p>
            <p className="text-white/30 text-sm leading-relaxed">
              Professional producer and beatmaker crafting premium beats for artists worldwide.
            </p>
            <p className="text-white/40 text-xs mt-3 leading-relaxed">
              Also does: Art, Graphic Design, Editing, Producer Tutorials, Youtube
            </p>
          </div>

          <div>
            <h3 className="text-lg font-bold mb-4 text-white">Quick Links</h3>
            <div className="space-y-2.5">
              <a href="#beats" className="block text-white/30 hover:text-white transition-colors text-sm">
                Browse Beats
              </a>
              <a href="#music" className="block text-white/30 hover:text-white transition-colors text-sm">
                Listen to Music
              </a>
              <a href="#contact" className="block text-white/30 hover:text-white transition-colors text-sm">
                Get in Touch
              </a>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-bold mb-4 text-white">Follow</h3>
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
            Copyright &copy; 2025 Jonna Rincon. All Rights Reserved.
          </p>
          <div className="flex gap-6 text-xs">
            <a href="#" className="text-white/25 hover:text-white/50 transition-colors">Privacy Policy</a>
            <a href="#" className="text-white/25 hover:text-white/50 transition-colors">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
