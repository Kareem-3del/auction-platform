/**
 * Metrics API Endpoint
 * Exposes application metrics for Prometheus scraping
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { metrics } from '@/lib/metrics';

/**
 * GET /api/metrics
 * Returns metrics in Prometheus format or JSON
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const format = searchParams.get('format') || 'prometheus';

  try {
    if (format === 'json') {
      // Return JSON format for easy consumption
      return NextResponse.json(metrics.exportJSON());
    }

    // Return Prometheus format
    const prometheusMetrics = metrics.export();

    return new NextResponse(prometheusMetrics, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Failed to export metrics',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
