import React from 'react';
import { Link } from 'react-router-dom';
import ManagerLayout from '../../components/manager/ManagerLayout';
import { Music, MessageSquare, TrendingUp, Eye } from 'lucide-react';
import { useBeats } from '../../hooks/useBeats';

const ManagerDashboard: React.FC = () => {
  const { beats, loading } = useBeats();

  const stats = [
    { name: 'Total Beats', value: beats.length, icon: Music, color: 'blue' },
    { name: 'Published', value: beats.filter(b => b.status === 'published').length, icon: TrendingUp, color: 'emerald' },
    { name: 'Total Plays', value: beats.reduce((sum, b) => sum + b.plays, 0).toLocaleString(), icon: Eye, color: 'purple' },
    { name: 'Featured', value: beats.filter(b => b.featured).length, icon: Music, color: 'amber' },
  ];

  const colorMap: Record<string, string> = {
    blue: 'bg-blue-500/10 text-blue-400',
    emerald: 'bg-emerald-500/10 text-emerald-400',
    purple: 'bg-purple-500/10 text-purple-400',
    amber: 'bg-amber-500/10 text-amber-400',
  };

  return (
    <ManagerLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Manager Dashboard</h1>
          <p className="text-sm text-white/30 mt-1">Overview of beats and platform activity</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.name} className="bg-white/[0.08] backdrop-blur-sm border border-white/[0.06] rounded-3xl p-5 sm:p-6 hover:border-white/[0.12] transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-white/30 uppercase tracking-wider">{stat.name}</p>
                    <p className="text-2xl sm:text-3xl font-bold text-white mt-1.5">{stat.value}</p>
                  </div>
                  <div className={`w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 ${colorMap[stat.color]?.split(' ')[0] || 'bg-white/[0.06]'}`}>
                    <Icon size={20} className={colorMap[stat.color]?.split(' ')[1] || 'text-white/40'} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="bg-white/[0.08] backdrop-blur-sm border border-white/[0.06] rounded-3xl p-5 sm:p-6">
          <h2 className="text-lg font-bold text-white mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Link to="/manager/beats" className="group flex items-center gap-4 p-4 bg-white/[0.06] hover:bg-white/[0.06] rounded-2xl transition-all">
              <div className="w-11 h-11 rounded-2xl bg-blue-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Music size={18} className="text-blue-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white text-sm">Manage Beats</h3>
                <p className="text-xs text-white/25">Edit and update beat information</p>
              </div>
            </Link>
            <Link to="/manager/chat" className="group flex items-center gap-4 p-4 bg-white/[0.06] hover:bg-white/[0.06] rounded-2xl transition-all">
              <div className="w-11 h-11 rounded-2xl bg-cyan-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                <MessageSquare size={18} className="text-cyan-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white text-sm">Chat</h3>
                <p className="text-xs text-white/25">Communicate with team and artists</p>
              </div>
            </Link>
          </div>
        </div>

        <div className="bg-white/[0.08] border border-white/[0.06] rounded-3xl p-5 sm:p-6">
          <h3 className="text-sm font-semibold text-white/50 mb-1.5 uppercase tracking-wider">Manager Access</h3>
          <p className="text-white/30 text-sm">
            As a manager, you have access to edit beats and communicate via chat.
            You can view all platform data but cannot delete or modify other settings.
          </p>
        </div>
      </div>
    </ManagerLayout>
  );
};

export default ManagerDashboard;
