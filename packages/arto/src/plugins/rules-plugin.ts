import type { Plugin, PluginStage } from '../plugin-interface'
import type { ClassNameBuilder } from '../classname-builder'
import { normalizeClassName } from '../utils'
import type { LogicOperator, ArtoLogicObject, ArtoRuleWhen, ArtoRuleRemove } from '../types/rules'
import type { VariantValue } from '../types'

/**
 * Evaluates an array of boolean conditions with a single logical operator.
 * Supported operators:
 * - **'AND'**: All conditions must be `true`.
 * - **'OR'**: At least one condition is `true`.
 * - **'NOT'**: All conditions must be `false`.
 * - **'XOR'**: Exactly one condition is `true`.
 * - **'IMPLIES'**: For two conditions, `!A || B`. If more than two are present, only the first two are considered.
 *
 * @param conditions - The array of boolean values to evaluate.
 * @param op - The logical operator to apply; defaults to `'AND'` if none is provided.
 * @returns `true` if conditions pass under the specified operator, otherwise `false`.
 *
 * @example
 * ```ts
 * evaluateSimpleLogic([true, false], 'AND') // => false
 * evaluateSimpleLogic([true, false], 'OR')  // => true
 * ```
 */
export function evaluateSimpleLogic(conditions: boolean[], op: LogicOperator | undefined): boolean {
  const logic = op ?? 'AND'
  switch (logic) {
    case 'AND':
      return conditions.every(Boolean)
    case 'OR':
      return conditions.some(Boolean)
    case 'NOT':
      // For multiple conditions, they all must be false to return true
      return conditions.every((c) => !c)
    case 'XOR':
      return conditions.filter(Boolean).length === 1
    case 'IMPLIES':
      // Only the first two conditions are considered in 'IMPLIES'
      if (conditions.length < 2) return true
      return !conditions[0] || conditions[1]
    default:
      // Default to 'AND'
      return conditions.every(Boolean)
  }
}

/**
 * Separately evaluates arrays of boolean values for variants and states, then
 * combines them using a final operator (`combine`).
 *
 * @param variantBooleans - Boolean results for each variant match.
 * @param stateBooleans - Boolean results for each state match.
 * @param logicObj - Defines how to evaluate 'variants', 'states', and how to 'combine' them.
 * @returns `true` if both variant and state logic pass under the specified combination operator, otherwise `false`.
 *
 * @example
 * ```ts
 * evaluateObjectLogic([true, true], [false, true], {
 *   variants: 'AND', // must all be true
 *   states: 'OR',    // at least one true
 *   combine: 'AND'   // both results must be true
 * })
 * // => true && true => true
 * ```
 */
export function evaluateObjectLogic(
  variantBooleans: boolean[],
  stateBooleans: boolean[],
  logicObj: ArtoLogicObject,
): boolean {
  const { variants = 'AND', states = 'AND', combine = 'AND' } = logicObj

  // Evaluate the result of variant booleans
  const variantsPassed =
    variants === 'AND' ? variantBooleans.every(Boolean) : variantBooleans.some(Boolean)

  // Evaluate the result of state booleans
  const statesPassed = states === 'AND' ? stateBooleans.every(Boolean) : stateBooleans.some(Boolean)

  // Combine the two results
  return combine === 'AND' ? variantsPassed && statesPassed : variantsPassed || statesPassed
}

/**
 * A plugin that handles advanced conditional logic (rules) in `artoConfig.rules`.
 * Each rule can remove or add classes when specific variant/state conditions pass.
 *
 * **Key Steps**:
 * 1) For each rule, check if the `when` conditions pass (using variants/states/logic).
 * 2) If so, remove specified classes (variants/states/base) and add new classes if needed.
 *
 * @template TVariants - A record of variant keys & possible values.
 * @template TStates   - A string union of valid state names.
 * @template TContext  - Optional context type for rule callbacks.
 */
export class RulesPlugin<
  TVariants extends Record<string, VariantValue>,
  TStates extends string,
  TContext = unknown,
