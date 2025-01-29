<h1 align="center">Arto</h1>

<div align="center">

![CI](https://github.com/hamidelgendy/arto/workflows/CI/badge.svg)
[![npm version](https://img.shields.io/npm/v/arto?style=flat-square)](https://www.npmjs.com/package/arto)
![size](https://img.shields.io/bundlephobia/minzip/arto?style=flat-square&label=size)
![license](https://img.shields.io/github/license/hamidelgendy/arto?style=flat-square)

</div>

Arto is a **type-safe, flexible class name management library** designed for building scalable UIs with variants, states, and advanced conditional styling.

## Documentation

For full documentation, visit [arto.elgndy.com](https://arto.elgndy.com).

## Key Features

- 🎨 **Variants**: Cleanly define style options (e.g., size, color) without messy conditional logic.
- 🔄 **States**: Apply conditional classes for states like `disabled`, `hovered`, etc., with optional dependency logic.
- ⚡ **Rules & Logic**: Dynamically add or remove classes using logical operators (`AND`, `OR`, `XOR`, etc.) or custom callbacks.
- 🔧 **Fully Extensible**: Write or install plugins to extend functionality (e.g., theming, UI framework integration).
- 🛡️ **Type-Safe**: Built with TypeScript for robust validation and developer confidence.
- ✨ **Lightweight**: No external dependencies—integrates seamlessly with your chosen framework (React, Vue, Svelte, or plain JS).
- 🌐 **Framework Agnostic**: Compatible with any CSS strategy (e.g., Tailwind, PostCSS, CSS Modules).

## Installation

```bash
pnpm add arto
```

## Quick Example

Below is a very simplified example to illustrate how Arto might handle variants and states.
For more in-depth or real-world examples, see our [Documentation](https://arto.elgndy.com) and examples/ folder.

```ts
import { arto } from 'arto'

// 1. Create an arto instance with basic config
const myArto = arto({
  // Always include these classes
  className: 'btn',

  // Define variants for styling
  variants: {
    size: {
      small: 'btn-sm',
      large: 'btn-lg',
    },
  },

  // Define states for toggling
  states: {
    disabled: 'opacity-50 pointer-events-none',
  },
})

// 2. Generate a final class string
const classString = myArto({
  variants: { size: 'large' },
  states: { disabled: true },
})

// => "btn btn-lg opacity-50 pointer-events-none"
```

## Advanced Example

Below is a more complex scenario showcasing:

- Nested state definitions with `dependsOn`
- Callback-based class names that leverage user-defined `context`
- Conditional logic through the rules `array`

```ts
import { arto } from 'arto'

// Define variant keys and possible values
type Variants = {
  intent: 'info' | 'danger' | 'success'
  size: 'sm' | 'md'
}

// Define possible states
type States = 'hovered' | 'disabled'

// Optional context data passed during class generation
type Context = {
  username: string
}

const myArto = arto<Variants, States, Context>({
  // Base classes
  className: 'base',

  // Variant definitions
  variants: {
    intent: {
      info: 'intent-info',
      danger: {
        className: 'intent-danger',
        states: {
          hovered: {
            className: 'intent-danger-hovered',
            dependsOn: [{ not: ['disabled'] }], // apply only if 'disabled' is not active
          },
        },
      },
      // Callback-based class name
      success: (ctx) => (ctx?.username === 'admin' ? 'intent-success-admin' : 'intent-success'),
    },
    size: {
      sm: 'size-sm',
      md: 'size-md',
    },
  },

  // Global states
  states: {
    hovered: {
      className: 'global-hovered',
      dependsOn: [{ not: ['disabled'] }], // can't hover if disabled
    },
    disabled: 'global-disabled',
  },

  // Advanced rules
  rules: [
    {
      when: {
        variants: { intent: ['info', 'danger'] },
        states: ['hovered'],
        logic: 'AND',
      },
      add: 'rule-class',
    },
  ],
})

// Usage examples:

// A) Info + small (no states)
const exampleA = myArto({
  variants: { intent: 'info', size: 'sm' },
})
// => "base rule-class intent-info size-sm"

// B) Danger + hovered + disabled
const exampleB = myArto({
  variants: { intent: 'danger', size: 'sm' },
  states: { hovered: true, disabled: true },
})
// => "base rule-class intent-danger size-sm global-disabled"

// C) Success + hovered, with admin context
const exampleC = myArto({
  variants: { intent: 'success', size: 'md' },
  states: { hovered: true },
  context: { username: 'admin' },
})
// => "base intent-success-admin size-md global-hovered"
```

## Contributing

We welcome contributions of all kinds, from bug reports to new features. Before submitting a pull request, please review our [Contributing Guide](https://arto.elgndy.com/contributing/contributing.html). It covers the recommended workflow, coding standards, and release process to help ensure a smooth collaboration.

## License

This project is released under the [MIT License](./LICENSE).
