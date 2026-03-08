---
name: Testing Standards
description: >
  Unit testing, component testing, and Storybook standards for the frontend team.
  Covers Vitest configuration, React Testing Library patterns, AAA methodology,
  coverage targets, and test organization. Used by Tier 1 (Principal),
  Tier 1.5 (Staff Engineer), and Tier 2 (MidCoder) agents.
estimated-tokens: 5000
---

# Testing Standards Skill

## Scope

This skill defines testing standards for all code-producing agents.
Every new feature or component must include appropriate tests.

---

## Test Stack

| Tool                     | Purpose                  |
| ------------------------ | ------------------------ |
| **Vitest**               | Test runner (Jest-compatible API) |
| **React Testing Library**| Component testing        |
| **Vitest built-in**      | Assertions               |
| **Vitest vi**            | Mocking (Jest mock compatible) |
| **@vitest/coverage-v8**  | Coverage reporting       |
| **jsdom**                | DOM simulation           |

---

## Coverage Targets

| Scope               | Minimum Coverage |
| -------------------- | ---------------- |
| **Overall**          | 80%              |
| **Critical functions** | 90%            |
| **UI Components**    | 85%              |
| **Utilities**        | 95%              |

---

## AAA Pattern (Arrange-Act-Assert)

Every test must follow the AAA pattern:

```typescript
describe("ComponentName", () => {
  it("should do something when condition is met", () => {
    const mockProps = { title: "Test Title", type: "success" };
    const mockFunction = vi.fn();

    const { getByRole } = render(
      <Component {...mockProps} onClick={mockFunction} />
    );
    fireEvent.click(getByRole("button"));

    expect(mockFunction).toHaveBeenCalledWith(expectedValue);
    expect(getByRole("button")).toHaveAttribute("aria-pressed", "true");
  });
});
```

---

## Test Naming Convention

- Format: `should [expected behavior] when [condition]`
- Language: **English** only — no Turkish in test names.
- Be specific and descriptive.

```typescript
it("should display error message when email is invalid", () => {});
it("should call onSubmit when form is valid and button is clicked", () => {});
it("should render loading spinner when data is fetching", () => {});
```

---

## File Structure and Naming

```
component-name/
├── component-name.tsx
├── component-name.module.scss
├── component-name.spec.tsx
├── component-name.stories.tsx
├── types/
│   └── component-name-interface.ts
└── __tests__/
    ├── component-name.integration.spec.tsx
    └── component-name.e2e.spec.tsx
```

| File Type         | Naming Pattern                        |
| ----------------- | ------------------------------------- |
| Unit tests        | `component-name.spec.tsx`             |
| Integration tests | `component-name.integration.spec.tsx` |
| Utils tests       | `util-function.spec.ts`               |
| Hook tests        | `use-hook-name.spec.ts`               |

---

## Component Test Patterns

### Atom Component Test

```typescript
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { AtomButton } from "./atom-button";

describe("AtomButton", () => {
  const createProps = (overrides = {}) => ({
    children: "Click me",
    variant: "primary",
    size: "medium",
    disabled: false,
    ...overrides,
  });

  describe("Rendering", () => {
    it("should render button with correct text", () => {
      render(<AtomButton {...createProps()} />);
      expect(
        screen.getByRole("button", { name: "Click me" })
      ).toBeInTheDocument();
    });
  });

  describe("User Interactions", () => {
    it("should call onClick when clicked", () => {
      const mockOnClick = vi.fn();
      render(<AtomButton {...createProps({ onClick: mockOnClick })} />);
      fireEvent.click(screen.getByRole("button"));
      expect(mockOnClick).toHaveBeenCalledTimes(1);
    });

    it("should not call onClick when disabled", () => {
      const mockOnClick = vi.fn();
      render(
        <AtomButton {...createProps({ onClick: mockOnClick, disabled: true })} />
      );
      fireEvent.click(screen.getByRole("button"));
      expect(mockOnClick).not.toHaveBeenCalled();
    });
  });

  describe("Accessibility", () => {
    it("should have correct ARIA attributes", () => {
      render(<AtomButton {...createProps({ "aria-label": "Custom label" })} />);
      expect(screen.getByRole("button")).toHaveAttribute(
        "aria-label",
        "Custom label"
      );
    });
  });
});
```

### Molecule Component Test (with Providers)

```typescript
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

describe("MoleculeUserCard", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    vi.clearAllMocks();
  });

  const renderWithProviders = (component: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>
        {component}
      </QueryClientProvider>
    );
  };

  describe("Loading State", () => {
    it("should show loading spinner when data is loading", () => {
      renderWithProviders(<MoleculeUserCard userId="123" />);
      expect(screen.getByRole("status")).toBeInTheDocument();
    });
  });
});
```

---

## Hook Testing Pattern

```typescript
import { renderHook, waitFor } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { useFormValidation } from "./use-form-validation";

describe("useFormValidation", () => {
  it("should initialize with default values", () => {
    const { result } = renderHook(() => useFormValidation());
    expect(result.current.errors).toEqual({});
    expect(result.current.isValid).toBe(true);
  });
});
```

---

## Mocking Strategies

### API Service Mocking

```typescript
vi.mock("@services", () => ({
  userApi: {
    useQuery: vi.fn(),
  },
}));
```

