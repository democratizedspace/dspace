# v3.1 documentation and manifest runtime environment-name audit

## Identity and acceptance boundary

- Source: [`06bf0caa363302c59338b4a34d43bad4836bdac5`](https://github.com/democratizedspace/dspace/commit/06bf0caa363302c59338b4a34d43bad4836bdac5), inspected November 1, 2026, in an isolated assistant-cloud Linux worktree.
- Tools: Node 24.22.1, pnpm 9.0.0 with frozen dependencies reused offline from the same lockfile, and official checksum-verified Helm 3.12.3. Lockfile SHA256: `baf3657d87634e1386d5480eac4e73f5c99b93c0f427d355001e0d32effc0379`.
- Closes only QA section 3's source/documentation criterion: **Docs, manifests, and deployment notes do not introduce alternate env names for the URL or model.** No application or manifest changes are needed.
- This is not a deployed configuration audit, immutable-image promotion, model-availability check, staging result, or broader source-hygiene pass. The adjacent model/default and image-promotion gates remain unchecked. The separate current-default wording correction in [PR #4861](https://github.com/democratizedspace/dspace/pull/4861) is not assumed merged into this source.

## Repository-wide inventory

Ran the following against the pinned commit, not generated or untracked build artifacts:

```bash
git grep -n -E '\b[A-Z0-9_]*TOKEN_?PLACE[A-Z0-9_]*\b' \
  06bf0caa363302c59338b4a34d43bad4836bdac5 -- .
```

Reviewed all 177 matching lines across tracked files, including documentation, public docs, workflow/deployment instructions, runtime source, tests, and scripts. This whole-repository search also covers both chart trees, `deploy`, `infra`, Docker/Compose files, and environment templates without treating a legacy chart as release evidence.

The environment-name and prefixed identifier matches fall into these categories:

| Identifiers                                                               | Classification and result                                                                                                                                                                                                                        |
| ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `DSPACE_TOKEN_PLACE_URL`, `DSPACE_TOKEN_PLACE_CHAT_MODEL`                 | The canonical deployment-time URL/model override names. `runtimeEndpoints.ts` reads them and passes them to the token.place helpers. `docs/config.md`, public token.place docs, the November draft, and v3.1 design/QA guidance use these names. |
| `VITE_TOKEN_PLACE_URL`, `VITE_TOKEN_PLACE_CHAT_MODEL`                     | Approved local/build fallback names read by `tokenPlace.js`, including its `process.env` fallback; these are not additional canonical deployment override names. Public/config docs explicitly distinguish them from the runtime overrides.      |
| `DSPACE_EXPECTED_TOKEN_PLACE_ORIGIN`, `DSPACE_EXPECTED_TOKEN_PLACE_MODEL` | Smoke-harness assertions in the operator runbook, workflow, harness, and tests. They specify expected observations; they do not configure the application's provider origin or model.                                                            |
| `VITE_TOKEN_PLACE_BASE_URL`, `VITE_TOKEN_PLACE_MODEL`                     | Appear only in the QA audit expression and forbidden-name criterion, not as configuration instructions or runtime readers.                                                                                                                       |
| `VITE_TOKEN_PLACE_ENABLED`                                                | Historical v3.0.1/planning context, explicit legacy-removal guidance, the audit/negative criterion, and compatibility tests. It is neither a URL/model override nor an active runtime env reader.                                                |
| `ORIGINAL_TOKEN_PLACE_URL`, `ORIGINAL_TOKEN_PLACE_MODEL`                  | Test-local constants retaining/restoring the canonical runtime variables, not environment-variable names.                                                                                                                                        |
| `DEFAULT_TOKEN_PLACE_OUTPUT_RESERVATION_TOKENS`                           | Internal context-estimation constant and tests, not a URL/model environment variable.                                                                                                                                                            |

The broader expression also includes unprefixed `TOKEN_PLACE_*` identifiers: `TOKEN_PLACE_CONTEXT_EXACT_TOKENIZER_MODULE` is a benchmark-only module selector; the other matches are internal API-v1 message limits, context-estimator constants, relay timeout/retry constants, and proxy payload/operation allowlists. They introduce no application URL/model override. The benchmark module selector is read by `scripts/benchmark-token-place-context.mjs`, not the runtime provider configuration.

The remaining legacy model **value** wording in the pinned design is separate from this **name** contract and remains covered by PR #4861. This audit does not claim all user-facing wording or all broader section 12 residuals are reconciled.

## Manifest inspection and local rendering

`charts/dspace/values.yaml` has an empty generic `env` list. The canonical deployment template serializes supplied entries without renaming them; ConfigMap/Secret sources are likewise generic. No tracked deployment manifest introduces a second token.place URL/model variable spelling. This does not mean templates reject arbitrary operator-provided keys or prove what a cluster actually runs.

Rendered the canonical chart locally with non-secret example values:

```bash
helm template dspace charts/dspace \
  --set-string 'env[0].name=DSPACE_TOKEN_PLACE_URL' \
  --set-string 'env[0].value=https://staging.token.place' \
  --set-string 'env[1].name=DSPACE_TOKEN_PLACE_CHAT_MODEL' \
  --set-string 'env[1].value=qwen3-8b-instruct'
```

The output contains each supplied runtime name exactly once with its unchanged value and no forbidden alternate URL/model name. This renders local source only; no chart package was published, cluster queried, or configuration changed. The chart's default image tag is not validated as a November candidate by this test.

## Validation

At 09:49 UTC on November 1, 2026, after local process/build metadata and docs-RAG generation:

```bash
node scripts/run-vitest.mjs run --config vitest.config.mts --maxWorkers=1 \
  tests/runtimeConfig.test.ts tests/qaDocsContentAlignment.test.ts \
  tests/middlewareRuntimeEndpoints.test.ts tests/configConsistency.test.ts \
  tests/helmChartMetrics.test.ts tests/helmChartChatProvider.test.ts
npm run type-check
node scripts/link-check.mjs
```

All **93 tests in six files passed**, including runtime configuration and SSR propagation tests, documentation-name guards, configuration consistency, and canonical chart tests. Type-check and all local Markdown links passed. Tests used a process-local loopback-only Node socket guard; provider/endpoint behavior in these suites is mocked, not live service evidence. The local chart-render assertions above passed separately. Both changed Markdown files and `git diff --check` pass formatting/whitespace checks.

The full `SKIP_E2E=1 npm test` aggregate passed at 09:55 UTC: 333 root test files / 2,208 tests, 19 additional quest regressions, hardening and docs-RAG validation, frontend lint, and frontend formatting. E2E was explicitly not run because browser tooling was not installed. No frontend build, local browser flow, packaged artifact, or live/deployed check is claimed for this milestone. Only the environment-name source criterion is closed; no other checkbox or release gate is changed.
