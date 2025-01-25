/**
 * Merges `defaults` and `userVariants`, ignoring `null` or `undefined`.
 * If `userVariants[key]` is `null` or `undefined`, the default is kept.
 * This is a shallow merge only; nested objects won't be merged deeply.
 *
 * @template TVariants
 * @param defaults - A partial object of default variant values.
 * @param userVariants - A partial override object (optional).
 * @returns A new object combining defaults and user overrides.
 */
export const safeMergeDefaults = <TVariants>(
  defaults: Partial<TVariants>,
  userVariants: Partial<TVariants> = {},
): TVariants => {
  const final = { ...defaults } as TVariants
  for (const key in userVariants) {
    if (userVariants[key] != null) {
      final[key] = userVariants[key]
    }
  }
  return final
}
