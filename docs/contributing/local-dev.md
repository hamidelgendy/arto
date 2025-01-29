---
title: Local Development
---

# Local Development

If you want to hack on Arto directly—whether fixing bugs, adding features, or debugging an issue—this guide explains how the monorepo is structured and how to run everything locally.

## Repository Structure Overview

The **Arto** codebase is organized as a **pnpm workspace**. Key folders:

- **`/packages/arto`**: The main library source code (TypeScript).
  - `src/` – core implementation.
  - `__tests__/` – unit tests.
- **`/examples/`**: Example apps demonstrating usage of Arto in React or other frameworks.
  - `react/` – a small React + Tailwind project to test local changes.
- **`/docs/`**: VitePress documentation for the Arto website.
- **Root-level** scripts in `package.json` for building, testing, etc.

You can navigate around to see how each part fits together.

## Cloning & Installing

Clone your fork (or the main repo):

```bash
git clone https://github.com/<your-username>/arto.git
cd arto
pnpm install
```

We use **pnpm** for package management, and it handles installing for all sub-packages in the workspace.

## Building & Watching

A few handy root scripts exist for building Arto:

```bash
pnpm build    # Builds all packages (including /packages/arto)
pnpm watch    # Watches for changes in packages and rebuilds them (useful for local dev)
```

If you only want to build or watch a single package, you can also target it with filters, e.g.:

```bash
pnpm --filter "./packages/arto" run build
pnpm --filter "./packages/arto" run build --watch
```

## Testing

Arto uses **Vitest** for unit tests:

```bash
pnpm test     # Runs the test suite, collecting coverage
```

If you want to run tests in watch mode (re-run on file changes), you can do:

```bash
pnpm test:watch
```

## Running Local Examples

To see your local changes in action, you can run one of the example apps in `/examples/`. For instance, the React example:

```bash
pnpm --filter "./examples/react" dev
```

This starts a local Vite dev server (by default on `http://localhost:5173`). The example project references your local `/packages/arto` code due to the pnpm workspace symlink. So, any changes you make to Arto’s source (while running `pnpm watch`) will immediately reflect in the example app.

## Editing the Docs

If you plan to modify the docs, you can run:

```bash
pnpm docs:dev
```

Then navigate to the displayed local URL (likely `http://localhost:5173`). Changes to the markdown files in `docs/` are hot-reloaded.

## Typical Workflow

1. **Install & Watch**

   - Run `pnpm install` to set up everything.
   - Run `pnpm watch` in one terminal so Arto recompiles on changes.

2. **Work in the Examples (optional)**

   - In another terminal, `pnpm -F "./examples/react" run dev` to start the dev server.
   - Make changes in `/packages/arto/src`; the example app reloads whenever Arto rebuilds.

3. **Test**

   - In a third terminal, you might do `pnpm test:watch` to see test results in real-time as you code.

4. **Docs** (if you’re updating docs):

   - Run `pnpm docs:dev` to preview doc changes live.

5. **Commit & Push**
   - Ensure lint and tests pass: `pnpm lint && pnpm test`.
   - Use the [conventional commit](https://www.conventionalcommits.org) style for your commit message.
   - Push your branch and open a Pull Request.

## Troubleshooting

- **Install issues**: If you run into problems installing, make sure your **Node** version matches the required version in `package.json`.
- **Symlink confusion**: In rare cases, some editors or tooling might not handle pnpm symlinks well. Restart your editor if you see “missing imports.”
- **Permission errors**: On some systems, you might need to set up husky hooks or fix file permissions (run `chmod +x .husky/*` if needed).

## Summary

- The **pnpm workspace** structure means you can build, watch, and test all or just specific packages.
- **Examples** are the best place to quickly see changes in action.
- **Docs** can be edited and previewed live with `pnpm docs:dev`.
- If you’re unsure about any step, check [Contributing Guide](/contributing/contributing) or open a discussion in GitHub.

Happy coding! 🚀
