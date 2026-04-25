import { Timestamp } from 'firebase/firestore';

// ============================================
// USER & AUTH TYPES
// ============================================

export type UserRole = 'admin' | 'user' | 'artist' | 'manager' | 'guest';

export interface User {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  role: UserRole;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastLoginAt?: Timestamp;
}

export interface AdminUser extends User {
  role: 'admin';
  permissions: AdminPermission[];
}

export interface ManagerUser extends User {
  role: 'manager';
  permissions: ManagerPermission[];
}

export type AdminPermission =
  | 'beats.read'
  | 'beats.write'
  | 'beats.delete'
  | 'tracks.read'
  | 'tracks.write'
  | 'tracks.delete'
  | 'albums.read'
  | 'albums.write'
  | 'albums.delete'
  | 'remixes.read'
  | 'remixes.write'
  | 'remixes.delete'
  | 'edits.read'
  | 'edits.write'
  | 'edits.delete'
  | 'art.read'
  | 'art.write'
  | 'art.delete'
  | 'services.read'
  | 'services.write'
  | 'services.delete'
  | 'orders.read'
  | 'orders.write'
  | 'orders.delete'
  | 'content.read'
  | 'content.write'
  | 'content.delete'
  | 'collaborations.read'
  | 'collaborations.write'
  | 'collaborations.delete'
  | 'users.read'
  | 'users.write'
  | 'analytics.read'
  | 'settings.write';

export type ManagerPermission =
  | 'beats.read'
  | 'beats.write'
  | 'chat.read'
  | 'chat.write'
  | 'art.read'
  | 'art.write';

// ============================================
// BEAT / PRODUCT TYPES
// ============================================

export type LicenseType = 'exclusive';

export type BeatType = 'free' | 'exclusive';

export interface LicenseDetails {
  type: LicenseType;
  price: number;
  features: string[];
  downloads: number;
  streams: number;
  videos: number;
  distribution: boolean;
}

export interface Beat {
  id: string;
  title: string;
  artist: string;
  bpm: number;
  key: string;
  genre: string;
  duration?: string; // e.g. "3:45"
  subGenre?: string;
  mood?: string[];
  tags: string[];

  // Media
  audioUrl: string;
  artworkUrl: string;
  stemsUrl?: string; // Link to stems zip file
  waveformUrl?: string;

  // Licensing
  licenses: {
    exclusive?: LicenseDetails;
  };

  // Status
  status: 'draft' | 'published' | 'archived' | 'sold';
  beatType?: BeatType; // Optional beat classification (free, basic, premium, exclusive)
  featured: boolean;
  trending: boolean;

  // Stats
  plays: number;
  downloads: number;
  likes: number;

  // SEO & Meta
  description?: string;
  metaTitle?: string;
  metaDescription?: string;
  slug: string;

  // Timestamps
  createdAt: Timestamp;
  updatedAt: Timestamp;
  publishedAt?: Timestamp;

  // Creator info
  createdBy: string;
  lastUpdatedBy: string;
}

// ============================================
// BEAT PACK TYPES
// ============================================

export interface BeatPackItem {
  title: string;
  artist: string;
  bpm: number;
  key: string;
  genre: string;
  duration?: string; // e.g. "3:45"
  audioUrl: string;
  downloadUrl: string;
}

export interface BeatPack {
  id: string;
  title: string;
  description?: string;
  coverUrl: string;
  beats: BeatPackItem[];
  price: number;
  status: 'draft' | 'published';
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;
}

// ============================================
// ART TYPES
// ============================================

export interface Art {
  id: string;
  title: string;
  description: string;
  artist: string;
  medium: string;
  year: number;

  // Art Type System
  type: 'Painting' | 'Hardware' | 'Furniture' | 'Clothing';
  subtype?: string; // For Clothing: 'Jacket', 'Bomber Jacket', 'Jeans', 'Leather Jacket', 'Belt', 'Cap', 'Sunglasses', etc.
  category: string; // Legacy category support

