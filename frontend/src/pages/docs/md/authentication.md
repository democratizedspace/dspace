---
title: 'Authentication Flow'
slug: 'authentication'
---

# Authentication Flow

Most of DSPACE works offline and unauthenticated. Authentication is only required for
GitHub-integrated features.

## Features that require authentication

- `/cloudsync` for gist-backed backup sync
- `/bundles/submit` for custom content submissions
- `/quests/submit` for quest-focused submission flows
- Quest options explicitly gated by `requiresGitHub`

## Token types and minimum scopes

### Cloud Sync

- Scope: `gist` (read/write)

### Submission flows

- Classic PAT: `repo` (and optionally `gist` if reused for cloud sync)
- Fine-grained PAT: repository content + pull request permissions for
  `democratizedspace/dspace`

## Local credential storage

- Credentials are stored in IndexedDB so players do not need to re-enter tokens every session.
- Token values are persisted under game-state credential keys (for example `gameState.github.token`).
- Settings provides Clear and Log out controls that remove saved credentials from the device.

## Security practices

- Use separate tokens for sync and submissions when possible.
- Revoke tokens in GitHub settings if a device is compromised.
- Clear credentials after using shared machines.
- Never paste tokens into quest text, docs markdown, or issue comments.
