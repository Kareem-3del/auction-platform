/**
 * Centralized API Error Handler
 * Provides user-friendly error messages and handles common HTTP error codes
 */

export interface APIError {
  code: string;
  message: string;
  statusCode: number;
  details?: any;
}

export class APIErrorHandler {
  /**
   * Parse and format API error responses
   */
  static parseError(response: Response, data?: any): APIError {
    const statusCode = response.status;

    // Extract error message from response data
    const errorMessage = data?.error?.message || data?.message || 'An error occurred';
    const errorCode = data?.error?.code || this.getDefaultErrorCode(statusCode);

    return {
      code: errorCode,
      message: this.getUserFriendlyMessage(statusCode, errorMessage, data),
      statusCode,
      details: data?.error?.details || data?.details,
    };
  }

  /**
   * Get default error code based on HTTP status
   */
  private static getDefaultErrorCode(statusCode: number): string {
    const codes: Record<number, string> = {
      400: 'BAD_REQUEST',
      401: 'UNAUTHORIZED',
      403: 'FORBIDDEN',
      404: 'NOT_FOUND',
      409: 'CONFLICT',
      422: 'VALIDATION_ERROR',
      429: 'RATE_LIMIT_EXCEEDED',
      500: 'INTERNAL_ERROR',
      502: 'BAD_GATEWAY',
      503: 'SERVICE_UNAVAILABLE',
      504: 'GATEWAY_TIMEOUT',
    };

    return codes[statusCode] || 'UNKNOWN_ERROR';
  }

  /**
   * Get user-friendly error message
   */
  private static getUserFriendlyMessage(
    statusCode: number,
    originalMessage: string,
    data?: any
  ): string {
    // Rate limiting - special handling
    if (statusCode === 429) {
      const retryAfter = data?.retryAfter || 60;
      return `You're making too many requests. Please wait ${retryAfter} seconds before trying again.`;
    }

    // Authentication errors
    if (statusCode === 401) {
      if (originalMessage.toLowerCase().includes('token')) {
        return 'Your session has expired. Please log in again.';
      }
      return 'Authentication required. Please log in to continue.';
    }

    // Permission errors
    if (statusCode === 403) {
      return 'You do not have permission to perform this action.';
    }

    // Not found errors
    if (statusCode === 404) {
      return 'The requested resource was not found.';
    }

    // Validation errors
    if (statusCode === 422 || statusCode === 400) {
      if (data?.error?.details && Array.isArray(data.error.details)) {
        const fieldErrors = data.error.details
          .map((detail: any) => `${detail.field}: ${detail.message}`)
          .join(', ');
        return `Validation error: ${fieldErrors}`;
      }
      return originalMessage || 'Invalid request data. Please check your input.';
    }

    // Conflict errors
    if (statusCode === 409) {
      return originalMessage || 'This resource already exists or conflicts with existing data.';
    }

    // Server errors
    if (statusCode >= 500) {
      return 'Server error occurred. Our team has been notified. Please try again later.';
    }

    // Default to original message
    return originalMessage;
  }

  /**
   * Handle fetch response and throw formatted error if not ok
   */
  static async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch {
        // If response is not JSON, create error with status text
        errorData = { message: response.statusText };
      }

      const apiError = this.parseError(response, errorData);
      throw apiError;
    }

    try {
      const data = await response.json();
      return data;
    } catch {
      // If response has no body, return empty object
      return {} as T;
    }
  }

  /**
   * Get retry-after duration for rate limited requests
   */
  static getRetryAfter(response: Response): number {
    const retryAfter = response.headers.get('Retry-After');
    if (retryAfter) {
      return parseInt(retryAfter, 10);
    }
    return 60; // Default to 60 seconds
  }

  /**
   * Format error for display in UI
   */
  static formatForDisplay(error: APIError | Error | unknown): string {
    if (error instanceof Error) {
      return error.message;
    }

    if (typeof error === 'object' && error !== null) {
      const apiError = error as APIError;
      if (apiError.message) {
        return apiError.message;
      }
    }

    return 'An unexpected error occurred. Please try again.';
  }

  /**
   * Check if error is a specific type
   */
  static isErrorType(error: unknown, code: string): boolean {
    return (error as APIError)?.code === code;
  }

  /**
   * Check if error is rate limit error
   */
  static isRateLimitError(error: unknown): boolean {
    return (
      this.isErrorType(error, 'RATE_LIMIT_EXCEEDED') ||
      (error as APIError)?.statusCode === 429
    );
  }

  /**
   * Check if error is authentication error
   */
  static isAuthError(error: unknown): boolean {
    return (
      this.isErrorType(error, 'UNAUTHORIZED') ||
      this.isErrorType(error, 'AUTH_TOKEN_INVALID') ||
      (error as APIError)?.statusCode === 401
    );
  }

  /**
   * Check if error is permission error
   */
  static isPermissionError(error: unknown): boolean {
    return this.isErrorType(error, 'FORBIDDEN') || (error as APIError)?.statusCode === 403;
  }

  /**
   * Check if error is validation error
   */
  static isValidationError(error: unknown): boolean {
    return (
      this.isErrorType(error, 'VALIDATION_ERROR') ||
      (error as APIError)?.statusCode === 422 ||
      (error as APIError)?.statusCode === 400
    );
  }

  /**
   * Get validation error details
   */
  static getValidationErrors(error: unknown): Array<{ field: string; message: string }> {
    const apiError = error as APIError;
    if (this.isValidationError(error) && apiError.details) {
      return Array.isArray(apiError.details) ? apiError.details : [];
    }
    return [];
  }
}

/**
 * Enhanced fetch wrapper with automatic error handling
 */
export async function fetchWithErrorHandling<T>(
  url: string,
  options?: RequestInit
): Promise<T> {
  try {
    const response = await fetch(url, options);
    return await APIErrorHandler.handleResponse<T>(response);
  } catch (error) {
    // Re-throw APIError as-is
    if ((error as APIError).statusCode) {
      throw error;
    }

    // Wrap network errors
    throw {
      code: 'NETWORK_ERROR',
      message: 'Network error occurred. Please check your connection and try again.',
      statusCode: 0,
    } as APIError;
  }
}

/**
 * React hook for handling API errors in components
 */
export function useAPIErrorHandler() {
  const handleError = (error: unknown): string => {
    console.error('API Error:', error);

    // Handle rate limiting with user guidance
    if (APIErrorHandler.isRateLimitError(error)) {
      const apiError = error as APIError;
      return apiError.message;
    }

    // Handle auth errors - could trigger logout
    if (APIErrorHandler.isAuthError(error)) {
      // You might want to trigger a logout or redirect here
      return 'Session expired. Please log in again.';
    }

    // Handle permission errors
    if (APIErrorHandler.isPermissionError(error)) {
      return 'You do not have permission to perform this action.';
    }

    // Handle validation errors
    if (APIErrorHandler.isValidationError(error)) {
      const validationErrors = APIErrorHandler.getValidationErrors(error);
      if (validationErrors.length > 0) {
        return validationErrors.map((e) => e.message).join(', ');
      }
    }

    return APIErrorHandler.formatForDisplay(error);
  };

  return { handleError };
}

export default APIErrorHandler;