  image: string;
  gallery?: string[];

  // Pricing & Availability
  forSale: boolean; // Toggle for NOT FOR SALE
  price?: number; // Optional, if not set = FREE
  isFree: boolean; // True if no price set or price is 0

  // Stock Management (All art pieces are unique, stock = 1)
  stock: number; // Always 1 for unique pieces
  sold: boolean; // True when purchased
  soldAt?: Timestamp; // When it was sold
  soldToUserId?: string; // User who bought it

  // Status
  status: 'draft' | 'published' | 'archived';
  featured: boolean;

  // SEO & Meta
  slug: string;
  metaTitle?: string;
  metaDescription?: string;

  // Timestamps
  createdAt: Timestamp;
  updatedAt: Timestamp;

  // Creator info
  createdBy: string;
  lastUpdatedBy: string;
}

// ============================================
// SERVICE TYPES
// ============================================

export interface Service {
  id: string;
  name: string;
  description: string;
  rate: number; // Price per hour or service rate
  cta: string; // Call-to-action button text
  gradient: string; // e.g., "from-red-600 to-orange-600"
  icon: string; // Icon name as string (e.g., "Zap", "Music", "Edit")
  coverUrl?: string; // Optional cover image URL

  // Delivery option prices (for services with multiple delivery speeds)
  price48h?: number; // 48-hour delivery price
  price72h?: number; // 72-hour delivery price
  price7days?: number; // 7-day delivery price

  // Download link (for delivering service files/documents)
  downloadUrl?: string; // Optional download link URL

  // Status
  status: 'draft' | 'published' | 'archived';
  featured: boolean;

  // Stats
  inquiries: number;

  // SEO & Meta
  slug: string;
  metaTitle?: string;
  metaDescription?: string;

  // Timestamps
  createdAt: Timestamp;
  updatedAt: Timestamp;

  // Creator info
  createdBy: string;
  lastUpdatedBy: string;
}

// ============================================
// MERCHANDISE SIZE TYPE
// ============================================

export interface MerchandiseSize {
  name: string; // e.g., "S", "M", "L", "XL"
  stock: number; // Quantity available in this size
}

// ============================================
// MERCHANDISE TYPES
// ============================================

export interface Merchandise {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string; // e.g., "Clothing", "Accessories", "Home", "Other"
  image: string; // Product image URL
  gallery?: string[]; // Additional product images

  // Inventory Management
  totalStock: number; // Total quantity available
  sold: number; // Total quantity sold
  sizes?: MerchandiseSize[]; // Optional sizes with individual stock counts (for clothing)

  // Pre-order
  isPreOrder: boolean; // Whether this is a pre-order item
  preOrderDeadline?: Timestamp; // When pre-orders close

  // Brand Logos
  showJeighteenLogo: boolean; // Show JEIGHTEEN logo
  showJonnaRinconLogo: boolean; // Show JONNA RINCON logo

  // Status
  status: 'draft' | 'published' | 'archived';
  featured: boolean;

  // Stats
  views: number;

  // SEO & Meta
  slug: string;
  metaTitle?: string;
  metaDescription?: string;

  // Timestamps
  createdAt: Timestamp;
  updatedAt: Timestamp;

  // Creator info
  createdBy: string;
  lastUpdatedBy: string;
}

// ============================================
// PURCHASE/ORDER TYPES
// ============================================

export interface Purchase {
  id: string;
  productNumber: string; // Unique product number (e.g., "PROD-2024-001")
  userId: string; // UID of buyer
  beatId: string;
  beatTitle: string;
  beatArtist: string;
  artworkUrl: string;
  audioUrl: string;
  stemsUrl?: string;

  // License type purchased
  licenseType: 'exclusive';
  price: number;

  // Download links (time-limited, 30 days)
  downloadLinks: {
    wav?: {
      url: string;
      expiresAt: Timestamp;
    };
    stems?: {
      url: string;
      expiresAt: Timestamp;
    };
    contract?: {
      url: string;
      expiresAt: Timestamp;
    };
  };

