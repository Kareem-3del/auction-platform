import type { NextRequest } from 'next/server';

import { checkDatabaseHealth } from '@/lib/prisma';
import { handleAPIError, successResponse } from '@/lib/api-response';

export async function GET(request: NextRequest) {
  try {
    const dbHealth = await checkDatabaseHealth();
    
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: dbHealth,
        server: {
          status: 'healthy',
          uptime: process.uptime(),
          memory: process.memoryUsage(),
        },
      },
      environment: process.env.NODE_ENV,
    };

    return successResponse(health);
  } catch (error) {
    return handleAPIError(error);
  }
}