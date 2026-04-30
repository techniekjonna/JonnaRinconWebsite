import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Navigation from '../components/Navigation';
import Footer from '../components/Footer';
import { Check, Lock, Download, ExternalLink, Music, Instagram, Youtube } from 'lucide-react';
import { useCyberDecodeInView } from '../hooks/useCyberDecode';
import { useAuth } from '../contexts/AuthContext';
import { useScrollToTop } from '../hooks/useScrollToTop';

interface FollowStep {
  id: string;
  platform: string;
  label: string;
  url: string;
  icon: React.ElementType;
  color: string;
}

const followSteps: FollowStep[] = [
  {
    id: 'spotify',
    platform: 'Spotify',
    label: 'Follow on Spotify',
    url: 'https://open.spotify.com/artist/6o3BlWTeK4EKUyByo35y6F',
    icon: Music,
    color: 'bg-green-600 hover:bg-green-500',
  },
  {
    id: 'instagram',
    platform: 'Instagram',
    label: 'Follow on Instagram',
    url: 'https://www.instagram.com/jonnarincon/',
    icon: Instagram,
    color: 'bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-500 hover:to-pink-400',
  },
  {
    id: 'youtube',
    platform: 'YouTube',
    label: 'Subscribe on YouTube',
    url: 'https://www.youtube.com/jonnarincon',
    icon: Youtube,
    color: 'bg-red-600 hover:bg-red-500',
  },
];

export default function DownloadGatePage() {
  useScrollToTop();
  const { trackId } = useParams<{ trackId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const heroTitle = useCyberDecodeInView('Download');

  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  const [isUnlocked, setIsUnlocked] = useState(false);

  const handleStepClick = (step: FollowStep) => {
    // Open the social link in a new tab
    window.open(step.url, '_blank', 'noopener,noreferrer');

    // Mark as completed after opening
    setTimeout(() => {
      setCompletedSteps(prev => {
        const next = new Set(prev);
        next.add(step.id);

        // Check if all steps completed
        if (next.size >= followSteps.length) {
          setTimeout(() => setIsUnlocked(true), 500);
        }

        return next;
      });
    }, 2000);
  };

  const allCompleted = completedSteps.size >= followSteps.length;
  const needsAccount = !user;

  return (
    <div className="min-h-screen text-white">
      {/* Fixed Dark Overlay */}
      <div className="fixed inset-0 w-full h-screen -z-10 bg-black/20" />
<Navigation isDarkOverlay={true} isLightMode={false} />

      {/* Hero */}
      <section className="relative min-h-[40vh] flex items-end pb-12 md:pb-16 pt-40 px-6 md:px-12">
        <div className="relative z-10 max-w-3xl mx-auto w-full text-center">
          <p className="text-[10px] md:text-xs text-red-500/60 uppercase tracking-[0.4em] mb-4">Free Download</p>
          <h1 ref={heroTitle.ref as React.RefObject<HTMLHeadingElement>} className="text-5xl md:text-7xl font-black uppercase tracking-tighter">
            {heroTitle.display}
          </h1>
        </div>
      </section>

      {/* Gate Content */}
      <section className="px-6 md:px-12 py-12 md:py-20">
        <div className="max-w-lg mx-auto">
          {/* Track info card */}
          <div className="bg-white/[0.04] backdrop-blur-md border border-white/[0.06] rounded-3xl p-6 md:p-8 mb-8">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-xl bg-red-600/20 flex items-center justify-center">
                <Music size={28} className="text-red-400" />
              </div>
              <div>
                <h2 className="text-xl font-black uppercase tracking-tight">{trackId?.replace(/-/g, ' ') || 'Track'}</h2>
                <p className="text-white/30 text-xs mt-0.5">by Jonna Rincon</p>
              </div>
            </div>

            <div className="w-full h-px bg-white/[0.06] mb-6" />

            {/* Progress */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] text-white/30 uppercase tracking-widest font-bold">Progress</span>
                <span className="text-[10px] text-white/30 font-bold">{completedSteps.size}/{followSteps.length}</span>
              </div>
              <div className="w-full h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                <div
                  className="h-full bg-red-500 rounded-full transition-all duration-700"
                  style={{ width: `${(completedSteps.size / followSteps.length) * 100}%` }}
                />
              </div>
            </div>

            {/* Follow Steps */}
            <div className="space-y-3">
              {followSteps.map((step, i) => {
                const completed = completedSteps.has(step.id);
                const Icon = step.icon;

                return (
                  <button
                    key={step.id}
                    onClick={() => !completed && handleStepClick(step)}
                    disabled={completed}
                    className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all duration-300 text-left ${
                      completed
                        ? 'bg-green-600/10 border-green-600/20'
                        : 'bg-white/[0.04] border-white/[0.06] hover:bg-white/[0.06] hover:border-white/[0.10] cursor-pointer'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                      completed ? 'bg-green-600/20' : 'bg-white/[0.06]'
                    }`}>
                      {completed ? (
                        <Check size={18} className="text-green-400" />
                      ) : (
                        <Icon size={18} className="text-white/40" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className={`font-bold text-sm ${completed ? 'text-green-400' : 'text-white'}`}>
                        {completed ? `Following on ${step.platform}` : step.label}
                      </p>
                      <p className="text-[10px] text-white/20 mt-0.5">
                        {completed ? 'Completed' : `Step ${i + 1} of ${followSteps.length}`}
                      </p>
                    </div>
                    {!completed && (
                      <ExternalLink size={14} className="text-white/20 flex-shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Download Button / Account Gate */}
          {allCompleted && (
            <div className="bg-white/[0.04] backdrop-blur-md border border-white/[0.06] rounded-3xl p-6 md:p-8 text-center">
              {needsAccount ? (
                <>
                  <Lock size={24} className="text-white/20 mx-auto mb-4" />
                  <h3 className="text-lg font-black uppercase tracking-tight mb-2">Almost there!</h3>
                  <p className="text-white/30 text-sm mb-6">Create a free account to access downloads</p>
                  <Link
                    to="/register"
                    className="inline-block px-8 py-3.5 bg-red-600 hover:bg-red-500 text-white rounded-2xl font-bold transition-all hover:scale-105"
                  >
                    Create Free Account
                  </Link>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 rounded-full bg-green-600/20 flex items-center justify-center mx-auto mb-4">
                    <Check size={28} className="text-green-400" />
                  </div>
                  <h3 className="text-lg font-black uppercase tracking-tight mb-2">Unlocked!</h3>
                  <p className="text-white/30 text-sm mb-6">Your download is ready</p>
                  <button
                    className="inline-flex items-center gap-2 px-8 py-3.5 bg-red-600 hover:bg-red-500 text-white rounded-2xl font-bold transition-all hover:scale-105"
                  >
                    <Download size={18} />
                    Download Track
                  </button>
                  <p className="text-[10px] text-white/15 mt-4">Download will be available from your dashboard</p>
                </>
              )}
            </div>
          )}

          {!allCompleted && (
            <p className="text-center text-white/20 text-xs mt-4">
              Complete all steps above to unlock the free download
            </p>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
