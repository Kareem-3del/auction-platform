import { NextRequest, NextResponse } from 'next/server';
import { OAuth2Client } from 'google-auth-library';
import { prisma } from 'src/lib/prisma';
import { generateTokens } from 'src/lib/auth';
import { successResponse, errorResponse, ErrorCodes } from 'src/lib/api-response';

const client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json();

    if (!token) {
      return errorResponse(ErrorCodes.VALIDATION_FAILED, 'Google token is required', 400);
    }

    // Verify the Google token
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      return errorResponse(ErrorCodes.VALIDATION_FAILED, 'Invalid Google token', 400);
    }

    const { email, given_name, family_name, picture } = payload;
    const googleId = payload.sub;

    // Check if user exists
    let user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      // Generate anonymous display name
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
      const anonymousDisplayName = `${adjective} ${noun} ${number}`;

      // Create new user
      user = await prisma.user.create({
        data: {
          email: email.toLowerCase(),
          firstName: given_name || 'Google',
          lastName: family_name || 'User',
          googleId,
          passwordHash: '', // No password for Google users
          emailVerified: true, // Google accounts are pre-verified
          avatarUrl: picture,
          anonymousDisplayName,
          anonymousAvatarUrl: '/avatars/default-anonymous.png',
          virtualMultiplier: 3.0,
        },
      });

      // Create audit log for registration
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          targetId: user.id,
          entityType: 'user',
          entityId: user.id,
          action: 'user_registered_google',
          newValues: {
            email: user.email,
            userType: user.userType,
            provider: 'google',
          },
          ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '127.0.0.1',
          userAgent: req.headers.get('user-agent') || 'Unknown',
        },
      });
    } else {
      // Update Google ID if not set
      if (!user.googleId) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { 
            googleId,
            avatarUrl: picture || user.avatarUrl,
            emailVerified: true,
          },
        });
      }

      // Update last login
      await prisma.user.update({
        where: { id: user.id },
        data: {
          lastLoginAt: new Date(),
          loginAttempts: 0,
          lockedUntil: null,
        },
      });
    }

    // Check if account is active
    if (!user.isActive) {
      return errorResponse(ErrorCodes.AUTH_ACCOUNT_SUSPENDED, 'Account is suspended', 403);
    }

    // Generate JWT tokens
    const tokens = generateTokens(user);

    // Create session
    await prisma.userSession.create({
      data: {
        userId: user.id,
        token: tokens.refreshToken,
        ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '127.0.0.1',
        userAgent: req.headers.get('user-agent') || 'Unknown',
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      },
    });

    // Return user data
    const authUser = {
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

    const responseData = {
      user: authUser,
      tokens: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      },
    };

    const response = successResponse(responseData, undefined);

    // Set refresh token as HTTP-only cookie
    response.cookies.set('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Google auth error:', error);
    return errorResponse(ErrorCodes.INTERNAL_SERVER_ERROR, 'Authentication failed', 500);
  }
}