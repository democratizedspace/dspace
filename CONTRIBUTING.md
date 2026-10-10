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

## Agent commit identity contract

This is the canonical identity contract for all agents creating commits in this
repository. For new agent-authored commits explicitly authorized on Daniel's
behalf, use exactly **Daniel Smith <80668851+futuroptimist@users.noreply.github.com>**
for both author and committer. This address was confirmed by Daniel; never infer
an email from a login, hostname, machine account, or another repository.

Git author/committer metadata and authentication are separate. A GitHub login,
SSH key, token, or PR opener does not establish the commit author. Do not change
credentials, remote access, or authentication tooling to fix attribution.

Before creating a commit:

1. Confirm the task authorizes a new commit on Daniel's behalf. Other contributors
   use their own verified identity; stop and ask when the intended identity or
   authorization is unclear.
2. Set the identity only in this repository, or supply the same values with
   per-command `git -c user.name=... -c user.email=...` options. Never change global
   Git configuration. From the intended checkout, the repository-local setup is:

   ```bash
   git config --local user.name "Daniel Smith"
   git config --local user.email "80668851+futuroptimist@users.noreply.github.com"
   git config --local user.useConfigOnly true
   ```

3. Verify the effective identity immediately before **every** commit, in the same
   shell and with the same per-command options/environment as the commit:

   ```bash
   git var GIT_AUTHOR_IDENT
   git var GIT_COMMITTER_IDENT
   ```

   Both outputs must begin with
   `Daniel Smith <80668851+futuroptimist@users.noreply.github.com>` followed by Git's
   timestamp and time zone. `git config` alone is insufficient: `GIT_AUTHOR_*`,
   `GIT_COMMITTER_*`, `EMAIL`, command options, and inherited configuration can
   affect metadata. If either identity is unexpected, **stop before committing**,
   identify the override, and re-verify after correcting only the authorized
   task-local settings. Never substitute an invented email or hostname-based
   address to make Git accept a commit.
4. Inspect the resulting commit before pushing:

   ```bash
   git show --no-patch --format=fuller HEAD
   ```

   Stop before pushing if the recorded metadata differs from the intended
   identity. Report the mismatch; do not rewrite existing history without explicit
   authorization.

Preserve real third-party authors and `Co-authored-by` trailers. Cherry-picks,
rebases, and amendments can retain an existing author independently of
`git var GIT_AUTHOR_IDENT`; inspect that source author and the resulting commit.
Never use `--reset-author`, `--author`, or a blanket identity replacement to
relabel contributor commits as Daniel. This contract authorizes no history
rewrite. If an API or signing service controls metadata and cannot satisfy the
intended identity, stop and report that limitation instead of bypassing its
security controls or silently accepting another identity.

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

The pre-push hook runs key checks before allowing a push:

1. **Code quality checks** (`npm run check`) - linting and formatting
2. **Unit tests** (`npm run test:root`) - vitest tests from the repository root

Run `npm run test:e2e` separately when you need browser coverage. CI still runs E2E tests for every
pull request.

**Important:** The pre-push hook uses `npm run` commands. Since this project specifies `"packageManager": "pnpm@9.0.0"` in `package.json`, you should ensure you have `pnpm` installed and use it for package management. The CI workflows use `pnpm` directly, so using `pnpm run` for scripts ensures your environment matches CI exactly.

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
