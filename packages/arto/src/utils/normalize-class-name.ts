import type { ClassName, ClassNameCallback } from '../types'
import { throwError } from '../errors'

/**
 * Normalizes a `ClassName<TContext>` into a flattened, deduplicated array of strings.
 * - Flattens nested arrays.
 * - Invokes callbacks with optional context.
 * - Skips duplicates and prevents infinite loops from cyclic callbacks.
 *
 * @template TContext - The context passed to class generator functions.
 * @param classInput - The input (string, array, or function returning class names).
 * @param context - An optional context object for generator functions.
 * @returns A deduplicated array of class names.
 * @throws If a callback throws an error while generating classes.
 */
export const normalizeClassName = <TContext = unknown>(
  classInput: ClassName<TContext>,
  context?: TContext,
): string[] => {
  // We store unique classes here.
  const result = new Set<string>()
  // Use a stack to flatten arrays and process functions in LIFO order.
  const stack: Array<ClassName<TContext>> = [classInput]
  // Keep track of visited functions to detect cycles.
  const seenCallbacks = new Set<ClassNameCallback<TContext>>()

  while (stack.length > 0) {
    const item = stack.pop()!

    // Skip null/undefined to avoid warning about "object" type
    if (item == null) {
      continue
    }

    if (typeof item === 'string') {
      // Split string by whitespace and add each fragment
      item
        .split(/\s+/)
        .filter(Boolean)
        .forEach((cls) => result.add(cls))
    } else if (Array.isArray(item)) {
      // Push array items onto the stack in reverse order to preserve the original sequence
      for (let i = item.length - 1; i >= 0; i--) {
        stack.push(item[i])
      }
    } else if (typeof item === 'function') {
      if (seenCallbacks.has(item)) {
        console.warn('Cyclic class function detected:', item)
        continue
      }
      seenCallbacks.add(item)

      try {
        const resolved = item(context)
        // If the function returns something truthy, process it
        if (resolved) {
          stack.push(resolved)
        }
      } catch (error) {
        if (error instanceof Error) {
          throwError(`Error resolving class function: ${error.message}`)
        } else {
          throwError(`Error resolving class function: ${String(error)}`)
        }
      }
    } else {
      // For unexpected types (e.g. number, object), just warn and skip
      if (process.env.NODE_ENV !== 'production') {
        console.warn('Unsupported class input type:', typeof item, 'Value:', item)
      }
    }
  }

  // Convert the Set into an array before returning
  return Array.from(result)
}
