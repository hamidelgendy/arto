---
title: Testing Your Config
---

# Testing Your Config

Arto is designed to keep styling logic predictable and type-safe. To ensure your configurations (variants, states, rules, plugins) behave as expected—especially in large or mission-critical projects—it’s a good idea to unit test them. Below are some common strategies and best practices for testing Arto setups with popular test frameworks like **Vitest**, **Jest**, or **Mocha**.

## Basic Unit Test Example

Here’s a simple test using Jest or Vitest. We’ll define an Arto config, then verify the final class string under different conditions:

```ts
import { arto } from 'arto'
import { expect, test, describe } from 'vitest'

describe('Button config', () => {
  const buttonConfig = arto({
    className: 'inline-flex items-center font-medium',
    variants: {
      size: { small: 'px-2 py-1 text-sm', large: 'px-4 py-2 text-base' },
      theme: { primary: 'bg-blue-500 text-white', secondary: 'bg-gray-100 text-gray-800' },
    },
    states: {
      disabled: 'opacity-50 pointer-events-none',
    },
    defaultVariants: {
      size: 'large',
      theme: 'primary',
    },
  })

  test('default config produces "large + primary" classes', () => {
    const result = buttonConfig()
    expect(result).toContain('inline-flex')
    expect(result).toContain('px-4')
    expect(result).toContain('bg-blue-500')
  })

  test('size=small, theme=secondary, disabled=true', () => {
    const result = buttonConfig({
      variants: { size: 'small', theme: 'secondary' },
      states: { disabled: true },
    })
    expect(result).toContain('px-2') // from size=small
    expect(result).toContain('bg-gray-100 text-gray-800') // from theme=secondary
    expect(result).toContain('opacity-50 pointer-events-none') // from disabled
    expect(result).not.toContain('bg-blue-500')
  })
})
```

### Explanation

- **Create** your config once at the top of the test suite.
- **Call** your config with different variant/state combos.
- Use common assertions (like `toContain`) to verify the classes you expect are in the final string.

## Testing Rules

If you have **Rules** that remove or add classes based on logic, it’s a good idea to ensure they work properly. For instance:

```ts
const configWithRules = arto({
  className: 'block',
  variants: {
    theme: {
      primary: 'bg-blue-500 text-white',
      secondary: 'bg-gray-100 text-gray-800',
    },
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
  states: {
    disabled: 'opacity-50',
  },
})

test('rules remove primary classes and add "bg-blue-300" if disabled', () => {
  const res = configWithRules({
    variants: { theme: 'primary' },
    states: { disabled: true },
  })
  expect(res).not.toContain('bg-blue-500')
  expect(res).toContain('bg-blue-300 text-white')
  expect(res).toContain('opacity-50')
})
```

## Testing Context Logic

When your config or rules rely on the **`context`** parameter, pass different context objects to ensure they behave correctly.

```ts
const contextConfig = arto({
  className: (ctx) => (ctx?.darkMode ? 'bg-black text-white' : 'bg-white text-black'),
})

test('applies dark mode classes when darkMode = true', () => {
  const result = contextConfig({ context: { darkMode: true } })
  expect(result).toContain('bg-black text-white')
})

test('defaults to light mode if darkMode is false', () => {
  const result = contextConfig({ context: { darkMode: false } })
  expect(result).toContain('bg-white text-black')
})
```

## Testing Plugins

When you have **custom plugins**, consider writing test cases that load them (either locally or globally) and verify their side effects:

```ts
import { pluginHub, arto } from 'arto'
import { LintConflictsPlugin } from './lint-plugin.ts'

pluginHub.register(LintConflictsPlugin)

test('LintConflictsPlugin warns on conflicting classes', () => {
  // Mock console.warn to capture warnings
  const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

  const config = arto({
    className: 'flex inline-flex', // intentionally conflicting
  })

  config()

  expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('flex'))
  warnSpy.mockRestore()
})
```

## Snapshot Testing

You can also do **snapshot testing** if you have many variants or states to verify. Generate the class strings in a loop and compare them to a known snapshot. This is handy if your config rarely changes and you want to detect any unexpected modifications.

_(Pseudo-code for Jest or Vitest)_

```ts
describe('Snapshot testing button config', () => {
  const buttonConfig = /* ... */

  const scenarios = [
    { size: 'small', theme: 'primary' },
    { size: 'large', theme: 'secondary', disabled: true },
    // add more combos
  ]

  test('all variant/state combos match snapshots', () => {
    scenarios.forEach((scenario) => {
      const classStr = buttonConfig({
        variants: { size: scenario.size, theme: scenario.theme },
        states: { disabled: !!scenario.disabled }
      })
      expect(classStr).toMatchSnapshot()
    })
  })
})
```

## Performance Testing

While not as common, you might measure performance if you have extremely large or complex Arto configs:

- Use Node’s `performance.now()` or a library like `benchmark.js` to measure how long class generation takes with various inputs.
- Compare different versions or approaches (e.g., fewer rules vs. more rules) to confirm your changes don’t degrade performance.

## General Best Practices

- **Keep tests small & focused**: Each test should confirm a specific combination of variants/states or a specific plugin rule.
- **Test edge cases**: e.g., invalid variant values, “empty” states, or extreme scenarios if your plugin is dealing with large arrays or complex logic.
- **Automate**: Use `pnpm test` or `npm test` in your CI pipeline so you catch issues early.
- **Snapshot prudence**: Snapshots can be helpful, but be cautious about overusing them, as they can become stale or lose clarity if you rely on them for large diffs.

## Summary

- **Unit Test** your configs to ensure every variant, state, and rule works as intended.
- **Context** and **Plugins** can also be tested by passing the right options or mocking console logs.
- **Snapshot Testing** helps catch unexpected changes in output strings across many combos.
- **Performance Testing** is an option for highly complex configs.

By thoroughly testing your Arto configurations, you can confidently evolve your styling logic without introducing regressions or conflicts.
