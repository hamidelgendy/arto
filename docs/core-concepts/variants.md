---
title: Variants
---

# Variants

Variants are a key concept in Arto that let you define different "modes" or "options" for a component. Examples include `size` (`small`, `large`), `theme` (`light`, `dark`), or any other dimension of styling.

## Defining a Variant

You can think of a **variant** as a single key that maps to possible string values. Arto then translates those variant values into specific classes. For example, `size: { small: '...', large: '...' }`:

```ts
import { arto } from 'arto'

type Variants = {
  size: 'small' | 'large'
}

const inputConfig = arto<Variants>({
  className: 'border p-2',
  variants: {
    size: {
      small: 'text-sm w-32',
      large: 'text-base w-64',
    },
  },
})

const smallInput = inputConfig({ variants: { size: 'small' } })
// => "border p-2 text-sm w-32"

const largeInput = inputConfig({ variants: { size: 'large' } })
// => "border p-2 text-base w-64"
```

## Multiple Variants

In many real-world scenarios, you'll define multiple variant keys—like `size`, `theme`, `iconPosition`, etc. Each key can have multiple values:

```ts
import { arto } from 'arto'

type Variants = {
  size: 'small' | 'medium' | 'large'
  theme: 'primary' | 'secondary' | 'danger'
}

const buttonConfig = arto<Variants>({
  className: 'inline-flex items-center rounded',
  variants: {
    size: {
      small: 'px-2 py-1 text-sm',
      medium: 'px-3 py-1.5 text-base',
      large: 'px-4 py-2 text-lg',
    },
    theme: {
      primary: 'bg-blue-500 text-white',
      secondary: 'bg-gray-100 text-gray-800',
      danger: 'bg-red-500 text-white',
    },
  },
})

const dangerLarge = buttonConfig({
  variants: { size: 'large', theme: 'danger' },
})
// => "inline-flex items-center rounded px-4 py-2 text-lg bg-red-500 text-white"
```

## Default Variants

Sometimes, you want to specify a "default" value for each variant, so users don’t have to pass it every time:

```ts
import { arto } from 'arto'

type Variants = {
  type: 'info' | 'success' | 'warning' | 'error'
  size: 'small' | 'normal' | 'large'
}

const alertConfig = arto<Variants>({
  className: 'rounded-md p-2',
  variants: {
    type: {
      info: 'bg-blue-100 text-blue-800',
      success: 'bg-green-100 text-green-800',
      warning: 'bg-yellow-100 text-yellow-800',
      error: 'bg-red-100 text-red-800',
    },
    size: {
      small: 'text-xs',
      normal: 'text-sm',
      large: 'text-base',
    },
  },
  defaultVariants: {
    type: 'info',
    size: 'normal',
  },
})

// If we omit `size` and `type`, Arto uses 'info' + 'normal':
const defaultAlert = alertConfig()
// => "rounded-md p-2 bg-blue-100 text-blue-800 text-sm"
```

## Nested Variant Config

A "variant config" can be more than just a string; it can also define variant-level states. For instance:

```ts
import { arto } from 'arto'

type Variants = {
  shadow: 'none' | 'small' | 'large'
}
type States = 'hover'

const cardConfig = arto<Variants, States>({
  className: 'transition-shadow border rounded-md',
  variants: {
    shadow: {
      none: 'shadow-none',
      small: {
        className: 'shadow-sm',
        states: {
          hover: 'shadow-md',
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
    hover: 'border-blue-300',
  },
})

// If `shadow = large` and `hover` is active, we get 'shadow-xl' plus 'border-blue-300'
```

### Explanation

- **className**: 'shadow-lg' or 'shadow-sm' is the base for each variant value.
- **states**: You can define `hover` or other states that only apply when a specific variant is active.

## Validating Variant Values

If a user tries to select a variant value that isn’t defined, Arto will throw an error. This helps ensure your UI stays consistent:

```ts
import { arto } from 'arto'

type Variants = {
  theme: 'primary' | 'secondary'
}

const buttonConfig = arto<Variants>({
  className: 'btn',
  variants: {
    theme: {
      primary: 'btn-primary',
      secondary: 'btn-secondary',
    },
  },
})

// This is valid:
buttonConfig({ variants: { theme: 'primary' } })

// This throws an error: "Invalid value 'dark' for variant 'theme'"
buttonConfig({ variants: { theme: 'dark' } })
```

## Summary

- **Variants** let you map distinct style choices (e.g., `size`, `theme`) to specific classes.
- You can define **multiple variants** in one configuration, each with multiple possible values.
- **Default variants** let you omit optional choices.
- **Nested configs** allow deeper usage such as variant-level states.
- Arto catches invalid variant values at runtime, aiding consistency and correctness.

When you’re ready for dynamic styling beyond variants, check out [States](/core-concepts/states) or skip ahead to [Rules](/core-concepts/rules) for advanced conditional logic.
