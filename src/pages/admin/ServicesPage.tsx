import React, { useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import LinkInput from '../../components/admin/LinkInput';
import { useServices } from '../../hooks/useServices';
import { serviceService } from '../../lib/firebase/services';
import { Service } from '../../lib/firebase/types';
import { Plus, Edit, Trash2 } from 'lucide-react';

// Icon mapping
const iconOptions = [
  'Zap',
  'Music',
  'Edit',
  'Mic',
  'BarChart3',
  'Headphones',
  'Radio',
  'Sliders',
  'Volume2',
  'Wand2',
];

const ServicesPage: React.FC = () => {
  const { services, loading } = useServices();
  const [showModal, setShowModal] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);

  const handleCreate = () => {
    setEditingService(null);
    setShowModal(true);
  };

  const handleEdit = (service: Service) => {
    setEditingService(service);
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this service?')) return;

    try {
      await serviceService.deleteService(id);
      alert('Service deleted successfully');
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
            <h1 className="text-3xl font-bold text-white">Services Management</h1>
            <p className="text-white/40 mt-2">Manage your service offerings</p>
          </div>
          <button
            onClick={handleCreate}
            className="bg-gradient-to-r from-red-600 to-orange-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-red-700 hover:to-orange-700 transition-all flex items-center space-x-2"
          >
            <Plus size={20} />
            <span>Add Service</span>
          </button>
        </div>

        {/* Services Table */}
        <div className="bg-white/[0.08] border border-white/[0.06] rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/[0.06]">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white/60">
                    Service
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white/60">
                    Rate
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white/60">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white/60">
                    Inquiries
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
                      Loading services...
                    </td>
                  </tr>
                ) : services.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-white/40">
                      No services yet. Create your first service!
                    </td>
                  </tr>
                ) : (
                  services.map((service) => (
                    <tr key={service.id} className="hover:bg-white/[0.06]">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {service.coverUrl ? (
                            <img
                              src={service.coverUrl}
                              alt={service.name}
                              className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                            />
                          ) : (
                            <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${service.gradient} flex-shrink-0`} />
                          )}
                          <div>
                            <p className="font-medium text-white">{service.name}</p>
                            <p className="text-sm text-white/40 line-clamp-1">{service.description}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-white font-medium">€{service.rate}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2 py-1 rounded text-sm ${
                            service.status === 'published'
                              ? 'bg-green-500/20 text-green-400'
                              : service.status === 'draft'
                              ? 'bg-yellow-500/20 text-yellow-400'
                              : 'bg-white/[0.06] text-white/40'
                          }`}
                        >
                          {service.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-white/60">{service.inquiries}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleEdit(service)}
                            className="p-2 text-white/40 hover:text-blue-400 transition-colors"
                            title="Edit"
                          >
                            <Edit size={18} />
                          </button>
                          <button
                            onClick={() => handleDelete(service.id)}
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

      {/* Service Form Modal */}
      {showModal && (
        <ServiceFormModal
          service={editingService}
          onClose={() => setShowModal(false)}
          onSave={() => {
            setShowModal(false);
            setEditingService(null);
          }}
        />
      )}
    </AdminLayout>
  );
};

interface ServiceFormModalProps {
  service: Service | null;
  onClose: () => void;
  onSave: () => void;
}

const ServiceFormModal: React.FC<ServiceFormModalProps> = ({ service, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: service?.name || '',
    description: service?.description || '',
    rate: service?.rate || 100,
    price48h: service?.price48h || undefined,
    price72h: service?.price72h || undefined,
    price7days: service?.price7days || undefined,
    cta: service?.cta || 'Get Started',
    gradient: service?.gradient || 'from-red-600 to-orange-600',
    icon: service?.icon || 'Zap',
    coverUrl: service?.coverUrl || '',
    downloadUrl: service?.downloadUrl || '',
    slug: service?.slug || '',
    metaTitle: service?.metaTitle || '',
    metaDescription: service?.metaDescription || '',
    status: service?.status || 'draft',
    featured: service?.featured || false,
  });
  const [saving, setSaving] = useState(false);

  // Update form data when service prop changes (for editing)
  React.useEffect(() => {
    if (service) {
      setFormData({
        name: service.name || '',
        description: service.description || '',
        rate: service.rate || 100,
        price48h: service.price48h || undefined,
        price72h: service.price72h || undefined,
        price7days: service.price7days || undefined,
        cta: service.cta || 'Get Started',
        gradient: service.gradient || 'from-red-600 to-orange-600',
        icon: service.icon || 'Zap',
        coverUrl: service.coverUrl || '',
        downloadUrl: service.downloadUrl || '',
        slug: service.slug || '',
        metaTitle: service.metaTitle || '',
        metaDescription: service.metaDescription || '',
        status: service.status || 'draft',
        featured: service.featured || false,
      });
    }
  }, [service]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      // Ensure rate is a valid number
      const rate = typeof formData.rate === 'string'
        ? parseFloat(formData.rate)
        : formData.rate;

      if (isNaN(rate) || rate < 0) {
        alert('Please enter a valid rate');
        setSaving(false);
        return;
      }

      const serviceData: any = {
        name: formData.name,
        description: formData.description,
        rate: rate,
        price48h: formData.price48h || undefined,
        price72h: formData.price72h || undefined,
        price7days: formData.price7days || undefined,
        cta: formData.cta,
        gradient: formData.gradient,
        icon: formData.icon,
        coverUrl: formData.coverUrl || undefined,
        downloadUrl: formData.downloadUrl || undefined,
        slug: formData.slug || formData.name.toLowerCase().replace(/\s+/g, '-'),
        metaTitle: formData.metaTitle || undefined,
        metaDescription: formData.metaDescription || undefined,
        status: formData.status,
        featured: formData.featured,
      };

      if (service) {
        await serviceService.updateService(service.id, serviceData);
        alert('Service updated successfully');
      } else {
        await serviceService.createService(serviceData);
        alert('Service created successfully');
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
            {service ? 'Edit Service' : 'Add New Service'}
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
              <label className="block text-sm font-medium text-white/60 mb-2">Rate (€) <span className="text-red-400">*</span></label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.rate}
                onChange={(e) => setFormData({ ...formData, rate: parseFloat(e.target.value) || 0 })}
                className="w-full px-4 py-2 bg-white/[0.06] border border-white/[0.08] rounded-lg text-white"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-white/60 mb-2">48H Price (€)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.price48h || ''}
                onChange={(e) => setFormData({ ...formData, price48h: e.target.value ? parseFloat(e.target.value) : undefined })}
                className="w-full px-4 py-2 bg-white/[0.06] border border-white/[0.08] rounded-lg text-white"
                placeholder="Optional"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/60 mb-2">72H Price (€)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.price72h || ''}
                onChange={(e) => setFormData({ ...formData, price72h: e.target.value ? parseFloat(e.target.value) : undefined })}
                className="w-full px-4 py-2 bg-white/[0.06] border border-white/[0.08] rounded-lg text-white"
                placeholder="Optional"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/60 mb-2">7 Days Price (€)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.price7days || ''}
                onChange={(e) => setFormData({ ...formData, price7days: e.target.value ? parseFloat(e.target.value) : undefined })}
                className="w-full px-4 py-2 bg-white/[0.06] border border-white/[0.08] rounded-lg text-white"
                placeholder="Optional"
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
              <label className="block text-sm font-medium text-white/60 mb-2">CTA Button Text <span className="text-red-400">*</span></label>
              <input
                type="text"
                value={formData.cta}
                onChange={(e) => setFormData({ ...formData, cta: e.target.value })}
                className="w-full px-4 py-2 bg-white/[0.06] border border-white/[0.08] rounded-lg text-white"
                placeholder="Get Started"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/60 mb-2">Icon</label>
              <select
                value={formData.icon}
                onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                className="w-full px-4 py-2 bg-white/[0.06] border border-white/[0.08] rounded-lg text-white"
              >
                {iconOptions.map((icon) => (
                  <option key={icon} value={icon}>
                    {icon}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-white/60 mb-2">Gradient</label>
            <select
              value={formData.gradient}
              onChange={(e) => setFormData({ ...formData, gradient: e.target.value })}
              className="w-full px-4 py-2 bg-white/[0.06] border border-white/[0.08] rounded-lg text-white"
            >
              <option value="from-red-600 to-orange-600">Red to Orange</option>
              <option value="from-blue-600 to-cyan-600">Blue to Cyan</option>
              <option value="from-orange-600 to-red-600">Orange to Red</option>
              <option value="from-green-600 to-emerald-600">Green to Emerald</option>
              <option value="from-indigo-600 to-purple-600">Indigo to Purple</option>
            </select>
          </div>

          <div>
            <LinkInput
              label="Cover Image (optional)"
              name="coverUrl"
              type="image"
              defaultValue={formData.coverUrl}
              onChange={(url) => setFormData((prev) => ({ ...prev, coverUrl: url }))}
              placeholder="https://cloud.internedata.nl/index.php/s/..."
            />
            {formData.coverUrl && (
              <div className="mt-2 flex items-center gap-3">
                <img
                  src={formData.coverUrl}
                  alt="Cover preview"
                  className="w-16 h-16 rounded-xl object-cover border border-white/[0.1]"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
                <p className="text-xs text-white/40">Cover preview</p>
              </div>
            )}
          </div>

          <div>
            <LinkInput
              label="Download Link (optional)"
              name="downloadUrl"
              type="link"
              defaultValue={formData.downloadUrl}
              onChange={(url) => setFormData((prev) => ({ ...prev, downloadUrl: url }))}
              placeholder="https://cloud.internedata.nl/index.php/s/... (add /download for internedata.nl links)"
            />
            <p className="text-xs text-white/40 mt-2">For internedata.nl links, add '/download' at the end</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white/60 mb-2">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as Service['status'] })}
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

          <div>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.featured}
                onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                className="w-4 h-4"
              />
              <span className="text-sm text-white/60">Featured Service</span>
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
              className="bg-gradient-to-r from-red-600 to-orange-600 text-white px-6 py-2 rounded-lg font-semibold hover:from-red-700 hover:to-orange-700 transition-all disabled:opacity-50"
            >
              {saving ? 'Saving...' : service ? 'Update Service' : 'Create Service'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ServicesPage;
