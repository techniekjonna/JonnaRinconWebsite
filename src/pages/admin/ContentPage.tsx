import React, { useState, useEffect, useCallback } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import {
  Plus, ChevronLeft, ChevronRight, X, Upload, Clock,
  Instagram, Youtube, Calendar as CalendarIcon, Send, Trash2,
  Eye, RefreshCw, Image, Film, Type, Edit, CheckCircle, AlertCircle,
} from 'lucide-react';

// Upload-Post API configuration
const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InRlY2huaWVrQGpvbm5hcmluY29uLm5sIiwiZXhwIjo0OTI0NDk3Nzc0LCJqdGkiOiIwZjY2YjZmNS01OTg2LTRmMzYtYTVlMy01Yzc4MTFhYjJiOGUifQ.o_SjqVg7uIvu5TL9hsjkPD6_Io5CODTMi9XY7kM-f-0';
const API_BASE = 'https://api.upload-post.com/api';
const PROFILE_USER = 'jonnarincon';

// Types
interface ScheduledPost {
  id: string;
  jobId?: string;
  title: string;
  platforms: string[];
  scheduledDate: string;
  status: string;
  mediaType: 'video' | 'photo' | 'text';
  mediaUrl?: string;
  thumbnailUrl?: string;
}

interface HistoryPost {
  id: string;
  title: string;
  platforms: Array<{ name: string; url?: string; error?: string }>;
  createdAt: string;
  status: string;
  mediaType?: string;
  request_id?: string;
}

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  posts: (ScheduledPost | HistoryPost)[];
}

// API helper
const apiCall = async (endpoint: string, options?: RequestInit) => {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Authorization': `Apikey ${API_KEY}`,
      ...(options?.headers || {}),
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(err.message || `API error ${res.status}`);
  }
  return res.json();
};

