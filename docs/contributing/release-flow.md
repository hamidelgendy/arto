---
title: Publishing & Release Flow
---

# Publishing & Release Flow

Arto uses **[Changesets](https://github.com/changesets/changesets)** for versioning and publishes to npm through a CI workflow. This page outlines the manual steps maintainers typically follow for creating a new release, and how the automated process in GitHub Actions handles it.

## Overview of Changesets

**Changesets** is a tool that helps manage package versions, create changelogs, and handle publishing. Each time you introduce a breaking change, feature, or fix in a PR, you can (and should) generate a changeset:

```bash
pnpm changeset
```

This command will guide you through selecting:

- The packages affected
- The type of change (major, minor, or patch)
- A summary for the changelog

The tool then creates a new markdown file in `.changeset/`. After merging, maintainers can combine all pending changesets into a single version bump.

## Release Workflow in CI

Arto’s GitHub Actions configuration has two main workflows:

1. **CI** (checks, tests) – Runs on every PR or push to `main`.
2. **Release** – Triggered automatically when the CI workflow completes successfully on `main` and merges the changes into the codebase.

### Steps in the Release Workflow

1. The `release.yml` job checks out the repo with full history.
2. Installs dependencies via `pnpm install`.
3. Calls `changesets/action` to publish changes:
   - **Changeset** command merges version bumps from all `.changeset/` files.
   - Publishes updated packages to npm if any new versions are generated.
4. GitHub automatically tags the release in your repository and updates the changelog.

## Manual Release Steps (If Needed)

While the CI workflow automates most of this, sometimes you’ll want to do it locally (e.g., for debugging or special cases). The general steps:

1. **Pull Latest Main**  
   Make sure your local `main` is up to date:
   ```bash
   git checkout main
   git pull origin main
   ```
2. **Review Pending Changesets**  
   Check `.changeset/` for any new changeset markdown files.

3. **Version Bump**  
   Run:

   ```bash
   pnpm changeset version
   ```

   This will:

   - Evaluate all pending changesets
   - Increment package versions accordingly
   - Write updated versions to `package.json`, create or update changelog entries

4. **Build & Test**  
   Ensure everything is still working with the newly bumped versions:
   ```bash
   pnpm build
   pnpm test
   ```
5. **Commit & Push**
   After confirming everything is okay, commit the updated `package.json` files, updated changelogs, etc.:
   ```bash
   git add .
   git commit -m "chore(release): version bump"
   git push origin main
   ```
6. **Publish**
   If you want to publish from your local machine (instead of waiting for CI), do:
   ```bash
   pnpm changeset publish
   ```
   This attempts to publish all updated packages to npm. If you have multiple packages (like `arto`), it handles them in a single run.

**Note**: Ensure your local environment is authenticated with npm (`npm login` or `npmrc` with an `NPM_TOKEN`).

## Common Questions

**Q1**: _What if I forgot to create a changeset for a PR?_  
**A**: Open a new PR adding the missing changeset. Or, if the changes are minor, you can also do it in a follow-up commit on `main`.

**Q2**: _How do I handle major vs. minor vs. patch versions?_  
**A**: Changesets prompts you to select if the change is major (breaking), minor, or patch. Follow semantic versioning guidelines:

- **Major**: Breaking changes or significant new features that might break existing usage.
- **Minor**: Backward-compatible new features.
- **Patch**: Bug fixes that don’t break compatibility.

**Q3**: _Where is the changelog stored?_  
**A**: Changesets automatically updates or creates changelog entries in the relevant package directory (e.g., `/packages/arto/CHANGELOG.md`) and also updates a root changelog if configured.

## Tips for Smooth Releases

- **Create changesets in every PR** that affects published packages. This keeps your release process simple—no last-minute scramble.
- **Use patch releases** for small bug fixes, minor releases for new features, and major if you break the API or existing behavior in a significant way.
- **Automate**: Rely on GitHub Actions to do most of the heavy lifting for you. Only do manual steps if absolutely necessary.
- **Communicate**: If you’re releasing a major version, provide clear migration instructions or a summary of breaking changes in the PR or release notes.

## Summary

- Arto uses **Changesets** for versioning and publishing.
- **Automatic CI** handles merging pending changesets and publishing to npm once PRs are merged into `main`.
- In rare cases, you can do a **manual release** locally with `pnpm changeset version` and `pnpm changeset publish`.
- Always **create or update** a changeset for every PR that modifies published packages.

Following these guidelines ensures Arto’s releases remain consistent, well-documented, and properly versioned for all users.
