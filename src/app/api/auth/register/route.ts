import type { NextRequest } from 'next/server';

import { z } from 'zod';
import { registerUser } from '@/lib/auth';
import { 
  handleAPIError, 
  validateMethod, 
  successResponse, 
  validateContentType,
  validateRequiredFields 
} from '@/lib/api-response';

// Validation schema
const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
           'Password must contain uppercase, lowercase, number and special character'),
  firstName: z.string()
    .min(1, 'First name is required')
    .max(50, 'First name must be less than 50 characters'),
  lastName: z.string()
    .min(1, 'Last name is required')
    .max(50, 'Last name must be less than 50 characters'),
  userType: z.enum(['BUYER', 'AGENT']).optional().default('BUYER'),
  phone: z.string().optional(),
  agreeToTerms: z.boolean().refine(val => val === true, 'You must agree to the terms'),
  marketingConsent: z.boolean().optional().default(false),
});

export async function POST(request: NextRequest) {
  try {
    // Validate request method and content type
    validateMethod(request, ['POST']);
    validateContentType(request);

    // Parse request body
    const body = await request.json();
    
    // Validate required fields
    const validation = validateRequiredFields(body, ['email', 'password', 'firstName', 'lastName']);
    if (!validation.isValid) {
      return handleAPIError({
        name: 'ValidationError',
        message: `Missing required fields: ${validation.missingFields.join(', ')}`,
      });
    }

    // Validate with Zod schema
    const validatedData = registerSchema.parse(body);

    // Register user
    const result = await registerUser({
      email: validatedData.email,
      password: validatedData.password,
      firstName: validatedData.firstName,
      lastName: validatedData.lastName,
      userType: validatedData.userType,
      phone: validatedData.phone,
    });

    // Return success response
    return successResponse({
      user: result.user,
      tokens: result.tokens,
      message: 'Registration successful',
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return handleAPIError({
        name: 'ValidationError',
        message: 'Validation failed',
        details: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
        })),
      });
    }

    return handleAPIError(error);
  }
}