# v3.1 optional chat proxy operator-runbook evidence

## Scope and source

- Source reviewed/tested: [`ec9c3cb7edfe20661ce6bd6a6db77d10a5d36666`](https://github.com/democratizedspace/dspace/commit/ec9c3cb7edfe20661ce6bd6a6db77d10a5d36666), fetched from main on November 1, 2026.
- Execution: November 1, 2026, 03:23–03:25 UTC, isolated assistant-cloud Linux checkout, Node 22.23.4 and pnpm 9.0.0. Existing frozen dependencies retained the unchanged lockfile SHA256 `baf3657d87634e1386d5480eac4e73f5c99b93c0f427d355001e0d32effc0379`.
- Change: add explicit optional-proxy and visibility-limit guidance to the [operator monitoring runbook](../../ops/monitoring_setup.md#v31-chat-metrics-optional-proxy-and-visibility-limits). No application code, configuration, credential, chart, dependency, or deployment changes.

## Acceptance and remaining boundary

**Completed:** the conditional documentation requirement in QA section 11.2a. The runbook explicitly describes the proxy as optional/default-disabled when a trusted header-injection entry point has not been configured, lists all five configuration gates, and states ordinary browser navigation does not activate it. It distinguishes configuration availability from an authorized session and warns not to serialize the shared value into client-accessible surfaces.

This closes a documentation obligation, **not** a factual claim about whether production currently has header injection. No production configuration was read or changed, and no live session was created.

**Partial only:** the adjacent browser-held OpenAI traffic criterion stays unchecked. The runbook now explicitly documents that local-key traffic bypasses the DSPACE proxy and is excluded from server metrics, and explains why counters do not cover all player chat activity. Source inspection supports that description, but this milestone did not perform a browser-key routing or deployed-network verification. Documentation alone does not close the combined behavior criterion.

All other authorization, secret non-exposure, Redis enforcement, metrics, browser, staging, production, and release gates remain unchanged. The broader source-hygiene audit and model/documentation mismatch also remain open.

## Source inspection

- `frontend/src/utils/runtimeEndpoints.ts` derives `relayProxyAvailable` from the complete authorization configuration.
- `frontend/src/utils/openAI.js` excludes browser-held keys from `shouldUseServerChatProxy`; the serialized proxy request does not carry an API key or game state. This is source inspection, not fresh browser observation.
- `frontend/src/pages/api/chat.ts` requires the signed session, rejects sensitive OpenAI proxy payloads, and uses separately configured server credentials only for its server-key path.
- `docs/design/observability-v3.1.md` defines optional activation, server-observed outcomes, completion limitations, and the exclusion of local-key traffic. The operator runbook now carries those operational cautions instead of requiring operators to discover them only in design/QA docs.

## Offline validation

```bash
node scripts/run-vitest.mjs run --config vitest.config.mts --maxWorkers=1 \
  tests/runtimeConfig.test.ts tests/metricsFallback.test.ts \
  tests/qaDocsContentAlignment.test.ts
node scripts/link-check.mjs
cd frontend
../node_modules/.bin/prettier --check ../docs/ops/monitoring_setup.md \
  ../docs/qa/v3.1.md ../docs/qa/evidence/2026-11-01-proxy-runbook.md
```

The three focused files passed **42 tests, zero failures**. The tests exercise runtime configuration gates and mocked server-side metrics/proxy boundaries; their in-memory provider/Redis substitutes do not establish live behavior. The tests ran with a process-local socket guard rejecting non-loopback connections; no real provider or Redis service was contacted. All local Markdown links resolved. Formatting and `git diff --check` passed.

No browser, full production build, full test suite, live scrape, staging, or production validation was performed for this documentation-only milestone. Required PR CI and review remain separate from this local record.
