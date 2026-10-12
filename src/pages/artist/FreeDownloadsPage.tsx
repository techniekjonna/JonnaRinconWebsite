import React, { useState } from 'react';
import ArtistLayout from '../../components/artist/ArtistLayout';
import { Download, Music, Disc, ImageIcon as PhotoIcon } from 'lucide-react';

interface FreeDownload {
  id: string;
  title: string;
  category: 'remix' | 'beat' | 'wallpaper';
  description: string;
  imageUrl: string;
  downloadUrl: string;
  fileSize: string;
  releaseDate: string;
}

const ArtistFreeDownloads: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'all' | 'remix' | 'beat' | 'wallpaper'>('all');

  // Sample free downloads - in production, this would come from Firestore
  const freeDownloads: FreeDownload[] = [
    // Remixes
    {
      id: '1',
      title: 'Summer Vibes Remix',
      category: 'remix',
      description: 'Tropical house remix with uplifting melodies',
      imageUrl: '/placeholder-beat.png',
      downloadUrl: '#',
      fileSize: '8.5 MB',
      releaseDate: '2024-01-15',
    },
    // Beats
    {
      id: '2',
      title: 'Free Type Beat',
      category: 'beat',
      description: 'Trap beat with hard 808s - free for non-profit use',
      imageUrl: '/placeholder-beat.png',
      downloadUrl: '#',
      fileSize: '12.3 MB',
      releaseDate: '2024-02-01',
    },
    // Wallpapers
    {
      id: '3',
      title: 'Neon Dreams Wallpaper',
      category: 'wallpaper',
      description: 'iPhone wallpaper with neon aesthetic',
      imageUrl: '/placeholder-beat.png',
      downloadUrl: '#',
      fileSize: '2.1 MB',
      releaseDate: '2024-01-20',
    },
  ];

  const filteredDownloads = activeTab === 'all'
    ? freeDownloads
    : freeDownloads.filter(item => item.category === activeTab);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'remix': return <Music size={20} />;
      case 'beat': return <Disc size={20} />;
      case 'wallpaper': return <PhotoIcon aria-hidden="true" size={20} />;
      default: return <Download size={20} />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'remix': return 'bg-purple-600/20 text-purple-400';
      case 'beat': return 'bg-orange-600/20 text-orange-400';
      case 'wallpaper': return 'bg-blue-600/20 text-blue-400';
      default: return 'bg-white/[0.08]/20 text-white/40';
    }
  };

  return (
    <ArtistLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-white">Free Downloads</h1>
          <p className="text-white/40 mt-2">Get free remixes, beats, and wallpapers</p>
        </div>

        {/* Info Banner */}
        <div className="bg-green-900/20 border border-green-700 rounded-xl p-4">
          <p className="text-sm text-green-200">
            🎁 <strong>100% Free!</strong> Download any of these items for personal use.
            For commercial use of beats and remixes, please contact us for licensing.
          </p>
        </div>

        {/* Category Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 rounded-lg font-medium transition flex-shrink-0 ${
              activeTab === 'all'
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                : 'bg-white/[0.08] text-white/40 hover:bg-white/[0.06]'
            }`}
          >
            All Downloads
          </button>
          <button
            onClick={() => setActiveTab('remix')}
            className={`px-4 py-2 rounded-lg font-medium transition flex-shrink-0 flex items-center gap-2 ${
              activeTab === 'remix'
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                : 'bg-white/[0.08] text-white/40 hover:bg-white/[0.06]'
            }`}
          >
            <Music size={16} />
            Remixes
          </button>
          <button
            onClick={() => setActiveTab('beat')}
            className={`px-4 py-2 rounded-lg font-medium transition flex-shrink-0 flex items-center gap-2 ${
              activeTab === 'beat'
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                : 'bg-white/[0.08] text-white/40 hover:bg-white/[0.06]'
            }`}
          >
            <Disc size={16} />
            Beats
          </button>
          <button
            onClick={() => setActiveTab('wallpaper')}
            className={`px-4 py-2 rounded-lg font-medium transition flex-shrink-0 flex items-center gap-2 ${
              activeTab === 'wallpaper'
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                : 'bg-white/[0.08] text-white/40 hover:bg-white/[0.06]'
            }`}
          >
            <PhotoIcon aria-hidden="true" size={16} />
            Wallpapers
          </button>
        </div>

        {/* Downloads Grid */}
        {filteredDownloads.length === 0 ? (
          <div className="bg-white/[0.08] border border-white/[0.06] rounded-xl p-12 text-center">
            <Download size={64} className="mx-auto mb-4 text-white/20" />
            <h2 className="text-2xl font-bold text-white mb-2">No downloads available</h2>
            <p className="text-white/40">Check back soon for new free content</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDownloads.map((item) => (
              <div
                key={item.id}
                className="bg-white/[0.08] border border-white/[0.06] rounded-xl overflow-hidden hover:border-purple-500 transition-all"
              >
                {/* Image */}
                <div className="relative">
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    className="w-full h-48 object-cover"
                  />
                  <div className={`absolute top-2 right-2 px-2 py-1 rounded-lg text-xs font-medium flex items-center gap-1 ${getCategoryColor(item.category)}`}>
                    {getCategoryIcon(item.category)}
                    <span className="capitalize">{item.category}</span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4 space-y-3">
                  <div>
                    <h3 className="text-lg font-bold text-white mb-1">{item.title}</h3>
                    <p className="text-sm text-white/40">{item.description}</p>
                  </div>

                  {/* Meta Info */}
                  <div className="flex justify-between text-xs text-white/25">
                    <span>{item.fileSize}</span>
                    <span>{new Date(item.releaseDate).toLocaleDateString()}</span>
                  </div>

                  {/* Download Button */}
                  <a
                    href={item.downloadUrl}
                    download
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 px-4 py-3 rounded-lg text-white font-semibold transition-all flex items-center justify-center gap-2"
                  >
                    <Download size={18} />
                    Download Free
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </ArtistLayout>
  );
};

export default ArtistFreeDownloads;
