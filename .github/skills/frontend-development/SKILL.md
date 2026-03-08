---
name: Frontend Development
description: >
  Principal-level frontend development skill covering JavaScript (ES2024+),
  React 18+, and Ant Design 5.x. This skill is MANDATORY for all frontend
  coding tasks. Covers component architecture, state management, hooks patterns,
  performance optimization, and Ant Design best practices.
estimated-tokens: 8000
---

# Frontend Development Skill

## Scope

This skill is **mandatory** for all frontend coding tasks. It covers:

- Modern JavaScript / TypeScript best practices
- React component architecture and patterns
- Ant Design component library usage
- Performance optimization
- Accessibility standards

---

## JavaScript / TypeScript Standards

### Modern Syntax (ES2024+)

```typescript
// ✅ Use optional chaining and nullish coalescing
const userName = user?.profile?.name ?? "Anonymous";

// ✅ Use structured clone for deep copy
const copy = structuredClone(originalObject);

// ✅ Use Array.at() for index access
const lastItem = items.at(-1);

// ✅ Use Object.groupBy for grouping
const grouped = Object.groupBy(users, (user) => user.role);

// ✅ Use Promise.withResolvers for deferred promises
const { promise, resolve, reject } = Promise.withResolvers<Data>();
```

### TypeScript Strict Rules

- `strict: true` always enabled in `tsconfig.json`.
- No `any` — use `unknown` and narrow with type guards.
- Prefer `interface` for object shapes, `type` for unions/intersections.
- Use `as const` for literal types and `satisfies` for type validation.
- Discriminated unions over optional properties for state modeling.

```typescript
// ✅ Discriminated union for state
type AsyncState<T> =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; data: T }
  | { status: "error"; error: Error };

// ❌ Optional properties
interface BadState<T> {
  isLoading?: boolean;
  data?: T;
  error?: Error;
}
```

### Immutability

- Prefer `const` over `let`. Never use `var`.
- Use spread operator or `structuredClone` for copies.
- No direct mutation of objects or arrays — always return new references.
- Use `readonly` modifier for properties that shouldn't change.

---

## React Architecture

### Component Design Principles

| Principle                        | Rule                                                          |
| -------------------------------- | ------------------------------------------------------------- |
| **Single Responsibility**        | One component = one UI concern                                |
| **Composition over Inheritance** | Build complex UI from small, composable pieces                |
| **Colocation**                   | Keep related files together (component + hook + types + test) |
| **Minimal Props**                | Maximum 5 props — use composition or context for more         |
| **Controlled by Default**        | Components are controlled unless explicitly uncontrolled      |

### Component Structure

```typescript
// ✅ Standard component file structure
import { useState, useCallback } from "react";
import { Button, Space } from "antd";

import type { UserFormProps } from "./types";
import { useUserValidation } from "./hooks/use-user-validation";
import { UserNameField } from "./components/user-name-field";

export function UserForm({ onSubmit, initialValues }: UserFormProps) {
  const [formData, setFormData] = useState(initialValues);
  const { validate, errors } = useUserValidation();

  const handleSubmit = useCallback(() => {
    const result = validate(formData);
    if (result.ok) onSubmit(result.value);
  }, [formData, validate, onSubmit]);

  return (
    <Space direction="vertical" size="middle">
      <UserNameField
        value={formData.name}
        error={errors.name}
        onChange={(name) => setFormData((prev) => ({ ...prev, name }))}
      />
      <Button type="primary" onClick={handleSubmit}>
        Submit
      </Button>
    </Space>
  );
}
```

### Hooks Best Practices

| Hook          | When to Use                                        | Rule                                        |
| ------------- | -------------------------------------------------- | ------------------------------------------- |
| `useState`    | Simple local state                                 | Keep state minimal — derive what you can    |
| `useReducer`  | Complex state logic (3+ related states)            | Use discriminated union for actions         |
| `useMemo`     | Expensive computation or referential stability     | Only when profiler confirms need            |
| `useCallback` | Stable callback refs (passed to memoized children) | Not needed for inline event handlers        |
| `useRef`      | DOM access or mutable value without re-render      | Never for state that affects render         |
| `useEffect`   | External system synchronization                    | Not for derived state or event-driven logic |

