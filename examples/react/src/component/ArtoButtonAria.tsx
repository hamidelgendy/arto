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
