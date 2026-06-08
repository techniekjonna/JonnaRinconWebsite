import React, { useState, useEffect, useMemo } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { useOrders } from '../../hooks/useOrders';
import { useOrderNotifications } from '../../hooks/useOrderNotifications';
import { orderService } from '../../lib/firebase/services';
import { Order, OrderStatus, ProductCategory } from '../../lib/firebase/types';
import {
  Eye, EyeOff, ChevronDown, ChevronUp, Music, Palette, Package, Wrench,
  CheckCircle2, Circle, AlertCircle, Clock, TrendingUp, ShoppingBag,
  DollarSign, Filter, Search, StickyNote, Check,
} from 'lucide-react';

// ─── helpers ───────────────────────────────────────────────────────────────

type Tab = 'overview' | 'all' | 'action';

const STATUS_COLORS: Record<OrderStatus, string> = {
  pending:    'bg-amber-500/20 text-amber-400',
  processing: 'bg-blue-500/20 text-blue-400',
  completed:  'bg-emerald-500/20 text-emerald-400',
  failed:     'bg-red-500/20 text-red-400',
  refunded:   'bg-white/[0.06] text-white/40',
  cancelled:  'bg-white/[0.06] text-white/40',
};

const TYPE_CONFIG: Record<ProductCategory, { label: string; color: string; icon: React.ElementType }> = {
  beat:        { label: 'Beat',           color: 'bg-purple-500/20 text-purple-400',  icon: Music },
  track:       { label: 'Track',          color: 'bg-pink-500/20 text-pink-400',      icon: Music },
  remix:       { label: 'Remix',          color: 'bg-rose-500/20 text-rose-400',      icon: Music },
  edit:        { label: 'Edit',           color: 'bg-fuchsia-500/20 text-fuchsia-400', icon: Music },
  art:         { label: 'Art',            color: 'bg-amber-500/20 text-amber-400',    icon: Palette },
  merchandise: { label: 'Merchandise',    color: 'bg-emerald-500/20 text-emerald-400', icon: Package },
  service:     { label: 'Service',        color: 'bg-cyan-500/20 text-cyan-400',      icon: Wrench },
};

const FULFILLMENT_STEPS: Record<string, { key: keyof NonNullable<Order['fulfillmentSteps']>; label: string }[]> = {
  beat:  [
    { key: 'paymentConfirmed', label: 'Betaling bevestigd' },
    { key: 'filesDelivered',   label: 'Download link verstuurd' },
  ],
  track: [
    { key: 'paymentConfirmed', label: 'Betaling bevestigd' },
    { key: 'filesDelivered',   label: 'Bestanden verstuurd' },
  ],
  remix: [
    { key: 'paymentConfirmed', label: 'Betaling bevestigd' },
    { key: 'filesDelivered',   label: 'Bestanden verstuurd' },
  ],
  edit: [
    { key: 'paymentConfirmed', label: 'Betaling bevestigd' },
    { key: 'filesDelivered',   label: 'Bestanden verstuurd' },
  ],
  service: [
    { key: 'paymentConfirmed',     label: 'Betaling bevestigd' },
    { key: 'scheduledWithClient',  label: 'Gepland met klant' },
    { key: 'inProgress',           label: 'In uitvoering' },
    { key: 'filesDelivered',       label: 'Geleverd aan klant' },
  ],
  art: [
    { key: 'paymentConfirmed', label: 'Betaling bevestigd' },
    { key: 'packaged',         label: 'Ingepakt' },
    { key: 'shipped',          label: 'Verstuurd' },
    { key: 'delivered',        label: 'Geleverd' },
  ],
  merchandise: [
    { key: 'paymentConfirmed', label: 'Betaling bevestigd' },
    { key: 'packaged',         label: 'Ingepakt' },
    { key: 'shipped',          label: 'Verstuurd' },
    { key: 'delivered',        label: 'Geleverd' },
  ],
};

const getPrimaryType = (order: Order): ProductCategory =>
  order.items?.[0]?.productType ?? 'beat';

