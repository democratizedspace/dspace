---
title: 'token.place (v3 status)'
slug: 'token-place'
---

# token.place status in v3

token.place support exists in code but is not the default chat path for v3 players.

## Current v3 policy

- v3 ships OpenAI-first chat experience.
- token.place remains feature-gated/opt-in for controlled testing and future rollout.
- Planned broader availability target is post-v3.0 (tracked toward v3.1+).

## Enablement model

token.place can be enabled only via explicit overrides:

1. Environment flags (`VITE_TOKEN_PLACE_ENABLED`, optional `VITE_TOKEN_PLACE_URL`)
2. Saved game-state tokenPlace settings

Environment overrides take precedence over saved state.

## Operator note

Do not assume token.place availability in player-facing docs unless the feature gate policy
changes and this page is updated.

## Related docs

- [v3 Release State](/docs/v3-release-state)
- [Authentication](/docs/authentication)
