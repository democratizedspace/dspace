---
title: 'token.place Integration'
slug: 'token-place'
---

DSPACE plans to support the [token.place](https://token.place) API for in-game AI features like
chat in v3.1. The `tokenPlaceChat` utility is wired for the upcoming integration, but the
token.place API v1 is not live yet, so v3 ships with OpenAI as the only active provider.

The API endpoint defaults to `https://token.place/api`, but token.place stays **disabled by
default** to keep staging and local builds on OpenAI until the v3.1 rollout.

When token.place v1 launches, you will be able to opt in in two ways:

- **Environment variable**: set `VITE_TOKEN_PLACE_ENABLED=true`. You can also point to a custom URL
  with `VITE_TOKEN_PLACE_URL`.
- **Game settings**: save `tokenPlace.enabled=true` in your game state (for example, via a settings
  screen that toggles the integration). Optionally pair this with a custom `tokenPlace.url`.

```bash
VITE_TOKEN_PLACE_ENABLED=true VITE_TOKEN_PLACE_URL=https://my-token-place/api npm run dev
```

You can clear the saved URL (or the opt-in flag) by resetting your game state.

`tokenPlaceChat` accepts an optional `AbortSignal` and throws a descriptive error when the
service returns one, making failures easier to diagnose.
