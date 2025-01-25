import { Plugin, PluginStage } from '../plugin-interface'
import { ClassNameBuilder } from '../classname-builder'
import { isClassNameType, normalizeClassName } from '../utils'
import { throwError } from '../errors'
import { VariantValue, ClassName, StatesOptions, StateConfig, StateDependency } from '../types'

/**
 * Checks whether a given configuration object is a `StateConfig<TStates, TContext>`.
 * It looks for the presence of the `className` property as a basic requirement.
 *
 * @template TStates   - A string union representing valid state names.
 * @template TContext  - An optional context type for class generation or plugin logic.
 * @param config       - The object to check.
 * @returns `true` if the object appears to be a valid `StateConfig`, otherwise `false`.
 */
export const isStateConfig = <TStates extends string, TContext = unknown>(
  config: unknown,
): config is StateConfig<TStates, TContext> => {
  return typeof config === 'object' && config !== null && 'className' in config
}

/**
 * Safely extracts a `ClassName` from a provided state configuration (which might
 * be a simple class name input or a more complex `StateConfig`), throwing an error
 * if the config is invalid.
 *
 * @template TStates  - A string union of all possible state names.
 * @template TContext - An optional context type for class generation or plugin logic.
 * @param config      - The object or function representing either a direct `ClassName` or a `StateConfig`.
 * @returns A valid `ClassName<TContext>` if valid.
 * @throws Will throw if `config` is neither a valid `ClassName` nor a `StateConfig`.
 */
export const extractStateClassName = <TStates extends string, TContext = unknown>(
  config: ClassName<TContext> | StateConfig<TStates, TContext>,
): ClassName<TContext> => {
  if (isStateConfig<TStates, TContext>(config)) {
    return config.className
  } else if (isClassNameType<TContext>(config)) {
    return config
  }
  return throwError('Invalid configuration for className. Expected ClassName or StateConfig.')
}

/**
 * Determines whether a state is valid (i.e., should apply) by checking its dependencies.
 * These dependencies can be:
 *
 * 1. A function receiving the set of active states plus an optional context, returning a boolean.
 * 2. An array of states that must all be active, possibly including `not:` arrays.
 *
 * If the dependencies are not fulfilled, the state is effectively ignored.
 *
 * @template TStates  - A string union of all possible state names.
 * @template TContext - Optional context type.
 * @param dependsOn    - The state dependency (function or array).
 * @param activeStates - The set of currently active states.
 * @param context      - Optional context for dependency functions.
 * @returns `true` if dependencies are satisfied or if no dependencies are defined, otherwise `false`.
 */
export const checkStateDependencies = <TStates extends string, TContext = unknown>(
  dependsOn: StateDependency<TStates, TContext> | undefined,
  activeStates: Set<TStates>,
  context?: TContext,
): boolean => {
  if (!dependsOn) return true

  // If it's a function, run it
  if (typeof dependsOn === 'function') {
    return dependsOn(activeStates, context)
  }

  // Otherwise, it's an array of required states or "not" states
  return dependsOn.every((dependency) => {
    if (typeof dependency === 'string') {
      return activeStates.has(dependency)
    }

    // e.g. { not: ["focused"] }
    return !dependency.not?.some((st) => activeStates.has(st))
  })
}

/**
 * A plugin that applies top-level (global) classes for each active state in the Arto config.
 *
 * For each active state:
 * - Checks if there's a `StateConfig` or direct class name in `states`.
 * - Verifies dependencies (if any).
 * - Merges the resulting classes into the builder.
 *
 * @template TVariants - A record of variant keys & possible values.
 * @template TStates   - A string union of all possible state names.
 * @template TContext  - Optional context type for plugin or class generation logic.
 */
export class StatesPlugin<
  TVariants extends Record<string, VariantValue> = Record<string, VariantValue>,
  TStates extends string = string,
  TContext = unknown,
> implements Plugin<TVariants, TStates, TContext>
{
  id = 'arto/Internal/ApplyStateClassesPlugin'
  stage: PluginStage = 'core'
  order: number

  /**
   * A map of state keys to either simple class names or detailed `StateConfig`.
   * For each active state, this plugin checks the config, verifies dependencies,
   * and merges the resulting class names into the builder.
   */
  private readonly stateConfigs: StatesOptions<TStates, TContext>

  /**
   * Constructs a new `StatesPlugin` that applies classes for top-level (global) states.
   *
   * @param stateConfigs - A mapping of state names to either class names or `StateConfig`.
   * @param order        - Plugin execution priority within the 'core' stage (default = 0).
   */
  constructor(stateConfigs: StatesOptions<TStates, TContext>, order = 0) {
    this.stateConfigs = stateConfigs
    this.order = order
  }

  /**
   * Called automatically by Arto during the plugin lifecycle. Checks each active state:
   * 1. If a `StateConfig` is found, verify `dependsOn`.
   * 2. Normalize the class names via `normalizeClassName`.
   * 3. Add those class names to the builder's global state classes.
   *
   * @param builder - The `ClassNameBuilder` handling class name aggregation.
   */
  apply(builder: ClassNameBuilder<TVariants, TStates, TContext>): void {
    const activeStates = builder.getActiveStates()
    const context = builder.getContext()

    for (const state of activeStates) {
      const stateConfig = this.stateConfigs[state]
      if (!stateConfig) continue

      // If this is a StateConfig, check dependencies
      if (
        isStateConfig<TStates, TContext>(stateConfig) &&
        !checkStateDependencies(stateConfig.dependsOn, activeStates, context)
      ) {
        // Dependencies not met, skip
        continue
      }

      // Normalize the class name(s) and add them to the global state bucket
      const newClassNames = normalizeClassName(extractStateClassName(stateConfig), context)
      builder.addGlobalStateClasses(state, newClassNames)
    }
  }
}