### Router Mocking

```typescript
vi.mock("next/router", () => ({
  useRouter: () => ({
    push: vi.fn(),
    query: { slug: ["test-slug"] },
    pathname: "/test-path",
  }),
}));
```

### Store Mocking

```typescript
import { configureStore } from "@reduxjs/toolkit";

const createMockStore = (initialState = {}) => {
  return configureStore({
    reducer: { user: (state = initialState) => state },
  });
};
```

---

## Test Data Management

### Test Factories

```typescript
export const createMockUser = (overrides = {}): User => ({
  id: "123",
  name: "John Doe",
  email: "john@example.com",
  ...overrides,
});

export const createMockUsers = (count: number): User[] => {
  return Array.from({ length: count }, (_, index) =>
    createMockUser({ id: String(index + 1), name: `User ${index + 1}` }),
  );
};
```

---

## Test Organization

```typescript
describe("ComponentName", () => {
  describe("Rendering", () => {});
  describe("User Interactions", () => {});
  describe("Data Loading", () => {});
  describe("Error Handling", () => {});
  describe("Accessibility", () => {});
});
```

---

## Storybook Requirements

- Every UI component must have a Storybook story.
- Stories must cover:
  - Default state
  - All variants/sizes
  - Loading state
  - Error state
  - Empty state
  - Interactive states (hover, focus, disabled)
- Stories must be visually verified across different viewports.

---

## What to Test vs What NOT to Test

| Test              | Do NOT Test                       |
| ----------------- | --------------------------------- |
| Business logic    | Framework internals               |
| Edge cases        | Getter/setter methods             |
| Error paths       | Third-party library internals     |
| Public API        | Private methods (test indirectly) |
| User interactions | Implementation details            |
| Accessibility     | CSS styling details               |

---

## Test Checklist

### Component

- [ ] Rendering with default props
- [ ] Rendering with different prop combinations
- [ ] User interactions (clicks, input changes)
- [ ] Loading, error, and empty states
- [ ] Accessibility attributes
- [ ] Conditional rendering logic
- [ ] Event handler calls

### Hook

- [ ] Initial state
- [ ] State updates
- [ ] Side effects and cleanup
- [ ] Error handling

### Utility

- [ ] Happy path scenarios
- [ ] Edge cases and boundary values
- [ ] Error handling
- [ ] Input validation

---

## E2E Testing Standards

End-to-end tests validate complete user flows across the application.

### E2E File Naming

| File Type | Naming Pattern              |
| --------- | --------------------------- |
| E2E tests | `feature-name.e2e.spec.tsx` |
| E2E utils | `e2e-helpers.ts`            |

### E2E Test Principles

- Test critical user journeys (login, checkout, form submission).
- Use data-testid attributes for element selection — never rely on CSS classes.
- Each E2E test must be independent and idempotent.
- Clean up test data after each test run.
- E2E tests run in CI pipeline, not as part of unit test suite.

### E2E Coverage Targets

| Scope               | Minimum Coverage |
| ------------------- | ---------------- |
| Critical user flows | 100%             |
| Secondary flows     | 70%              |
| Edge case flows     | 50%              |

---

## Backend Testing Standards

Backend tests validate API endpoints, services, and data layer logic.

### Backend Test Stack

| Tool               | Purpose                    |
| ------------------ | -------------------------- |
| **Vitest**         | Test runner                |
| **Supertest**      | HTTP endpoint testing      |
| **Vitest vi**      | Mocking                    |
| **Testcontainers** | Database integration tests |

### Backend Test File Structure

```
service-name/
├── service-name.ts
├── service-name.spec.ts
├── service-name.controller.ts
├── service-name.controller.spec.ts
└── __tests__/
    └── service-name.integration.spec.ts
```

### Backend Test Patterns

#### Service Layer Test

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { UserService } from "./user-service";

describe("UserService", () => {
  let userService: UserService;
  let mockRepository: MockRepository;

  beforeEach(() => {
    mockRepository = createMockRepository();
    userService = new UserService(mockRepository);
  });

  describe("findById", () => {
    it("should return user when found", async () => {
      mockRepository.findOne.mockResolvedValue(createMockUser());

      const result = await userService.findById("123");

      expect(result).toEqual(createMockUser());
      expect(mockRepository.findOne).toHaveBeenCalledWith("123");
    });

    it("should throw NotFoundError when user does not exist", async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(userService.findById("999")).rejects.toThrow(NotFoundError);
    });
  });
});
```

#### Controller/Endpoint Test

```typescript
import { describe, it, expect } from "vitest";
import request from "supertest";
import { createApp } from "../app";

describe("GET /api/users/:id", () => {
  it("should return 200 with user data", async () => {
    const response = await request(createApp())
      .get("/api/users/123")
      .expect(200);

    expect(response.body).toHaveProperty("id", "123");
  });

  it("should return 404 when user not found", async () => {
    await request(createApp()).get("/api/users/nonexistent").expect(404);
  });
});
```

### Backend Test Checklist

- [ ] Service methods — happy path and error cases
- [ ] Controller endpoints — status codes and response shapes
- [ ] Input validation — reject malformed requests
- [ ] Authentication and authorization checks
- [ ] Database queries — correct data retrieval and mutation
- [ ] Error propagation — domain errors mapped to HTTP status codes