### Custom Hook Patterns

```typescript
// ✅ Custom hook with Result type
function useAsyncData<T>(fetcher: () => Promise<T>): AsyncState<T> {
  const [state, setState] = useState<AsyncState<T>>({ status: "idle" });

  useEffect(() => {
    const controller = new AbortController();
    setState({ status: "loading" });

    fetcher()
      .then((data) => {
        if (!controller.signal.aborted) {
          setState({ status: "success", data });
        }
      })
      .catch((error) => {
        if (!controller.signal.aborted) {
          setState({ status: "error", error });
        }
      });

    return () => controller.abort();
  }, [fetcher]);

  return state;
}
```

### State Management Rules

1. **Local state first** — `useState` / `useReducer` in the owning component.
2. **Lift state up** — only when siblings need the same state.
3. **Context** — for low-frequency global state (theme, auth, locale).
4. **External store** — for high-frequency shared state (Zustand, Jotai).
5. **Server state** — use TanStack Query / SWR for API data.
6. **Never duplicate** server state in client state.

### Performance Rules

- Use `React.memo()` only for components that re-render with same props.
- Use `React.lazy()` + `Suspense` for code splitting at route boundaries.
- Avoid inline object/array/function creation in JSX props.
- Never use index as `key` for dynamic lists.
- Virtualize lists with 50+ items (react-window, react-virtuoso).
- Image optimization: lazy loading, proper sizing, WebP format.

---

## Ant Design 5.x Patterns

### Component Usage Rules

| Category         | Components                         | Rules                                                      |
| ---------------- | ---------------------------------- | ---------------------------------------------------------- |
| **Layout**       | `Layout`, `Grid`, `Space`, `Flex`  | Use `Flex` for one-dimensional, `Grid` for two-dimensional |
| **Navigation**   | `Menu`, `Breadcrumb`, `Tabs`       | Use `items` prop (not JSX children)                        |
| **Data Entry**   | `Form`, `Input`, `Select`          | Always use `Form.useForm()` hook                           |
| **Data Display** | `Table`, `List`, `Card`            | Provide `rowKey` for Table, paginate 20+ items             |
| **Feedback**     | `message`, `notification`, `Modal` | Use static methods: `message.success()` not `<Message>`    |

### Form Patterns

```typescript
// ✅ Ant Design Form with proper typing
import { Form, Input, Button } from "antd";

interface LoginFormValues {
  email: string;
  password: string;
}

export function LoginForm({ onSubmit }: LoginFormProps) {
  const [form] = Form.useForm<LoginFormValues>();

  const handleFinish = (values: LoginFormValues) => {
    onSubmit(values);
  };

  return (
    <Form form={form} layout="vertical" onFinish={handleFinish}>
      <Form.Item
        name="email"
        rules={[
          { required: true, message: "Email is required" },
          { type: "email", message: "Invalid email format" },
        ]}
      >
        <Input placeholder="Email" />
      </Form.Item>
      <Form.Item
        name="password"
        rules={[{ required: true, message: "Password is required" }]}
      >
        <Input.Password placeholder="Password" />
      </Form.Item>
      <Form.Item>
        <Button type="primary" htmlType="submit" block>
          Sign In
        </Button>
      </Form.Item>
    </Form>
  );
}
```

### Table Patterns

