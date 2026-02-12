import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { orderService } from '../../lib/firebase/services/orderService';
import { Order } from '../../lib/firebase/types';
import CustomerLayout from '../../components/customer/CustomerLayout';
import { TrendingUp, DollarSign, ShoppingBag, Download, Home } from 'lucide-react';

const CustomerDashboard: React.FC = () => {
  const { user } = useAuth();
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalSpent: 0,
    totalDownloads: 0,
  });

  useEffect(() => {
    if (!user) return;

    const loadDashboardData = async () => {
      try {
        const orders = await orderService.getOrdersByCustomer(user.email);
        const recentFive = orders.slice(0, 5);
        setRecentOrders(recentFive);

        const totalSpent = orders
          .filter((o) => o.status === 'completed')
          .reduce((sum, o) => sum + o.total, 0);

        const totalDownloads = orders
          .filter((o) => o.status === 'completed')
          .reduce((sum, o) => sum + o.items.length, 0);

        setStats({
          totalOrders: orders.length,
          totalSpent,
          totalDownloads,
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
      name: 'Total Orders',
      value: stats.totalOrders,
      icon: ShoppingBag,
      change: stats.totalOrders > 0 ? `${stats.totalOrders} orders placed` : 'No orders yet',
      changeType: 'neutral',
    },
    {
      name: 'Total Spent',
      value: `€${stats.totalSpent.toFixed(2)}`,
      icon: DollarSign,
      change: stats.totalSpent > 0 ? 'On beats & licenses' : 'Start shopping',
      changeType: 'neutral',
    },
    {
      name: 'Total Downloads',
      value: stats.totalDownloads,
      icon: Download,
      change: `${stats.totalDownloads} beats owned`,
      changeType: 'positive',
    },
  ];

  if (loading) {
    return (
      <CustomerLayout>
        <div className="flex justify-center items-center h-64">
          <div className="text-xl text-white">Loading...</div>
        </div>
      </CustomerLayout>
    );
  }

  return (
    <CustomerLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Dashboard</h1>
            <p className="text-gray-400 mt-2">Welcome back, {user?.displayName || 'Customer'}!</p>
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
                className="bg-gray-800 border border-gray-700 rounded-xl p-6 hover:border-blue-500/50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">{stat.name}</p>
                    <p className="text-3xl font-bold text-white mt-2">{stat.value}</p>
                    <p className="text-sm mt-2 text-gray-400">{stat.change}</p>
                  </div>
                  <div className="bg-gradient-to-r from-blue-600 to-cyan-600 p-4 rounded-xl">
                    <Icon size={32} className="text-white" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Recent Orders */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-white">Recent Orders</h2>
            <Link to="/customer/orders" className="text-blue-400 hover:text-blue-300 text-sm">
              View All →
            </Link>
          </div>

          {recentOrders.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">🛒</div>
              <p className="text-xl text-gray-300 mb-2">No orders yet</p>
              <p className="text-gray-400 mb-6">Start shopping to see your orders here</p>
              <Link
                to="/shop/beats"
                className="inline-block bg-gradient-to-r from-blue-600 to-cyan-600 px-6 py-3 rounded-lg text-white font-medium hover:from-blue-700 hover:to-cyan-700 transition-all"
              >
                Browse Beats
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {recentOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  <div className="flex-1">
                    <p className="text-white font-medium">{order.orderNumber}</p>
                    <p className="text-sm text-gray-400">
                      {order.items.length} item(s) • {order.createdAt?.toDate?.()?.toLocaleDateString() || 'N/A'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-semibold">€{order.total.toFixed(2)}</p>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        order.status === 'completed'
                          ? 'bg-green-500/20 text-green-400'
                          : order.status === 'pending'
                          ? 'bg-yellow-500/20 text-yellow-400'
                          : 'bg-blue-500/20 text-blue-400'
                      }`}
                    >
                      {order.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            to="/shop/beats"
            className="bg-gradient-to-r from-purple-600 to-pink-600 p-6 rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all"
          >
            <ShoppingBag size={32} className="text-white mb-3" />
            <h3 className="text-white font-semibold">Browse Beats</h3>
            <p className="text-purple-100 text-sm mt-1">Find your next hit</p>
          </Link>

          <Link
            to="/customer/orders"
            className="bg-gradient-to-r from-blue-600 to-cyan-600 p-6 rounded-xl hover:from-blue-700 hover:to-cyan-700 transition-all"
          >
            <ShoppingBag size={32} className="text-white mb-3" />
            <h3 className="text-white font-semibold">My Orders</h3>
            <p className="text-blue-100 text-sm mt-1">View order history</p>
          </Link>

          <Link
            to="/customer/downloads"
            className="bg-gradient-to-r from-green-600 to-teal-600 p-6 rounded-xl hover:from-green-700 hover:to-teal-700 transition-all"
          >
            <Download size={32} className="text-white mb-3" />
            <h3 className="text-white font-semibold">Downloads</h3>
            <p className="text-green-100 text-sm mt-1">Access your beats</p>
          </Link>

          <Link
            to="/customer/profile"
            className="bg-gradient-to-r from-orange-600 to-red-600 p-6 rounded-xl hover:from-orange-700 hover:to-red-700 transition-all"
          >
            <TrendingUp size={32} className="text-white mb-3" />
            <h3 className="text-white font-semibold">Profile</h3>
            <p className="text-orange-100 text-sm mt-1">Manage account</p>
          </Link>
        </div>
      </div>
    </CustomerLayout>
  );
};

export default CustomerDashboard;
