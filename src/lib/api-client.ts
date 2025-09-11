// Type-safe API client for the auction platform
// This ensures all frontend components use consistent, typed API calls

import type {
  // API Response types
  APIResponse,
  SuccessResponse,
  ErrorResponse,
  PaginationMeta,
  APIMetaData,
  
  // Entity types
  User,
  Product,
  ProductCard,
  Category,
  Brand,
  Tag,
  Bid,
  BidHistory,
  Notification,
  Transaction,
  
  // Request/Response types
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  PlaceBidRequest,
  PlaceBidResponse,
  
  // Search types
  SearchFilters,
  SearchResponse,
  SearchSuggestion,
  
  // Auth types
  AuthTokens,
  
  // File upload
  FileUploadResult
} from 'src/types/common';

// API Client Class
export class APIClient {
  private baseURL: string;
  private defaultHeaders: Record<string, string>;

  constructor(baseURL: string = '', defaultHeaders: Record<string, string> = {}) {
    this.baseURL = baseURL;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      ...defaultHeaders,
    };
  }

  // Generic request method with automatic token refresh
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<APIResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    
    const config: RequestInit = {
      ...options,
      headers: {
        ...this.defaultHeaders,
        ...options.headers,
      },
    };

    // Handle different body types
    if (options.body && typeof options.body !== 'string' && !(options.body instanceof FormData)) {
      config.body = JSON.stringify(options.body);
    }

    try {
      let response = await fetch(url, config);
      
      // If we get 401 and have a refresh token, try to refresh
      if (response.status === 401 && typeof localStorage !== 'undefined') {
        const authTokens = localStorage.getItem('auth_tokens');
        if (authTokens) {
          try {
            const tokens = JSON.parse(authTokens);
            if (tokens.refreshToken) {
              console.log('🔄 API CLIENT - Attempting token refresh due to 401');
              
              // Try to refresh token
              const refreshResponse = await fetch('/api/auth/refresh', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ refreshToken: tokens.refreshToken }),
              });
              
              if (refreshResponse.ok) {
                const refreshData = await refreshResponse.json();
                if (refreshData.success) {
                  // Update stored tokens
                  const newTokens = {
                    accessToken: refreshData.data.tokens.accessToken,
                    refreshToken: refreshData.data.tokens.refreshToken,
                    expiresAt: Date.now() + (15 * 60 * 1000),
                  };
                  
                  localStorage.setItem('auth_tokens', JSON.stringify(newTokens));
                  localStorage.setItem('auth_user', JSON.stringify(refreshData.data.user));
                  
                  // Update authorization header and retry
                  this.setAuthToken(newTokens.accessToken);
                  config.headers = {
                    ...config.headers,
                    Authorization: `Bearer ${newTokens.accessToken}`,
                  };
                  
                  console.log('🔄 API CLIENT - Token refreshed, retrying request');
                  response = await fetch(url, config);
                }
              }
            }
          } catch (error) {
            console.error('🔄 API CLIENT - Token refresh failed:', error);
          }
        }
      }
      
      const data: APIResponse<T> = await response.json();
      return data;
    } catch (error) {
      console.error('🔄 API CLIENT - Request failed:', error);
      // Return standardized error response for network errors
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

  // GET request
  async get<T>(endpoint: string, params?: Record<string, string | number>): Promise<APIResponse<T>> {
    let url = endpoint;
    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        searchParams.append(key, String(value));
      });
      url += `?${searchParams.toString()}`;
    }
    
    return this.request<T>(url, { method: 'GET' });
  }

  // POST request
  async post<T, U = Record<string, unknown>>(
    endpoint: string, 
    body?: U
  ): Promise<APIResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: body as BodyInit,
    });
  }

  // PUT request
  async put<T, U = Record<string, unknown>>(
    endpoint: string, 
    body?: U
  ): Promise<APIResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: body as BodyInit,
    });
  }

  // PATCH request
  async patch<T, U = Record<string, unknown>>(
    endpoint: string, 
    body?: U
  ): Promise<APIResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: body as BodyInit,
    });
  }

  // DELETE request
  async delete<T>(endpoint: string): Promise<APIResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  // Set authorization token
  setAuthToken(token: string): void {
    this.defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  // Remove authorization token
  removeAuthToken(): void {
    delete this.defaultHeaders['Authorization'];
  }
}