const getActionLabel = (type: ProductCategory): string => {
  if (type === 'beat' || type === 'track' || type === 'remix' || type === 'edit') return 'Stuur download link';
  if (type === 'service') return 'Plan & lever service';
  if (type === 'art' || type === 'merchandise') return 'Pak in & verstuur';
  return 'Verwerk bestelling';
};

const toDate = (ts: any): Date | null => {
  if (!ts) return null;
  if (ts.seconds) return new Date(ts.seconds * 1000);
  if (ts instanceof Date) return ts;
  return null;
};

const formatDate = (ts: any) => {
  const d = toDate(ts);
  return d ? d.toLocaleDateString('nl-NL', { day: '2-digit', month: '2-digit', year: '2-digit' }) : '—';
};

const formatTime = (ts: any) => {
  const d = toDate(ts);
  return d ? d.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' }) : '';
};

const needsAction = (order: Order) =>
  order.status === 'pending' || order.status === 'processing';

// ─── sub-components ─────────────────────────────────────────────────────────

interface StatCardProps { label: string; value: string | number; sub?: string; accent?: string }
const StatCard: React.FC<StatCardProps> = ({ label, value, sub, accent = 'text-white' }) => (
  <div className="bg-white/[0.06] border border-white/[0.06] rounded-2xl p-4">
    <p className="text-[11px] text-white/30 uppercase tracking-widest mb-1">{label}</p>
    <p className={`text-2xl font-bold ${accent}`}>{value}</p>
    {sub && <p className="text-xs text-white/25 mt-1">{sub}</p>}
  </div>
);

interface FulfillmentChecklistProps {
  order: Order;
  onToggle: (key: keyof NonNullable<Order['fulfillmentSteps']>) => void;
}
const FulfillmentChecklist: React.FC<FulfillmentChecklistProps> = ({ order, onToggle }) => {
  const type = getPrimaryType(order);
  const steps = FULFILLMENT_STEPS[type] || FULFILLMENT_STEPS.beat;
  const steps_ = order.fulfillmentSteps ?? {};

  // For beats: auto-detect if downloadLinks present
  const autoCompleted: Partial<NonNullable<Order['fulfillmentSteps']>> = {};
  if (type === 'beat' || type === 'track' || type === 'remix' || type === 'edit') {
    if (order.downloadLinks && Object.keys(order.downloadLinks).length > 0) {
      autoCompleted.filesDelivered = true;
    }
  }
  if (order.paymentStatus === 'succeeded') {
    autoCompleted.paymentConfirmed = true;
  }

  return (
    <div className="space-y-1.5">
      {steps.map(({ key, label }) => {
        const done = steps_[key] || autoCompleted[key];
        return (
          <button
            key={key}
            onClick={() => onToggle(key)}
            className="flex items-center gap-2 w-full text-left group"
          >
            {done
              ? <CheckCircle2 size={15} className="text-emerald-400 flex-shrink-0" />
              : <Circle size={15} className="text-white/20 group-hover:text-white/40 flex-shrink-0 transition-colors" />
            }
            <span className={`text-sm transition-colors ${done ? 'text-white/50 line-through' : 'text-white/70 group-hover:text-white'}`}>
              {label}
            </span>
          </button>
        );
      })}
    </div>
  );
};

// ─── expanded row ────────────────────────────────────────────────────────────

