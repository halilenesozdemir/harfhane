export class ApiError extends Error {
  readonly statusCode: number;
  readonly code: string;

  constructor(statusCode: number, code: string, message: string) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
  }
}

export const NOT_FOUND = (resource: string) =>
  new ApiError(404, 'NOT_FOUND', `${resource} not found`);

export const INVALID_DATE = () =>
  new ApiError(400, 'INVALID_DATE', 'Invalid date format. Use YYYY-MM-DD');

export const INTERNAL = () =>
  new ApiError(500, 'INTERNAL_ERROR', 'An unexpected error occurred');

export const UNAUTHORIZED = () =>
  new ApiError(401, 'UNAUTHORIZED', 'Authentication required');

export const FORBIDDEN = () =>
  new ApiError(403, 'FORBIDDEN', 'Access denied');

export const CONFLICT = (message: string) =>
  new ApiError(409, 'CONFLICT', message);
