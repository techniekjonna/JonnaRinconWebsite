import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { collaborationService } from '../../lib/firebase/services/collaborationService';
import { orderService } from '../../lib/firebase/services/orderService';
import { Collaboration, Order } from '../../lib/firebase/types';
import ArtistLayout from '../../components/artist/ArtistLayout';
import LoadingSpinner from '../../components/LoadingSpinner';
import { Handshake, Music, DollarSign, TrendingUp, Home } from 'lucide-react';

const ArtistDashboard: React.FC = () => {
  const { user } = useAuth();
  const [collaborations, setCollaborations] = useState<Collaboration[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    activeCollaborations: 0,
    completedCollaborations: 0,
    beatsPurchased: 0,
    totalSpent: 0,
  });

  useEffect(() => {
    if (!user) return;
    const loadDashboardData = async () => {
      try {
        const collabData = await collaborationService.getAll();
        const userCollabs = collabData.filter(
          (c) => c.clientEmail === user.email || c.assignedTo === user.uid
        );
        setCollaborations(userCollabs.slice(0, 5));
        const orderData = await orderService.getOrdersByCustomer(user.email);
        setOrders(orderData);
        setStats({
          activeCollaborations: userCollabs.filter((c) => c.status === 'in_progress' || c.status === 'agreed' || c.status === 'signed').length,
          completedCollaborations: userCollabs.filter((c) => c.status === 'completed').length,
          beatsPurchased: orderData.filter((o) => o.status === 'completed').reduce((sum, o) => sum + o.items.length, 0),
          totalSpent: orderData.filter((o) => o.status === 'completed').reduce((sum, o) => sum + o.total, 0),
        });
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    loadDashboardData();
  }, [user]);

  const statsCards = [
    { name: 'Active Collabs', value: stats.activeCollaborations, icon: Handshake, change: `${stats.completedCollaborations} completed`, changeType: 'positive' },
    { name: 'Beats Purchased', value: stats.beatsPurchased, icon: Music, change: stats.beatsPurchased > 0 ? 'From Jonna Rincon' : 'Browse beats', changeType: 'neutral' },
    { name: 'Total Spent', value: `\u20AC${stats.totalSpent.toFixed(2)}`, icon: DollarSign, change: 'On beats & licenses', changeType: 'neutral' },
  ];

  if (loading) {
    return (
      <ArtistLayout>
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner />
        </div>
      </ArtistLayout>
    );
  }

  return (
    <ArtistLayout>
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">Artist Dashboard</h1>
            <p className="text-sm text-white/30 mt-1">Welcome back, {user?.displayName || 'Artist'}!</p>
          </div>
          <Link to="/" className="bg-white/[0.08] hover:bg-white/[0.08] border border-white/[0.06] px-4 py-2 rounded-2xl text-white/80 font-medium transition-all flex items-center gap-2 text-sm flex-shrink-0">
            <Home size={16} />
            <span className="hidden sm:inline">Home</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
          {statsCards.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.name} className="bg-white/[0.08] backdrop-blur-sm border border-white/[0.06] rounded-3xl p-5 sm:p-6 hover:border-white/[0.12] transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-white/30 uppercase tracking-wider">{stat.name}</p>
                    <p className="text-2xl sm:text-3xl font-bold text-white mt-1.5">{stat.value}</p>
                    <p className={`text-xs mt-1.5 ${stat.changeType === 'positive' ? 'text-emerald-400' : 'text-white/25'}`}>{stat.change}</p>
                  </div>
                  <div className="w-11 h-11 rounded-2xl bg-white/[0.06] flex items-center justify-center flex-shrink-0">
                    <Icon size={20} className="text-white/40" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="bg-white/[0.08] backdrop-blur-sm border border-white/[0.06] rounded-3xl p-5 sm:p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-white">Active Collaborations</h2>
            <Link to="/artist/collaborations" className="text-white/30 hover:text-white text-xs uppercase tracking-wider transition-colors">View All</Link>
          </div>
          {collaborations.filter((c) => c.status === 'in_progress' || c.status === 'signed').length === 0 ? (
            <div className="text-center py-10">
              <p className="text-white/50 mb-1">No active collaborations</p>
              <p className="text-white/25 text-sm mb-5">Check your collaboration page for inquiries</p>
              <Link to="/artist/collaborations" className="inline-block bg-white/[0.06] hover:bg-white/[0.10] border border-white/[0.06] px-5 py-2.5 rounded-2xl text-white text-sm font-medium transition-all">
                View Collaborations
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {collaborations.filter((c) => c.status === 'in_progress' || c.status === 'signed').map((collab) => (
                <div key={collab.id} className="flex items-center justify-between p-3.5 bg-white/[0.06] rounded-2xl hover:bg-white/[0.06] transition-all">
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium text-sm">{collab.title}</p>
                    <p className="text-xs text-white/25 capitalize">{collab.type} &middot; {collab.status.replace('_', ' ')}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    {collab.budget && <p className="text-white font-semibold text-sm">{`\u20AC${collab.budget.toFixed(2)}`}</p>}
                    {collab.deadline && <p className="text-[10px] text-amber-400">Due: {collab.deadline.toDate?.()?.toLocaleDateString() || 'N/A'}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Link to="/artist/collaborations" className="group bg-white/[0.08] border border-white/[0.06] hover:border-white/[0.12] rounded-3xl p-5 transition-all duration-300">
            <div className="w-10 h-10 rounded-2xl bg-purple-500/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Handshake size={18} className="text-purple-400" />
            </div>
            <h3 className="text-white font-semibold text-sm">Collaborations</h3>
            <p className="text-white/25 text-xs mt-0.5">Manage projects</p>
          </Link>
          <Link to="/artist/beats" className="group bg-white/[0.08] border border-white/[0.06] hover:border-white/[0.12] rounded-3xl p-5 transition-all duration-300">
            <div className="w-10 h-10 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Music size={18} className="text-blue-400" />
            </div>
            <h3 className="text-white font-semibold text-sm">Browse Beats</h3>
            <p className="text-white/25 text-xs mt-0.5">Shop from Jonna</p>
          </Link>
          <Link to="/artist/orders" className="group bg-white/[0.08] border border-white/[0.06] hover:border-white/[0.12] rounded-3xl p-5 transition-all duration-300">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <DollarSign size={18} className="text-emerald-400" />
            </div>
            <h3 className="text-white font-semibold text-sm">My Purchases</h3>
            <p className="text-white/25 text-xs mt-0.5">View orders</p>
          </Link>
          <Link to="/artist/profile" className="group bg-white/[0.08] border border-white/[0.06] hover:border-white/[0.12] rounded-3xl p-5 transition-all duration-300">
            <div className="w-10 h-10 rounded-2xl bg-orange-500/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <TrendingUp size={18} className="text-orange-400" />
            </div>
            <h3 className="text-white font-semibold text-sm">Profile</h3>
            <p className="text-white/25 text-xs mt-0.5">Manage account</p>
          </Link>
        </div>

        <div className="bg-white/[0.08] border border-white/[0.06] rounded-3xl p-6">
          <h3 className="font-bold text-white mb-2">Collaborate with Jonna Rincon</h3>
          <p className="text-white/30 text-sm mb-4">
            Work together on exclusive tracks, remixes, and productions. Get access to premium beats
            and collaborate on exciting projects.
          </p>
          <div className="flex gap-3">
            <Link to="/artist/collaborations" className="bg-white text-black px-5 py-2 rounded-2xl text-sm font-bold hover:bg-white/90 transition-all">
              View Collaborations
            </Link>
            <Link to="/artist/beats" className="bg-white/[0.06] hover:bg-white/[0.10] px-5 py-2 rounded-2xl text-white text-sm font-medium transition-all">
              Browse Beats
            </Link>
          </div>
        </div>
      </div>
    </ArtistLayout>
  );
};

export default ArtistDashboard;
