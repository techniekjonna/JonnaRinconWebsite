import React, { useState } from 'react';
import { Timestamp } from 'firebase/firestore';
import AdminLayout from '../../components/admin/AdminLayout';
import LinkInput from '../../components/admin/LinkInput';
import { useMerchandise } from '../../hooks/useMerchandise';
import { merchandiseService } from '../../lib/firebase/services';
import { Merchandise, MerchandiseSize } from '../../lib/firebase/types';
import { toDirectUrl } from '../../lib/utils/urlUtils';
import { Plus, Edit, Trash2, X, Upload } from 'lucide-react';

const categories = [
  'Clothing',
  'Accessories',
  'Home',
  'Other',
];

const MerchandiseAdminPage: React.FC = () => {
  const { merchandise, loading } = useMerchandise();
  const [showModal, setShowModal] = useState(false);
  const [editingMerchandise, setEditingMerchandise] = useState<Merchandise | null>(null);

  const handleCreate = () => {
    setEditingMerchandise(null);
    setShowModal(true);
  };

  const handleEdit = (merchandiseItem: Merchandise) => {
    setEditingMerchandise(merchandiseItem);
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this merchandise?')) return;

    try {
      await merchandiseService.deleteMerchandise(id);
      alert('Merchandise deleted successfully');
    } catch (error: any) {
      alert(error.message);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Merchandise Management</h1>
            <p className="text-white/40 mt-2">Manage your merchandise products</p>
          </div>
          <button
            onClick={handleCreate}
            className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-all flex items-center space-x-2"
          >
            <Plus size={20} />
            <span>Add Merchandise</span>
          </button>
        </div>

        {/* Merchandise Table */}
        <div className="bg-white/[0.08] border border-white/[0.06] rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/[0.06]">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white/60">
                    Name
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white/60">
                    Category
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white/60">
                    Price
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white/60">
                    Status
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-white/60">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06]">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-white/40">
                      Loading merchandise...
                    </td>
                  </tr>
                ) : merchandise.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-white/40">
                      No merchandise yet. Create your first product!
                    </td>
                  </tr>
                ) : (
                  merchandise.map((merchandiseItem) => (
                    <tr key={merchandiseItem.id} className="hover:bg-white/[0.06]">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-white">{merchandiseItem.name}</p>
                          <p className="text-sm text-white/40">{merchandiseItem.description?.substring(0, 50)}...</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-white/60">{merchandiseItem.category}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-white">${merchandiseItem.price.toFixed(2)}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          merchandiseItem.status === 'published'
                            ? 'bg-green-500/20 text-green-300'
                            : merchandiseItem.status === 'draft'
                            ? 'bg-yellow-500/20 text-yellow-300'
                            : 'bg-red-500/20 text-red-300'
                        }`}>
                          {merchandiseItem.status.charAt(0).toUpperCase() + merchandiseItem.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleEdit(merchandiseItem)}
                            className="p-2 text-white/40 hover:text-blue-400 transition-colors"
                            title="Edit"
                          >
                            <Edit size={18} />
                          </button>
                          <button
                            onClick={() => handleDelete(merchandiseItem.id)}
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

      {/* Merchandise Form Modal */}
      {showModal && (
        <MerchandiseFormModal
          merchandise={editingMerchandise}
          onClose={() => setShowModal(false)}
          onSave={() => {
            setShowModal(false);
            setEditingMerchandise(null);
          }}
        />
      )}
    </AdminLayout>
  );
};

interface MerchandiseFormModalProps {
  merchandise: Merchandise | null;
  onClose: () => void;
  onSave: () => void;
}

const MerchandiseFormModal: React.FC<MerchandiseFormModalProps> = ({ merchandise, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: merchandise?.name || '',
    description: merchandise?.description || '',
    price: merchandise?.price || 0,
    category: merchandise?.category || 'Clothing',
    image: merchandise?.image || '',
    gallery: merchandise?.gallery || [],
    slug: merchandise?.slug || '',
    metaTitle: merchandise?.metaTitle || '',
    metaDescription: merchandise?.metaDescription || '',
    status: merchandise?.status || 'draft',
    featured: merchandise?.featured || false,
    totalStock: merchandise?.totalStock || 0,
    sizes: merchandise?.sizes || [],
    isPreOrder: merchandise?.isPreOrder || false,
    preOrderDeadline: merchandise?.preOrderDeadline || '',
    showJeighteenLogo: merchandise?.showJeighteenLogo || false,
    showJonnaRinconLogo: merchandise?.showJonnaRinconLogo || false,
  });
  const [saving, setSaving] = useState(false);
  const [galleryInput, setGalleryInput] = useState('');
  const [sizeInput, setSizeInput] = useState({ name: '', stock: 0 });

  // Helper function to check if URL will have /download appended
  const willHaveDownloadAppended = (url: string): boolean => {
    return url.includes('/index.php/s/') && !url.endsWith('/download');
  };

  // Update form data when merchandise prop changes (for editing)
  React.useEffect(() => {
    if (merchandise) {
      // Convert Timestamp to datetime-local string format if it exists
      let preOrderDeadlineStr = '';
      if (merchandise.preOrderDeadline) {
        try {
          const date = merchandise.preOrderDeadline.toDate ? merchandise.preOrderDeadline.toDate() : merchandise.preOrderDeadline;
          const isoString = new Date(date).toISOString().slice(0, 16);
          preOrderDeadlineStr = isoString;
        } catch (err) {
          console.error('Error converting preOrderDeadline:', err);
        }
      }

      setFormData({
        name: merchandise.name || '',
        description: merchandise.description || '',
        price: merchandise.price || 0,
        category: merchandise.category || 'Clothing',
        image: merchandise.image || '',
        gallery: merchandise.gallery || [],
        slug: merchandise.slug || '',
        metaTitle: merchandise.metaTitle || '',
        metaDescription: merchandise.metaDescription || '',
        status: merchandise.status || 'draft',
        featured: merchandise.featured || false,
        totalStock: merchandise.totalStock || 0,
        sizes: merchandise.sizes || [],
        isPreOrder: merchandise.isPreOrder || false,
        preOrderDeadline: preOrderDeadlineStr,
        showJeighteenLogo: merchandise.showJeighteenLogo || false,
        showJonnaRinconLogo: merchandise.showJonnaRinconLogo || false,
      });
      setGalleryInput('');
      setSizeInput({ name: '', stock: 0 });
    }
  }, [merchandise]);

  const handleAddGalleryImage = () => {
    if (galleryInput.trim()) {
      const transformedUrl = toDirectUrl(galleryInput.trim());
      setFormData({
        ...formData,
        gallery: [...formData.gallery, transformedUrl],
      });
      setGalleryInput('');
    }
  };

  const handleRemoveGalleryImage = (index: number) => {
    setFormData({
      ...formData,
      gallery: formData.gallery.filter((_, i) => i !== index),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const price = typeof formData.price === 'string'
        ? parseFloat(formData.price)
        : formData.price;

      if (isNaN(price) || price < 0) {
        alert('Please enter a valid price');
        setSaving(false);
        return;
      }

      if (!formData.name.trim()) {
        alert('Please provide a product name');
        setSaving(false);
        return;
      }

      if (!formData.image.trim()) {
        alert('Please provide a main image URL');
        setSaving(false);
        return;
      }

      // Convert preOrderDeadline string to Timestamp if it exists
      let preOrderDeadline: Timestamp | undefined = undefined;
      if (formData.isPreOrder && formData.preOrderDeadline) {
        try {
          const date = new Date(formData.preOrderDeadline);
          preOrderDeadline = Timestamp.fromDate(date);
        } catch (err) {
          console.error('Invalid pre-order deadline:', err);
        }
      }

      const merchandiseData: any = {
        name: formData.name,
        description: formData.description,
        price: price,
        category: formData.category,
        image: toDirectUrl(formData.image),
        gallery: formData.gallery.length > 0 ? formData.gallery : undefined,
        slug: formData.slug || formData.name.toLowerCase().replace(/\s+/g, '-'),
        metaTitle: formData.metaTitle || undefined,
        metaDescription: formData.metaDescription || undefined,
        status: formData.status,
        featured: formData.featured,
        totalStock: formData.totalStock || 0,
        sizes: formData.sizes.length > 0 ? formData.sizes : undefined,
        isPreOrder: formData.isPreOrder,
        preOrderDeadline: preOrderDeadline,
        showJeighteenLogo: formData.showJeighteenLogo,
        showJonnaRinconLogo: formData.showJonnaRinconLogo,
        sold: merchandise?.sold || 0,
      };

      if (merchandise) {
        await merchandiseService.updateMerchandise(merchandise.id, merchandiseData);
        alert('Merchandise updated successfully');
      } else {
        await merchandiseService.createMerchandise(merchandiseData);
        alert('Merchandise created successfully');
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
            {merchandise ? 'Edit Merchandise' : 'Add New Merchandise'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white/60 mb-2">Name <span className="text-red-400">*</span></label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 bg-white/[0.06] border border-white/[0.08] rounded-lg text-white"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/60 mb-2">Price <span className="text-red-400">*</span></label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                className="w-full px-4 py-2 bg-white/[0.06] border border-white/[0.08] rounded-lg text-white"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-white/60 mb-2">Description <span className="text-red-400">*</span></label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 bg-white/[0.06] border border-white/[0.08] rounded-lg text-white min-h-[100px] resize-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white/60 mb-2">Category</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-4 py-2 bg-white/[0.06] border border-white/[0.08] rounded-lg text-white"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <LinkInput
            label="Main Image URL"
            name="image"
            type="image"
            onChange={(url) => setFormData({ ...formData, image: url })}
            defaultValue={formData.image}
            placeholder="https://example.com/image.jpg"
            required
          />

          {formData.image && willHaveDownloadAppended(formData.image) && (
            <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
              <p className="text-yellow-400 text-sm font-semibold">
                <strong>Final URL:</strong> {toDirectUrl(formData.image)}
              </p>
              <p className="text-yellow-400 text-xs mt-1">⚠️ /download will be auto-appended when saving</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-white/60 mb-2">Gallery Images</label>
            <div className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="url"
                  value={galleryInput}
                  onChange={(e) => setGalleryInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddGalleryImage();
                    }
                  }}
                  className="flex-1 px-4 py-2 bg-white/[0.06] border border-white/[0.08] rounded-lg text-white"
                  placeholder="Add gallery image URL..."
                />
                <button
                  type="button"
                  onClick={() => {
                    // Upload wiring comes later
                  }}
                  className="px-4 py-2 bg-white/[0.08] border border-white/[0.1] rounded-lg text-white/70 hover:text-white hover:bg-white/[0.12] transition-colors inline-flex items-center gap-2"
                  title="Upload file"
                >
                  <Upload size={14} />
                  <span className="text-xs font-semibold uppercase tracking-wider hidden sm:inline">Upload</span>
                </button>
                <button
                  type="button"
                  onClick={handleAddGalleryImage}
                  className="px-4 py-2 bg-white/[0.12] border border-white/[0.08] rounded-lg text-white/60 hover:text-white transition-colors"
                >
                  Add
                </button>
              </div>
              {formData.gallery.length > 0 && (
                <div className="space-y-2">
                  {formData.gallery.map((url, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between px-4 py-2 bg-white/[0.06] border border-white/[0.08] rounded-lg"
                    >
                      <span className="text-sm text-white/60 truncate">{url}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveGalleryImage(index)}
                        className="ml-2 text-red-400 hover:text-red-300 transition-colors flex-shrink-0"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white/60 mb-2">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as Merchandise['status'] })}
                className="w-full px-4 py-2 bg-white/[0.06] border border-white/[0.08] rounded-lg text-white"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-white/60 mb-2">Slug</label>
              <input
                type="text"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                className="w-full px-4 py-2 bg-white/[0.06] border border-white/[0.08] rounded-lg text-white"
                placeholder="auto-generated from name"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-white/60 mb-2">Meta Title (SEO)</label>
            <input
              type="text"
              value={formData.metaTitle}
              onChange={(e) => setFormData({ ...formData, metaTitle: e.target.value })}
              className="w-full px-4 py-2 bg-white/[0.06] border border-white/[0.08] rounded-lg text-white"
              placeholder="Optional"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white/60 mb-2">Meta Description (SEO)</label>
            <textarea
              value={formData.metaDescription}
              onChange={(e) => setFormData({ ...formData, metaDescription: e.target.value })}
              className="w-full px-4 py-2 bg-white/[0.06] border border-white/[0.08] rounded-lg text-white min-h-[80px] resize-none"
              placeholder="Optional"
            />
          </div>

          {/* Inventory Section */}
          <div className="pt-4 border-t border-white/[0.06] space-y-4">
            <div>
              <label className="block text-sm font-medium text-white/60 mb-2">Total Stock</label>
              <input
                type="number"
                min="0"
                value={formData.totalStock}
                onChange={(e) => setFormData({ ...formData, totalStock: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-2 bg-white/[0.06] border border-white/[0.08] rounded-lg text-white"
              />
            </div>

            {/* Sizes */}
            {formData.category === 'Clothing' && (
              <div>
                <label className="block text-sm font-medium text-white/60 mb-2">Sizes (Optional)</label>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Size (e.g., S, M, L)"
                      value={sizeInput.name}
                      onChange={(e) => setSizeInput({ ...sizeInput, name: e.target.value })}
                      className="flex-1 px-4 py-2 bg-white/[0.06] border border-white/[0.08] rounded-lg text-white"
                    />
                    <input
                      type="number"
                      min="0"
                      placeholder="Stock"
                      value={sizeInput.stock}
                      onChange={(e) => setSizeInput({ ...sizeInput, stock: parseInt(e.target.value) || 0 })}
                      className="w-20 px-4 py-2 bg-white/[0.06] border border-white/[0.08] rounded-lg text-white"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (sizeInput.name) {
                          setFormData({
                            ...formData,
                            sizes: [...formData.sizes, { name: sizeInput.name, stock: sizeInput.stock }],
                          });
                          setSizeInput({ name: '', stock: 0 });
                        }
                      }}
                      className="px-4 py-2 bg-white/[0.12] border border-white/[0.08] rounded-lg text-white/60 hover:text-white transition-colors"
                    >
                      Add
                    </button>
                  </div>
                  {formData.sizes.length > 0 && (
                    <div className="space-y-2">
                      {formData.sizes.map((size, index) => (
                        <div key={index} className="flex items-center justify-between px-4 py-2 bg-white/[0.06] border border-white/[0.08] rounded-lg">
                          <span className="text-white/60">{size.name} - {size.stock} items</span>
                          <button
                            type="button"
                            onClick={() => setFormData({
                              ...formData,
                              sizes: formData.sizes.filter((_, i) => i !== index),
                            })}
                            className="text-red-400 hover:text-red-300 transition-colors"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Pre-order Section */}
          <div className="pt-4 space-y-3">
            <div>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.isPreOrder}
                  onChange={(e) => setFormData({ ...formData, isPreOrder: e.target.checked })}
                  className="w-4 h-4"
                />
                <span className="text-sm text-white/60">Pre-Order Item</span>
              </label>
            </div>

            {formData.isPreOrder && (
              <div>
                <label className="block text-sm font-medium text-white/60 mb-2">Pre-order Deadline</label>
                <input
                  type="datetime-local"
                  value={formData.preOrderDeadline}
                  onChange={(e) => setFormData({ ...formData, preOrderDeadline: e.target.value })}
                  className="w-full px-4 py-2 bg-white/[0.06] border border-white/[0.08] rounded-lg text-white"
                />
              </div>
            )}
          </div>

          {/* Brand Logos Section */}
          <div className="pt-4 border-t border-white/[0.06] space-y-3">
            <div>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.showJeighteenLogo}
                  onChange={(e) => setFormData({ ...formData, showJeighteenLogo: e.target.checked })}
                  className="w-4 h-4"
                />
                <span className="text-sm text-white/60">Show JEIGHTEEN Logo</span>
              </label>
            </div>

            <div>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.showJonnaRinconLogo}
                  onChange={(e) => setFormData({ ...formData, showJonnaRinconLogo: e.target.checked })}
                  className="w-4 h-4"
                />
                <span className="text-sm text-white/60">Show JONNA RINCON Logo</span>
              </label>
            </div>
          </div>

          <div className="pt-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.featured}
                onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                className="w-4 h-4"
              />
              <span className="text-sm text-white/60">Featured Merchandise</span>
            </label>
          </div>

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
              {saving ? 'Saving...' : merchandise ? 'Update Merchandise' : 'Create Merchandise'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MerchandiseAdminPage;
