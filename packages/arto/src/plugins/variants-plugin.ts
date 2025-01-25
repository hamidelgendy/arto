import { Plugin, PluginStage } from '../plugin-interface'
import { throwError } from '../errors'
import { ClassNameBuilder } from '../classname-builder'
import { VariantValue, ClassName, VariantConfig, StatesOptions } from '../types'
import { normalizeClassName, isClassNameType } from '../utils'
import { checkStateDependencies, isStateConfig } from './states-plugin'

/**
 * Checks if a given configuration object qualifies as a `VariantConfig<TStates, TContext>`.
 * It looks for at least one of the properties `className` or `states`.
 *
 * @template TStates - A string union representing valid state names.
 * @template TContext - Optional context type for class generation or plugin logic.
 * @param config - The object to examine.
 * @returns `true` if it contains a `className` or `states` property, otherwise `false`.
 */
export function isVariantConfig<TStates extends string = never, TContext = unknown>(
  config: unknown,
): config is VariantConfig<TStates, TContext> {
  if (typeof config !== 'object' || config === null) {
    return false
  }

  const partial = config as Partial<VariantConfig<TStates, TContext>>
  return 'className' in partial || 'states' in partial
}

/**
 * A plugin that processes the `variants` section of an Arto configuration.
 * It applies class names for each user-selected variant value, and merges any
 * variant-level states specified within each variant.
 *
 * **How it works**:
 * 1) Reads user's chosen variants from the builder.
 * 2) For each variant key, finds the config object for the chosen value.
 * 3) Normalizes and adds classes, or processes a `VariantConfig` (with nested `states`).
 *
 * @template TVariants - A record of variant keys & possible values.
 * @template TStates   - A string union of valid state names.
 * @template TContext  - Optional context type for generation or logic.
 */
export class VariantsPlugin<
  TVariants extends Record<string, VariantValue> = Record<string, VariantValue>,
  TStates extends string = string,
  TContext = unknown,
> implements Plugin<TVariants, TStates, TContext>
{
  /**
   * Unique ID for the plugin to help with debugging or HMR consistency.
   */
  id = 'arto/Internal/ApplyVariantClassesPlugin'

  /**
   * Runs at the 'core' stage by default.
   */
  stage: PluginStage = 'core'

  /**
   * The order (priority) among 'core' plugins. Lower means earlier execution.
   * @default 0
   */
  order: number

  /**
   * Constructs a `VariantsPlugin` with an optional `order`.
   * @param order - Plugin priority in the 'core' stage (default = 0).
   */
  constructor(order = 0) {
    this.order = order
  }

  /**
   * Called automatically by the builder. Iterates through each variant key in the Arto config,
   * checks the user's chosen value for that variant, and applies the appropriate class names.
   *
   * @param builder - The `ClassNameBuilder` to which classes are added.
   */
  apply(builder: ClassNameBuilder<TVariants, TStates, TContext>): void {
    const artoConfig = builder.getArtoConfig()
    const selectedVariants = builder.getSelectedVariants()
    const context = builder.getContext()

    // If there are no variants in the config, nothing to do
    if (!artoConfig.variants) return

    // Iterate over each variant key in a typed manner
    const variantKeys = Object.keys(artoConfig.variants) as (keyof TVariants)[]
    for (const variantKey of variantKeys) {
      const userChosenValue = selectedVariants[variantKey]
      if (userChosenValue == null) continue

      const variantOptions = artoConfig.variants[variantKey]
      // If for some reason variantOptions is undefined, skip or throw
      if (!variantOptions) continue

      // Attempt to retrieve the variant config for the user-chosen value
      const variantConfig = variantOptions[userChosenValue]
      if (!variantConfig) {
        throwError(
          `Invalid value '${String(userChosenValue)}' for variant '${String(variantKey)}'.`,
        )
      }

      // Process the variantConfig (could be a direct className or a full VariantConfig)
      const variantClassList = this.processVariantConfig(
        variantKey,
        variantConfig,
        builder,
        context,
      )

      // Add the resulting classes to the builder
      builder.addVariantClasses(variantKey, variantClassList)
    }
  }

  /**
   * Determines how to handle a specific variant config:
   * 1) If it's a direct `ClassName` (string, array, or function), normalize and return it.
   * 2) If it's a `VariantConfig`, process the base `className` and then any nested states.
   * 3) Otherwise, throw an error.
   *
   * @param variantKey - The variant key (e.g., 'size', 'color').
   * @param variantConfig - The config for the chosen variant value.
   * @param builder - The `ClassNameBuilder` instance.
   * @param context - Optional context object.
   * @returns A string array of normalized classes for this variant.
   */
  private processVariantConfig(
    variantKey: keyof TVariants,
    variantConfig: ClassName<TContext> | VariantConfig<TStates, TContext>,
    builder: ClassNameBuilder<TVariants, TStates, TContext>,
    context: TContext | undefined,
  ): string[] {
    // 1) If it's just a class name (string, array, or function), normalize and return it
    if (isClassNameType<TContext>(variantConfig)) {
      return normalizeClassName(variantConfig, context)
    }

    // 2) If it's a full VariantConfig, apply className + states
    if (isVariantConfig<TStates, TContext>(variantConfig)) {
      const classes = variantConfig.className
        ? normalizeClassName(variantConfig.className, context)
        : []

      // If there's a `states` object at the variant level, merge them
      if (variantConfig.states) {
        this.mergeVariantStates(variantKey, variantConfig.states, builder, context)
      }
      return classes
    }

    // 3) Otherwise, it's invalid
    throwError('Invalid variant configuration item encountered.')
    return []
  }

  /**
   * Merges any variant-level states by iterating through each state definition.
   * If a state is valid (either a direct class name or a `StateConfig`), the resulting
   * classes are stored in the builder's `variantStateClasses`.
   *
   * @param variantKey - The key of the variant whose states we're processing.
   * @param statesObj  - The object containing state definitions for this variant.
   * @param builder    - The `ClassNameBuilder` instance to store classes.
   * @param context    - Optional context object for callbacks or state checks.
   */
  private mergeVariantStates(
    variantKey: keyof TVariants,
    statesObj: StatesOptions<TStates, TContext>,
    builder: ClassNameBuilder<TVariants, TStates, TContext>,
    context: TContext | undefined,
  ): void {
    const activeStates = builder.getActiveStates()

    for (const [stateName, stateInput] of Object.entries(statesObj)) {
      if (!stateInput) continue

      const typedStateName = stateName as TStates

      // If it's just a className, normalize and add
      if (isClassNameType<TContext>(stateInput)) {
        const classList = normalizeClassName(stateInput, context)
        builder.addVariantStateClasses(variantKey, typedStateName, classList)
      }
      // If it's a StateConfig, check dependencies and then apply its className
      else if (isStateConfig<TStates, TContext>(stateInput)) {
        // Dependencies not met, skip
        if (!checkStateDependencies(stateInput.dependsOn, activeStates, context)) continue

        // Dependencies met, normalize and apply
        const newClassList = normalizeClassName(stateInput.className, context)
        builder.replaceVariantStateClasses(variantKey, typedStateName, newClassList)
      } else {
        // The state config is neither a valid className nor a StateConfig
        throwError(`Invalid state config for state '${stateName}' ...`)
      }
    }
  }
}