  // Status
  status: 'pending' | 'completed' | 'expired';

  // Optional: present for beat-pack purchases. Individual beats inside the pack
  // with their own download links.
  packBeats?: {
    title: string;
    artist: string;
    bpm: number;
    key: string;
    genre: string;
    downloadUrl: string;
  }[];

  // Timestamps
  createdAt: Timestamp;
  expiresAt: Timestamp;
  downloadedAt?: Timestamp;
}

// ============================================
// TRACK TYPES
// ============================================

export interface CustomTrackLink {
  title: string;
  audioUrl: string;
  trackId?: string; // Optional reference to existing track
}

export interface Track {
  id: string;
  title: string;
  artist: string;
  album?: string;
  trackNumber?: number;
  releaseDate?: Timestamp;
  bpm?: number;
  key?: string;
  genre: string;
  duration?: string; // e.g. "3:45"
  subGenre?: string;
  mood?: string[];
  tags: string[];

  // Categorization
  type: 'Album' | 'EP' | 'Single' | 'Exclusive';
  year: number;
  collab: 'Solo' | 'Collab';

  // Media
  audioUrl: string;
  artworkUrl: string;
  waveformUrl?: string;

  // Pricing (optional - free tracks if not set)
  price?: number;

  // Licensing
  licenses: {
    exclusive?: LicenseDetails;
  };

  // Status
  status: 'draft' | 'published' | 'archived';
  featured: boolean;
  isFree: boolean;

  // Stats
  plays: number;
  downloads: number;
  likes: number;

  // SEO & Meta
  description?: string;
  metaTitle?: string;
  metaDescription?: string;
  slug: string;

  // Custom track links for featured tabs
  customTrackLinks?: CustomTrackLink[];

  // Timestamps
  createdAt: Timestamp;
  updatedAt: Timestamp;
  publishedAt?: Timestamp;

  // Creator info
  createdBy: string;
  lastUpdatedBy: string;

  // Album reference
  albumId?: string; // Reference to Album document
  sortOrder?: number; // Track order within album
}

// ============================================
// ALBUM TYPES
// ============================================

export interface AlbumTrackInfo {
  trackId: string;
  trackNumber: number;
  price?: number; // Per-track price override
}

export interface Album {
  id: string;
  title: string;
  artist: string;
  description: string;
  releaseDate: Timestamp;
  genre: string;
  subGenre?: string;
  mood?: string[];
  tags: string[];

  // Media
  coverImageUrl: string;
  artworkUrl: string; // Alias for consistency

  // Tracks
  trackIds: string[]; // References to Track documents
  trackCount: number;
  duration?: number; // Total duration in seconds

  // Pricing
  perTrackPrice: number; // Price for individual track purchase
  fullAlbumPrice: number; // Discounted price for full album
  isFree: boolean;

  // Status
  status: 'draft' | 'published' | 'archived';
  featured: boolean;

  // Stats
  plays: number;
  downloads: number;
  likes: number;

  // SEO & Meta
  metaTitle?: string;
  metaDescription?: string;
  slug: string;

  // Timestamps
  createdAt: Timestamp;
  updatedAt: Timestamp;
  publishedAt?: Timestamp;

  // Creator info
  createdBy: string;
  lastUpdatedBy: string;
}

// ============================================
// REMIX TYPES
// ============================================

export interface Remix {
  id: string;
  title: string;
  remixArtist: string; // Artist who made the remix
  originalArtist: string; // Original track artist
  originalTrackTitle?: string;
  bpm?: number;
  key?: string;
  genre: string;
  duration?: string; // e.g. "3:45"
  subGenre?: string;
  mood?: string[];
  tags: string[];

  // Categorization
  remixType: 'Remix' | 'Edit' | 'Bootleg';
  year: number;
  collab: 'Solo' | 'Collab';

  // Media
  audioUrl: string;
  artworkUrl: string;
  waveformUrl?: string;

