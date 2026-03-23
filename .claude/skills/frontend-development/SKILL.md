---
name: Frontend Development
description: Activated for React, TypeScript, Vite, Tailwind CSS, and TanStack Query tasks in apps/frontend/. Covers component patterns, hooks, state management, JSX rules, accessibility, and Tailwind conventions. Mandatory for all frontend coding.
allowed-tools: Read, Grep, Glob, Edit, Write, Bash
---

# Frontend Development Skill

## Stack

- React 19 + Vite 7 + TypeScript 5 (strict mode)
- Tailwind CSS 3.x — utility-first, no CSS-in-JS
- TanStack Query v5 — server state
- Lucide React — icons only, no emojis in UI

---

## TypeScript Standards

```typescript
// ✅ Discriminated union for state
type AsyncState<T> =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; data: T }
  | { status: "error"; error: Error };

// ❌ Optional properties — forbidden
interface BadState<T> {
  isLoading?: boolean;
  data?: T;
  error?: Error;
}
```

- `strict: true` always on.
- No `any` — use `unknown` and narrow with type guards.
- `interface` for object shapes, `type` for unions/intersections.
- `as const` for literal types, `satisfies` for type validation.
- `const` preferred, `let` only when needed, `var` forbidden.
- Optional chaining max **3 levels** — restructure if deeper.
- `readonly` for properties that shouldn't change.

---

## React Architecture

### Component Rules

- Declare with `function` keyword, not `const` arrow function.
- Component files PascalCase, others kebab-case.
- Props interface: `ComponentNameProps`.
- Max **5 props** — use composition or context for more.
- Max **250 lines** per component file.

### Component Structure

```typescript
import { useState, useCallback } from "react";
import { Globe } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import { listWords } from "../../lib/api";
import type { WordCardProps } from "../../types";

export function WordCard({ wordId, onSelect }: WordCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleToggle = useCallback(() => {
    setIsExpanded((prev) => !prev);
  }, []);

  return (
    <button className="cursor-pointer" onClick={handleToggle}>
      <Globe size={16} />
    </button>
  );
}
```

### Import Order

```typescript
// 1. Framework
import { useState, useCallback } from "react";
// 2. Third-party
import { useQuery } from "@tanstack/react-query";
import { Globe } from "lucide-react";
// 3. Internal
import { listWords } from "../../lib/api";
// 4. Relative + types
import { WordCard } from "./components/word-card";
import type { WordProps } from "./types";
```

---

## Hooks Guide

| Hook | When | Rule |
| --- | --- | --- |
| `useState` | Simple local state | Keep minimal — derive what you can |
| `useReducer` | 3+ related states, complex logic | Discriminated union for actions |
| `useMemo` | Expensive computation | Only when profiler confirms need |
| `useCallback` | Stable ref to memoized child | Not needed for inline event handlers |
| `useRef` | DOM access, mutable without re-render | Never for state affecting render |
| `useEffect` | External system sync | Not for derived state or event-driven logic |

Custom hooks: `src/hooks/` directory, `use*.ts` naming.

---

## JSX Rules

```typescript
// ✅ Correct — no inline functions
const handleSubmitData = () => dispatch(submitAction);
return <button className="cursor-pointer" onClick={handleSubmitData}>Submit</button>;

// ❌ Wrong — inline function in render
return <button onClick={() => dispatch(submitAction)}>Submit</button>;
```

```typescript
// ✅ && for conditional without else
{message && <p className={errorClasses}>{message}</p>}

// ❌ ternary with empty fragment
{message ? <p className={errorClasses}>{message}</p> : <></>}
```

```typescript
// ✅ Map pattern for multiple conditions
const lengthLabels: Record<number, string> = { 4: "4 harf", 5: "5 harf", 6: "6 harf" };

// ❌ Repeated if
if (length === 4) label = "4 harf";
if (length === 5) label = "5 harf";
```

- `<>...</>` Fragment when no wrapper needed.
- No index as `key` for dynamic lists.
- String props without expressions: `heading="good"` not `heading={"bad"}`.
- Semantic HTML: `<button>`, `<nav>`, `<main>`, `<section>`. No `<div onClick>`.
- All `<button>`, `<a>`, `onClick` elements must have `cursor-pointer`.

---

## Tailwind Rules

- No hardcoded hex — use Tailwind tokens or CSS variables (`bg-bg-primary`, `text-text-secondary`).
- No inline styles unless absolutely necessary.
- No `!important`.
- Use responsive prefixes (`sm:`, `md:`, `lg:`) not `isMobile` state.
- `cn()` / `classNames()` only for dynamic classes.
- Minimize arbitrary values (`w-[123px]`).

---

## State Management

1. Local state first — `useState` / `useReducer`.
2. Sibling sharing → lift up.
3. Low-frequency global (theme, auth) → Context.
4. Server state → TanStack Query only, never duplicate in client state.

### TanStack Query

```typescript
// ✅ Data transformation in select, not component
const useWordData = (wordId: string) => {
  return useQuery({
    queryKey: ["word", wordId],
    queryFn: () => fetchWord(wordId),
    select: (data) => ({
      ...data,
      displayWord: data.word.toUpperCase(),
    }),
  });
};
```

- `isFetching` / `isLoading` from query hook — no separate loading state.
- Data transformation in `select`, not in component.

---

## Performance

- `React.memo()` only when profiler confirms.
- `React.lazy()` + `Suspense` at route boundaries.
- No inline object/array/function in JSX props (trivial hariç).
- Lists with 50+ items must be virtualized.
- Images: `loading="lazy"`, `alt` text, WebP when possible.

---

## Accessibility

- Interactive elements keyboard accessible.
- Semantic HTML (no `<div onClick>`).
- Images: `alt` text. Decorative: `alt=""`.
- Form fields: `<label>` associated, required `aria-*` attributes.
- Focus states visible on all interactive elements.
- Color contrast WCAG AA: normal text ≥ 4.5:1.

---

## i18n

- All user-facing text in correct Turkish: ç, ş, ğ, ı, ö, ü, İ, Ş, Ç, Ğ, Ö, Ü.
- "Hakkımızda" not "Hakkimizda", "Giriş" not "Giris".
- Turkish characters: use `normalizeChar()` from `src/utils/gameLogic.ts`.

---

## Frontend Quality Checklist

- [ ] TypeScript strict mode — no `any`, no `@ts-ignore`
- [ ] Components follow single responsibility
- [ ] Props interface typed and max 5 props
- [ ] Custom hooks extract reusable logic
- [ ] No inline objects/functions in JSX props
- [ ] Data fetching via TanStack Query with `select` for transformation
- [ ] Tailwind tokens used — no hardcoded colors
- [ ] All interactive elements have `cursor-pointer`
- [ ] No emojis — Lucide icons only
- [ ] Keyboard navigation works
- [ ] All user-facing text uses correct Turkish characters
- [ ] Images lazy loaded with alt text
- [ ] No `<div onClick>` — semantic HTML
