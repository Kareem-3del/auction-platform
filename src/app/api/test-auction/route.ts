import type { NextRequest } from 'next/server';
import { successResponse, validateMethod, validateContentType } from 'src/lib/api-response';

// Test endpoint without authentication
export async function POST(request: NextRequest) {
  try {
    validateMethod(request, ['POST']);
    validateContentType(request);

    const body = await request.json();
    console.log('🧪 TEST AUCTION - Received body:', body);

    return successResponse({
      message: 'Test auction endpoint working',
      receivedData: body,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('🧪 TEST AUCTION - Error:', error);
    return Response.json({
      success: false,
      error: {
        code: 'TEST_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      }
    }, { status: 500 });
  }
}