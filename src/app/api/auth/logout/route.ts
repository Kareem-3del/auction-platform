import type { NextRequest } from 'next/server';

import { z } from 'zod';
import { logoutUser, logoutAllSessions } from '@/lib/auth';
import { 
  ErrorCodes, 
  errorResponse, 
  handleAPIError, 
  validateMethod,
  successResponse
} from '@/lib/api-response';

// Validation schema
const logoutSchema = z.object({
  refreshToken: z.string().optional(),
  logoutAll: z.boolean().optional().default(false),
});

export async function POST(request: NextRequest) {
  try {
    // Validate request method
    validateMethod(request, ['POST']);

    // Parse request body (if any)
    let body = {};
    try {
      const contentType = request.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        body = await request.json();
      }
    } catch (error) {
      // No JSON body or invalid JSON - that's okay for logout
      body = {};
    }
    
    // Try to get refresh token from body or cookie
    const cookieRefreshToken = request.cookies.get('refresh_token')?.value;
    const refreshToken = (body as any)?.refreshToken || cookieRefreshToken;
    
    if (!refreshToken) {
      return errorResponse(
        ErrorCodes.AUTH_TOKEN_INVALID,
        'Refresh token is required for logout',
        400
      );
    }

    // Validate with Zod schema
    const validatedData = logoutSchema.parse({
      refreshToken,
      logoutAll: (body as any)?.logoutAll,
    });

    if (validatedData.logoutAll) {
      // For logout all, we need to extract user ID from the refresh token
      // This is a simplified approach - in production, you might want to verify the token first
      try {
        const { verifyRefreshToken } = await import('@/lib/auth');
        const payload = verifyRefreshToken(validatedData.refreshToken!);
        await logoutAllSessions(payload.sub);
      } catch (error) {
        // Token might be invalid, but we'll still try to logout normally
        await logoutUser(validatedData.refreshToken!);
      }
    } else {
      // Logout current session only
      await logoutUser(validatedData.refreshToken!);
    }

    console.log(`👋 User logged out successfully`);

    const response = successResponse({
      message: validatedData.logoutAll ? 'Logged out from all devices' : 'Logged out successfully',
    });

    // Clear refresh token cookie
    response.cookies.set('refresh_token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0, // Expire immediately
      path: '/',
    });

    return response;

  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse(
        ErrorCodes.VALIDATION_FAILED,
        'Validation failed',
        422,
        error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
        }))
      );
    }

    return handleAPIError(error);
  }
}