```typescript
// ✅ Typed Table with proper column definitions
import { Table } from "antd";
import type { ColumnsType } from "antd/es/table";

const columns: ColumnsType<User> = [
  {
    title: "Name",
    dataIndex: "name",
    key: "name",
    sorter: (a, b) => a.name.localeCompare(b.name),
  },
  {
    title: "Email",
    dataIndex: "email",
    key: "email",
    ellipsis: true,
  },
  {
    title: "Actions",
    key: "actions",
    render: (_, record) => (
      <Space>
        <Button type="link" onClick={() => handleEdit(record.id)}>
          Edit
        </Button>
      </Space>
    ),
  },
];

<Table<User>
  columns={columns}
  dataSource={users}
  rowKey="id"
  pagination={{ pageSize: 20, showSizeChanger: true }}
/>
```

### Theme Customization

```typescript
// ✅ Use ConfigProvider for theming — never override CSS directly
import { ConfigProvider } from "antd";

<ConfigProvider
  theme={{
    token: {
      colorPrimary: "#1677ff",
      borderRadius: 6,
      fontFamily: "Inter, sans-serif",
    },
    components: {
      Button: {
        controlHeight: 40,
      },
    },
  }}
>
  <App />
</ConfigProvider>
```

### Ant Design Anti-Patterns

- ❌ Never use CSS `!important` to override Ant Design styles.
- ❌ Never import the entire library — always use named imports.
- ❌ Never use deprecated API patterns (JSX children for Menu, Table columns as JSX).
- ❌ Never mix Ant Design with another UI library (MUI, Chakra, etc.).
- ❌ Never hardcode colors — use design tokens via `theme.useToken()`.

---

## Project Structure (Feature-Based)

```
src/
├── app/                    # App shell, routing, providers
│   ├── routes.tsx
│   ├── providers.tsx
│   └── app.tsx
├── features/               # Feature modules
│   ├── auth/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── types.ts
│   │   └── index.ts
│   └── dashboard/
│       └── ...
├── shared/                 # Shared across features
│   ├── components/
│   ├── hooks/
│   ├── utils/
│   └── types/
├── services/               # API clients, external integrations
│   ├── api-client.ts
│   └── http.ts
└── config/                 # App configuration
    ├── constants.ts
    └── env.ts
```

---

## React Coding Rules

### Component Declaration

- Components must be declared using `function` keyword (not `const` arrow function).
- Component files use PascalCase naming. Non-component files use kebab-case.
- Maximum **250 lines** per component — split logic/styles when exceeded.
- Prefer `type` over `interface` for component props (avoids extends/declaration merging issues).

### Props and Event Handlers

- Props passed from parent to child: prefix with `handle` (e.g., `handleSubmit`).
- Internal event handlers within a component: prefix with `on` (e.g., `onButtonClick`).
- Props use `camelCase` naming — never `snake_case` or `PascalCase`.
- String props without expressions: omit curly braces.

```typescript
// ✅ Correct
<Paragraph variant="h5" heading="good" />

// ❌ Wrong
<Paragraph variant={"h5"} heading={"bad"} />
```

### JSX Best Practices

- Do NOT define functions inside render/return — keep logic outside JSX.
- Use `Fragment` (`<>...</>`) instead of `div` when no wrapper is needed.
- Avoid `React.useState`, `React.useEffect` — import hooks directly.
- When using conditional rendering without `else`, use `&&` operator.
- When nested ternaries are needed, extract into a function.
- Do NOT use index as `key` for dynamic lists.

```typescript
// ✅ Correct — logic outside render
const handleSubmitData = () => dispatch(ACTION_TO_SEND_DATA);
return <button onClick={handleSubmitData}>Submit</button>;

// ❌ Wrong — inline function in render
return <button onClick={() => dispatch(ACTION_TO_SEND_DATA)}>Submit</button>;
```

### Conditional Rendering

```typescript
// ✅ Use && when there is no else branch
{message && <p className={errorClasses}>{message}</p>}

// ❌ Do NOT use ternary with empty fragment
{message ? <p className={errorClasses}>{message}</p> : <></>}
```

### Multiple Conditions — Use Map Pattern