  // Licensing
  licenses: {
    exclusive?: LicenseDetails;
  };

  // Status
  status: 'draft' | 'published' | 'archived';
  featured: boolean;
  isFree: boolean;

  // Stats
  plays: number;
  downloads: number;
  likes: number;

  // SEO & Meta
  description?: string;
  metaTitle?: string;
  metaDescription?: string;
  slug: string;

  // Timestamps
  createdAt: Timestamp;
  updatedAt: Timestamp;
  publishedAt?: Timestamp;

  // Creator info
  createdBy: string;
  lastUpdatedBy: string;
}

// ============================================
// EDIT TYPES
// ============================================

export interface Edit {
  id: string;
  title: string;
  artist: string;
  originalTrackId?: string; // Reference to original track if any
  originalArtist?: string;
  editType: 'bootleg' | 'mashup' | 'rework' | 'flip' | 'other';
  bpm?: number;
  key?: string;
  genre: string;
  subGenre?: string;
  mood?: string[];
  tags: string[];

  // Categorization
  year: number;
  collab: 'Solo' | 'Collab';

  // Media
  audioUrl: string;
  artworkUrl: string;
  waveformUrl?: string;

  // Licensing
  licenses: {
    exclusive?: LicenseDetails;
  };

  // Status
  status: 'draft' | 'published' | 'archived';
  featured: boolean;
  isFree: boolean;

  // Stats
  plays: number;
  downloads: number;
  likes: number;

  // SEO & Meta
  description?: string;
  metaTitle?: string;
  metaDescription?: string;
  slug: string;

  // Timestamps
  createdAt: Timestamp;
  updatedAt: Timestamp;
  publishedAt?: Timestamp;

  // Creator info
  createdBy: string;
  lastUpdatedBy: string;
}

// ============================================
// PURCHASE/DOWNLOAD LINK TYPES
// ============================================

export interface DownloadLink {
  url: string;
  expiresAt: Timestamp;
  isActive: boolean;
  downloadedAt?: Timestamp;
}

export type SupportStatus = 'idle' | 'requested' | 'in_progress' | 'completed';
export type ProductCategory = 'beat' | 'track' | 'remix' | 'edit' | 'art' | 'merchandise' | 'service';

// For Mix Masters and services with delivery timers
export interface DeliveryTimer {
  startedAt: Timestamp;
  deliveryOption: '48h' | '72h' | '7days'; // Delivery time option
  expiresAt: Timestamp;
  isCompleted: boolean;
  completedAt?: Timestamp;
}

export interface ProductPurchase {
  id: string;
  orderId: string;
  productId: string;
  productType: ProductCategory;
  productTitle: string;
  productArtist?: string;
  price: number;

  // Product-specific info
  coverImage?: string;

  // Download management
  downloadLinks?: Record<string, DownloadLink>; // e.g., { "wav": {...}, "stems": {...}, "main": {...} }
  supportStatus: SupportStatus;
  supportRequestedAt?: Timestamp;

  // For Mix Masters and services
  deliveryTimer?: DeliveryTimer;

  // Status and metadata
  status: 'active' | 'expired' | 'refunded';
  createdAt: Timestamp;
  updatedAt: Timestamp;

  // Customer and order info
  customerId: string;
  customerEmail: string;
}

// ============================================
// ORDER TYPES
// ============================================

export type OrderStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'refunded'
  | 'cancelled';

export type PaymentMethod = 'stripe' | 'paypal' | 'ideal' | 'bancontact';

export interface OrderItem {
  productId: string;
  productType: ProductCategory;
  productTitle: string;
  productArtist?: string;
  price: number;
  quantity?: number;
  artworkUrl?: string;
  licenseType?: LicenseType;
  deliveryOption?: '48h' | '72h' | '7days'; // For services/mix masters
}

export interface Order {
  id: string;
  orderNumber: string; // e.g., "JR-2024-00123"

  // Customer info
  customerEmail: string;
  customerId?: string; // if registered user
  customerName?: string;

