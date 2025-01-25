import type { ClassName } from './class-name'

/**
 * Describes dependencies that a state may require. The `dependsOn` field can be either:
 * - An **array** of required or negated states (e.g. `['hover']` or `{ not: ['active'] }`),
 * - A **function** receiving the set of active states plus an optional context, returning `true` if valid.
 *
 * Examples:
 * - `"hover"` must be active,
 * - `"active"` must *not* be active,
 * - or more complex logic in a callback.
 *
 * @example
 * ```ts
 * // Array example (must have 'hover' active, must NOT have 'disabled' active)
 * dependsOn: ['hover', { not: ['disabled'] }]
 *
 * // Function example
 * dependsOn: (activeStates, context) => activeStates.has('selected') && !!context
 * ```
 */
export type StateDependency<TStates extends string, TContext = unknown> =
  | Array<TStates | { not: TStates[] }>
  | ((activeStates: Set<TStates>, context?: TContext) => boolean)

/**
 * Configuration details for a single state, including:
 *
 * - `className`: The classes to apply when the state is active.
 * - `dependsOn`: An optional dependency condition to check (e.g., other states must/must not be active).
 *
 * @template TStates   - A string union of all possible state names.
 * @template TContext  - Optional context passed to class name callbacks or logic checks.
 */
export interface StateConfig<TStates extends string, TContext = unknown> {
  /**
   * One or more class names (string, array, or function) to apply while this state is active.
   */
  className: ClassName<TContext>

  /**
   * Defines under what conditions this state is considered valid (e.g., must have 'hover').
   * If not met, classes for this state are skipped.
   */
  dependsOn?: StateDependency<TStates, TContext>
}

/**
 * A mapping of state keys to either:
 * - A simple `ClassName<TContext>` (string, array, or callback),
 * - Or a full `StateConfig` object for more advanced behavior (e.g., `dependsOn`).
 *
 * @example
 * ```ts
 * const myStates: StatesOptions<MyVariants, 'disabled' | 'hover'> = {
 *   disabled: 'opacity-50',
 *   hover: {
 *     className: 'bg-blue-100',
 *     dependsOn: ['hover', { not: ['disabled'] }] // Only applies if 'hover' is active, 'disabled' is not.
 *   }
 * }
 * ```
 *
 * @template TStates   - A string union of all possible state names.
 * @template TContext  - Optional context type for class generation callbacks or advanced logic.
 */
export type StatesOptions<TStates extends string, TContext = unknown> = {
  [K in TStates]?: ClassName<TContext> | StateConfig<TStates, TContext>
}
