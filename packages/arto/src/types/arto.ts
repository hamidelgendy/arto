import type { ClassName } from './class-name'
import type { VariantOptions, VariantValue } from './variants'
import type { StatesOptions } from './states'
import type { ArtoRule } from './rules'

/**
 * Main configuration object for the `arto` function, describing:
 * - A base `className` (always applied),
 * - A `variants` object (defining per-variant classes),
 * - An optional `states` object (defining top-level states),
 * - An array of `rules` (advanced conditional logic),
 * - Default variant values.
 *
 * @template TVariants - A record of all variant keys and their possible values.
 * @template TStates   - A string union of all possible state names.
 * @template TContext  - An optional context type passed to callbacks.
 */
export interface ArtoConfig<
  TVariants extends Record<string, VariantValue> = Record<string, VariantValue>,
  TStates extends string = string,
  TContext = unknown,
> {
  /**
   * A base set of class names (string, array, or callback) that always apply,
   * regardless of variants/states/rules.
   */
  className?: ClassName<TContext>

  /**
   * A configuration mapping each variant key to an object describing how
   * each variant value is styled. This typically includes classes or nested state configs.
   */
  variants?: VariantOptions<TVariants, TStates, TContext>

  /**
   * A configuration mapping of states, each of which can be a simple class name or
   * a more complex config with `dependsOn` conditions.
   */
  states?: StatesOptions<TStates, TContext>

  /**
   * An array of rules for advanced conditional logic. Each rule can remove or add classes
   * based on variants, states, or user-defined logic.
   */
  rules?: ArtoRule<TVariants, TStates, TContext>[]

  /**
   * Default variant values to use if the user does not explicitly supply them at runtime.
   */
  defaultVariants?: Partial<TVariants>
}
