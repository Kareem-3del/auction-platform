import type { NextRequest } from 'next/server';
import { withAuth } from 'src/lib/middleware/auth';
import { successResponse, validateMethod } from 'src/lib/api-response';

// Debug endpoint to test authentication
export const GET = withAuth(async (request) => {
  try {
    validateMethod(request, ['GET']);
    
    console.log('🔍 DEBUG AUTH - Headers:', {
      authorization: request.headers.get('authorization'),
      'user-agent': request.headers.get('user-agent'),
      'content-type': request.headers.get('content-type'),
    });

    console.log('🔍 DEBUG AUTH - User:', {
      id: request.user.id,
      email: request.user.email,
      userType: request.user.userType,
      isActive: request.user.isActive,
    });

    return successResponse({
      authenticated: true,
      user: {
        id: request.user.id,
        email: request.user.email,
        userType: request.user.userType,
        isActive: request.user.isActive,
      },
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('🔍 DEBUG AUTH - Error:', error);
    throw error;
  }
}, { required: true });

export const POST = withAuth(async (request) => {
  try {
    validateMethod(request, ['POST']);
    
    const body = await request.json();
    console.log('🔍 DEBUG AUTH POST - Body:', body);
    console.log('🔍 DEBUG AUTH POST - User:', request.user.email);

    return successResponse({
      authenticated: true,
      receivedData: body,
      user: request.user.email,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('🔍 DEBUG AUTH POST - Error:', error);
    throw error;
  }
}, { required: true });