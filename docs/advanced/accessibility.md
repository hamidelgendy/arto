---
title: Accessibility
---

# Accessibility

**Accessibility** (A11y) is a crucial part of building robust interfaces. Arto helps by letting you define and manage focus, hover, pressed, and other states that correspond to keyboard or screen-reader interactions. While Arto doesn’t replace a dedicated accessibility library (like React Aria or WAI-ARIA attributes), it does make it easier to style accessible components consistently.

## Focus States

```tsx
import { arto } from 'arto'

const focusConfig = arto<never, 'focusVisible'>({
  className: 'inline-flex items-center p-2',
  states: {
    focusVisible: 'ring-2 ring-offset-2 ring-blue-500 outline-none',
  },
})

// Usage example in React:
function AccessibleButton({ isFocusVisible }) {
  const classes = focusConfig({
    states: { focusVisible: isFocusVisible },
  })
  return <button className={classes}>Click Me</button>
}
```

### Explanation

- **`focusVisible`** is an ephemeral state that you can toggle based on user interaction. For instance, React or Vue can detect keyboard focus and set `isFocusVisible = true`.
- Using Arto, you ensure a consistent ring or outline is applied whenever your user navigates by keyboard, improving accessibility for those who can’t use a mouse.

## Handling `aria-` Attributes

```tsx
const buttonWithAria = arto<never, 'disabled'>({
  className: 'inline-flex items-center py-2 px-4 rounded',
  states: {
    disabled: 'opacity-60 cursor-not-allowed',
  },
})

// In a React component:
function ArtoAriaButton({ isDisabled, ariaLabel }) {
  const classes = buttonWithAria({
    states: { disabled: isDisabled },
  })

  return (
    <button className={classes} disabled={isDisabled} aria-label={ariaLabel}>
      Accessible Button
    </button>
  )
}
```

**Note**: Arto only manages classes. To be truly accessible, you also need to set relevant `aria-` attributes or `disabled` on your DOM elements. The final output class might visually reflect a disabled look, but the actual HTML attribute is what screen readers use to interpret the state.

## Using React Aria (or Similar Libraries)

```tsx
import { forwardRef } from 'react'
import {
  mergeProps,
  useButton,
  useFocusRing,
  useHover,
  useObjectRef,
  AriaButtonProps,
  HoverProps,
} from 'react-aria'

import { arto } from 'arto'

/**
 * Example variant keys & possible values:
 */
type Variants = {
  theme: 'primary' | 'secondary'
  size: 'small' | 'large'
}

/**
 * Our ephemeral states in React: 'hover' | 'pressed' | 'focus' | 'focusVisible' | 'disabled'
 */
type States = 'hover' | 'pressed' | 'focus' | 'focusVisible' | 'disabled'

/**
 * Extend AriaButtonProps (react-aria) + HoverProps + optional theme/size.
 */
interface ArtoButtonAriaProps extends AriaButtonProps, HoverProps {
  theme?: Variants['theme']
  size?: Variants['size']
}

/**
 * Configure Arto with:
 * - base className arrays
 * - 'theme' & 'size' variants
 * - ephemeral states: hover, pressed, focus, focusVisible, disabled
 * - a rule removing base theme if (hover OR pressed OR focus) is active
 */
const buttonClasses = arto<Variants, States>({
  className: [
    'inline-flex select-none items-center justify-center whitespace-nowrap outline-none border font-medium',
    'transition-colors duration-200 ease-in-out',
  ],
  variants: {
    theme: {
      primary: {
        className: 'bg-slate-50 text-slate-500 border-transparent',
        states: {
          hover: {
            className: 'bg-slate-50 text-slate-500 border-blue-400 shadow-sm',
            dependsOn: [{ not: ['pressed'] }], // skip "hover" if "pressed" is also active
          },
          pressed: 'bg-slate-100 text-blue-500 border-blue-400 shadow-sm',
          focus: 'border-blue-400 text-blue-500 shadow-sm',
        },
      },
      secondary: {
        className: 'bg-blue-500 text-white border-transparent',
        states: {
          hover: {
            className: 'bg-blue-400 text-white border-blue-600 shadow-sm',
            dependsOn: [{ not: ['pressed'] }],
          },
          pressed: 'bg-blue-600 text-white border-blue-800 shadow-sm',
          focus: 'bg-blue-500 border-blue-900 text-white shadow-sm',
        },
      },
    },
    size: {
      small: {
        className: 'h-8 rounded px-6 text-sm',
        states: {
          focusVisible: 'ring-2 ring-offset-1',
        },
      },
      large: {
        className: 'h-12 rounded-md px-9 text-base',
        states: {
          focusVisible: 'ring-4 ring-offset-2',
        },
      },
    },
  },
  states: {
    focusVisible: 'ring-zinc-200/70',
    disabled: 'opacity-60',
  },
  rules: [
    {
      when: {
        // If 'theme' is primary OR secondary, and any of (pressed OR focus OR hover) is true
        // then remove the base theme variant classes (so only the "state" style shows).
        variants: { theme: ['primary', 'secondary'] },
        states: ['pressed', 'focus', 'hover'],
        logic: {
          variants: 'OR',
          states: 'OR',
          combine: 'AND',
        },
      },
      remove: {
        variants: ['theme'],
        statesScope: 'variant',
      },
    },
  ],
  defaultVariants: {
    theme: 'primary',
    size: 'large',
  },
})

/**
 * "ArtoButtonAria":
 * - Combines React Aria hooks for ephemeral states:
 *   (hover, pressed, focus, etc.)
 * - Passes those states into Arto's config for styling
 * - Forwards a ref to <button>.
 */
export const ArtoButtonAria = forwardRef<HTMLButtonElement, ArtoButtonAriaProps>((props, ref) => {
  const { theme, size, children, ...restProps } = props

  // Combine forwarded ref with local object re
  const localRef = useObjectRef(ref)

  // React Aria hooks
  const { buttonProps, isPressed } = useButton(restProps, localRef)
  const { focusProps, isFocusVisible, isFocused } = useFocusRing(restProps)
  const { hoverProps, isHovered } = useHover(restProps)

  // Build final classes from Arto
  const classNameOutput = buttonClasses({
    variants: { theme, size },
    states: {
      hover: isHovered,
      pressed: isPressed,
      focus: isFocused,
      focusVisible: isFocusVisible,
      disabled: props.isDisabled,
    },
  })

  return (
    <button
      ref={localRef}
      data-pressed={isPressed ?? undefined}
      data-hovered={isHovered ?? undefined}
      data-focused={isFocused ?? undefined}
      data-focus-visible={isFocusVisible ?? undefined}
      data-disabled={props.isDisabled || undefined}
      {...mergeProps(buttonProps, focusProps, hoverProps)}
      className={classNameOutput}
    >
      {children}
    </button>
  )
})

ArtoButtonAria.displayName = 'ArtoButtonAria'
```