  // Order details
  items: OrderItem[];
  subtotal: number;
  tax: number;
  discount: number;
  discountCode?: string;
  total: number;
  currency: string;

  // Status
  status: OrderStatus;

  // Payment
  paymentMethod: PaymentMethod;
  paymentIntentId?: string;
  paymentStatus: 'pending' | 'succeeded' | 'failed';

  // Delivery
  downloadLinks?: Record<string, string>; // productId -> download link (legacy)
  licensePDFs?: Record<string, string>; // productId -> license PDF URL

  // Notes
  customerNote?: string;
  adminNote?: string;

  // Timestamps
  createdAt: Timestamp;
  updatedAt: Timestamp;
  completedAt?: Timestamp;

  // IP & metadata
  ipAddress?: string;
  userAgent?: string;
}

// ============================================
// CONTENT MANAGEMENT TYPES
// ============================================

export type ContentType = 'blog' | 'news' | 'tutorial' | 'press';
export type ContentStatus = 'draft' | 'published' | 'scheduled' | 'archived';

export interface ContentBlock {
  id: string;
  type: 'text' | 'image' | 'video' | 'audio' | 'code' | 'quote' | 'embed';
  content: any;
  order: number;
}

export interface Content {
  id: string;
  type: ContentType;
  title: string;
  slug: string;
  excerpt?: string;

  // Content
  blocks: ContentBlock[];

  // Media
  featuredImage?: string;
  gallery?: string[];

  // SEO
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string[];

  // Organization
  category?: string;
  tags: string[];

  // Status
  status: ContentStatus;
  featured: boolean;

  // Stats
  views: number;
  likes: number;
  shares: number;

  // Publishing
  author: string;
  authorName: string;
  publishedAt?: Timestamp;
  scheduledFor?: Timestamp;

  // Timestamps
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ============================================
// COLLABORATION / CONTRACT TYPES
// ============================================

export type CollaborationType =
  | 'feature'
  | 'production'
  | 'remix'
  | 'licensing'
  | 'sponsorship'
  | 'other';

export type CollaborationStatus =
  | 'inquiry'
  | 'negotiating'
  | 'agreed'
  | 'contract_sent'
  | 'signed'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

export interface Collaboration {
  id: string;

  // Basic info
  title: string;
  type: CollaborationType;
  status: CollaborationStatus;

  // Parties
  clientName: string;
  clientEmail: string;
  clientCompany?: string;
  clientPhone?: string;

  // Details
  description: string;
  budget?: number;
  currency: string;

  // Timeline
  startDate?: Timestamp;
  endDate?: Timestamp;
  deadline?: Timestamp;

  // Files
  contractPDF?: string;
  attachments?: string[];

  // Payment
  paymentTerms?: string;
  paymentStatus: 'unpaid' | 'partial' | 'paid';
  paidAmount: number;

  // Notes
  notes?: string;
  internalNotes?: string;

  // Timestamps
  createdAt: Timestamp;
  updatedAt: Timestamp;
  signedAt?: Timestamp;
  completedAt?: Timestamp;

  // Creator
  createdBy: string;
  assignedTo?: string;
}

// ============================================
// ANALYTICS TYPES
// ============================================

export interface AnalyticsSnapshot {
  id: string;
  date: Timestamp;

  // Sales
  revenue: number;
  orders: number;
  averageOrderValue: number;

  // Traffic
  visitors: number;
  pageViews: number;
  bounceRate: number;

  // Engagement
  beatPlays: number;
  downloads: number;
  emailSignups: number;

