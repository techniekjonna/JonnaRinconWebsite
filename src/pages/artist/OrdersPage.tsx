import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { orderService } from '../../lib/firebase/services/orderService';
import { Order } from '../../lib/firebase/types';
import ArtistLayout from '../../components/artist/ArtistLayout';
import LoadingSpinner from '../../components/LoadingSpinner';
import { Package, Download } from 'lucide-react';

const ArtistOrders: React.FC = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'completed' | 'processing' | 'pending'>('all');

  useEffect(() => {
    if (!user) return;

    const loadOrders = async () => {
      try {
        const allOrders = await orderService.getOrdersByCustomer(user.email);
        setOrders(allOrders);
      } catch (error) {
        console.error('Failed to load orders:', error);
      } finally {
        setLoading(false);
      }
    };

    loadOrders();
  }, [user]);

  const filteredOrders = orders.filter((order) => {
    if (filter === 'all') return true;
    return order.status === filter;
  });

  if (loading) {
    return (
      <ArtistLayout>
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner text="Loading orders..." />
        </div>
      </ArtistLayout>
    );
  }

  return (
    <ArtistLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white">My Purchases</h1>
          <p className="text-white/40 mt-2">View your beat purchases and licenses</p>
        </div>

        <div className="bg-white/[0.08] border border-white/[0.06] rounded-xl p-4">
          <div className="flex gap-4">
            {(['all', 'completed', 'processing', 'pending'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded-lg capitalize transition ${
                  filter === status
                    ? 'bg-gradient-to-r from-orange-600 to-red-600 text-white'
                    : 'text-white/40 hover:bg-white/[0.06] hover:text-white'
                }`}
              >
                {status}
                <span className="ml-2 text-xs">
                  ({status === 'all' ? orders.length : orders.filter((o) => o.status === status).length})
                </span>
              </button>
            ))}
          </div>
        </div>

        {filteredOrders.length === 0 ? (
          <div className="bg-white/[0.08] border border-white/[0.06] rounded-xl p-12 text-center">
            <Package size={64} className="mx-auto mb-4 text-white/20" />
            <p className="text-xl text-white mb-2">No purchases found</p>
            <p className="text-white/40 mb-6">
              {filter === 'all' ? "You haven't purchased any beats yet" : `No ${filter} orders`}
            </p>
            <Link
              to="/artist/beats"
              className="inline-block bg-gradient-to-r from-orange-600 to-red-600 px-6 py-3 rounded-lg text-white font-medium hover:from-orange-700 hover:to-red-700 transition-all"
            >
              Browse Beats
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => (
              <div key={order.id} className="bg-white/[0.08] border border-white/[0.06] rounded-xl overflow-hidden">
                <div className="bg-white/[0.06] p-4 flex justify-between items-center">
                  <div>
                    <div className="font-semibold text-lg text-white mb-1">{order.orderNumber}</div>
                    <div className="text-sm text-white/40">
                      Placed on {order.createdAt?.toDate?.()?.toLocaleDateString() || 'N/A'}
                    </div>
                  </div>

                  <div className="text-right">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-semibold mb-2 ${
                        order.status === 'completed'
                          ? 'bg-green-500/20 text-green-400'
                          : order.status === 'processing'
                          ? 'bg-blue-500/20 text-blue-400'
                          : order.status === 'pending'
                          ? 'bg-yellow-500/20 text-yellow-400'
                          : 'bg-red-500/20 text-red-400'
                      }`}
                    >
                      {order.status}
                    </span>
                    <div className="font-bold text-white">€{order.total.toFixed(2)}</div>
                  </div>
                </div>

                <div className="p-4">
                  <div className="space-y-3">
                    {order.items.map((item, index) => (
                      <div key={index} className="flex items-center gap-4">
                        <img
                          src={item.artworkUrl || '/placeholder-beat.png'}
                          alt={item.beatTitle}
                          className="w-16 h-16 rounded object-cover"
                        />
                        <div className="flex-1">
                          <div className="font-semibold text-white">{item.beatTitle}</div>
                          <div className="text-sm text-white/40 capitalize">
                            {item.licenseType} License
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-white">€{item.price.toFixed(2)}</div>
                          {order.status === 'completed' && order.downloadLinks?.[item.beatId] && (
                            <a
                              href={order.downloadLinks[item.beatId]}
                              className="inline-flex items-center gap-1 text-sm text-orange-400 hover:text-orange-300 mt-1"
                              download
                            >
                              <Download size={14} />
                              Download
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </ArtistLayout>
  );
};

export default ArtistOrders;
