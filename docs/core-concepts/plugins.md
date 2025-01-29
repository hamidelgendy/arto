---
title: Plugins
---

# Plugins

One of Arto’s key strengths is its **plugin system**. With plugins, you can extend or customize how class names are generated—adding features like conflict linting, logging, specialized state logic, theming, or analytics, all without modifying Arto’s core.

## Built-In Plugins

Arto comes with several **built-in** plugins to handle core functionality:

- **BaseClassNamePlugin**: Applies your top-level `className`.
- **VariantsPlugin**: Processes variant configurations.
- **StatesPlugin**: Processes global states.
- **RulesPlugin**: Applies advanced conditional logic.

These are automatically included whenever you call `arto(config)`, so you rarely need to manage them directly. However, understanding how the system works helps if you want to create or register new plugins.

## Creating a Custom Plugin

A **plugin** is an object with these fields:

- **`id`**: A unique string identifier (e.g., `'custom/lint-conflicts'`).
- **`stage`**: Either `'before'`, `'core'`, or `'after'` (default `'core'`).
- **`order`**: Numeric priority (default `0`). Lower numbers run earlier in that stage.
- **`apply(builder)`**: A function receiving the `ClassNameBuilder`, letting you manipulate classes or run logic.

Example: a plugin that checks for conflicting classes (`flex` vs `inline-flex`):

```ts
import type { Plugin } from 'arto'

export const LintConflictsPlugin: Plugin = {
  id: 'custom/lint-conflicts',
  stage: 'after',
  order: 10,
  apply(builder) {
    builder.addFinalBuildCallback(() => {
      const all = builder.getAllClasses()
      const hasFlex = all.includes('flex')
      const hasInlineFlex = all.includes('inline-flex')

      if (hasFlex && hasInlineFlex) {
        console.warn(
          `[LintConflictsPlugin] Found both "flex" and "inline-flex" in: ${all.join(' ')}`,
        )
      }
    })
  },
}
```

**Explanation**:

- Runs at the `'after'` stage with `order: 10`.
- Uses `builder.getAllClasses()` after the core pipeline to check if both `flex` and `inline-flex` are present.
- Logs a warning if they’re found together.

## Global Plugins

Arto exports a **`pluginHub`** registry for **global** plugins. Global plugins affect **all** Arto configurations unless explicitly unregistered.

**Registering globally**:

```ts
import { pluginHub } from 'arto'
import { LintConflictsPlugin } from './lint-conflicts-plugin.ts'

// Single plugin
pluginHub.register(LintConflictsPlugin)

// Or multiple
pluginHub.registerBatch([
  LintConflictsPlugin,
  // SomeOtherGlobalPlugin,
])
```

### Typical Use Cases

- **Linting or Conflict Checking** across your entire monorepo (e.g., no class conflicts).
- **Theming or Analytics**: Collect usage data or apply site-wide classes.
- **Runtime Info**: E.g., inject environment details or version tags in final classes.

## Local Plugins

If you **only** want a plugin for a single config, pass it as the **second argument** to `arto(...)`. Example:

```ts
import { arto } from 'arto'
import { LintConflictsPlugin } from './lint-conflicts-plugin.ts'

const config = arto(
  {
    className: 'inline-flex items-center',
    // ...variants, states, rules
  },
  [LintConflictsPlugin],
)
```

### When to Use Local Plugins

- **Component-Specific Logic**: You only need a plugin’s behavior for certain components.
- **Experimentation**: Trying a new plugin on a single config before rolling it out globally.
- **Isolation**: Avoid potential conflicts with other global plugins or other configs.

## Priority & Ordering

When you have a mix of global and local plugins, Arto merges them at build time. The order of execution follows:

1. **`stage`**: `'before'` → `'core'` → `'after'`
2. **`order`**: ascending numerical priority within that stage

For example:

- A global `'after'` plugin with `order: 5` will run before a local `'after'` plugin with `order: 10`.
- If two plugins have the same stage and order, the order in which they were registered is used.

## Overriding or Clearing Global Plugins

You can **unregister** a plugin if you want to remove its effects for any _new_ Arto configs:

```ts
import { pluginHub } from 'arto'

pluginHub.unregister('custom/lint-conflicts')
// Removes that plugin from global registry

pluginHub.clear()
// Wipes ALL globally registered plugins
```

**Note**: Already-created configs still include any plugins that existed at the time they were built. Unregistering only affects subsequent calls to `arto()`.

## Example: Combining Global & Local Plugins

```ts
import { type Plugin, pluginHub, arto } from 'arto'

type Variants = {
  theme: 'dark' | 'light'
}
interface Context {
  betaFlag: boolean
}

// 1) Global plugin for usage analytics
const UsageAnalyticsPlugin: Plugin = {
  id: 'analytics/global-usage',
  stage: 'core',
  apply(builder) {
    builder.addFinalBuildCallback(() => {
      const variants = builder.getSelectedVariants()
      const states = Array.from(builder.getActiveStates())
      console.log('Analytics =>', variants, states)
    })
  },
}
pluginHub.register(UsageAnalyticsPlugin)

// 2) Local plugin for a single config
const BetaFeaturePlugin: Plugin<Variants, never, Context> = {
  id: 'beta/local-plugin',
  stage: 'core',
  apply(builder) {
    builder.addPostCoreCallback(() => {
      const ctx = builder.getContext()
      if (ctx?.betaFlag) {
        builder.clearVariantClasses('theme') // remove theme variant classes if betaFlag is set
      }
    })
  },
}

const myConfig = arto<Variants, never, Context>(
  {
    className: 'font-sans px-4 py-2',
    variants: { theme: { dark: 'bg-black text-white', light: 'bg-white text-black' } },
  },
  [BetaFeaturePlugin], // local
)
```

- **UsageAnalyticsPlugin** logs usage for every config in the app.
- **BetaFeaturePlugin** only applies to `myConfig`.

## Summary

- **Built-In Plugins** handle base classes, variants, states, and rules.
- **Global Plugins** (via `pluginHub`) apply to every Arto config; use them for site-wide linting, theming, or logging.
- **Local Plugins** can be passed as the second argument to `arto(...)`, affecting only that config.
- **Stages** (`before`, `core`, `after`) and **order** control when plugins run.
- You can **unregister** or **clear** plugins from `pluginHub` if you need to remove them for future configs.

With plugins, you can fine-tune or extend Arto’s class-building pipeline in powerful ways, ensuring your styling logic meets the exact needs of your project.
