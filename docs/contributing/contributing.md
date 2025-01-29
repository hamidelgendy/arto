---
title: Contributing Guide
---

# Contributing Guide

Thank you for your interest in contributing to **Arto**! Whether you’re fixing a bug, adding a feature, or improving the documentation, we appreciate your efforts to help grow the project. Below are some guidelines and best practices to streamline our collaborative process.

## Getting Started

1. **Fork the Repository**: Click “Fork” on GitHub and clone your fork locally.
2. **Install Dependencies**: Use `pnpm install` (recommended) or `npm install`.
3. **Check Scripts**: Run `pnpm test` or `pnpm run test` to ensure everything is passing initially.
4. **Create a Branch**: For any new feature or fix, create a dedicated branch off `main`. E.g., `git checkout -b feature/my-new-feature`.

## Development Workflow

1. **Code**: Make changes or add files in the relevant package (e.g., `/packages/arto`).
2. **Lint & Format**: We use ESLint + Prettier. You can run:
   ```sh
   pnpm lint
   pnpm lint:fix
   pnpm format
   ```
3. **Test**: Use Vitest to ensure your changes pass existing tests and add new ones if needed:
   ```sh
   pnpm test
   ```
4. **Commit Messages**: We follow **Conventional Commits**. For example:

   - **feat**: add a new feature
   - **fix**: fix a bug
   - **docs**: update documentation
   - **chore**: non-code changes (config, tooling)
   - **refactor**: code changes that neither fixes a bug nor adds a feature

   Your commit messages should look like:

   ```sh
   feat(rules): add new 'implies' operator for advanced logic
   ```

5. **Pull Request**: Push your branch to GitHub and open a pull request (PR) against `main`. Fill out the PR template, linking any related issues.

## Running the Docs Locally

If you want to update documentation or add a new page, run:

```sh
pnpm docs:dev
```

This spins up a local VitePress server at `http://localhost:5173` (or similar), where you can preview your doc changes live.

## Testing Tips

- **Unit Tests**: Make sure each function or plugin is covered by relevant tests in `__tests__`.
- **Integration or E2E**: For more complex changes, we might set up an example or a playground in `/examples` to verify everything works end-to-end.
- **Snapshot Tests**: If your change modifies a large set of classes, update the relevant snapshot.

## Code Style and Structure

- **TypeScript**: Arto’s core is written in TypeScript. Keep new files typed whenever possible.
- **Directory Layout**:
  - `/packages/arto/src` is the main source code.
  - `/packages/arto/__tests__` is where unit tests live.
  - `/examples` contains example implementations for different frameworks.
- **ESLint + Prettier**: Ensure you run `pnpm lint` and `pnpm format` before pushing code.

## Submitting a Pull Request

- [x] **Commit** your changes following [conventional commit](https://www.conventionalcommits.org) guidelines.
- [x] Ensure your branch is **rebased** or **merged** with the latest `main`.
- [x] Provide a **descriptive title** and summary in the PR template.
- [x] If you added or changed functionality, **add or update documentation** accordingly.
- [x] If any published packages are changed, create or update a [Changeset](https://github.com/changesets/changesets) by running `pnpm changeset`.
- Wait for reviews from maintainers or other community members. Address feedback promptly.

## Release Flow

We use **[Changesets](https://github.com/changesets/changesets)** for versioning:

1. After merging PRs, maintainers run `pnpm changeset version` to bump version numbers.
2. CI will handle publishing to npm after everything is validated and the changes are reviewed.
3. You can watch GitHub Actions for confirmation that your changes deployed successfully.

## Code of Conduct

Please note we abide by a simple Code of Conduct:

- Be respectful and constructive in all discussions or code reviews.
- Keep an open mind to alternative approaches or suggestions.

We want to maintain a friendly, collaborative environment for everyone involved.

## Thank You

Your contributions keep **Arto** evolving and improving. We appreciate every PR, issue report, and idea. If you have any questions about the process, just open a discussion or ask in the PR—our community is here to help!
