import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout';
import { useOrderStatistics, useOrders } from '../../hooks/useOrders';
import { useOrderNotifications } from '../../hooks/useOrderNotifications';
import { useCollaborationStats } from '../../hooks/useCollaborations';
import { beatService, orderService } from '../../lib/firebase/services';
import { TrendingUp, DollarSign, ShoppingBag, Music, Handshake, Users, Bell, ArrowRight } from 'lucide-react';

const TYPE_LABELS: Record<string, string> = {
  beat: 'Beat', track: 'Track', remix: 'Remix', edit: 'Edit',
  art: 'Art', merchandise: 'Merch', service: 'Service',
};
const TYPE_COLORS: Record<string, string> = {
  beat: 'bg-purple-500/20 text-purple-400',
  track: 'bg-pink-500/20 text-pink-400',
  remix: 'bg-rose-500/20 text-rose-400',
  edit: 'bg-fuchsia-500/20 text-fuchsia-400',
  art: 'bg-amber-500/20 text-amber-400',
  merchandise: 'bg-emerald-500/20 text-emerald-400',
  service: 'bg-cyan-500/20 text-cyan-400',
};

const DashboardPage: React.FC = () => {
  const { stats: orderStats } = useOrderStatistics();
  const { stats: collabStats } = useCollaborationStats();
  const { pendingCount, newSinceLastSeen } = useOrderNotifications();
  const { orders } = useOrders();
  const [totalBeats, setTotalBeats] = useState(0);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);

  // Orders needing action (pending/processing), sorted oldest first
  const actionOrders = React.useMemo(
    () => orders
      .filter((o) => o.status === 'pending' || o.status === 'processing')
      .sort((a, b) => {
        const aMs = (a.createdAt as any)?.seconds ?? 0;
        const bMs = (b.createdAt as any)?.seconds ?? 0;
        return aMs - bMs;
      })
      .slice(0, 5),
    [orders]
  );

  useEffect(() => {
    const fetchData = async () => {
      const beats = await beatService.getAllBeats();
      setTotalBeats(beats.data.length);
      const recentOrdrs = await orderService.getRecentOrders(5);
      setRecentOrders(recentOrdrs);
    };
    fetchData();
  }, []);

  const stats = [
    { name: 'Total Revenue', value: `\u20AC${orderStats.totalRevenue.toFixed(2)}`, icon: DollarSign, change: '+12.5%', changeType: 'positive' },
    { name: 'Total Orders', value: orderStats.totalOrders, icon: ShoppingBag, change: `${orderStats.pendingOrders} pending`, changeType: 'neutral' },
    { name: 'Total Beats', value: totalBeats, icon: Music, change: 'In catalog', changeType: 'neutral' },
    { name: 'Active Collabs', value: collabStats.active, icon: Handshake, change: `${collabStats.completed} completed`, changeType: 'positive' },
    { name: 'Avg Order Value', value: `\u20AC${orderStats.averageOrderValue.toFixed(2)}`, icon: TrendingUp, change: '+8.2%', changeType: 'positive' },
    { name: 'Pending Revenue', value: `\u20AC${collabStats.pendingRevenue.toFixed(2)}`, icon: DollarSign, change: 'From collaborations', changeType: 'neutral' },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Dashboard</h1>
          <p className="text-sm text-white/30 mt-1">Welcome back! Here's what's happening today.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.name} className="bg-white/[0.08] backdrop-blur-sm border border-white/[0.06] rounded-3xl p-5 sm:p-6 hover:border-white/[0.12] transition-all duration-300">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-white/30 uppercase tracking-wider">{stat.name}</p>
                    <p className="text-2xl sm:text-3xl font-bold text-white mt-1.5">{stat.value}</p>
                    <p className={`text-xs mt-1.5 ${stat.changeType === 'positive' ? 'text-emerald-400' : stat.changeType === 'negative' ? 'text-red-400' : 'text-white/25'}`}>
                      {stat.change}
                    </p>
                  </div>
                  <div className="w-11 h-11 rounded-2xl bg-white/[0.06] flex items-center justify-center flex-shrink-0">
                    <Icon size={20} className="text-white/40" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Notifications / Actie Vereist */}
        {(newSinceLastSeen > 0 || actionOrders.length > 0) && (
          <div className={`border rounded-3xl p-5 sm:p-6 ${newSinceLastSeen > 0 ? 'bg-amber-500/[0.06] border-amber-500/20' : 'bg-white/[0.08] border-white/[0.06]'}`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-2xl flex items-center justify-center ${newSinceLastSeen > 0 ? 'bg-amber-500/20' : 'bg-white/[0.06]'}`}>
                  <Bell size={16} className={newSinceLastSeen > 0 ? 'text-amber-400' : 'text-white/40'} />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">
                    {newSinceLastSeen > 0
                      ? `${newSinceLastSeen} nieuwe bestelling${newSinceLastSeen !== 1 ? 'en' : ''}`
                      : 'Actie vereist'}
                  </h2>
                  {pendingCount > 0 && (
                    <p className="text-xs text-white/30">{pendingCount} bestellingen wachten op verwerking</p>
                  )}
                </div>
              </div>
              <Link
                to="/admin/orders"
                className="flex items-center gap-1 text-xs text-white/40 hover:text-white/80 transition-colors"
              >
                Alles bekijken <ArrowRight size={12} />
              </Link>
            </div>
            <div className="space-y-2">
              {actionOrders.map((order) => {
                const primaryType = order.items?.[0]?.productType ?? 'beat';
                const typeColor = TYPE_COLORS[primaryType] ?? 'bg-white/[0.06] text-white/40';
                const typeLabel = TYPE_LABELS[primaryType] ?? primaryType;
                const createdAt = (order.createdAt as any)?.seconds
                  ? new Date((order.createdAt as any).seconds * 1000).toLocaleDateString('nl-NL', { day: '2-digit', month: '2-digit' })
                  : '';
                return (
                  <Link
                    key={order.id}
                    to="/admin/orders"
                    className="flex items-center gap-3 p-3 bg-white/[0.04] hover:bg-white/[0.07] rounded-2xl transition-all"
                  >
                    <span className={`text-[10px] px-2 py-0.5 rounded-full flex-shrink-0 ${typeColor}`}>{typeLabel}</span>
                    <p className="text-sm text-white font-mono flex-shrink-0">{order.orderNumber}</p>
                    <p className="text-xs text-white/30 truncate flex-1">{order.customerEmail}</p>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full flex-shrink-0 ${
                      order.status === 'pending' ? 'bg-amber-500/20 text-amber-400' : 'bg-blue-500/20 text-blue-400'
                    }`}>{order.status}</span>
                    <p className="text-sm font-semibold text-white flex-shrink-0">€{order.total.toFixed(2)}</p>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Recent Orders */}
        <div className="bg-white/[0.08] backdrop-blur-sm border border-white/[0.06] rounded-3xl p-5 sm:p-6">
          <h2 className="text-lg font-bold text-white mb-4">Recent Orders</h2>
          <div className="space-y-2">
            {recentOrders.length === 0 ? (
              <p className="text-white/30 text-center py-8 text-sm">No orders yet</p>
            ) : (
              recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between p-3.5 bg-white/[0.06] rounded-2xl hover:bg-white/[0.06] transition-all gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium text-sm truncate">{order.orderNumber}</p>
                    <p className="text-xs text-white/25 truncate">{order.customerEmail}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-white font-semibold text-sm">{`\u20AC${order.total.toFixed(2)}`}</p>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider font-medium ${
                      order.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400' :
                      order.status === 'pending' ? 'bg-amber-500/10 text-amber-400' :
                      'bg-blue-500/10 text-blue-400'
                    }`}>
                      {order.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Link to="/admin/beats" className="group bg-white/[0.08] border border-white/[0.06] hover:border-white/[0.12] rounded-3xl p-5 transition-all duration-300">
            <div className="w-10 h-10 rounded-2xl bg-purple-500/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Music size={18} className="text-purple-400" />
            </div>
            <h3 className="text-white font-semibold text-sm">Manage Beats</h3>
            <p className="text-white/25 text-xs mt-0.5">Add or edit beats</p>
          </Link>
          <Link to="/admin/orders" className="group bg-white/[0.08] border border-white/[0.06] hover:border-white/[0.12] rounded-3xl p-5 transition-all duration-300">
            <div className="w-10 h-10 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <ShoppingBag size={18} className="text-blue-400" />
            </div>
            <h3 className="text-white font-semibold text-sm">View Orders</h3>
            <p className="text-white/25 text-xs mt-0.5">Process orders</p>
          </Link>
          <Link to="/admin/content" className="group bg-white/[0.08] border border-white/[0.06] hover:border-white/[0.12] rounded-3xl p-5 transition-all duration-300">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Users size={18} className="text-emerald-400" />
            </div>
            <h3 className="text-white font-semibold text-sm">Content</h3>
            <p className="text-white/25 text-xs mt-0.5">Manage content</p>
          </Link>
          <Link to="/admin/collaborations" className="group bg-white/[0.08] border border-white/[0.06] hover:border-white/[0.12] rounded-3xl p-5 transition-all duration-300">
            <div className="w-10 h-10 rounded-2xl bg-orange-500/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Handshake size={18} className="text-orange-400" />
            </div>
            <h3 className="text-white font-semibold text-sm">Collaborations</h3>
            <p className="text-white/25 text-xs mt-0.5">Manage deals</p>
          </Link>
        </div>
      </div>
    </AdminLayout>
  );
};

export default DashboardPage;
