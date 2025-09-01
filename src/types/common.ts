// =============================================================================
// CENTRALIZED TYPES FOR AUCTION PLATFORM
// =============================================================================
// This is the single source of truth for all entity types
// DO NOT create duplicate types in other files - import from here

// =============================================================================
// COMMON ENUMS & CONSTANTS
// =============================================================================

export const USER_ROLES = ['USER', 'AGENT', 'ADMIN'] as const;
export const USER_STATUSES = ['ACTIVE', 'SUSPENDED', 'LOCKED'] as const;
export const KYC_STATUSES = ['PENDING', 'APPROVED', 'REJECTED'] as const;
export const AUCTION_STATUSES = ['SCHEDULED', 'LIVE', 'ENDED'] as const;
export const PRODUCT_CONDITIONS = ['NEW', 'EXCELLENT', 'GOOD', 'FAIR', 'POOR'] as const;
export const TRANSACTION_TYPES = ['DEPOSIT', 'WITHDRAWAL', 'BID_PLACED', 'BID_WON', 'BID_REFUND'] as const;
export const TRANSACTION_STATUSES = ['PENDING', 'COMPLETED', 'FAILED', 'CANCELLED'] as const;
export const NOTIFICATION_TYPES = ['BID_PLACED', 'BID_WON', 'BID_OUTBID', 'AUCTION_STARTED', 'AUCTION_ENDING', 'PAYMENT_RECEIVED', 'SYSTEM'] as const;
export const DELIVERY_METHODS = ['EMAIL', 'PUSH', 'SMS', 'IN_APP'] as const;

export type UserRole = typeof USER_ROLES[number];
export type UserStatus = typeof USER_STATUSES[number];
export type KYCStatus = typeof KYC_STATUSES[number];
export type AuctionStatus = typeof AUCTION_STATUSES[number];
export type ProductCondition = typeof PRODUCT_CONDITIONS[number];
export type TransactionType = typeof TRANSACTION_TYPES[number];
export type TransactionStatus = typeof TRANSACTION_STATUSES[number];
export type NotificationType = typeof NOTIFICATION_TYPES[number];
export type DeliveryMethod = typeof DELIVERY_METHODS[number];

// =============================================================================
// BASE ENTITY INTERFACES
// =============================================================================

export interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
}

export interface BaseEntityWithSoftDelete extends BaseEntity {
  deletedAt?: string;
}

// =============================================================================
// USER RELATED TYPES
// =============================================================================

export interface User extends BaseEntity {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: UserRole;
  accountStatus: UserStatus;
  isEmailVerified: boolean;
  kycStatus?: KYCStatus;
  balanceReal: number;
  balanceVirtual: number;
  balanceUSD?: number;
  isAnonymousDisplay?: boolean;
  anonymousDisplayName?: string;
  lastLoginAt?: string;
  profileImageUrl?: string;
  // Related entities
  agent?: Agent;
}

export interface Agent extends BaseEntity {
  userId: string;
  businessName: string;
  displayName: string;
  businessRegistrationNumber?: string;
  taxId?: string;
  businessAddress?: string;
  businessPhone?: string;
  businessEmail?: string;
  websiteUrl?: string;
  description?: string;
  logoUrl?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';
  approvedAt?: string;
  approvedById?: string;
  // Related entities
  user: User;
}

export interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  profileImageUrl?: string;
  isAnonymousDisplay?: boolean;
  anonymousDisplayName?: string;
}

export interface UserStats {
  totalBids: number;
  wonAuctions: number;
  activeAuctions: number;
  totalSpent: number;
  averageBidAmount: number;
  successRate: number;
}

export interface UserBalance {
  balanceReal: number;
  balanceVirtual: number;
  balanceUSD?: number;
}

// =============================================================================
// PRODUCT & AUCTION TYPES
// =============================================================================

export interface Category extends BaseEntity {
  name: string;
  nameAr?: string;
  slug: string;
  description?: string;
  descriptionAr?: string;
  parentId?: string;
  imageUrl?: string;
  isActive: boolean;
  sortOrder?: number;
  productCount?: number;
  // Related entities
  parent?: Category;
  children?: Category[];
}

export interface Tag extends BaseEntity {
  name: string;
  nameAr?: string;
  slug: string;
  color?: string;
  isActive: boolean;
  productCount?: number;
}

export interface Brand extends BaseEntity {
  name: string;
  nameAr?: string;
  slug: string;
  description?: string;
  descriptionAr?: string;
  logoUrl?: string;
  websiteUrl?: string;
  isActive: boolean;
  productCount?: number;
}

export interface Product extends BaseEntity {
  title: string;
  titleAr?: string;
  description: string;
  descriptionAr?: string;
  slug: string;
  images: string[];
  condition: ProductCondition;
  location: string;
  locationAr?: string;
  
