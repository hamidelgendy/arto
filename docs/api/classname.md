---
title: ClassName
---

# ClassName

In Arto, **className** can be provided in multiple forms—string, array, or callback—making it easy to handle a wide variety of styling needs. Internally, these forms are unified by the **`ClassName`** type, which ensures Arto can normalize them into a final array of strings before joining them into one class string. This page walks you through how to define and use `className` (and its variations) in your Arto configurations.

## The `ClassName` Type

```ts
// conceptually in arto's definitions:
export type PrimitiveClassName = string | string[]

export type ClassNameCallback<TContext = unknown> = (
  context?: TContext,
) => PrimitiveClassName | false | undefined

// The ClassName union:
export type ClassName<TContext = unknown> =
  | PrimitiveClassName
  | ClassNameCallback<TContext>
  | Array<ClassName<TContext>>
```

### Explanation

- **`PrimitiveClassName`**: A single string or an array of strings, e.g. `"btn btn-primary"` or `["btn", "btn-primary"]`.
- **`ClassNameCallback`**: A function `(context) => string | string[] | false | undefined`. Returning `false` or `undefined` tells Arto to skip adding classes.
- **`ClassName`**: A flexible union allowing nested arrays, callbacks, or single strings.

## Allowed Forms

```ts
// 1. Simple string
className: 'bg-blue-500 text-white'

// 2. Array of strings
className: ['inline-flex', 'rounded-md', 'px-4', 'py-2']

// 3. Callback
className: (ctx) => (ctx?.isDarkMode ? 'bg-black text-white' : 'bg-white text-black')

// 4. Nested arrays or combined
className: [
  'inline-flex',
  (ctx) => (ctx?.active ? 'shadow-md' : 'shadow-none'),
  ['rounded-md', 'font-medium'],
]
```

Arto recursively **flattens** these inputs, skipping any `false` or empty results, and joins them into a final space-separated string.

## Using `className` in Your Config

```ts
import { arto } from 'arto'

type Variants = {
  size: 'small' | 'large'
}
interface Context {
  highlight: boolean
}

// Example config with a base className callback and variants:
const myConfig = arto<Variants, never, Context>({
  className: (ctx) =>
    ctx?.highlight
      ? ['p-4', 'border-4', 'border-yellow-400']
      : ['p-2', 'border', 'border-gray-300'],
  variants: {
    size: {
      small: 'text-sm',
      large: 'text-lg',
    },
  },
})

const final = myConfig({
  variants: { size: 'small' },
  context: { highlight: true },
})

// => "p-4 border-4 border-yellow-400 text-sm"
```

### Explanation

- **`className`** is a callback that returns different classes based on `ctx.highlight`.
- **Flattened** results: `["p-4", "border-4", "border-yellow-400", "text-sm"]`.
- Because `size='small'` is chosen, it appends `"text-sm"` to the final classes.

## Nesting Arrays & Callbacks

```ts
import { arto } from 'arto'

const nestedConfig = arto<never, never, { active: boolean }>({
  className: [
    'btn',
    ['font-semibold', 'transition-colors'],
    (ctx) => (ctx?.active ? 'shadow-md' : 'shadow-none'),
  ],
})

const result = nestedConfig({ context: { active: true } })
// => "btn font-semibold transition-colors shadow-md"
```

Arto’s internal logic flattens **all** levels of arrays and calls each function with the provided context. It then discards falsy returns (like `false` or `undefined`).

## Skipping Classes with Falsey Returns

```ts
import { arto } from 'arto'

const skipConfig = arto<never, never, { disabled: boolean }>({
  className: (ctx) => (ctx?.disabled ? false : 'hover:bg-blue-500'),
})

const result1 = skipConfig({ context: { disabled: true } })
// => "" (empty string)

const result2 = skipConfig({ context: { disabled: false } })
// => "hover:bg-blue-500"
```

In this example:

- **When `disabled` is true**, the callback returns `false`, causing Arto to skip adding any class.
- **When `disabled` is false**, it returns `"hover:bg-blue-500"`.

## Integration with States and Variants

```ts
import { arto } from 'arto'

type Variants = {
  theme: 'light' | 'dark'
}
type States = 'focused'
interface Context {
  role: 'admin'
  useGradient: boolean
}

const advancedConfig = arto<Variants, States, Context>({
  className: [
    'block',
    (ctx) => ctx?.role === 'admin' && 'border-2 border-red-500', // conditionally add
  ],
  variants: {
    theme: {
      light: ['bg-white', 'text-black'],
      dark: (ctx) =>
        ctx?.useGradient
          ? 'bg-gradient-to-r from-gray-700 to-gray-900 text-white'
          : 'bg-gray-900 text-white',
    },
  },
  states: {
    focused: 'outline-none ring-2 ring-blue-300',
  },
})

const result = advancedConfig({
  variants: { theme: 'dark' },
  states: { focused: true },
  context: { role: 'admin', useGradient: true },
})

// => "block border-2 border-red-500 bg-gradient-to-r from-gray-700 to-gray-900 text-white outline-none ring-2 ring-blue-300"
```

This shows how to combine:

- **base** `className` that can be a callback,
- **variant** with a dynamic callback (`dark` uses `ctx.useGradient`),
- **state** (focused).

Everything merges into a single final string.

## Normalize Utility

```ts
// Arto internally uses something like:
import { normalizeClassName } from 'arto'

const raw = [
  'inline-flex',
  (ctx) => ctx?.active && 'bg-blue-500',
  false,
  ['hover:shadow', undefined],
]

const flattened = normalizeClassName(raw, { active: true })
// => ["inline-flex", "bg-blue-500", "hover:shadow"]
```

The **`normalizeClassName`** function is how Arto flattens and filters out falsy parts. You typically don’t need to call it yourself, but it’s handy for debugging or advanced plugin scenarios.

## Summary

- **`className`** in Arto can be **strings**, **arrays**, **callbacks**, or nested combos.
- Arto flattens them into a final array, ignoring any `false` or `undefined`.
- **Callbacks** can use an optional context, letting you dynamically return classes.
- **`normalizeClassName`** is the internal utility that merges these forms.
- Combine them with **Variants** and **States** for robust, type-safe styling logic.

By leveraging Arto’s flexible `className` inputs, you can handle anything from basic static classes to advanced, context-driven dynamic styling.
