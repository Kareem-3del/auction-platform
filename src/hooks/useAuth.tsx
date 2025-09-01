'use client';

import type { ReactNode } from 'react';

import { useRouter } from 'next/navigation';
import { useState, useEffect, useContext, createContext } from 'react';
import { authAPI, apiClient, isSuccessResponse } from 'src/lib/api-client';
import type { User, AuthTokens, LoginRequest, RegisterRequest } from 'src/types/common';

interface AuthContextType {
  user: User | null;
  tokens: AuthTokens | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (data: RegisterRequest) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  refreshToken: () => Promise<boolean>;
  updateUser: (userData: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [tokens, setTokens] = useState<AuthTokens | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Load auth state from localStorage on mount
  useEffect(() => {
    const storedTokens = localStorage.getItem('auth_tokens');
    const storedUser = localStorage.getItem('auth_user');

    if (storedTokens && storedUser) {
      try {
        const parsedTokens = JSON.parse(storedTokens);
        const parsedUser = JSON.parse(storedUser);

        // Check if token is still valid
        if (parsedTokens.expiresAt > Date.now()) {
          setTokens(parsedTokens);
          setUser(parsedUser);
          // Set token in API client
          apiClient.setAuthToken(parsedTokens.accessToken);
        } else {
          // Token expired, try to refresh
          attemptTokenRefresh(parsedTokens.refreshToken);
        }
      } catch (error) {
        // Invalid stored data, clear it
        localStorage.removeItem('auth_tokens');
        localStorage.removeItem('auth_user');
      }
    }
    setLoading(false);
  }, []);

  // Set up token refresh interval
  useEffect(() => {
    if (tokens && user) {
      const timeUntilExpiry = tokens.expiresAt - Date.now();
      const refreshTime = Math.max(timeUntilExpiry - 60000, 30000); // Refresh 1 minute before expiry, or in 30 seconds

      const refreshInterval = setTimeout(() => {
        refreshToken();
      }, refreshTime);

      return () => clearTimeout(refreshInterval);
    }
  }, [tokens]);

  const attemptTokenRefresh = async (refreshTokenValue: string) => {
    try {
      const response = await authAPI.refreshToken(refreshTokenValue);

      if (isSuccessResponse(response)) {
        // Calculate expiration time (JWT tokens typically expire in 15 minutes)
        const expiresAt = Date.now() + (15 * 60 * 1000); // 15 minutes from now
        
        const newTokens: AuthTokens = {
          accessToken: response.data.tokens.accessToken,
          refreshToken: response.data.tokens.refreshToken,
          expiresAt,
        };

        // Set API client token
        apiClient.setAuthToken(newTokens.accessToken);

        setTokens(newTokens);
        setUser(response.data.user);
        localStorage.setItem('auth_tokens', JSON.stringify(newTokens));
        localStorage.setItem('auth_user', JSON.stringify(response.data.user));
        return true;
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
    }

    // Refresh failed, clear auth state
    logout();
    return false;
  };

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      const loginData: LoginRequest = { email, password };
      const response = await authAPI.login(loginData);

      if (isSuccessResponse(response)) {
        // Calculate expiration time (JWT tokens typically expire in 15 minutes)
        const expiresAt = Date.now() + (15 * 60 * 1000); // 15 minutes from now
        
        const newTokens: AuthTokens = {
          accessToken: response.data.tokens.accessToken,
          refreshToken: response.data.tokens.refreshToken,
          expiresAt,
        };

        // Set API client token for future requests
        apiClient.setAuthToken(newTokens.accessToken);

        setTokens(newTokens);
        setUser(response.data.user);
        localStorage.setItem('auth_tokens', JSON.stringify(newTokens));
        localStorage.setItem('auth_user', JSON.stringify(response.data.user));

        return { success: true };
      } else {
        return { success: false, error: response.error.message || 'Login failed' };
      }
    } catch (error) {
      return { success: false, error: 'Network error occurred' };
    } finally {
      setLoading(false);
    }
  };

  const register = async (data: RegisterRequest) => {
    try {
      setLoading(true);
      const response = await authAPI.register(data);

      if (isSuccessResponse(response)) {
        // Calculate expiration time (JWT tokens typically expire in 15 minutes)
        const expiresAt = Date.now() + (15 * 60 * 1000); // 15 minutes from now
        
        const newTokens: AuthTokens = {
          accessToken: response.data.tokens.accessToken,
          refreshToken: response.data.tokens.refreshToken,
          expiresAt,
        };

        // Set API client token for future requests
        apiClient.setAuthToken(newTokens.accessToken);

        setTokens(newTokens);
        setUser(response.data.user);
        localStorage.setItem('auth_tokens', JSON.stringify(newTokens));
        localStorage.setItem('auth_user', JSON.stringify(response.data.user));

        return { success: true };
      } else {
        return { success: false, error: response.error.message || 'Registration failed' };
      }
    } catch (error) {
      return { success: false, error: 'Network error occurred' };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      if (tokens) {
        // Set token for the logout API call
        apiClient.setAuthToken(tokens.accessToken);
        await authAPI.logout();
      }
    } catch (error) {
      // Ignore logout errors - we're clearing local state anyway
    }

    // Clear API client token
    apiClient.removeAuthToken();
    
    setUser(null);
    setTokens(null);
    localStorage.removeItem('auth_tokens');
    localStorage.removeItem('auth_user');
    router.push('/auth/login');
  };

  const refreshToken = async (): Promise<boolean> => {
    if (!tokens?.refreshToken) {
      return false;
    }

    return attemptTokenRefresh(tokens.refreshToken);
  };

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
      localStorage.setItem('auth_user', JSON.stringify(updatedUser));
    }
  };

  const value = {
    user,
    tokens,
    loading,
    login,
    register,
    logout,
    refreshToken,
    updateUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// HOC for protecting routes
export function withAuth<P extends object>(Component: React.ComponentType<P>) {
  return function AuthenticatedComponent(props: P) {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
      if (!loading && !user) {
        router.push('/auth/login');
      }
    }, [user, loading, router]);

    if (loading) {
      return <div>Loading...</div>;
    }

    if (!user) {
      return null;
    }

    return <Component {...props} />;
  };
}

// Hook for making authenticated API calls
export function useAuthenticatedFetch() {
  const { tokens, refreshToken } = useAuth();

  const authenticatedFetch = async (url: string, options: RequestInit = {}) => {
    if (!tokens) {
      throw new Error('No authentication token available');
    }

    const headers = {
      ...options.headers,
      'Authorization': `Bearer ${tokens.accessToken}`,
    };

    let response = await fetch(url, { ...options, headers });

    // If unauthorized, try to refresh token and retry
    if (response.status === 401) {
      const refreshSuccessful = await refreshToken();
      if (refreshSuccessful && tokens) {
        const retryHeaders = {
          ...options.headers,
          'Authorization': `Bearer ${tokens.accessToken}`,
        };
        response = await fetch(url, { ...options, headers: retryHeaders });
      }
    }

    return response;
  };

  return authenticatedFetch;
}

// Helper function to get current access token
export function getAccessToken(): string | null {
  try {
    const storedTokens = localStorage.getItem('auth_tokens');
    if (storedTokens) {
      const parsedTokens = JSON.parse(storedTokens);
      if (parsedTokens.expiresAt > Date.now()) {
        return parsedTokens.accessToken;
      }
    }
  } catch (error) {
    console.error('Error getting access token:', error);
  }
  return null;
}