  // Auction fields
  startingBid?: number;
  currentBid?: number;
  bidIncrement?: number;
  reservePrice?: number;
  estimatedValueMin?: number;
  estimatedValueMax?: number;
  auctionStatus?: AuctionStatus;
  startTime?: string;
  endTime?: string;
  bidCount?: number;
  viewCount?: number;
  isReserveMet?: boolean;
  
  // Additional product details
  dimensions?: string;
  weight?: string;
  materials?: string;
  yearMade?: number;
  provenance?: string;
  authenticity?: string;
  
  // Status fields
  isActive: boolean;
  isFeatured?: boolean;
  isPromoted?: boolean;
  
  // Related entities
  categoryId: string;
  category: Category;
  agentId: string;
  agent: Agent;
  brandId?: string;
  brand?: Brand;
  tags?: Tag[];
  
  // Computed fields for auction
  highestBidderId?: string;
  timeRemaining?: string;
  isLive?: boolean;
  canBid?: boolean;
}

export interface ProductSummary {
  id: string;
  title: string;
  slug: string;
  images: string[];
  currentBid?: number;
  bidCount?: number;
  timeRemaining?: string;
  auctionStatus?: AuctionStatus;
  category: {
    id: string;
    name: string;
    slug: string;
  };
  agent: {
    id: string;
    displayName: string;
  };
}

export interface ProductCard {
  id: string;
  title: string;
  titleAr?: string;
  description?: string;
  images: string[];
  currentBid?: number;
  startingBid?: number;
  bidIncrement?: number;
  estimatedValueMin?: number;
  estimatedValueMax?: number;
  reservePrice?: number;
  bidCount?: number;
  uniqueBidders?: number;
  viewCount?: number;
  watcherCount?: number;
  favoriteCount?: number;
  endTime?: string;
  startTime?: string;
  auctionStatus?: AuctionStatus;
  auctionType?: string;
  location?: string;
  condition?: string;
  agentId: string;
  categoryId: string;
  brandId?: string;
  status?: string;
  approvedAt?: string;
  createdAt?: string;
  updatedAt?: string;
  // Time-related computed fields
  timeRemaining?: {
    endTime: string;
    isActive: boolean;
  };
  timeToStart?: {
    startTime: string;
    isScheduled: boolean;
  };
  // Related entities (populated)
  category: {
    id: string;
    name: string;
    slug: string;
  };
  agent: {
    id: string;
    displayName: string;
    businessName?: string;
    logoUrl?: string;
    rating?: string;
    reviewCount?: number;
  };
  brand?: {
    id: string;
    name: string;
    slug: string;
    logoUrl?: string;
  };
  // Counts from relations
  _count?: {
    bids: number;
  };
}

// =============================================================================
// BIDDING TYPES
// =============================================================================

export interface Bid extends BaseEntity {
  amount: number;
  userId: string;
  productId: string;
  bidderName: string; // Anonymous display name or user name
  isAnonymous?: boolean;
  isAutomatic?: boolean;
  maxAmount?: number; // For automatic bidding
  bidTime: string;
  ipAddress?: string;
  userAgent?: string;
  // Related entities
  user: User;
  product: Product;
}

export interface BidHistory {
  id: string;
  amount: number;
  bidderName: string;
  bidTime: string;
  isWinning?: boolean;
}

export interface PlaceBidRequest {
  amount: number;
  isAnonymous?: boolean;
  customName?: string;
  isAutomatic?: boolean;
  maxAmount?: number;
}

export interface PlaceBidResponse {
  bid: Bid;
  newCurrentBid: number;
  bidCount: number;
  message: string;
  isHighestBidder: boolean;
}

// =============================================================================
// TRANSACTION TYPES
// =============================================================================

export interface Transaction extends BaseEntity {
  userId: string;
  transactionType: TransactionType;
  amountReal: number;
  amountVirtual: number;
  currency: string;
  status: TransactionStatus;
  description: string;
  paymentMethod?: string;
  externalReference?: string;
  processedAt?: string;
  metadata?: Record<string, unknown>;
  // Related entities
  user: User;
}

// =============================================================================
// NOTIFICATION TYPES
// =============================================================================

export interface Notification extends BaseEntity {
  userId: string;
  notificationType: NotificationType;
  title: string;
  titleAr?: string;
  message: string;
  messageAr?: string;
  deliveryMethod: DeliveryMethod;
  isRead: boolean;
  readAt?: string;
  data?: Record<string, unknown>;
  // Related entities
  user: User;
}

export interface NotificationPreference extends BaseEntity {
  userId: string;
  notificationType: NotificationType;
  email: boolean;
  push: boolean;
  sms: boolean;
  inApp: boolean;
  // Related entities
  user: User;
}

// =============================================================================
// AUTHENTICATION TYPES
// =============================================================================

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
}

export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface LoginResponse {
  user: User;
  tokens: AuthTokens;
  message?: string;
}

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone?: string;
  acceptTerms: boolean;
  userType?: 'USER' | 'AGENT';
}

export interface RegisterResponse {
  user: User;
  tokens: AuthTokens;
  message: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  password: string;
  confirmPassword: string;
}