// Create singleton API client instance
export const apiClient = new APIClient();

// Type-safe API methods for specific endpoints

// Authentication APIs
export const authAPI = {
  login: (credentials: LoginRequest): Promise<APIResponse<LoginResponse>> => 
    apiClient.post<LoginResponse, LoginRequest>('/api/auth/login', credentials),

  register: (userData: RegisterRequest): Promise<APIResponse<RegisterResponse>> => 
    apiClient.post<RegisterResponse, RegisterRequest>('/api/auth/register', userData),

  logout: (): Promise<APIResponse<{ message: string }>> => 
    apiClient.post('/api/auth/logout'),

  refreshToken: (refreshToken?: string): Promise<APIResponse<LoginResponse>> => 
    apiClient.post('/api/auth/refresh', refreshToken ? { refreshToken } : {}),

  getMe: (): Promise<APIResponse<User>> => 
    apiClient.get<User>('/api/auth/me'),

  forgotPassword: (email: string): Promise<APIResponse<{ message: string }>> => 
    apiClient.post('/api/auth/forgot-password', { email }),

  verifyEmail: (token: string): Promise<APIResponse<{ message: string }>> => 
    apiClient.post('/api/auth/verify-email', { token }),
};

// Auctions APIs
export const auctionsAPI = {
  getAuctions: (params?: Partial<SearchFilters>): Promise<APIResponse<SearchResponse<ProductCard>>> => 
    apiClient.get('/api/auctions', params),

  getAuction: (id: string): Promise<APIResponse<Product>> => 
    apiClient.get(`/api/auctions/${id}`),

  createAuction: (auctionData: Record<string, unknown>): Promise<APIResponse<Product>> => 
    apiClient.post<Product>('/api/auctions', auctionData),

  updateAuction: (id: string, auctionData: Record<string, unknown>): Promise<APIResponse<Product>> => 
    apiClient.put<Product>(`/api/auctions/${id}`, auctionData),

  deleteAuction: (id: string): Promise<APIResponse<{ message: string }>> => 
    apiClient.delete(`/api/auctions/${id}`),
};

// Bidding APIs
export const biddingAPI = {
  placeBid: (auctionId: string, bidData: PlaceBidRequest): Promise<APIResponse<PlaceBidResponse>> => 
    apiClient.post<PlaceBidResponse, PlaceBidRequest>(`/api/auctions/${auctionId}/bids`, bidData),

  getBidHistory: (auctionId: string, page?: number, limit?: number): Promise<APIResponse<SearchResponse<BidHistory>>> => 
    apiClient.get(`/api/auctions/${auctionId}/bids`, { ...(page && { page }), ...(limit && { limit }) }),

  getUserBids: (page?: number, limit?: number): Promise<APIResponse<SearchResponse<Bid>>> => 
    apiClient.get('/api/bids', { ...(page && { page }), ...(limit && { limit }) }),
};

// User APIs
export const usersAPI = {
  getUsers: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
    status?: string;
  }): Promise<APIResponse<{ users: User[]; meta: { pagination: PaginationMeta } }>> => 
    apiClient.get('/api/users', params),

  getUser: (id: string): Promise<APIResponse<User>> => 
    apiClient.get(`/api/users/${id}`),

  updateUser: (id: string, userData: Record<string, unknown>): Promise<APIResponse<User>> => 
    apiClient.put<User>(`/api/users/${id}`, userData),

  deleteUser: (id: string): Promise<APIResponse<{ message: string }>> => 
    apiClient.delete(`/api/users/${id}`),

  getUserProfile: (): Promise<APIResponse<User>> => 
    apiClient.get<User>('/api/users/profile'),

  updateUserProfile: (userData: Record<string, unknown>): Promise<APIResponse<User>> => 
    apiClient.put<User>('/api/users/profile', userData),

  getUserBalance: (): Promise<APIResponse<{ 
    balanceReal: number; 
    balanceVirtual: number; 
    balanceUSD?: number 
  }>> => 
    apiClient.get('/api/users/balance'),

  getUserStats: (): Promise<APIResponse<{
    totalBids: number;
    wonAuctions: number;
    activeAuctions: number;
    totalSpent: number;
  }>> => 
    apiClient.get('/api/users/stats'),
};

