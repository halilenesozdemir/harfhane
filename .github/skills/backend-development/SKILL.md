---
name: Backend Development
description: >
  Backend API design, database patterns, authentication, middleware,
  and server-side architecture standards for all backend coding tasks.
used-by:
  - Tier 1 (Principal)
  - Tier 1.5 (Staff Engineer)
  - Tier 2 (MidCoder)
estimated-tokens: 3000
---

# Backend Development Skill

## API Design Standards

### RESTful Conventions

- Resources are nouns in plural form: `/users`, `/orders`, `/products`.
- HTTP methods map to CRUD: GET (read), POST (create), PUT/PATCH (update), DELETE (remove).
- Nested resources express relationships: `/users/{id}/orders`.
- Query parameters for filtering, sorting, pagination: `?status=active&sort=createdAt&page=2&limit=20`.
- API versioning via URL prefix: `/api/v1/users`.

### Response Format

```typescript
interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: PaginationMeta;
}

interface ApiErrorResponse {
  success: boolean;
  error: {
    code: string;
    message: string;
    details?: unknown[];
  };
}

interface PaginationMeta {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
}
```

### HTTP Status Codes

| Code | Usage                             |
| ---- | --------------------------------- |
| 200  | Successful read or update         |
| 201  | Successful creation               |
| 204  | Successful deletion (no content)  |
| 400  | Validation error, malformed input |
| 401  | Unauthenticated                   |
| 403  | Unauthorized (insufficient perms) |
| 404  | Resource not found                |
| 409  | Conflict (duplicate, state issue) |
| 422  | Unprocessable entity              |
| 429  | Rate limited                      |
| 500  | Internal server error             |

---

## Authentication & Authorization

### JWT Pattern

- Access tokens: short-lived (15-30 minutes).
- Refresh tokens: long-lived (7-30 days), stored securely (httpOnly cookie).
- Token payload contains only essential claims: `sub`, `iat`, `exp`, `roles`.
- Never store sensitive data in JWT payload.

### Authorization Layers

1. **Authentication middleware**: Validates token, attaches user to request context.
2. **Role-based access control (RBAC)**: Guards routes by user role.
3. **Resource-level authorization**: Validates user owns or has access to the specific resource.

### Security Checklist

- Hash passwords with bcrypt (cost factor >= 12).
- Rate limit authentication endpoints.
- Implement CORS with explicit origin allowlist.
- Sanitize all input — never trust client data.
- Use parameterized queries — prevent SQL injection.
- Validate request body with schema validation (Zod, Joi, class-validator).
- Set security headers (Helmet.js or equivalent).

---

## Database Patterns

### Repository Pattern

Separate data access from business logic:

```
Controller → Service → Repository → Database
```

- **Controller**: HTTP layer — request parsing and response formatting.
- **Service**: Business logic — validation, orchestration, domain rules.
- **Repository**: Data access — queries, mutations, transaction management.

### Query Optimization

- Use indexes on frequently queried columns.
- Avoid N+1 queries — use eager loading or batch queries.
- Paginate all list endpoints — never return unbounded result sets.
- Use database transactions for multi-step mutations.
- Prefer soft deletes (`deletedAt` timestamp) over hard deletes.

### Migration Standards

- Every schema change requires a migration file.
- Migrations must be reversible (up/down).
- Never modify existing migrations — create new ones.
- Migration naming: `YYYYMMDDHHMMSS-descriptive-name`.
- Test migrations against production-like data volumes.

---

## Middleware Architecture

### Middleware Ordering

1. **Security**: CORS, Helmet, rate limiting.
2. **Parsing**: Body parser, cookie parser.
3. **Authentication**: Token validation, session management.
4. **Authorization**: Role/permission checks.
5. **Validation**: Request schema validation.
6. **Business logic**: Route handlers.
7. **Error handling**: Global error handler (always last).

### Error Handling Middleware

- Catch all unhandled errors at the global level.
- Map domain errors to appropriate HTTP status codes.
- Never expose internal error details to clients in production.
- Log full error details server-side with structured logging.

---

## Service Layer Standards

### Single Responsibility

- One service per domain concept: `UserService`, `OrderService`, `PaymentService`.
- Services never call each other's repositories directly — use service-to-service calls.
- Keep service methods focused: one business operation per method.

### Input Validation

- Validate all inputs at the service boundary.
- Use DTOs (Data Transfer Objects) for input/output typing.
- Separate creation DTOs from update DTOs.

### Transaction Management

- Wrap multi-step mutations in database transactions.
- Handle rollback on any failure within the transaction.
- Keep transactions as short as possible — do pre-validation outside.

---

## Structured Logging

- Use a logging library (Winston, Pino, or equivalent).
- Log levels: `error`, `warn`, `info`, `debug`.
- Include correlation IDs for request tracing.
- Log format: structured JSON for machine parsing.
- Never log sensitive data (passwords, tokens, PII).

---

## Testing Standards (Backend)

### Unit Tests

- Test service methods in isolation with mocked repositories.
- Test edge cases: empty inputs, boundary values, error paths.
- Minimum 80% coverage for services, 90% for critical business logic.

### Integration Tests

- Test API endpoints with actual HTTP requests.
- Use a test database (in-memory or containerized).
- Reset database state between tests.
- Test authentication and authorization flows.

### Test Naming

```
describe('UserService')
  it('should create user with valid input')
  it('should throw ValidationError when email is missing')
  it('should return paginated users with default limit')
```

---

## Checklist

Before submitting backend code, verify:

- [ ] All endpoints return consistent response format.
- [ ] Input validation exists on every mutation endpoint.
- [ ] Authentication and authorization are applied to protected routes.
- [ ] Error handling returns appropriate status codes.
- [ ] Database queries are optimized (no N+1, indexed).
- [ ] Structured logging is used instead of console statements.
- [ ] Unit tests cover service layer logic.
- [ ] Integration tests cover API endpoints.
- [ ] Migrations are reversible and tested.
- [ ] No hardcoded secrets or configuration values.
