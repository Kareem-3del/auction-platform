/**
 * Input Sanitization Middleware
 * Protects against XSS, SQL injection, and other attacks
 */

import type { NextRequest } from 'next/server';
import { logger } from '@/lib/logger';

/**
 * Sanitize string to prevent XSS attacks
 * Note: For rich text, use a proper HTML sanitizer like DOMPurify on the client
 */
export function sanitizeString(input: string): string {
  if (typeof input !== 'string') return input;

  return input
    // Remove null bytes
    .replace(/\0/g, '')
    // Remove control characters (except newlines and tabs)
    .replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '')
    // Trim whitespace
    .trim();
}

/**
 * Sanitize email address
 */
export function sanitizeEmail(email: string): string {
  if (typeof email !== 'string') return '';

  return email
    .toLowerCase()
    .trim()
    .replace(/[^\w\s@._+-]/gi, '');
}

/**
 * Sanitize phone number
 */
export function sanitizePhone(phone: string): string {
  if (typeof phone !== 'string') return '';

  return phone
    .trim()
    .replace(/[^\d+\-\s()]/g, '');
}

/**
 * Sanitize URL
 */
export function sanitizeUrl(url: string): string {
  if (typeof url !== 'string') return '';

  try {
    const parsed = new URL(url);

    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      logger.warn('Invalid URL protocol detected', { url, protocol: parsed.protocol });
      return '';
    }

    return parsed.toString();
  } catch {
    logger.warn('Invalid URL format', { url });
    return '';
  }
}

/**
 * Sanitize HTML to prevent XSS
 * Basic sanitization - for rich text, use DOMPurify on client
 */
export function sanitizeHtml(html: string): string {
  if (typeof html !== 'string') return '';

  return html
    // Remove script tags
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    // Remove event handlers
    .replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/\s*on\w+\s*=\s*[^\s>]*/gi, '')
    // Remove javascript: protocol
    .replace(/href\s*=\s*["']?\s*javascript:/gi, 'href="#"')
    // Remove data: protocol (can be used for XSS)
    .replace(/src\s*=\s*["']?\s*data:/gi, 'src="#"');
}

/**
 * Sanitize object recursively
 */
export function sanitizeObject<T extends Record<string, any>>(obj: T): T {
  if (!obj || typeof obj !== 'object') return obj;

  const sanitized = {} as T;

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key as keyof T] = sanitizeString(value) as any;
    } else if (Array.isArray(value)) {
      sanitized[key as keyof T] = value.map(item =>
        typeof item === 'string' ? sanitizeString(item) : sanitizeObject(item)
      ) as any;
    } else if (value && typeof value === 'object') {
      sanitized[key as keyof T] = sanitizeObject(value);
    } else {
      sanitized[key as keyof T] = value;
    }
  }

  return sanitized;
}

/**
 * Validate and sanitize file upload
 */
export interface FileValidationConfig {
  maxSize?: number;
  allowedTypes?: string[];
  allowedExtensions?: string[];
}

export function validateFile(
  file: File,
  config: FileValidationConfig = {}
): { valid: boolean; error?: string } {
  const {
    maxSize = parseInt(process.env.MAX_FILE_SIZE || '10485760'), // 10MB default
    allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif'],
  } = config;

  // Check file size
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File size exceeds maximum of ${(maxSize / 1024 / 1024).toFixed(2)}MB`,
    };
  }

  // Check file type
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `File type ${file.type} is not allowed. Allowed types: ${allowedTypes.join(', ')}`,
    };
  }

  // Check file extension
  const extension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
  if (!allowedExtensions.includes(extension)) {
    return {
      valid: false,
      error: `File extension ${extension} is not allowed. Allowed extensions: ${allowedExtensions.join(', ')}`,
    };
  }

  return { valid: true };
}

/**
 * Detect potential SQL injection patterns
 */
export function detectSqlInjection(input: string): boolean {
  if (typeof input !== 'string') return false;

  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b)/i,
    /(UNION.*SELECT)/i,
    /(;.*--)/,
    /('.*OR.*'.*=.*')/i,
    /(-{2}|\/\*|\*\/)/,
  ];

  return sqlPatterns.some(pattern => pattern.test(input));
}

/**
 * Detect potential XSS patterns
 */
export function detectXss(input: string): boolean {
  if (typeof input !== 'string') return false;

  const xssPatterns = [
    /<script[\s\S]*?>[\s\S]*?<\/script>/gi,
    /<iframe[\s\S]*?>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<embed[\s\S]*?>/gi,
    /<object[\s\S]*?>/gi,
  ];

  return xssPatterns.some(pattern => pattern.test(input));
}

/**
 * Middleware to sanitize request body
 */
export async function sanitizeRequestBody(request: NextRequest): Promise<any> {
  try {
    const contentType = request.headers.get('content-type');

    if (!contentType?.includes('application/json')) {
      return null;
    }

    const body = await request.json();
    const sanitized = sanitizeObject(body);

    // Check for potential attacks
    const bodyString = JSON.stringify(sanitized);
    if (detectSqlInjection(bodyString)) {
      logger.warn('Potential SQL injection detected in request', {
        url: request.url,
        method: request.method,
      });
    }

    if (detectXss(bodyString)) {
      logger.warn('Potential XSS attack detected in request', {
        url: request.url,
        method: request.method,
      });
    }

    return sanitized;
  } catch (error) {
    logger.error('Error sanitizing request body', error);
    return null;
  }
}