interface ExpandedOrderProps {
  order: Order;
  onStatusChange: (id: string, status: OrderStatus) => void;
  onFulfillmentToggle: (order: Order, key: keyof NonNullable<Order['fulfillmentSteps']>) => void;
  onNoteChange: (id: string, note: string) => void;
}
const ExpandedOrder: React.FC<ExpandedOrderProps> = ({ order, onStatusChange, onFulfillmentToggle, onNoteChange }) => {
  const [note, setNote] = useState(order.adminNote ?? '');
  const [saving, setSaving] = useState(false);

  const saveNote = async () => {
    setSaving(true);
    await onNoteChange(order.id, note);
    setSaving(false);
  };

  return (
    <div className="px-6 pb-6 pt-2 bg-white/[0.02] border-t border-white/[0.04] grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Items */}
      <div>
        <p className="text-[11px] text-white/30 uppercase tracking-widest mb-3">Producten</p>
        <div className="space-y-2">
          {order.items.map((item, i) => {
            const tc = TYPE_CONFIG[item.productType] ?? TYPE_CONFIG.beat;
            const Icon = tc.icon;
            return (
              <div key={i} className="flex items-start gap-2.5 p-2.5 bg-white/[0.04] rounded-xl">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${tc.color.replace('text-', 'bg-').replace('400', '400/10')}`}>
                  <Icon size={13} className={tc.color.split(' ')[1]} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-white truncate">{item.productTitle}</p>
                  <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${tc.color}`}>{tc.label}</span>
                    {item.licenseType && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/[0.06] text-white/40">{item.licenseType}</span>
                    )}
                    {item.deliveryOption && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400">{item.deliveryOption}</span>
                    )}
                  </div>
                </div>
                <p className="text-sm text-white/60 flex-shrink-0">€{item.price.toFixed(2)}</p>
              </div>
            );
          })}
        </div>
        {/* Pricing summary */}
        <div className="mt-3 pt-3 border-t border-white/[0.06] space-y-1 text-sm">
          {order.discount > 0 && (
            <div className="flex justify-between text-white/40">
              <span>Korting {order.discountCode && `(${order.discountCode})`}</span>
              <span>-€{order.discount.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between font-semibold text-white">
            <span>Totaal</span>
            <span>€{order.total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Customer + Status */}
      <div className="space-y-4">
        <div>
          <p className="text-[11px] text-white/30 uppercase tracking-widest mb-2">Klant</p>
          <p className="text-sm text-white font-medium">{order.customerName || 'Gast'}</p>
          <p className="text-xs text-white/40">{order.customerEmail}</p>
          {order.customerNote && (
            <p className="text-xs text-amber-300/70 mt-2 bg-amber-500/10 rounded-lg p-2">
              "{order.customerNote}"
            </p>
          )}
        </div>

        <div>
          <p className="text-[11px] text-white/30 uppercase tracking-widest mb-2">Status wijzigen</p>
          <select
            value={order.status}
            onChange={(e) => onStatusChange(order.id, e.target.value as OrderStatus)}
            className="w-full px-3 py-2 bg-white/[0.08] border border-white/[0.08] rounded-xl text-sm text-white focus:outline-none focus:border-white/20"
          >
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
            <option value="refunded">Refunded</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        <div>
          <p className="text-[11px] text-white/30 uppercase tracking-widest mb-2">Admin notitie</p>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            placeholder="Notitie toevoegen..."
            className="w-full px-3 py-2 bg-white/[0.08] border border-white/[0.08] rounded-xl text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-white/20 resize-none"
          />
          <button
            onClick={saveNote}
            disabled={saving}
            className="mt-1.5 px-3 py-1.5 text-xs bg-white/[0.08] hover:bg-white/[0.12] border border-white/[0.08] rounded-lg text-white/60 hover:text-white transition-all flex items-center gap-1"
          >
            <Check size={12} />
            {saving ? 'Opslaan...' : 'Sla notitie op'}
          </button>
        </div>
      </div>

      {/* Fulfillment checklist */}
      <div>
        <p className="text-[11px] text-white/30 uppercase tracking-widest mb-3">Afhandelstappen</p>
        <FulfillmentChecklist
          order={order}
          onToggle={(key) => onFulfillmentToggle(order, key)}
        />
        <div className="mt-4 pt-3 border-t border-white/[0.06] space-y-1 text-xs text-white/30">
          <p>Betaling: <span className={order.paymentStatus === 'succeeded' ? 'text-emerald-400' : 'text-amber-400'}>{order.paymentStatus}</span></p>
          <p>Methode: <span className="text-white/50">{order.paymentMethod}</span></p>
          <p>Aangemeld: <span className="text-white/50">{formatDate(order.createdAt)} {formatTime(order.createdAt)}</span></p>
          {order.completedAt && <p>Voltooid: <span className="text-emerald-400">{formatDate(order.completedAt)}</span></p>}
        </div>
      </div>
    </div>
  );
};

// ─── main page ───────────────────────────────────────────────────────────────

const OrdersPage: React.FC = () => {
  const { orders, loading } = useOrders();
  const { markOrdersSeen } = useOrderNotifications();

  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [filterStatus, setFilterStatus] = useState<OrderStatus | 'all'>('all');
  const [filterType, setFilterType] = useState<ProductCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Mark orders as seen when page loads
  useEffect(() => { markOrdersSeen(); }, []);

  // ── derived stats ──────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayMs = today.getTime();

    let revenue = 0;
    let revenueToday = 0;
    let todayCount = 0;
    let pendingCount = 0;
    let processingCount = 0;
    const byType: Record<string, { total: number; pending: number }> = {};

    orders.forEach((o) => {
      if (o.status === 'completed') revenue += o.total;
      const createdMs = (o.createdAt as any)?.seconds ? (o.createdAt as any).seconds * 1000 : 0;
      if (createdMs >= todayMs) {
        todayCount++;
        if (o.status === 'completed') revenueToday += o.total;
      }
      if (o.status === 'pending') pendingCount++;
      if (o.status === 'processing') processingCount++;

      o.items?.forEach((item) => {
        if (!byType[item.productType]) byType[item.productType] = { total: 0, pending: 0 };
        byType[item.productType].total++;
        if (needsAction(o)) byType[item.productType].pending++;
      });
    });

    return { revenue, revenueToday, todayCount, pendingCount, processingCount, byType };
  }, [orders]);

  const actionOrders = useMemo(
    () => orders.filter(needsAction).sort((a, b) => {
      const aMs = (a.createdAt as any)?.seconds ?? 0;
      const bMs = (b.createdAt as any)?.seconds ?? 0;
      return aMs - bMs; // oldest first = most urgent
    }),
    [orders]
  );

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const matchStatus = filterStatus === 'all' || o.status === filterStatus;
      const matchType = filterType === 'all' || o.items?.some((i) => i.productType === filterType);
      const q = searchQuery.toLowerCase();
      const matchSearch = !q ||
        o.orderNumber?.toLowerCase().includes(q) ||
        o.customerEmail?.toLowerCase().includes(q) ||
        o.customerName?.toLowerCase().includes(q) ||
        o.items?.some((i) => i.productTitle.toLowerCase().includes(q));
      return matchStatus && matchType && matchSearch;
    });
  }, [orders, filterStatus, filterType, searchQuery]);

  // ── handlers ───────────────────────────────────────────────────────────────
  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    setUpdatingId(orderId);
    try {
      await orderService.updateOrderStatus(orderId, newStatus);
    } catch (e: any) {
      alert(e.message);
    }
    setUpdatingId(null);
  };

  const handleFulfillmentToggle = async (
    order: Order,
    key: keyof NonNullable<Order['fulfillmentSteps']>
  ) => {
    const current = order.fulfillmentSteps?.[key] ?? false;
    try {
      await orderService.updateOrder(order.id, {
        fulfillmentSteps: { ...order.fulfillmentSteps, [key]: !current },
      });
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleNoteChange = async (orderId: string, note: string) => {
    try {
      await orderService.updateOrderStatus(orderId, orders.find(o => o.id === orderId)?.status ?? 'pending', note);
    } catch (e: any) {
      alert(e.message);
    }
  };

  const toggleExpand = (id: string) =>
    setExpandedId((prev) => (prev === id ? null : id));

  // ── render helpers ─────────────────────────────────────────────────────────
  const renderOrderRow = (order: Order) => {
    const primaryType = getPrimaryType(order);
    const tc = TYPE_CONFIG[primaryType] ?? TYPE_CONFIG.beat;
    const TypeIcon = tc.icon;
    const isExpanded = expandedId === order.id;
    const isUpdating = updatingId === order.id;
    const hasAction = needsAction(order);

    return (
      <React.Fragment key={order.id}>
        <tr
          onClick={() => toggleExpand(order.id)}
          className={`cursor-pointer transition-colors ${isExpanded ? 'bg-white/[0.06]' : 'hover:bg-white/[0.04]'}`}
        >
          <td className="px-4 py-3.5">
            <div className="flex items-center gap-2">
              {hasAction && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />}
              <p className="font-mono text-xs text-white/80">{order.orderNumber}</p>
            </div>
            <p className="text-[11px] text-white/25 mt-0.5">{formatDate(order.createdAt)}</p>
          </td>
          <td className="px-4 py-3.5">
            <p className="text-sm text-white">{order.customerName || 'Gast'}</p>
            <p className="text-xs text-white/30 truncate max-w-[160px]">{order.customerEmail}</p>
          </td>
          <td className="px-4 py-3.5">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full ${tc.color}`}>
                <TypeIcon size={10} />
                {tc.label}
              </span>
              {order.items?.length > 1 && (
                <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-white/[0.06] text-white/30">
                  +{order.items.length - 1}
                </span>
              )}
            </div>
          </td>
          <td className="px-4 py-3.5">
            <p className="font-semibold text-white text-sm">€{order.total.toFixed(2)}</p>
          </td>
          <td className="px-4 py-3.5">
            <span className={`text-[11px] px-2.5 py-1 rounded-full font-medium ${STATUS_COLORS[order.status]}`}>
              {order.status}
            </span>
          </td>
          <td className="px-4 py-3.5 text-right">
            {isUpdating ? (
              <span className="text-xs text-white/30">...</span>
            ) : (
              <span className="text-white/20 hover:text-white/60 transition-colors">
                {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </span>
            )}
          </td>
        </tr>
        {isExpanded && (
          <tr>
            <td colSpan={6} className="p-0">
              <ExpandedOrder
                order={order}
                onStatusChange={handleStatusChange}
                onFulfillmentToggle={handleFulfillmentToggle}
                onNoteChange={handleNoteChange}
              />
            </td>
          </tr>
        )}
      </React.Fragment>
    );
  };

  // ── overview tab ───────────────────────────────────────────────────────────
  const renderOverview = () => (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          label="Actie vereist"
          value={stats.pendingCount + stats.processingCount}
          sub="pending + processing"
          accent={stats.pendingCount + stats.processingCount > 0 ? 'text-amber-400' : 'text-white'}
        />
        <StatCard label="Vandaag" value={stats.todayCount} sub="nieuwe bestellingen" />
        <StatCard label="Omzet vandaag" value={`€${stats.revenueToday.toFixed(2)}`} accent="text-emerald-400" />
        <StatCard label="Totale omzet" value={`€${stats.revenue.toFixed(2)}`} sub="voltooide orders" />
      </div>

      {/* Type breakdown */}
      <div>
        <h3 className="text-sm font-semibold text-white/60 uppercase tracking-widest mb-3">Per producttype</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
          {(Object.keys(TYPE_CONFIG) as ProductCategory[]).map((type) => {
            const tc = TYPE_CONFIG[type];
            const Icon = tc.icon;
            const data = stats.byType[type];
            if (!data) return null;
            return (
              <div key={type} className="bg-white/[0.04] border border-white/[0.06] rounded-xl p-3 flex items-center gap-3">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${tc.color}`}>
                  <Icon size={14} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-white">{tc.label}</p>
                  <p className="text-[11px] text-white/30">{data.total} orders</p>
                  {data.pending > 0 && (
                    <p className="text-[11px] text-amber-400">{data.pending} wacht</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Action needed list */}
      {actionOrders.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-white/60 uppercase tracking-widest mb-3">
            Actie vereist ({actionOrders.length})
          </h3>
          <div className="space-y-2">
            {actionOrders.slice(0, 8).map((order) => {
              const type = getPrimaryType(order);
              const tc = TYPE_CONFIG[type];
              const Icon = tc.icon;
              return (
                <div
                  key={order.id}
                  onClick={() => { setActiveTab('all'); setTimeout(() => setExpandedId(order.id), 50); }}
                  className="flex items-center gap-3 p-3.5 bg-white/[0.04] hover:bg-white/[0.07] border border-white/[0.06] rounded-xl cursor-pointer transition-all"
                >
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${tc.color}`}>
                    <Icon size={13} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm text-white font-medium">{order.orderNumber}</p>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full ${STATUS_COLORS[order.status]}`}>
                        {order.status}
                      </span>
                    </div>
                    <p className="text-xs text-white/40 truncate">{order.customerEmail}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-semibold text-white">€{order.total.toFixed(2)}</p>
                    <p className="text-[11px] text-amber-400">{getActionLabel(type)}</p>
                  </div>
                </div>
              );
            })}
            {actionOrders.length > 8 && (
              <button
                onClick={() => setActiveTab('action')}
                className="w-full text-center text-xs text-white/30 hover:text-white/60 py-2 transition-colors"
              >
                + {actionOrders.length - 8} meer bekijken
              </button>
            )}
          </div>
        </div>
      )}

      {actionOrders.length === 0 && !loading && (
        <div className="flex items-center gap-3 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
          <CheckCircle2 size={20} className="text-emerald-400 flex-shrink-0" />
          <p className="text-sm text-emerald-300">Alles afgehandeld! Geen openstaande bestellingen.</p>
        </div>
      )}
    </div>
  );

  // ── all orders tab ─────────────────────────────────────────────────────────
  const renderAllOrders = () => (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="flex items-center gap-2 bg-white/[0.06] border border-white/[0.06] rounded-xl px-3 py-2 flex-1 min-w-[200px]">
          <Search size={14} className="text-white/30 flex-shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Zoek order, klant, product..."
            className="bg-transparent text-sm text-white placeholder:text-white/20 focus:outline-none w-full"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as OrderStatus | 'all')}
          className="px-3 py-2 bg-white/[0.06] border border-white/[0.06] rounded-xl text-sm text-white focus:outline-none"
        >
          <option value="all">Alle statussen</option>
          <option value="pending">Pending</option>
          <option value="processing">Processing</option>
          <option value="completed">Completed</option>
          <option value="failed">Failed</option>
          <option value="refunded">Refunded</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value as ProductCategory | 'all')}
          className="px-3 py-2 bg-white/[0.06] border border-white/[0.06] rounded-xl text-sm text-white focus:outline-none"
        >
          <option value="all">Alle types</option>
          {(Object.keys(TYPE_CONFIG) as ProductCategory[]).map((t) => (
            <option key={t} value={t}>{TYPE_CONFIG[t].label}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white/[0.04] border border-white/[0.06] rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-white/[0.06]">
              <tr>
                <th className="px-4 py-3 text-left text-[11px] text-white/30 uppercase tracking-widest">Order</th>
                <th className="px-4 py-3 text-left text-[11px] text-white/30 uppercase tracking-widest">Klant</th>
                <th className="px-4 py-3 text-left text-[11px] text-white/30 uppercase tracking-widest">Type</th>
                <th className="px-4 py-3 text-left text-[11px] text-white/30 uppercase tracking-widest">Totaal</th>
                <th className="px-4 py-3 text-left text-[11px] text-white/30 uppercase tracking-widest">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-white/30 text-sm">
                    Bestellingen laden...
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-white/30 text-sm">
                    Geen bestellingen gevonden
                  </td>
                </tr>
              ) : (
                filteredOrders.map(renderOrderRow)
              )}
            </tbody>
          </table>
        </div>
      </div>
      <p className="text-xs text-white/20 text-right">
        {filteredOrders.length} van {orders.length} bestellingen
      </p>
    </div>
  );

  // ── action tab ─────────────────────────────────────────────────────────────
  const renderActionTab = () => {
    const groupedByType = (Object.keys(TYPE_CONFIG) as ProductCategory[]).reduce<
      Record<ProductCategory, Order[]>
    >((acc, type) => {
      acc[type] = actionOrders.filter((o) => getPrimaryType(o) === type);
      return acc;
    }, {} as Record<ProductCategory, Order[]>);

    const hasAny = actionOrders.length > 0;

    return (
      <div className="space-y-6">
        {!hasAny && !loading && (
          <div className="flex items-center gap-3 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
            <CheckCircle2 size={20} className="text-emerald-400 flex-shrink-0" />
            <p className="text-sm text-emerald-300">Geen openstaande bestellingen — alles is afgehandeld!</p>
          </div>
        )}
        {(Object.keys(groupedByType) as ProductCategory[]).map((type) => {
          const typeOrders = groupedByType[type];
          if (typeOrders.length === 0) return null;
          const tc = TYPE_CONFIG[type];
          const Icon = tc.icon;

          return (
            <div key={type}>
              <div className="flex items-center gap-2 mb-3">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${tc.color}`}>
                  <Icon size={13} />
                </div>
                <h3 className="text-sm font-semibold text-white">{tc.label}</h3>
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400">
                  {typeOrders.length}
                </span>
                <span className="text-xs text-white/30 ml-1">{getActionLabel(type)}</span>
              </div>
              <div className="space-y-px bg-white/[0.04] border border-white/[0.06] rounded-2xl overflow-hidden">
                {typeOrders.map((order) => {
                  const isExpanded = expandedId === order.id;
                  return (
                    <React.Fragment key={order.id}>
                      <div
                        onClick={() => toggleExpand(order.id)}
                        className={`flex items-center gap-4 px-4 py-3.5 cursor-pointer transition-colors ${isExpanded ? 'bg-white/[0.08]' : 'hover:bg-white/[0.04]'} border-b border-white/[0.04] last:border-0`}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-mono text-xs text-white/80">{order.orderNumber}</p>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full ${STATUS_COLORS[order.status]}`}>
                              {order.status}
                            </span>
                          </div>
                          <p className="text-xs text-white/40 mt-0.5 truncate">{order.customerEmail}</p>
                        </div>
                        <p className="text-sm font-semibold text-white flex-shrink-0">€{order.total.toFixed(2)}</p>
                        <span className="text-white/20">
                          {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                        </span>
                      </div>
                      {isExpanded && (
                        <ExpandedOrder
                          order={order}
                          onStatusChange={handleStatusChange}
                          onFulfillmentToggle={handleFulfillmentToggle}
                          onNoteChange={handleNoteChange}
                        />
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // ── main render ────────────────────────────────────────────────────────────
  const tabs: { key: Tab; label: string; count?: number }[] = [
    { key: 'overview', label: 'Overzicht' },
    { key: 'all', label: 'Alle Bestellingen', count: orders.length },
    { key: 'action', label: 'Actie Vereist', count: actionOrders.length },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Bestellingen</h1>
          <p className="text-sm text-white/30 mt-1">Beheer en verwerk klantbestellingen per producttype</p>
        </div>

        {/* Tab nav */}
        <div className="flex items-center gap-1 bg-white/[0.04] border border-white/[0.06] rounded-2xl p-1 w-fit">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                activeTab === tab.key
                  ? 'bg-white/[0.10] text-white'
                  : 'text-white/40 hover:text-white/70'
              }`}
            >
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <span className={`text-[11px] px-1.5 py-0.5 rounded-full ${
                  tab.key === 'action' && tab.count > 0
                    ? 'bg-amber-500/20 text-amber-400'
                    : 'bg-white/[0.08] text-white/40'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'all' && renderAllOrders()}
        {activeTab === 'action' && renderActionTab()}
      </div>
    </AdminLayout>
  );
};

export default OrdersPage;
