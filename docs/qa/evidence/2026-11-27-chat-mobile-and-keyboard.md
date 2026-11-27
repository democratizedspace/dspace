# v3.1.0 Chat keyboard focus and mobile layout

On 2026-11-27 UTC, Playwright tested the locally built Astro application at
`abca73db85e726815a0682c00ead05e6e9bfa336` with no runtime code changes.
The added [browser spec](../../../frontend/e2e/chat-accessibility.spec.ts)
(see tested Git blob below) used Node 24.22.3, frozen pnpm 9.0.0 dependencies,
and Playwright 1.54.2 with Chromium headless shell 139.0.7258.5 (build 1181).

With the pinned browser installed:

```bash
cd frontend
ASTRO_TELEMETRY_DISABLED=1 DSPACE_ENV=dev DSPACE_DEFAULT_CHAT_PROVIDER=token-place \
  PUBLIC_ENABLE_QUEST_GRAPH_DEBUG=true PLAYWRIGHT_SKIP_INSTALL_DEPS=1 \
  PLAYWRIGHT_PORT=4248 BASE_URL=http://127.0.0.1:4248 \
  npm run test:e2e -- chat-accessibility.spec.ts --project=chromium --workers=2 --repeat-each=3
```

Result: **9 passed** (three cases, each run three times).

- Keyboard Tab and arrow navigation reached the persona selector, enabled Send
  button, both provider radios, and OpenAI password field. Each control was in
  the viewport and showed a nontransparent, nonzero outline in its keyboard
  focus-visible state.
- At 360px and 390px CSS viewport widths with touch capability enabled, a
  stubbed token.place network error and a real local OpenAI missing-key
  banner stayed within the viewport. The provider descriptions and the
  token.place no-credential note wrapped without horizontal overflow.
  The OpenAI banner linked to Settings within the same origin.
- Provider selection and rendering used the real local UI. The relay lookup
  was intercepted and failed locally; no request reached either live provider.

This is local Chromium evidence, not physical-device, screen-reader, exhaustive
contrast, live provider, or deployed-candidate validation. Astro printed a
sandbox-only network-interface enumeration warning; the loopback preview
remained functional.

Tested spec Git blob: `e61f8506f5368e3bcd4f0b17bb0fffb4e2ed3d5b`.
