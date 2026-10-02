import React from 'react';
import { useSearchParams } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout';
import { OrdersContent } from './OrdersPage';
import { ProductManagementContent } from './ProductManagementPage';
import { DiscountCodesContent } from './DiscountCodesPage';

type OrdersStatsTab = 'orders' | 'products' | 'discounts';

const TABS: { id: OrdersStatsTab; label: string }[] = [
  { id: 'orders', label: 'Orders' },
  { id: 'products', label: 'Products' },
  { id: 'discounts', label: 'Discount Codes' },
];

const OrdersStatsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const activeTab: OrdersStatsTab = tabParam === 'products' || tabParam === 'discounts' ? tabParam : 'orders';

  const setActiveTab = (tab: OrdersStatsTab) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('tab', tab);
      return next;
    });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Orders and Stats</h1>
          <p className="text-white/40 mt-2">Orders, product purchases & discount codes in one place</p>
        </div>

        <div className="flex gap-1 border-b border-white/[0.1] overflow-x-auto">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 font-semibold text-sm transition-all relative group whitespace-nowrap ${
                  isActive ? 'text-white' : 'text-white/40 hover:text-white'
                }`}
              >
                <span>{tab.label}</span>
                {isActive && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-red-600 to-pink-600" />
                )}
              </button>
            );
          })}
        </div>

        {activeTab === 'orders' && <OrdersContent />}
        {activeTab === 'products' && <ProductManagementContent />}
        {activeTab === 'discounts' && <DiscountCodesContent />}
      </div>
    </AdminLayout>
  );
};

export default OrdersStatsPage;
