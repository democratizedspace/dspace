# Offline frontend build evidence — November 2, 2026

## Scope and source

This record supports only section 12's literal **“Frontend build passes”** criterion.
It does not establish a deployed candidate, published artifact, browser behavior, clean console,
live provider compatibility, staging result, or release-owner approval.

Clean input source: `17095458339fb2d9392f3ce8214e2d2719aaf0e3` (main, merged hotfix-smoke-contract
PR #4865). The working tree was clean before and after the build and focused tests. Only this
evidence and the checklist documentation change afterward. The open #4866 local-contract proposal
is not an input, and its three proposed checklist closures are not repeated here. The separately
prepared canonical-scrape evidence is also not an input or duplicated by this milestone.

Environment: Windows, cached Node **22.23.4**, cached pnpm **9.0.0**, repository Astro **7.4.4**.
No new tooling was installed. Repository dependencies were populated from the existing local cache
with `pnpm install --offline --frozen-lockfile --ignore-scripts --reporter=append-only`.
The unchanged lockfile SHA256 is
`baf3657d87634e1386d5480eac4e73f5c99b93c0f427d355001e0d32effc0379`.

## Commands and isolation

The existing cached Node executable was placed first on the task process's `PATH`. npm's existing
CLI was invoked through that Node executable so nested build commands used the compatible runtime;
no global configuration or installed software was changed. `$qaNode` and `$npmCli` below identify
those existing executable/script paths.

```powershell
# Repository root; all Node processes inherit the task-local outbound guard.
$guardPath = (Resolve-Path '..\api-contract-socket-guard.cjs').Path
$env:NODE_OPTIONS = "--require=$guardPath"
& $qaNode scripts/write-build-meta.mjs
& $qaNode scripts/build-docs-rag-index.mjs

# The checklist's frontend npm build, including its prebuild lifecycle.
Set-Location frontend
$env:NODE_ENV = 'production'
$env:ASTRO_TELEMETRY_DISABLED = '1'
& $qaNode $npmCli run build
```

The previously inspected task-local guard wraps `net.Socket.prototype.connect`, allows only
loopback TCP and local pipe IPC, and throws before other TCP connections. A preflight assertion
that `net.connect({host: 'token.place', port: 443})` throws the guard error passed before the build.
Guard SHA256: `dfa348dd08d1b94c6b93d29a74ebc86a4e6253dfc51bdbd8a3314cbff1ccb305`.
No live relay, cluster, or other service was contacted; no preview/server was started.
No tooling/database update suggested by warnings was run.

The build metadata script recorded the exact source revision above with source `git` and timestamp
`2026-11-02T07:32:37.792Z`; docs-RAG preparation generated 824 chunks. These are ignored build inputs,
not changes to tracked implementation. The metadata is not a published image/digest record.

## Results

The frontend `prebuild` and `build` scripts exited **0**. Astro reported, at
**2026-11-02 07:33:45 UTC** (23:33:45 local time on November 1):

```text
[build] output: "server"
[build] mode: "server"
[build] adapter: @astrojs/node
[build] Server built in 21.85s
[build] Complete!
```

`frontend/dist/server/entry.mjs` exists, is **1,232,943 bytes**, and has SHA256
`4064b14cb25d670bb17fcba38de537a0d9e945f303c83473e36f6865225183fe`.
This identifies one local output file, not an OCI image, chart, release package, or full artifact
digest. No reproducible cross-platform byte identity is claimed. The retained local build-log
SHA256 is `1810ad46ec62cc078c75214170cfc8b3502efef48ab9acc749b0ebc3d9ee261a`.

The log includes unsupported-file warnings for support/content files under `src/pages` and a
Browserslist notice that `caniuse-lite` data is six months old. The successful exit is not a
warning-free build or a clean browser-console result. Those separate criteria remain open.

From repository root in a fresh process with the same socket guard, existing focused tests ran:

```powershell
& $qaNode scripts/run-vitest.mjs run --config vitest.config.mts --maxWorkers=1 tests/buildOutputValidation.test.ts frontend/__tests__/buildInfo.test.js tests/buildInfoEndpoint.test.ts
```

**3 files passed / 19 tests passed**, duration **2.44 seconds**:

| Suite                                  | Passed | Evidence boundary                                                                                                                                                                                          |
| -------------------------------------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `tests/buildOutputValidation.test.ts`  | 1      | Scanned actual generated output, required at least one HTML/JS/MJS file, and found no quoted unbundled `/src/scripts/` JS/MJS references. The existing output was used; no fallback root build was needed. |
| `frontend/__tests__/buildInfo.test.js` | 10     | Mocked build-info helper/fallback behavior; not browser or deployed identity evidence.                                                                                                                     |
| `tests/buildInfoEndpoint.test.ts`      | 8      | Direct handler calls with mocked filesystem metadata, including fail-closed cases; no live endpoint was contacted.                                                                                         |

## Acceptance and remaining gates

Exactly one existing checkbox changes: **Frontend build passes**. Its evidence is a successful
production-mode frontend compilation from the pinned source plus an actual-output regression test.
No criterion wording is weakened. All API v1, canonical-scrape, duplicate-chart, deployment,
browser, staging, production, and sign-off states remain unchanged.

The existing Qwen-only API v1 guidance, relay-supplied compute-key trust assumption, and CBC
integrity limitations are unchanged. A successful build does not prove provider support or model
availability. No new full local aggregate, browser suite, live-service/cluster check, package
publication, deployment, or human sign-off was performed. Historical Windows aggregate failures
remain failures, not passes. Rerun candidate-dependent checks for the selected release artifact;
this source-local result does not close the broader automated-checks or release-approval sign-off.

Documentation validation after the evidence/checklist edit: QA content-alignment and link-freshness
guards passed **9/9 tests**, all local Markdown links resolved, the prescribed six-document
Prettier check plus this evidence file passed, and `git diff --check` passed. A UTF-8 comparison
confirmed exactly one of 189 checkbox states changed, with all other checkbox wording/states intact.
