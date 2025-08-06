# Contributing to DSPACE

Thank you for your interest in helping the project! Below is a quick overview of the workflow used in this repository.

## Getting Started

1. Fork and clone the repo.
2. Install dependencies:
   ```bash
   pnpm install
   ```
   Husky hooks install automatically. Use `npm run ci:install` in CI to skip them.

## Development Workflow

- Use `npm run dev` to start the game locally.
- Before committing, verify formatting and linting with:
  ```bash
  npm run check
  ```
- The test suite verifies file formatting, so unformatted changes will fail CI.
- The pre-commit hook validates quest and item schemas, runs `lint-staged`, `npm run check`,
  and `SKIP_E2E=1 npm test`. Run it manually with:
    ```bash
    SKIP_E2E=1 npm test
    ```
- If Playwright browsers are missing, install them with `npx playwright install chromium` or set `SKIP_E2E=1`.

## Opening a Pull Request

1. Run the full suite before submitting:
   ```bash
   npm test
   ```
   Include `SKIP_E2E=1` if you cannot run the browsers.
2. Update documentation when adding or changing features.
3. Open a PR using the provided template and describe your changes.

See [AGENTS.md](./AGENTS.md) for additional guidelines that automated contributors follow.

We look forward to your contributions!
