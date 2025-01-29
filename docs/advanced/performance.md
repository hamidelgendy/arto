---
title: Performance & Optimization
---

# Performance & Optimization

While Arto is generally lightweight and designed to handle dynamic class generation efficiently, there are times you might worry about overhead—particularly if you’re building large, performance-sensitive applications. This page covers strategies and best practices to keep Arto running smoothly.

## Avoid Re-Initializing Configs

One of the most common pitfalls is **re-initializing the Arto config** on every render (e.g., in React, inside a component function). Arto configs are intended to be **top-level** or otherwise memoized, so you only pay the cost of set-up once.

**Bad Example** (re-initializing every render):

```tsx
function BadButtonComponent({ size, theme }) {
  const buttonConfig = arto({
    // ...
  })

  const className = buttonConfig({ variants: { size, theme } })
  return <button className={className}>Click me</button>
}
```

**Good Example** (declare config once):

```tsx
type Variants = {
  size: 'small' | 'large'
  theme: 'primary' | 'secondary'
}

const buttonConfig = arto<Variants>({
  className: 'inline-flex items-center rounded',
  variants: {
    size: {
      small: 'px-2 py-1 text-sm',
      large: 'px-4 py-2 text-lg',
    },
    theme: {
      primary: 'bg-blue-500 text-white',
      secondary: 'bg-gray-300 text-gray-800',
    },
  },
})

function GoodButtonComponent({ size, theme }) {
  const className = buttonConfig({ variants: { size, theme } })
  return <button className={className}>Click me</button>
}
```

## Memoize Class Generation in Heavy Scenarios

If you find yourself calling the same config with the same variants/states repeatedly, you can **cache** or **memoize** the results. In frameworks like React, you might use `useMemo` to avoid re-computing a class string if the inputs haven’t changed.

**React Example**:

```tsx
import { useMemo } from 'react'
import { arto } from 'arto'

type Variants = {
  size: 'small' | 'large'
}

const inputConfig = arto<Variants>({
  className: 'p-2 border',
  variants: {
    size: {
      small: 'text-sm',
      large: 'text-lg',
    },
  },
})

function MyInput({ size = 'small', isDisabled }) {
  const className = useMemo(() => {
    return inputConfig({ variants: { size }, states: { disabled: isDisabled } })
  }, [size, isDisabled])

  return <input className={className} disabled={isDisabled} />
}
```

If you render a large list of the same component, memoizing can cut down on repeated string generation when the variants/states don’t change.

## Limit Overly Complex Rules

Arto **Rules** are powerful, but excessive or complicated logic can slow down class generation, especially if you have multiple large rules checking many conditions. Consider these optimizations:

- Combine rules or refactor them if they overlap heavily.
- Use simpler logic expressions when possible (`AND`, `OR`) instead of layered callbacks or advanced operators.
- Move rarely needed logic out of rules and into specialized plugins or manual conditionals when it’s more straightforward.

## Keep Plugins Lean

Plugins that do lots of work each time you generate a class string can become a bottleneck. For instance, scanning all classes for conflicts every render might be expensive. Some tips:

- **Stage** `'before'` vs `'core'` vs `'after'`: Place heavy computations in `'before'` or `'after'` if that better suits your logic, avoiding collisions with main processing.
- Cache or track partial results if possible (e.g., store a quick reference if you've already processed certain states).
- For example, a lint plugin can use a final build callback (`addFinalBuildCallback`) but still be mindful about not running heavy scanning on every single user interaction if it’s not needed.

## Minimize Nested Arrays and Deep Callbacks

If your `className` definitions or states/variants produce deeply nested arrays or complex callback chains, Arto has to flatten and resolve them each time. While Arto’s flattening is efficient, you can reduce overhead by keeping definitions straightforward:

**Overly nested**:

```ts
const nestedConfig = arto({
  className: ['base-class', ['another-class', () => ['maybe-this-class']], 'some-other-class'],
})
```

**Better** to keep them in a simple array or string when possible:

```ts
const simplerConfig = arto({
  className: 'base-class another-class some-other-class',
})
```

## Use Dev Plugins Selectively

If you have plugins like a **lint or debug plugin**, consider enabling them only in development (e.g., behind a condition like `process.env.NODE_ENV !== 'production'`). This way, production builds don’t incur the overhead of dev checks.

## Consider SSR Caching or One-Time Generation

In **Server-Side Rendering** scenarios (e.g., Next.js, Nuxt, or SvelteKit), you might repeatedly render the same components. If you know certain configs + variants + states are reused, you can implement caching at a higher level. Because Arto is stateless at runtime, you can store the final class string in a cache object keyed by a JSON representation of `(variants, states)`.

**Pseudo-code**:

```ts
const cache = new Map()

function getCachedClass(config, options) {
  const key = JSON.stringify(options)
  if (cache.has(key)) {
    return cache.get(key)
  }
  const result = config(options)
  cache.set(key, result)
  return result
}
```

## Summary

- **Don’t re-initialize** Arto configs on every render; define them once or memoize.
- **Memoize** calls to your config if you repeatedly generate the same class string.
- Keep rules, states, and plugin logic as **lean** as possible.
- **Dev-only** debug plugins to avoid overhead in production.
- **Caching** can help if you have many repeated calls in server-side or large-scale usage.

By following these recommendations, you’ll ensure that Arto remains efficient even in large, demanding projects.
