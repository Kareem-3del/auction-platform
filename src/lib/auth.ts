import type { User, UserType, KYCStatus } from '@prisma/client';

import jwt from 'jsonwebtoken';
import * as argon2 from 'argon2';

import { prisma } from './prisma';

// Types
export interface JWTPayload {
  sub: string; // user id
  email: string;
  role: UserType;
  kycStatus: KYCStatus;
  iat: number;
  exp: number;
}

export interface RefreshTokenPayload {
  sub: string;
  tokenVersion: number;
  iat: number;
  exp: number;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  userType: UserType;
  kycStatus: KYCStatus;
  isActive: boolean;
  emailVerified: boolean;
  balanceReal: number;
  balanceVirtual: number;
  balanceUSD: number;
  isAnonymousDisplay: boolean;
  anonymousDisplayName: string;
  agent?: {
    id: string;
    status: string;
    businessName: string;
    displayName: string;
  };
}

// Configuration - lazy load to avoid build-time errors
const getAccessTokenSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET must be defined in environment variables');
  }
  return secret;
};

const getRefreshTokenSecret = () => {
  const secret = process.env.JWT_REFRESH_SECRET;
  if (!secret) {
    throw new Error('JWT_REFRESH_SECRET must be defined in environment variables');
  }
  return secret;
};

const ACCESS_TOKEN_EXPIRES = process.env.JWT_ACCESS_EXPIRES_IN || '30m';
const REFRESH_TOKEN_EXPIRES = process.env.JWT_REFRESH_EXPIRES_IN || '30d';

// Password utilities
export async function hashPassword(password: string): Promise<string> {
  try {
    return await argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: 2 ** 16, // 64 MB
      timeCost: 3, // 3 iterations
      parallelism: 1, // 1 thread
    });
  } catch (error) {
    throw new Error('Failed to hash password');
  }
}

export async function verifyPassword(hash: string, password: string): Promise<boolean> {
  try {
    return await argon2.verify(hash, password);
  } catch (error) {
    return false;
  }
}

// Token utilities
export function generateAccessToken(user: User): string {
  const payload: JWTPayload = {
    sub: user.id,
    email: user.email,
    role: user.userType,
    kycStatus: user.kycStatus,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (30 * 60), // 30 minutes
  };

  return jwt.sign(payload, getAccessTokenSecret(), {
    algorithm: 'HS256',
  });
}

export function generateRefreshToken(user: User, tokenVersion: number = 1): string {
  const payload: RefreshTokenPayload = {
    sub: user.id,
    tokenVersion,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60), // 30 days
  };

  return jwt.sign(payload, getRefreshTokenSecret(), {
    algorithm: 'HS256',
  });
}

export function generateTokens(user: User, tokenVersion: number = 1): AuthTokens {
  return {
    accessToken: generateAccessToken(user),
    refreshToken: generateRefreshToken(user, tokenVersion),
  };
}

export function verifyAccessToken(token: string): JWTPayload {
  try {
    return jwt.verify(token, getAccessTokenSecret()) as JWTPayload;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('TOKEN_EXPIRED');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('TOKEN_INVALID');
    }
    throw new Error('TOKEN_VERIFICATION_FAILED');
  }
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  try {
    return jwt.verify(token, getRefreshTokenSecret()) as RefreshTokenPayload;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('REFRESH_TOKEN_EXPIRED');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('REFRESH_TOKEN_INVALID');
    }
    throw new Error('REFRESH_TOKEN_VERIFICATION_FAILED');
  }
}

