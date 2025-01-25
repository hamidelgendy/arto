import type { ArtoConfig, VariantValue } from './types'
import type { Plugin, PluginStage } from './plugin-interface'

/**
 * A builder that organizes plugins by stage ('before', 'core', 'after'),
 * collects classes into buckets, then merges them in a final array (no dedup).
 *
 * **Build Sequence**:
 * 1) Run 'before' plugins (in ascending `order`)
 * 2) Run 'core' plugins
 * 3) Execute any post-core callbacks
 * 4) Run 'after' plugins
 * 5) Execute any final build callbacks
 * 6) Combine all class buckets into the final list
 *
 * @template TVariants - A record of variant keys & possible values.
 * @template TStates   - A union of valid state names.
 * @template TContext  - Optional context type for plugins or logic.
 */
export class ClassNameBuilder<
  TVariants extends Record<string, VariantValue> = Record<string, VariantValue>,
  TStates extends string = string,
  TContext = unknown,
> {
  /**
   * Base class names, applied before any variant or state classes.
   */
  private baseClassNames: string[] = []

  /**
   * A mapping of each variant key to an array of classes. These classes are applied
   * after `baseClassNames` and can be overridden by state-level classes or subsequent rules.
   */
  private variantClassNames: Record<keyof TVariants, string[]> = {} as Record<
    keyof TVariants,
    string[]
  >
  /**
   * A nested mapping of `[variantKey][stateName] => string[]` for variant-level states.
   * Classes here are applied after standard variant classes if the corresponding state is active.
   */
  private variantStateClassNames: Partial<
    Record<keyof TVariants, Partial<Record<TStates, string[]>>>
  > = {}

  /**
   * A mapping of global state names to an array of classes. Applied if the state is active.
   * These classes override or supplement existing classes from base or variants.
   */
  private globalStateClassNames: Record<TStates, string[]> = {} as Record<TStates, string[]>

  /**
   * A set of callbacks to run **after** 'core' plugins but **before** 'after' plugins.
   */
  private postCoreCallbacks: Array<() => void> = []

  /**
   * A new set of callbacks that run truly "post-build," i.e. after the 'after' stage.
   */
  private finalBuildCallbacks: Array<() => void> = []

  /**
   * An array of all plugins (local + global + internal), unsorted by default. Sorting
   * occurs by stage -> order when applying them sequentially in `build()`.
   */
  private readonly allPlugins: Plugin<TVariants, TStates, TContext>[]

  /**
   * Maps each plugin stage to a numeric value used for sorting:
   * - 'before' -> 0
   * - 'core'   -> 1
   * - 'after'  -> 2
   */
  private static stagePriority: Record<PluginStage, number> = {
    before: 0,
    core: 1,
    after: 2,
  }

  /**
   * @param artoConfig - The main Arto configuration object describing base classes, variants, states, and rules.
   * @param selectedVariants - The user-selected variants. Keys match `TVariants`, values are chosen at runtime.
   * @param activeStates - A set of currently active states (e.g., 'disabled').
   * @param context - An optional context object (e.g., user data, environment).
   * @param plugins - A list of plugins that modify or extend class building logic.
   */
  constructor(
    private artoConfig: Readonly<ArtoConfig<TVariants, TStates, TContext>>,
    private selectedVariants: TVariants,
    private activeStates: Set<TStates>,
    private context?: TContext,
    plugins?: Plugin<TVariants, TStates, TContext>[],
  ) {
    const rawPlugins = plugins ?? []

    // Ensure each plugin has a default stage ('core') and an integer `order`.
    for (const p of rawPlugins) {
      if (!p.stage) {
        p.stage = 'core'
      }
      if (typeof p.order !== 'number') {
        p.order = 0
      }
    }

    // Sort plugins by stage priority and then by order.
    rawPlugins.sort((a, b) => {
      const stageDiff =
        ClassNameBuilder.stagePriority[a.stage!] - ClassNameBuilder.stagePriority[b.stage!]
      if (stageDiff !== 0) return stageDiff
      return (a.order ?? 0) - (b.order ?? 0)
    })

    this.allPlugins = rawPlugins
  }

  /**
   * Builds and returns the final array of class names by:
   * 1) Running 'before' plugins.
   * 2) Running 'core' plugins.
   * 3) Executing any `postCoreCallbacks`.
   * 4) Running 'after' plugins.
   * 5) Executing any `finalBuildCallbacks`
   * 6) Combining and returning all class buckets.
   *
   * @returns The combined list of classes (no deduplication), typically joined by spaces.
   *
   * @example
   * ```ts
   * const builder = new ClassNameBuilder(config, { size: 'small' }, new Set(['disabled']), ...)
   * const classArray = builder.build()
   * // => ['base-class', 'small-class', 'disabled-class']
   * ```
   */
  build(): string[] {
    // Run plugins with stage 'before'
    for (const plugin of this.allPlugins) {
      if (plugin.stage === 'before') void plugin.apply(this)
    }

    // Run plugins with stage 'core'
    for (const plugin of this.allPlugins) {
      if (plugin.stage === 'core') void plugin.apply(this)
    }

    // Execute post-core callbacks
    for (const cb of this.postCoreCallbacks) {
      cb()
    }

    // Run plugins with stage 'after'
    for (const plugin of this.allPlugins) {
      if (plugin.stage === 'after') void plugin.apply(this)
    }

    // Execute final build callbacks
    for (const cb of this.finalBuildCallbacks) {
      cb()
    }

    // Collect all classes in a final list
    const finalList: string[] = []

    // Base
    finalList.push(...this.baseClassNames)

    // Variant
    for (const variantKey in this.variantClassNames) {
      finalList.push(...this.variantClassNames[variantKey as keyof TVariants])
    }

    // Variant-level states (only those states that are active)
    for (const vKey in this.variantStateClassNames) {
      const stateMap = this.variantStateClassNames[vKey as keyof TVariants]
      if (!stateMap) continue
      for (const st of this.activeStates) {
        const classes = stateMap[st]
        if (classes) {
          finalList.push(...classes)
        }
      }
    }

    // Global states
    for (const st in this.globalStateClassNames) {
      finalList.push(...this.globalStateClassNames[st as TStates])
    }

    return finalList
  }

  // -------------------------------------------------------------------------
  // Callbacks
  // -------------------------------------------------------------------------

  /**
   * Adds a callback to run immediately after 'core' plugins but before 'after' plugins.
   *
   * @param callback - A function to run after the core logic has completed.
   *
   * @example
   * ```ts
   * builder.addPostCoreCallback(() => {
   *   console.log('Classes have been generated!')
   * })
   * ```
   */
  addPostCoreCallback(callback: () => void): void {
    this.postCoreCallbacks.push(callback)
  }

  /**
   * Adds a callback to run after all plugins have completed, including 'after' stage.
   *
   * @param callback - A function to run after all plugins have completed.
   *
   * @example
   * ```ts
   * builder.addFinalBuildCallback(() => {
   *   console.log('All classes have been generated!')
   * })
   * ```
   */
  addFinalBuildCallback(callback: () => void): void {
    this.finalBuildCallbacks.push(callback)
  }

  // -------------------------------------------------------------------------
  // Base Classes
  // -------------------------------------------------------------------------

  /**
   * Appends an array of classes to the base bucket.
   *
   * @param classNames - An array of class names (e.g. `['btn', 'btn-primary']`).
   */
  addBaseClasses(classNames: string[]): void {
    this.baseClassNames.push(...classNames)
  }

  /**
   * Clears all previously added base classes.
   */
  clearBaseClasses(): void {
    this.baseClassNames = []
  }

  /**
   * Retrieves a copy of the current base classes for inspection or debugging.
   *
   * @returns A new array containing all base class names.
   */
  getBaseClasses(): string[] {
    return [...this.baseClassNames]
  }

  // -------------------------------------------------------------------------
  // Variant Classes
  // -------------------------------------------------------------------------

  /**
   * Appends classes for a specific variant key.
   *
   * @param variantKey - The name of the variant (e.g. `'size'`).
   * @param classNames - The classes to add (e.g. `['text-sm', 'py-1']`).
   */
  addVariantClasses(variantKey: keyof TVariants, classNames: string[]): void {
    if (!this.variantClassNames[variantKey]) {
      this.variantClassNames[variantKey] = []
    }
    this.variantClassNames[variantKey].push(...classNames)
  }

  /**
   * Replaces all classes for the given variant with a new array of classes.
   *
   * @param variantKey - The variant name to replace.
   * @param classNames - The new classes.
   */
  replaceVariantClasses(variantKey: keyof TVariants, classNames: string[]): void {
    this.variantClassNames[variantKey] = [...classNames]
  }

  /**
   * Clears any existing classes assigned to a given variant.
   *
   * @param variantKey - The variant name.
   */
  clearVariantClasses(variantKey: keyof TVariants): void {
    this.variantClassNames[variantKey] = []
  }

  /**
   * Retrieves a read-only copy of the full map of variant classes.
   *
   * @returns An object with each variant key mapped to an array of class names.
   */
  getVariantClassMap(): Readonly<Record<keyof TVariants, string[]>> {
    const clone: Partial<Record<keyof TVariants, string[]>> = {}
    for (const key in this.variantClassNames) {
      clone[key] = [...(this.variantClassNames[key] ?? [])]
    }
    return clone as Readonly<Record<keyof TVariants, string[]>>
  }

  // -------------------------------------------------------------------------
  // Global State Classes
  // -------------------------------------------------------------------------

  /**
   * Adds classes to the global state bucket. If `state` is active, these classes
   * will be appended to the final output (after variant classes).
   *
   * @param state - The state name (e.g. `'disabled'`).
   * @param classNames - The classes to add (e.g. `['opacity-50', 'pointer-events-none']`).
   */
  addGlobalStateClasses(state: TStates, classNames: string[]): void {
    if (!this.globalStateClassNames[state]) {
      this.globalStateClassNames[state] = []
    }
    this.globalStateClassNames[state].push(...classNames)
  }

  /**
   * Replaces existing global state classes for the given `state` with a new array.
   *
   * @param state - The state name.
   * @param classNames - The new array of classes.
   */
  replaceGlobalStateClasses(state: TStates, classNames: string[]): void {
    this.globalStateClassNames[state] = [...classNames]
  }

  /**
   * Clears any global state classes registered under the specified `state`.
   *
   * @param state - The state name to clear (e.g., 'hover').
   */
  clearGlobalStateClasses(state: TStates): void {
    this.globalStateClassNames[state] = []
  }

  /**
   * Returns a copy of the classes for a specific global state, for inspection or debugging.
   *
   * @param state - The state name.
   * @returns An array of class names, which may be empty if none are set.
   */
  getGlobalStateClassesFor(state: TStates): string[] {
    return [...(this.globalStateClassNames[state] ?? [])]
  }

  // -------------------------------------------------------------------------
  // Variant-Level State Classes
  // -------------------------------------------------------------------------

  /**
   * Appends classes for a combination of variant key + state name.
   * These will only be applied if the corresponding variant value is selected and the state is active.
   *
   * @param variantKey - The variant key (e.g. 'size').
   * @param state - The state name (e.g. 'disabled').
   * @param classNames - An array of classes to add.
   */
  addVariantStateClasses(variantKey: keyof TVariants, state: TStates, classNames: string[]): void {
    if (!this.variantStateClassNames[variantKey]) {
      this.variantStateClassNames[variantKey] = {} as Record<TStates, string[]>
    }
    if (!this.variantStateClassNames[variantKey][state]) {
      this.variantStateClassNames[variantKey][state] = []
    }
    this.variantStateClassNames[variantKey][state].push(...classNames)
  }

  /**
   * Replaces all classes for a specific `(variantKey, state)` pair.
   *
   * @param variantKey - The variant key.
   * @param state - The state name.
   * @param classNames - The new array of classes.
   */
  replaceVariantStateClasses(
    variantKey: keyof TVariants,
    state: TStates,
    classNames: string[],
  ): void {
    if (!this.variantStateClassNames[variantKey]) {
      this.variantStateClassNames[variantKey] = {} as Record<TStates, string[]>
    }
    this.variantStateClassNames[variantKey][state] = [...classNames]
  }

  /**
   * Clears all classes for a specific `(variantKey, state)` pair.
   *
   * @param variantKey - The variant key to clear.
   * @param state - The state name to clear.
   */
  clearVariantStateClasses(variantKey: keyof TVariants, state: TStates): void {
    if (this.variantStateClassNames[variantKey]) {
      this.variantStateClassNames[variantKey][state] = []
    }
  }

  /**
   * Retrieves classes for a given `(variantKey, state)` combination.
   *
   * @param variantKey - The variant key (e.g. 'color').
   * @param state - The state name (e.g. 'hover').
   * @returns An array of classes if they exist; otherwise an empty array.
   */
  getVariantStateClasses(variantKey: keyof TVariants, state: TStates): string[] {
    return this.variantStateClassNames[variantKey]?.[state]
      ? [...this.variantStateClassNames[variantKey][state]]
      : []
  }

  // -------------------------------------------------------------------------
  // Additional Getters & Setters
  // -------------------------------------------------------------------------

  /**
   * Returns the original Arto configuration provided to this builder.
   *
   * @returns A readonly version of `ArtoConfig`.
   */
  getArtoConfig(): Readonly<ArtoConfig<TVariants, TStates, TContext>> {
    return this.artoConfig
  }

  /**
   * Retrieves the user-selected variants (merged with any default variants).
   *
   * @returns An object mapping each variant key to the selected value.
   */
  getSelectedVariants(): TVariants {
    return this.selectedVariants
  }

  /**
   * Replaces the current selection of variants with a new mapping.
   *
   * @param variants - The new variant key/value mapping.
   */
  setSelectedVariants(variants: TVariants): void {
    this.selectedVariants = variants
  }

  /**
   * Retrieves the set of currently active states.
   *
   * @returns A `Set` of active state names.
   */
  getActiveStates(): Set<TStates> {
    return this.activeStates
  }

  /**
   * Replaces the set of active states.
   *
   * @param states - The new set of states (e.g. `new Set(['disabled', 'hover'])`).
   */
  setActiveStates(states: Set<TStates>): void {
    this.activeStates = states
  }

  /**
   * Returns the optional context object, if any, used by plugins or class generation callbacks.
   */
  getContext(): TContext | undefined {
    return this.context
  }

  /**
   * Retrieves all classes from base, variants, global states, and variant-level states.
   *
   * @returns An array containing all classes.
   */
  getAllClasses(): string[] {
    const allClasses: string[] = []

    // Base classes
    allClasses.push(...this.baseClassNames)

    // Variant classes
    for (const variantKey in this.variantClassNames) {
      allClasses.push(...this.variantClassNames[variantKey as keyof TVariants])
    }

    // Global states
    for (const st of this.activeStates) {
      allClasses.push(...this.getGlobalStateClassesFor(st))
    }

    // Variant-level states
    for (const variantKey of Object.keys(this.selectedVariants)) {
      for (const st of this.activeStates) {
        const stateClasses = this.getVariantStateClasses(variantKey as keyof TVariants, st)
        allClasses.push(...stateClasses)
      }
    }

    return allClasses
  }
}
