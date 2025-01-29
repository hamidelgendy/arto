---
title: Arto Documentation
---

# Introduction

**Arto** is a flexible, **variant- and state-driven class name management library** for JavaScript and TypeScript applications. At its core, Arto simplifies how you apply conditional classes in scenarios such as design systems, UI libraries, or any complex setup that needs dynamic, composable class strings.

## Why Arto?

Front-end teams often juggle multiple utility classes, nested conditionals, and advanced logic when styling components—especially when using utility-first frameworks like Tailwind CSS or dealing with interactive states (hover, pressed, focus) in React or Vue. Arto aims to centralize these concerns into a single, declarative layer:

- **Variants** define different “modes” or “themes” for your components (e.g., size, color).
- **States** handle ephemeral or interactive styling needs (e.g., `hover`, `disabled`, `focus`, `pressed`).
- **Rules** allow you to create advanced conditional logic, automatically removing or adding classes based on both variants and states.
- **Plugins** let you extend Arto’s behavior or centralize patterns like conflict-linting, responsive breakpoints, or custom logic.

In short, instead of writing tangled logic to dynamically generate class names, you define a concise “styling contract,” and Arto composes the final class string for you.

## Key Features

- **Unified Variants**: Define multiple variant keys (e.g. `size`, `theme`, `align`), each with explicit possible values.
- **Ephemeral States**: Turn booleans like `disabled`, `hover`, or `selected` into user-friendly class toggles.
- **Advanced Rule Engine**: Remove or add classes conditionally, ensuring no conflicting or overshadowed styles.
- **Plugin System**: Incorporate or write custom plugins to handle specialized tasks (e.g., linting conflicting utilities, theming).
- **Type-Safe**: Built with TypeScript to provide typed variants, states, and context.
- **Framework-Agnostic**: Works in any JS/TS environment—React, Vue, Svelte, or vanilla DOM.

## Quick Example

Below is a **minimal** demonstration showing how Arto might handle variants and states. Imagine you have a simple button that can vary by size and color, and sometimes be disabled:

```ts
import { arto } from 'arto'

type ButtonVariants = {
  size: 'small' | 'large'
  color: 'primary' | 'secondary'
}
type ButtonStates = 'disabled'

// Define your "configuration" for the button
const buttonConfig = arto<ButtonVariants, ButtonStates>({
  className: 'inline-flex items-center font-medium transition ease-in-out',
  variants: {
    size: {
      small: 'px-2 py-1 text-sm',
      large: 'px-4 py-2 text-base',
    },
    color: {
      primary: 'bg-blue-500 text-white border-transparent',
      secondary: 'bg-white text-blue-500 border-blue-500',
    },
  },
  states: {
    disabled: 'opacity-50 pointer-events-none',
  },
  defaultVariants: {
    size: 'large',
    color: 'primary',
  },
})

// Use your config in code:
const classString = buttonConfig({
  variants: { size: 'small', color: 'secondary' },
  states: { disabled: false },
})

// The result might be:
// => "inline-flex items-center font-medium transition ease-in-out px-2 py-1 text-sm bg-white text-blue-500 border-blue-500"
```

Instead of manually juggling conditionals for each class, Arto compiles it into a single final string based on your chosen variants (size, color) and states (disabled, etc.).

## Who Should Use Arto?

- **Design System Authors**: You maintain a library of reusable components with consistent theming or styling.
- **Large Codebases**: You want to avoid repeating style logic or setting up complicated class merges across multiple repositories.
- **Utility-First Enthusiasts**: You rely heavily on frameworks like Tailwind CSS and find yourself writing repetitive or conflicting sets of classes.
- **Typescript Fans**: You appreciate the safety and autocompletion that come with typed configurations.

## What’s Next?

Now that you understand why Arto exists and the general problem it solves, the next steps are:

1. [Installation](/getting-started/installation) – Learn how to add Arto to your project using pnpm, npm, or yarn.
2. [Basic Usage](/getting-started/basic-usage) – Step-by-step on how to build your first Arto config.

If you have any questions, head over to our [GitHub repository](https://github.com/hamidelgendy/arto) to open an issue or check out the community discussions!