// ======================= MAIN COMPONENT =======================
const ContentPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'calendar' | 'scheduled' | 'history'>('calendar');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [scheduledPosts, setScheduledPosts] = useState<ScheduledPost[]>([]);
  const [historyPosts, setHistoryPosts] = useState<HistoryPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch data
  const fetchData = useCallback(async () => {
    try {
      setRefreshing(true);

      // Fetch scheduled posts
      const scheduledRes = await apiCall('/scheduled').catch(() => ({ scheduled: [] }));
      const scheduled: ScheduledPost[] = (scheduledRes.scheduled || scheduledRes.data || []).map((item: any) => ({
        id: item.id || item.job_id || item._id || String(Math.random()),
        jobId: item.job_id || item.id || item._id,
        title: item.title || item.caption || 'Untitled',
        platforms: item.platforms || [],
        scheduledDate: item.scheduled_date || item.scheduledDate || item.date || '',
        status: item.status || 'scheduled',
        mediaType: item.media_type || item.type || 'photo',
        mediaUrl: item.media_url || item.file_url || '',
        thumbnailUrl: item.thumbnail_url || item.cover_url || '',
      }));
      setScheduledPosts(scheduled);

      // Fetch upload history
      const historyRes = await apiCall('/history?limit=50').catch(() => ({ uploads: [] }));
      const history: HistoryPost[] = (historyRes.uploads || historyRes.data || []).map((item: any) => ({
        id: item.id || item.request_id || item._id || String(Math.random()),
        title: item.title || item.caption || 'Untitled',
        platforms: item.platforms || [],
        createdAt: item.created_at || item.createdAt || item.date || '',
        status: item.status || 'completed',
        mediaType: item.media_type || item.type || 'photo',
        request_id: item.request_id,
      }));
      setHistoryPosts(history);
    } catch (error) {
      console.error('Failed to fetch social media data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Calendar helpers
  const getCalendarDays = (): CalendarDay[] => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startPad = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1; // Monday-start
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const days: CalendarDay[] = [];

    // Previous month padding
    for (let i = startPad - 1; i >= 0; i--) {
      const date = new Date(year, month, -i);
      days.push({ date, isCurrentMonth: false, isToday: false, posts: [] });
    }

    // Current month days
    for (let d = 1; d <= lastDay.getDate(); d++) {
      const date = new Date(year, month, d);
      const dateStr = date.toISOString().split('T')[0];
      const isToday = date.getTime() === today.getTime();

      // Match posts to this day
      const dayPosts: (ScheduledPost | HistoryPost)[] = [];
      scheduledPosts.forEach(p => {
        if (p.scheduledDate && p.scheduledDate.startsWith(dateStr)) dayPosts.push(p);
      });
      historyPosts.forEach(p => {
        if (p.createdAt && p.createdAt.startsWith(dateStr)) dayPosts.push(p);
      });

      days.push({ date, isCurrentMonth: true, isToday, posts: dayPosts });
    }

    // Next month padding (fill to 42 = 6 weeks)
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      const date = new Date(year, month + 1, i);
      days.push({ date, isCurrentMonth: false, isToday: false, posts: [] });
    }

    return days;
  };

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  const goToToday = () => setCurrentDate(new Date());

  const handleCancelScheduled = async (jobId: string) => {
    if (!confirm('Cancel this scheduled post?')) return;
    try {
      await apiCall(`/scheduled/${jobId}`, { method: 'DELETE' });
      await fetchData();
    } catch (error: any) {
      alert('Failed to cancel: ' + error.message);
    }
  };

  const handleCalendarDayClick = (day: CalendarDay) => {
    if (!day.isCurrentMonth) return;
    setSelectedDate(day.date);
    setShowCreateModal(true);
  };

  const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const calendarDays = getCalendarDays();

  const getPlatformIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'instagram': return <Instagram size={14} className="text-pink-400" />;
      case 'youtube': return <Youtube size={14} className="text-red-400" />;
      default: return <Send size={14} className="text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
      case 'published':
        return <span className="flex items-center gap-1 text-xs text-green-400"><CheckCircle size={12} /> Published</span>;
      case 'scheduled':
      case 'pending':
        return <span className="flex items-center gap-1 text-xs text-blue-400"><Clock size={12} /> Scheduled</span>;
      case 'failed':
      case 'error':
        return <span className="flex items-center gap-1 text-xs text-red-400"><AlertCircle size={12} /> Failed</span>;
      default:
        return <span className="flex items-center gap-1 text-xs text-gray-400"><Clock size={12} /> {status}</span>;
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Social Media Planner</h1>
            <p className="text-gray-400 mt-2">Schedule and manage posts for Instagram & YouTube</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchData}
              disabled={refreshing}
              className="p-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-400 hover:text-white transition disabled:opacity-50"
              title="Refresh"
            >
              <RefreshCw size={20} className={refreshing ? 'animate-spin' : ''} />
            </button>
            <button
              onClick={() => { setSelectedDate(null); setShowCreateModal(true); }}
              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-all flex items-center space-x-2"
            >
              <Plus size={20} />
              <span>Create Post</span>
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
            <p className="text-gray-400 text-sm">Scheduled</p>
            <p className="text-2xl font-bold text-blue-400 mt-1">{scheduledPosts.length}</p>
          </div>
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
            <p className="text-gray-400 text-sm">Published</p>
            <p className="text-2xl font-bold text-green-400 mt-1">
              {historyPosts.filter(p => p.status === 'completed' || p.status === 'published').length}
            </p>
          </div>
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 flex items-center gap-3">
            <Instagram size={24} className="text-pink-400" />
            <div>
              <p className="text-gray-400 text-sm">Instagram</p>
              <p className="text-white font-bold">Connected</p>
            </div>
          </div>
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 flex items-center gap-3">
            <Youtube size={24} className="text-red-400" />
            <div>
              <p className="text-gray-400 text-sm">YouTube</p>
              <p className="text-white font-bold">Connected</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-gray-700">
          <button
            onClick={() => setActiveTab('calendar')}
            className={`px-4 py-2 font-medium transition flex items-center gap-2 ${
              activeTab === 'calendar'
                ? 'text-purple-400 border-b-2 border-purple-400'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            <CalendarIcon size={18} /> Calendar
          </button>
          <button
            onClick={() => setActiveTab('scheduled')}
            className={`px-4 py-2 font-medium transition flex items-center gap-2 ${
              activeTab === 'scheduled'
                ? 'text-purple-400 border-b-2 border-purple-400'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            <Clock size={18} /> Scheduled ({scheduledPosts.length})
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 font-medium transition flex items-center gap-2 ${
              activeTab === 'history'
                ? 'text-purple-400 border-b-2 border-purple-400'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            <CheckCircle size={18} /> History ({historyPosts.length})
          </button>
        </div>

        {/* Calendar View */}
        {activeTab === 'calendar' && (
          <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
            {/* Calendar Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <button onClick={prevMonth} className="p-2 hover:bg-gray-700 rounded-lg text-gray-400 hover:text-white transition">
                <ChevronLeft size={20} />
              </button>
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold text-white">{monthName}</h2>
                <button onClick={goToToday} className="text-xs px-2 py-1 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded transition">
                  Today
                </button>
              </div>
              <button onClick={nextMonth} className="p-2 hover:bg-gray-700 rounded-lg text-gray-400 hover:text-white transition">
                <ChevronRight size={20} />
              </button>
            </div>

            {/* Day Headers */}
            <div className="grid grid-cols-7 bg-gray-700/50">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                <div key={day} className="p-2 text-center text-xs font-semibold text-gray-400 uppercase">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7">
              {calendarDays.map((day, i) => (
                <div
                  key={i}
                  onClick={() => handleCalendarDayClick(day)}
                  className={`min-h-[100px] border-t border-r border-gray-700/50 p-1.5 transition cursor-pointer ${
                    !day.isCurrentMonth ? 'bg-gray-900/30 opacity-40' :
                    day.isToday ? 'bg-purple-900/20 border-l-2 border-l-purple-500' :
                    'hover:bg-gray-700/30'
                  }`}
                >
                  <div className={`text-xs font-medium mb-1 ${
                    day.isToday ? 'text-purple-400 font-bold' :
                    day.isCurrentMonth ? 'text-gray-300' : 'text-gray-600'
                  }`}>
                    {day.date.getDate()}
                  </div>
                  <div className="space-y-0.5">
                    {day.posts.slice(0, 3).map((post, j) => {
                      const isScheduled = 'scheduledDate' in post;
                      return (
                        <div
                          key={j}
                          className={`text-[10px] px-1 py-0.5 rounded truncate ${
                            isScheduled
                              ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                              : 'bg-green-500/20 text-green-300 border border-green-500/30'
                          }`}
                          title={post.title}
                        >
                          <div className="flex items-center gap-0.5">
                            {post.platforms?.slice(0, 2).map((p: any, k: number) => (
                              <span key={k}>{getPlatformIcon(typeof p === 'string' ? p : p.name)}</span>
                            ))}
                            <span className="truncate">{post.title}</span>
                          </div>
                        </div>
                      );
                    })}
                    {day.posts.length > 3 && (
                      <div className="text-[10px] text-gray-500 text-center">
                        +{day.posts.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Scheduled Posts View */}
        {activeTab === 'scheduled' && (
          <div className="space-y-3">
            {loading ? (
              <div className="bg-gray-800 border border-gray-700 rounded-xl p-12 text-center text-gray-400">
                Loading scheduled posts...
              </div>
            ) : scheduledPosts.length === 0 ? (
              <div className="bg-gray-800 border border-gray-700 rounded-xl p-12 text-center">
                <Clock size={48} className="mx-auto mb-4 text-gray-600" />
                <h3 className="text-xl font-bold text-white mb-2">No scheduled posts</h3>
                <p className="text-gray-400 mb-4">Create your first scheduled post to get started</p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-lg font-semibold"
                >
                  Schedule Post
                </button>
              </div>
            ) : (
              scheduledPosts.map(post => (
                <div key={post.id} className="bg-gray-800 border border-gray-700 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      {/* Media Type Icon */}
                      <div className="w-10 h-10 rounded-lg bg-gray-700 flex items-center justify-center flex-shrink-0">
                        {post.mediaType === 'video' ? <Film size={20} className="text-red-400" /> :
                         post.mediaType === 'photo' ? <Image size={20} className="text-blue-400" /> :
                         <Type size={20} className="text-green-400" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-bold text-white truncate">{post.title}</h3>
                        <div className="flex items-center gap-3 mt-1">
                          <div className="flex items-center gap-1">
                            {post.platforms.map((p, i) => (
                              <span key={i}>{getPlatformIcon(p)}</span>
                            ))}
                          </div>
                          <span className="text-xs text-gray-400">
                            <CalendarIcon size={12} className="inline mr-1" />
                            {new Date(post.scheduledDate).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {getStatusBadge(post.status)}
                      {post.jobId && (
                        <button
                          onClick={() => handleCancelScheduled(post.jobId!)}
                          className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition"
                          title="Cancel scheduled post"
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* History View */}
        {activeTab === 'history' && (
          <div className="space-y-3">
            {loading ? (
              <div className="bg-gray-800 border border-gray-700 rounded-xl p-12 text-center text-gray-400">
                Loading history...
              </div>
            ) : historyPosts.length === 0 ? (
              <div className="bg-gray-800 border border-gray-700 rounded-xl p-12 text-center">
                <CheckCircle size={48} className="mx-auto mb-4 text-gray-600" />
                <h3 className="text-xl font-bold text-white mb-2">No posts yet</h3>
                <p className="text-gray-400">Your published posts will appear here</p>
              </div>
            ) : (
              historyPosts.map(post => (
                <div key={post.id} className="bg-gray-800 border border-gray-700 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="min-w-0 flex-1">
                        <h3 className="font-bold text-white truncate">{post.title}</h3>
                        <div className="flex items-center gap-3 mt-1 flex-wrap">
                          <div className="flex items-center gap-1">
                            {post.platforms.map((p, i) => {
                              const pName = typeof p === 'string' ? p : p.name;
                              const pUrl = typeof p === 'string' ? undefined : p.url;
                              return (
                                <span key={i} className="flex items-center gap-0.5">
                                  {getPlatformIcon(pName)}
                                  {pUrl && (
                                    <a href={pUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-purple-400 hover:underline">
                                      View
                                    </a>
                                  )}
                                </span>
                              );
                            })}
                          </div>
                          <span className="text-xs text-gray-400">
                            {post.createdAt ? new Date(post.createdAt).toLocaleString() : 'N/A'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      {getStatusBadge(post.status)}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Create Post Modal */}
      {showCreateModal && (
        <CreatePostModal
          onClose={() => { setShowCreateModal(false); setSelectedDate(null); }}
          onSave={() => { setShowCreateModal(false); setSelectedDate(null); fetchData(); }}
          preselectedDate={selectedDate}
        />
      )}
    </AdminLayout>
  );
};

// ======================= CREATE POST MODAL =======================

interface CreatePostModalProps {
  onClose: () => void;
  onSave: () => void;
  preselectedDate: Date | null;
}

const CreatePostModal: React.FC<CreatePostModalProps> = ({ onClose, onSave, preselectedDate }) => {
  const [postType, setPostType] = useState<'photo' | 'video' | 'text'>('photo');
  const [platforms, setPlatforms] = useState<string[]>(['instagram']);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string>('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [isScheduled, setIsScheduled] = useState(!!preselectedDate);
  const [scheduledDate, setScheduledDate] = useState(
    preselectedDate
      ? `${preselectedDate.getFullYear()}-${String(preselectedDate.getMonth() + 1).padStart(2, '0')}-${String(preselectedDate.getDate()).padStart(2, '0')}T12:00`
      : ''
  );
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string>('');

  // Instagram-specific
  const [igMediaType, setIgMediaType] = useState<'REELS' | 'STORIES' | 'IMAGE'>('IMAGE');
  // YouTube-specific
  const [ytPrivacy, setYtPrivacy] = useState<'public' | 'unlisted' | 'private'>('public');
  const [ytTags, setYtTags] = useState('');
  const [ytCategoryId, setYtCategoryId] = useState('22');

  const togglePlatform = (platform: string) => {
    setPlatforms(prev =>
      prev.includes(platform)
        ? prev.filter(p => p !== platform)
        : [...prev, platform]
    );
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setMediaFile(file);
    setMediaPreview(URL.createObjectURL(file));

    // Auto-detect post type
    if (file.type.startsWith('video/')) {
      setPostType('video');
    } else if (file.type.startsWith('image/')) {
      setPostType('photo');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    if (postType !== 'text' && !mediaFile && !mediaUrl) {
      alert('Please upload a file or provide a media URL');
      return;
    }
    if (platforms.length === 0) {
      alert('Please select at least one platform');
      return;
    }

    setUploading(true);
    setUploadStatus('Preparing upload...');

    try {
      const formData = new FormData();
      formData.append('user', PROFILE_USER);
      formData.append('title', title);
      formData.append('platforms', JSON.stringify(platforms));

      if (description) formData.append('description', description);

      // Scheduling
      if (isScheduled && scheduledDate) {
        const isoDate = new Date(scheduledDate).toISOString();
        formData.append('scheduledDate', isoDate);
        formData.append('timezone', Intl.DateTimeFormat().resolvedOptions().timeZone);
      }

      // Instagram options
      if (platforms.includes('instagram')) {
        if (postType === 'video') {
          formData.append('instagramMediaType', igMediaType === 'IMAGE' ? 'REELS' : igMediaType);
        } else if (postType === 'photo') {
          formData.append('instagramMediaType', igMediaType === 'REELS' ? 'IMAGE' : igMediaType);
        }
      }

      // YouTube options
      if (platforms.includes('youtube')) {
        formData.append('youtubePrivacyStatus', ytPrivacy);
        if (ytTags) formData.append('youtubeTags', ytTags);
        formData.append('youtubeCategoryId', ytCategoryId);
        if (description) formData.append('youtubeDescription', description);
      }

      let endpoint = '/upload';
      if (postType === 'photo') {
        endpoint = '/upload/photos';
        if (mediaFile) {
          formData.append('files', mediaFile);
        } else if (mediaUrl) {
          formData.append('urls', JSON.stringify([mediaUrl]));
        }
      } else if (postType === 'video') {
        endpoint = '/upload';
        if (mediaFile) {
          formData.append('file', mediaFile);
        } else if (mediaUrl) {
          formData.append('url', mediaUrl);
        }
      } else {
        endpoint = '/upload/text';
      }

      setUploadStatus('Uploading to platforms...');

      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Apikey ${API_KEY}`,
        },
        body: formData,
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.message || `Upload failed (${res.status})`);
      }

      if (result.success === false) {
        throw new Error(result.message || 'Upload failed');
      }

      setUploadStatus('');
      alert(isScheduled ? 'Post scheduled successfully!' : 'Post published successfully!');
      onSave();
    } catch (error: any) {
      console.error('Upload failed:', error);
      setUploadStatus('');
      alert('Upload failed: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  // Available video platforms
  const availablePlatforms = postType === 'text'
    ? [{ id: 'instagram', label: 'Instagram', icon: Instagram, color: 'pink' }]
    : [
        { id: 'instagram', label: 'Instagram', icon: Instagram, color: 'pink' },
        { id: 'youtube', label: 'YouTube', icon: Youtube, color: 'red' },
      ];

  // YouTube only supports video
  const filteredPlatforms = postType === 'photo'
    ? availablePlatforms.filter(p => p.id !== 'youtube')
    : availablePlatforms;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-gray-800 rounded-xl max-w-2xl w-full my-8">
        {/* Modal Header */}
        <div className="p-6 border-b border-gray-700 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">
            {isScheduled ? 'Schedule Post' : 'Create Post'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[calc(100vh-200px)] overflow-y-auto">
          {/* Post Type */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Content Type</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPostType('photo')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${
                  postType === 'photo'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                }`}
              >
                <Image size={18} /> Photo
              </button>
              <button
                type="button"
                onClick={() => setPostType('video')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${
                  postType === 'video'
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                }`}
              >
                <Film size={18} /> Video
              </button>
              <button
                type="button"
                onClick={() => setPostType('text')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${
                  postType === 'text'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                }`}
              >
                <Type size={18} /> Text
              </button>
            </div>
          </div>

          {/* Platforms */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Post to Platforms</label>
            <div className="flex gap-2">
              {filteredPlatforms.map(p => {
                const Icon = p.icon;
                const isActive = platforms.includes(p.id);
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => togglePlatform(p.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition border ${
                      isActive
                        ? `bg-${p.color}-600/20 border-${p.color}-500 text-${p.color}-400`
                        : 'bg-gray-700 border-gray-600 text-gray-400 hover:bg-gray-600'
                    }`}
                    style={isActive ? {
                      backgroundColor: p.color === 'pink' ? 'rgba(236,72,153,0.2)' : 'rgba(239,68,68,0.2)',
                      borderColor: p.color === 'pink' ? '#ec4899' : '#ef4444',
                      color: p.color === 'pink' ? '#f472b6' : '#f87171',
                    } : {}}
                  >
                    <Icon size={18} />
                    {p.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Title/Caption */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Caption / Title *
            </label>
            <textarea
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500 resize-none"
              rows={3}
              placeholder="Write your caption or title..."
              required
            />
            <p className="text-xs text-gray-500 mt-1">{title.length} characters</p>
          </div>

          {/* Description (for YouTube) */}
          {platforms.includes('youtube') && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                YouTube Description
              </label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500 resize-none"
                rows={3}
                placeholder="YouTube video description..."
              />
            </div>
          )}

          {/* Media Upload */}
          {postType !== 'text' && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {postType === 'video' ? 'Upload Video' : 'Upload Photo'}
              </label>
              <div className="space-y-2">
                <label className="flex items-center justify-center gap-2 px-4 py-4 bg-gray-700 border-2 border-dashed border-gray-600 rounded-lg text-gray-400 hover:border-purple-500 hover:text-purple-400 cursor-pointer transition">
                  <Upload size={20} />
                  <span>{mediaFile ? mediaFile.name : `Choose ${postType === 'video' ? 'video' : 'image'} file`}</span>
                  <input
                    type="file"
                    accept={postType === 'video' ? 'video/*' : 'image/*'}
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
                <div className="flex items-center gap-2 text-gray-500 text-sm">
                  <span>or</span>
                </div>
                <input
                  type="url"
                  value={mediaUrl}
                  onChange={e => setMediaUrl(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                  placeholder="Paste media URL..."
                />
                {/* Preview */}
                {mediaPreview && (
                  <div className="mt-2">
                    {postType === 'video' ? (
                      <video src={mediaPreview} controls className="w-full h-48 rounded-lg object-cover" />
                    ) : (
                      <img src={mediaPreview} alt="Preview" className="w-full h-48 rounded-lg object-cover" />
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Platform-specific options */}
          {platforms.includes('instagram') && postType !== 'text' && (
            <div className="bg-gradient-to-r from-pink-900/20 to-purple-900/20 border border-pink-700/30 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-pink-400 flex items-center gap-2 mb-3">
                <Instagram size={16} /> Instagram Options
              </h4>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Media Type</label>
                <select
                  value={igMediaType}
                  onChange={e => setIgMediaType(e.target.value as any)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-pink-500"
                >
                  {postType === 'video' ? (
                    <>
                      <option value="REELS">Reels</option>
                      <option value="STORIES">Story</option>
                    </>
                  ) : (
                    <>
                      <option value="IMAGE">Feed Post</option>
                      <option value="STORIES">Story</option>
                    </>
                  )}
                </select>
              </div>
            </div>
          )}

          {platforms.includes('youtube') && postType === 'video' && (
            <div className="bg-red-900/20 border border-red-700/30 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-red-400 flex items-center gap-2 mb-3">
                <Youtube size={16} /> YouTube Options
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Privacy</label>
                  <select
                    value={ytPrivacy}
                    onChange={e => setYtPrivacy(e.target.value as any)}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-red-500"
                  >
                    <option value="public">Public</option>
                    <option value="unlisted">Unlisted</option>
                    <option value="private">Private</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Category</label>
                  <select
                    value={ytCategoryId}
                    onChange={e => setYtCategoryId(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-red-500"
                  >
                    <option value="10">Music</option>
                    <option value="22">People & Blogs</option>
                    <option value="24">Entertainment</option>
                    <option value="26">Howto & Style</option>
                    <option value="20">Gaming</option>
                    <option value="1">Film & Animation</option>
                  </select>
                </div>
              </div>
              <div className="mt-3">
                <label className="block text-xs text-gray-400 mb-1">Tags (comma separated)</label>
                <input
                  type="text"
                  value={ytTags}
                  onChange={e => setYtTags(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-red-500"
                  placeholder="music, beats, producer"
                />
              </div>
            </div>
          )}

          {/* Scheduling */}
          <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                <Clock size={16} /> Schedule Post
              </h4>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isScheduled}
                  onChange={e => setIsScheduled(e.target.checked)}
                  className="w-4 h-4 rounded"
                />
                <span className="text-sm text-gray-300">Schedule for later</span>
              </label>
            </div>
            {isScheduled && (
              <input
                type="datetime-local"
                value={scheduledDate}
                onChange={e => setScheduledDate(e.target.value)}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                required={isScheduled}
              />
            )}
          </div>

          {/* Upload Status */}
          {uploadStatus && (
            <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-3 flex items-center gap-2">
              <RefreshCw size={16} className="animate-spin text-blue-400" />
              <span className="text-blue-300 text-sm">{uploadStatus}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 text-gray-400 hover:text-white transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={uploading || !title.trim() || platforms.length === 0}
              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-2 rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {uploading ? (
                <><RefreshCw size={18} className="animate-spin" /> Uploading...</>
              ) : isScheduled ? (
                <><Clock size={18} /> Schedule Post</>
              ) : (
                <><Send size={18} /> Publish Now</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ContentPage;
