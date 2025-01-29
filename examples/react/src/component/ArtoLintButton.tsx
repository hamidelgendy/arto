import { forwardRef, ReactNode, ButtonHTMLAttributes } from 'react'
import { arto, Plugin } from 'arto'
import type { ClassNameBuilder, PluginStage } from 'arto'

/**
 * LintContext: optional flags controlling lint checks.
 */
interface LintContext {
  /**
   * If true, the plugin checks for conflicting classes.
   */
  lintConflicts?: boolean

  /**
   * If true, we throw an error on conflict instead of console.warn.
   */
  throwOnConflict?: boolean
}

/**
 * ArtoLintButtonProps: extends normal <button> HTML attributes
 * with optional lint flags.
 */
interface ArtoLintButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, LintContext {
  children: ReactNode
}

/**
 * A "LintPlugin" that runs at 'after' stage, uses a final build callback,
 * and inspects the final classes for conflict combos (e.g. "flex" + "inline-flex").
 * It preserves Tailwind by not altering any classes.
 */
export class LintPlugin implements Plugin<never, never, LintContext> {
  readonly id = 'example/LintPlugin'
  stage: PluginStage = 'after'
  order: number = 0

  apply(builder: ClassNameBuilder<never, never, LintContext>): void {
    // Check if user wants to run conflict checks
    const ctx = builder.getContext()
    if (!ctx?.lintConflicts) return

    // Attach logic in the final build step
    builder.addFinalBuildCallback(() => {
      // Gather all classes from the builder
      const allClasses = builder.getAllClasses()
      const conflicts: string[] = []

      // Example detection for "flex" + "inline-flex"
      let hasFlex = false
      let hasInlineFlex = false

      // Example detection for "bg-transparent" + "bg-slate-xxx"
      let hasBgTransparent = false
      let hasBgSolid = false

      // Regex for a "bg-" class that isn't none or transparent
      const bgRegex = /^bg-(?!none|transparent)(.+)$/

      for (const cls of allClasses) {
        if (cls === 'flex') hasFlex = true
        if (cls === 'inline-flex') hasInlineFlex = true
        if (cls === 'bg-transparent') hasBgTransparent = true

        if (bgRegex.test(cls)) {
          hasBgSolid = true
        }
      }

      if (hasFlex && hasInlineFlex) {
        conflicts.push(`"flex" and "inline-flex" are both present.`)
      }

      if (hasBgTransparent && hasBgSolid) {
        conflicts.push(`"bg-transparent" + a solid "bg-..." class are both present.`)
      }

      // If any conflicts found, log or throw
      if (conflicts.length > 0) {
        const msg = `[LintPlugin] Conflicts -> ${conflicts.join(' ; ')}`
        if (ctx.throwOnConflict) {
          throw new Error(msg)
        } else {
          console.warn(msg)
        }
      }
    })
  }
}

/**
 * Minimal config that includes LintPlugin, purely to illustrate how
 * we can pass { lintConflicts } or { throwOnConflict } in context.
 */
const lintConfig = arto<never, never, LintContext>(
  {
    className: [
      'inline-flex select-none items-center justify-center whitespace-nowrap outline-none border font-medium',
      'transition-colors duration-200 ease-in-out',
      'disabled:opacity-60 focus:ring-zinc-200/70',
      'bg-slate-50 text-slate-500 border-transparent',

      'hover:border-blue-400 hover:shadow-sm',
      'active:bg-slate-100 active:text-blue-500 active:border-blue-400 active:shadow-sm',
      'focus:border-blue-400 focus:text-blue-500 focus:shadow-sm',
      'disabled:bg-slate-50 disabled:text-slate-500 disabled:border-transparent',

      'h-12 px-6 text-base rounded-md focus:ring-4 focus:ring-offset-2',

      'flex', // Example conflict with 'inline-flex'
    ],
  },
  [new LintPlugin()],
)

/**
 * ArtoLintButton
 *
 * - If lintConflicts is true, the plugin runs checks.
 * - If throwOnConflict is also true, we error instead of console.warn.
 */
export const ArtoLintButton = forwardRef<HTMLButtonElement, ArtoLintButtonProps>((props, ref) => {
  const { children, lintConflicts, throwOnConflict, ...restProps } = props

  // Provide context to the lint plugin
  const classNameOutput = lintConfig({
    context: { lintConflicts, throwOnConflict },
  })

  return (
    <button ref={ref} {...restProps} className={classNameOutput}>
      {children}
    </button>
  )
})

ArtoLintButton.displayName = 'ArtoLintButton'