```typescript
// ✅ Correct — map pattern for many conditions
const periodMap: Record<string, [number, dayjs.ManipulateType]> = {
  "Last 1 Day": [1, "day"],
  "Last 1 Week": [6, "day"],
  "Last 1 Month": [1, "month"],
};

// ❌ Wrong — repeated if statements
if (period === "Last 1 Day") startDate = startDate.subtract(1, "day");
if (period === "Last 1 Week") startDate = startDate.subtract(6, "day");
```

### Optional Chaining Limit

- Maximum **3 levels** of optional chaining. Restructure if deeper.

```typescript
// ❌ Avoid
const value = object?.property1?.property2?.property3 || "default";
```

### Import Rules

- Import sorting: Framework → Third-party → Internal → Relative.
- Remove unused and duplicate imports immediately.
- Do NOT use `import * as` (wildcard imports).
- Use library-provided barrel exports (e.g., `import { Button } from '@crm-mfe-ui'`).

---

## Data Fetching and State Management

### TanStack Query (React Query)

- All data fetching must use TanStack Query (React Query v5).
- Use `isFetching` / `isLoading` from query hooks — do NOT create separate loading state.
- Data transformation must happen in `select` method, NOT in the component.

```typescript
// ✅ Correct — data transformation in select
const useCustomerData = (customerId: string) => {
  return useQuery({
    queryKey: ["customer", customerId],
    queryFn: () => fetchCustomerData(customerId),
    select: (data) => ({
      ...data,
      fullName: `${data.firstName} ${data.lastName}`,
      formattedDate: formatDate(data.createdAt),
    }),
  });
};

// ❌ Wrong — transformation in component
const { data } = useQuery(["addresses"], fetchAddresses);
const formattedAddresses = data?.map(/* ... */);
```

### Form Management

- All forms must use Ant Design `Form` with `Form.useForm()` hook and `rules`-based validation.
- Complex validation rules must be extracted into separate files per form.
- Do NOT use `react-hook-form` or `yup` — Ant Design Form is the sole form standard.

### Store Management (Zustand)

- Store names must include project prefix to avoid collisions: `{projectName}storeName`.
- Use Zustand's native `setState` — do NOT create individual setter methods unless business logic is involved.
- Filtering and sorting operations belong in the store, NOT in components.
- Always use immutable state updates (spread operator, never direct mutation).

```typescript
// ✅ Correct — native setState
campaignStore.setState({ wttxRadioType: "new-value" });

// ❌ Wrong — individual setter for each field
setWttxRadioType: (value) => set({ wttxRadioType: value });
```

### Error Handling in Services

```typescript
// ✅ Correct — meaningful catch block
try {
  const { data } = await service.post("/endpoint", body);
  return data;
} catch (error) {
  dispatch(setErrorMessage(error?.response?.data?.errorDetail));
  throw error;
}

// ❌ Wrong — catch with only rethrow (remove try-catch entirely)
try {
  const { data } = await service.post("/endpoint", body);
  return data;
} catch (error) {
  throw error;
}
```

---

## SCSS / Style Standards

### BEM Methodology

- All style naming must follow BEM (Block-Element-Modifier) convention.
- Use nested SCSS for related selectors.

```scss
.a-wrapperName {
  &__content {
  }
  &--variantName {
  }
}
```

### CSS Class Naming for Components

- Atom components: `a-trkclApp{ComponentName}`
- Molecule components: `m-trkclApp{ComponentName}`

### Units

- Use `rem` instead of `px` for responsive design.
- Use the project's `rem()` function for conversion.
- Do NOT use percentage-based margins (except for `position: absolute` cases).

### Color and Font Management

- Colors and fonts must come from shared style files — never hardcoded hex values.
- Use design token variables from `_color.scss` and `fonts.scss`.

### Style Anti-Patterns

