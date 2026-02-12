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
  | 'chat.write';

// ============================================
// BEAT / PRODUCT TYPES
// ============================================

export type LicenseType = 'basic' | 'premium' | 'exclusive';

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
  subGenre?: string;
  mood?: string[];
  tags: string[];

  // Media
  audioUrl: string;
  artworkUrl: string;
  waveformUrl?: string;

  // Licensing
  licenses: {
    basic?: LicenseDetails;
    premium?: LicenseDetails;
    exclusive?: LicenseDetails;
  };

  // Status
  status: 'draft' | 'published' | 'archived' | 'sold';
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
  beatId: string;
  beatTitle: string;
  licenseType: LicenseType;
  price: number;
  artworkUrl: string;
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
  total: number;
  currency: string;

  // Status
  status: OrderStatus;

  // Payment
  paymentMethod: PaymentMethod;
  paymentIntentId?: string;
  paymentStatus: 'pending' | 'succeeded' | 'failed';

  // Delivery
  downloadLinks?: Record<string, string>; // beatId -> download link
  licensePDFs?: Record<string, string>; // beatId -> license PDF URL

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

  // Maintenance
  maintenanceMode: boolean;
  maintenanceMessage?: string;

  updatedAt: Timestamp;
  updatedBy: string;
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
