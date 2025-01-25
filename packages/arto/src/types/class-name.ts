/**
 * A "primitive" class name type representing either:
 *  - a single string (e.g., `'btn btn-primary'`),
 *  - or an array of strings (e.g., `['btn', 'btn-primary']`).
 */
export type PrimitiveClassName = string | string[]

/**
 * A callback function that can generate class names dynamically, based on an optional context.
 * If the return value is falsy (`false` or `undefined`), the class will be skipped.
 *
 * @template TContext - The optional context type that can be provided to the function.
 * @param context - A user-defined context object, if any.
 * @returns A string or array of strings for class names, or a falsy value to skip.
 */
export type ClassNameCallback<TContext = unknown> = (
  context?: TContext,
) => PrimitiveClassName | false | undefined

/**
 * A flexible type describing all valid ways to provide class names:
 *
 * - **Primitive**: a string or an array of strings,
 * - **Callback**: a function returning a string, an array of strings, or falsy,
 * - **Nested Array**: an array that can itself contain any combination of primitives or callbacks.
 *
 * @template TContext - The type of context passed to any callbacks.
 */
export type ClassName<TContext = unknown> =
  | PrimitiveClassName
  | ClassNameCallback<TContext>
  | Array<ClassName<TContext>>
