# 2025-08-12-list-missing-images-data-protocol

- **Date:** 2025-08-12
- **Component:** scripts
- **Root cause:** listMissingImages flagged data URIs and protocol-relative sources as missing files
- **Resolution:** ignore data and protocol-relative URLs so coverage checks only verify local assets
- **References:**
  - docs/prompts/codex/ci-fix.md#lessons-learned
