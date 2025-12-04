# Contributing to DSPACE

Thank you for your interest in helping the project! Below is a quick overview of the workflow used in this repository.

## Getting Started

**Prerequisites**: Node.js 20 LTS or later (required for development dependencies like `cross-env@10`)

1. Fork and clone the repo.
2. Install dependencies:
   ```bash
   pnpm install
   ```
   Husky hooks install automatically; use `npm run ci:install` in CI to skip them.

3. Install additional Git hooks via [pre-commit](https://pre-commit.com/):
   ```bash
   pre-commit install
   ```

## Development Workflow

- Use `npm run dev` to start the game locally.
- Before committing, verify formatting and linting with:
  ```bash
  npm run check
  ```
- The test suite verifies file formatting, so unformatted changes will fail CI.
- The pre-commit hook validates quest and item schemas, runs `lint-staged`, checks from
  `.pre-commit-config.yaml`, `npm run check`, and `npm test`. Run it manually with:
    ```bash
    npm test
    ```
- If Playwright browsers are missing, install them with `npx playwright install chromium` or run `SKIP_E2E=1 npm test`.

### Pre-push Hook Behavior

The pre-push hook runs comprehensive checks before allowing a push:

1. **Code quality checks** (`npm run check`) - linting and formatting
2. **Unit tests** (`npm run test:root`) - vitest tests from repository root (143 tests)
3. **E2E tests** (`npm run test:e2e`) - Playwright browser tests

This matches the CI test jobs to catch issues early. The hook uses `npm run` commands which delegate to `pnpm` for package resolution.

**Note**: The pre-push hook runs `test:root` (without coverage) for faster local checks, while CI runs `coverage` (with coverage collection). Both execute the same test suite.

**Bypassing the hook**: For quick WIP pushes, use `git push --no-verify` to skip the pre-push hook. However, CI will still run all checks, so your PR will fail if tests don't pass.

## Opening a Pull Request

1. Run the full suite before submitting:
   ```bash
   npm test
   ```
   Include `SKIP_E2E=1` only if you cannot run the browsers.
   The CI workflow runs E2E tests and will fail your PR if any of them fail.
2. Update documentation when adding or changing features.
3. Open a PR using the provided template and describe your changes.

See [AGENTS.md](./AGENTS.md) for additional guidelines that automated contributors follow.

We look forward to your contributions!
