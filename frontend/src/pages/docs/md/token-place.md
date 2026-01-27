---
title: 'token.place Integration'
slug: 'token-place'
---

DSPACE v3 ships with OpenAI as the active AI provider. Support for the
[token.place](https://token.place) API is planned for v3.1 once the token.place v1 API is
available.
Historical changelog entries may still mention token.place activation; the integration remains
planned for v3.1.

When v3.1 lands, the API endpoint will default to `https://token.place/api` and the integration
will remain **disabled by default** to keep staging and local builds on OpenAI unless you
explicitly opt in.

Planned opt-in paths for v3.1:

- **Environment variable**: set `VITE_TOKEN_PLACE_ENABLED=true`. You can also point to a custom URL
  with `VITE_TOKEN_PLACE_URL`.
- **Game settings**: save `tokenPlace.enabled=true` in your game state (for example, via a settings
  screen that toggles the integration). Optionally pair this with a custom `tokenPlace.url`.

```bash
VITE_TOKEN_PLACE_ENABLED=true VITE_TOKEN_PLACE_URL=https://my-token-place/api npm run dev
```

You can clear the saved URL (or the opt-in flag) by resetting your game state.

The `tokenPlaceChat` utility is wired for the upcoming integration and will accept an optional
`AbortSignal` plus surface descriptive service errors once the provider is enabled.
