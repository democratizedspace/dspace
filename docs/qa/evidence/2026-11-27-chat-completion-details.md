# v3.1.0 Chat waiting and optional response details

On 2026-11-27 UTC, Playwright exercised the local Astro application based on
`abca73db85e726815a0682c00ead05e6e9bfa336` with this change's waiting status
and browser regression (tested Git blobs below). This used Node 24.22.3, frozen
pnpm 9.0.0 dependencies, and Playwright 1.54.2 with Chromium headless shell
139.0.7258.5 (build 1181).

```bash
cd frontend
ASTRO_TELEMETRY_DISABLED=1 DSPACE_ENV=dev DSPACE_DEFAULT_CHAT_PROVIDER=token-place \
  PUBLIC_ENABLE_QUEST_GRAPH_DEBUG=true PLAYWRIGHT_SKIP_INSTALL_DEPS=1 \
  PLAYWRIGHT_PORT=4249 BASE_URL=http://127.0.0.1:4249 \
  npm run test:e2e -- token-place-chat-banners.spec.ts chat-message-flow.spec.ts \
    --project=chromium --workers=2
```

Result: **28 Chromium cases passed** across both specs. All 13 focused
Chat component tests passed separately.

- The test paused the intercepted first retrieval after dispatch. While it was
  pending, the real UI showed a spinner and “Waiting for a reply…”, without an
  error, partial assistant response, or usage. The fixture then released a
  complete encrypted reply; the assistant bubble appeared and the waiting
  status and spinner cleared.
- With prompt debug enabled, the usage row showed the exact counts from the
  decrypted payload (7 prompt, 3 completion, 10 total), ignoring the distinct
  synthetic usage field outside the encrypted envelope. A second successful
  reply without decrypted usage removed the usage row rather than retaining the
  first reply's counts or using the outer field. Source inspection confirms
  the client reads usage from the validated decrypted API response.
- With token-lite enabled, neither reply showed a Sources panel. The existing
  full-context browser case checks the positive path: local grounding sources
  show up when available, and the provider-supplied source label does not.
- This complements the existing proof that the encrypted request cannot set
  `stream: true`. It does not exercise a live relay or deployed candidate,
  qualify provider-side logs, or prove screen-reader announcements.

The new case used only the local origin and encrypted browser fixtures. Astro
printed a sandbox-only network-interface enumeration warning; the local server
remained functional.

Tested spec Git blob: `d1e00c5de2fff51a781547e4c53ef229b780ad94`. Chat panel Git blob: `02a4fb49b08c52d092b775ba8669eee3a8b4aa2d`.
