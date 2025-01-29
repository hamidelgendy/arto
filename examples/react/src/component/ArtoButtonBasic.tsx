import { forwardRef, ButtonHTMLAttributes } from 'react'
import { arto } from 'arto'

/**
 * Example variant keys & possible values
 */
type Variants = {
  theme: 'primary' | 'secondary'
  size: 'small' | 'large'
}

/**
 * Extend the normal <button> HTML attributes
 * with optional theme & size
 */
interface ArtoButtonBasicProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  theme?: Variants['theme']
  size?: Variants['size']
}

/**
 * Configure Arto, merging Tailwind pseudo-classes
 * (hover, focus, active, disabled) in each variant array.
 */
const buttonClasses = arto<Variants>({
  className: [
    'inline-flex select-none items-center justify-center whitespace-nowrap outline-none border font-medium',
    'transition-colors duration-200 ease-in-out',
    'disabled:opacity-60 focus:ring-zinc-200/70',
  ],
  variants: {
    theme: {
      primary: [
        'bg-slate-50 text-slate-500 border-transparent',
        'hover:border-blue-400 hover:shadow-sm',
        'active:bg-slate-100 active:text-blue-500 active:border-blue-400 active:shadow-sm',
        'focus:border-blue-400 focus:text-blue-500 focus:shadow-sm',
        'disabled:bg-slate-50 disabled:text-slate-500 disabled:border-transparent',
      ],
      secondary: [
        'bg-blue-500 text-white border-transparent',
        'hover:bg-blue-400 hover:border-blue-600 hover:shadow-sm',
        'active:bg-blue-600 active:border-blue-800 active:shadow-sm',
        'focus:bg-blue-500 focus:border-blue-900 focus:shadow-sm',
        'disabled:bg-blue-500 disabled:text-white disabled:border-transparent',
      ],
    },
    size: {
      small: 'h-8 px-4 text-sm rounded focus:ring-2 focus:ring-offset-1',
      large: 'h-12 px-6 text-base rounded-md focus:ring-4 focus:ring-offset-2',
    },
  },
  defaultVariants: {
    theme: 'primary',
    size: 'large',
  },
})

/**
 * A **basic** Arto button that relies on Tailwind's built-in pseudo-classes
 * (hover:, focus:, active:, disabled:) rather than ephemeral states from React.
 */
export const ArtoButtonBasic = forwardRef<HTMLButtonElement, ArtoButtonBasicProps>((props, ref) => {
  const { theme, size, children, ...restProps } = props

  // Build final classes from Arto
  const classNameOutput = buttonClasses({
    variants: { theme, size },
  })

  return (
    <button ref={ref} {...restProps} className={classNameOutput}>
      {children}
    </button>
  )
})

ArtoButtonBasic.displayName = 'ArtoButtonBasic'
