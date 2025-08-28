import type { NextRequest } from 'next/server';
import type { UserType } from '@prisma/client';

import { type AuthUser, getCurrentUser } from '@/lib/auth';
import { 
  ErrorCodes,
  errorResponse 
} from '@/lib/api-response';

// Extend NextRequest to include user data
export interface AuthenticatedRequest extends NextRequest {
  user: AuthUser;
}

// Authentication options
export interface AuthOptions {
  required?: boolean;
  roles?: UserType[];
  kycRequired?: boolean;
  emailVerificationRequired?: boolean;
}

// Default authentication options
const defaultAuthOptions: AuthOptions = {
  required: true,
  roles: [],
  kycRequired: false,
  emailVerificationRequired: false,
};

/**
 * Authentication middleware for API routes
 * Extracts and validates JWT token from Authorization header
 */
export async function authenticate(
  request: NextRequest,
  options: AuthOptions = {}
): Promise<{ user: AuthUser | null; error?: any }> {
  const opts = { ...defaultAuthOptions, ...options };

  try {
    // Get authorization header
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      if (opts.required) {
        return {
          user: null,
          error: errorResponse(
            ErrorCodes.AUTH_TOKEN_INVALID,
            'Authorization header missing or invalid',
            401
          ),
        };
      }
      return { user: null };
    }

    const accessToken = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Get current user
    const user = await getCurrentUser(accessToken);
    
    if (!user) {
      if (opts.required) {
        return {
          user: null,
          error: errorResponse(
            ErrorCodes.AUTH_TOKEN_INVALID,
            'Invalid or expired access token',
            401
          ),
        };
      }
      return { user: null };
    }

    // Check if account is active
    if (!user.isActive) {
      return {
        user: null,
        error: errorResponse(
          ErrorCodes.AUTH_ACCOUNT_SUSPENDED,
          'Account has been suspended',
          403
        ),
      };
    }

    // Check email verification if required
    if (opts.emailVerificationRequired && !user.emailVerified) {
      return {
        user: null,
        error: errorResponse(
          ErrorCodes.AUTH_EMAIL_NOT_VERIFIED,
          'Email verification required',
          403
        ),
      };
    }

    // Check KYC verification if required
    if (opts.kycRequired && user.kycStatus !== 'VERIFIED') {
      return {
        user: null,
        error: errorResponse(
          ErrorCodes.AUTH_KYC_REQUIRED,
          'KYC verification required for this action',
          403
        ),
      };
    }

    // Check user role if specified
    if (opts.roles && opts.roles.length > 0 && !opts.roles.includes(user.userType)) {
      return {
        user: null,
        error: errorResponse(
          ErrorCodes.AUTH_INSUFFICIENT_PERMISSIONS,
          'Insufficient permissions for this action',
          403
        ),
      };
    }

    return { user };

  } catch (error) {
    console.error('Authentication middleware error:', error);
    
    if (opts.required) {
      return {
        user: null,
        error: errorResponse(
          ErrorCodes.INTERNAL_SERVER_ERROR,
          'Authentication service error',
          500
        ),
      };
    }
    
    return { user: null };
  }
}

/**
 * Higher-order function to create authenticated route handlers
 */
export function withAuth<T extends any[], R>(
  handler: (request: AuthenticatedRequest, ...args: T) => Promise<R>,
  options: AuthOptions = {}
) {
  return async (request: NextRequest, ...args: T): Promise<R | any> => {
    const { user, error } = await authenticate(request, options);
    
    if (error) {
      return error;
    }

    if (options.required && !user) {
      return errorResponse(
        ErrorCodes.AUTH_TOKEN_INVALID,
        'Authentication required',
        401
      );
    }

    // Attach user to request object
    const authenticatedRequest = request as AuthenticatedRequest;
    authenticatedRequest.user = user!;

    return handler(authenticatedRequest, ...args);
  };
}

/**
 * Middleware specifically for admin routes
 */
export function withAdminAuth<T extends any[], R>(
  handler: (request: AuthenticatedRequest, ...args: T) => Promise<R>
) {
  return withAuth(handler, {
    required: true,
    roles: ['ADMIN', 'SUPER_ADMIN'],
    emailVerificationRequired: true,
  });
}

/**
 * Middleware specifically for agent routes
 */
export function withAgentAuth<T extends any[], R>(
  handler: (request: AuthenticatedRequest, ...args: T) => Promise<R>
) {
  return withAuth(handler, {
    required: true,
    roles: ['AGENT'],
    emailVerificationRequired: true,
  });
}

/**
 * Middleware for routes that require KYC verification
 */
export function withKYCAuth<T extends any[], R>(
  handler: (request: AuthenticatedRequest, ...args: T) => Promise<R>
) {
  return withAuth(handler, {
    required: true,
    kycRequired: true,
    emailVerificationRequired: true,
  });
}

/**
 * Middleware for optional authentication (user may or may not be logged in)
 */
export function withOptionalAuth<T extends any[], R>(
  handler: (request: AuthenticatedRequest, ...args: T) => Promise<R>
) {
  return withAuth(handler, {
    required: false,
  });
}

/**
 * Role checking helper
 */
export function hasRole(user: AuthUser, roles: UserType[]): boolean {
  return roles.includes(user.userType);
}

/**
 * Permission checking helper
 */
export function hasPermission(user: AuthUser, permission: string): boolean {
  // This is a simplified permission system
  // In a real application, you might have more complex permission logic
  
  switch (permission) {
    case 'auction:create':
      return user.userType === 'AGENT';
    
    case 'auction:moderate':
      return ['ADMIN', 'SUPER_ADMIN'].includes(user.userType);
    
    case 'user:manage':
      return ['ADMIN', 'SUPER_ADMIN'].includes(user.userType);
    
    case 'system:configure':
      return user.userType === 'SUPER_ADMIN';
    
    case 'bid:place':
      return user.kycStatus === 'VERIFIED' || user.balanceVirtual < 1000;
    
    default:
      return false;
  }
}

/**
 * Check if user can perform high-value operations (requires KYC)
 */
export function canPerformHighValueOperations(user: AuthUser, amount: number = 1000): boolean {
  return user.kycStatus === 'VERIFIED' || amount < 1000;
}

/**
 * Get display name based on user's anonymity settings
 */
export function getUserDisplayName(user: AuthUser): string {
  if (user.isAnonymousDisplay) {
    return user.anonymousDisplayName;
  }
  return `${user.firstName} ${user.lastName}`;
}

/**
 * Check if user has sufficient balance for operation
 */
export function hasSufficientBalance(user: AuthUser, amount: number): boolean {
  return user.balanceVirtual >= amount;
}