/**
 * Production-Ready Structured Logging System
 * Replaces console.log with proper logging levels and formatting
 */

export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug',
}

interface LogContext {
  requestId?: string;
  userId?: string;
  productId?: string;
  action?: string;
  duration?: number;
  [key: string]: any;
}

class Logger {
  private level: LogLevel;
  private isProduction: boolean;

  constructor() {
    this.isProduction = process.env.NODE_ENV === 'production';
    this.level = this.getLogLevel();
  }

  private getLogLevel(): LogLevel {
    const level = process.env.LOG_LEVEL?.toLowerCase();
    switch (level) {
      case 'error':
        return LogLevel.ERROR;
      case 'warn':
        return LogLevel.WARN;
      case 'debug':
        return LogLevel.DEBUG;
      default:
        return LogLevel.INFO;
    }
  }

  private shouldLog(level: LogLevel): boolean {
    const levels = [LogLevel.ERROR, LogLevel.WARN, LogLevel.INFO, LogLevel.DEBUG];
    return levels.indexOf(level) <= levels.indexOf(this.level);
  }

  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();

    if (this.isProduction) {
      // JSON format for production logging systems
      return JSON.stringify({
        timestamp,
        level,
        message,
        ...context,
      });
    }

    // Human-readable format for development
    const emoji = this.getEmoji(level);
    const contextStr = context ? ` ${JSON.stringify(context)}` : '';
    return `[${timestamp}] ${emoji} ${level.toUpperCase()}: ${message}${contextStr}`;
  }

  private getEmoji(level: LogLevel): string {
    switch (level) {
      case LogLevel.ERROR:
        return '❌';
      case LogLevel.WARN:
        return '⚠️';
      case LogLevel.INFO:
        return '✅';
      case LogLevel.DEBUG:
        return '🔍';
      default:
        return '📝';
    }
  }

  private log(level: LogLevel, message: string, context?: LogContext) {
    if (!this.shouldLog(level)) return;

    const formatted = this.formatMessage(level, message, context);

    // In production, don't expose stack traces to clients
    if (this.isProduction && level === LogLevel.ERROR) {
      // Log to stderr for error aggregation systems
      console.error(formatted);
    } else {
      console.log(formatted);
    }
  }

  error(message: string, error?: Error | unknown, context?: LogContext) {
    const errorContext: LogContext = {
      ...context,
      error: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: this.isProduction ? undefined : error.stack,
      } : error,
    };
    this.log(LogLevel.ERROR, message, errorContext);
  }

  warn(message: string, context?: LogContext) {
    this.log(LogLevel.WARN, message, context);
  }

  info(message: string, context?: LogContext) {
    this.log(LogLevel.INFO, message, context);
  }

  debug(message: string, context?: LogContext) {
    this.log(LogLevel.DEBUG, message, context);
  }

  // Specific method for HTTP requests
  http(method: string, url: string, status: number, duration: number, context?: LogContext) {
    this.info(`${method} ${url} ${status}`, {
      ...context,
      method,
      url,
      status,
      duration,
    });
  }

  // Specific method for database queries
  db(query: string, duration: number, context?: LogContext) {
    this.debug(`DB Query: ${query}`, {
      ...context,
      query,
      duration,
    });
  }

  // Specific method for bidding events
  bid(action: string, productId: string, context?: LogContext) {
    this.info(`Bid ${action}`, {
      ...context,
      action,
      productId,
      type: 'bidding',
    });
  }

  // Specific method for authentication events
  auth(action: string, userId?: string, context?: LogContext) {
    this.info(`Auth ${action}`, {
      ...context,
      action,
      userId,
      type: 'authentication',
    });
  }

  // Specific method for email events
  email(action: string, to: string, context?: LogContext) {
    this.info(`Email ${action}`, {
      ...context,
      action,
      to,
      type: 'email',
    });
  }

  // Specific method for WebSocket events
  ws(action: string, context?: LogContext) {
    this.debug(`WebSocket ${action}`, {
      ...context,
      action,
      type: 'websocket',
    });
  }
}

// Export singleton instance
export const logger = new Logger();

// Helper function to generate request IDs
export function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Helper to create child logger with persistent context
export function createContextLogger(baseContext: LogContext) {
  return {
    error: (message: string, error?: Error | unknown, context?: LogContext) =>
      logger.error(message, error, { ...baseContext, ...context }),
    warn: (message: string, context?: LogContext) =>
      logger.warn(message, { ...baseContext, ...context }),
    info: (message: string, context?: LogContext) =>
      logger.info(message, { ...baseContext, ...context }),
    debug: (message: string, context?: LogContext) =>
      logger.debug(message, { ...baseContext, ...context }),
  };
}