// Authentication functions
export async function authenticateUser(email: string, password: string): Promise<{
  user: AuthUser;
  tokens: AuthTokens;
} | null> {
  try {
    // Find user by email including agent information
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: {
        agent: {
          select: {
            id: true,
            status: true,
            businessName: true,
            displayName: true,
          }
        }
      }
    });

    if (!user) {
      return null;
    }

    // Check if account is locked
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new Error('ACCOUNT_LOCKED');
    }

    // Verify password
    const isValidPassword = await verifyPassword(user.passwordHash, password);
    
    if (!isValidPassword) {
      // Increment login attempts
      const newLoginAttempts = user.loginAttempts + 1;
      const updates: any = { loginAttempts: newLoginAttempts };
      
      // Lock account after 5 failed attempts for 15 minutes
      if (newLoginAttempts >= 5) {
        updates.lockedUntil = new Date(Date.now() + 15 * 60 * 1000);
      }
      
      await prisma.user.update({
        where: { id: user.id },
        data: updates,
      });
      
      return null;
    }

    // Check if user is active
    if (!user.isActive) {
      throw new Error('ACCOUNT_SUSPENDED');
    }

    // Reset login attempts and update last login
    await prisma.user.update({
      where: { id: user.id },
      data: {
        loginAttempts: 0,
        lockedUntil: null,
        lastLoginAt: new Date(),
      },
    });

    // Generate tokens
    const tokens = generateTokens(user);

    // Create session
    await createUserSession(user.id, tokens.refreshToken);

    // Return user data (excluding sensitive information)
    const authUser: AuthUser = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      userType: user.userType,
      kycStatus: user.kycStatus,
      isActive: user.isActive,
      emailVerified: user.emailVerified,
      balanceReal: Number(user.balanceReal),
      balanceVirtual: Number(user.balanceVirtual),
      balanceUSD: Number(user.balanceUSD),
      isAnonymousDisplay: user.isAnonymousDisplay,
      anonymousDisplayName: user.anonymousDisplayName,
      agent: user.agent ? {
        id: user.agent.id,
        status: user.agent.status,
        businessName: user.agent.businessName,
        displayName: user.agent.displayName,
      } : undefined,
    };

    return { user: authUser, tokens };
  } catch (error) {
    console.error('Authentication error:', error);
    throw error;
  }
}

export async function registerUser(userData: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  userType?: UserType;
  phone?: string;
}): Promise<{
  user: AuthUser;
  tokens: AuthTokens;
}> {
  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: userData.email.toLowerCase() },
    });

    if (existingUser) {
      throw new Error('USER_ALREADY_EXISTS');
    }

    // Hash password
    const passwordHash = await hashPassword(userData.password);

    // Generate anonymous display name
    const anonymousDisplayName = generateAnonymousName();

    // Create user
    const user = await prisma.user.create({
      data: {
        email: userData.email.toLowerCase(),
        passwordHash,
        firstName: userData.firstName,
        lastName: userData.lastName,
        userType: userData.userType || 'BUYER',
        phone: userData.phone,
        anonymousDisplayName,
        anonymousAvatarUrl: '/avatars/default-anonymous.png',
        virtualMultiplier: 3.0, // Default multiplier
      },
    });

    // Generate tokens
    const tokens = generateTokens(user);

    // Create session
    await createUserSession(user.id, tokens.refreshToken);

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        targetId: user.id,
        entityType: 'user',
        entityId: user.id,
        action: 'user_registered',
        newValues: {
          email: user.email,
          userType: user.userType,
        },
        ipAddress: '127.0.0.1', // TODO: Get actual IP
        userAgent: 'Unknown', // TODO: Get actual user agent
      },
    });

    const authUser: AuthUser = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      userType: user.userType,
      kycStatus: user.kycStatus,
      isActive: user.isActive,
      emailVerified: user.emailVerified,
      balanceReal: Number(user.balanceReal),
      balanceVirtual: Number(user.balanceVirtual),
      balanceUSD: Number(user.balanceUSD),
      isAnonymousDisplay: user.isAnonymousDisplay,
      anonymousDisplayName: user.anonymousDisplayName,
    };

    return { user: authUser, tokens };
  } catch (error) {
    console.error('Registration error:', error);
    throw error;
  }
}

