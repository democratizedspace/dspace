# v3.1.0 local Chat input methods

On 2026-11-25 UTC, the five new `Chat compose input methods` cases in
[chat-message-flow.spec.ts](../../../frontend/e2e/chat-message-flow.spec.ts)
passed in Playwright against a locally built Astro preview. The application source was
`54401e729dedc0fb97e8991c9a57de6d0cea3108`; the included spec's Git blob was `8587567e9d28440b8dfe9b60e0bd7aaa877eed77` and
the runtime composer, including its accessible-name fix, was
`37961cfd6aa69ab3266440036e0d3092b3645e6d`. The runner used Node 24.22.3, the
frozen pnpm 9.0.0 lockfile, Playwright 1.54.2, and its pinned Chromium headless shell
139.0.7258.5 (build 1181).

With that browser already installed, the focused repository command was:

```bash
cd frontend
ASTRO_TELEMETRY_DISABLED=1 DSPACE_ENV=dev PUBLIC_ENABLE_QUEST_GRAPH_DEBUG=true \
  NODE_OPTIONS=--max-old-space-size=576 node scripts/ensure-astro-build.mjs
ASTRO_TELEMETRY_DISABLED=1 PUBLIC_ENABLE_QUEST_GRAPH_DEBUG=true \
  NODE_OPTIONS=--max-old-space-size=576 PLAYWRIGHT_SKIP_INSTALL_DEPS=1 \
  PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 PLAYWRIGHT_PORT=4275 \
  BASE_URL=http://127.0.0.1:4275 DSPACE_ENV=dev \
  npm run test:e2e -- chat-message-flow.spec.ts \
    --grep 'Chat compose input methods' --project=chromium --workers=1
```

Result: **5 passed**.

- The browser resolved the real textarea by its accessible name, **Chat message**.
- In the real Chat textarea, Shift+Enter inserted a newline without submitting,
  and Enter submitted exactly one two-line user message and displayed a fixture reply.
- Keyboard Home/End changed the persona value and displayed a different persona
  summary. In Settings, keyboard arrows switched providers in both directions and
  the saved-setting status reported the selected provider after each switch.
- At 360px and 390px with emulated touch, tapping Send submitted the message,
  cleared the textarea, and displayed the fixture reply.

The browser tests blocked cross-origin requests and used a synthetic OpenAI
credential and client fixture. These are local input and UI checks, not provider
integration, physical-device compatibility, visible-focus or screen reader coverage,
or validation of any deployed candidate. The preview server logged a sandbox-only
network-interface enumeration error while listening; the local server and all five browser
cases remained functional.
