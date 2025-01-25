# Arto

Arto is a **type-safe, flexible class name management library** designed for building scalable UIs with variants, states, and advanced conditional styling.

![Bundle Size](https://img.shields.io/bundlephobia/minzip/arto?style=flat-square&logo=npm&logoColor=FFF&label=size&color=E53E3E)
![npm](https://img.shields.io/npm/v/arto?style=flat-square&logo=npm&logoColor=FFF&color=E53E3E)
![License](https://img.shields.io/github/license/hamidelgendy/arto?style=flat-square&logo=github&logoColor=FFF&color=E53E3E)

> **Documentation**: For detailed setup steps, advanced usage, and more examples, check out the official [Arto Documentation](https://arto.elgndy.com).

---

## Key Features of Arto

- **Variants**: Cleanly define style options (e.g., size, color) without messy conditional logic.
- **States**: Apply conditional classes for states like `disabled`, `hovered`, etc., with optional dependency logic.
- **Rules & Logic**: Dynamically remove or add classes using logical operators (`AND`, `OR`, `XOR`, etc.) or custom callbacks.
- **Fully Extensible**: Write or install plugins to extend Arto’s functionality (e.g., theming, UI framework integration).
- **Type-Safe**: Built with TypeScript for robust validation and developer confidence.

---

## Installation

```bash
npm install arto
```

---

## Basic Usage

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

---

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

---

## Contributing

Contributions of all kinds are welcome! Feel free to:
Arto thrives on community input. We welcome contributions and feedback:

- **Report Issues:** Found a bug or have a feature request? [Create an Issue](https://github.com/hamidelgendy/arto/issues/new).
- **Submit Pull Requests:** Help improve Arto by opening PRs for bug fixes or new features.
- **Propose Ideas:** Suggest new plugins or improvements to existing features—Arto is all about extensibility and community collaboration.

If you’re unsure where to start, look for GitHub issues labeled “help wanted” or “good first issue”. We’re excited to see your contributions!

---

## License

This project is released under the [MIT License](./LICENSE).
