---
title: 'token.place Integration'
slug: 'token-place'
---

DSPACE is preparing support for the [token.place](https://token.place) API in a follow-up
v3.1 release. The integration code (`tokenPlaceChat`) is in place, but the token.place API v1
endpoint is not live yet, so v3 ships with OpenAI as the only supported provider.

When token.place v1 launches, the endpoint will default to `https://token.place/api`. Until the
v3.1 rollout, token.place remains disabled in staging and local builds to avoid pointing at a
nonexistent service.

Once v3.1 is available, you will be able to enable token.place in two ways:

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
