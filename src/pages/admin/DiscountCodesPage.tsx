import React, { useState, useMemo } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { useDiscountCodes } from '../../hooks/useDiscountCodes';
import { discountCodeService } from '../../lib/firebase/services';
import { DiscountCode, DiscountType, DiscountUsageLimit } from '../../lib/firebase/types';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { Timestamp } from 'firebase/firestore';

const PRODUCT_TYPE_OPTIONS: { value: 'beat' | 'track' | 'remix' | 'edit'; label: string }[] = [
  { value: 'beat', label: 'Beat' },
  { value: 'track', label: 'Track' },
  { value: 'remix', label: 'Remix' },
  { value: 'edit', label: 'Edit' },
];

const isExpired = (code: DiscountCode): boolean => {
  if (!code.hasDeadline || !code.endDate) return false;
  return (Timestamp.now()?.toMillis?.() || 0) > (code.endDate?.toMillis?.() || 0);
};

const DiscountCodesPage: React.FC = () => {
  const { discountCodes, loading } = useDiscountCodes();
  const [showModal, setShowModal] = useState(false);
  const [editingCode, setEditingCode] = useState<DiscountCode | null>(null);

  const stats = useMemo(() => {
    const total = discountCodes.length;
    const active = discountCodes.filter((c) => c.isActive && !isExpired(c)).length;
    const expired = discountCodes.filter((c) => isExpired(c)).length;
    const totalUses = discountCodes.reduce((sum, c) => sum + (c.usedCount || 0), 0);
    return { total, active, expired, totalUses };
  }, [discountCodes]);

  const handleCreate = () => {
    setEditingCode(null);
    setShowModal(true);
  };

  const handleEdit = (code: DiscountCode) => {
    setEditingCode(code);
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this discount code?')) return;

    try {
      await discountCodeService.deleteDiscountCode(id);
      alert('Discount code deleted successfully');
    } catch (error: any) {
      alert(error.message);
    }
  };

  const getStatusBadge = (code: DiscountCode) => {
    if (isExpired(code)) {
      return (
        <span className="px-2 py-1 rounded text-sm bg-yellow-500/20 text-yellow-400">
          Expired
        </span>
      );
    }
    if (code.isActive) {
      return (
        <span className="px-2 py-1 rounded text-sm bg-green-500/20 text-green-400">
          Active
        </span>
      );
    }
    return (
      <span className="px-2 py-1 rounded text-sm bg-red-500/20 text-red-400">
        Inactive
      </span>
    );
  };

  const formatValue = (code: DiscountCode) => {
    if (code.discountType === 'percentage') {
      return `${code.discountValue}%`;
    }
    return `€${code.discountValue.toFixed(2)}`;
  };

  const formatUsage = (code: DiscountCode) => {
    if (code.usageLimit === 'unlimited') {
      return `${code.usedCount} / Unlimited`;
    }
    return `${code.usedCount} / ${code.maxUses ?? 0}`;
  };

  const formatDeadline = (code: DiscountCode) => {
    if (!code.hasDeadline) return 'No deadline';
    const parts: string[] = [];
    if (code.startDate) {
      parts.push(`From: ${code.startDate.toDate().toLocaleDateString()}`);
    }
    if (code.endDate) {
      parts.push(`Until: ${code.endDate.toDate().toLocaleDateString()}`);
    }
    return parts.length > 0 ? parts.join(' ') : 'No dates set';
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Discount Codes</h1>
            <p className="text-white/40 mt-2">Manage discount codes for your store</p>
          </div>
          <button
            onClick={handleCreate}
            className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-all flex items-center space-x-2"
          >
            <Plus size={20} />
            <span>Create Code</span>
          </button>
        </div>

        {/* Management Table */}
        <div className="bg-white/[0.06] border border-white/[0.06] rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/[0.06]">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white/60">Code</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white/60">Type</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white/60">Value</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white/60">Usage</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white/60">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white/60">Deadline</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-white/60">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06]">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-white/40">
                      Loading discount codes...
                    </td>
                  </tr>
                ) : discountCodes.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-white/40">
                      No discount codes yet. Create your first code!
                    </td>
                  </tr>
                ) : (
                  discountCodes.map((code) => (
                    <tr key={code.id} className="hover:bg-white/[0.06]">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-mono font-semibold text-white">{code.code}</p>
                          {code.description && (
                            <p className="text-sm text-white/40 mt-0.5">{code.description}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-white/60 capitalize">{code.discountType}</td>
                      <td className="px-6 py-4 text-white font-medium">{formatValue(code)}</td>
                      <td className="px-6 py-4 text-white/60">{formatUsage(code)}</td>
                      <td className="px-6 py-4">{getStatusBadge(code)}</td>
                      <td className="px-6 py-4 text-white/60 text-sm">{formatDeadline(code)}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleEdit(code)}
                            className="p-2 text-white/40 hover:text-blue-400 transition-colors"
                            title="Edit"
                          >
                            <Edit size={18} />
                          </button>
                          <button
                            onClick={() => handleDelete(code.id)}
                            className="p-2 text-white/40 hover:text-red-400 transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={18} />
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

      {/* Form Modal */}
      {showModal && (
        <DiscountCodeFormModal
          discountCode={editingCode}
          onClose={() => setShowModal(false)}
          onSave={() => {
            setShowModal(false);
            setEditingCode(null);
          }}
        />
      )}
    </AdminLayout>
  );
};

// ============================================
// FORM MODAL
// ============================================

interface DiscountCodeFormModalProps {
  discountCode: DiscountCode | null;
  onClose: () => void;
  onSave: () => void;
}

const toDatetimeLocal = (ts: Timestamp | undefined): string => {
  if (!ts) return '';
  const d = ts.toDate();
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const DiscountCodeFormModal: React.FC<DiscountCodeFormModalProps> = ({
  discountCode,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState({
    code: discountCode?.code || '',
    description: discountCode?.description || '',
    discountType: (discountCode?.discountType || 'percentage') as DiscountType,
    discountValue: discountCode?.discountValue || 0,
    applicableTo: (discountCode?.applicableTo || 'all') as 'all' | 'specific',
    productTypes: discountCode?.productTypes || ([] as ('beat' | 'track' | 'remix' | 'edit')[]),
    productIdsText: discountCode?.productIds?.join(', ') || '',
    usageLimit: (discountCode?.usageLimit || 'unlimited') as DiscountUsageLimit,
    maxUses: discountCode?.maxUses || 0,
    maxUsesPerUser: discountCode?.maxUsesPerUser || 0,
    hasDeadline: discountCode?.hasDeadline || false,
    startDate: toDatetimeLocal(discountCode?.startDate),
    endDate: toDatetimeLocal(discountCode?.endDate),
    minimumOrderAmount: discountCode?.minimumOrderAmount || 0,
    isActive: discountCode?.isActive ?? true,
  });
  const [saving, setSaving] = useState(false);

  React.useEffect(() => {
    if (discountCode) {
      setFormData({
        code: discountCode.code || '',
        description: discountCode.description || '',
        discountType: discountCode.discountType || 'percentage',
        discountValue: discountCode.discountValue || 0,
        applicableTo: discountCode.applicableTo || 'all',
        productTypes: discountCode.productTypes || [],
        productIdsText: discountCode.productIds?.join(', ') || '',
        usageLimit: discountCode.usageLimit || 'unlimited',
        maxUses: discountCode.maxUses || 0,
        maxUsesPerUser: discountCode.maxUsesPerUser || 0,
        hasDeadline: discountCode.hasDeadline || false,
        startDate: toDatetimeLocal(discountCode.startDate),
        endDate: toDatetimeLocal(discountCode.endDate),
        minimumOrderAmount: discountCode.minimumOrderAmount || 0,
        isActive: discountCode.isActive ?? true,
      });
    }
  }, [discountCode]);

  const handleProductTypeToggle = (type: 'beat' | 'track' | 'remix' | 'edit') => {
    setFormData((prev) => {
      const types = prev.productTypes.includes(type)
        ? prev.productTypes.filter((t) => t !== type)
        : [...prev.productTypes, type];
      return { ...prev, productTypes: types };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const discountValue =
        typeof formData.discountValue === 'string'
          ? parseFloat(formData.discountValue)
          : formData.discountValue;

      if (isNaN(discountValue) || discountValue <= 0) {
        alert('Please enter a valid discount value');
        setSaving(false);
        return;
      }

      if (formData.discountType === 'percentage' && discountValue > 100) {
        alert('Percentage discount cannot exceed 100%');
        setSaving(false);
        return;
      }

      const productIds = formData.productIdsText
        .split(',')
        .map((id) => id.trim())
        .filter((id) => id.length > 0);

      const codeData: any = {
        code: formData.code.toUpperCase(),
        description: formData.description || undefined,
        discountType: formData.discountType,
        discountValue,
        applicableTo: formData.applicableTo,
        productTypes: formData.applicableTo === 'specific' ? formData.productTypes : [],
        productIds: formData.applicableTo === 'specific' ? productIds : [],
        usageLimit: formData.usageLimit,
        maxUses: formData.usageLimit === 'limited' ? (formData.maxUses || 1) : undefined,
        maxUsesPerUser: formData.maxUsesPerUser > 0 ? formData.maxUsesPerUser : undefined,
        hasDeadline: formData.hasDeadline,
        startDate: formData.hasDeadline && formData.startDate
          ? Timestamp.fromDate(new Date(formData.startDate))
          : undefined,
        endDate: formData.hasDeadline && formData.endDate
          ? Timestamp.fromDate(new Date(formData.endDate))
          : undefined,
        minimumOrderAmount: formData.minimumOrderAmount > 0 ? formData.minimumOrderAmount : undefined,
        isActive: formData.isActive,
      };

      if (discountCode) {
        await discountCodeService.updateDiscountCode(discountCode.id, codeData);
        alert('Discount code updated successfully');
      } else {
        await discountCodeService.createDiscountCode(codeData);
        alert('Discount code created successfully');
      }

      onSave();
    } catch (error: any) {
      alert(error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xl z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white/[0.10] backdrop-blur-2xl border border-white/[0.10] rounded-2xl max-w-2xl w-full my-auto max-h-[90vh] flex flex-col">
        <div className="p-6 border-b border-white/[0.08] bg-white/[0.10] flex-shrink-0">
          <h2 className="text-2xl font-bold text-white">
            {discountCode ? 'Edit Discount Code' : 'Create Discount Code'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {/* Code & Description */}
          <div>
            <label className="block text-sm font-medium text-white/60 mb-2">Code <span className="text-red-400">*</span></label>
            <input
              type="text"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              className="w-full px-4 py-2 bg-white/[0.06] border border-white/[0.08] rounded-lg text-white uppercase"
              placeholder="e.g. SUMMER2026"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white/60 mb-2">
              Description (optional)
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 bg-white/[0.06] border border-white/[0.08] rounded-lg text-white min-h-[80px] resize-none"
              placeholder="Internal description for this code"
            />
          </div>

          {/* Discount Type & Value */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white/60 mb-2">Discount Type</label>
              <select
                value={formData.discountType}
                onChange={(e) =>
                  setFormData({ ...formData, discountType: e.target.value as DiscountType })
                }
                className="w-full px-4 py-2 bg-white/[0.06] border border-white/[0.08] rounded-lg text-white"
              >
                <option value="percentage">Percentage</option>
                <option value="fixed">Fixed Amount</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-white/60 mb-2">
                Discount Value ({formData.discountType === 'percentage' ? '%' : '€'}) <span className="text-red-400">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                max={formData.discountType === 'percentage' ? 100 : undefined}
                value={formData.discountValue}
                onChange={(e) =>
                  setFormData({ ...formData, discountValue: parseFloat(e.target.value) || 0 })
                }
                className="w-full px-4 py-2 bg-white/[0.06] border border-white/[0.08] rounded-lg text-white"
                required
              />
            </div>
          </div>

          {/* Applicable To */}
          <div>
            <label className="block text-sm font-medium text-white/60 mb-2">Applicable To</label>
            <select
              value={formData.applicableTo}
              onChange={(e) =>
                setFormData({ ...formData, applicableTo: e.target.value as 'all' | 'specific' })
              }
              className="w-full px-4 py-2 bg-white/[0.06] border border-white/[0.08] rounded-lg text-white"
            >
              <option value="all">All Products</option>
              <option value="specific">Specific Products</option>
            </select>
          </div>

          {formData.applicableTo === 'specific' && (
            <>
              <div>
                <label className="block text-sm font-medium text-white/60 mb-2">
                  Product Types
                </label>
                <div className="flex flex-wrap gap-3">
                  {PRODUCT_TYPE_OPTIONS.map((opt) => (
                    <label
                      key={opt.value}
                      className="flex items-center space-x-2 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={formData.productTypes.includes(opt.value)}
                        onChange={() => handleProductTypeToggle(opt.value)}
                        className="w-4 h-4"
                      />
                      <span className="text-sm text-white/80">{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-white/60 mb-2">
                  Specific Product IDs (comma separated)
                </label>
                <input
                  type="text"
                  value={formData.productIdsText}
                  onChange={(e) => setFormData({ ...formData, productIdsText: e.target.value })}
                  className="w-full px-4 py-2 bg-white/[0.06] border border-white/[0.08] rounded-lg text-white"
                  placeholder="id1, id2, id3"
                />
              </div>
            </>
          )}

          {/* Usage Limit */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white/60 mb-2">Usage Limit</label>
              <select
                value={formData.usageLimit}
                onChange={(e) =>
                  setFormData({ ...formData, usageLimit: e.target.value as DiscountUsageLimit })
                }
                className="w-full px-4 py-2 bg-white/[0.06] border border-white/[0.08] rounded-lg text-white"
              >
                <option value="unlimited">Unlimited</option>
                <option value="limited">Limited</option>
              </select>
            </div>

            {formData.usageLimit === 'limited' && (
              <div>
                <label className="block text-sm font-medium text-white/60 mb-2">Max Uses <span className="text-red-400">*</span></label>
                <input
                  type="number"
                  min="1"
                  value={formData.maxUses}
                  onChange={(e) =>
                    setFormData({ ...formData, maxUses: parseInt(e.target.value) || 0 })
                  }
                  className="w-full px-4 py-2 bg-white/[0.06] border border-white/[0.08] rounded-lg text-white"
                  required
                />
              </div>
            )}
          </div>

          {/* Max Uses Per User */}
          <div>
            <label className="block text-sm font-medium text-white/60 mb-2">
              Max Uses Per User (optional, 0 = unlimited)
            </label>
            <input
              type="number"
              min="0"
              value={formData.maxUsesPerUser}
              onChange={(e) =>
                setFormData({ ...formData, maxUsesPerUser: parseInt(e.target.value) || 0 })
              }
              className="w-full px-4 py-2 bg-white/[0.06] border border-white/[0.08] rounded-lg text-white"
            />
          </div>

          {/* Deadline */}
          <div>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.hasDeadline}
                onChange={(e) => setFormData({ ...formData, hasDeadline: e.target.checked })}
                className="w-4 h-4"
              />
              <span className="text-sm text-white/60">Has Deadline</span>
            </label>
          </div>

          {formData.hasDeadline && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-white/60 mb-2">Start Date</label>
                <input
                  type="datetime-local"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="w-full px-4 py-2 bg-white/[0.06] border border-white/[0.08] rounded-lg text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/60 mb-2">End Date</label>
                <input
                  type="datetime-local"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="w-full px-4 py-2 bg-white/[0.06] border border-white/[0.08] rounded-lg text-white"
                />
              </div>
            </div>
          )}

          {/* Minimum Order Amount */}
          <div>
            <label className="block text-sm font-medium text-white/60 mb-2">
              Minimum Order Amount (optional, 0 = none)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.minimumOrderAmount}
              onChange={(e) =>
                setFormData({ ...formData, minimumOrderAmount: parseFloat(e.target.value) || 0 })
              }
              className="w-full px-4 py-2 bg-white/[0.06] border border-white/[0.08] rounded-lg text-white"
            />
          </div>

          {/* Is Active */}
          <div>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="w-4 h-4"
              />
              <span className="text-sm text-white/60">Active</span>
            </label>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-4 pt-4 border-t border-white/[0.06] bg-white/[0.10] -mx-6 px-6 py-4 flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 text-white/40 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-2 rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50"
            >
              {saving
                ? 'Saving...'
                : discountCode
                ? 'Update Code'
                : 'Create Code'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DiscountCodesPage;