> implements Plugin<TVariants, TStates, TContext>
{
  /**
   * A unique ID for this plugin. Used for debugging or HMR consistency.
   */
  id = 'arto/Internal/RulesPlugin'

  /**
   * Runs at the 'core' stage by default. Typically assigned a higher `order`
   * so that state and variant classes are already applied before rules run.
   */
  stage: PluginStage = 'core'

  /**
   * Plugin priority within the 'core' stage (default = 0).
   * Often set to a higher value (e.g., 3) in `arto.ts`.
   */
  order: number

  /**
   * @param order - Numeric priority in the 'core' stage.
   */
  constructor(order = 0) {
    this.order = order
  }

  /**
   * Main entry point called by the builder. Iterates over each rule in `artoConfig.rules`,
   * checks whether the rule conditions pass, and if so:
   *  1) Removes classes (per `rule.remove`).
   *  2) Adds classes (per `rule.add`).
   *
   * @param builder - The builder that manages class buckets for variants, states, etc.
   */
  apply(builder: ClassNameBuilder<TVariants, TStates, TContext>): void {
    const artoConfig = builder.getArtoConfig()
    if (!artoConfig.rules) return

    const activeStates = builder.getActiveStates()
    const selectedVariants = builder.getSelectedVariants()
    const context = builder.getContext()

    for (const rule of artoConfig.rules) {
      const { when, remove, add } = rule

      // Check if the rule conditions pass
      if (this.doesRuleApply(when, selectedVariants, activeStates, context)) {
        // 1) Remove specified classes
        if (remove) {
          this.removeStuff(builder, remove)
        }
        // 2) Add specified classes
        if (add) {
          const newClassNames = normalizeClassName(add, context)
          builder.addBaseClasses(newClassNames)
        }
      }
    }
  }

  /**
   * Evaluates whether a rule's `when` conditions are met using variants, states,
   * and optional logic operations.
   *
   * @param when - Specifies which variants and states must match, plus an optional logic definition.
   * @param selectedVariants - The user's chosen variant values.
   * @param activeStates - The set of active states.
   * @param context - Optional context for custom logic callbacks.
   * @returns `true` if the rule should apply, otherwise `false`.
   */
  private doesRuleApply(
    when: ArtoRuleWhen<TVariants, TStates, TContext>,
    selectedVariants: TVariants,
    activeStates: Set<TStates>,
    context: TContext | undefined,
  ): boolean {
    // 1) Build an object of variant matches
    const variantMatches: Partial<Record<keyof TVariants, boolean>> = {}
    if (when.variants) {
      const variantKeys = Object.keys(when.variants) as (keyof TVariants)[]
      for (const vKey of variantKeys) {
        const acceptedValues = when.variants[vKey]
        if (!acceptedValues) continue

        const userValue = selectedVariants[vKey]
        variantMatches[vKey] = userValue != null && acceptedValues.includes(userValue)
      }
    }

    // 2) Build an object of state matches
    const stateMatches: Partial<Record<TStates, boolean>> = {}
    if (when.states) {
      for (const st of when.states) {
        stateMatches[st] = activeStates.has(st)
      }
    }

    // 3) Evaluate the logic
    const allBools = [...Object.values(variantMatches), ...Object.values(stateMatches)]

    // No logic => default to 'AND'
    if (!when.logic) {
      return evaluateSimpleLogic(allBools as boolean[], 'AND')
    }

    // Simple operator
    if (typeof when.logic === 'string') {
      return evaluateSimpleLogic(allBools as boolean[], when.logic)
    }

    // Logic object => separate variant & state booleans, then combine
    if (typeof when.logic === 'object') {
      const variantBools = Object.values(variantMatches)
      const stateBools = Object.values(stateMatches)
      return evaluateObjectLogic(variantBools as boolean[], stateBools as boolean[], when.logic)
    }

    // If logic is a function => pass a meta object + context
    const meta = {
      variantMatches,
      stateMatches,
      selectedVariants,
      activeStates,
    }
    return when.logic(meta, context)
  }

  /**
   * Removes classes from the builder according to the `ArtoRuleRemove` settings:
   *  - Clears variant classes for specified variant keys.
   *  - Clears state classes for specified states, possibly with a `statesScope`.
   *  - Clears all base classes if `remove.base` is true.
   *
   * @param builder - The ClassNameBuilder managing class buckets.
   * @param remove - The removal instructions (variant keys, states, base).
   */
  private removeStuff(
    builder: ClassNameBuilder<TVariants, TStates, TContext>,
    remove: ArtoRuleRemove<TVariants, TStates>,
  ): void {
    // Remove classes for specific variants
    if (remove.variants) {
      for (const vKey of remove.variants) {
        builder.clearVariantClasses(vKey)
      }
    }

    // Remove classes for specified states
    if (remove.states) {
      const scope = remove.statesScope ?? 'all'
      for (const st of remove.states) {
        if (scope === 'all' || scope === 'global') {
          builder.clearGlobalStateClasses(st)
        }
        if (scope === 'all' || scope === 'variant') {
          for (const [variantKey] of Object.entries(builder.getSelectedVariants())) {
            builder.clearVariantStateClasses(variantKey as keyof TVariants, st)
          }
        }
      }
    }

    // Optionally remove all base classes
    if (remove.base) {
      builder.clearBaseClasses()
    }
  }
}
