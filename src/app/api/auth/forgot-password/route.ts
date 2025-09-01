import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import { isValidEmail } from 'src/lib/utils';
import { errorResponse, successResponse, ErrorCodes } from 'src/lib/api-response';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    // Validate input
    if (!email) {
      return errorResponse(ErrorCodes.VALIDATION_FAILED, 'Email is required', 400);
    }

    if (!isValidEmail(email)) {
      return errorResponse(ErrorCodes.VALIDATION_FAILED, 'Invalid email format', 400);
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    // Always return success to prevent email enumeration attacks
    if (!user) {
      return successResponse({
        message: 'If an account with that email exists, we have sent a password reset link to it.'
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now

    // Save reset token to database
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetTokenExpiry,
      },
    });

    // TODO: In a real application, you would send an email here
    // For now, we'll log the reset token (remove this in production)
    console.log(`Password reset token for ${email}: ${resetToken}`);
    console.log(`Reset link: ${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password?token=${resetToken}`);

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: 'PASSWORD_RESET_REQUESTED',
        entityType: 'USER',
        entityId: user.id,
        details: {
          email: user.email,
          timestamp: new Date(),
        },
      },
    });

    return successResponse({
      message: 'If an account with that email exists, we have sent a password reset link to it.'
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    
    return errorResponse(
      ErrorCodes.INTERNAL_SERVER_ERROR,
      'An unexpected error occurred. Please try again later.',
      500
    );
  } finally {
    await prisma.$disconnect();
  }
}