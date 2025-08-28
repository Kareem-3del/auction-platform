import { useRouter } from 'next/navigation';
import { act, render, waitFor, renderHook } from '@testing-library/react';

import { useAuth, withAuth, AuthProvider } from '../useAuth';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
  writable: true,
});

// Mock fetch
global.fetch = jest.fn();

// Mock router
const mockPush = jest.fn();
const mockRouter = {
  push: mockPush,
  replace: jest.fn(),
  back: jest.fn(),
  forward: jest.fn(),
  refresh: jest.fn(),
  prefetch: jest.fn(),
};

describe('useAuth Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (global.fetch as jest.Mock).mockClear();
  });

  const renderWithProvider = (ui: React.ReactElement) => render(<AuthProvider>{ui}</AuthProvider>);

  const renderHookWithProvider = () => renderHook(() => useAuth(), {
      wrapper: ({ children }) => <AuthProvider>{children}</AuthProvider>,
    });

  describe('Authentication State', () => {
    it('should initialize with no user and loading false', async () => {
      const { result } = renderHookWithProvider();

      await waitFor(() => {
        expect(result.current.user).toBeNull();
        expect(result.current.tokens).toBeNull();
        expect(result.current.loading).toBe(false);
      });
    });

    it('should restore user and tokens from localStorage', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        userType: 'BUYER',
        kycStatus: 'PENDING',
        isActive: true,
        emailVerified: true,
        balanceReal: 100,
        balanceVirtual: 300,
      };

      const mockTokens = {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        expiresAt: Date.now() + 900000, // 15 minutes from now
      };

      mockLocalStorage.getItem
        .mockReturnValueOnce(JSON.stringify(mockTokens))
        .mockReturnValueOnce(JSON.stringify(mockUser));

      const { result } = renderHookWithProvider();

      await waitFor(() => {
        expect(result.current.user).toEqual(mockUser);
        expect(result.current.tokens).toEqual(mockTokens);
        expect(result.current.loading).toBe(false);
      });
    });
  });

  describe('Login Function', () => {
    it('should login successfully with valid credentials', async () => {
      const mockResponse = {
        success: true,
        data: {
          user: {
            id: 'user-123',
            email: 'test@example.com',
            firstName: 'John',
            lastName: 'Doe',
            userType: 'BUYER',
            kycStatus: 'PENDING',
            isActive: true,
            emailVerified: true,
            balanceReal: 100,
            balanceVirtual: 300,
          },
          tokens: {
            accessToken: 'new-access-token',
            refreshToken: 'new-refresh-token',
          },
        },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: jest.fn().mockResolvedValue(mockResponse),
      });

      const { result } = renderHookWithProvider();

      let loginResult: any;
      await act(async () => {
        loginResult = await result.current.login('test@example.com', 'password123');
      });

      expect(loginResult.success).toBe(true);
      expect(result.current.user).toEqual(mockResponse.data.user);
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('auth_tokens', expect.any(String));
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('auth_user', expect.any(String));
    });

    it('should handle login failure', async () => {
      const mockResponse = {
        success: false,
        error: {
          message: 'Invalid credentials',
        },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: jest.fn().mockResolvedValue(mockResponse),
      });

      const { result } = renderHookWithProvider();

      let loginResult: any;
      await act(async () => {
        loginResult = await result.current.login('test@example.com', 'wrongpassword');
      });

      expect(loginResult.success).toBe(false);
      expect(loginResult.error).toBe('Invalid credentials');
      expect(result.current.user).toBeNull();
    });

    it('should handle network errors during login', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHookWithProvider();

      let loginResult: any;
      await act(async () => {
        loginResult = await result.current.login('test@example.com', 'password123');
      });

      expect(loginResult.success).toBe(false);
      expect(loginResult.error).toBe('Network error occurred');
    });
  });

  describe('Register Function', () => {
    it('should register successfully with valid data', async () => {
      const mockResponse = {
        success: true,
        data: {
          user: {
            id: 'user-123',
            email: 'newuser@example.com',
            firstName: 'New',
            lastName: 'User',
            userType: 'BUYER',
            kycStatus: 'PENDING',
            isActive: true,
            emailVerified: false,
            balanceReal: 0,
            balanceVirtual: 0,
          },
          tokens: {
            accessToken: 'new-access-token',
            refreshToken: 'new-refresh-token',
          },
        },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: jest.fn().mockResolvedValue(mockResponse),
      });

      const { result } = renderHookWithProvider();

      const registerData = {
        email: 'newuser@example.com',
        password: 'Password123!',
        firstName: 'New',
        lastName: 'User',
        agreeToTerms: true,
      };

      let registerResult: any;
      await act(async () => {
        registerResult = await result.current.register(registerData);
      });

      expect(registerResult.success).toBe(true);
      expect(result.current.user).toEqual(mockResponse.data.user);
    });

    it('should handle registration failure', async () => {
      const mockResponse = {
        success: false,
        error: {
          message: 'Email already exists',
        },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: jest.fn().mockResolvedValue(mockResponse),
      });

      const { result } = renderHookWithProvider();

      const registerData = {
        email: 'existing@example.com',
        password: 'Password123!',
        firstName: 'John',
        lastName: 'Doe',
        agreeToTerms: true,
      };

      let registerResult: any;
      await act(async () => {
        registerResult = await result.current.register(registerData);
      });

      expect(registerResult.success).toBe(false);
      expect(registerResult.error).toBe('Email already exists');
    });
  });

  describe('Logout Function', () => {
    it('should logout and clear stored data', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        userType: 'BUYER',
        kycStatus: 'PENDING',
        isActive: true,
        emailVerified: true,
        balanceReal: 100,
        balanceVirtual: 300,
      };

      const mockTokens = {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        expiresAt: Date.now() + 900000,
      };

      mockLocalStorage.getItem
        .mockReturnValueOnce(JSON.stringify(mockTokens))
        .mockReturnValueOnce(JSON.stringify(mockUser));

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
      });

      const { result } = renderHookWithProvider();

      // Wait for initial load
      await waitFor(() => {
        expect(result.current.user).toEqual(mockUser);
      });

      await act(async () => {
        await result.current.logout();
      });

      expect(result.current.user).toBeNull();
      expect(result.current.tokens).toBeNull();
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('auth_tokens');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('auth_user');
      expect(mockPush).toHaveBeenCalledWith('/auth/login');
    });
  });

  describe('Token Refresh', () => {
    it('should refresh expired tokens automatically', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        userType: 'BUYER',
        kycStatus: 'PENDING',
        isActive: true,
        emailVerified: true,
        balanceReal: 100,
        balanceVirtual: 300,
      };

      const expiredTokens = {
        accessToken: 'expired-token',
        refreshToken: 'refresh-token',
        expiresAt: Date.now() - 1000, // Expired
      };

      mockLocalStorage.getItem
        .mockReturnValueOnce(JSON.stringify(expiredTokens))
        .mockReturnValueOnce(JSON.stringify(mockUser));

      const refreshResponse = {
        success: true,
        data: {
          user: mockUser,
          tokens: {
            accessToken: 'new-access-token',
            refreshToken: 'new-refresh-token',
          },
        },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue(refreshResponse),
      });

      const { result } = renderHookWithProvider();

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/auth/refresh', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ refreshToken: 'refresh-token' }),
        });
      });
    });

    it('should logout when refresh fails', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        userType: 'BUYER',
        kycStatus: 'PENDING',
        isActive: true,
        emailVerified: true,
        balanceReal: 100,
        balanceVirtual: 300,
      };

      const expiredTokens = {
        accessToken: 'expired-token',
        refreshToken: 'refresh-token',
        expiresAt: Date.now() - 1000, // Expired
      };

      mockLocalStorage.getItem
        .mockReturnValueOnce(JSON.stringify(expiredTokens))
        .mockReturnValueOnce(JSON.stringify(mockUser));

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
      });

      renderHookWithProvider();

      await waitFor(() => {
        expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('auth_tokens');
        expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('auth_user');
        expect(mockPush).toHaveBeenCalledWith('/auth/login');
      });
    });
  });

  describe('withAuth HOC', () => {
    const TestComponent = () => <div>Protected Content</div>;
    const ProtectedComponent = withAuth(TestComponent);

    it('should render component when user is authenticated', () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        userType: 'BUYER',
        kycStatus: 'PENDING',
        isActive: true,
        emailVerified: true,
        balanceReal: 100,
        balanceVirtual: 300,
      };

      const mockTokens = {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        expiresAt: Date.now() + 900000,
      };

      mockLocalStorage.getItem
        .mockReturnValueOnce(JSON.stringify(mockTokens))
        .mockReturnValueOnce(JSON.stringify(mockUser));

      const { getByText } = renderWithProvider(<ProtectedComponent />);
      
      waitFor(() => {
        expect(getByText('Protected Content')).toBeInTheDocument();
      });
    });

    it('should redirect when user is not authenticated', async () => {
      renderWithProvider(<ProtectedComponent />);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/auth/login');
      });
    });
  });
});