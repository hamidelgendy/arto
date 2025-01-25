import type { VariantValue, ArtoConfig } from './types'
import { collectTrueKeys, safeMergeDefaults } from './utils'
import { throwError } from './errors'
import { pluginHub, Plugin } from './plugin-interface'
import { BaseClassNamePlugin } from './plugins/base-classname-plugin'
import { StatesPlugin } from './plugins/states-plugin'
import { VariantsPlugin } from './plugins/variants-plugin'
import { RulesPlugin } from './plugins/rules-plugin'
import { ClassNameBuilder } from './classname-builder'

/**
 * Creates a function that, given user options (selected variants, active states, and an optional context),
 * returns a string of classes based on the provided `ArtoConfig`.
 *
 * @template TVariants - A record of variant keys and their possible values.
 * @template TStates   - A string union of possible state names.
 * @template TContext  - Optional context object used by callbacks or plugin logic.
 *
 * @param config - The main Arto configuration object (e.g., base classes, variants, states, rules).
 * @param plugins - Optional array of additional (local) plugins, merged with global ones.
 * @returns A function that accepts user options (`variants`, `states`, `context`) and returns a final space-joined string of classes.
 *
 * @throws {ArtoError} If `config` is nullish or not an object.
 *
 * @example
 * ```ts
 * // Basic usage example
 * const myArto = arto({
 *   className: 'btn',
 *   variants: {
 *     size: {
 *       small: 'btn-sm',
 *       large: 'btn-lg'
 *     }
 *   },
 *   states: {
 *     disabled: 'disabled'
 *   }
 * })
 *
 * // Once created, call the returned function with user options:
 * const classString = myArto({
 *   variants: { size: 'small' },
 *   states: { disabled: true }
 * })
 * // => 'btn btn-sm disabled'
 * ```
 *
 * @remarks
 * The returned function merges `config.defaultVariants` with any user-supplied variants. It also
 * collects all active states from `options.states`, integrates global plus local plugins,
 * then outputs a deduplicated string of classes. If no global or local plugins are provided,
 * only the built-in logic (base, variants, states, and rules) will be used.
 */
export const arto = <
  TVariants extends Record<string, VariantValue> = Record<string, VariantValue>,
  TStates extends string = string,
  TContext = unknown,
>(
  config: Readonly<ArtoConfig<TVariants, TStates, TContext>>,
  plugins?: Plugin<TVariants, TStates, TContext>[],
) => {
  if (!config || typeof config !== 'object') {
    throwError('Invalid config provided to arto.')
  }

  /**
   * The function returned by `arto` which, given user options, generates a final class string.
   *
   * @param options - User-provided configuration, including:
   * - `variants` (maps variant keys to a chosen value),
   * - `states` (activates states where the boolean is `true`),
   * - `context` (passed to callbacks/logic in plugins or in the config).
   *
   * @returns A computed class string based on the Arto configuration and user inputs.
   *
   * @example
   * ```ts
   * const myArtoFn = arto({ ...some config... })
   *
   * // Then call it like so:
   * const result = myArtoFn({
   *   variants: { color: 'blue' },
   *   states: { disabled: true },
   *   context: { userRole: 'admin' }
   * })
   * ```
   */
  return (options?: {
    variants?: Partial<TVariants>
    states?: Partial<Record<TStates, boolean>>
    context?: TContext
  }): string => {
    const variants = options?.variants ?? {}
    const defaultVariants = config.defaultVariants ?? {}
    const states = options?.states ?? {}
    const context = options?.context

    // Merge default variants from config with user-provided variants:
    const selectedVariants = safeMergeDefaults<TVariants>(defaultVariants, variants)

    // Convert boolean states into a Set of active states:
    const activeStates = collectTrueKeys<TStates>(states)

    // Collect all plugins from:
    // 1) local (passed to arto),
    // 2) global (registered via pluginHub).
    const allPlugins = [...(plugins || []), ...pluginHub.getPlugins()]

    // Conditionally add internal Arto plugins (base, variants, states, rules)
    const internalPlugins: Plugin<TVariants, TStates, TContext>[] = []

    if (config.className) {
      internalPlugins.push(new BaseClassNamePlugin<TVariants, TStates, TContext>())
    }
    if (config.variants) {
      internalPlugins.push(new VariantsPlugin<TVariants, TStates, TContext>())
    }
    if (config.states) {
      internalPlugins.push(new StatesPlugin<TVariants, TStates, TContext>(config.states))
    }
    if (config.rules && config.rules.length > 0) {
      // Typically run last among 'core' or in 'after' if you prefer
      internalPlugins.push(new RulesPlugin<TVariants, TStates, TContext>(3))
    }

    // Merge all local/global plugins with internal ones; sorting occurs in ClassNameBuilder
    const mergedPlugins = [...allPlugins, ...internalPlugins]

    // Build final classes with the ClassNameBuilder
    const builder = new ClassNameBuilder<TVariants, TStates, TContext>(
      config,
      selectedVariants,
      activeStates,
      context,
      mergedPlugins,
    )

    const classList = builder.build()
    return classList.join(' ')
  }
}
