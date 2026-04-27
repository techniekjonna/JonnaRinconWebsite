import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { useBeats } from '../../hooks/useBeats';
import { useTracks } from '../../hooks/useTracks';
import { useRemixes } from '../../hooks/useRemixes';
import { useOrders } from '../../hooks/useOrders';
import { useContent } from '../../hooks/useContent';
import { useCollaborations } from '../../hooks/useCollaborations';
import { useArt } from '../../hooks/useArt';
import { useMerchandise } from '../../hooks/useMerchandise';
import { useServices } from '../../hooks/useServices';
import { usePlaylists } from '../../hooks/usePlaylists';
import { useEdits } from '../../hooks/useEdits';
import { useDiscountCodes } from '../../hooks/useDiscountCodes';
import { db } from '../../lib/firebase/config';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import {
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Music,
  Eye,
  Users,
  FileText,
  MessageSquare,
  Palette,
  Shirt,
  Briefcase,
  ListMusic,
  Disc3,
  Tag,
  UserPlus,
  Handshake,
  Filter,
  ChevronDown,
} from 'lucide-react';

const AnalyticsPage: React.FC = () => {
  const { beats, loading: beatsLoading } = useBeats();
  const { tracks, loading: tracksLoading } = useTracks({ status: 'published' });
  const { remixes, loading: remixesLoading } = useRemixes({ status: 'published' });
  const { orders, statistics: orderStats } = useOrders();
  const { content } = useContent();
  const { collaborations, statistics: collabStats } = useCollaborations();
  const { art } = useArt();
  const { merchandise } = useMerchandise();
  const { services } = useServices();
  const { playlists } = usePlaylists();
  const { edits } = useEdits();
  const { discountCodes } = useDiscountCodes();

  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');
  const [chatStats, setChatStats] = useState({
    totalMessages: 0,
    uniqueConversations: 0,
    messagesByRole: { customer: 0, artist: 0, manager: 0, admin: 0 },
  });
  const [artistRoleRequests, setArtistRoleRequests] = useState<any[]>([]);
  const [collabRequests, setCollabRequests] = useState<any[]>([]);
  const [topContentTypeFilter, setTopContentTypeFilter] = useState<'all' | 'Beat' | 'Track' | 'Remix'>('all');
  const [topContentMetric, setTopContentMetric] = useState<'plays' | 'downloads'>('plays');
  const [chatUsers, setChatUsers] = useState<any[]>([]);
  const [userRoleFilter, setUserRoleFilter] = useState<'all' | 'customer' | 'artist' | 'manager'>('all');

  // Artist role requests
  useEffect(() => {
    const q = query(collection(db, 'artistRoleRequests'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      setArtistRoleRequests(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  // Collaboration requests
  useEffect(() => {
    const q = query(collection(db, 'collabRequests'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      setCollabRequests(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  // Load chat statistics and build user list
  useEffect(() => {
    const messagesRef = collection(db, 'supportMessages');
    const q = query(messagesRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messages = snapshot.docs.map((doc) => doc.data());
      const userMap = new Map<string, any>();
      const roleCount = {
        customer: 0,
        artist: 0,
        manager: 0,
        admin: 0,
      };

      messages.forEach((msg: any) => {
        if (msg.senderRole === 'customer') roleCount.customer++;
        else if (msg.senderRole === 'artist') roleCount.artist++;
        else if (msg.senderRole === 'manager') roleCount.manager++;
        else if (msg.senderRole === 'admin') roleCount.admin++;

        // Build user list
        if (!userMap.has(msg.senderId)) {
          userMap.set(msg.senderId, {
            userId: msg.senderId,
            userName: msg.senderName,
            userEmail: msg.senderEmail,
            userRole: msg.senderRole,
            messageCount: 0,
            lastMessage: msg.createdAt,
          });
        }
        const user = userMap.get(msg.senderId);
        user.messageCount++;
        if (!user.lastMessage || (msg.createdAt?.toMillis?.() || 0) > (user.lastMessage?.toMillis?.() || 0)) {
          user.lastMessage = msg.createdAt;
        }
      });

      const uniqueSenders = new Set(messages.map((m: any) => m.senderId));
      setChatStats({
        totalMessages: messages.length,
        uniqueConversations: uniqueSenders.size,
        messagesByRole: roleCount,
      });
      setChatUsers(Array.from(userMap.values()).sort((a, b) => b.messageCount - a.messageCount));
    });

    return () => unsubscribe();
  }, []);

  // Filter orders by date range
  const getFilteredOrders = () => {
    if (dateRange === 'all') return orders;

    const now = new Date();
    const daysAgo = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90;
    const cutoffDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);

    return orders.filter((order) => {
      const orderDate = order.createdAt?.toDate?.() || new Date(0);
      return orderDate >= cutoffDate;
    });
  };

  const filteredOrders = getFilteredOrders();

  // Helper to filter content by date
  const filterContentByDate = (items: any[]) => {
    if (dateRange === 'all') return items;
    const now = new Date();
    const daysAgo = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90;
    const cutoffDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
    return items.filter((item) => {
      const itemDate = item.createdAt?.toDate?.() || new Date(0);
      return itemDate >= cutoffDate;
    });
  };

  const filteredBeats = filterContentByDate(beats);
  const filteredTracks = filterContentByDate(tracks);
  const filteredRemixes = filterContentByDate(remixes);

  // Calculate analytics
  const totalRevenue = filteredOrders.reduce((sum, o) => sum + (o.total || 0), 0);
  const totalOrders = filteredOrders.length;
  const totalBeats = filteredBeats.length;
  const totalTracks = filteredTracks.length;
  const totalRemixes = filteredRemixes.length;
  const totalViews = filterContentByDate(content).reduce((sum, c) => sum + c.views, 0);

  // Calculate total plays across all content types (filtered by date)
  const beatPlays = filteredBeats.reduce((sum, b) => sum + b.plays, 0);
  const trackPlays = filteredTracks.reduce((sum, t) => sum + t.plays, 0);
  const remixPlays = filteredRemixes.reduce((sum, r) => sum + r.plays, 0);
  const totalPlays = beatPlays + trackPlays + remixPlays;

  // Calculate total downloads across all content types (filtered by date)
  const beatDownloads = filteredBeats.reduce((sum, b) => sum + b.downloads, 0);
  const trackDownloads = filteredTracks.reduce((sum, t) => sum + t.downloads, 0);
  const remixDownloads = filteredRemixes.reduce((sum, r) => sum + r.downloads, 0);
  const totalDownloads = beatDownloads + trackDownloads + remixDownloads;

  // Calculate total likes across all content types (filtered by date)
  const beatLikes = filteredBeats.reduce((sum, b) => sum + b.likes, 0);
  const trackLikes = filteredTracks.reduce((sum, t) => sum + t.likes, 0);
  const remixLikes = filteredRemixes.reduce((sum, r) => sum + r.likes, 0);
  const totalLikes = beatLikes + trackLikes + remixLikes;

  // Top performing content across all types
  interface ContentItem {
    id: string;
    title: string;
    artist: string;
    artworkUrl: string;
    plays: number;
    downloads: number;
    type: 'Beat' | 'Track' | 'Remix';
  }

  const allContent: ContentItem[] = [
    ...filteredBeats.map((b) => ({
      id: b.id,
      title: b.title,
      artist: b.artist,
      artworkUrl: b.artworkUrl,
      plays: b.plays,
      downloads: b.downloads,
      type: 'Beat' as const,
    })),
    ...filteredTracks.map((t) => ({
      id: t.id,
      title: t.title,
      artist: t.artist,
      artworkUrl: t.artworkUrl,
      plays: t.plays,
      downloads: t.downloads,
      type: 'Track' as const,
    })),
    ...filteredRemixes.map((r) => ({
      id: r.id,
      title: r.title,
      artist: r.remixArtist,
      artworkUrl: r.artworkUrl,
      plays: r.plays,
      downloads: r.downloads,
      type: 'Remix' as const,
    })),
  ];

  const topPerformingContent = [...allContent]
    .filter(item => topContentTypeFilter === 'all' || item.type === topContentTypeFilter)
    .sort((a, b) => {
      if (topContentMetric === 'plays') {
        return b.plays - a.plays;
      } else {
        return b.downloads - a.downloads;
      }
    })
    .slice(0, 5);

  // Get filtered chat users
  const filteredChatUsers = chatUsers.filter(u => userRoleFilter === 'all' || u.userRole === userRoleFilter);

  // Top content by views
  const topContent = [...content]
    .sort((a, b) => b.views - a.views)
    .slice(0, 5);

  // Recent activity
  const recentOrders = [...filteredOrders]
    .sort((a, b) => {
      const dateA = a.createdAt?.toDate?.() || new Date(0);
      const dateB = b.createdAt?.toDate?.() || new Date(0);
      return dateB.getTime() - dateA.getTime();
    })
    .slice(0, 5);

  // Calculate revenue trend (mock for now - would need historical data)
  const revenueTrend = 12.5; // percentage increase

  // Calculate engagement metrics
  const publishedBeats = beats.filter((b) => b.status === 'published').length;
  const featuredBeats = beats.filter((b) => b.featured).length;
  const publishedTracks = tracks.filter((t) => t.status === 'published').length;
  const featuredTracks = tracks.filter((t) => t.featured).length;
  const publishedRemixes = remixes.filter((r) => r.status === 'published').length;
  const featuredRemixes = remixes.filter((r) => r.featured).length;
  const publishedContent = content.filter((c) => c.status === 'published').length;

  // Catalog breakdown
  const publishedArt = art.filter((a) => a.status === 'published').length;
  const featuredArt = art.filter((a) => a.featured).length;
  const publishedMerch = merchandise.filter((m) => m.status === 'published').length;
  const featuredMerch = merchandise.filter((m) => m.featured).length;
  const publishedServices = services.filter((s) => s.status === 'published').length;
  const featuredServices = services.filter((s) => s.featured).length;
  const publishedEdits = edits.filter((e) => e.status === 'published').length;
  const featuredEdits = edits.filter((e) => e.featured).length;
  const publicPlaylists = playlists.filter((p) => p.isPublic).length;
  const featuredPlaylists = playlists.filter((p) => p.isFeatured).length;

  // Discount codes
  const activeDiscountCodes = discountCodes.filter((d) => d.isActive).length;
  const totalDiscountUses = discountCodes.reduce((sum, d) => sum + (d.usedCount || 0), 0);

  // Requests
  const pendingArtistRequests = artistRoleRequests.filter((r) => r.status === 'pending').length;
  const approvedArtistRequests = artistRoleRequests.filter((r) => r.status === 'approved').length;
  const pendingCollabRequests = collabRequests.filter((r) => r.status === 'pending').length;
  const approvedCollabRequests = collabRequests.filter((r) => r.status === 'approved').length;

  // Orders breakdown
  const pendingOrders = filteredOrders.filter((o) => o.status === 'pending').length;
  const completedOrders = filteredOrders.filter((o) => o.status === 'completed').length;

  // Collaborations
  const activeCollaborations = collaborations.filter((c) =>
    ['agreed', 'contract_sent', 'signed', 'in_progress'].includes(c.status)
  ).length;
  const completedCollaborations = collaborations.filter((c) => c.status === 'completed').length;

  // Loading states
  const isLoading = beatsLoading || tracksLoading || remixesLoading;

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Analytics Dashboard</h1>
            <p className="text-white/40 mt-2">Overview of your platform performance</p>
          </div>
          <div>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as '7d' | '30d' | '90d' | 'all')}
              className="bg-white/[0.08] border border-white/[0.06] text-white rounded-lg px-4 py-2 focus:outline-none focus:border-purple-500"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="all">All time</option>
            </select>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white/[0.08] border border-white/[0.06] rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-white/40 text-sm">Total Revenue</p>
              <DollarSign className="text-green-400" size={20} />
            </div>
            <p className="text-3xl font-bold text-white">
              €{totalRevenue.toLocaleString()}
            </p>
            <div className="flex items-center mt-2 text-sm">
              <TrendingUp className="text-green-400 mr-1" size={16} />
              <span className="text-green-400">+{revenueTrend}%</span>
              <span className="text-white/25 ml-1">vs last period</span>
            </div>
          </div>

          <div className="bg-white/[0.08] border border-white/[0.06] rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-white/40 text-sm">Total Orders</p>
              <ShoppingCart className="text-blue-400" size={20} />
            </div>
            <p className="text-3xl font-bold text-white">{totalOrders}</p>
            <p className="text-sm text-white/40 mt-2">
              {filteredOrders.filter((o) => o.status === 'completed').length} completed
            </p>
          </div>

          <div className="bg-white/[0.08] border border-white/[0.06] rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-white/40 text-sm">Total Beats</p>
              <Music className="text-purple-400" size={20} />
            </div>
            <p className="text-3xl font-bold text-white">{totalBeats}</p>
            <p className="text-sm text-white/40 mt-2">
              {publishedBeats} published • {featuredBeats} featured
            </p>
          </div>

          <div className="bg-white/[0.08] border border-white/[0.06] rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-white/40 text-sm">Content Views</p>
              <Eye className="text-pink-400" size={20} />
            </div>
            <p className="text-3xl font-bold text-white">
              {totalViews.toLocaleString()}
            </p>
            <p className="text-sm text-white/40 mt-2">
              {publishedContent} published articles
            </p>
          </div>
        </div>

        {/* Engagement Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white/[0.08] border border-white/[0.06] rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Beat Performance</h3>
              <Music className="text-purple-400" size={20} />
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-white/40">Plays</p>
                <p className="text-2xl font-bold text-white">{beatPlays.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-white/40">Downloads</p>
                <p className="text-2xl font-bold text-white">{beatDownloads.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-white/40">Likes</p>
                <p className="text-2xl font-bold text-white">{beatLikes.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/[0.08] border border-white/[0.06] rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Track Performance</h3>
              <Music className="text-blue-400" size={20} />
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-white/40">Plays</p>
                <p className="text-2xl font-bold text-white">{trackPlays.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-white/40">Downloads</p>
                <p className="text-2xl font-bold text-white">{trackDownloads.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-white/40">Likes</p>
                <p className="text-2xl font-bold text-white">{trackLikes.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/[0.08] border border-white/[0.06] rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Remix Performance</h3>
              <Music className="text-pink-400" size={20} />
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-white/40">Plays</p>
                <p className="text-2xl font-bold text-white">{remixPlays.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-white/40">Downloads</p>
                <p className="text-2xl font-bold text-white">{remixDownloads.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-white/40">Likes</p>
                <p className="text-2xl font-bold text-white">{remixLikes.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/[0.08] border border-white/[0.06] rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Content Engagement</h3>
              <FileText className="text-blue-400" size={20} />
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-white/40">Total Articles</p>
                <p className="text-2xl font-bold text-white">{content.length}</p>
              </div>
              <div>
                <p className="text-sm text-white/40">Total Likes</p>
                <p className="text-2xl font-bold text-white">
                  {content.reduce((sum, c) => sum + c.likes, 0).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-white/40">Total Shares</p>
                <p className="text-2xl font-bold text-white">
                  {content.reduce((sum, c) => sum + c.shares, 0).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Catalog Overview — published / featured per collection */}
        <div>
          <h2 className="text-xl font-semibold text-white mb-3">Catalog Overview</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <div className="bg-white/[0.08] border border-white/[0.06] rounded-xl p-5">
              <div className="flex items-center justify-between mb-1">
                <p className="text-white/40 text-sm">Beats</p>
                <Music className="text-purple-400" size={18} />
              </div>
              <p className="text-2xl font-bold text-white">{beats.length}</p>
              <p className="text-xs text-white/40 mt-1">
                {publishedBeats} published · {featuredBeats} featured
              </p>
            </div>

            <div className="bg-white/[0.08] border border-white/[0.06] rounded-xl p-5">
              <div className="flex items-center justify-between mb-1">
                <p className="text-white/40 text-sm">Tracks</p>
                <Music className="text-blue-400" size={18} />
              </div>
              <p className="text-2xl font-bold text-white">{tracks.length}</p>
              <p className="text-xs text-white/40 mt-1">
                {publishedTracks} published · {featuredTracks} featured
              </p>
            </div>

            <div className="bg-white/[0.08] border border-white/[0.06] rounded-xl p-5">
              <div className="flex items-center justify-between mb-1">
                <p className="text-white/40 text-sm">Remixes</p>
                <Music className="text-pink-400" size={18} />
              </div>
              <p className="text-2xl font-bold text-white">{remixes.length}</p>
              <p className="text-xs text-white/40 mt-1">
                {publishedRemixes} published · {featuredRemixes} featured
              </p>
            </div>

            <div className="bg-white/[0.08] border border-white/[0.06] rounded-xl p-5">
              <div className="flex items-center justify-between mb-1">
                <p className="text-white/40 text-sm">Edits</p>
                <Disc3 className="text-orange-400" size={18} />
              </div>
              <p className="text-2xl font-bold text-white">{edits.length}</p>
              <p className="text-xs text-white/40 mt-1">
                {publishedEdits} published · {featuredEdits} featured
              </p>
            </div>

            <div className="bg-white/[0.08] border border-white/[0.06] rounded-xl p-5">
              <div className="flex items-center justify-between mb-1">
                <p className="text-white/40 text-sm">Art</p>
                <Palette className="text-fuchsia-400" size={18} />
              </div>
              <p className="text-2xl font-bold text-white">{art.length}</p>
              <p className="text-xs text-white/40 mt-1">
                {publishedArt} published · {featuredArt} featured
              </p>
            </div>

            <div className="bg-white/[0.08] border border-white/[0.06] rounded-xl p-5">
              <div className="flex items-center justify-between mb-1">
                <p className="text-white/40 text-sm">Merchandise</p>
                <Shirt className="text-amber-400" size={18} />
              </div>
              <p className="text-2xl font-bold text-white">{merchandise.length}</p>
              <p className="text-xs text-white/40 mt-1">
                {publishedMerch} published · {featuredMerch} featured
              </p>
            </div>

            <div className="bg-white/[0.08] border border-white/[0.06] rounded-xl p-5">
              <div className="flex items-center justify-between mb-1">
                <p className="text-white/40 text-sm">Services</p>
                <Briefcase className="text-teal-400" size={18} />
              </div>
              <p className="text-2xl font-bold text-white">{services.length}</p>
              <p className="text-xs text-white/40 mt-1">
                {publishedServices} published · {featuredServices} featured
              </p>
            </div>

            <div className="bg-white/[0.08] border border-white/[0.06] rounded-xl p-5">
              <div className="flex items-center justify-between mb-1">
                <p className="text-white/40 text-sm">Playlists</p>
                <ListMusic className="text-indigo-400" size={18} />
              </div>
              <p className="text-2xl font-bold text-white">{playlists.length}</p>
              <p className="text-xs text-white/40 mt-1">
                {publicPlaylists} public · {featuredPlaylists} featured
              </p>
            </div>

            <div className="bg-white/[0.08] border border-white/[0.06] rounded-xl p-5">
              <div className="flex items-center justify-between mb-1">
                <p className="text-white/40 text-sm">Discount Codes</p>
                <Tag className="text-emerald-400" size={18} />
              </div>
              <p className="text-2xl font-bold text-white">{discountCodes.length}</p>
              <p className="text-xs text-white/40 mt-1">
                {activeDiscountCodes} active · {totalDiscountUses} uses
              </p>
            </div>

            <div className="bg-white/[0.08] border border-white/[0.06] rounded-xl p-5">
              <div className="flex items-center justify-between mb-1">
                <p className="text-white/40 text-sm">Articles</p>
                <FileText className="text-sky-400" size={18} />
              </div>
              <p className="text-2xl font-bold text-white">{content.length}</p>
              <p className="text-xs text-white/40 mt-1">
                {publishedContent} published
              </p>
            </div>
          </div>
        </div>

        {/* Operations Overview — orders, requests, collaborations */}
        <div>
          <h2 className="text-xl font-semibold text-white mb-3">Operations</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white/[0.08] border border-white/[0.06] rounded-xl p-5">
              <div className="flex items-center justify-between mb-1">
                <p className="text-white/40 text-sm">Orders</p>
                <ShoppingCart className="text-blue-400" size={18} />
              </div>
              <p className="text-2xl font-bold text-white">{orders.length}</p>
              <p className="text-xs text-white/40 mt-1">
                {pendingOrders} pending · {completedOrders} completed
              </p>
            </div>

            <div className="bg-white/[0.08] border border-white/[0.06] rounded-xl p-5">
              <div className="flex items-center justify-between mb-1">
                <p className="text-white/40 text-sm">Artist Requests</p>
                <UserPlus className="text-yellow-400" size={18} />
              </div>
              <p className="text-2xl font-bold text-white">{artistRoleRequests.length}</p>
              <p className="text-xs text-white/40 mt-1">
                {pendingArtistRequests} pending · {approvedArtistRequests} approved
              </p>
            </div>

            <div className="bg-white/[0.08] border border-white/[0.06] rounded-xl p-5">
              <div className="flex items-center justify-between mb-1">
                <p className="text-white/40 text-sm">Collab Requests</p>
                <Handshake className="text-orange-400" size={18} />
              </div>
              <p className="text-2xl font-bold text-white">{collabRequests.length}</p>
              <p className="text-xs text-white/40 mt-1">
                {pendingCollabRequests} pending · {approvedCollabRequests} approved
              </p>
            </div>

            <div className="bg-white/[0.08] border border-white/[0.06] rounded-xl p-5">
              <div className="flex items-center justify-between mb-1">
                <p className="text-white/40 text-sm">Collaborations</p>
                <Users className="text-green-400" size={18} />
              </div>
              <p className="text-2xl font-bold text-white">{collaborations.length}</p>
              <p className="text-xs text-white/40 mt-1">
                {activeCollaborations} active · {completedCollaborations} completed
              </p>
            </div>
          </div>
        </div>

        {/* Top Performing Content Across All Types */}
        <div className="bg-white/[0.08] border border-white/[0.06] rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Top Performing Audio</h3>
            <div className="flex items-center gap-2">
              <select
                value={topContentTypeFilter}
                onChange={(e) => setTopContentTypeFilter(e.target.value as any)}
                className="bg-white/[0.08] border border-white/[0.06] text-white rounded-lg px-3 py-1 text-sm focus:outline-none focus:border-purple-500"
              >
                <option value="all">All Types</option>
                <option value="Beat">Beats</option>
                <option value="Track">Tracks</option>
                <option value="Remix">Remixes</option>
              </select>
              <select
                value={topContentMetric}
                onChange={(e) => setTopContentMetric(e.target.value as any)}
                className="bg-white/[0.08] border border-white/[0.06] text-white rounded-lg px-3 py-1 text-sm focus:outline-none focus:border-purple-500"
              >
                <option value="plays">By Plays</option>
                <option value="downloads">By Downloads</option>
              </select>
            </div>
          </div>
          <div className="space-y-3">
            {topPerformingContent.length === 0 ? (
              <p className="text-white/40 text-center py-4">No content available</p>
            ) : (
              topPerformingContent.map((item, index) => (
                <div
                  key={`${item.type}-${item.id}`}
                  className="flex items-center justify-between p-3 bg-white/[0.06] rounded-lg hover:bg-white/[0.08] transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl font-bold text-white/25">#{index + 1}</span>
                    <img
                      src={item.artworkUrl}
                      alt={item.title}
                      className="w-12 h-12 rounded object-cover"
                    />
                    <div>
                      <p className="font-medium text-white">{item.title}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <span
                          className={`text-xs px-2 py-1 rounded font-medium ${
                            item.type === 'Beat'
                              ? 'bg-purple-500/20 text-purple-300'
                              : item.type === 'Track'
                              ? 'bg-blue-500/20 text-blue-300'
                              : 'bg-pink-500/20 text-pink-300'
                          }`}
                        >
                          {item.type}
                        </span>
                        <p className="text-sm text-white/40">{item.artist}</p>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-white">{item.plays.toLocaleString()} plays</p>
                    <p className="text-sm text-white/40">{item.downloads} downloads</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Chat Users List with Role Filtering */}
        <div className="bg-white/[0.08] border border-white/[0.06] rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Active Users</h3>
            <select
              value={userRoleFilter}
              onChange={(e) => setUserRoleFilter(e.target.value as any)}
              className="bg-white/[0.08] border border-white/[0.06] text-white rounded-lg px-3 py-1 text-sm focus:outline-none focus:border-purple-500"
            >
              <option value="all">All Roles</option>
              <option value="customer">Customers</option>
              <option value="artist">Artists</option>
              <option value="manager">Managers</option>
            </select>
          </div>
          <div className="space-y-2">
            {filteredChatUsers.length === 0 ? (
              <p className="text-white/40 text-center py-4 text-sm">No users found</p>
            ) : (
              filteredChatUsers.slice(0, 10).map((user) => (
                <div
                  key={user.userId}
                  className="flex items-center justify-between p-3 bg-white/[0.06] rounded-lg hover:bg-white/[0.08] transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className={`w-8 h-8 rounded-full bg-gradient-to-br flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ${
                      user.userRole === 'artist' ? 'from-orange-600 to-red-700' :
                      user.userRole === 'manager' ? 'from-green-700 to-teal-700' :
                      'from-blue-700 to-cyan-700'
                    }`}>
                      {user.userName[0]?.toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-white text-sm truncate">{user.userName}</p>
                      <p className="text-xs text-white/40 truncate">{user.userEmail}</p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-semibold text-white text-sm">{user.messageCount}</p>
                    <p className="text-xs text-white/40 capitalize">{user.userRole}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Chat Analytics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white/[0.08] border border-white/[0.06] rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-white/40 text-sm">Total Messages</p>
              <MessageSquare className="text-red-400" size={20} />
            </div>
            <p className="text-3xl font-bold text-white">{chatStats.totalMessages}</p>
            <p className="text-sm text-white/40 mt-2">support messages</p>
          </div>

          <div className="bg-white/[0.08] border border-white/[0.06] rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-white/40 text-sm">Conversations</p>
              <Users className="text-blue-400" size={20} />
            </div>
            <p className="text-3xl font-bold text-white">{chatStats.uniqueConversations}</p>
            <p className="text-sm text-white/40 mt-2">unique participants</p>
          </div>

          <div className="bg-white/[0.08] border border-white/[0.06] rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-white/40 text-sm">Customer Messages</p>
              <ShoppingCart className="text-cyan-400" size={20} />
            </div>
            <p className="text-3xl font-bold text-white">{chatStats.messagesByRole.customer}</p>
            <p className="text-sm text-white/40 mt-2">from customers</p>
          </div>

          <div className="bg-white/[0.08] border border-white/[0.06] rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-white/40 text-sm">Admin Responses</p>
              <FileText className="text-green-400" size={20} />
            </div>
            <p className="text-3xl font-bold text-white">{chatStats.messagesByRole.admin}</p>
            <p className="text-sm text-white/40 mt-2">admin messages</p>
          </div>
        </div>

        {/* Top Content & Recent Orders */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Top Content */}
          <div className="bg-white/[0.08] border border-white/[0.06] rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Top Content by Views</h3>
            <div className="space-y-3">
              {topContent.length === 0 ? (
                <p className="text-white/40 text-center py-4">No content available</p>
              ) : (
                topContent.map((item, index) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 bg-white/[0.06] rounded-lg"
                  >
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      <span className="text-lg font-bold text-white/25">#{index + 1}</span>
                      <div className="min-w-0">
                        <p className="font-medium text-white truncate">{item.title}</p>
                        <p className="text-xs text-white/40 capitalize">{item.type}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-white">{item.views.toLocaleString()}</p>
                      <p className="text-xs text-white/40">views</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Recent Orders */}
          <div className="bg-white/[0.08] border border-white/[0.06] rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Recent Orders</h3>
            <div className="space-y-3">
              {recentOrders.length === 0 ? (
                <p className="text-white/40 text-center py-4">No orders yet</p>
              ) : (
                recentOrders.map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between p-3 bg-white/[0.06] rounded-lg"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-white">Order #{order.id.slice(0, 8)}</p>
                      <p className="text-sm text-white/40">{order.customerEmail}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-white">€{order.totalAmount}</p>
                      <span
                        className={`text-xs px-2 py-1 rounded ${
                          order.status === 'completed'
                            ? 'bg-green-500/20 text-green-400'
                            : order.status === 'pending'
                            ? 'bg-yellow-500/20 text-yellow-400'
                            : 'bg-white/[0.06] text-white/40'
                        }`}
                      >
                        {order.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AnalyticsPage;
