# 2025-08-12-pnpm-package-manager-semver

- **Date:** 2025-08-12
- **Component:** build
- **Root cause:** package.json used pnpm@9 without full semver, so corepack blocked installs
- **Resolution:** updated package.json to pin pnpm@9.0.0 and added a test to enforce semver
- **References:**
  - README.md#local-development
