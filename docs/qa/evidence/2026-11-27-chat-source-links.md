# v3.1 Chat source-link evidence

- Date: 2026-11-27 UTC.
- Tested source: `2b09dc73e03c6f190b1d89d3e4a232be24733dbb` (code and test files);
  parent `82e945821f28a8fffa1e996298b1eadd08570f7f`.
- Environment: local Linux, Node 24.22.3, built Astro app and local Chromium.

The Chat response's Sources used list renders root-relative application destinations
as links. Unsupported destinations remain labeled as text. The focused game-data
producers emit internal process, item, and quest routes. Documentation retrieval
produces application paths with section fragments. Entries such as local game state
remain useful without a destination.

- `node scripts/run-vitest.mjs run --config vitest.config.mts frontend/src/pages/chat/svelte/__tests__`:
  14 passed. The rendered message test checks two internal links with their exact
  destinations and retains the labels without links for external, email, and
  destination-free sources.
- Built with `npm run build` in the local development environment, then ran
  `playwright test chat-rag-context.spec.ts --project=chromium --workers=1 --retries=0`
  from the frontend workspace: 3 passed. The test follows a real documentation source
  from Chat and verifies local navigation. Model responses were stubbed. A sandbox
  network-interface enumeration warning did not prevent the local server or tests
  from running.

This closes the source-level Chat source-link criterion, not a live provider,
staging, or release-candidate gate.
