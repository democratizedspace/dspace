---
title: 'V3 release state'
slug: 'v3-release-state'
---

This page is the authoritative reference for the current DSPACE v3 release state. Use it to
answer "what ships today?" questions without mixing in historical v2 behavior.

## Chat provider reality

- DSPACE v3 ships **OpenAI-only chat** today.
- The token.place integration exists in the codebase but is deferred to **v3.1**, so it is not
  enabled in v3 production. See [/docs/token-place](/docs/token-place) for the integration status
  and deferral timeline.

## v2-only mechanics removed / not applicable in v3

- We've removed all blockchain integration plans in v3, including tokenization-based systems. See
  the v3 changelog entry for the removal rationale in
  [2026-03-01 release notes](/changelog#20260301).
- **Legacy behavior (historical):** v2 stored game state in localStorage under the `gameState`
  key. That localStorage-only persistence model is not current v3 behavior; v3 uses IndexedDB and
  migrates legacy saves. See
  [Legacy saves & storage migrations](/docs/legacy-save-storage#v2-storage-localstorage).
- **Legacy behavior (historical):** v2 introduced experimental Ethereum wallet integration on the
  Wallet page. That experiment is not current v3 behavior. See the historical v2 release notes in
  [2023-06-30 release notes](/changelog#20230630).
