import React, { useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { useOrders } from '../../hooks/useOrders';
import { orderService } from '../../lib/firebase/services';
import { OrderStatus } from '../../lib/firebase/types';
import { Eye } from 'lucide-react';

const OrdersPage: React.FC = () => {
  const { orders, loading } = useOrders();
  const [filterStatus, setFilterStatus] = useState<OrderStatus | 'all'>('all');

  const filteredOrders = filterStatus === 'all'
    ? orders
    : orders.filter((order) => order.status === filterStatus);

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    try {
      await orderService.updateOrderStatus(orderId, newStatus);
      alert('Order status updated');
    } catch (error: any) {
      alert(error.message);
    }
  };

  const getStatusColor = (status: OrderStatus) => {
    const colors = {
      pending: 'bg-yellow-500/20 text-yellow-400',
      processing: 'bg-blue-500/20 text-blue-400',
      completed: 'bg-green-500/20 text-green-400',
      failed: 'bg-red-500/20 text-red-400',
      refunded: 'bg-white/[0.06] text-white/40',
      cancelled: 'bg-white/[0.06] text-white/40',
    };
    return colors[status];
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Orders Management</h1>
            <p className="text-white/40 mt-2">Manage and process customer orders</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center space-x-4">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as OrderStatus | 'all')}
            className="px-4 py-2 bg-white/[0.08] border border-white/[0.06] rounded-lg text-white"
          >
            <option value="all">All Orders</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
            <option value="refunded">Refunded</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        {/* Orders Table */}
        <div className="bg-white/[0.08] border border-white/[0.06] rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/[0.06]">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white/60">
                    Order Number
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white/60">
                    Customer
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white/60">
                    Items
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white/60">
                    Total
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white/60">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white/60">
                    Date
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-white/60">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06]">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-white/40">
                      Loading orders...
                    </td>
                  </tr>
                ) : filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-white/40">
                      No orders found
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-white/[0.06]">
                      <td className="px-6 py-4">
                        <p className="font-medium text-white">{order.orderNumber}</p>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-white">{order.customerName || 'Guest'}</p>
                          <p className="text-sm text-white/40">{order.customerEmail}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-white/60">
                        {order.items.length} item(s)
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-semibold text-white">€{order.total.toFixed(2)}</p>
                      </td>
                      <td className="px-6 py-4">
                        <select
                          value={order.status}
                          onChange={(e) => handleStatusChange(order.id, e.target.value as OrderStatus)}
                          className={`px-2 py-1 rounded text-sm ${getStatusColor(order.status)} bg-transparent border-0`}
                        >
                          <option value="pending">Pending</option>
                          <option value="processing">Processing</option>
                          <option value="completed">Completed</option>
                          <option value="failed">Failed</option>
                          <option value="refunded">Refunded</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 text-white/60 text-sm">
                        {order.createdAt && new Date((order.createdAt as any).seconds * 1000).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            className="p-2 text-white/40 hover:text-blue-400 transition-colors"
                            title="View details"
                          >
                            <Eye size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default OrdersPage;
