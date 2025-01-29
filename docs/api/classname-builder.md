---
title: ClassNameBuilder
---

# ClassNameBuilder

**ClassNameBuilder** is an internal utility class that manages how Arto merges base classes, variant classes, state classes, and any modifications from rules or plugins. While most users won’t need to interact with this class directly (because `arto()` invokes it under the hood), understanding it can be beneficial for creating advanced plugins or debugging intricate class-merging logic.

## Constructor Signature

```ts
export class ClassNameBuilder<
  TVariants extends Record<string, VariantValue> = Record<string, VariantValue>,
  TStates extends string = string,
  TContext = unknown,
> {
  constructor(
    artoConfig: Readonly<ArtoConfig<TVariants, TStates, TContext>>,
    selectedVariants: TVariants,
    activeStates: Set<TStates>,
    context?: TContext,
    plugins?: Plugin<TVariants, TStates, TContext>[],
  ) {
    // ...
  }
}
```

**Parameters**:

1. **`artoConfig`** – The Arto configuration object, containing base classes, variants, states, rules, and default variants.
2. **`selectedVariants`** – The user-chosen variant values (merged with defaults).
3. **`activeStates`** – A set of states currently active (e.g., `'disabled'`, `'hover'`).
4. **`context`** – An optional context object (if provided to the config).
5. **`plugins`** – A list of local + global plugins (sorted by stage and order) that manipulate class strings at different build stages.

## Key Methods

```ts
// Build Sequence
build(): string[]

// Base Classes
addBaseClasses(classNames: string[]): void
getBaseClasses(): string[]
clearBaseClasses(): void

// Variant Classes
addVariantClasses(variantKey: keyof TVariants, classNames: string[]): void
replaceVariantClasses(variantKey: keyof TVariants, classNames: string[]): void
clearVariantClasses(variantKey: keyof TVariants): void
getVariantClassMap(): Readonly<Record<keyof TVariants, string[]>>

// Global State Classes
addGlobalStateClasses(state: TStates, classNames: string[]): void
replaceGlobalStateClasses(state: TStates, classNames: string[]): void
clearGlobalStateClasses(state: TStates): void
getGlobalStateClassesFor(state: TStates): string[]

// Variant-Level State Classes
addVariantStateClasses(variantKey: keyof TVariants, state: TStates, classNames: string[]): void
replaceVariantStateClasses(variantKey: keyof TVariants, state: TStates, classNames: string[]): void
clearVariantStateClasses(variantKey: keyof TVariants, state: TStates): void
getVariantStateClasses(variantKey: keyof TVariants, state: TStates): string[]

// Callbacks
addPostCoreCallback(callback: () => void): void
addFinalBuildCallback(callback: () => void): void

// Getters & Setters
getArtoConfig(): Readonly<ArtoConfig<TVariants, TStates, TContext>>
getSelectedVariants(): TVariants
setSelectedVariants(variants: TVariants): void
getActiveStates(): Set<TStates>
setActiveStates(states: Set<TStates>): void
getContext(): TContext | undefined
getAllClasses(): string[]
```

**Highlights**:

- **`build()`**: Orchestrates the entire class generation pipeline, running all plugins in `'before'`, `'core'`, and `'after'` stages, plus any post-core/final callbacks.
- **Base/Variant/State Methods**: Offer fine-grained control to add, remove, or replace classes in different “buckets” (base, variant-level, global states, variant-level states).
- **Callback Registration**: `addPostCoreCallback` and `addFinalBuildCallback` let plugins run logic after the core or final steps of class generation.
- **Getters & Setters**: Retrieve or modify the current config, selected variants, active states, or context.

## Lifecycle & Plugin Stages

When `builder.build()` is called:

1. **'before'** plugins run (in ascending `order`).
2. **'core'** plugins run (lowest `order` first).
3. **Post-Core Callback** – Any callbacks added by `addPostCoreCallback()` execute.
4. **'after'** plugins run.
5. **Final Build Callback** – Callbacks from `addFinalBuildCallback()` execute last.
6. **Class Buckets Merge** – All base classes, variant classes, state classes, and any modifications from rules or plugins are combined into a final array.

At the end, `build()` returns an **array** of class names (Arto typically joins them into a string).

## Example: Plugin Usage

```ts
import type { Plugin } from 'arto'

export const ExamplePlugin: Plugin = {
  id: 'example/clear-hover',
  stage: 'core',
  order: 5,
  apply(builder) {
    // Remove the global 'hover' state classes if 'disabled' is active
    builder.addPostCoreCallback(() => {
      const states = builder.getActiveStates()
      if (states.has('disabled') && states.has('hover')) {
        builder.clearGlobalStateClasses('hover')
      }
    })
  },
}
```

**Explanation**:

- The plugin checks if both `disabled` and `hover` are active.
- If so, it calls `builder.clearGlobalStateClasses('hover')` to remove all hover-related classes.
- This logic runs after the `'core'` stage is done but before `'after'` plugins.

## Summary

- **`ClassNameBuilder`** is the backbone of Arto’s class composition process, separating base, variants, states, and rule-driven logic.
- It **sorts and runs plugins** at different stages, merging or removing classes accordingly.
- Plugin authors can **add or remove classes** via builder methods, or hook into post-core/final callbacks for specialized logic.
- For normal usage, **`arto(config, plugins)`** automatically handles `ClassNameBuilder` instantiation and plugin application—no manual setup required.
