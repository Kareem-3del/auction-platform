'use client';

import type { ReactNode } from 'react';

import { useRouter } from 'next/navigation';
import { useState, useEffect, useContext, createContext } from 'react';

interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  userType: string;
  kycStatus: string;
  isActive: boolean;
  emailVerified: boolean;
  balanceReal: number;
  balanceVirtual: number;
  isAnonymousDisplay?: boolean;
  anonymousDisplayName?: string;
}

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

interface AuthContextType {
  user: User | null;
  tokens: AuthTokens | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (data: RegisterData) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  refreshToken: () => Promise<boolean>;
  updateUser: (userData: Partial<User>) => void;
}

interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  userType?: string;
  agreeToTerms: boolean;
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
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken: refreshTokenValue }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          const newTokens = {
            accessToken: data.data.tokens.accessToken,
            refreshToken: data.data.tokens.refreshToken,
            expiresAt: Date.now() + (15 * 60 * 1000), // 15 minutes
          };

          setTokens(newTokens);
          setUser(data.data.user);
          localStorage.setItem('auth_tokens', JSON.stringify(newTokens));
          localStorage.setItem('auth_user', JSON.stringify(data.data.user));
          return true;
        }
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
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (data.success) {
        const newTokens = {
          accessToken: data.data.tokens.accessToken,
          refreshToken: data.data.tokens.refreshToken,
          expiresAt: Date.now() + (15 * 60 * 1000), // 15 minutes
        };

        setTokens(newTokens);
        setUser(data.data.user);
        localStorage.setItem('auth_tokens', JSON.stringify(newTokens));
        localStorage.setItem('auth_user', JSON.stringify(data.data.user));

        return { success: true };
      } else {
        return { success: false, error: data.error?.message || 'Login failed' };
      }
    } catch (error) {
      return { success: false, error: 'Network error occurred' };
    } finally {
      setLoading(false);
    }
  };

  const register = async (data: RegisterData) => {
    try {
      setLoading(true);
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const responseData = await response.json();

      if (responseData.success) {
        const newTokens = {
          accessToken: responseData.data.tokens.accessToken,
          refreshToken: responseData.data.tokens.refreshToken,
          expiresAt: Date.now() + (15 * 60 * 1000), // 15 minutes
        };

        setTokens(newTokens);
        setUser(responseData.data.user);
        localStorage.setItem('auth_tokens', JSON.stringify(newTokens));
        localStorage.setItem('auth_user', JSON.stringify(responseData.data.user));

        return { success: true };
      } else {
        return { success: false, error: responseData.error?.message || 'Registration failed' };
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
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${tokens.accessToken}`,
          },
          body: JSON.stringify({
            refreshToken: tokens.refreshToken,
          }),
        });
      }
    } catch (error) {
      // Ignore logout errors - we're clearing local state anyway
    }

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