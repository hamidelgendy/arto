import { Plugin, PluginStage } from '../plugin-interface'
import { ClassNameBuilder } from '../classname-builder'
import { VariantValue } from '../types'
import { normalizeClassName } from '../utils'

/**
 * A plugin that applies the top-level `className` property from an Arto configuration
 * to the builder at the `'core'` stage, adding any specified base classes.
 *
 * @template TVariants - A record of variant keys and their possible values.
 * @template TStates   - A string union of all possible state names.
 * @template TContext  - Optional context type for class generation or plugin logic.
 */
export class BaseClassNamePlugin<
  TVariants extends Record<string, VariantValue> = Record<string, VariantValue>,
  TStates extends string = string,
  TContext = unknown,
> implements Plugin<TVariants, TStates, TContext>
{
  /**
   * A unique identifier for this plugin to help with debugging or HMR consistency.
   */
  id = 'arto/Internal/AddBaseClassesPlugin'

  /**
   * The plugin stage; defaults to `'core'`, meaning it runs alongside Arto's internal logic.
   */
  stage: PluginStage = 'core'

  /**
   * The priority order within the `'core'` stage; lower values run first.
   * @default 0
   */
  order: number

  /**
   * Constructs a new `BaseClassNamePlugin`.
   * @param order - Numeric order within the 'core' stage (default = 0).
   */
  constructor(order = 0) {
    this.order = order
  }

  /**
   * Applies the top-level `className` from the Arto configuration to the builder's base classes,
   * after normalizing it with `normalizeClassName`.
   *
   * @param builder - The `ClassNameBuilder` that accumulates class names from all plugins.
   */
  apply(builder: ClassNameBuilder<TVariants, TStates, TContext>): void {
    const artoConfig = builder.getArtoConfig()
    const context = builder.getContext()

    if (artoConfig.className) {
      // Normalize any string, array, or callback className into an array of strings
      const baseClassList = normalizeClassName(artoConfig.className, context)
      // Add them to the builder's base classes
      builder.addBaseClasses(baseClassList)
    }
  }
}
