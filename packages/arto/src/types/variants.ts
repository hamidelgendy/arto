import type { ClassName } from './class-name'
import type { StatesOptions } from './states'

/**
 * Represents permissible values for a variant (e.g., 'small', 'large', 0, 1, etc.).
 * Variants can be any string or number.
 */
export type VariantValue = string | number

/**
 * Defines an object for more complex variant styling. It can include:
 *
 * - A `className` (string, array, or callback) that applies when the variant is active.
 * - A `states` map for handling state-specific classes within this variant.
 *
 * @template TStates   - A string union of all possible state names.
 * @template TContext  - An optional context type used in class name callbacks.
 */
export interface VariantConfig<TStates extends string = never, TContext = unknown> {
  /**
   * Base class name(s) to apply for this variant.
   */
  className?: ClassName<TContext>

  /**
   * Nested `states` definitions that apply only when this variant is chosen,
   * potentially overriding or extending global states.
   */
  states?: StatesOptions<TStates, TContext>
}

/**
 * Describes how each variant key is configured. For each key:
 *
 * - You can map each variant **value** to either:
 *   - A simple `ClassName<TContext>` (string, string array, or callback),
 *   - A `VariantConfig` object containing `className` plus nested `states`.
 *
 * This allows you to customize the classes applied for each variant value,
 * optionally specifying additional state-based styling at the variant level.
 *
 * @example
 * ```ts
 * const variantOptions = {
 *   size: {
 *     small: 'text-sm',
 *     large: { className: 'text-lg', states: { disabled: 'opacity-50' } }
 *   }
 * }
 * ```
 *
 * @template TVariants - A record of variant keys to possible values.
 * @template TStates   - A string union of all possible states.
 * @template TContext  - Optional context type passed into callbacks.
 */
export type VariantOptions<
  TVariants extends Record<string, VariantValue>,
  TStates extends string,
  TContext = unknown,
> = {
  /**
   * A property keyed by the variant name (e.g. `'size'`, `'color'`).
   * Each key maps to an object whose keys are the **possible values** for that variant,
   * and whose values are either:
   *  - A `ClassName<TContext>` (string, array, or callback),
   *  - Or a `VariantConfig<TStates, TContext>` for more advanced usage.
   */
  [K in keyof TVariants]?: {
    [V in TVariants[K]]: ClassName<TContext> | VariantConfig<TStates, TContext>
  }
}
