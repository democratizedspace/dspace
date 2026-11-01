# v3.1 model-default design documentation reconciliation

## Identity and scope

- Source inspected: [`06bf0caa363302c59338b4a34d43bad4836bdac5`](https://github.com/democratizedspace/dspace/commit/06bf0caa363302c59338b4a34d43bad4836bdac5), cloned from main on November 1, 2026.
- Environment: isolated assistant-cloud Linux checkout, Node 24.22.1 (compatible with the repository's `>=22.23.4` requirement), pnpm 9.0.0, frozen dependencies. Lockfile SHA256: `baf3657d87634e1386d5480eac4e73f5c99b93c0f427d355001e0d32effc0379`.
- Scope: correct current-default statements and the active envelope example in `docs/design/token-place-chat-v3.1.md`, and distinguish the current provider contract from obsolete frontend compatibility handling. No application, test, dependency, configuration, artifact, changelog, or deployment changes.
- This supersedes only the design-default discrepancy noted in the historical October 31 source/docs evidence. Those records retain their original claims and identities. No QA checkbox is newly checked: broader source-hygiene, configuration, candidate, staging, and deployment criteria remain open.

## Current provider contract and source comparison

- On November 1, 2026, Daniel clarified that token.place currently uses API v1 with only `qwen3-8b-instruct`; the previous API v1 Llama model is no longer supported. DSPACE is selecting from a list of one, which is API conformance rather than meaningful model choice.
- The [token.place landing-page API documentation](https://token.place/) inspected on November 1 identifies API v1 as the active production API and shows Qwen as the single model in its model-list example and encrypted request example. This public documentation corroborates the owner clarification; it is not a live model-catalog query or successful inference test. No provider request was executed for this correction.

- `frontend/src/utils/tokenPlace.js` defines `DEFAULT_CHAT_MODEL = 'qwen3-8b-instruct'`. `getTokenPlaceChatModel` uses explicit model, runtime model, and `VITE_TOKEN_PLACE_CHAT_MODEL` overrides before that fallback.
- `frontend/src/utils/runtimeEndpoints.ts` obtains the configured model using `getTokenPlaceChatModel`, with `DSPACE_TOKEN_PLACE_CHAT_MODEL` as the runtime override.
- Public `frontend/src/pages/docs/md/token-place.md`, QA section 3, and the current candidate commands in `docs/ops/sugarkube-release.md` agree on Qwen. The runbook's historical Llama command is not current-provider guidance and is not changed by this PR.
- Frontend relay-selection validation accepts either the requested model or explicit legacy Llama-to-Qwen metadata. Its effective model is used for selection validation; it does not replace the requested model in the encrypted envelope. `frontend/__tests__/tokenPlace.test.js` covers this with mocks, including the retained Llama request identifier. This is obsolete client compatibility behavior, not proof of provider acceptance or a supported operator option. Removing it would require separate application/test work; the active default is already Qwen.
- The design's active envelope example, API semantics, deployment guidance and test-plan wording now use Qwen and explicitly reject interpreting legacy handling as current Llama support. No live request success is inferred from source, documentation or mocked tests.

## Original producer validation (before the provider-contract correction)

The following results were recorded by the original cloud producer for commit `47426d276c9aeb3bc38d2b9843865bdfa62956b4`. They remain historical validation of that patch, not a rerun of the subsequent documentation correction or independent reviewer/owner sign-off.

Executed November 1, 2026, starting at 09:17 UTC, after regenerating the repository's local process/build metadata and docs RAG prerequisites:

```bash
node frontend/scripts/build-processes.mjs
npm run build:meta
npm run build:docs-rag
node scripts/run-vitest.mjs run --config vitest.config.mts --maxWorkers=1 \
  tests/runtimeConfig.test.ts tests/qaDocsContentAlignment.test.ts \
  frontend/__tests__/tokenPlace.test.js
ASTRO_TELEMETRY_DISABLED=1 npm --prefix frontend run build
node scripts/link-check.mjs
```

The focused tests passed **137/137** (104 token.place client, 26 runtime configuration, 7 documentation alignment); the frontend production-mode SSR build passed; all local Markdown links resolved. Tests and build used a process-local Node socket guard rejecting non-loopback connections. Provider traffic in unit tests is mocked; no live model availability, browser interaction, or deployment configuration is established.

The QA checklist and new evidence record pass the repository-selected Prettier check. The design file passes the frontend-configured Prettier check, but both its unchanged base and edited version fail the root-configured whole-file check on existing formatting. The narrow correction leaves that unrelated formatting unchanged rather than mixing a broad reformat into this milestone. `git diff --check` passes and all checklist checkbox lines are unchanged.

Initial preparation attempts failed on missing generated build metadata and read-only default tooling/telemetry cache locations. Generating the required metadata, using writable `/tmp` caches, and disabling build telemetry resolved those setup failures without modifying tracked application or dependency files. The frozen lockfile hash remained unchanged.

The full non-browser aggregate `SKIP_E2E=1 npm test` passed at 09:28 UTC: **333 files / 2,208 root tests**, the additional **19 quest regression tests**, hardening validation, docs RAG validation, frontend lint, and frontend formatting. The first aggregate attempt failed 12 Helm tests because Helm was absent; installing the repository-pinned Helm 3.12.3 from `get.helm.sh` into `/tmp` with its official SHA256 checksum resolved that tooling prerequisite. Both targeted Helm files then passed 13/13, followed by the successful complete aggregate rerun. No failing check was skipped to obtain that result. E2E was explicitly skipped because browsers were not installed; this is not a full browser-suite pass. `npm run type-check` also passed. After the evidence update, the 7 documentation-alignment tests passed again. No browser, live-service, staging, production, artifact-promotion, or owner-sign-off evidence is claimed.

## Provider-contract correction validation

On November 1, 2026, the Windows publication checkout applied the documentation correction on top of `47426d276c9aeb3bc38d2b9843865bdfa62956b4`. Local validation used Node 22.23.4 and pnpm 9.0.0 with a frozen install (`--ignore-scripts`); the lockfile hash above remained unchanged. After generating local process metadata, `qaDocsContentAlignment` and `qaDocsLinkFreshness` passed **9/9**. Local Markdown links resolved, QA/evidence formatting and frontend-configured design formatting passed, and `git diff --check` was clean. All 189 checkbox lines remain unchanged. These focused checks do not rerun the original aggregate/build or establish browser, provider-request, staging or deployed behavior. Final-head CI is separate evidence available on PR #4861.

The environment-name criterion in PR #4862 is independent of this model-value/support correction. Neither PR establishes live provider acceptance or deployed model configuration.
