---
title: TypeScript Guide
---

# TypeScript Guide

Arto is built with TypeScript in mind, providing strong type safety for variants, states, and plugin logic. This guide explains how to get the most out of Arto’s type definitions, ensuring you leverage autocompletion and compile-time checks to build resilient UIs.

## Overview

Because Arto is written in TypeScript, you automatically get type inference on:

1. **Variant Keys & Values** – no more guessing or accidental typos.
2. **State Names** – ensures you don’t reference undefined states.
3. **Context Objects** – pass and consume strongly typed context data in your class name callbacks or plugins.

## Basic Typed Example

```ts
import { arto } from 'arto'

// 1) Define a shape for your variants (TypeScript can infer it, but you can be explicit).
type ButtonVariants = {
  size: 'small' | 'large'
  theme: 'primary' | 'secondary'
}

// 2) Define valid states as a union of string literals.
type ButtonStates = 'disabled' | 'hover'

// 3) (Optional) Provide a context type if using advanced logic or callbacks.
interface ButtonContext {
  isDarkMode?: boolean
}

const buttonConfig = arto<ButtonVariants, ButtonStates, ButtonContext>({
  className: (ctx) => (ctx?.isDarkMode ? 'text-white bg-neutral-900' : 'text-black bg-neutral-100'),
  variants: {
    size: {
      small: 'px-2 py-1 text-sm',
      large: 'px-4 py-2 text-base',
    },
    theme: {
      primary: 'bg-blue-500',
      secondary: 'bg-gray-200 text-gray-800',
    },
  },
  states: {
    disabled: 'opacity-50 pointer-events-none',
    hover: 'shadow-md',
  },
})

// Arto’s return function now expects typed variants and states:
const finalClasses = buttonConfig({
  variants: { size: 'small', theme: 'primary' },
  states: { disabled: true, hover: false },
  context: { isDarkMode: false },
})
```

### Explanation

- By passing `<ButtonVariants, ButtonStates, ButtonContext>` to `arto()`, we lock in the possible variant keys/values, states, and context shape.
- **Autocompletion** in your IDE will show suggestions for `size` (`'small'`, `'large'`), `theme` (`'primary'`, `'secondary'`), and states (`'disabled'`, `'hover'`).
- If you accidentally type `'medium'` or `'hovered'`, TypeScript immediately flags it as invalid.

## Extending Variant Keys with Type

```ts
import { arto } from 'arto'

type AlertVariants = {
  level: 'info' | 'warning' | 'error'
  size: 'small' | 'normal' | 'large'
}
type AlertStates = 'dismissed' | 'disabled'

const alertConfig = arto<AlertVariants, AlertStates>({
  className: 'rounded-md p-4',
  variants: {
    level: {
      info: 'bg-blue-100 text-blue-800',
      warning: 'bg-yellow-100 text-yellow-800',
      error: 'bg-red-100 text-red-800',
    },
    size: {
      small: 'text-sm',
      normal: 'text-base',
      large: 'text-lg',
    },
  },
  states: {
    dismissed: 'hidden',
    disabled: 'opacity-50 pointer-events-none',
  },
})
```

### Explanation

- By declaring your **AlertVariants** and **AlertStates** up front, you keep the definitions for possible variant values in a single place.
- The final config type checks calls to `alertConfig(...)`, ensuring no invalid levels or sizes slip through.

## Type-Safe Context Callbacks

```ts
import { arto } from 'arto'

interface CardContext {
  userRole?: 'admin' | 'editor' | 'guest'
}

const cardConfig = arto<never, 'selected', CardContext>({
  className: (ctx) => (ctx?.userRole === 'admin' ? 'border-2 border-red-500' : 'border'),
  states: {
    selected: 'shadow-md bg-blue-50',
  },
})

const cardClass = cardConfig({
  states: { selected: true },
  context: { userRole: 'admin' },
})
// => "border-2 border-red-500 shadow-md bg-blue-50"
```

Because **`context`** is typed as `CardContext`, your callback knows `ctx.userRole` can only be `'admin'`, `'editor'`, or `'guest'`. This guards against accidentally referencing nonexistent fields.

## Using `keyof` Patterns or Enums

```ts
import { arto } from 'arto'

// You could also define an enum for variant values:
enum IconSize {
  Small = 'small',
  Large = 'large',
}
type IconTheme = 'default' | 'primary' | 'danger'

const iconConfig = arto<{ size: IconSize; theme: IconTheme }>({
  variants: {
    size: {
      [IconSize.Small]: 'h-4 w-4',
      [IconSize.Large]: 'h-6 w-6',
    },
    theme: {
      default: 'text-gray-600',
      primary: 'text-blue-600',
      danger: 'text-red-500',
    },
  },
})
```

Enums or mapped types can provide extra clarity in large codebases. TypeScript helps ensure you only use valid `IconSize` and `IconTheme`.

## Error Messages at Compile-Time

```ts
// If you try something invalid:
iconConfig({
  variants: {
    // @ts-expect-error
    size: 'medium', // TS error: Type '"medium"' is not assignable to type 'IconSize'
  },
})
```

Because `'medium'` isn’t a valid `IconSize`, TypeScript surfaces an error before you even run your code. This is one of the biggest wins for using a typed library like Arto.

## Plugin Type Definitions

```ts
import { Plugin, ClassNameBuilder, VariantValue } from 'arto'

type MyContext = { debug?: boolean }

export const MyPlugin: Plugin<Record<string, VariantValue>, string, MyContext> = {
  id: 'my-plugin',
  stage: 'after',
  apply(builder) {
    const ctx = builder.getContext() // typed as MyContext | undefined
    if (ctx?.debug) {
      console.log('[MyPlugin Debug] Classes =>', builder.getAllClasses())
    }
  },
}
```

### Explanation

- We parametrize **`Plugin<TVariants, TStates, TContext>`** with `Record<string, VariantValue>`, a `string` union for states, and a context type `MyContext`.
- In your `apply(builder)`, `builder.getContext()` is strongly typed, ensuring no accidental references to nonexistent fields.

## Deployment or Build Process

```json
{
  "compilerOptions": {
    "strict": true,
    "module": "ESNext",
    "target": "ES2020",
    "moduleResolution": "Bundler",
    "noEmit": true
  },
  "include": ["**/*.ts", "**/*.tsx"]
}
```

Arto’s type definitions work seamlessly in typical TS builds. Make sure your `tsconfig.json` is set to `strict` mode (recommended) so you catch potential type issues early. There’s no special configuration needed to use Arto’s types beyond standard TS best practices.

## Summary

- **Declare** your variant keys as **string unions** or **enums** for strong type checking.
- **List** your states as a union of string literals, so the config can’t reference undefined states.
- **Leverage** a typed `context` if you need dynamic logic or if your plugin relies on user data.
- **Enjoy** compile-time validation—TypeScript ensures you don’t pass invalid variant values or states.
- **Combine** these with [Plugins](/core-concepts/plugins) or advanced usage for a fully type-safe UI styling system.

That’s it! With Arto’s built-in TypeScript support, you can prevent a wide range of runtime errors and maintain a more reliable codebase.
