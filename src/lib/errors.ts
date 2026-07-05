/**
 * Custom application error classes.
 * All errors extend AppError for consistent error handling.
 */

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message = "Validation failed") {
    super(message, 400);
  }
}

export class AuthenticationError extends AppError {
  constructor(message = "Authentication required") {
    super(message, 401);
  }
}

export class AuthorizationError extends AppError {
  constructor(message = "Insufficient permissions") {
    super(message, 403);
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Resource not found") {
    super(message, 404);
  }
}

export class ConflictError extends AppError {
  constructor(message = "Resource already exists") {
    super(message, 409);
  }
}

/**
 * Formats an AppError into a client-safe JSON response shape.
 * Never exposes raw error internals.
 */
export function formatErrorResponse(error: AppError): {
  error: { message: string; statusCode: number };
} {
  return {
    error: {
      message: error.isOperational
        ? error.message
        : "An unexpected error occurred",
      statusCode: error.statusCode,
    },
  };
}
