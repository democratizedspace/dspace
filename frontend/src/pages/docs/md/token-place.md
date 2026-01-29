---
title: 'token.place Integration'
slug: 'token-place'
---

DSPACE ships with a token.place integration for in-game chat, but it is **disabled by default**.

## How it works

- The chat client calls `tokenPlaceChat` (see `frontend/src/utils/tokenPlace.js`), which posts to
  `${baseUrl}/chat` and returns the `reply` field from the JSON response.
- The default base URL is `https://token.place/api` (`DEFAULT_URL` in
  `frontend/src/utils/tokenPlace.js`).
- The integration is enabled only when an explicit opt-in flag is set via
  `isTokenPlaceEnabled`.

## Opt-in options

Token.place can be enabled in two ways:

- **Environment variable**: set `VITE_TOKEN_PLACE_ENABLED=true`. You can also point to a custom URL
  with `VITE_TOKEN_PLACE_URL`.
- **Game state**: persist `tokenPlace.enabled=true` in saved game state. Optionally pair this with
  a custom `tokenPlace.url`.

```bash
VITE_TOKEN_PLACE_ENABLED=true VITE_TOKEN_PLACE_URL=https://my-token-place/api npm run dev
```

The environment flag takes precedence over game state (see `getEnabledOverride` and
`isTokenPlaceEnabled` in `frontend/src/utils/tokenPlace.js`). If you set
`VITE_TOKEN_PLACE_ENABLED=false`, token.place stays disabled even if game state is enabled. When
enabled, the URL preference order in `tokenPlaceChat` is `tokenPlace.url` (game state), then
`VITE_TOKEN_PLACE_URL`, then the default URL.

You can clear the saved URL (or the opt-in flag) by resetting your game state.
