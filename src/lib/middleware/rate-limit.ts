/**
 * Production-Ready Rate Limiting Middleware
 * Protects API routes from abuse and DDoS attacks
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { redis } from '@/lib/redis';
import { logger } from '@/lib/logger';

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  keyPrefix?: string; // Redis key prefix
  skipSuccessfulRequests?: boolean; // Only count failed requests
  skipFailedRequests?: boolean; // Only count successful requests
}

interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: number;
}

/**
 * Get client identifier from request
 */
function getClientIdentifier(request: NextRequest): string {
  // Try to get user ID from request if authenticated
  const userId = (request as any).user?.id;
  if (userId) {
    return `user:${userId}`;
  }

  // Fallback to IP address
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0].trim() :
             request.headers.get('x-real-ip') ||
             'unknown';

  return `ip:${ip}`;
}

/**
 * Check rate limit for a given key
 */
async function checkRateLimit(
  key: string,
  config: RateLimitConfig
): Promise<RateLimitInfo> {
  const now = Date.now();
  const windowStart = now - config.windowMs;

  try {
    // Use Redis sorted set to track requests with timestamps
    const multi = redis.multi();

    // Remove old entries outside the window
    multi.zremrangebyscore(key, '-inf', windowStart);

    // Count remaining entries in window
    multi.zcard(key);

    // Add current request
    multi.zadd(key, now, `${now}-${Math.random()}`);

    // Set expiry on the key
    multi.expire(key, Math.ceil(config.windowMs / 1000));

    const results = await multi.exec();
    const count = (results?.[1]?.[1] as number) || 0;

    const remaining = Math.max(0, config.maxRequests - count - 1);
    const reset = now + config.windowMs;

    return {
      limit: config.maxRequests,
      remaining,
      reset,
    };
  } catch (error) {
    logger.error('Rate limit check failed', error, { key });

    // Fail open - allow request if Redis is down
    return {
      limit: config.maxRequests,
      remaining: config.maxRequests,
      reset: now + config.windowMs,
    };
  }
}

/**
 * Create rate limiter middleware
 */
export function createRateLimiter(config: RateLimitConfig) {
  const defaultConfig: RateLimitConfig = {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
    keyPrefix: 'ratelimit',
    ...config,
  };

  return async function rateLimitMiddleware(
    request: NextRequest,
    handler: (request: NextRequest) => Promise<NextResponse>
  ): Promise<NextResponse> {
    const clientId = getClientIdentifier(request);
    const key = `${defaultConfig.keyPrefix}:${clientId}`;

    const rateLimit = await checkRateLimit(key, defaultConfig);

    // Check if limit exceeded
    if (rateLimit.remaining < 0) {
      logger.warn('Rate limit exceeded', {
        clientId,
        limit: rateLimit.limit,
        reset: new Date(rateLimit.reset).toISOString(),
      });

      return NextResponse.json(
        {
          error: 'Too Many Requests',
          message: 'You have exceeded the rate limit. Please try again later.',
          retryAfter: Math.ceil((rateLimit.reset - Date.now()) / 1000),
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': rateLimit.limit.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': rateLimit.reset.toString(),
            'Retry-After': Math.ceil((rateLimit.reset - Date.now()) / 1000).toString(),
          },
        }
      );
    }

    // Execute the handler
    const response = await handler(request);

    // Add rate limit headers to response
    response.headers.set('X-RateLimit-Limit', rateLimit.limit.toString());
    response.headers.set('X-RateLimit-Remaining', rateLimit.remaining.toString());
    response.headers.set('X-RateLimit-Reset', rateLimit.reset.toString());

    return response;
  };
}

/**
 * Predefined rate limiters for different endpoints
 */

// General API rate limiter
export const apiRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100,
  keyPrefix: 'ratelimit:api',
});

// Strict rate limiter for authentication endpoints
export const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: parseInt(process.env.RATE_LIMIT_AUTH_MAX || '5'),
  keyPrefix: 'ratelimit:auth',
});

// Rate limiter for bidding endpoints
export const bidRateLimiter = createRateLimiter({
  windowMs: 1 * 60 * 1000, // 1 minute
  maxRequests: parseInt(process.env.RATE_LIMIT_BID_MAX || '30'),
  keyPrefix: 'ratelimit:bid',
});

// Rate limiter for file uploads
export const uploadRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 10,
  keyPrefix: 'ratelimit:upload',
});

// Rate limiter for search endpoints
export const searchRateLimiter = createRateLimiter({
  windowMs: 1 * 60 * 1000, // 1 minute
  maxRequests: 30,
  keyPrefix: 'ratelimit:search',
});

/**
 * Helper to apply rate limiter to route handler
 */
export function withRateLimit(
  handler: (request: NextRequest, context?: any) => Promise<NextResponse>,
  limiter: typeof apiRateLimiter = apiRateLimiter
) {
  return async (request: NextRequest, context?: any): Promise<NextResponse> => {
    return limiter(request, () => handler(request, context));
  };
}
