---
title: Rules & Logic Types
---

# Rules & Logic Types

Arto **Rules** provide a flexible way to conditionally remove or add classes based on your chosen variants, active states, or even custom logic. Each rule has a `when` condition, plus optional `remove` and/or `add` properties. This page delves into the **types** that define these rules and their associated logic operators.

## ArtoRule<TVariants, TStates, TContext>

```ts
export interface ArtoRule<
  TVariants extends Record<string, VariantValue>,
  TStates extends string,
  TContext = unknown,
> {
  // Conditions describing which variants/states must match, plus logic details
  when: ArtoRuleWhen<TVariants, TStates, TContext>

  // Classes or variant/state classes to remove when the condition passes
  remove?: ArtoRuleRemove<TVariants, TStates>

  // Classes to add if the condition passes
  add?: ClassName<TContext>
}
```

**Key Fields**:

- **`when`**: Defines conditions for variants and states (e.g., `theme: ['primary']`, states `['disabled']`), plus how to combine them (AND, OR, etc.).
- **`remove`**: Specifies which classes or variant/state buckets to remove.
- **`add`**: Specifies any classes to inject when the rule condition passes.

## ArtoRuleWhen<TVariants, TStates, TContext>

```ts
export interface ArtoRuleWhen<
  TVariants extends Record<string, VariantValue>,
  TStates extends string,
  TContext = unknown,
> {
  /**
   * An object mapping variant keys to an array of acceptable values.
   * e.g. { size: ['small', 'medium'] }
   */
  variants?: {
    [K in keyof TVariants]?: TVariants[K][]
  }

  /**
   * States that must be active.
   * e.g. states: ['disabled', 'hover']
   */
  states?: TStates[]

  /**
   * Defines how to interpret the conditions (logical operator or object).
   * e.g. 'AND', 'OR', or a function receiving (meta, context).
   */
  logic?: ArtoLogic<TVariants, TStates, TContext>
}
```

### Explanation

- **`variants`**: If you list `{ theme: ['primary', 'secondary'] }`, it means “theme must be either primary OR secondary.”
- **`states`**: e.g. `['disabled', 'hover']` means both disabled AND hover must be active by default (unless you specify a different logic operator).
- **`logic`**: Allows you to define **how** to evaluate multiple conditions (`AND`, `OR`, etc.), or even supply a **callback**.

## ArtoRuleRemove<TVariants, TStates>

```ts
export interface ArtoRuleRemove<
  TVariants extends Record<string, VariantValue>,
  TStates extends string,
> {
  /**
   * Array of variant keys whose classes to remove
   */
  variants?: (keyof TVariants)[]

  /**
   * Array of states whose classes to remove
   */
  states?: TStates[]

  /**
   * Scope of states: 'global' | 'variant' | 'all'
   * (default is 'all')
   */
  statesScope?: 'global' | 'variant' | 'all'

  /**
   * If true, remove all previously added base classes
   */
  base?: boolean
}
```

**Fields**:

- **`variants`**: e.g. `['size', 'theme']` to clear all classes associated with those variant keys.
- **`states`**: e.g. `['disabled']` to remove the classes for that state (and possibly variant-level states if `statesScope` = `'all'`).
- **`statesScope`**:
  - `'global'`: Only remove global state classes.
  - `'variant'`: Only remove variant-level state classes.
  - `'all'`: Remove both global and variant-level state classes.
- **`base`**: If true, remove all base classes that came from `className`.

## ArtoLogic<TVariants, TStates, TContext>

```ts
export type ArtoLogic<
  TVariants extends Record<string, VariantValue>,
  TStates extends string,
  TContext = unknown,
> = LogicOperator | ArtoLogicObject | ArtoLogicCallback<TVariants, TStates, TContext>
```

**ArtoLogic** can be:

1. **`LogicOperator`** (string): `'AND'`, `'OR'`, `'NOT'`, `'XOR'`, `'IMPLIES'`.
2. **`ArtoLogicObject`**: Breaks down how variants and states are evaluated (`variants: 'AND' | 'OR'`, `states: 'AND' | 'OR'`, `combine: 'AND' | 'OR'`).
3. **`ArtoLogicCallback`**: A function receiving `(meta, context)` returning a boolean.

