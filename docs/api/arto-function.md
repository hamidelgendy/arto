---
title: arto() Function
---

# `arto()` Function

`arto` is the **primary factory function** in Arto that creates your configuration for generating dynamic, variant- and state-based class strings. After you define a config and optionally pass in local plugins, it returns a callable function which you invoke with the user’s chosen variants, states, and (optionally) a context object.

## Function Signature

```ts
export function arto<
  TVariants extends Record<string, VariantValue> = Record<string, VariantValue>,
  TStates extends string = string,
  TContext = unknown,
>(
  config: Readonly<ArtoConfig<TVariants, TStates, TContext>>,
  plugins?: Plugin<TVariants, TStates, TContext>[],
): (options?: {
  variants?: Partial<TVariants>
  states?: Partial<Record<TStates, boolean>>
  context?: TContext
}) => string
```

### Parameters

1. **`config`**: An **ArtoConfig** describing:

   - **base `className`** (string, array, or callback)
   - **variants** (size, theme, etc.)
   - **states** (hover, disabled, etc.)
   - **rules** for advanced conditional logic
   - **defaultVariants** for fallback values

2. **`plugins?`** (optional): An array of **local plugins**. These will be merged with any plugins registered globally via `pluginHub`.

### Return Value

A **callable function** that accepts an options object with:

- **`variants?`**: The user’s chosen variant values (overriding defaults).
- **`states?`**: Boolean flags for active states.
- **`context?`**: An optional object to pass to callbacks or plugin logic.

It returns the **final space-joined class string**.

## Basic Usage

```ts
import { arto } from 'arto'

type Variants = {
  size: 'small' | 'large'
  theme: 'primary' | 'secondary'
}
type States = 'disabled'

const buttonConfig = arto<Variants, States>({
  className: 'inline-flex items-center font-medium',
  variants: {
    size: {
      small: 'px-2 py-1 text-sm',
      large: 'px-4 py-2 text-base',
    },
    theme: {
      primary: 'bg-blue-500 text-white',
      secondary: 'bg-gray-200 text-gray-800',
    },
  },
  states: {
    disabled: 'opacity-50 pointer-events-none',
  },
  defaultVariants: {
    size: 'large',
  },
  rules: [
    {
      when: {
        variants: { theme: ['primary'] },
        states: ['disabled'],
      },
      remove: { variants: ['theme'] },
      add: 'bg-blue-300 text-white',
    },
  ],
})

// Generate final classes
const finalClasses = buttonConfig({
  variants: { size: 'small', theme: 'secondary' },
  states: { disabled: false },
})

console.log(finalClasses)
// => "inline-flex items-center font-medium px-2 py-1 text-sm bg-gray-200 text-gray-800"
```

### Explanation

- **base `className`**: `'inline-flex items-center font-medium'`.
- **variants** (`size`, `theme`): Provide multiple styling “modes.”
- **states** (`disabled`): Applies additional classes if true.
- **defaultVariants**: If `size` or `theme` isn’t specified, Arto uses defaults.
- **rules**: If `theme=primary` AND `disabled` is true, remove the primary classes and replace with `'bg-blue-300 text-white'`.

## Local Plugins

```ts
import { arto } from 'arto'
import { MyLocalPlugin } from './my-plugin'

const configWithPlugin = arto(
  {
    className: 'block rounded',
    // additional config fields...
  },
  [MyLocalPlugin],
)

const result = configWithPlugin()
console.log(result)
```

Any **local plugins** passed as the second argument run alongside the built-in Arto plugins and any **global** plugins registered in `pluginHub`.

## Default vs Provided Variants

If a variant is listed in **defaultVariants** and the user doesn’t specify that variant, Arto uses the default. For example, if `size` defaults to `'large'`, calling `buttonConfig({})` produces `'large'` classes automatically.

If the user **does** provide a value, it overrides the default.

## Error Handling

- **Invalid variant value**: If you specify `theme: 'unknown'`, Arto throws an error because `'unknown'` isn’t defined in the config.
- **State dependencies**: If a state has `dependsOn` that isn’t satisfied, Arto skips its classes.
- **Plugin errors**: If a custom plugin or rule logic fails, Arto may throw an `ArtoError` with a descriptive message.

## Performance Considerations

- **Don’t re-instantiate** the config on every render (in React, for example). Define it once or memoize it.
- If you call the returned function with the same variants/states repeatedly, consider caching or memoization to avoid repeated class generation overhead.

## Summary

- **`arto(...)`** is the main function to define your class-management config.
- It returns a function for converting **`variants`, `states`, and `context`** into a final class string.
- By combining **base classes**, **variants**, **states**, and **rules**, you can build complex styling logic in a single typed config.
- **Local plugins** can be appended, and **global plugins** automatically merge in.

For more details, see:

- [Variants & States Types](/api/variants-states-types)
- [Rules & Logic Types](/api/rules-types)
- [Plugin Interface](/api/plugin-interface)
