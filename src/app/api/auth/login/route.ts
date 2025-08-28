import type { NextRequest } from 'next/server';

import { z } from 'zod';
import { authenticateUser } from '@/lib/auth';
import { 
  ErrorCodes, 
  errorResponse, 
  handleAPIError, 
  validateMethod,
  successResponse,
  validateContentType,
  validateRequiredFields
} from '@/lib/api-response';

// Validation schema
const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional().default(false),
});

export async function POST(request: NextRequest) {
  try {
    // Validate request method and content type
    validateMethod(request, ['POST']);
    validateContentType(request);

    // Parse request body
    const body = await request.json();
    
    // Validate required fields
    const validation = validateRequiredFields(body, ['email', 'password']);
    if (!validation.isValid) {
      return errorResponse(
        ErrorCodes.VALIDATION_FAILED,
        `Missing required fields: ${validation.missingFields.join(', ')}`,
        400
      );
    }

    // Validate with Zod schema
    const validatedData = loginSchema.parse(body);

    // Authenticate user
    const result = await authenticateUser(validatedData.email, validatedData.password);
    
    if (!result) {
      return errorResponse(
        ErrorCodes.AUTH_CREDENTIALS_INVALID,
        'Invalid email or password',
        401
      );
    }

    // Get client IP and User-Agent for logging
    const clientIP = request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Log successful login (you might want to store this in the database)
    console.log(`✅ Successful login: ${result.user.email} from ${clientIP}`);

    // Set cookies for refresh token if remember me is enabled
    const response = successResponse({
      user: result.user,
      tokens: result.tokens,
      message: 'Login successful',
    });

    if (validatedData.rememberMe) {
      // Set secure HTTP-only cookie for refresh token
      response.cookies.set('refresh_token', result.tokens.refreshToken, {
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