### Explanation

- **React Aria** (or other frameworks like Vue’s `v-hover`) can detect ephemeral states (`hover`, `pressed`, `focused`, etc.).
- Arto merges the correct classes for each state, ensuring your button visually reflects keyboard focus or pressed states while also providing correct ARIA attributes from the library hooks.
- This combination yields both visually and semantically accessible components.

## Accessible Color Contrast

```ts
const contrastConfig = arto({
  className: 'font-medium p-2 border',
  variants: {
    theme: {
      highContrast: 'bg-black text-white border-white',
      normal: 'bg-gray-200 text-gray-900 border-gray-400',
    },
  },
})

const result = contrastConfig({ variants: { theme: 'highContrast' } })
// => "font-medium p-2 border bg-black text-white border-white"
```

**Tip**: Provide a variant for “highContrast” or “accessibleDarkMode” if you want to ensure your colors meet or exceed WCAG contrast ratios. You can also offer multiple themes, letting the user or system preferences pick the best contrast level.

## Focus Visible vs. Focus

```ts
const advancedFocusConfig = arto({
  states: {
    focus: 'outline-none ring-1 ring-blue-300',
    focusVisible: 'ring-2 ring-offset-2 ring-blue-500',
  },
})

const final = advancedFocusConfig({
  states: { focus: true, focusVisible: false },
})
// => "outline-none ring-1 ring-blue-300"
```

By differentiating **focus** from **focusVisible**, you can provide minimal styling for pointer-based focus while giving a more noticeable highlight for keyboard focus. This aligns with modern accessibility guidelines (e.g., “focus-visible” polyfills).

## Testing for Accessibility

It’s important to validate that your styling and attribute usage meets accessibility standards:

- **Keyboard Navigation**: Ensure you can tab through interactive elements, that focus rings are clearly visible, and that `disabled` or `aria-` states reflect the real component state.
- **Screen Reader Testing**: Tools like VoiceOver (macOS) or NVDA (Windows) help confirm your `aria-label`, `role`, and states are read correctly.
- **Contrast Checking**: Use color contrast checkers (e.g., [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)) to confirm your chosen backgrounds and text meet WCAG guidelines.

## Summary

- **Arto** handles styling for ephemeral states like hover, pressed, focus, or disabled, but you must combine it with proper HTML attributes (`disabled`, `aria-*`).
- Use **variants** to offer high-contrast or color-blind-friendly themes.
- Integrate **React Aria** or similar libraries for advanced interactions, hooking ephemeral states into Arto’s class toggles.
- Always **test** for real accessibility, including keyboard navigation, screen readers, and color contrast.

With these patterns, you can build UIs that are both elegantly styled and truly accessible to all users.
