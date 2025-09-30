/**
 * Environment Variables Validation
 * Validates required environment variables on startup
 */

import { logger } from './logger';

interface EnvValidation {
  variable: string;
  required: boolean;
  description: string;
  validator?: (value: string) => boolean;
  defaultValue?: string;
}

const ENV_VALIDATIONS: EnvValidation[] = [
  // Database
  {
    variable: 'DATABASE_URL',
    required: true,
    description: 'PostgreSQL database connection string',
    validator: (value) => value.startsWith('postgresql://'),
  },
  {
    variable: 'REDIS_URL',
    required: true,
    description: 'Redis connection string',
    validator: (value) => value.startsWith('redis://'),
  },

  // JWT Secrets
  {
    variable: 'JWT_SECRET',
    required: true,
    description: 'JWT access token secret (minimum 64 characters)',
    validator: (value) => value.length >= 64,
  },
  {
    variable: 'JWT_REFRESH_SECRET',
    required: true,
    description: 'JWT refresh token secret (minimum 64 characters)',
    validator: (value) => value.length >= 64 && value !== process.env.JWT_SECRET,
  },

  // Application URLs
  {
    variable: 'NEXT_PUBLIC_APP_URL',
    required: true,
    description: 'Public application URL',
    validator: (value) => value.startsWith('http://') || value.startsWith('https://'),
  },
  {
    variable: 'NEXT_PUBLIC_WS_URL',
    required: true,
    description: 'WebSocket server URL',
    validator: (value) => value.startsWith('ws://') || value.startsWith('wss://'),
  },

  // WebSocket
  {
    variable: 'WS_PORT',
    required: false,
    description: 'WebSocket server port',
    defaultValue: '8081',
    validator: (value) => !isNaN(parseInt(value)) && parseInt(value) > 0,
  },

  // Email Configuration (optional but warned if missing in production)
  {
    variable: 'SMTP_HOST',
    required: false,
    description: 'SMTP server host for email sending',
  },
  {
    variable: 'SMTP_USER',
    required: false,
    description: 'SMTP username',
  },
  {
    variable: 'SMTP_PASS',
    required: false,
    description: 'SMTP password',
  },

  // Node Environment
  {
    variable: 'NODE_ENV',
    required: true,
    description: 'Node environment (development, production)',
    validator: (value) => ['development', 'production', 'test'].includes(value),
    defaultValue: 'development',
  },
];

/**
 * Validate all environment variables
 */
export function validateEnvironment(): { valid: boolean; errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  for (const validation of ENV_VALIDATIONS) {
    const value = process.env[validation.variable];

    // Check if required variable is missing
    if (validation.required && !value) {
      errors.push(
        `Missing required environment variable: ${validation.variable} - ${validation.description}`
      );
      continue;
    }

    // Use default value if not set
    if (!value && validation.defaultValue) {
      process.env[validation.variable] = validation.defaultValue;
      warnings.push(
        `Using default value for ${validation.variable}: ${validation.defaultValue}`
      );
      continue;
    }

    // Validate value if validator is provided
    if (value && validation.validator && !validation.validator(value)) {
      errors.push(
        `Invalid value for ${validation.variable}: ${validation.description}`
      );
    }
  }

  // Production-specific validations
  if (process.env.NODE_ENV === 'production') {
    // Warn if using default/weak JWT secrets
    if (
      process.env.JWT_SECRET &&
      process.env.JWT_SECRET.includes('your-super-secure')
    ) {
      errors.push(
        'CRITICAL: Using default JWT_SECRET in production! Generate a strong secret immediately!'
      );
    }

    if (
      process.env.JWT_REFRESH_SECRET &&
      process.env.JWT_REFRESH_SECRET.includes('your-super-secure')
    ) {
      errors.push(
        'CRITICAL: Using default JWT_REFRESH_SECRET in production! Generate a strong secret immediately!'
      );
    }

    // Warn if Google OAuth credentials look exposed
    if (
      process.env.GOOGLE_CLIENT_ID &&
      process.env.GOOGLE_CLIENT_ID.includes('apps.googleusercontent.com')
    ) {
      warnings.push(
        'WARNING: Google OAuth credentials should be regenerated if they were committed to git'
      );
    }

    // Warn if no email service configured
    if (!process.env.SMTP_HOST && !process.env.SENDGRID_API_KEY) {
      warnings.push(
        'WARNING: No email service configured (SMTP or SendGrid). Email functionality will not work in production.'
      );
    }

    // Warn about payment gateways in simulation mode
    if (
      process.env.BINANCE_PAY_API_KEY === 'SIMULATED_FOR_TESTING' ||
      process.env.WHISH_API_KEY === 'SIMULATED_FOR_TESTING'
    ) {
      warnings.push(
        'INFO: Payment gateways are running in SIMULATED mode (expected for testing stage)'
      );
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate environment and log results
 */
export function validateAndLogEnvironment(): void {
  logger.info('Validating environment variables...');

  const result = validateEnvironment();

  // Log errors
  if (result.errors.length > 0) {
    logger.error('Environment validation failed with errors:', {
      errors: result.errors,
    });

    result.errors.forEach((error) => {
      logger.error(error);
    });

    // Exit in production if validation fails
    if (process.env.NODE_ENV === 'production') {
      logger.error('FATAL: Environment validation failed in production. Exiting...');
      process.exit(1);
    }
  }

  // Log warnings
  if (result.warnings.length > 0) {
    result.warnings.forEach((warning) => {
      logger.warn(warning);
    });
  }

  if (result.valid) {
    logger.info('Environment validation passed successfully');
  }
}

/**
 * Mask sensitive environment variables for logging
 */
export function getMaskedEnvironment(): Record<string, string> {
  const sensitiveKeys = [
    'DATABASE_URL',
    'REDIS_URL',
    'JWT_SECRET',
    'JWT_REFRESH_SECRET',
    'GOOGLE_CLIENT_SECRET',
    'SMTP_PASS',
    'SENDGRID_API_KEY',
    'BINANCE_PAY_SECRET',
    'WHISH_SECRET',
  ];

  const masked: Record<string, string> = {};

  for (const [key, value] of Object.entries(process.env)) {
    if (value === undefined) continue;

    if (sensitiveKeys.some((sk) => key.includes(sk))) {
      masked[key] = '***MASKED***';
    } else {
      masked[key] = value;
    }
  }

  return masked;
}
