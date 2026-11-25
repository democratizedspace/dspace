# Chat composer accessible name

- Date: 2026-11-25 UTC.
- Tested source: base commit `54401e729dedc0fb97e8991c9a57de6d0cea3108`, with
  the composer fix and its regression test (Git tree
  `7a447a0faf6cfc2766f932fce3ff2666c018263a`, before this evidence and the checklist
  edit).
- Environment: local Linux, Node.js 24.22.3, pnpm 9.0.0 frozen workspace
  dependencies, Vitest 3.2.4/jsdom, mocked provider and fetch, no network egress.
- Procedure: generate local metadata and RAG fixtures with `npm run build:meta`
  and `npm run build:docs-rag`, then run:

  ```bash
  unshare -Urn node scripts/run-vitest.mjs run -c vitest.config.mts \
    frontend/tests/openAIChatErrorMessages.test.ts
  ```

- Result: with the new test and original component, the textarea's accessible
  name was empty; the new assertion failed and both existing tests passed.
  With the fix, Testing Library resolves a textbox named **Chat message** and
  verifies it is the actual textarea. All three tests passed.
- Scope: this verifies the textarea's accessible name, not keyboard behavior,
  focus appearance, mobile layout, screen-reader usability, or a staging
  deployment.