  // Popular
  topBeats: { id: string; plays: number; revenue: number }[];
  topGenres: { genre: string; sales: number }[];
}

// ============================================
// FILE UPLOAD TYPES (PHP Proxy)
// ============================================

export interface FileUploadRequest {
  file: File;
  type: 'audio' | 'image' | 'document' | 'video';
  folder?: string;
}

export interface FileUploadResponse {
  success: boolean;
  url?: string;
  filename?: string;
  size?: number;
  error?: string;
}

// ============================================
// NEWSLETTER & SUBSCRIBERS
// ============================================

export interface NewsletterSubscriber {
  id: string;
  email: string;
  name?: string;
  source: 'website' | 'checkout' | 'manual';
  status: 'active' | 'unsubscribed' | 'bounced';
  tags?: string[];
  subscribedAt: Timestamp;
  unsubscribedAt?: Timestamp;
}

// ============================================
// SETTINGS TYPES
// ============================================

export interface SiteSettings {
  id: 'site_settings';

  // General
  siteName: string;
  siteDescription: string;
  siteLogo?: string;
  contactEmail: string;

  // Social
  socials: {
    instagram?: string;
    twitter?: string;
    youtube?: string;
    spotify?: string;
    soundcloud?: string;
    tiktok?: string;
  };

  // Payment
  stripePublicKey?: string;
  paypalClientId?: string;

  // Email
  emailProvider: 'sendgrid' | 'mailgun' | 'smtp';
  emailFrom: string;

  // PHP Proxy
  phpProxyUrl: string;
  phpProxyApiKey?: string;

  // Background
  backgroundImageUrl?: string;

  // Maintenance
  maintenanceMode: boolean;
  maintenanceMessage?: string;

  updatedAt: Timestamp;
  updatedBy: string;
}

// ============================================
// DISCOUNT CODE TYPES
// ============================================

export type DiscountType = 'percentage' | 'fixed';
export type DiscountUsageLimit = 'unlimited' | 'limited';

export interface DiscountCode {
  id: string;
  code: string; // Unique discount code string
  description?: string;

  // Discount details
  discountType: DiscountType;
  discountValue: number; // Percentage (0-100) or fixed amount

  // Applicable products
  applicableTo: 'all' | 'specific';
  productIds?: string[]; // Beat/Track/Remix IDs this code applies to
  productTypes?: ('beat' | 'track' | 'remix' | 'edit')[]; // Product categories

  // Usage limits
  usageLimit: DiscountUsageLimit;
  maxUses?: number; // Max total uses (if limited)
  usedCount: number; // How many times it's been used
  maxUsesPerUser?: number; // Max uses per individual user

  // Validity
  isActive: boolean;
  hasDeadline: boolean;
  startDate?: Timestamp;
  endDate?: Timestamp;

  // Minimum requirements
  minimumOrderAmount?: number;

  // Timestamps
  createdAt: Timestamp;
  updatedAt: Timestamp;

  // Creator
  createdBy: string;
}

// ============================================
// SITE BACKGROUND TYPES
// ============================================

export interface SiteBackground {
  id: string;
  imageUrl: string;
  name?: string;
  isActive: boolean;
  createdAt: Timestamp;
  createdBy: string;
}

// ============================================
// FOLLOW GATE TYPES
// ============================================

export interface FollowGateCompletion {
  id: string;
  userId: string;
  productId: string;
  productType: 'remix' | 'track' | 'edit' | 'beat';
  productTitle: string;
  artworkUrl?: string;
  audioUrl?: string;

  // Follow gate steps completed
  followedInstagram: boolean;
  followedSpotify: boolean;

  // Download access
  downloadUrl?: string;
  expiresAt: Timestamp; // 30-day expiry

  // Timestamps
  createdAt: Timestamp;
}

// ============================================
// CHAT & MESSAGING TYPES
// ============================================

export type ChatPersonality = 'jonna' | 'manager' | 'support';
export type ChatCategory = 'tracks' | 'remixes' | 'beats' | 'art' | 'merchandise' | 'services' | 'business' | 'questions';
export type MessageStatus = 'sent' | 'delivered' | 'read';

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string; // user UID or 'admin'
  senderName: string;
  senderAvatar?: string;
  personality: ChatPersonality; // Which "person" this is from
  content: string;
  timestamp: Timestamp;
  status: MessageStatus;
  attachments?: string[]; // URLs to images/files

  // Optional context for product/order chats
  linkedProductId?: string;
  linkedOrderId?: string;
}

