---
title: States
---

# States

In Arto, **states** are conditional styling toggles that activate if a certain boolean condition is true. Typical examples include `hover`, `focused`, `disabled`, or custom states like `selected`. Using states, you can centralize ephemeral styling without scattered `if-else` logic.

## Simple State Definition

Let’s start with a basic example of adding a single state called `disabled`:

```ts
import { arto } from 'arto'

type States = 'disabled'

const buttonConfig = arto<never, States>({
  className: 'inline-flex items-center font-medium',
  states: {
    disabled: 'opacity-50 pointer-events-none',
  },
})

const classes = buttonConfig({
  states: { disabled: true },
})

// => "inline-flex items-center font-medium opacity-50 pointer-events-none"
```

### Explanation

- **`states`**: A mapping of state names (like `disabled`) to their class strings or arrays.
- When `disabled` is `true`, Arto appends `opacity-50 pointer-events-none` to the final class.

## Multiple States

Arto supports multiple states at once. Suppose you have a focus style and a pressed style:

```ts
import { arto } from 'arto'

type States = 'disabled' | 'focused' | 'pressed'

const multipleStatesConfig = arto<never, States>({
  className: 'btn transition-colors duration-200',
  states: {
    disabled: 'opacity-50 pointer-events-none',
    focused: 'ring-2 ring-offset-1 ring-blue-300',
    pressed: 'scale-95',
  },
})

const result = multipleStatesConfig({
  states: { disabled: false, focused: true, pressed: true },
})

// => "btn transition-colors duration-200 ring-2 ring-offset-1 ring-blue-300 scale-95"
```

## State Dependencies

Sometimes you only want a state to apply if another state is active (or inactive). For example, maybe `hover` styles only apply if `disabled` is not active. Arto can enforce these rules via **dependsOn**:

```ts
import { arto } from 'arto'

type States = 'disabled' | 'hover'

const conditionalStatesConfig = arto<never, States>({
  className: 'px-4 py-2 border',
  states: {
    disabled: 'opacity-60 pointer-events-none',
    hover: {
      className: 'shadow-md border-blue-400',
      dependsOn: [{ not: ['disabled'] }], // skip hover if disabled
    },
  },
})

// If both `hover` and `disabled` are true, "hover" won't apply because it depends on NOT disabled
```

### Explanation

- **`dependsOn`** allows an array of conditions like `hover`, or `{ not: ['disabled'] }`.
- If conditions aren’t met, Arto skips adding that state’s classes.

## Variant-Level States

In some cases, states are relevant only within a certain variant. For example, the “large” variant might have a specific hover effect, while “small” uses different logic. You can nest states inside variant configs:

```ts
import { arto } from 'arto'

type Variants = {
  size: 'small' | 'large'
}
type States = 'hover'

const nestedStatesConfig = arto<Variants, States>({
  variants: {
    size: {
      small: {
        className: 'text-sm px-2 py-1',
        states: {
          hover: 'bg-gray-50 shadow-sm',
        },
      },
      large: {
        className: 'text-lg px-4 py-2',
        states: {
          hover: 'bg-gray-100 shadow-md',
        },
      },
    },
  },
})

const largeHover = nestedStatesConfig({
  variants: { size: 'large' },
  states: { hover: true },
})

// => "text-lg px-4 py-2 bg-gray-100 shadow-md"
```

## Combining States with Framework Hooks

In React or Vue, you might have ephemeral states like `isHovered`, `isPressed`, or `isFocused`. Arto simply expects booleans. Example with React’s hooks:

_(Pseudo-code, not a full component example, just the idea)_

```tsx
import { arto } from 'arto'
import { FC, useState } from 'react'

type States = 'hover' | 'active' | 'disabled'

const reactiveButtonConfig = arto<never, States>({
  className: 'font-medium transition',
  states: {
    hover: 'bg-blue-100',
    active: 'bg-blue-300',
    disabled: 'opacity-60 pointer-events-none',
  },
})

const MyButton: FC<{ disabled: boolean }> = ({ disabled }) => {
  const [hover, setHover] = useState(false)
  const [active, setActive] = useState(false)

  const classString = reactiveButtonConfig({
    states: { hover, active, disabled },
  })

  return (
    <button
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onMouseDown={() => setActive(true)}
      onMouseUp={() => setActive(false)}
      disabled={disabled}
      className={classString}
    >
      My Button
    </button>
  )
}
```

### Explanation

- Your React hooks keep track of ephemeral states (`hover`, `active`, `disabled`).
- Pass them as booleans to Arto, which merges them into a final class string.

## Summary

- **States** let you toggle styles with simple booleans.
- **`dependsOn`** ensures certain states only apply if other states are active or inactive.
- You can nest states within a **variant config** if those states should only affect that variant.
- Combine states with your preferred framework (React, Vue, etc.) by binding them to event triggers or local component state.

Next, learn how to create more advanced conditionals or to remove classes under specific scenarios in [Rules](/core-concepts/rules).
