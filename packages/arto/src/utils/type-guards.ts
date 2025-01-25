import type { ClassName } from '../types'

/**
 * Shallow type guard checking if `config` is a valid top-level `ClassName<TContext>` form:
 * - A **string**
 * - An **array** (which may contain nested items)
 * - A **function** returning class names
 *
 * Deeper validation of array contents occurs in `normalizeClassName`.
 *
 * @template TContext - The context type for callback-based class names.
 * @param config - The candidate to test.
 * @returns True if `config` is a top-level `ClassName<TContext>`, otherwise false.
 */
export const isClassNameType = <TContext = unknown>(
  config: unknown,
): config is ClassName<TContext> =>
  typeof config === 'string' || Array.isArray(config) || typeof config === 'function'
