import type { NextRequest } from 'next/server';

import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { sendVerificationEmail } from '@/lib/email';
import { 
  handleAPIError, 
  validateMethod, 
  successResponse, 
  validateContentType 
} from '@/lib/api-response';

import { generateRandomString } from 'src/lib/utils';

// Validation schema for sending verification email
const sendVerificationSchema = z.object({
  email: z.string().email('Invalid email address'),
});

// Validation schema for verifying email token
const verifyTokenSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  email: z.string().email('Invalid email address'),
});

// POST /api/auth/verify-email/send - Send verification email
export async function POST(request: NextRequest) {
  try {
    validateMethod(request, ['POST']);
    validateContentType(request);

    const body = await request.json();
    const { email } = sendVerificationSchema.parse(body);

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        emailVerified: true,
        firstName: true,
        lastName: true,
      },
    });

    if (!user) {
      return handleAPIError({
        name: 'UserNotFoundError',
        message: 'User not found',
      });
    }

    if (user.emailVerified) {
      return handleAPIError({
        name: 'EmailAlreadyVerifiedError',
        message: 'Email is already verified',
      });
    }

    // Generate verification token
    const token = generateRandomString(32);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Delete any existing verification records for this user
    await prisma.emailVerification.deleteMany({
      where: { userId: user.id },
    });

    // Create new email verification record
    await prisma.emailVerification.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
      },
    });

    // Send verification email
    try {
      await sendVerificationEmail({
        to: user.email,
        name: `${user.firstName} ${user.lastName}`,
        token,
      });
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
      // Continue execution - token is still created
    }

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        targetId: user.id,
        entityType: 'user',
        entityId: user.id,
        action: 'email_verification_sent',
        newValues: { email },
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      },
    });

    return successResponse({
      message: 'Verification email sent successfully',
      email: user.email,
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return handleAPIError({
        name: 'ValidationError',
        message: 'Invalid request data',
        details: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
        })),
      });
    }

    return handleAPIError(error);
  }
}

// PUT /api/auth/verify-email - Verify email with token
export async function PUT(request: NextRequest) {
  try {
    validateMethod(request, ['PUT']);
    validateContentType(request);

    const body = await request.json();
    const { token, email } = verifyTokenSchema.parse(body);

    // Find user and verification record
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        emailVerifications: {
          where: {
            token,
            expiresAt: {
              gte: new Date(),
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 1,
        },
      },
    });

    if (!user) {
      return handleAPIError({
        name: 'UserNotFoundError',
        message: 'User not found',
      });
    }

    if (user.emailVerified) {
      return handleAPIError({
        name: 'EmailAlreadyVerifiedError',
        message: 'Email is already verified',
      });
    }

    const verification = user.emailVerifications[0];
    if (!verification) {
      return handleAPIError({
        name: 'InvalidTokenError',
        message: 'Invalid or expired verification token',
      });
    }

    // Update user to mark email as verified
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        emailVerifiedAt: new Date(),
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        emailVerified: true,
        emailVerifiedAt: true,
      },
    });

    // Delete used verification token
    await prisma.emailVerification.delete({
      where: { id: verification.id },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        targetId: user.id,
        entityType: 'user',
        entityId: user.id,
        action: 'email_verified',
        newValues: { 
          emailVerified: true,
          emailVerifiedAt: updatedUser.emailVerifiedAt,
        },
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      },
    });

    return successResponse({
      user: updatedUser,
      message: 'Email verified successfully',
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return handleAPIError({
        name: 'ValidationError',
        message: 'Invalid request data',
        details: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
        })),
      });
    }

    return handleAPIError(error);
  }
}