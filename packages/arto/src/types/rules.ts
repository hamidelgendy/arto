import type { ClassName } from './class-name'
import type { VariantValue } from './variants'

/**
 * Basic logic operators that can be applied to an array of boolean conditions.
 *
 * - **'AND'**: All conditions must be `true`.
 * - **'OR'**: At least one condition must be `true`.
 * - **'NOT'**: All conditions must be `false`.
 * - **'XOR'**: Exactly one condition must be `true`.
 * - **'IMPLIES'**: For two conditions, `(!A || B)`. If more than two are provided, only the first two are used.
 *   For chaining, consider using multiple rules or a custom logic callback.
 */
export type LogicOperator = 'AND' | 'OR' | 'NOT' | 'XOR' | 'IMPLIES'

/**
 * Defines how variant matches and state matches are each evaluated ('AND'/'OR'),
 * then how those two results are combined ('AND'/'OR').
 *
 * @example
 * ```ts
 * const myLogic: ArtoLogicObject = {
 *   variants: 'AND',
 *   states: 'OR',
 *   combine: 'AND'
 * }
 * // => (All variant conditions pass) AND (At least one state condition passes).
 * ```
 */
export interface ArtoLogicObject {
  /**
   * How to evaluate variant booleans: `'AND'` (all must be true) or `'OR'` (at least one true).
   */
  variants?: 'AND' | 'OR'

  /**
   * How to evaluate state booleans: `'AND'` (all must be true) or `'OR'` (at least one true).
   */
  states?: 'AND' | 'OR'

  /**
   * How to combine the two results: `'AND'` or `'OR'`.
   */
  combine?: 'AND' | 'OR'
}

/**
 * Carries information about which variants matched, which states matched,
 * and the user's selected variants plus active states.
 *
 * @template TVariants - A record of variant keys/values.
 * @template TStates   - A string union of all possible state names.
 */
export interface RuleEvalMeta<
  TVariants extends Record<string, VariantValue>,
  TStates extends string,
> {
  /**
   * For each variant key, whether it matched (`true`) or not (`false`).
   */
  variantMatches: Partial<Record<keyof TVariants, boolean>>

  /**
   * For each state name, whether that state is active (`true`) or not (`false`).
   */
  stateMatches: Partial<Record<TStates, boolean>>

  /**
   * The user-selected variant values.
   */
  selectedVariants: TVariants

  /**
   * The set of currently active states.
   */
  activeStates: Set<TStates>
}

/**
 * A function-based logic callback for advanced conditions.
 *
 * @template TVariants - A record of variant keys/values.
 * @template TStates   - A string union of state names.
 * @template TContext  - Optional context type.
 * @param meta - An object with variantMatches, stateMatches, selectedVariants, and activeStates.
 * @param context - The optional context object passed from the consumer.
 * @returns `true` if the rule condition passes, otherwise `false`.
 */
export type ArtoLogicCallback<
  TVariants extends Record<string, VariantValue>,
  TStates extends string,
  TContext = unknown,
> = (meta: RuleEvalMeta<TVariants, TStates>, context: TContext | undefined) => boolean

/**
 * The `logic` field in a rule can be:
 * - A string operator (`'AND'`, `'OR'`, `'NOT'`, `'XOR'`, `'IMPLIES'`)
 * - An `ArtoLogicObject` describing how to evaluate variants vs. states and then combine them
 * - A callback function that receives a `RuleEvalMeta` plus `context`
 *
 * @template TVariants - A record of variant keys/values.
 * @template TStates   - A string union of state names.
 * @template TContext  - Optional context type.
 */
export type ArtoLogic<
  TVariants extends Record<string, VariantValue>,
  TStates extends string,
  TContext = unknown,
> = LogicOperator | ArtoLogicObject | ArtoLogicCallback<TVariants, TStates, TContext>

/**
 * Defines the "when" section of a rule, specifying which variants/states must be matched
 * and how to interpret them (via `logic`).
 *
 * @template TVariants - A record of variant keys/values.
 * @template TStates   - The union of state names.
 * @template TContext  - An optional context type.
 */
export interface ArtoRuleWhen<
  TVariants extends Record<string, VariantValue>,
  TStates extends string,
  TContext = unknown,
> {
  /**
   * A mapping of variant keys to arrays of acceptable values.
   * e.g. `{ color: ['red', 'blue'] }` means the user’s color must be either 'red' or 'blue'.
   */
  variants?: {
    [K in keyof TVariants]?: Array<TVariants[K]>
  }

  /**
   * An array of states that must be active.
   * e.g. `['disabled', 'hover']` means both states must be active for the match.
   */
  states?: TStates[]

  /**
   * How to evaluate the combination of variantMatches and stateMatches.
   * If not provided, defaults to `'AND'` across all booleans.
   */
  logic?: ArtoLogic<TVariants, TStates, TContext>
}

/**
 * Describes which classes to remove if a rule condition passes.
 *
 * @template TVariants - A record of variant keys/values.
 * @template TStates   - The union of state names.
 */
export interface ArtoRuleRemove<
  TVariants extends Record<string, VariantValue>,
  TStates extends string,
> {
  /**
   * Variant keys whose classes should be cleared (e.g. `['size', 'color']`).
   */
  variants?: (keyof TVariants)[]

  /**
   * State names whose classes should be cleared (e.g. `['disabled']`).
   */
  states?: TStates[]

  /**
   * By default `'all'`: removes state classes from both global and variant-level.
   * - `'global'`: only clears global state classes
   * - `'variant'`: only clears variant-level state classes
   * - `'all'`: clears both
   */
  statesScope?: 'global' | 'variant' | 'all'

  /**
   * If `true`, removes all previously registered base classes.
   * @default false
   */
  base?: boolean
}

/**
 * Describes a single rule in Arto. If `when` conditions pass, the plugin
 * removes classes (`remove`) and/or adds new classes (`add`).
 *
 * @template TVariants - A record of variant keys/values.
 * @template TStates   - The union of state names.
 * @template TContext  - An optional context type.
 */
export interface ArtoRule<
  TVariants extends Record<string, VariantValue>,
  TStates extends string,
  TContext = unknown,
> {
  /**
   * Conditions describing which variants/states must match, and how to interpret them.
   */
  when: ArtoRuleWhen<TVariants, TStates, TContext>

  /**
   * Which classes to remove if the condition passes.
   */
  remove?: ArtoRuleRemove<TVariants, TStates>

  /**
   * Class names to add if the condition passes.
   */
  add?: ClassName<TContext>
}
