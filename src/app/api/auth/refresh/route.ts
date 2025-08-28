import type { NextRequest } from 'next/server';

import { z } from 'zod';
import { refreshTokens } from '@/lib/auth';
import { 
  ErrorCodes, 
  errorResponse, 
  handleAPIError, 
  validateMethod,
  successResponse,
  validateContentType
} from '@/lib/api-response';

// Validation schema
const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export async function POST(request: NextRequest) {
  try {
    // Validate request method and content type
    validateMethod(request, ['POST']);
    validateContentType(request);

    // Try to get refresh token from body or cookie
    const body = await request.json();
    const cookieRefreshToken = request.cookies.get('refresh_token')?.value;
    
    const refreshToken = body.refreshToken || cookieRefreshToken;
    
    if (!refreshToken) {
      return errorResponse(
        ErrorCodes.AUTH_TOKEN_INVALID,
        'Refresh token is required',
        401
      );
    }

    // Validate with Zod schema
    const validatedData = refreshSchema.parse({ refreshToken });

    // Refresh tokens
    const newTokens = await refreshTokens(validatedData.refreshToken);

    console.log(`🔄 Token refreshed successfully`);

    const response = successResponse({
      tokens: newTokens,
      message: 'Tokens refreshed successfully',
    });

    // Update refresh token cookie if it was provided via cookie
    if (cookieRefreshToken) {
      response.cookies.set('refresh_token', newTokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 30 * 24 * 60 * 60, // 30 days
        path: '/',
      });
    }

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