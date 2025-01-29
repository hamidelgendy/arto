---
title: Context Usage
---

# Context Usage

Arto offers an optional **`context`** parameter that you can pass each time you generate class names. This context can be used by:

- Class name callbacks (`(context) => ...`)
- State dependency functions
- Custom plugins that inspect or modify your configuration

Using `context` keeps your core configuration generic, while allowing advanced or environment-specific behaviors at runtime.

## Passing `context` to arto

Every Arto configuration function accepts an optional `context` field in its options object:

```ts
import { arto } from 'arto'

interface Context {
  isDarkMode: boolean
}

const configWithContext = arto<never, never, Context>({
  className: (ctx) => (ctx?.isDarkMode ? 'bg-black text-white' : 'bg-white text-black'),
})

const result = configWithContext({
  context: { isDarkMode: true },
})

// => 'bg-black text-white'
```

### Explanation

- **`className`** here is a callback that receives `ctx` (the context object).
- If `ctx?.isDarkMode` is true, apply dark mode classes; otherwise, apply the light mode.

## Using Context in States

When defining a state, you can supply a **`dependsOn`** function that receives `(activeStates, context)`. For example:

```ts
import { arto } from 'arto'

type State = 'adminMode'
interface Context {
  userIsAdmin: boolean
  adminBadgeClass: string
}

const stateWithContext = arto<never, State, Context>({
  states: {
    adminMode: {
      className: (ctx) => ctx?.adminBadgeClass || 'bg-yellow-200 text-gray-800',
      dependsOn: (activeStates, ctx) => Boolean(ctx?.userIsAdmin),
    },
  },
})

const res = stateWithContext({
  states: { adminMode: true },
  context: { userIsAdmin: false },
})

// Because userIsAdmin = false, "adminMode" doesn't apply even though we passed `true`.
```

### Explanation

- The `dependsOn` function checks `ctx.userIsAdmin` to decide if it’s valid to activate `adminMode`.
- If `userIsAdmin` is false, the classes in `adminMode` are not applied, even if the state is `true`.

## Using Context in Variant or State Callbacks

Variants and state definitions can also be callbacks:

```ts
import { arto } from 'arto'

type Variants = {
  theme: 'custom'
}
type States = 'highlight'
interface Context {
  customThemeClasses: string
  highlightClass: string
}

const cardConfig = arto<Variants, States, Context>({
  variants: {
    theme: {
      custom: (ctx) => ctx?.customThemeClasses || 'bg-gray-200 text-gray-800',
    },
  },
  states: {
    highlight: (ctx) => ctx?.highlightClass || 'border border-yellow-500',
  },
})

const cardClasses = cardConfig({
  variants: { theme: 'custom' },
  states: { highlight: true },
  context: {
    customThemeClasses: 'bg-blue-50 text-blue-900',
    highlightClass: 'ring-2 ring-blue-300',
  },
})

// => "bg-blue-50 text-blue-900 ring-2 ring-blue-300"
```

## Passing Context to Plugins

When a custom plugin’s `apply` method runs, the plugin can retrieve context via `builder.getContext()`. Example:

```ts
import type { Plugin } from 'arto'

interface Context {
  debugAuth: boolean
  user: {
    name: string
  }
}

export const AuthDebugPlugin: Plugin<never, never, Context> = {
  id: 'custom/auth-debug',
  stage: 'after',
  apply(builder) {
    builder.addFinalBuildCallback(() => {
      const ctx = builder.getContext()
      if (ctx?.debugAuth && ctx?.user) {
        console.log(`[AuthDebugPlugin] Rendering for user: ${ctx.user.name}`)
      }
    })
  },
}
```

### Explanation

- Call `builder.getContext()` inside the plugin to read any relevant fields (`user`, flags, etc.).
- You can use this to log or conditionally manipulate classes.

## Typical Use Cases

- **Theming**: Provide a `themeConfig` or `darkMode` boolean in context.
- **User Auth**: Condition certain states/variants on user roles (admin, editor, etc.).
- **Multi-tenant**: Each tenant might have different default classes or brand colors.
- **Debugging**: Pass a `debug: true` flag to log or warn about certain styling issues.

By keeping environment- or user-specific data in `context`, your Arto configs stay generic and flexible.

## Performance Tips

- **Memoize** your config if the `context` changes infrequently. If `context` changes constantly, consider caching partial results to avoid repeated computations.
- **Keep callbacks simple**. The more logic you place in callback or `dependsOn` functions, the more time it takes for Arto to compute the final class string.

## Summary

- **`context`** is an optional object you can pass alongside `variants` and `states`.
- It can drive dynamic logic in **className callbacks**, **`dependsOn`** functions, or **plugins**.
- Great for theming, user roles, multi-tenant setups, or advanced custom logic.
- Use it wisely and keep performance in mind—especially in large or frequently updated apps.
