---
title: Variants & States Types
---

# Variants & States Types

In Arto, **variants** and **states** are core concepts for styling flexibility. Variants allow you to define different “modes” (like `size`, `theme`, etc.), while states handle ephemeral or boolean-driven styles (like `disabled`, `hover`, `focused`). This page covers the TypeScript definitions behind these features.

## VariantValue

```ts
export type VariantValue = string | number
```

Variants typically map **string** or **number** values to classes. For instance, `size` could have possible values: `'small'`, `'medium'`, `'large'` (all strings), or `'1'`, `'2'`, `3` if you prefer numeric.

## VariantOptions

```ts
export type VariantOptions<
  TVariants extends Record<string, VariantValue>,
  TStates extends string,
  TContext = unknown,
> = {
  /**
   * Each key (e.g., 'size', 'theme') maps to an object
   * whose keys are possible variant values (e.g., 'small', 'large'),
   * and whose values are either:
   *   - ClassName<TContext> (string, array, or callback)
   *   - A VariantConfig with optional nested states
   */
  [K in keyof TVariants]?: {
    [V in TVariants[K]]: ClassName<TContext> | VariantConfig<TStates, TContext>
  }
}
```

**Explanation**:

- A **`VariantOptions`** object has **keys** that match your variant names (like `size`, `theme`).
- Each variant key is an object whose **keys** are the **possible values** of that variant (e.g., `'small'`, `'large'`).
- The **values** can be **class strings**, arrays, or even a `VariantConfig` that contains advanced options and nested states.

## VariantConfig

```ts
export interface VariantConfig<TStates extends string = never, TContext = unknown> {
  /**
   * Base class names to apply when this variant is selected
   */
  className?: ClassName<TContext>

  /**
   * Nested states that only apply if this variant is selected (and the state is active)
   */
  states?: StatesOptions<TStates, TContext>
}
```

### Explanation

A **`VariantConfig`** allows you to specify:

- **`className`**: Classes for that variant value.
- **`states`**: A nested `StatesOptions` that only apply if the user picks this variant value.

For example:

```ts
{
  size: {
    small: {
      className: "px-2 py-1 text-sm",
      states: {
        hover: "bg-gray-50"
      }
    },
    large: {
      className: "px-4 py-2 text-base",
      states: {
        hover: "bg-gray-100"
      }
    }
  }
}
```

## StatesOptions

```ts
export type StatesOptions<TStates extends string, TContext = unknown> = {
  [K in TStates]?: ClassName<TContext> | StateConfig<TStates, TContext>
}
```

A **`StatesOptions`** object maps each state name to either a direct class name or a `StateConfig`.

## StateConfig

```ts
export interface StateConfig<TStates extends string, TContext = unknown> {
  /**
   * Class(es) to apply if this state is active
   */
  className: ClassName<TContext>

  /**
   * Optional dependencies:
   *   - An array describing states that must/must not be active
   *   - A function receiving (activeStates, context) => boolean
   */
  dependsOn?: StateDependency<TStates, TContext>
}
```

### Explanation

- **`className`**: The classes (or callback) to apply if the state is active.
- **`dependsOn`**: Additional conditions specifying that this state only applies if certain other states are (or are not) active, or a function returning `true/false` based on advanced logic.

## StateDependency

```ts
export type StateDependency<TStates extends string, TContext = unknown> =
  | Array<TStates | { not: TStates[] }>
  | ((activeStates: Set<TStates>, context?: TContext) => boolean)
```

**Possible Forms**:
An **array** of required states or `not:` states:

```ts
dependsOn: ['hover', { not: ['disabled'] }]
```

means `hover` must be active and `disabled` must not be active. 2. A function that returns `true` or `false` based on `(activeStates, context)`.

## Putting It All Together

Here’s a snippet that defines variants and states using these types under the hood:

```ts
import { arto } from 'arto'

const cardConfig = arto({
  className: 'transition-shadow border rounded-md',
  variants: {
    shadow: {
      none: 'shadow-none',
      small: {
        className: 'shadow-sm',
        states: {
          hover: {
            className: 'shadow-md',
            dependsOn: ['hover', { not: ['disabled'] }],
          },
        },
      },
      large: {
        className: 'shadow-lg',
        states: {
          hover: 'shadow-xl',
        },
      },
    },
  },
  states: {
    disabled: 'opacity-60 pointer-events-none',
  },
})

// If user picks shadow=small and hover + not disabled => "shadow-md"
```

## Summary

- **Variants** map keys (like `size`, `theme`) to possible string or numeric values, each corresponding to certain classes.
- **`VariantConfig`** allows advanced usage, including nested `states` that only apply when that variant value is selected.
- **States** can be **simple** (`"bg-red-500"`) or **complex** (`{ className: ..., dependsOn: ... }`).
- **`dependsOn`** arrays or functions let you define conditions on other states before applying the class.

These types power Arto’s flexible system for building dynamic, composable class strings. Check out:

- **[Rules & Logic Types](/api/rules-types)** for removing or adding classes conditionally,
- **[arto() Function](/api/arto-function)** to see how variants & states tie into the main config.
