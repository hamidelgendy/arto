---
title: Basic Usage
---

# Basic Usage

Learn how to create your first Arto configuration and see how variants and states come together in a practical scenario. Once you’re comfortable with these basics, you can move on to more advanced topics like [Rules](/core-concepts/rules) and [Plugins](/core-concepts/plugins).

## Step 1: Create a Configuration

Your Arto configuration is the core object describing base classes, variants, and states. Here’s a minimal example for a **button** that can have two sizes (`small` or `large`) and two color themes (`primary` or `secondary`):

```ts
import { arto } from 'arto'

// Declare variant keys/values explicitly if you want type checking:
type Variants = {
  size: 'small' | 'large'
  theme: 'primary' | 'secondary'
}

// Create your button configuration
const buttonConfig = arto<Variants>({
  className: 'inline-flex items-center font-medium transition-colors ease-in-out',
  variants: {
    size: {
      small: 'px-2 py-1 text-sm',
      large: 'px-4 py-2 text-base',
    },
    theme: {
      primary: 'bg-blue-500 text-white',
      secondary: 'bg-gray-100 text-gray-800',
    },
  },
  defaultVariants: {
    size: 'large',
    theme: 'primary',
  },
})
```

### Explanation

- **`className`**: Always applies these classes, regardless of size/theme.
- **`variants`**: Defines different possible values for `size` and `theme`, each having its own Tailwind classes.
- **`defaultVariants`**: If a user doesn’t specify a `size` or `theme`, it defaults to `'large'` and `'primary'`.

## Step 2: Generate Class Names

Once you have a configuration, simply call the returned function with the variants (and states, if any) you want. Arto will merge them into a final, space-joined string.

```ts
// Usage example:
const result = buttonConfig({
  variants: { size: 'small', theme: 'secondary' },
})

console.log(result)
// => "inline-flex items-center font-medium transition-colors ease-in-out px-2 py-1 text-sm bg-gray-100 text-gray-800"
```

## Combining States

Arto also allows states like `disabled`, `hover`, or custom states. Suppose you modify your config to include a `disabled` state:

```ts
import { arto } from 'arto'

type Variants = {
  size: 'small' | 'large'
  theme: 'primary' | 'secondary'
}
type States = 'disabled'

const buttonWithState = arto<Variants, States>({
  className: 'inline-flex items-center font-medium transition-colors ease-in-out',
  variants: {
    size: {
      small: 'px-2 py-1 text-sm',
      large: 'px-4 py-2 text-base',
    },
    theme: {
      primary: 'bg-blue-500 text-white',
      secondary: 'bg-gray-100 text-gray-800',
    },
  },
  states: {
    disabled: 'opacity-50 pointer-events-none',
  },
})

// Now call the config with states:
const result = buttonWithState({
  variants: { size: 'small', theme: 'primary' },
  states: { disabled: true },
})

console.log(result)
// => "inline-flex items-center font-medium transition-colors ease-in-out px-2 py-1 text-sm bg-blue-500 text-white opacity-50 pointer-events-none"
```

### Explanation

When `disabled` is `true`, Arto appends those classes (`opacity-50 pointer-events-none`) to the final string. You can define as many states as you like, each with its own dependencies or nested logic.

## What’s Next?

Now that you see how **basic usage** works, consider checking out:

- [Variants](/core-concepts/variants) – A deeper dive into how to structure more complex variants.
- [States](/core-concepts/states) – Advanced usage, ephemeral states, and conditional dependencies.
- [Rules](/core-concepts/rules) – Create sophisticated logic to remove or add classes dynamically.
