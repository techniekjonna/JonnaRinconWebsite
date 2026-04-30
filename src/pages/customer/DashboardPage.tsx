import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { orderService } from '../../lib/firebase/services/orderService';
import { Order } from '../../lib/firebase/types';
import CustomerLayout from '../../components/customer/CustomerLayout';
import LoadingSpinner from '../../components/LoadingSpinner';
import { TrendingUp, DollarSign, ShoppingBag, Download, Home } from 'lucide-react';

const CustomerDashboard: React.FC = () => {
  const { user } = useAuth();
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalOrders: 0, totalSpent: 0, totalDownloads: 0 });

  useEffect(() => {
    if (!user) return;
    const loadDashboardData = async () => {
      try {
        const orders = await orderService.getOrdersByCustomer(user.email);
        setRecentOrders(orders.slice(0, 5));
        setStats({
          totalOrders: orders.length,
          totalSpent: orders.filter((o) => o.status === 'completed').reduce((sum, o) => sum + o.total, 0),
          totalDownloads: orders.filter((o) => o.status === 'completed').reduce((sum, o) => sum + o.items.length, 0),
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
    { name: 'Total Orders', value: stats.totalOrders, icon: ShoppingBag, change: stats.totalOrders > 0 ? `${stats.totalOrders} orders placed` : 'No orders yet' },
    { name: 'Total Spent', value: `\u20AC${stats.totalSpent.toFixed(2)}`, icon: DollarSign, change: stats.totalSpent > 0 ? 'On beats & licenses' : 'Start shopping' },
    { name: 'Total Downloads', value: stats.totalDownloads, icon: Download, change: `${stats.totalDownloads} beats owned` },
  ];

  if (loading) {
    return (
      <CustomerLayout>
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner />
        </div>
      </CustomerLayout>
    );
  }

  return (
    <CustomerLayout>
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">Dashboard</h1>
            <p className="text-sm text-white/30 mt-1">Welcome back, {user?.displayName || 'Customer'}!</p>
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
                    <p className="text-xs mt-1.5 text-white/25">{stat.change}</p>
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
            <h2 className="text-lg font-bold text-white">Recent Orders</h2>
            <Link to="/customer/orders" className="text-white/30 hover:text-white text-xs uppercase tracking-wider transition-colors">View All</Link>
          </div>
          {recentOrders.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-white/50 mb-1">No orders yet</p>
              <p className="text-white/25 text-sm mb-5">Start shopping to see your orders here</p>
              <Link to="/shop/beats" className="inline-block bg-white text-black px-5 py-2.5 rounded-2xl text-sm font-bold hover:bg-white/90 transition-all">
                Browse Beats
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between p-3.5 bg-white/[0.06] rounded-2xl hover:bg-white/[0.06] transition-all">
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium text-sm truncate">{order.orderNumber}</p>
                    <p className="text-xs text-white/25">{order.items.length} item(s) &middot; {order.createdAt?.toDate?.()?.toLocaleDateString() || 'N/A'}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-white font-semibold text-sm">{`\u20AC${order.total.toFixed(2)}`}</p>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider font-medium ${
                      order.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400' :
                      order.status === 'pending' ? 'bg-amber-500/10 text-amber-400' :
                      'bg-blue-500/10 text-blue-400'
                    }`}>{order.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Link to="/shop/beats" className="group bg-white/[0.08] border border-white/[0.06] hover:border-white/[0.12] rounded-3xl p-5 transition-all duration-300">
            <div className="w-10 h-10 rounded-2xl bg-purple-500/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <ShoppingBag size={18} className="text-purple-400" />
            </div>
            <h3 className="text-white font-semibold text-sm">Browse Beats</h3>
            <p className="text-white/25 text-xs mt-0.5">Find your next hit</p>
          </Link>
          <Link to="/customer/orders" className="group bg-white/[0.08] border border-white/[0.06] hover:border-white/[0.12] rounded-3xl p-5 transition-all duration-300">
            <div className="w-10 h-10 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <ShoppingBag size={18} className="text-blue-400" />
            </div>
            <h3 className="text-white font-semibold text-sm">My Orders</h3>
            <p className="text-white/25 text-xs mt-0.5">View order history</p>
          </Link>
          <Link to="/customer/downloads" className="group bg-white/[0.08] border border-white/[0.06] hover:border-white/[0.12] rounded-3xl p-5 transition-all duration-300">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Download size={18} className="text-emerald-400" />
            </div>
            <h3 className="text-white font-semibold text-sm">Downloads</h3>
            <p className="text-white/25 text-xs mt-0.5">Access your beats</p>
          </Link>
          <Link to="/customer/profile" className="group bg-white/[0.08] border border-white/[0.06] hover:border-white/[0.12] rounded-3xl p-5 transition-all duration-300">
            <div className="w-10 h-10 rounded-2xl bg-orange-500/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <TrendingUp size={18} className="text-orange-400" />
            </div>
            <h3 className="text-white font-semibold text-sm">Profile</h3>
            <p className="text-white/25 text-xs mt-0.5">Manage account</p>
          </Link>
        </div>
      </div>
    </CustomerLayout>
  );
};

export default CustomerDashboard;
