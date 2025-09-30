/**
 * Prometheus Metrics Collection
 * Application-level metrics for monitoring
 */

import { logger } from './logger';

// Simple in-memory metrics store
// For production, use actual Prometheus client library
class Metrics {
  private counters: Map<string, number> = new Map();
  private gauges: Map<string, number> = new Map();
  private histograms: Map<string, number[]> = new Map();

  /**
   * Increment a counter metric
   */
  incrementCounter(name: string, value: number = 1, labels?: Record<string, string>) {
    const key = this.getMetricKey(name, labels);
    const current = this.counters.get(key) || 0;
    this.counters.set(key, current + value);
  }

  /**
   * Set a gauge metric
   */
  setGauge(name: string, value: number, labels?: Record<string, string>) {
    const key = this.getMetricKey(name, labels);
    this.gauges.set(key, value);
  }

  /**
   * Record a histogram value
   */
  recordHistogram(name: string, value: number, labels?: Record<string, string>) {
    const key = this.getMetricKey(name, labels);
    const values = this.histograms.get(key) || [];
    values.push(value);

    // Keep only last 1000 values to prevent memory issues
    if (values.length > 1000) {
      values.shift();
    }

    this.histograms.set(key, values);
  }

  /**
   * Get metric key with labels
   */
  private getMetricKey(name: string, labels?: Record<string, string>): string {
    if (!labels) return name;

    const labelStr = Object.entries(labels)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}="${v}"`)
      .join(',');

    return `${name}{${labelStr}}`;
  }

  /**
   * Export metrics in Prometheus format
   */
  export(): string {
    const lines: string[] = [];

    // Export counters
    for (const [key, value] of this.counters.entries()) {
      lines.push(`${key} ${value}`);
    }

    // Export gauges
    for (const [key, value] of this.gauges.entries()) {
      lines.push(`${key} ${value}`);
    }

    // Export histograms (simplified - just count, sum, and percentiles)
    for (const [key, values] of this.histograms.entries()) {
      const count = values.length;
      const sum = values.reduce((a, b) => a + b, 0);
      const sorted = [...values].sort((a, b) => a - b);

      const p50 = sorted[Math.floor(count * 0.5)] || 0;
      const p95 = sorted[Math.floor(count * 0.95)] || 0;
      const p99 = sorted[Math.floor(count * 0.99)] || 0;

      lines.push(`${key}_count ${count}`);
      lines.push(`${key}_sum ${sum}`);
      lines.push(`${key}_bucket{le="0.5"} ${p50}`);
      lines.push(`${key}_bucket{le="0.95"} ${p95}`);
      lines.push(`${key}_bucket{le="0.99"} ${p99}`);
    }

    return lines.join('\n');
  }

  /**
   * Get metrics as JSON
   */
  exportJSON(): Record<string, any> {
    return {
      counters: Object.fromEntries(this.counters),
      gauges: Object.fromEntries(this.gauges),
      histograms: Object.fromEntries(
        Array.from(this.histograms.entries()).map(([key, values]) => [
          key,
          {
            count: values.length,
            sum: values.reduce((a, b) => a + b, 0),
            avg: values.reduce((a, b) => a + b, 0) / values.length,
          },
        ])
      ),
    };
  }
}

// Singleton instance
export const metrics = new Metrics();

/**
 * Application-specific metric helpers
 */

// HTTP Request metrics
export function recordHTTPRequest(method: string, path: string, status: number, duration: number) {
  metrics.incrementCounter('http_requests_total', 1, { method, status: status.toString() });
  metrics.recordHistogram('http_request_duration_ms', duration, { method, path });
}

// Bid metrics
export function recordBidPlaced(productId: string, bidType: 'MANUAL' | 'AUTOMATIC') {
  metrics.incrementCounter('bids_placed_total', 1, { bidType });
  logger.info('Bid metric recorded', { productId, bidType });
}

export function recordBidFailed(productId: string, reason: string) {
  metrics.incrementCounter('bids_failed_total', 1, { reason });
}

// User metrics
export function recordUserRegistration(userType: string) {
  metrics.incrementCounter('users_registered_total', 1, { userType });
}

export function recordUserLogin(success: boolean) {
  metrics.incrementCounter('user_logins_total', 1, { success: success.toString() });
}

// Payment metrics (simulated)
export function recordPaymentAttempt(gateway: string, success: boolean) {
  metrics.incrementCounter('payment_attempts_total', 1, {
    gateway,
    success: success.toString(),
  });
}

// WebSocket metrics
export function recordWebSocketConnection(connected: boolean) {
  if (connected) {
    metrics.incrementCounter('websocket_connections_total', 1);
  } else {
    metrics.incrementCounter('websocket_disconnections_total', 1);
  }
}

export function setActiveWebSocketConnections(count: number) {
  metrics.setGauge('websocket_active_connections', count);
}

// Email metrics
export function recordEmailSent(success: boolean) {
  metrics.incrementCounter('emails_sent_total', 1, { success: success.toString() });
}

// Database metrics
export function recordDatabaseQuery(duration: number, operation: string) {
  metrics.recordHistogram('database_query_duration_ms', duration, { operation });
}

// Auction metrics
export function recordAuctionCreated() {
  metrics.incrementCounter('auctions_created_total', 1);
}

export function recordAuctionEnded(hasWinner: boolean) {
  metrics.incrementCounter('auctions_ended_total', 1, { hasWinner: hasWinner.toString() });
}

// Cache metrics
export function recordCacheHit(key: string) {
  metrics.incrementCounter('cache_hits_total', 1, { key });
}

export function recordCacheMiss(key: string) {
  metrics.incrementCounter('cache_misses_total', 1, { key });
}

// Rate limit metrics
export function recordRateLimitExceeded(endpoint: string) {
  metrics.incrementCounter('rate_limit_exceeded_total', 1, { endpoint });
}

// Error metrics
export function recordError(type: string, endpoint?: string) {
  metrics.incrementCounter('errors_total', 1, { type, endpoint: endpoint || 'unknown' });
}
