---
title: Installation
---

# Installation

This page covers how to install **Arto** in your project. The library is framework-agnostic and published to npm, so you can use your favorite package manager: `pnpm`, `npm`, or `yarn`.

::: code-group

```bash [pnpm]
pnpm add arto
```

```bash [npm]
npm install arto
```

```bash [yarn]
yarn add arto
```

:::

::: info Good to Know
Arto is developed and tested primarily with pnpm—so if you’re also using pnpm, you’re in luck!
:::

## After Installation

Once you have installed **Arto**, you can import it into any JavaScript or TypeScript file:

```ts
import { arto } from 'arto'

// or, for TypeScript:
import type { ClassName, Plugin } from 'arto'
```

## Peer Dependencies or Extras

Arto has no strict peer dependencies, but if you plan to use it with React or a specific framework, you’ll obviously need them installed. For example:

```bash [pnpm]
pnpm install react react-dom
```

## Next Steps

Continue reading the docs to learn how to integrate Arto into your project and configure it for your needs:

- [Basic Usage](/getting-started/basic-usage) – A quick walk-through of creating your first Arto config.
- [Core Concepts](/core-concepts/variants) – Learn about Variants, States, Rules, and more.
- [API Reference](/api/arto-function) – Dive deeper into advanced usage and plugin systems.
