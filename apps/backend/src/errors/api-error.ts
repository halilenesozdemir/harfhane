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

/** @deferred Date-format validation moved to the `dailyWordQuerySchema` zod schema
 * (`parseTurkeyDate` boundary, Plan 010 U4); no service code throws this anymore. See
 * docs/backlog.md. */
export const INVALID_DATE = () =>
  new ApiError(400, 'INVALID_DATE', 'Invalid date format. Use YYYY-MM-DD');

/** @deferred Part of the error vocabulary; not yet thrown by any route. See docs/backlog.md. */
export const INTERNAL = () =>
  new ApiError(500, 'INTERNAL_ERROR', 'An unexpected error occurred');

/** @deferred adminAuth hand-rolls its own 401 instead of this helper. See docs/backlog.md. */
export const UNAUTHORIZED = () =>
  new ApiError(401, 'UNAUTHORIZED', 'Authentication required');

/** @deferred Part of the error vocabulary; not yet thrown by any route. See docs/backlog.md. */
export const FORBIDDEN = () =>
  new ApiError(403, 'FORBIDDEN', 'Access denied');

export const CONFLICT = (message: string) =>
  new ApiError(409, 'CONFLICT', message);
