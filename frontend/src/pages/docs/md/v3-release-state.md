---
title: 'v3 release state'
slug: 'v3-release-state'
---

# v3 release state

## Chat provider reality

DSPACE v3 ships **OpenAI-only chat**. The token.place integration exists in code but is disabled by
default because the token.place API v1 is not yet live in production. As a result, token.place is
explicitly deferred to v3.1. See the token.place integration doc for the current status and
configuration details: [/docs/token-place](/docs/token-place).

## v2-only mechanics removed / not applicable in v3

- **Legacy v2 save format is deprecated for v3 runtime.** v2 stored game state in localStorage
  (for example, `gameState` / `gameStateBackup`), while v3 uses IndexedDB and explicitly cleans up
  v2 localStorage during v2 → v3 migrations. This means the v2 localStorage format is
  migration-only and not a v3 runtime mechanic. See the v2/v3 storage and cleanup notes in the
  legacy saves
  doc. (/docs/legacy-save-storage)
- **Legacy behavior (historical):** the v2 release notes describe the experimental **dChat**
  feature. Treat that as historical v2-only behavior, not current v3 functionality. See the v2
  release notes. (/changelog#20230630)
- **Legacy behavior (historical):** the v2 release notes describe an experimental **Ethereum
  wallet integration**. Treat that as historical v2-only behavior, not current v3 functionality.
  See the v2 release notes. (/changelog#20230630)
