import { Play, Pause, ShoppingCart } from 'lucide-react';
import { Beat } from '../lib/types';
import { useState, useRef } from 'react';

interface BeatCardProps {
  beat: Beat;
  onAddToCart: (beat: Beat, license: 'basic' | 'premium' | 'exclusive') => void;
}

export default function BeatCard({ beat, onAddToCart }: BeatCardProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedLicense, setSelectedLicense] = useState<'basic' | 'premium' | 'exclusive'>('basic');
  const audioRef = useRef<HTMLAudioElement>(null);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const getLicensePrice = () => {
    switch (selectedLicense) {
      case 'basic':
        return beat.price;
      case 'premium':
        return beat.price * 1.5;
      case 'exclusive':
        return beat.price * 3;
      default:
        return beat.price;
    }
  };

  return (
    <div className="group bg-white/5 border border-white/10 rounded-lg overflow-hidden hover-lift transition-all duration-300">
      <div className="relative aspect-square overflow-hidden">
        <img
          src={beat.artwork_url}
          alt={beat.title}
          loading="lazy"
          decoding="async"
          className="w-full h-full object-cover group-hover:scale-110 transition-all duration-700"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity duration-300"></div>

        <button
          onClick={togglePlay}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center hover:bg-white/30 hover:scale-125 active:scale-95 transition-all duration-300 shadow-2xl border border-white/20"
        >
          {isPlaying ? (
            <Pause className="w-10 h-10" fill="currentColor" />
          ) : (
            <Play className="w-10 h-10 ml-1" fill="currentColor" />
          )}
        </button>

        {beat.featured && (
          <div className="absolute top-4 right-4 bg-red-600 text-white px-4 py-2 rounded-full text-xs font-bold animate-pulse">
            FEATURED
          </div>
        )}

        <audio ref={audioRef} src={beat.audio_url} onEnded={() => setIsPlaying(false)} />
      </div>

      <div className="p-6">
        <h3 className="text-2xl font-bold mb-2 text-white">{beat.title}</h3>
        <p className="text-gray-400 mb-4">{beat.artist}</p>

        <div className="flex flex-wrap gap-2 mb-4">
          <span className="px-3 py-1 bg-white/5 rounded-full text-sm border border-white/10">
            {beat.bpm} BPM
          </span>
          <span className="px-3 py-1 bg-white/5 rounded-full text-sm border border-white/10">
            {beat.key}
          </span>
          <span className="px-3 py-1 bg-white/5 rounded-full text-sm border border-white/10">
            {beat.genre}
          </span>
        </div>

        <div className="flex gap-2 mb-4">
          {beat.license_basic && (
            <button
              onClick={() => setSelectedLicense('basic')}
              className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                selectedLicense === 'basic'
                  ? 'bg-white text-black'
                  : 'bg-white/5 text-gray-300 hover:bg-white/10'
              }`}
            >
              Basic
            </button>
          )}
          {beat.license_premium && (
            <button
              onClick={() => setSelectedLicense('premium')}
              className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                selectedLicense === 'premium'
                  ? 'bg-white text-black'
                  : 'bg-white/5 text-gray-300 hover:bg-white/10'
              }`}
            >
              Premium
            </button>
          )}
          {beat.license_exclusive && (
            <button
              onClick={() => setSelectedLicense('exclusive')}
              className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                selectedLicense === 'exclusive'
                  ? 'bg-white text-black'
                  : 'bg-white/5 text-gray-300 hover:bg-white/10'
              }`}
            >
              Exclusive
            </button>
          )}
        </div>

        <div className="flex items-center justify-between">
          <span className="text-4xl font-black text-white">
            &euro;{getLicensePrice().toFixed(2)}
          </span>
          <button
            onClick={() => onAddToCart(beat, selectedLicense)}
            className="group/btn flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 rounded-lg font-bold transition-all duration-300 hover:scale-110 active:scale-95"
          >
            <ShoppingCart className="w-5 h-5 group-hover/btn:animate-bounce" />
            <span>Add to Cart</span>
          </button>
        </div>
      </div>
    </div>
  );
}
