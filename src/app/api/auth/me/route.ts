import type { NextRequest } from 'next/server';

import { getCurrentUser } from '@/lib/auth';
import { 
  ErrorCodes, 
  errorResponse, 
  handleAPIError,
  validateMethod,
  successResponse
} from '@/lib/api-response';

export async function GET(request: NextRequest) {
  try {
    // Validate request method
    validateMethod(request, ['GET']);

    // Get authorization header
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return errorResponse(
        ErrorCodes.AUTH_TOKEN_INVALID,
        'Authorization header missing or invalid',
        401
      );
    }

    const accessToken = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Get current user
    const user = await getCurrentUser(accessToken);
    
    if (!user) {
      return errorResponse(
        ErrorCodes.AUTH_TOKEN_INVALID,
        'Invalid or expired access token',
        401
      );
    }

    console.log(`👤 Current user retrieved: ${user.email}`);

    return successResponse({
      user,
      message: 'User data retrieved successfully',
    });

  } catch (error) {
    return handleAPIError(error);
  }
}