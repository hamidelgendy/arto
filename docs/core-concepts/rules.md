---
title: Rules
---

# Rules

Arto **Rules** provide an advanced way to dynamically remove or add classes based on complex conditions around variants and states. They let you express logic like “if `theme` is `primary` and `hover` is active, remove the base class and add a different one.”

## Why Use Rules?

Sometimes you need advanced control that goes beyond simple variants and states. Examples include:

1. **Overriding or removing classes** if certain states or variant combinations are active.
2. **Adding new classes** only when multiple conditions meet (e.g., `theme = danger` + `pressed = true`).
3. **Handling conflicts** or one-off special styling without rewriting your entire config.

Rules help you achieve this elegantly, by describing conditions in a centralized config rather than scattering them across your codebase.

## Basic Structure of a Rule

A rule is defined in your Arto config under `rules: [...]`. Each rule object can contain:

- `when`: A set of conditions around variants and states
- `remove`: Which classes or variant classes to remove if the conditions pass
- `add`: Which classes to add if the conditions pass

```ts
import { arto } from 'arto'

type Variants = {
  theme: 'primary' | 'secondary'
}
type States = 'hover' | 'pressed'

const configWithRules = arto<Variants, States>({
  className: 'btn',
  variants: {
    theme: {
      primary: 'bg-blue-500 text-white',
      secondary: 'bg-gray-300 text-gray-800',
    },
  },
  states: {
    hover: 'shadow-md',
    pressed: 'scale-95',
  },
  rules: [
    {
      when: {
        variants: { theme: ['primary'] },
        states: ['pressed'], // all conditions must match by default
      },
      remove: {
        variants: ['theme'], // remove the variant classes for theme
      },
      add: 'bg-blue-700 text-white',
    },
  ],
})
```

### Explanation

- **`when`**: Specifies that `theme` must be `primary` AND `pressed` must be active.
- **`remove`**: Clears out the classes that come from the `theme` variant.
- **`add`**: Adds `'bg-blue-700 text-white'` in its place.

Thus, if you have `(theme = primary, pressed = true)`, the base `bg-blue-500` will be removed, replaced by `bg-blue-700`.

## Custom Logic

By default, `when` applies an **AND** operation across variants and states. However, you can specify more advanced logic using strings or objects:

- `AND` (default)
- `OR`
- `NOT`
- `XOR`
- `IMPLIES`
- Or a function `(meta, context) => boolean`

For instance:

```ts
rules: [
  {
    when: {
      variants: { theme: ['primary', 'secondary'] }, // theme is either primary OR secondary
      states: ['hover', 'pressed'], // by default: must match both
      logic: {
        variants: 'OR', // theme is either primary OR secondary
        states: 'OR', // either hover OR pressed is true
        combine: 'AND', // combine variant result AND states result
      },
    },
    remove: { base: true }, // remove the base className altogether
    add: 'bg-red-500 text-white',
  },
]
```

### Explanation

- **`logic.variants` = 'OR'**: If theme is either 'primary' or 'secondary' (no need to be both).
- **`logic.states` = 'OR'**: If `hover` or `pressed` is active (any one).
- **`logic.combine` = 'AND'**: Both variant condition AND state condition must pass.

If the rule matches, it removes the base classes (`base: true`) and adds `'bg-red-500 text-white'`.

## Removing Classes with `remove`

You can remove:

- **Variant classes**: `remove.variants = ['theme']`
- **State classes**: `remove.states = ['disabled']`
- **Base classes**: `remove.base = true`
- Or all variant-level states by setting `statesScope` to `'all'`, `'global'`, or `'variant'`.

Example:

```ts
rules: [
  {
    when: {
      variants: { size: ['small'] },
      states: ['hover'],
    },
    remove: {
      variants: ['size'],
      states: ['hover'],
      base: false,
    },
  },
]
```

In the above, if `size = small` and `hover` is true, then the entire set of classes from the `size` variant and the `hover` state are removed (but base classes remain).

## Adding Classes with `add`

If your rule condition passes, you can add classes with a simple string or array. Example:

```ts
rules: [
  {
    when: {
      states: ['pressed'],
    },
    add: [
      'bg-opacity-75',
      'transform-gpu', // another example class
    ],
  },
]
```

## Example: Combining Everything

Here’s a more complex snippet showing multiple rules at once:

```ts
import { arto } from 'arto'

type Variants = {
  theme: 'primary' | 'secondary'
}
type States = 'disabled' | 'hover' | 'pressed'

const advancedConfig = arto<Variants, States>({
  className: 'inline-block rounded px-4 py-2',
  variants: {
    theme: {
      primary: 'bg-blue-500 text-white',
      secondary: 'bg-gray-300 text-gray-800',
    },
  },
  states: {
    disabled: 'opacity-60 pointer-events-none',
    hover: 'shadow-md',
    pressed: 'scale-95',
  },
  rules: [
    {
      when: {
        variants: { theme: ['primary'] },
        states: ['hover', 'disabled'],
        logic: {
          states: 'AND', // both hover AND disabled must be active
          variants: 'AND',
          combine: 'AND',
        },
      },
      remove: { states: ['hover'] }, // remove hover class if also disabled
      add: 'cursor-not-allowed',
    },
    {
      when: {
        states: ['pressed'],
      },
      remove: {
        variants: ['theme'],
        statesScope: 'variant', // remove variant-level states only
      },
      add: 'bg-black text-white',
    },
  ],
})

// If theme = primary, hover=true, disabled=true => removes the "hover" class, adds "cursor-not-allowed"
// If pressed=true => removes theme classes from the variant, adds "bg-black text-white"
```

## Summary

- **Rules** provide powerful conditional logic that can remove or add classes based on variant/state combos.
- Use **`when`** to define conditions with a default AND or more advanced logic operators (`OR`, `NOT`, `XOR`, etc.).
- **`remove`** can strip away base classes, variant classes, or state classes (global or variant-level).
- **`add`** can append any new classes you need for that scenario.

Move on to [Plugins](/core-concepts/plugins) to see how you can extend Arto further or create reusable logic, or check the [API Reference](/api/arto-function) for a deeper dive into rules definitions.
