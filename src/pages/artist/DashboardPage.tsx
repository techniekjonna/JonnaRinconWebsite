import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { collaborationService } from '../../lib/firebase/services/collaborationService';
import { orderService } from '../../lib/firebase/services/orderService';
import { Collaboration, Order } from '../../lib/firebase/types';
import ArtistLayout from '../../components/artist/ArtistLayout';
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

        const activeCollabs = userCollabs.filter(
          (c) => c.status === 'in_progress' || c.status === 'agreed' || c.status === 'signed'
        ).length;

        const completedCollabs = userCollabs.filter((c) => c.status === 'completed').length;

        const beatsPurchased = orderData
          .filter((o) => o.status === 'completed')
          .reduce((sum, o) => sum + o.items.length, 0);

        const totalSpent = orderData
          .filter((o) => o.status === 'completed')
          .reduce((sum, o) => sum + o.total, 0);

        setStats({
          activeCollaborations: activeCollabs,
          completedCollaborations: completedCollabs,
          beatsPurchased,
          totalSpent,
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
    {
      name: 'Active Collaborations',
      value: stats.activeCollaborations,
      icon: Handshake,
      change: `${stats.completedCollaborations} completed`,
      changeType: 'positive',
    },
    {
      name: 'Beats Purchased',
      value: stats.beatsPurchased,
      icon: Music,
      change: stats.beatsPurchased > 0 ? 'From Jonna Rincon' : 'Browse beats',
      changeType: 'neutral',
    },
    {
      name: 'Total Spent',
      value: `€${stats.totalSpent.toFixed(2)}`,
      icon: DollarSign,
      change: 'On beats & licenses',
      changeType: 'neutral',
    },
  ];

  if (loading) {
    return (
      <ArtistLayout>
        <div className="flex justify-center items-center h-64">
          <div className="text-xl text-white">Loading...</div>
        </div>
      </ArtistLayout>
    );
  }

  return (
    <ArtistLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Artist Dashboard</h1>
            <p className="text-gray-400 mt-2">Welcome back, {user?.displayName || 'Artist'}!</p>
          </div>
          <Link
            to="/"
            className="bg-gray-800 hover:bg-gray-700 border border-gray-700 px-4 py-2 rounded-lg text-white font-medium transition-all flex items-center gap-2"
          >
            <Home size={18} />
            Back to Home
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {statsCards.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.name}
                className="bg-gray-800 border border-gray-700 rounded-xl p-6 hover:border-orange-500/50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">{stat.name}</p>
                    <p className="text-3xl font-bold text-white mt-2">{stat.value}</p>
                    <p
                      className={`text-sm mt-2 ${
                        stat.changeType === 'positive' ? 'text-green-400' : 'text-gray-400'
                      }`}
                    >
                      {stat.change}
                    </p>
                  </div>
                  <div className="bg-gradient-to-r from-orange-600 to-red-600 p-4 rounded-xl">
                    <Icon size={32} className="text-white" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Recent Collaborations */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-white">Active Collaborations</h2>
            <Link to="/artist/collaborations" className="text-orange-400 hover:text-orange-300 text-sm">
              View All →
            </Link>
          </div>

          {collaborations.filter((c) => c.status === 'in_progress' || c.status === 'signed').length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">🤝</div>
              <p className="text-xl text-gray-300 mb-2">No active collaborations</p>
              <p className="text-gray-400 mb-6">Check your collaboration page for inquiries</p>
              <Link
                to="/artist/collaborations"
                className="inline-block bg-gradient-to-r from-orange-600 to-red-600 px-6 py-3 rounded-lg text-white font-medium hover:from-orange-700 hover:to-red-700 transition-all"
              >
                View Collaborations
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {collaborations
                .filter((c) => c.status === 'in_progress' || c.status === 'signed')
                .map((collab) => (
                  <div
                    key={collab.id}
                    className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex-1">
                      <p className="text-white font-medium">{collab.title}</p>
                      <p className="text-sm text-gray-400 capitalize">
                        {collab.type} • {collab.status.replace('_', ' ')}
                      </p>
                    </div>
                    <div className="text-right">
                      {collab.budget && (
                        <p className="text-white font-semibold">€{collab.budget.toFixed(2)}</p>
                      )}
                      {collab.deadline && (
                        <p className="text-xs text-yellow-400">
                          Due: {collab.deadline.toDate?.()?.toLocaleDateString() || 'N/A'}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            to="/artist/collaborations"
            className="bg-gradient-to-r from-purple-600 to-pink-600 p-6 rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all"
          >
            <Handshake size={32} className="text-white mb-3" />
            <h3 className="text-white font-semibold">Collaborations</h3>
            <p className="text-purple-100 text-sm mt-1">Manage projects</p>
          </Link>

          <Link
            to="/artist/beats"
            className="bg-gradient-to-r from-blue-600 to-cyan-600 p-6 rounded-xl hover:from-blue-700 hover:to-cyan-700 transition-all"
          >
            <Music size={32} className="text-white mb-3" />
            <h3 className="text-white font-semibold">Browse Beats</h3>
            <p className="text-blue-100 text-sm mt-1">Shop from Jonna</p>
          </Link>

          <Link
            to="/artist/orders"
            className="bg-gradient-to-r from-green-600 to-teal-600 p-6 rounded-xl hover:from-green-700 hover:to-teal-700 transition-all"
          >
            <DollarSign size={32} className="text-white mb-3" />
            <h3 className="text-white font-semibold">My Purchases</h3>
            <p className="text-green-100 text-sm mt-1">View orders</p>
          </Link>

          <Link
            to="/artist/profile"
            className="bg-gradient-to-r from-orange-600 to-red-600 p-6 rounded-xl hover:from-orange-700 hover:to-red-700 transition-all"
          >
            <TrendingUp size={32} className="text-white mb-3" />
            <h3 className="text-white font-semibold">Profile</h3>
            <p className="text-orange-100 text-sm mt-1">Manage account</p>
          </Link>
        </div>

        {/* Info Banner */}
        <div className="bg-orange-900/30 border border-orange-700 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <div className="text-3xl">🎤</div>
            <div>
              <h3 className="font-bold text-lg text-white mb-2">Collaborate with Jonna Rincon</h3>
              <p className="text-gray-300 mb-4">
                Work together on exclusive tracks, remixes, and productions. Get access to premium beats
                and collaborate on exciting projects.
              </p>
              <div className="flex gap-4">
                <Link
                  to="/artist/collaborations"
                  className="bg-gradient-to-r from-orange-600 to-red-600 px-6 py-2 rounded-lg text-white font-medium hover:from-orange-700 hover:to-red-700 transition-all"
                >
                  View Collaborations
                </Link>
                <Link
                  to="/artist/beats"
                  className="bg-gray-700 hover:bg-gray-600 px-6 py-2 rounded-lg text-white font-medium transition-all"
                >
                  Browse Beats
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ArtistLayout>
  );
};

export default ArtistDashboard;