## Logic Operators

```ts
export type LogicOperator = 'AND' | 'OR' | 'NOT' | 'XOR' | 'IMPLIES'
```

**Meanings**:

- **`AND`**: All conditions must be true.
- **`OR`**: At least one condition is true.
- **`NOT`**: All conditions must be false.
- **`XOR`**: Exactly one condition is true.
- **`IMPLIES`**: For two conditions, `A => B` means if `A` is true, then `B` must be true. (For more than two, only first two matter.)

## ArtoLogicObject

```ts
export interface ArtoLogicObject {
  /**
   * How to evaluate variant conditions: 'AND' or 'OR'
   */
  variants?: 'AND' | 'OR'

  /**
   * How to evaluate state conditions: 'AND' or 'OR'
   */
  states?: 'AND' | 'OR'

  /**
   * How to combine variant and state results: 'AND' or 'OR'
   */
  combine?: 'AND' | 'OR'
}
```

When using `ArtoLogicObject`, you separately define how **variants** are combined, how **states** are combined, and then how to **combine** those two results overall. Defaults to `'AND'` if omitted.

## ArtoLogicCallback

```ts
export type ArtoLogicCallback<
  TVariants extends Record<string, VariantValue>,
  TStates extends string,
  TContext = unknown,
> = (meta: RuleEvalMeta<TVariants, TStates>, context: TContext | undefined) => boolean
```

Where:

```ts
export interface RuleEvalMeta<
  TVariants extends Record<string, VariantValue>,
  TStates extends string,
> {
  variantMatches: Partial<Record<keyof TVariants, boolean>>
  stateMatches: Partial<Record<TStates, boolean>>
  selectedVariants: TVariants
  activeStates: Set<TStates>
}
```

In this approach, you get direct access to whether each variant key or state matched, plus the user’s selected variants and active states. Return `true` if the rule should apply, or `false` if it should not.

## Example Rule Setup

```ts
const config = arto({
  className: 'block',
  variants: {
    theme: { primary: 'text-white bg-blue-600', secondary: 'text-gray-700 bg-gray-100' },
  },
  states: { disabled: 'opacity-60 pointer-events-none' },
  rules: [
    {
      when: {
        variants: { theme: ['primary'] },
        states: ['disabled'],
        logic: 'AND', // default anyway
      },
      remove: { variants: ['theme'] },
      add: 'bg-blue-300 text-white',
    },
    {
      when: {
        variants: { theme: ['primary'] },
        states: ['disabled', 'hover'],
        // Custom logic function
        logic: (meta) => {
          // If 'theme' is 'primary' and any state is active => apply
          const isPrimary = meta.variantMatches.theme
          const anyStateActive = Object.values(meta.stateMatches).some(Boolean)
          return Boolean(isPrimary) && anyStateActive
        },
      },
      remove: { base: true },
      add: 'bg-purple-600 text-white',
    },
  ],
})
```

### Explanation

1. First rule: If `theme = primary` AND `disabled = true`, remove the `theme` classes and add `'bg-blue-300 text-white'`.
2. Second rule: If `theme = primary` AND _any_ state is active, remove **all base classes** and add `'bg-purple-600 text-white'`.

If multiple rules match simultaneously, both can run—so order matters if they remove or add overlapping classes.

## Summary

- A **rule** is an object with `when`, `remove`, and `add` fields:
  - **`when`**: Conditions on variants/states + logic.
  - **`remove`**: Which classes (base, variant, state) to strip if conditions pass.
  - **`add`**: Additional classes to apply in that scenario.
- **Logic** can be as simple as `'AND' / 'OR'` or as advanced as a callback for custom meta evaluations.
- **Operators** (`AND`, `OR`, `NOT`, `XOR`, `IMPLIES`) let you combine multiple conditions.
- Arto evaluates rules **after** applying base classes, variants, and states (by default in the `'core'` or `'after'` stage).

Check the [Rules Guide](/core-concepts/rules) for practical usage examples or see how [Plugins](/api/plugin-interface) might hook into rule logic.
