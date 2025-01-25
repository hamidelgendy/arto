import { ClassNameBuilder } from './classname-builder'
import type { VariantValue } from './types'
import { throwError } from './errors.ts'

/**
 * Defines the available stages for plugin execution:
 * - **'before'**: Plugin runs before all internal (core) plugins
 * - **'core'**: Plugin runs alongside internal (core) plugins
 * - **'after'**: Plugin runs after all internal (core) plugins
 */
export type PluginStage = 'before' | 'core' | 'after'

/**
 * Describes an Arto plugin. Plugins can specify:
 *
 * - **id** (string): A unique identifier.
 * - **stage** (PluginStage): Execution phase, defaults to 'core' if omitted.
 * - **order** (number): Priority among plugins in the same stage (lower runs first).
 * - **apply** (function): Called with a `ClassNameBuilder` to modify classes or perform logic.
 *
 * @template TVariants - A record of variant keys and their possible values.
 * @template TStates   - A string union for valid states.
 * @template TContext  - An optional context for plugin logic.
 */
export interface Plugin<
  TVariants extends Record<string, VariantValue> = Record<string, VariantValue>,
  TStates extends string = string,
  TContext = unknown,
> {
  /**
   * A unique identifier for the plugin. Ensures consistency and helps avoid duplicates.
   */
  readonly id: string

  /**
   * The stage in which this plugin should run. Defaults to `'core'`.
   */
  stage?: PluginStage

  /**
   * Order (priority) for this plugin within its stage. Lower numbers are applied first.
   * @default 0
   */
  order?: number

  /**
   * A function that receives a `ClassNameBuilder` to modify class buckets or perform other logic.
   */
  apply(builder: ClassNameBuilder<TVariants, TStates, TContext>): void | Promise<void>
}

/**
 * A registry class for managing plugins:
 *
 * - **register**: Registers a plugin (replacing any with the same `id`).
 * - **registerBatch**: Registers multiple plugins at once.
 * - **unregister**: Removes a plugin by its ID.
 * - **getPlugins**: Retrieves all plugins (unordered).
 * - **getByStage**: Retrieves plugins by a specific stage.
 * - **clear**: Removes all plugins.
 *
 * Final sorting (stage + order) is applied at build time by `ClassNameBuilder`.
 */
export class PluginRegistry<
  TVariants extends Record<string, VariantValue> = Record<string, VariantValue>,
  TStates extends string = string,
  TContext = unknown,
> {
  /**
   * Internal list of registered plugins. This array is not sorted by default.
   * Sorting occurs later in the build process.
   */
  private plugins: Plugin<TVariants, TStates, TContext>[] = []

  /**
   * Registers a single plugin in the registry, replacing any existing plugin with the same ID.
   * @param plugin - The plugin to register.
   * @example
   * ```ts
   * globalPlugins.register({
   *   id: 'my-plugin',
   *   stage: 'before',
   *   order: 10,
   *   apply(builder) {
   *     builder.addBaseClasses(['my-base-class'])
   *   }
   * })
   * ```
   */
  register(plugin: Plugin<TVariants, TStates, TContext>): void {
    // Basic validation to catch empty IDs (helpful in open-source usage)
    if (!plugin.id && process.env.NODE_ENV !== 'production') {
      throwError('Plugin must have a non-empty id.')
    }

    // If a plugin with the same ID exists, remove it
    const existingIndex = this.plugins.findIndex((p) => p.id === plugin.id)
    if (existingIndex !== -1) {
      console.debug(`Plugin with id '${plugin.id}' is being replaced.`)
      this.unregister(plugin.id)
    }

    this.plugins.push(plugin)
  }

  /**
   * Unregisters a plugin by its unique ID.
   * @param id - The plugin ID to remove.
   */
  unregister(id: string): void {
    const index = this.plugins.findIndex((p) => p.id === id)
    if (index !== -1) {
      this.plugins.splice(index, 1)
    }
  }

  /**
   * Registers multiple plugins at once, applying the same logic as `register` for each.
   * @param plugins - Array of plugin objects to register.
   * @example
   * ```ts
   * globalPlugins.registerBatch([
   *   {
   *     id: 'plugin-a',
   *     stage: 'before',
   *     apply(builder) {
   *       builder.addBaseClasses(['plugin-a-class'])
   *     }
   *   },
   *   {
   *     id: 'plugin-b',
   *     stage: 'after',
   *     order: -1,
   *     apply(builder) {
   *       builder.addBaseClasses(['plugin-b-class'])
   *     }
   *   }
   * ])
   * ```
   */
  registerBatch(plugins: Plugin<TVariants, TStates, TContext>[]): void {
    for (const plugin of plugins) {
      this.register(plugin)
    }
  }

  /**
   * Retrieves all registered plugins, in the order they were inserted.
   * Final sorting is handled at build time by `ClassNameBuilder`.
   * @returns An array of plugins.
   */
  getPlugins(): Plugin<TVariants, TStates, TContext>[] {
    return [...this.plugins]
  }

  /**
   * Returns all plugins that match a specific stage ('before', 'core', or 'after'),
   * without sorting by `order`.
   * @param stage - The stage to filter plugins by.
   * @returns A filtered list of plugins for the given stage.
   */
  getByStage(stage: PluginStage): Plugin<TVariants, TStates, TContext>[] {
    return this.plugins.filter((plugin) => plugin.stage === stage)
  }

  /**
   * Removes all plugins from the registry.
   * @example
   * ```ts
   * globalPlugins.clear()
   * // now the registry is empty
   * ```
   */
  clear(): void {
    this.plugins = []
  }
}

/**
 * A globally accessible instance of `PluginRegistry` using loose type parameters,
 * so that any shape of plugin can be registered. Sorting by stage/order is deferred
 * until the actual build process in Arto.
 *
 * @example
 * ```ts
 * import { pluginHub } from 'arto'
 *
 * pluginHub.register({
 *   id: 'global-plugin',
 *   stage: 'before',
 *   apply(builder) {
 *     builder.addBaseClasses(['global-plugin-base'])
 *   }
 * })
 * ```
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const pluginHub = new PluginRegistry<any, any, any>()