export async function refreshTokens(refreshToken: string): Promise<AuthTokens> {
  try {
    // Verify refresh token
    const payload = verifyRefreshToken(refreshToken);

    // Get user and session
    const [user, session] = await Promise.all([
      prisma.user.findUnique({
        where: { id: payload.sub },
      }),
      prisma.userSession.findFirst({
        where: {
          userId: payload.sub,
          token: refreshToken,
          expiresAt: { gt: new Date() },
        },
      }),
    ]);

    if (!user || !session) {
      throw new Error('INVALID_REFRESH_TOKEN');
    }

    if (!user.isActive) {
      throw new Error('ACCOUNT_SUSPENDED');
    }

    // Generate new tokens
    const newTokens = generateTokens(user, payload.tokenVersion);

    // Update session with new refresh token
    await prisma.userSession.update({
      where: { id: session.id },
      data: {
        token: newTokens.refreshToken,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        updatedAt: new Date(),
      },
    });

    return newTokens;
  } catch (error) {
    console.error('Token refresh error:', error);
    throw error;
  }
}

export async function getCurrentUser(accessToken: string): Promise<AuthUser | null> {
  try {
    const payload = verifyAccessToken(accessToken);
    
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      include: {
        agent: {
          select: {
            id: true,
            status: true,
            businessName: true,
            displayName: true,
          }
        }
      }
    });

    if (!user || !user.isActive) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      userType: user.userType,
      kycStatus: user.kycStatus,
      isActive: user.isActive,
      emailVerified: user.emailVerified,
      balanceReal: Number(user.balanceReal),
      balanceVirtual: Number(user.balanceVirtual),
      balanceUSD: Number(user.balanceUSD),
      isAnonymousDisplay: user.isAnonymousDisplay,
      anonymousDisplayName: user.anonymousDisplayName,
      agent: user.agent ? {
        id: user.agent.id,
        status: user.agent.status,
        businessName: user.agent.businessName,
        displayName: user.agent.displayName,
      } : undefined,
    };
  } catch (error) {
    return null;
  }
}

export async function logoutUser(refreshToken: string): Promise<void> {
  try {
    await prisma.userSession.deleteMany({
      where: { token: refreshToken },
    });
  } catch (error) {
    console.error('Logout error:', error);
  }
}

export async function logoutAllSessions(userId: string): Promise<void> {
  try {
    await prisma.userSession.deleteMany({
      where: { userId },
    });
  } catch (error) {
    console.error('Logout all sessions error:', error);
  }
}

// Session management
async function createUserSession(userId: string, refreshToken: string): Promise<void> {
  await prisma.userSession.create({
    data: {
      userId,
      token: refreshToken,
      ipAddress: '127.0.0.1', // TODO: Get actual IP
      userAgent: 'Unknown', // TODO: Get actual user agent
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    },
  });
}

// Utility functions
function generateAnonymousName(): string {
  const adjectives = [
    'Silent', 'Mystery', 'Hidden', 'Secret', 'Phantom', 'Shadow', 'Stealth',
    'Invisible', 'Private', 'Discrete', 'Anonymous', 'Unknown', 'Masked',
    'Veiled', 'Covert', 'Elusive', 'Enigmatic', 'Cryptic',
  ];

  const nouns = [
    'Collector', 'Bidder', 'Buyer', 'Hunter', 'Seeker', 'Trader', 'Dealer',
    'Enthusiast', 'Connoisseur', 'Expert', 'Specialist', 'Aficionado',
    'Patron', 'Curator', 'Investor', 'Acquirer', 'Pursuer',
  ];

  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const number = Math.floor(Math.random() * 999) + 1;

  return `${adjective} ${noun} ${number}`;
}

// Cleanup expired sessions
export async function cleanupExpiredSessions(): Promise<void> {
  try {
    const result = await prisma.userSession.deleteMany({
      where: {
        expiresAt: { lt: new Date() },
      },
    });
    console.log(`🧹 Cleaned up ${result.count} expired sessions`);
  } catch (error) {
    console.error('Session cleanup error:', error);
  }
}