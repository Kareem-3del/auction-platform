import type { AxiosRequestConfig } from 'axios';

import axios from 'axios';

import { CONFIG } from 'src/global-config';

// ----------------------------------------------------------------------

const axiosInstance = axios.create({ baseURL: CONFIG.serverUrl });

// Get authentication token from localStorage
const getAuthToken = () => {
  if (typeof localStorage !== 'undefined') {
    try {
      // Primary method: auth_tokens format (used by our auth system)
      const authTokens = localStorage.getItem('auth_tokens');
      if (authTokens) {
        const parsedTokens = JSON.parse(authTokens);
        console.log('🔍 AUTH TOKEN DEBUG - Parsed tokens:', {
          hasAccessToken: !!parsedTokens.accessToken,
          expiresAt: parsedTokens.expiresAt,
          currentTime: Date.now(),
          isExpired: parsedTokens.expiresAt <= Date.now()
        });
        
        // Return token even if close to expiry - let the interceptor handle refresh
        if (parsedTokens.accessToken) {
          return parsedTokens.accessToken;
        }
      }
      
      // Fallback: direct accessToken storage
      const accessToken = localStorage.getItem('accessToken');
      if (accessToken) {
        console.log('🔍 AUTH TOKEN DEBUG - Using direct accessToken');
        return accessToken;
      }
      
      console.log('🔍 AUTH TOKEN DEBUG - No token found in localStorage');
    } catch (error) {
      console.warn('Failed to parse auth tokens from localStorage:', error);
    }
  }
  
  return null;
};

axiosInstance.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    console.log('🔍 AUTH TOKEN DEBUG - Request interceptor added token:', {
      url: config.url,
      method: config.method,
      hasToken: !!token,
      tokenStart: token.substring(0, 20) + '...'
    });
  } else {
    console.log('🔍 AUTH TOKEN DEBUG - Request interceptor: NO TOKEN AVAILABLE for', {
      url: config.url,
      method: config.method
    });
  }
  return config;
});

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // If we get a 401 error and haven't already tried to refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Try to refresh the token
        const authTokens = localStorage.getItem('auth_tokens');
        if (authTokens) {
          const parsedTokens = JSON.parse(authTokens);
          if (parsedTokens.refreshToken) {
            const refreshResponse = await axios.post('/api/auth/refresh', {
              refreshToken: parsedTokens.refreshToken
            });
            
            if (refreshResponse.data.success) {
              const newTokens = refreshResponse.data.data.tokens;
              const expiresAt = Date.now() + (30 * 60 * 1000); // 30 minutes from now
              
              const updatedTokens = {
                accessToken: newTokens.accessToken,
                refreshToken: newTokens.refreshToken,
                expiresAt,
              };
              
              localStorage.setItem('auth_tokens', JSON.stringify(updatedTokens));
              
              // Update the authorization header and retry the request
              originalRequest.headers.Authorization = `Bearer ${newTokens.accessToken}`;
              return axiosInstance(originalRequest);
            }
          }
        }
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
        // Clear invalid tokens
        localStorage.removeItem('auth_tokens');
        localStorage.removeItem('auth_user');
        // Redirect to login
        window.location.href = '/auth/login';
      }
    }
    
    return Promise.reject((error.response && error.response.data) || 'Something went wrong!');
  }
);

export default axiosInstance;

// ----------------------------------------------------------------------

export const fetcher = async (args: string | [string, AxiosRequestConfig]) => {
  try {
    const [url, config] = Array.isArray(args) ? args : [args];

    const res = await axiosInstance.get(url, { ...config });

    return res.data;
  } catch (error) {
    console.error('Failed to fetch:', error);
    throw error;
  }
};

// ----------------------------------------------------------------------

// Authenticated fetch utility for components
export const authFetch = async (url: string, options: RequestInit = {}) => {
  const token = getAuthToken();
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
    ...(token && { Authorization: `Bearer ${token}` }),
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response;
};

// Convenience methods for common HTTP operations
export const apiClient = {
  get: async (url: string) => {
    const response = await authFetch(url);
    return response.json();
  },

  post: async (url: string, data?: any) => {
    const response = await authFetch(url, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
    return response.json();
  },

  put: async (url: string, data?: any) => {
    const response = await authFetch(url, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
    return response.json();
  },

  delete: async (url: string) => {
    const response = await authFetch(url, {
      method: 'DELETE',
    });
    return response.json();
  },
};

// ----------------------------------------------------------------------

export const endpoints = {
  chat: '/api/chat',
  kanban: '/api/kanban',
  calendar: '/api/calendar',
  auth: {
    me: '/api/auth/me',
    signIn: '/api/auth/sign-in',
    signUp: '/api/auth/sign-up',
  },
  mail: {
    list: '/api/mail/list',
    details: '/api/mail/details',
    labels: '/api/mail/labels',
  },
  post: {
    list: '/api/post/list',
    details: '/api/post/details',
    latest: '/api/post/latest',
    search: '/api/post/search',
  },
  product: {
    list: '/api/product/list',
    details: '/api/product/details',
    search: '/api/product/search',
  },
};
