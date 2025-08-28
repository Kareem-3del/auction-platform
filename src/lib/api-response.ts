import { NextResponse } from 'next/server';

// Standard API response types
export interface SuccessResponse<T = any> {
  success: true;
  data: T;
  meta?: {
    pagination?: PaginationMeta;
    total?: number;
    filters?: any;
    [key: string]: any;
  };
}

export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
    timestamp: string;
  };
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

// Standard error codes
export const ErrorCodes = {
  // Authentication Errors (401)
  AUTH_TOKEN_EXPIRED: 'AUTH_TOKEN_EXPIRED',
  AUTH_TOKEN_INVALID: 'AUTH_TOKEN_INVALID',
  AUTH_CREDENTIALS_INVALID: 'AUTH_CREDENTIALS_INVALID',
  AUTH_ACCOUNT_SUSPENDED: 'AUTH_ACCOUNT_SUSPENDED',
  AUTH_ACCOUNT_LOCKED: 'AUTH_ACCOUNT_LOCKED',

  // Authorization Errors (403)
  AUTH_INSUFFICIENT_PERMISSIONS: 'AUTH_INSUFFICIENT_PERMISSIONS',
  AUTH_KYC_REQUIRED: 'AUTH_KYC_REQUIRED',
  AUTH_AGENT_APPROVAL_REQUIRED: 'AUTH_AGENT_APPROVAL_REQUIRED',
  AUTH_EMAIL_NOT_VERIFIED: 'AUTH_EMAIL_NOT_VERIFIED',

  // Validation Errors (422)
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  AUCTION_ENDED: 'AUCTION_ENDED',
  BID_TOO_LOW: 'BID_TOO_LOW',
  INSUFFICIENT_BALANCE: 'INSUFFICIENT_BALANCE',
  USER_ALREADY_EXISTS: 'USER_ALREADY_EXISTS',

  // Business Logic Errors (400)
  AUCTION_NOT_LIVE: 'AUCTION_NOT_LIVE',
  SELF_BID_NOT_ALLOWED: 'SELF_BID_NOT_ALLOWED',
  PAYMENT_FAILED: 'PAYMENT_FAILED',
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  INVALID_FILE_TYPE: 'INVALID_FILE_TYPE',

  // Not Found Errors (404)
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  AUCTION_NOT_FOUND: 'AUCTION_NOT_FOUND',
  PRODUCT_NOT_FOUND: 'PRODUCT_NOT_FOUND',
  TRANSACTION_NOT_FOUND: 'TRANSACTION_NOT_FOUND',

  // Rate Limiting (429)
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',

  // System Errors (500)
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
} as const;

export type ErrorCode = typeof ErrorCodes[keyof typeof ErrorCodes];