// =============================================================================
// SEARCH & FILTERING TYPES
// =============================================================================

export interface SearchFilters {
  search?: string;
  categoryId?: string;
  categories?: string[];
  brandId?: string;
  brands?: string[];
  condition?: ProductCondition;
  conditions?: ProductCondition[];
  minPrice?: number;
  maxPrice?: number;
  location?: string;
  locations?: string[];
  auctionStatus?: AuctionStatus;
  auctionStatuses?: AuctionStatus[];
  sortBy?: 'endTime' | 'currentBid' | 'startTime' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

export interface SearchResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  filters: SearchFilters;
}

export interface SearchSuggestion {
  text: string;
  type: 'product' | 'category' | 'brand' | 'location';
  count?: number;
}

// =============================================================================
// API RESPONSE TYPES
// =============================================================================

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface APIMetaData {
  pagination?: PaginationMeta;
  total?: number;
  filters?: Record<string, string | number | boolean>;
  [key: string]: unknown;
}

export interface SuccessResponse<T> {
  success: true;
  data: T;
  meta?: APIMetaData;
}

export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown> | string[] | string;
    timestamp: string;
  };
}

export type APIResponse<T> = SuccessResponse<T> | ErrorResponse;

// =============================================================================
// WEBSOCKET TYPES
// =============================================================================

export interface BidUpdate {
  type: 'bid_update';
  productId: string;
  bid: Bid;
  currentBid: number;
  bidCount: number;
  highestBidderId: string;
  message: string;
  timestamp: string;
}

export interface AuctionStatusUpdate {
  type: 'auction_status_change';
  productId: string;
  status: AuctionStatus;
  message: string;
  timestamp: string;
}

export interface ConnectionStatus {
  type: 'connection_status';
  status: 'connected' | 'disconnected' | 'reconnecting';
  message: string;
  timestamp: string;
}

export type WebSocketMessage = BidUpdate | AuctionStatusUpdate | ConnectionStatus;

// =============================================================================
// COMPONENT PROP TYPES
// =============================================================================

export interface ProductCardProps {
  product: ProductCard;
  variant?: 'default' | 'compact' | 'detailed' | 'ending-soon' | 'trending';
  showAgent?: boolean;
  showCategory?: boolean;
  showBidCount?: boolean;
  showViewCount?: boolean;
  onProductClick?: (product: ProductCard) => void;
}

export interface BidDialogProps {
  productId: string;
  currentBid: number;
  bidIncrement: number;
  timeLeft?: string;
  auctionStatus?: AuctionStatus;
  onBidPlaced?: () => void;
  isConnected?: boolean;
  connectionError?: string | null;
  onReconnect?: () => void;
  lastBidUpdate?: {
    id: string;
    amount: number;
    bidderName: string;
    bidTime: string;
  };
  liveCurrentBid?: number;
  liveBidCount?: number;
  bidButtonDisabled?: boolean;
  bidCooldownTime?: number;
}

export interface SearchPageProps {
  initialFilters?: SearchFilters;
  initialResults?: SearchResponse<ProductCard>;
}

// =============================================================================
// FORM TYPES
// =============================================================================

export interface ProductFormData {
  title: string;
  titleAr?: string;
  description: string;
  descriptionAr?: string;
  categoryId: string;
  brandId?: string;
  tagIds?: string[];
  condition: ProductCondition;
  location: string;
  locationAr?: string;
  images: string[];
  startingBid?: number;
  reservePrice?: number;
  bidIncrement?: number;
  estimatedValueMin?: number;
  estimatedValueMax?: number;
  startTime?: string;
  endTime?: string;
  dimensions?: string;
  weight?: string;
  materials?: string;
  yearMade?: number;
  provenance?: string;
  authenticity?: string;
  isFeatured?: boolean;
  isPromoted?: boolean;
}

export interface CategoryFormData {
  name: string;
  nameAr?: string;
  description?: string;
  descriptionAr?: string;
  parentId?: string;
  imageUrl?: string;
  isActive: boolean;
  sortOrder?: number;
}

export interface UserFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role?: UserRole;
  accountStatus?: UserStatus;
  kycStatus?: KYCStatus;
  isAnonymousDisplay?: boolean;
  anonymousDisplayName?: string;
}

// =============================================================================
// UTILITY TYPES
// =============================================================================

export interface FileUploadResult {
  url: string;
  filename: string;
  size: number;
  type: string;
  uploadedAt: string;
}

export interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isExpired: boolean;
  formattedString: string;
}

// Type guards
export function isSuccessResponse<T>(response: APIResponse<T>): response is SuccessResponse<T> {
  return response.success === true;
}

export function isErrorResponse(response: APIResponse<unknown>): response is ErrorResponse {
  return response.success === false;
}

// =============================================================================
// EXPORT ALL TYPES
// =============================================================================
// Re-export all main types for easy importing
export type CommonTypes = {
  BaseEntity: BaseEntity;
  BaseEntityWithSoftDelete: BaseEntityWithSoftDelete;
};