// Shared API types for frontend and backend
// This file ensures consistent typing across the application

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

// API Response union type for frontend handling
export type APIResponse<T> = SuccessResponse<T> | ErrorResponse;

// Frontend API call wrapper types
export interface APICallOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  headers?: Record<string, string>;
  body?: Record<string, unknown> | FormData | string;
  signal?: AbortSignal;
}

export interface APICallResult<T> {
  data?: T;
  error?: ErrorResponse['error'];
  success: boolean;
}

// User-related types
export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'USER' | 'AGENT' | 'ADMIN';
  balanceVirtual: number;
  balanceReal: number;
  balanceUSD?: number;
  kycStatus?: 'PENDING' | 'APPROVED' | 'REJECTED';
  isEmailVerified: boolean;
  accountStatus: 'ACTIVE' | 'SUSPENDED' | 'LOCKED';
  createdAt: string;
  updatedAt: string;
}

// Authentication types
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: string | number; // Can be ISO string or timestamp
}

export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface LoginResponse {
  user: User;
  tokens: AuthTokens;
}

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  acceptTerms: boolean;
}

export interface RegisterResponse {
  user: User;
  tokens: AuthTokens;
  message: string;
}

// Product/Auction types
export interface Product {
  id: string;
  title: string;
  description: string;
  images: string[];
  condition: string;
  location: string;
  estimatedValueMin?: number;
  estimatedValueMax?: number;
  currentBid?: number;
  startingBid?: number;
  bidIncrement?: number;
  bidCount?: number;
  auctionStatus?: 'SCHEDULED' | 'LIVE' | 'ENDED';
  startTime?: string;
  endTime?: string;
  createdAt: string;
  updatedAt: string;
  category: {
    id: string;
    name: string;
    slug: string;
  };
  agent: {
    id: string;
    displayName: string;
    businessName: string;
  };
}

// Bidding types
export interface Bid {
  id: string;
  amount: number;
  userId: string;
  productId: string;
  bidderName: string;
  bidTime: string;
  createdAt: string;
}

export interface PlaceBidRequest {
  amount: number;
  isAnonymous?: boolean;
  customName?: string;
}

export interface PlaceBidResponse {
  bid: Bid;
  message: string;
}

// WebSocket types for real-time bidding
export interface BidUpdate {
  type: 'bid_update';
  productId: string;
  bid: Bid;
  currentBid: number;
  bidCount: number;
  message: string;
}

export interface AuctionStatusUpdate {
  type: 'auction_status_change';
  productId: string;
  status: 'SCHEDULED' | 'LIVE' | 'ENDED';
  message: string;
}

export type WebSocketMessage = BidUpdate | AuctionStatusUpdate;

// Error codes (matching backend)
export const API_ERROR_CODES = {
  // Authentication Errors (401)
  AUTH_TOKEN_EXPIRED: 'AUTH_TOKEN_EXPIRED',
  AUTH_TOKEN_INVALID: 'AUTH_TOKEN_INVALID',
  AUTH_CREDENTIALS_INVALID: 'AUTH_CREDENTIALS_INVALID',
  AUTH_ACCOUNT_SUSPENDED: 'AUTH_ACCOUNT_SUSPENDED',
  AUTH_ACCOUNT_LOCKED: 'AUTH_ACCOUNT_LOCKED',

  // Authorization Errors (403)
  AUTH_INSUFFICIENT_PERMISSIONS: 'AUTH_INSUFFICIENT_PERMISSIONS',
  AUTH_KYC_REQUIRED: 'AUTH_KYC_REQUIRED',
  AUTH_AGENT_APPROVAL_REQUIRED: 'AUTH_AGENT_APPROVAL_REQUIRED',
  AUTH_EMAIL_NOT_VERIFIED: 'AUTH_EMAIL_NOT_VERIFIED',

  // Validation Errors (422)
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  AUCTION_ENDED: 'AUCTION_ENDED',
  BID_TOO_LOW: 'BID_TOO_LOW',
  INSUFFICIENT_BALANCE: 'INSUFFICIENT_BALANCE',
  USER_ALREADY_EXISTS: 'USER_ALREADY_EXISTS',

  // Business Logic Errors (400)
  AUCTION_NOT_LIVE: 'AUCTION_NOT_LIVE',
  PAYMENT_FAILED: 'PAYMENT_FAILED',
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  INVALID_FILE_TYPE: 'INVALID_FILE_TYPE',

  // Not Found Errors (404)
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  AUCTION_NOT_FOUND: 'AUCTION_NOT_FOUND',
  PRODUCT_NOT_FOUND: 'PRODUCT_NOT_FOUND',
  TRANSACTION_NOT_FOUND: 'TRANSACTION_NOT_FOUND',

  // Rate Limiting (429)
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',

  // System Errors (500)
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
} as const;

export type APIErrorCode = typeof API_ERROR_CODES[keyof typeof API_ERROR_CODES];

// Helper type guards for frontend
export function isSuccessResponse<T>(response: APIResponse<T>): response is SuccessResponse<T> {
  return response.success === true;
}

export function isErrorResponse(response: APIResponse): response is ErrorResponse {
  return response.success === false;
}

// Frontend API client helper
export async function apiCall<T>(
  url: string,
  options: APICallOptions = {}
): Promise<APICallResult<T>> {
  try {
    const { method = 'GET', headers = {}, body, signal } = options;
    
    const requestInit: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      signal,
    };

    if (body && method !== 'GET') {
      if (body instanceof FormData) {
        delete requestInit.headers['Content-Type']; // Let browser set it for FormData
        requestInit.body = body;
      } else if (typeof body === 'string') {
        requestInit.body = body;
      } else {
        requestInit.body = JSON.stringify(body);
      }
    }

    const response = await fetch(url, requestInit);
    const result: APIResponse<T> = await response.json();

    if (isSuccessResponse(result)) {
      return {
        success: true,
        data: result.data,
      };
    } else {
      return {
        success: false,
        error: result.error,
      };
    }
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: error instanceof Error ? error.message : 'Network error occurred',
        timestamp: new Date().toISOString(),
      },
    };
  }
}

// Theme-specific response helpers for frontend
export interface ThemeCompatibleResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown> | string[] | string;
    timestamp: string;
  };
  meta?: APIMetaData;
}

export function normalizeApiResponse<T>(response: APIResponse<T>): ThemeCompatibleResponse<T> {
  if (isSuccessResponse(response)) {
    return {
      success: true,
      data: response.data,
      meta: response.meta,
    };
  } else {
    return {
      success: false,
      error: response.error,
    };
  }
}