// Categories APIs
export const categoriesAPI = {
  getCategories: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    parentId?: string;
  }): Promise<APIResponse<Array<{
    id: string;
    name: string;
    slug: string;
    description?: string;
    parentId?: string;
    isActive: boolean;
  }>>> => 
    apiClient.get('/api/categories', params),

  getCategory: (id: string): Promise<APIResponse<{
    id: string;
    name: string;
    slug: string;
    description?: string;
    parentId?: string;
    isActive: boolean;
  }>> => 
    apiClient.get(`/api/categories/${id}`),

  getFeaturedCategories: (): Promise<APIResponse<Array<{
    id: string;
    name: string;
    slug: string;
    description?: string;
    productCount: number;
  }>>> => 
    apiClient.get('/api/categories/featured'),

  createCategory: (categoryData: Record<string, unknown>): Promise<APIResponse<{
    id: string;
    name: string;
    slug: string;
    description?: string;
    parentId?: string;
    isActive: boolean;
  }>> => 
    apiClient.post('/api/categories', categoryData),

  updateCategory: (id: string, categoryData: Record<string, unknown>): Promise<APIResponse<{
    id: string;
    name: string;
    slug: string;
    description?: string;
    parentId?: string;
    isActive: boolean;
  }>> => 
    apiClient.put(`/api/categories/${id}`, categoryData),

  deleteCategory: (id: string): Promise<APIResponse<{ message: string }>> => 
    apiClient.delete(`/api/categories/${id}`),
};

// Upload APIs
export const uploadAPI = {
  uploadImage: (file: File, type?: string): Promise<APIResponse<{
    url: string;
    filename: string;
    size: number;
    type: string;
    uploadedAt: string;
  }>> => {
    const formData = new FormData();
    formData.append('image', file);
    if (type) formData.append('type', type);
    
    return apiClient.request('/api/upload/image', {
      method: 'POST',
      body: formData,
      headers: {}, // Let browser set Content-Type for FormData
    });
  },
};

// Notifications APIs
export const notificationsAPI = {
  getNotifications: (params?: {
    page?: number;
    limit?: number;
    unreadOnly?: boolean;
  }): Promise<APIResponse<{ 
    notifications: Array<{
      id: string;
      title: string;
      message: string;
      notificationType: string;
      isRead: boolean;
      createdAt: string;
    }>; 
    meta: { pagination: PaginationMeta } 
  }>> => 
    apiClient.get('/api/notifications', params),

  markAsRead: (id: string): Promise<APIResponse<{ message: string }>> => 
    apiClient.patch(`/api/notifications/${id}`, { isRead: true }),

  markAllAsRead: (): Promise<APIResponse<{ message: string }>> => 
    apiClient.post('/api/notifications/mark-all-read'),

  deleteNotification: (id: string): Promise<APIResponse<{ message: string }>> => 
    apiClient.delete(`/api/notifications/${id}`),

  getPreferences: (): Promise<APIResponse<Record<string, boolean>>> => 
    apiClient.get('/api/notifications/preferences'),

  updatePreferences: (preferences: Record<string, boolean>): Promise<APIResponse<Record<string, boolean>>> => 
    apiClient.put('/api/notifications/preferences', preferences),
};

// Search APIs
export const searchAPI = {
  searchAuctions: (query: string, filters?: Partial<SearchFilters>): Promise<APIResponse<SearchResponse<ProductCard>>> => 
    apiClient.get('/api/search', { q: query, ...filters }),

  getSuggestions: (query: string): Promise<APIResponse<{ suggestions: SearchSuggestion[] }>> => 
    apiClient.get('/api/search/suggestions', { q: query }),
};

// Health check API
export const healthAPI = {
  check: (): Promise<APIResponse<{ status: string; timestamp: string }>> => 
    apiClient.get('/api/health'),
};

// Helper function to check if response is successful
export function isSuccessResponse<T>(response: APIResponse<T>): response is { success: true; data: T } {
  return response.success === true;
}

// Helper function to extract error from failed response
export function getErrorMessage(response: APIResponse<unknown>): string {
  if (response.success) return '';
  return response.error.message || 'An error occurred';
}

// Helper function to extract error code from failed response
export function getErrorCode(response: APIResponse<unknown>): string {
  if (response.success) return '';
  return response.error.code || 'UNKNOWN_ERROR';
}