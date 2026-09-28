import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useT } from '../../contexts/LanguageContext';
import { orderService } from '../../lib/firebase/services/orderService';
import { deliverableService } from '../../lib/firebase/services/deliverableService';
import { Order, OrderItem, ClientDeliverable } from '../../lib/firebase/types';
import CustomerLayout from '../../components/customer/CustomerLayout';
import LoadingSpinner from '../../components/LoadingSpinner';
import { Download, FileText, Mail, Music2 } from 'lucide-react';

function formatFileSize(bytes?: number): string {
  if (!bytes || bytes <= 0) return '';
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }
  return `${size.toFixed(size >= 10 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

interface DownloadableItem extends OrderItem {
  orderId: string;
  orderNumber: string;
  downloadUrl: string;
  licenseUrl?: string;
  purchasedAt: Date;
}

const CustomerDownloads: React.FC = () => {
  const { user } = useAuth();
  const t = useT();
  const [downloads, setDownloads] = useState<DownloadableItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [deliverables, setDeliverables] = useState<ClientDeliverable[]>([]);
  const [deliverablesLoading, setDeliverablesLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'orders' | 'completed' | 'history'>('all');

  useEffect(() => {
    if (!user) return;

    const loadDownloads = async () => {
      try {
        const ordersData = await orderService.getOrdersByCustomer(user.email);

        // Store all orders
        setOrders(ordersData);

        // Extract all downloadable items from completed orders
        const downloadableItems: DownloadableItem[] = [];

        ordersData
          .filter((order) => order.status === 'completed')
          .forEach((order) => {
            order.items.forEach((item) => {
              const downloadUrl = order.downloadLinks?.[item.beatId];
              const licenseUrl = order.licensePDFs?.[item.beatId];

              if (downloadUrl) {
                downloadableItems.push({
                  ...item,
                  orderId: order.id,
                  orderNumber: order.orderNumber,
                  downloadUrl,
                  licenseUrl,
                  purchasedAt: order.completedAt?.toDate?.() || order.createdAt?.toDate?.() || new Date(),
                });
              }
            });
          });

        // Sort by purchase date, newest first
        downloadableItems.sort((a, b) => b.purchasedAt.getTime() - a.purchasedAt.getTime());

        setDownloads(downloadableItems);
      } catch (error) {
        console.error('Failed to load downloads:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDownloads();
  }, [user]);

  useEffect(() => {
    if (!user) return;

    const loadDeliverables = async () => {
      try {
        const data = await deliverableService.getByUserId(user.uid);
        setDeliverables(data);
      } catch (error) {
        console.error('Failed to load delivered mix & master / studio session history:', error);
      } finally {
        setDeliverablesLoading(false);
      }
    };

    loadDeliverables();
  }, [user]);

  if (loading) {
    return (
      <CustomerLayout>
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner text="Loading downloads..." />
        </div>
      </CustomerLayout>
    );
  }

  return (
    <CustomerLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-white">My Downloads</h1>
          <p className="text-white/40 mt-2">Access all your purchased beats and licenses</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-white/[0.06] mb-6">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 font-medium transition-all ${
              activeTab === 'all'
                ? 'text-blue-400 border-b-2 border-blue-400'
                : 'text-white/40 hover:text-white/60'
            }`}
          >
            All Downloads
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-4 py-2 font-medium transition-all ${
              activeTab === 'orders'
                ? 'text-blue-400 border-b-2 border-blue-400'
                : 'text-white/40 hover:text-white/60'
            }`}
          >
            My Orders
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            className={`px-4 py-2 font-medium transition-all ${
              activeTab === 'completed'
                ? 'text-blue-400 border-b-2 border-blue-400'
                : 'text-white/40 hover:text-white/60'
            }`}
          >
            Completed
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 font-medium transition-all ${
              activeTab === 'history'
                ? 'text-blue-400 border-b-2 border-blue-400'
                : 'text-white/40 hover:text-white/60'
            }`}
          >
            {t('Mix & Master / Studio History', 'Mix & Master / Studio Geschiedenis')}
          </button>
        </div>

        {/* Info Banner */}
        {activeTab === 'all' && (
          <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-4 mb-8">
            <div className="flex items-start gap-3">
              <div className="text-2xl">ℹ️</div>
              <div>
                <div className="font-semibold mb-1">Download Tips</div>
                <ul className="text-sm text-white/60 space-y-1">
                  <li>• All purchases include unlimited re-downloads</li>
                  <li>• Download your license agreement for legal protection</li>
                  <li>• Files are available in high-quality formats</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Content based on active tab */}
        {activeTab === 'orders' ? (
          /* My Orders View */
          orders.length === 0 ? (
            <div className="text-center py-12 bg-white/[0.08] rounded-lg">
              <div className="text-4xl mb-4">📦</div>
              <p className="text-xl mb-2">No orders yet</p>
              <p className="text-white/40 mb-6">Start shopping for beats</p>
              <Link
                to="/customer/shop"
                className="inline-block bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg transition"
              >
                Browse Beats
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <div key={order.id} className="bg-white/[0.08] border border-white/[0.06] rounded-xl p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-white">Order #{order.orderNumber}</h3>
                      <p className="text-sm text-white/40">
                        {order.createdAt?.toDate?.()?.toLocaleDateString() || 'N/A'}
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded text-sm font-medium ${
                        order.status === 'completed'
                          ? 'bg-green-600/20 text-green-400'
                          : order.status === 'pending'
                          ? 'bg-yellow-600/20 text-yellow-400'
                          : 'bg-blue-600/20 text-blue-400'
                      }`}
                    >
                      {order.status}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {order.items.map((item, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span className="text-white/60">{item.beatTitle} ({item.licenseType})</span>
                        <span className="text-white font-medium">€{item.price.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-white/[0.06] mt-4 pt-4">
                    <div className="flex justify-between items-center">
                      <span className="text-white/40">Total</span>
                      <span className="text-xl font-bold text-white">€{order.totalAmount.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : activeTab === 'history' ? (
          /* Mix & Master / Studio Session History */
          deliverablesLoading ? (
            <div className="flex justify-center items-center py-12">
              <LoadingSpinner text={t('Loading history...', 'Geschiedenis laden...')} />
            </div>
          ) : deliverables.length === 0 ? (
            <div className="text-center py-12 bg-white/[0.08] rounded-lg">
              <p className="text-white/40">
                {t(
                  'No delivered mix & master or studio session files yet.',
                  'Nog geen geleverde mix & master of studiosessie bestanden.'
                )}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {deliverables.map((deliverable) => (
                <div
                  key={deliverable.id}
                  className="bg-white/[0.08] border border-white/[0.06] rounded-xl p-6"
                >
                  <div className="flex items-start justify-between mb-4 gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`px-3 py-1 rounded text-xs font-medium ${
                            deliverable.type === 'mix-master'
                              ? 'bg-purple-600/20 text-purple-400'
                              : 'bg-blue-600/20 text-blue-400'
                          }`}
                        >
                          {deliverable.type === 'mix-master'
                            ? t('Mix & Master', 'Mix & Master')
                            : t('Studio Session', 'Studiosessie')}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-white">{deliverable.title}</h3>
                      <p className="text-sm text-white/40">
                        {t('Completed', 'Voltooid')}:{' '}
                        {deliverable.completedAt?.toDate?.()?.toLocaleDateString() || 'N/A'}
                      </p>
                    </div>
                  </div>

                  {deliverable.notes && (
                    <p className="text-sm text-white/60 mb-4">{deliverable.notes}</p>
                  )}

                  <div className="space-y-2">
                    {deliverable.files.map((file, index) => (
                      <a
                        key={index}
                        href={file.url}
                        download
                        className="flex items-center justify-between gap-3 bg-white/[0.06] hover:bg-white/[0.1] px-4 py-2 rounded transition text-sm"
                      >
                        <span className="flex items-center gap-2 truncate">
                          <Music2 className="w-4 h-4 text-white/40 flex-shrink-0" />
                          <span className="truncate">{file.name}</span>
                        </span>
                        <span className="flex items-center gap-2 text-white/40 flex-shrink-0">
                          {formatFileSize(file.sizeBytes) && (
                            <span className="text-xs">{formatFileSize(file.sizeBytes)}</span>
                          )}
                          <Download className="w-4 h-4" />
                        </span>
                      </a>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          /* Downloads Grid */
          downloads.length === 0 ? (
            <div className="text-center py-12 bg-white/[0.08] rounded-lg">
              <div className="text-4xl mb-4">⬇️</div>
              <p className="text-xl mb-2">No downloads available</p>
              <p className="text-white/40 mb-6">Purchase beats to access downloads</p>
              <Link
                to="/customer/shop"
                className="inline-block bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg transition"
              >
                Browse Beats
              </Link>
            </div>
          ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {downloads.map((item, index) => (
              <div key={index} className="bg-white/[0.08] rounded-lg overflow-hidden hover:bg-white/[0.05] transition">
                {/* Beat Artwork */}
                <div className="relative">
                  <img
                    src={item.artworkUrl || '/placeholder-beat.png'}
                    alt={item.beatTitle}
                    className="w-full h-48 object-cover"
                  />
                  <div className="absolute top-2 right-2 bg-black/70 px-2 py-1 rounded text-xs capitalize">
                    {item.licenseType} License
                  </div>
                </div>

                {/* Beat Info */}
                <div className="p-4">
                  <h3 className="font-bold text-lg mb-2">{item.beatTitle}</h3>
                  <div className="text-sm text-white/40 mb-4">
                    Purchased: {item.purchasedAt.toLocaleDateString()}
                  </div>

                  {/* Download Buttons */}
                  <div className="space-y-2">
                    <a
                      href={item.downloadUrl}
                      className="block w-full bg-purple-600 hover:bg-purple-700 text-center py-2 rounded transition"
                      download
                    >
                      ⬇️ Download Beat
                    </a>

                    {item.licenseUrl && (
                      <a
                        href={item.licenseUrl}
                        className="block w-full bg-white/[0.06] hover:bg-white/[0.08] text-center py-2 rounded transition text-sm"
                        download
                      >
                        📄 Download License
                      </a>
                    )}
                  </div>

                  {/* Order Reference */}
                  <div className="mt-4 pt-4 border-t border-white/[0.06]">
                    <Link
                      to="/customer/orders"
                      className="text-xs text-white/40 hover:text-white/60"
                    >
                      Order: {item.orderNumber} →
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
          )
        )}

        {/* Support Section */}
        {activeTab !== 'orders' && downloads.length > 0 && (
          <div className="mt-12 bg-white/[0.08] rounded-lg p-6 text-center">
            <h3 className="font-bold mb-2">Need Help?</h3>
            <p className="text-white/40 mb-4">
              Having trouble downloading? Contact support for assistance.
            </p>
            <a
              href="mailto:support@jonnarincon.com"
              className="text-purple-400 hover:text-purple-300"
            >
              support@jonnarincon.com
            </a>
          </div>
        )}
      </div>
    </CustomerLayout>
  );
};

export default CustomerDownloads;
