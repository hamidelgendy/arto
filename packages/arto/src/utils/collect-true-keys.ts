/**
 * Collects all keys from a boolean record whose values are `true`.
 *
 * This is generic and not limited to "states." Use it whenever you need
 * to gather keys mapped to `true` in a partial record.
 *
 * @example
 * ```ts
 * const result = collectTrueKeys({ disabled: true, loading: false })
 * // => Set { 'disabled' }
 * ```
 *
 * @template TKeys - A string union representing valid key names.
 * @param record - A partial record from keys to boolean values.
 * @returns A Set containing only keys where the value is `true`.
 */
export function collectTrueKeys<TKeys extends string>(
  record?: Partial<Record<TKeys, boolean>>,
): Set<TKeys> {
  if (!record) return new Set()

  return new Set(
    Object.entries(record)
      .filter(([, value]) => value === true)
      .map(([key]) => key as TKeys),
  )
}