- ❌ No `!important` — if unavoidable, document the reason.
- ❌ No inline styles — if unavoidable, document the reason.
- ❌ No empty SCSS classes.
- ❌ No `isMobile` boolean for responsive design — use CSS media queries.
- ❌ No unnecessary `classNames()` for single static classes.
- ❌ No hardcoded colors — use design tokens.

### Correct classNames Usage

```scss
// ✅ Use @extend for combining classes
&__description {
  color: $gray-900;
  @extend .subtitle-1-bold;
}

// ❌ Do NOT use classNames for static single classes
const descriptionClasses = classNames("subtitle-2-bold", styles["badge__description"]);
```

---

## Tab Navigation — Router Standard

- Multi-tab/multi-page modules must use React Router for navigation.
- Each tab/page must have its own unique URL (deep linking support).
- Ant Design Tabs can be combined with router-based navigation.

```typescript
// ✅ Router-based navigation
<Routes>
  <Route path="create" element={<CreateForm />} />
  <Route path="existing" element={<ExistingTable />} />
</Routes>

// Tab bar with router integration
<Tabs activeKey={currentRoute} onChange={(key) => navigate(`/module/${key}`)} />

// ❌ State-based tab switching (no URL change)
<Tabs defaultActiveKey="create" items={[...]} />
```

---

## Shared Components

- Shared components must be developed under the shared component library (`libs/crm-mfe-ui`).
- Components must be generalized for reuse across projects.
- Every shared component requires: unit test, Storybook story, documentation.
- Import via barrel export: `import { Component } from '@crm-mfe-ui'`.

---

## Accessibility (a11y)

- All interactive elements must be keyboard accessible.
- Use semantic HTML (`<button>`, `<nav>`, `<main>`, not `<div onClick>`).
- Images have `alt` text — decorative images use `alt=""`.
- Color contrast ratio ≥ 4.5:1 for normal text (WCAG compliance).
- Form fields have associated labels and proper `aria` attributes.
- Ant Design's built-in a11y props must be used when available.
- Focus states must be visible for all interactive elements.
- Screen reader compatibility must be verified.

---

## SEO Requirements

- Semantic HTML tags must be used correctly (heading hierarchy, proper elements).
- `aria-label` and `alt` text for accessibility and SEO.
- Lazy loading for images and links.
- Lighthouse audit must pass for both mobile and web.

---

## Performance Rules

- Code splitting with `React.lazy()` at route boundaries.
- Dynamic import for large modules.
- Image lazy loading with proper sizing and WebP format.
- `useMemo` for expensive computations, `useCallback` for stable refs — do not overuse.
- Minimize re-renders: proper key usage, minimal props changes.
- Third-party scripts loaded async/defer.
- Bundle size must be minimized — avoid importing entire libraries.
- Lists with 50+ items must be virtualized.

---

## Frontend Quality Checklist

Before submitting any frontend code, verify:

- [ ] TypeScript strict mode — no `any`, no `@ts-ignore`
- [ ] Components follow single responsibility
- [ ] Props interface is typed and minimal (≤ 5 props)
- [ ] Custom hooks extract reusable logic
- [ ] No inline objects/functions in JSX props (unless trivial)
- [ ] Ant Design components used with `items` API (not JSX children)
- [ ] Forms use Ant Design `Form` with `Form.useForm()` and `rules`-based validation
- [ ] Data fetching uses TanStack Query with `select` for transformation
- [ ] Tables have `rowKey` and pagination
- [ ] Theme tokens used — no hardcoded colors or CSS overrides
- [ ] BEM methodology applied for SCSS
- [ ] Code splitting at route boundaries
- [ ] Router-based navigation for multi-tab modules
- [ ] Lists with 50+ items are virtualized
- [ ] All images are lazy loaded with proper alt text
- [ ] Keyboard navigation works for all interactive elements
- [ ] Lighthouse scores acceptable (mobile + web)
- [ ] Unit tests and Storybook stories included
- [ ] Maximum 3 levels of optional chaining
- [ ] No individual setter methods in Zustand stores
