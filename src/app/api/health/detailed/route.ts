/**
 * Detailed Health Check Endpoint
 * Provides comprehensive health information about all services
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { redis } from '@/lib/redis';

interface HealthCheck {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  services: {
    database: ServiceHealth;
    redis: ServiceHealth;
    email: ServiceHealth;
  };
  uptime: number;
  environment: string;
}

interface ServiceHealth {
  status: 'up' | 'down' | 'degraded';
  responseTime?: number;
  error?: string;
  details?: Record<string, any>;
}

/**
 * Check database health
 */
async function checkDatabase(): Promise<ServiceHealth> {
  const start = Date.now();

  try {
    // Simple query to check connection
    await prisma.$queryRaw`SELECT 1`;

    const responseTime = Date.now() - start;

    return {
      status: 'up',
      responseTime,
      details: {
        type: 'PostgreSQL',
      },
    };
  } catch (error) {
    return {
      status: 'down',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Check Redis health
 */
async function checkRedis(): Promise<ServiceHealth> {
  const start = Date.now();

  try {
    await redis.ping();

    const responseTime = Date.now() - start;

    return {
      status: 'up',
      responseTime,
      details: {
        type: 'Redis',
      },
    };
  } catch (error) {
    return {
      status: 'down',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Check email service health
 */
async function checkEmail(): Promise<ServiceHealth> {
  try {
    // Check if email configuration exists
    const hasSmtp = !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
    const hasSendGrid = !!process.env.SENDGRID_API_KEY;

    if (!hasSmtp && !hasSendGrid && process.env.NODE_ENV === 'production') {
      return {
        status: 'degraded',
        details: {
          warning: 'No production email service configured',
        },
      };
    }

    return {
      status: 'up',
      details: {
        configured: hasSmtp || hasSendGrid,
        provider: hasSmtp ? 'SMTP' : hasSendGrid ? 'SendGrid' : 'Development',
      },
    };
  } catch (error) {
    return {
      status: 'down',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * GET /api/health/detailed
 * Returns comprehensive health status
 */
export async function GET() {
  try {
    // Run all health checks in parallel
    const [database, redisHealth, email] = await Promise.all([
      checkDatabase(),
      checkRedis(),
      checkEmail(),
    ]);

    // Determine overall status
    const services = { database, redis: redisHealth, email };
    const statuses = Object.values(services).map((s) => s.status);

    let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';

    if (statuses.includes('down')) {
      overallStatus = 'unhealthy';
    } else if (statuses.includes('degraded')) {
      overallStatus = 'degraded';
    }

    const healthCheck: HealthCheck = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      services,
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'unknown',
    };

    // Return appropriate status code based on health
    const statusCode = overallStatus === 'healthy' ? 200 : overallStatus === 'degraded' ? 200 : 503;

    return NextResponse.json(healthCheck, {
      status: statusCode,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      {
        status: 503,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      }
    );
  }
}