export interface ChatConversation {
  id: string;
  userId: string; // Customer UID
  userEmail: string;
  userName?: string;

  // Chat metadata
  personalities: ChatPersonality[]; // Which personalities are involved
  category: ChatCategory; // What this chat is about

  // Context
  linkedProductId?: string;
  linkedOrderId?: string;
  subject?: string;

  // Messages and status
  messageCount: number;
  lastMessage?: string;
  lastMessageAt?: Timestamp;
  unreadCount: number;

  // Timeline
  createdAt: Timestamp;
  updatedAt: Timestamp;
  closedAt?: Timestamp;
  isClosed: boolean;
}

export interface ChatPersonalityInfo {
  id: ChatPersonality;
  name: string;
  description: string;
  avatar?: string;
  icon?: string; // lucide-react icon name
  color: string; // Tailwind color class
}

export interface Playlist {
  id: string;
  userId: string;
  name: string;
  description?: string;
  trackIds: string[];
  coverImage: string; // URL of first track's cover
  isPublic: boolean;
  isFeatured: boolean; // Admin only
  views: number;
  likes: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;
}

// ============================================
// AGENDA TYPES
// ============================================

export type AgendaDayStatus = 'available' | 'absent' | 'studio' | string;
export type AgendaStatusType = 'beschikbaar' | 'afwezig' | 'beschikbaar_studio' | 'custom';

export interface AgendaStatus {
  id: string;
  name: string;
  color: string;
  bgColor: string;
  type: AgendaStatusType;
  isBuiltIn: boolean;
  createdAt: Timestamp;
}

export interface AgendaTask {
  id: string;
  title: string;
  description?: string;
  date?: string; // YYYY-MM-DD
  userId?: string;
  userDisplayName?: string;
  productType?: string;
  time?: string;
  completed: boolean;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}

export interface AgendaDay {
  id: string; // YYYY-MM-DD date string
  date: string; // YYYY-MM-DD
  statusId?: string | null;
  statusNote?: string;
  studioSessionOrderId?: string;
  studioSessionInfo?: {
    clientName?: string;
    clientEmail?: string;
    sessionType?: string;
    notes?: string;
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface AgendaEntry {
  id: string; // YYYY-MM-DD date string
  date: string; // YYYY-MM-DD
  status?: AgendaDayStatus;
  statusLabel?: string;
  statusDescription?: string;
  tasks: AgendaTask[];
  studioSessionInfo?: {
    clientName?: string;
    clientEmail?: string;
    sessionType?: string;
    notes?: string;
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface AgendaCustomStatus {
  id: string;
  name: string;
  color: string;
  description?: string;
  createdAt: Timestamp;
}

// ============================================
// PROJECT TYPES
// ============================================

export type ProjectStatus = 'not-started' | 'in-progress' | 'completed';
export type ProjectFilterType = 'all' | 'completed' | 'in-progress' | 'not-started' | 'not-completed' | 'now-working';

export interface ProjectAttachment {
  id: string;
  name: string;
  url: string;
  uploadedAt: Timestamp;
  uploadedBy: string;
}

export interface ProjectSubTask {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  status: ProjectStatus;
  order: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface ProjectCommentReaction {
  userId: string;
  emoji: string;
  timestamp: Timestamp;
}

export interface ProjectComment {
  id: string;
  projectId: string;
  userId: string;
  userDisplayName: string;
  userRole: 'admin' | 'manager';
  content: string;
  reactions: ProjectCommentReaction[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
  editedAt?: Timestamp;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  status: ProjectStatus;
  coverUrl?: string;
  internalDataLink?: string;
  downloadSuffix?: string;
  attachments: ProjectAttachment[];
  subTasks: ProjectSubTask[];
  agendaTaskIds: string[];
  availableDateRanges: {
    startDate: string;
    endDate: string;
  }[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;
  lastUpdatedBy: string;
}

// ============================================
// UTILITY TYPES
// ============================================

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
