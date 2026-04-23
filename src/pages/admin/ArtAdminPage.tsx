import React, { useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import LinkInput from '../../components/admin/LinkInput';
import { useArt } from '../../hooks/useArt';
import { toDirectUrl } from '../../lib/utils/urlUtils';
import { artService } from '../../lib/firebase/services';
import { Art } from '../../lib/firebase/types';
import { Plus, Edit, Trash2, Upload } from 'lucide-react';

const categories = [
  'Digital Art',
  'Cover Design',
  'Visual Art',
  'Illustration',
  'Photography',
];

const ArtAdminPage: React.FC = () => {
  const { art, loading } = useArt();
  const [showModal, setShowModal] = useState(false);
  const [editingArt, setEditingArt] = useState<Art | null>(null);

  const handleCreate = () => {
    setEditingArt(null);
    setShowModal(true);
  };

  const handleEdit = (artItem: Art) => {
    setEditingArt(artItem);
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this art?')) return;

    try {
      await artService.deleteArt(id);
      alert('Art deleted successfully');
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
            <h1 className="text-3xl font-bold text-white">Art Management</h1>
            <p className="text-white/40 mt-2">Manage your art portfolio</p>
          </div>
          <button
            onClick={handleCreate}
            className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-all flex items-center space-x-2"
          >
            <Plus size={20} />
            <span>Add Art</span>
          </button>
        </div>

        {/* Art Table */}
        <div className="bg-white/[0.08] border border-white/[0.06] rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/[0.06]">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white/60">
                    Title
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white/60">
                    Artist
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white/60">
                    Category
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white/60">
                    Views
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white/60">
                    Likes
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-white/60">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06]">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-white/40">
                      Loading art...
                    </td>
                  </tr>
                ) : art.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-white/40">
                      No art yet. Create your first art piece!
                    </td>
                  </tr>
                ) : (
                  art.map((artItem) => (
                    <tr key={artItem.id} className="hover:bg-white/[0.06]">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-white">{artItem.title}</p>
                          <p className="text-sm text-white/40">{artItem.medium}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-white">{artItem.artist}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-white/60">{artItem.category}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-white">{artItem.views}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-white">{artItem.likes}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleEdit(artItem)}
                            className="p-2 text-white/40 hover:text-blue-400 transition-colors"
                            title="Edit"
                          >
                            <Edit size={18} />
                          </button>
                          <button
                            onClick={() => handleDelete(artItem.id)}
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

      {/* Art Form Modal */}
      {showModal && (
        <ArtFormModal
          art={editingArt}
          onClose={() => setShowModal(false)}
          onSave={() => {
            setShowModal(false);
            setEditingArt(null);
          }}
        />
      )}
    </AdminLayout>
  );
};

interface ArtFormModalProps {
  art: Art | null;
  onClose: () => void;
  onSave: () => void;
}

const artTypes = ['Painting', 'Hardware', 'Furniture', 'Clothing'] as const;
const subtypesByType: Record<string, string[]> = {
  Painting: ['Acrylic', 'Oil', 'Watercolor', 'Digital', 'Mixed Media'],
  Hardware: ['Sculpture', 'Installation', 'Mechanical', 'Other'],
  Furniture: ['Chair', 'Table', 'Cabinet', 'Decor', 'Other'],
  Clothing: ['Jacket', 'Bomber Jacket', 'Jeans', 'Leather Jacket', 'Belt', 'Cap', 'Sunglasses', 'Other'],
};

const ArtFormModal: React.FC<ArtFormModalProps> = ({ art, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    title: art?.title || '',
    description: art?.description || '',
    artist: art?.artist || '',
    medium: art?.medium || '',
    year: art?.year || new Date().getFullYear(),
    category: art?.category || 'Digital Art',
    image: art?.image || '',
    gallery: art?.gallery || [],
    slug: art?.slug || '',
    metaTitle: art?.metaTitle || '',
    metaDescription: art?.metaDescription || '',
    status: art?.status || 'draft',
    featured: art?.featured || false,
    type: art?.type || 'Painting' as const,
    subtype: art?.subtype || '',
    forSale: art?.forSale !== undefined ? art.forSale : true,
    price: art?.price || 0,
    isFree: art?.isFree !== undefined ? art.isFree : false,
  });
  const [saving, setSaving] = useState(false);
  const [galleryInput, setGalleryInput] = useState('');

  // Update form data when art prop changes (for editing)
  React.useEffect(() => {
    if (art) {
      setFormData({
        title: art.title || '',
        description: art.description || '',
        artist: art.artist || '',
        medium: art.medium || '',
        year: art.year || new Date().getFullYear(),
        category: art.category || 'Digital Art',
        image: art.image || '',
        gallery: art.gallery || [],
        slug: art.slug || '',
        metaTitle: art.metaTitle || '',
        metaDescription: art.metaDescription || '',
        status: art.status || 'draft',
        featured: art.featured || false,
        type: art.type || 'Painting',
        subtype: art.subtype || '',
        forSale: art.forSale !== undefined ? art.forSale : true,
        price: art.price || 0,
        isFree: art.isFree !== undefined ? art.isFree : false,
      });
      setGalleryInput('');
    }
  }, [art]);

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
      const year = typeof formData.year === 'string'
        ? parseInt(formData.year)
        : formData.year;

      if (isNaN(year) || year < 1900 || year > new Date().getFullYear() + 1) {
        alert('Please enter a valid year');
        setSaving(false);
        return;
      }

      if (!formData.image.trim()) {
        alert('Please provide a main image URL');
        setSaving(false);
        return;
      }

      const artData: any = {
        title: formData.title,
        description: formData.description,
        artist: formData.artist,
        medium: formData.medium,
        year: year,
        category: formData.category,
        image: formData.image.endsWith('/download') ? formData.image : `${formData.image}/download`,
        gallery: formData.gallery.length > 0 ? formData.gallery.map(url => url.endsWith('/download') ? url : `${url}/download`) : undefined,
        slug: formData.slug || formData.title.toLowerCase().replace(/\s+/g, '-'),
        metaTitle: formData.metaTitle || undefined,
        metaDescription: formData.metaDescription || undefined,
        status: formData.status,
        featured: formData.featured,
        type: formData.type,
        subtype: formData.subtype || undefined,
        forSale: formData.forSale,
        price: formData.forSale && !formData.isFree ? formData.price : undefined,
        isFree: formData.isFree,
        stock: 1,
      };

      if (art) {
        await artService.updateArt(art.id, artData);
        alert('Art updated successfully');
      } else {
        await artService.createArt(artData);
        alert('Art created successfully');
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
            {art ? 'Edit Art' : 'Add New Art'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white/60 mb-2">Title <span className="text-red-400">*</span></label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2 bg-white/[0.06] border border-white/[0.08] rounded-lg text-white"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/60 mb-2">Artist <span className="text-red-400">*</span></label>
              <input
                type="text"
                value={formData.artist}
                onChange={(e) => setFormData({ ...formData, artist: e.target.value })}
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white/60 mb-2">Medium <span className="text-red-400">*</span></label>
              <input
                type="text"
                value={formData.medium}
                onChange={(e) => setFormData({ ...formData, medium: e.target.value })}
                className="w-full px-4 py-2 bg-white/[0.06] border border-white/[0.08] rounded-lg text-white"
                placeholder="e.g., Digital, Acrylic"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/60 mb-2">Year <span className="text-red-400">*</span></label>
              <input
                type="number"
                min="1900"
                max={new Date().getFullYear() + 1}
                value={formData.year}
                onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) || new Date().getFullYear() })}
                className="w-full px-4 py-2 bg-white/[0.06] border border-white/[0.08] rounded-lg text-white"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-white/60 mb-2">Category <span className="text-red-400">*</span></label>
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
                onChange={(e) => setFormData({ ...formData, status: e.target.value as Art['status'] })}
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
                placeholder="auto-generated from title"
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

          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/[0.06]">
            <div>
              <label className="block text-sm font-medium text-white/60 mb-2">Type</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as any, subtype: '' })}
                className="w-full px-4 py-2 bg-white/[0.06] border border-white/[0.08] rounded-lg text-white"
              >
                {artTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-white/60 mb-2">Subtype (Optional)</label>
              <select
                value={formData.subtype}
                onChange={(e) => setFormData({ ...formData, subtype: e.target.value })}
                className="w-full px-4 py-2 bg-white/[0.06] border border-white/[0.08] rounded-lg text-white"
              >
                <option value="">Select a subtype...</option>
                {subtypesByType[formData.type]?.map((subtype) => (
                  <option key={subtype} value={subtype}>
                    {subtype}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-3 pt-4">
            <div>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={!formData.forSale}
                  onChange={(e) => setFormData({ ...formData, forSale: !e.target.checked })}
                  className="w-4 h-4"
                />
                <span className="text-sm text-white/60">Not For Sale</span>
              </label>
            </div>

            {formData.forSale && (
              <>
                <div>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.isFree}
                      onChange={(e) => setFormData({ ...formData, isFree: e.target.checked })}
                      className="w-4 h-4"
                    />
                    <span className="text-sm text-white/60">Free</span>
                  </label>
                </div>

                {!formData.isFree && (
                  <div>
                    <label className="block text-sm font-medium text-white/60 mb-2">Price</label>
                    <div className="flex items-center gap-2">
                      <span className="text-white/60">€</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                        className="flex-1 px-4 py-2 bg-white/[0.06] border border-white/[0.08] rounded-lg text-white"
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="pt-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.featured}
                onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                className="w-4 h-4"
              />
              <span className="text-sm text-white/60">Featured Art</span>
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
              {saving ? 'Saving...' : art ? 'Update Art' : 'Create Art'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ArtAdminPage;