// Custom API Error class
export class APIError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly details?: any;

  constructor(
    code: ErrorCode,
    message: string,
    statusCode: number = 500,
    details?: any
  ) {
    super(message);
    this.name = 'APIError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

// Success response helpers
export function createSuccessResponse<T>(
  data: T,
  meta?: SuccessResponse<T>['meta']
): SuccessResponse<T> {
  return {
    success: true,
    data,
    ...(meta && { meta }),
  };
}

export function successResponse<T>(
  data: T,
  meta?: SuccessResponse<T>['meta']
): NextResponse<SuccessResponse<T>> {
  return NextResponse.json(createSuccessResponse(data, meta));
}

// Error response helpers
export function createErrorResponse(
  code: ErrorCode,
  message: string,
  details?: any
): ErrorResponse {
  return {
    success: false,
    error: {
      code,
      message,
      details,
      timestamp: new Date().toISOString(),
    },
  };
}

export function errorResponse(
  code: ErrorCode,
  message: string,
  statusCode: number = 500,
  details?: any
): NextResponse<ErrorResponse> {
  return NextResponse.json(
    createErrorResponse(code, message, details),
    { status: statusCode }
  );
}

// Specific error response helpers
export function validationErrorResponse(message: string, details?: any) {
  return errorResponse(ErrorCodes.VALIDATION_FAILED, message, 422, details);
}

export function unauthorizedResponse(message: string = 'Authentication required') {
  return errorResponse(ErrorCodes.AUTH_TOKEN_INVALID, message, 401);
}

export function forbiddenResponse(message: string = 'Insufficient permissions') {
  return errorResponse(ErrorCodes.AUTH_INSUFFICIENT_PERMISSIONS, message, 403);
}

export function notFoundResponse(message: string = 'Resource not found') {
  return errorResponse(ErrorCodes.USER_NOT_FOUND, message, 404);
}

export function rateLimitResponse(message: string = 'Too many requests') {
  return errorResponse(ErrorCodes.RATE_LIMIT_EXCEEDED, message, 429);
}

export function internalErrorResponse(message: string = 'Internal server error') {
  return errorResponse(ErrorCodes.INTERNAL_SERVER_ERROR, message, 500);
}

// Pagination helper
export function createPaginationMeta(
  page: number,
  limit: number,
  total: number
): PaginationMeta {
  const totalPages = Math.ceil(total / limit);
  
  return {
    page,
    limit,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  };
}

// Error handler for API routes
export function handleAPIError(error: unknown): NextResponse<ErrorResponse> {
  console.error('API Error:', error);

  if (error instanceof APIError) {
    return errorResponse(error.code, error.message, error.statusCode, error.details);
  }

  if (error instanceof Error) {
    // Handle specific known errors
    if (error.message === 'TOKEN_EXPIRED') {
      return errorResponse(ErrorCodes.AUTH_TOKEN_EXPIRED, 'Access token has expired', 401);
    }
    
    if (error.message === 'TOKEN_INVALID') {
      return errorResponse(ErrorCodes.AUTH_TOKEN_INVALID, 'Invalid access token', 401);
    }
    
    if (error.message === 'USER_ALREADY_EXISTS') {
      return errorResponse(ErrorCodes.USER_ALREADY_EXISTS, 'User already exists', 400);
    }

    if (error.message === 'ACCOUNT_SUSPENDED') {
      return errorResponse(ErrorCodes.AUTH_ACCOUNT_SUSPENDED, 'Account has been suspended', 403);
    }

    if (error.message === 'ACCOUNT_LOCKED') {
      return errorResponse(ErrorCodes.AUTH_ACCOUNT_LOCKED, 'Account is temporarily locked', 403);
    }

    // Database errors
    if (error.message.includes('Unique constraint') || error.message.includes('unique constraint')) {
      return errorResponse(ErrorCodes.VALIDATION_FAILED, 'A record with this data already exists', 400);
    }

    // Generic error
    return errorResponse(ErrorCodes.INTERNAL_SERVER_ERROR, error.message, 500);
  }

  // Unknown error
  return internalErrorResponse('An unexpected error occurred');
}

// Request validation helper
export function validateRequiredFields(
  data: Record<string, any>,
  requiredFields: string[]
): { isValid: boolean; missingFields: string[] } {
  const missingFields = requiredFields.filter(field => {
    const value = data[field];
    return value === undefined || value === null || value === '';
  });

  return {
    isValid: missingFields.length === 0,
    missingFields,
  };
}

// Query parameter parsing helpers
export function parseIntParam(param: string | null, defaultValue: number): number {
  if (!param) return defaultValue;
  const parsed = parseInt(param, 10);
  return isNaN(parsed) ? defaultValue : parsed;
}

export function parseBooleanParam(param: string | null, defaultValue: boolean): boolean {
  if (!param) return defaultValue;
  return param.toLowerCase() === 'true';
}

export function parseStringParam(param: string | null, defaultValue: string): string {
  return param || defaultValue;
}

// Pagination helpers for database queries
export function getPaginationParams(searchParams: URLSearchParams) {
  const page = Math.max(1, parseIntParam(searchParams.get('page'), 1));
  const limit = Math.min(100, Math.max(1, parseIntParam(searchParams.get('limit'), 20)));
  const skip = (page - 1) * limit;

  return { page, limit, skip };
}

// Safe async handler for API routes
export function withErrorHandling<T extends any[], R>(
  handler: (...args: T) => Promise<R>
) {
  return async (...args: T): Promise<NextResponse<SuccessResponse<R> | ErrorResponse>> => {
    try {
      const result = await handler(...args);
      if (result instanceof NextResponse) {
        return result;
      }
      return successResponse(result);
    } catch (error) {
      return handleAPIError(error);
    }
  };
}

// Method validation
export function validateMethod(request: Request, allowedMethods: string[]): void {
  if (!allowedMethods.includes(request.method)) {
    throw new APIError(
      ErrorCodes.VALIDATION_FAILED,
      `Method ${request.method} not allowed`,
      405
    );
  }
}

// Content-Type validation
export function validateContentType(request: Request, expectedType: string = 'application/json'): void {
  const contentType = request.headers.get('content-type');
  if (!contentType?.includes(expectedType)) {
    throw new APIError(
      ErrorCodes.VALIDATION_FAILED,
      `Content-Type must be ${expectedType}`,
      400
    );
  }
}