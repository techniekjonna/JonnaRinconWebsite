import React from 'react';
import ManagerLayout from '../../components/manager/ManagerLayout';
import { Music, MessageSquare, TrendingUp, Eye } from 'lucide-react';
import { useBeats } from '../../hooks/useBeats';

const ManagerDashboard: React.FC = () => {
  const { beats, loading } = useBeats();

  const stats = {
    totalBeats: beats.length,
    publishedBeats: beats.filter(b => b.status === 'published').length,
    totalPlays: beats.reduce((sum, b) => sum + b.plays, 0),
    featuredBeats: beats.filter(b => b.featured).length,
  };

  return (
    <ManagerLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-white">Manager Dashboard</h1>
          <p className="text-gray-400 mt-2">Overview of beats and platform activity</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-gradient-to-br from-blue-600 to-cyan-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">Total Beats</p>
                <p className="text-3xl font-bold mt-2">{stats.totalBeats}</p>
              </div>
              <Music size={40} className="opacity-20" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-600 to-emerald-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium">Published</p>
                <p className="text-3xl font-bold mt-2">{stats.publishedBeats}</p>
              </div>
              <TrendingUp size={40} className="opacity-20" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm font-medium">Total Plays</p>
                <p className="text-3xl font-bold mt-2">{stats.totalPlays.toLocaleString()}</p>
              </div>
              <Eye size={40} className="opacity-20" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-yellow-600 to-orange-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-100 text-sm font-medium">Featured</p>
                <p className="text-3xl font-bold mt-2">{stats.featuredBeats}</p>
              </div>
              <Music size={40} className="opacity-20" />
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-white mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <a
              href="/manager/beats"
              className="flex items-center gap-3 p-4 bg-gray-700/50 hover:bg-gray-700 rounded-lg transition-colors group"
            >
              <div className="p-3 bg-blue-600 rounded-lg group-hover:bg-blue-500 transition-colors">
                <Music size={24} className="text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Manage Beats</h3>
                <p className="text-sm text-gray-400">Edit and update beat information</p>
              </div>
            </a>

            <a
              href="/manager/chat"
              className="flex items-center gap-3 p-4 bg-gray-700/50 hover:bg-gray-700 rounded-lg transition-colors group"
            >
              <div className="p-3 bg-cyan-600 rounded-lg group-hover:bg-cyan-500 transition-colors">
                <MessageSquare size={24} className="text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Chat</h3>
                <p className="text-sm text-gray-400">Communicate with team and artists</p>
              </div>
            </a>
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-blue-900/20 border border-blue-700 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-blue-300 mb-2">Manager Access</h3>
          <p className="text-blue-200 text-sm">
            As a manager, you have access to edit beats and communicate via chat.
            You can view all platform data but cannot delete or modify other settings.
          </p>
        </div>
      </div>
    </ManagerLayout>
  );
};

export default ManagerDashboard;
