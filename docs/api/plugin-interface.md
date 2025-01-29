---
title: Plugin Interface
---

# Plugin Interface

In Arto, **plugins** allow you to customize or extend the class-building pipeline. Each plugin can inspect or modify classes at different stages, or even add final callbacks for post-processing. This page explains the structure of the **Plugin Interface** and how to work with the global **PluginRegistry** (`pluginHub`).

## Plugin Type

```ts
export interface Plugin<
  TVariants extends Record<string, VariantValue> = Record<string, VariantValue>,
  TStates extends string = string,
  TContext = unknown,
> {
  /**
   * A unique identifier for the plugin.
   */
  readonly id: string

  /**
   * Which stage to run in: 'before', 'core', or 'after'.
   * Defaults to 'core' if omitted.
   */
  stage?: PluginStage

  /**
   * Execution order within the chosen stage (lower means earlier).
   * Defaults to 0 if omitted.
   */
  order?: number

  /**
   * The function that receives a ClassNameBuilder,
   * allowing you to manipulate or inspect classes.
   */
  apply(builder: ClassNameBuilder<TVariants, TStates, TContext>): void | Promise<void>
}
```

### Fields

- **`id`**: A string that **uniquely** identifies the plugin.
- **`stage`**: Determines **when** the plugin should run within Arto’s build process:
  - `'before'`: Run **before** internal (core) logic and other `'core'` plugins.
  - `'core'`: Run alongside Arto’s main built-in plugins.
  - `'after'`: Run **after** the core plugins finish.
- **`order`**: A numeric priority within each stage. Lower = earlier.
- **`apply(builder)`**: The main callback where you modify or inspect classes using the **ClassNameBuilder** instance.

## Example Plugin

```ts
import type { Plugin } from 'arto'

export const MyExamplePlugin: Plugin = {
  id: 'my/example-plugin',
  stage: 'core',
  order: 5,
  apply(builder) {
    // Run logic at the 'core' stage with priority 5
    builder.addPostCoreCallback(() => {
      // Possibly do something with the final classes
      const allClasses = builder.getAllClasses()
      console.log('[MyExamplePlugin] Classes so far:', allClasses.join(' '))
    })
  },
}
```

In this plugin:

- The **`id`** is `'my/example-plugin'`.
- **`stage`** is `'core'`, meaning it runs with Arto’s built-in plugins.
- **`order`** is `5`, so it might run after a plugin with `order = 0`, but before one with `order = 10`.
- The plugin uses `builder.addPostCoreCallback(...)` to inspect classes after all core logic is done but before any `'after'` stage plugins.

## Plugin Stages

Arto executes plugins in three stages:

1. **`before`** – Used for tasks that need to happen prior to the main class merges (e.g., logging, early transforms).
2. **`core`** – The main stage where built-in plugins (base, variants, states, rules) operate. Usually where you place custom plugins if they directly manipulate class buckets.
3. **`after`** – Great for final touches, cleanup, or validating the final list of classes (linting, conflict checks, etc.).

## PluginRegistry (`pluginHub`)

```ts
import { pluginHub } from 'arto'

pluginHub.register(MyExamplePlugin)
pluginHub.unregister('my/example-plugin')
pluginHub.clear()
pluginHub.getPlugins()
// etc.
```

### Methods

- **`register(plugin)`**: Add or replace a plugin with the same `id`.
- **`unregister(id)`**: Remove a plugin by its `id`.
- **`clear()`**: Remove all registered plugins.
- **`getPlugins()`**: Return an array of all plugins (unsorted).

Any plugin registered here is **global** and applied to all Arto configs unless removed.

## Local Plugins

If you only want a plugin for a specific config, provide it as the second argument to `arto()`:

```ts
import { arto } from 'arto'
import { MyExamplePlugin } from './my-plugin'

const myConfig = arto(
  {
    className: 'some-base-classes',
    // ...
  },
  [MyExamplePlugin],
)
```

This merges your local plugin(s) with all globally registered plugins, sorted by **stage** and **order**.

## Summary

- A **plugin** must define:
  - **`id`** (string)
  - **`stage`** (`'before' | 'core' | 'after'`)
  - **`order`** (number)
  - **`apply(builder)`** method
- You can **register** plugins globally with `pluginHub` or pass them **locally** to `arto(...)`.
- **Stages** and **order** determine execution flow.
- **`ClassNameBuilder`** is passed to `apply(...)` so you can add/replace/clear classes, add callbacks, or read the context.

Check out [ClassNameBuilder Documentation](/api/classname-builder) for more details on available methods to manipulate classes.
