import React, { useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { useContent } from '../../hooks/useContent';
import { contentService } from '../../lib/firebase/services';
import { Content, ContentType, ContentStatus, ContentBlock } from '../../lib/firebase/types';
import { Plus, Edit, Trash2, Eye, Heart, Share2, Calendar, X, Image, FileText as FileTextIcon, Upload } from 'lucide-react';
// Upload-Post API integration (browser-compatible)

const ContentPage: React.FC = () => {
  const { content, loading } = useContent();
  const [showModal, setShowModal] = useState(false);
  const [editingContent, setEditingContent] = useState<Content | null>(null);
  const [filterType, setFilterType] = useState<ContentType | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<ContentStatus | 'all'>('all');

  const handleCreate = () => {
    setEditingContent(null);
    setShowModal(true);
  };

  const handleEdit = (content: Content) => {
    setEditingContent(content);
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this content?')) return;

    try {
      await contentService.deleteContent(id);
      alert('Content deleted successfully');
    } catch (error: any) {
      alert(error.message);
    }
  };

  const filteredContent = content.filter((item) => {
    if (filterType !== 'all' && item.type !== filterType) return false;
    if (filterStatus !== 'all' && item.status !== filterStatus) return false;
    return true;
  });

  const getStatusColor = (status: ContentStatus) => {
    switch (status) {
      case 'published':
        return 'bg-green-500/20 text-green-400';
      case 'draft':
        return 'bg-gray-500/20 text-gray-400';
      case 'scheduled':
        return 'bg-blue-500/20 text-blue-400';
      case 'archived':
        return 'bg-orange-500/20 text-orange-400';
      default:
        return 'bg-gray-500/20 text-gray-400';
    }
  };

  const getTypeColor = (type: ContentType) => {
    switch (type) {
      case 'blog':
        return 'bg-purple-500/20 text-purple-400';
      case 'news':
        return 'bg-pink-500/20 text-pink-400';
      case 'tutorial':
        return 'bg-blue-500/20 text-blue-400';
      case 'press':
        return 'bg-yellow-500/20 text-yellow-400';
      default:
        return 'bg-gray-500/20 text-gray-400';
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Content Management</h1>
            <p className="text-gray-400 mt-2">Manage blog posts, news, tutorials, and press releases</p>
          </div>
          <button
            onClick={handleCreate}
            className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-all flex items-center space-x-2"
          >
            <Plus size={20} />
            <span>Create Content</span>
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
            <p className="text-gray-400 text-sm">Total Content</p>
            <p className="text-2xl font-bold text-white mt-1">{content.length}</p>
          </div>
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
            <p className="text-gray-400 text-sm">Published</p>
            <p className="text-2xl font-bold text-white mt-1">
              {content.filter((c) => c.status === 'published').length}
            </p>
          </div>
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
            <p className="text-gray-400 text-sm">Featured</p>
            <p className="text-2xl font-bold text-white mt-1">
              {content.filter((c) => c.featured).length}
            </p>
          </div>
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
            <p className="text-gray-400 text-sm">Total Views</p>
            <p className="text-2xl font-bold text-white mt-1">
              {content.reduce((sum, c) => sum + c.views, 0).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4">
          <div>
            <label className="text-sm text-gray-400 mb-2 block">Filter by Type</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as ContentType | 'all')}
              className="bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-purple-500"
            >
              <option value="all">All Types</option>
              <option value="blog">Blog</option>
              <option value="news">News</option>
              <option value="tutorial">Tutorial</option>
              <option value="press">Press</option>
            </select>
          </div>
          <div>
            <label className="text-sm text-gray-400 mb-2 block">Filter by Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as ContentStatus | 'all')}
              className="bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-purple-500"
            >
              <option value="all">All Status</option>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="scheduled">Scheduled</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </div>

        {/* Content Table */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-700">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                    Title
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                    Type
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                    Author
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                    Stats
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                    Published
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-300">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-400">
                      Loading content...
                    </td>
                  </tr>
                ) : filteredContent.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-400">
                      No content found. Create your first content piece!
                    </td>
                  </tr>
                ) : (
                  filteredContent.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-700/50">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          {item.featuredImage && (
                            <img
                              src={item.featuredImage}
                              alt={item.title}
                              className="w-12 h-12 rounded object-cover"
                            />
                          )}
                          <div>
                            <p className="font-medium text-white">{item.title}</p>
                            {item.excerpt && (
                              <p className="text-sm text-gray-400 truncate max-w-xs">
                                {item.excerpt}
                              </p>
                            )}
                            {item.featured && (
                              <span className="inline-block mt-1 px-2 py-0.5 bg-yellow-500/20 text-yellow-400 rounded text-xs">
                                Featured
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-sm capitalize ${getTypeColor(item.type)}`}>
                          {item.type}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-sm capitalize ${getStatusColor(item.status)}`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-300">
                        {item.authorName}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3 text-sm text-gray-400">
                          <div className="flex items-center space-x-1">
                            <Eye size={14} />
                            <span>{item.views}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Heart size={14} />
                            <span>{item.likes}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Share2 size={14} />
                            <span>{item.shares}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {item.publishedAt ? (
                          <div className="flex items-center space-x-1 text-sm text-gray-400">
                            <Calendar size={14} />
                            <span>
                              {new Date(item.publishedAt.toDate()).toLocaleDateString()}
                            </span>
                          </div>
                        ) : item.scheduledFor ? (
                          <div className="flex items-center space-x-1 text-sm text-blue-400">
                            <Calendar size={14} />
                            <span>
                              {new Date(item.scheduledFor.toDate()).toLocaleDateString()}
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-500">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleEdit(item)}
                            className="p-2 text-blue-400 hover:bg-blue-500/20 rounded transition-colors"
                            title="Edit"
                          >
                            <Edit size={18} />
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="p-2 text-red-400 hover:bg-red-500/20 rounded transition-colors"
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

      {/* Content Form Modal */}
      {showModal && (
        <ContentFormModal
          content={editingContent}
          onClose={() => setShowModal(false)}
          onSave={() => {
            setShowModal(false);
            setEditingContent(null);
          }}
        />
      )}
    </AdminLayout>
  );
};

interface ContentFormModalProps {
  content: Content | null;
  onClose: () => void;
  onSave: () => void;
}

const ContentFormModal: React.FC<ContentFormModalProps> = ({ content, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    title: content?.title || '',
    type: content?.type || 'blog' as ContentType,
    slug: content?.slug || '',
    excerpt: content?.excerpt || '',
    category: content?.category || '',
    tags: content?.tags?.join(', ') || '',
    featuredImage: content?.featuredImage || '',
    status: content?.status || 'draft' as ContentStatus,
    featured: content?.featured || false,
    metaTitle: content?.metaTitle || '',
    metaDescription: content?.metaDescription || '',
    metaKeywords: content?.metaKeywords?.join(', ') || '',
    contentText: content?.blocks?.find(b => b.type === 'text')?.content || '',
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InRlY2huaWVrQGpvbm5hcmluY29uLm5sIiwiZXhwIjo0OTI0NDk3Nzc0LCJqdGkiOiIwZjY2YjZmNS01OTg2LTRmMzYtYTVlMy01Yzc4MTFhYjJiOGUifQ.o_SjqVg7uIvu5TL9hsjkPD6_Io5CODTMi9XY7kM-f-0';

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      // Create FormData for browser upload
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);
      uploadFormData.append('user', 'jonnarincon');
      uploadFormData.append('title', formData.title || 'Content Image');

      // Upload directly to Upload-Post API
      const response = await fetch('https://api.upload-post.com/api/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Apikey ${API_KEY}`,
        },
        body: uploadFormData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Upload failed');
      }

      const result = await response.json();

      // Get URL from result and set it
      if (result && result.url) {
        setFormData((prev) => ({ ...prev, featuredImage: result.url }));
        alert('Image uploaded successfully!');
      }
    } catch (error: any) {
      console.error('Upload failed:', error);
      alert('Upload failed: ' + (error.message || 'Unknown error'));
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      // Create content blocks
      const blocks: ContentBlock[] = [];

      // Add text block if content exists
      if (formData.contentText.trim()) {
        blocks.push({
          id: '1',
          type: 'text',
          content: formData.contentText,
          order: 0,
        });
      }

      const contentData: any = {
        title: formData.title,
        type: formData.type,
        slug: formData.slug || formData.title.toLowerCase().replace(/\s+/g, '-'),
        excerpt: formData.excerpt,
        blocks: blocks,
        category: formData.category,
        tags: formData.tags.split(',').map((t) => t.trim()).filter(t => t),
        featuredImage: formData.featuredImage,
        status: formData.status,
        featured: formData.featured,
        metaTitle: formData.metaTitle,
        metaDescription: formData.metaDescription,
        metaKeywords: formData.metaKeywords.split(',').map((k) => k.trim()).filter(k => k),
      };

      if (content) {
        await contentService.updateContent(content.id, contentData);
        alert('Content updated successfully');
      } else {
        await contentService.createContent(contentData);
        alert('Content created successfully');
      }

      onSave();
    } catch (error: any) {
      alert(error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-gray-800 rounded-xl max-w-4xl w-full my-8">
        <div className="p-6 border-b border-gray-700 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">
            {content ? 'Edit Content' : 'Create New Content'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto">
          {/* Basic Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Basic Information</h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Type *</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as ContentType })}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                  required
                >
                  <option value="blog">Blog</option>
                  <option value="news">News</option>
                  <option value="tutorial">Tutorial</option>
                  <option value="press">Press</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Slug</label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                  placeholder="auto-generated from title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Category</label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                  placeholder="e.g., Music Production, Industry News"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Excerpt</label>
              <textarea
                value={formData.excerpt}
                onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                rows={2}
                placeholder="Short description of the content"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Tags (comma separated)</label>
              <input
                type="text"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                placeholder="production, beats, tutorial"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Featured Image</label>
              <div className="space-y-2">
                {/* Upload Button */}
                <div className="flex gap-2">
                  <label className="flex-1 cursor-pointer">
                    <div className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-medium transition-all">
                      <Upload size={18} />
                      {uploading ? 'Uploading...' : 'Upload Image'}
                    </div>
                    <input
                      type="file"
                      accept="image/*,video/*"
                      onChange={handleFileUpload}
                      className="hidden"
                      disabled={uploading}
                    />
                  </label>
                </div>
                {/* Or Manual URL Input */}
                <input
                  type="url"
                  value={formData.featuredImage}
                  onChange={(e) => setFormData({ ...formData, featuredImage: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                  placeholder="Or paste URL manually"
                />
                {/* Preview */}
                {formData.featuredImage && (
                  <div className="mt-2">
                    <img
                      src={formData.featuredImage}
                      alt="Preview"
                      className="w-full h-48 object-cover rounded-lg"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Content</h3>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Main Content *</label>
              <textarea
                value={formData.contentText}
                onChange={(e) => setFormData({ ...formData, contentText: e.target.value })}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500 font-mono text-sm"
                rows={10}
                placeholder="Write your content here..."
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Use markdown syntax for formatting. Rich text editor can be added later.
              </p>
            </div>
          </div>

          {/* SEO */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">SEO & Meta</h3>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Meta Title</label>
              <input
                type="text"
                value={formData.metaTitle}
                onChange={(e) => setFormData({ ...formData, metaTitle: e.target.value })}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                placeholder="Leave empty to use title"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Meta Description</label>
              <textarea
                value={formData.metaDescription}
                onChange={(e) => setFormData({ ...formData, metaDescription: e.target.value })}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                rows={2}
                placeholder="SEO description"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Meta Keywords (comma separated)</label>
              <input
                type="text"
                value={formData.metaKeywords}
                onChange={(e) => setFormData({ ...formData, metaKeywords: e.target.value })}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                placeholder="keyword1, keyword2, keyword3"
              />
            </div>
          </div>

          {/* Publishing */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Publishing</h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Status *</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as ContentStatus })}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="archived">Archived</option>
                </select>
              </div>

              <div className="flex items-end">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.featured}
                    onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                    className="w-4 h-4 rounded"
                  />
                  <span className="text-sm text-gray-300">Featured Content</span>
                </label>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 text-gray-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-2 rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50"
            >
              {saving ? 'Saving...' : content ? 'Update Content' : 'Create Content'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ContentPage;
