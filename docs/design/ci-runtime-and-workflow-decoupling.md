# CI runtime and workflow decoupling

Status: design only. Recorded 2026-11-01 UTC.
No workflow, required check, release gate, infrastructure, or credential change is
implemented by this document. Implementation requires separately reviewed work.

## Decision and scope

Start with browser-install measurement and a bounded browser-cache experiment,
then investigate duplicate coverage and launch-gate work. Keep all checks and
their failure semantics. Defer cross-job build artifacts and publication-cache
changes: measured host builds are short, while release trust costs are high.

The inspected source is main at
[`d74f7162b2066e6d2d8ddb7411aa42feb202c4bd`](https://github.com/democratizedspace/dspace/tree/d74f7162b2066e6d2d8ddb7411aa42feb202c4bd).
All source paths below describe that snapshot. The release/v3.0.x hotfix is outside
scope. No workflow was dispatched or rerun to obtain these observations, and no
production endpoint was queried. Existing completed Actions runs provide CI
evidence only; they do not prove deployed behavior or release readiness.

## Workflow inventory

All listed jobs use GitHub-hosted `ubuntu-latest`. There is no `deploy.yml` at
this snapshot, despite an older overview in AGENTS.md mentioning it.

| File under `.github/workflows/` | Triggers                                                                       | Jobs, dependencies, and repeated work                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| ------------------------------- | ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ci.yml`                        | Push main/v3; PR targeting main/v3                                             | Four independent jobs: `build` runs root coverage; `docs-links` runs Lychee; `root-tests` serially runs lint, type-check, build, npm test, internal links; `frontend-indexeddb-regression-e2e` installs Chromium, runs IndexedDB regression and local chat smoke including negative cases. No `needs` edges.                                                                                                                                                                                                                                                  |
| `tests.yml`                     | Push main/v3; all PRs                                                          | Independent identity tests, lint, unit coverage, and two E2E shards. Each shard installs dependencies, builds, verifies stamps/RAG SHA, installs browser runtime libraries and Chromium/Firefox/WebKit, then tests. Shard 1 also runs OpenAI-default contracts. Per-ref concurrency cancels obsolete runs.                                                                                                                                                                                                                                                    |
| `build.yml`                     | Push main and `codex/**`; `v*` tags; all PRs; manual                           | One multi-architecture validation job; QEMU/Buildx, amd64 and arm64. No publish/login/registry-cache export. No external cache configured. A codex branch update with an open PR can create both push and PR builds.                                                                                                                                                                                                                                                                                                                                          |
| `ci-image.yml`                  | Push main/v3; PR main/v3; published release; manual with branch/release inputs | Independent conditional jobs: `local-build` installs host dependencies, builds/stamp-checks, builds amd64 with host node_modules present, verifies SHA/native canvas and container smoke. `image` on push/branch manual builds host output, verifies an amd64 image, then builds/pushes multi-arch with immutable-tag guards. `semantic-release` verifies immutable image/chart prerequisites and aliases the digest without rebuilding. No `needs` edges: local-build and image overlap on branch publication events; semantic-release is separately scoped. |
| `ci-sentinel.yml`               | Push main; all PRs                                                             | `workflow-integrity` installs dependencies, checks workflow contracts and legacy coverage requirements.                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `link-check.yml`                | Push main; PR main                                                             | `lychee` checks all tracked Markdown; overlaps CI docs-links' narrower docs globs. Different timeout/retry arguments prevent treating the two as identical.                                                                                                                                                                                                                                                                                                                                                                                                   |
| `commit-identity.yml`           | All branch pushes; PR-target opened/synchronize/reopened/ready                 | Read-only advisory job, continue-on-error. No checkout or PR code execution; policy/source pinned to default-branch SHA. Do not couple untrusted tests into it.                                                                                                                                                                                                                                                                                                                                                                                               |
| `ci-helm.yml`                   | chart-v\* tag push only                                                        | One ordered publish job: authorize source, validate coordinates, absence guard, stage/lint/package, publish, verify provenance. Per-tag concurrency does not cancel publication.                                                                                                                                                                                                                                                                                                                                                                              |
| `quest-chart.yml`               | Push v3; manual                                                                | Install, generate/upload chart image, conditionally commit chart text. Outside the measured PR path.                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `npm-check-updates.yml`         | Monday 00:00 UTC; manual                                                       | Root/frontend dependency reports via npx. Outside PR latency.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `claude.yml`                    | Issue comments, review comments, opened issues, submitted reviews              | `authorize` gates `claude-validation`; `claude` depends on both and checks authorization. Inventoried only; do not invoke this reviewer for this task.                                                                                                                                                                                                                                                                                                                                                                                                        |

The workflow files and `package.json`, `run-tests.js`,
`frontend/scripts/prepare-pr.sh`, `frontend/playwright.config.ts`, and `Dockerfile`
are the source of this graph. In particular:

- `CI/build` and `tests/unit` both call root `coverage`, but the latter supplies
  `NODE_OPTIONS=--experimental-vm-modules` and makes Codecov failure fatal with a
  token. Equivalent command names alone do not establish equivalent environments.
- `root-tests` calls `npm test`, which runs root unit tests, the quest regression
  subset, hardening and docs-RAG validation, then the platform preparation script.
  On Linux that script checks lint/format again and runs grouped E2E. The tests
  workflow separately covers lint/format and sharded Playwright. Compare actual
  test discovery, projects, environment and assertions before any consolidation.
- `CI_COVERAGE_DONE=1` in `run-tests.js` skips both root unit execution and its
  explicit quest regression invocation. It is not safe merely to set it because
  another independent workflow exists; success and exact revision must be proven.
- Type-check, coverage and builds regenerate metadata/docs RAG. Host builds occur
  in both E2E shards, root-tests, IndexedDB/chat smoke and image jobs. Docker
  independently installs development/production dependencies and builds output.
  Host output is not currently an authorized substitute for Docker output.
- pnpm store caching already exists in two CI jobs, lint/unit/E2E in tests, and
  quest-chart. Keys use OS plus lockfile hash with a broad OS/pnpm restore prefix.
  IndexedDB regression, sentinel and image host installs lack that store cache.
  `ci-image/local-build` uses `ci-image-local` GHA cache for same-repository events;
  forks use uncached builds. Its fork path has two build steps, but no fork was
  measured here. Image publication uses a separate default GHA scope.

## Measured baseline and limitations

Read-only REST collection used `/actions/runs?per_page=60`, individual run
metadata, and `/actions/runs/{id}/jobs?per_page=100`. The bounded recent listing
selected the latest completed main push and latest completed PR cohort visible
at collection, plus that PR's matching branch-push validation. This is a small
convenience sample: one main source and one PR head, nine runs, all attempt 1 and
successful. It is not a p50/p95 study, fork comparison, or cache-hit experiment.
The jobs returned fit one page; skipped jobs are excluded from execution totals.

Main source is the inspected SHA above. The PR cohort is
[PR #4856](https://github.com/democratizedspace/dspace/pull/4856), head
`ea443d192147494de67b354e16e0625834735344`, base
`d74f7162b2066e6d2d8ddb7411aa42feb202c4bd`. Run `head_sha` identifies the PR head,
not necessarily the synthetic merge commit checked out by Actions. The actual
PR checkout merge SHA was not extracted; do not assert byte-identical builds
between its push and PR runs. These cohorts also differ in source/event context.

Definitions (seconds, using GitHub's UTC timestamps):

- Run start delay = `run_started_at - created_at`. It is 0 in all nine runs.
  This does **not** mean jobs had zero queue delay.
- Job start offset = `job.started_at - run.created_at`. It combines scheduling,
  runner acquisition and any orchestration delay. API data here cannot separate
  pure runner queue time from these components.
- Job execution = `completed_at - started_at`, including setup/cleanup. Summed
  execution measures overlapping runner occupancy, not elapsed user wait or
  billable minutes. Step durations are the same subtraction on step timestamps.
- Workflow wall proxy = `updated_at - created_at`, which can include API/status
  bookkeeping. Latest job completion is also recorded below; never substitute
  summed job duration for critical-path latency.

| Cohort      | Workflow/run                                                                                  | Created UTC     | Updated UTC    | Wall proxy (s) |
| ----------- | --------------------------------------------------------------------------------------------- | --------------- | -------------- | -------------: |
| main        | [CI 41254275652](https://github.com/democratizedspace/dspace/actions/runs/41254275652)        | Oct 31 23:51:50 | Nov 1 00:07:50 |            960 |
| main        | [tests 41254275690](https://github.com/democratizedspace/dspace/actions/runs/41254275690)     | Oct 31 23:51:50 | Nov 1 00:01:04 |            554 |
| main        | [container 41254275708](https://github.com/democratizedspace/dspace/actions/runs/41254275708) | Oct 31 23:51:50 | Nov 1 00:01:32 |            582 |
| main        | [image 41254275642](https://github.com/democratizedspace/dspace/actions/runs/41254275642)     | Oct 31 23:51:50 | Nov 1 00:06:40 |            890 |
| PR          | [CI 41255003765](https://github.com/democratizedspace/dspace/actions/runs/41255003765)        | Nov 1 00:02:45  | Nov 1 00:12:46 |            601 |
| PR          | [tests 41255003865](https://github.com/democratizedspace/dspace/actions/runs/41255003865)     | Nov 1 00:02:45  | Nov 1 00:13:37 |            652 |
| PR          | [container 41255003819](https://github.com/democratizedspace/dspace/actions/runs/41255003819) | Nov 1 00:02:45  | Nov 1 00:12:10 |            565 |
| PR          | [image 41255003801](https://github.com/democratizedspace/dspace/actions/runs/41255003801)     | Nov 1 00:02:45  | Nov 1 00:07:57 |            312 |
| branch push | [container 41254986661](https://github.com/democratizedspace/dspace/actions/runs/41254986661) | Nov 1 00:02:28  | Nov 1 00:11:56 |            568 |

The main cohort's longest observed path is CI/root-tests (959 seconds from run
creation to job finish). The PR cohort's is tests shard 2 (651 seconds).
Improving a noncritical job can save runner occupancy without reducing PR wait.
Individual job links, start offsets and execution durations are in the appendix.

## Ranked opportunities

1. **Browser setup: first bounded experiment, largest measured setup variability.**
   The browser/runtime install step took main shard 1/2: 65/265 seconds and PR
   shard 1/2: 124/298 seconds. The preceding explicit apt step also costs 5-6
   seconds in three of those jobs. Measure download versus apt separately before
   calling this download time. Preserve all browser projects and OS dependencies.
   Try exact-version browser archive reuse under an unprivileged PR/CI trust scope;
   always retain the runtime dependency installation and Playwright validation.
   A cache cannot eliminate apt work. If the PR slow shard saved its entire
   298-second step (an unrealistic upper bound), CI/root-tests at 601 seconds
   would still limit the cohort: at most 51 seconds off its 652-second wall proxy.
   Cache effects must be measured, not promised.
2. **Coverage and launch-gate decomposition: high compute potential, gated migration.**
   CI coverage took 263 seconds main / 337 PR; tests coverage took 422 / 239.
   Thus one duplicate coverage step represents roughly 4-7 runner-minutes in
   these runs, not that much guaranteed wall-time improvement. Root launch-gate
   bundles took 936/582 seconds; available step timestamps cannot attribute this
   to lint, build, unit or E2E individually. First expose separate steps with the
   same commands/order and fail-fast behavior. Later propose one canonical
   coverage producer with explicit same-workflow dependencies and existing named
   gate jobs that fail on missing, failed, cancelled or skipped prerequisites.
   Preserve quest regression, coverage thresholds, upload failure policy,
   hardening, RAG, lint, type-check and both E2E coverage models until equivalence
   is demonstrated. Do not use a cross-workflow success assumption or a bare skip
   variable. The current sentinel requires the literal launch-gate command set
   in root-tests; any subsequent graph migration must replace that assertion with
   equally strong dependency/command coverage tests in a separate reviewed PR.
3. **Container validation overlap: substantial compute, higher trust risk.**
   The matched branch-push and PR container build steps took 511 and 514 seconds;
   full jobs took 564/561. They overlap, but push HEAD versus PR merge identity
   matters. Do not drop a trigger on this evidence. Evaluate same-trust BuildKit
   layer reuse for validation first, retaining both architectures and all checks.
   Main validation took 521 seconds while publication separately spent 256 on
   amd64 verification and 532 on multi-arch build/push. These are different
   contracts, not removable duplicate tests. Keep build.yml validation-only and
   keep publication isolated; do not cancel in-flight publication for speed.
4. **pnpm cache consistency: low risk after trust review, modest observed payoff.**
   Measured dependency installation was only 3-10 seconds across these host jobs.
   Extend store caching to missing unprivileged jobs only if restore/save overhead
   beats installation cost. Do not introduce node_modules caching. Cache hits
   and downloaded bytes were not collected, so these timings cannot prove existing
   cache effectiveness. The Docker cache mount targets `/root/.pnpm-store`; verify
   actual `pnpm store path` in that image before proposing a path correction.
   Cache mounts alone do not establish persistence across ephemeral runners.
5. **Defer shared built frontend artifacts and link-check consolidation.**
   E2E host build steps took main 7/11 seconds and PR 9/13; image host builds took
   10-13. Upload/download plus a new dependency edge could be slower. Source SHA,
   generated RAG, build stamp and environment contracts make sharing nontrivial.
   CI docs-links occupied 7/14 seconds; independent all-Markdown link-check runs
   were 21/13 seconds wall time in the listing. Neither is the observed critical
   path. Preserve their coverage and failure signals; do not add link-result caches
   that hide newly broken external destinations.

## Cache trust and invalidation contract for later implementation

Caches are optional acceleration, never evidence that a test/build passed. A miss,
corrupt archive or incompatible entry must fall back to normal verified install or
build, not skip a gate. Do not cache secrets, credentials, reports as proof of
success, mutable deployment coordinates, or unverified generated application output.

| Candidate                           | Proposed key/invalidation                                                                                                                                                 | Trust and required fallback                                                                                                                                                                                                                      |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| pnpm content store                  | Schema epoch + OS/architecture + Node major + pnpm version + lockfile and pnpmfile/workspace configuration hashes; restore prefixes must retain toolchain and trust scope | Frozen lockfile installation always runs, including scripts/native compilation. Keep PR writes isolated from trusted branch/release readers; no generic fallback crossing that boundary.                                                         |
| Playwright browser files            | Schema epoch + exact runner OS/image identity + architecture + resolved Playwright version/browser revision + lockfile + browser set                                      | Validate executable locations and version; install OS dependencies every job. Forks retain a cold/no-write baseline initially. Same-repository PRs are also untrusted for privileged publication. Never reuse their entries in a privileged job. |
| BuildKit validation layers          | Explicit validation-only scope per platform/toolchain; Dockerfile/context/build arguments remain content inputs; epoch for emergency invalidation                         | Preserve Docker layer correctness and source/build-version stamps. Never import PR-produced layers into release publication; keep fork cache bypass. No registry-cache export/login from build.yml.                                              |
| Future frontend artifact (deferred) | Exact tested checkout SHA, OS/toolchain, lockfile, build environment, workflow run/attempt and artifact digest                                                            | Consume only from an explicit dependency in the same unprivileged run, validate metadata and expected stamp, rebuild/fail on mismatch. No promotion into release jobs.                                                                           |

An explicit scope string alone is not a security boundary. Before implementation,
verify GitHub's actual ref visibility/save behavior and producer identity for the
selected cache backend, using current platform documentation and unprivileged
tests. Fork and same-repository PR writes must not become trusted branch/release
inputs. Do not use pull_request_target, privileged workflow_run consumers, or new
credentials to transport PR caches. No permission changes are part of this proposal.

Publication remains governed by the existing immutable branch-SHA image, chart
provenance, retired chart coordinate and semantic-alias digest checks.
The semantic-release path already avoids rebuilding. Preserve its source
authorization, non-404 fail-closed behavior, per-tag serialization and release
manifest. Cache hits never authorize release, deployment or a QA checkbox.

## Proposed implementation sequence and validation

1. In a future instrumentation PR, split the root-tests compound step in
   `.github/workflows/ci.yml` into the same ordered commands; add timing boundaries
   for browser download versus OS installation in `.github/workflows/tests.yml`.
   Record installer and test UID, HOME, `PLAYWRIGHT_BROWSERS_PATH`, resolved browser executable paths and downloads during test-configuration startup. Installation currently runs under sudo while tests run as the runner user; `ensurePlaywrightBrowsers` may install missing assets during configuration. A second download is possible, not established by this sample. Keep job names, triggers and command coverage intact. Extend
   `tests/workflowIntegrityScript.test.ts` to prove all launch commands still run
   and failures remain fatal; retain `scripts/check-workflows.mjs` contracts.
2. In a separate cache experiment, change only tests.yml browser setup, with
   restore/miss/version checks and normal install fallback. Update
   `tests/workflowPnpmCache.test.ts` only if its pnpm expectations actually change.
   Do not remove its existing protections. Exercise cold, warm, lockfile/toolchain
   change, corrupt cache and fork paths in authorized CI. No new self-hosted runners.
3. With test-discovery equivalence evidence, propose the canonical coverage graph
   across ci.yml/tests.yml and `run-tests.js`. Include
   `tests/runTestsScript.test.ts`, `tests/runTestsQuestRegression.test.ts`,
   `tests/workflowIntegrityScript.test.ts` and sentinel contracts in that review.
   Stable existing check names must remain meaningful gate jobs, not unconditional
   success stubs. Each gate must reject skipped/cancelled prerequisites. Record the
   complete mapping of old assertions to producers before replacing duplicate work.
4. Only after trust review, consider validation-only BuildKit reuse in build.yml
   with `tests/buildWorkflowMultiArch.test.ts`. Changes touching image workflows or
   Dockerfile also need `tests/ciImageWorkflow.test.ts`, release consistency tests,
   SHA/native canvas/container smoke coverage and architecture parity. Keep chart
   and semantic-release publication code out of an optimization experiment.

For each implementation stage, collect at least 20 completed comparable PR runs
and 10 main runs before and after, grouped by event, runner image, source workload,
cache state, attempt and fork status. Report sample sizes, p50/p95 workflow elapsed,
per-job start offset/execution, summed occupancy, hit rate and failure/retry rate.
Record all failures/cancellations separately rather than selecting only successes.
For reruns, use attempt-specific jobs and avoid counting original-created-to-retry
time as queue latency. No dispatch/rerun is authorized by this design task.

Acceptance: identical test/project/assertion coverage and required status semantics;
no artifact provenance regression; lower median occupancy without worse p95
critical-path latency or failure rate. Cache experiments should recover restore/save
overhead and show benefit over multiple warm runs, not a single favorable sample.
Run normal lint, type-check, build, full tests, coverage and workflow contract tests
in the supported environment before merging any implementation. Include negative
tests for missing cache/artifacts and failed dependencies. Source checks alone
cannot certify runtime, published artifacts or deployment.

Rollback each experiment independently by reverting its workflow/script commit.
For suspected cache contamination, disable restore/save or bump the cache epoch,
then rebuild with verified inputs; no global cache purge or credential changes are
authorized here. Restore original command graph and gates before removing any
compatibility job. Never roll back by weakening checks, reassigning tags on published images,
overwriting chart coordinates, or changing the release/v3.0.x hotfix.

## Review and local verification status

Applicable repository checks and review remain necessary before merge. This design
does not waive any validation or authorize workflow changes.

The read-only main branch-protection response at collection returned
`required_status_checks: null` and zero required approving reviews. That snapshot
does not establish all ruleset/external gates and does not waive task or repository
requirements. No protection setting was changed.

Validation of this documentation change is reported in its PR. Local tooling
limitations are not passes and do not waive full required CI or review. No workflow
implementation, runtime validation or deployment is claimed.

## Appendix: exact job observations

Run creation timestamps and source identities are above. Start offset and execution
are seconds; together they reconstruct completion relative to creation. Job links
identify the underlying timestamp and step records. Skipped publication jobs on PRs
are omitted, including one with reversed skip timestamps; they are not negative
execution time or evidence of publication.

<!-- Job rows below are derived from the read-only Actions jobs responses. -->

| Run         | Job                                                                                                                                   | Start offset (s) | Execution (s) |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------- | ---------------: | ------------: |
| 41254275642 | [Validate Docker build with host node_modules](https://github.com/democratizedspace/dspace/actions/runs/41254275642/job/124694014057) |                3 |           318 |
| 41254275642 | [Build and push image](https://github.com/democratizedspace/dspace/actions/runs/41254275642/job/124694014271)                         |                4 |           886 |
| 41254275652 | [frontend-indexeddb-regression-e2e](https://github.com/democratizedspace/dspace/actions/runs/41254275652/job/124694014103)            |                4 |           169 |
| 41254275652 | [docs-links](https://github.com/democratizedspace/dspace/actions/runs/41254275652/job/124694014118)                                   |                8 |             7 |
| 41254275652 | [build](https://github.com/democratizedspace/dspace/actions/runs/41254275652/job/124694014122)                                        |                3 |           285 |
| 41254275652 | [root-tests](https://github.com/democratizedspace/dspace/actions/runs/41254275652/job/124694014144)                                   |                3 |           956 |
| 41254275690 | [lint](https://github.com/democratizedspace/dspace/actions/runs/41254275690/job/124694014678)                                         |                4 |            56 |
| 41254275690 | [e2e (2/2)](https://github.com/democratizedspace/dspace/actions/runs/41254275690/job/124694014826)                                    |                4 |           543 |
| 41254275690 | [unit](https://github.com/democratizedspace/dspace/actions/runs/41254275690/job/124694014854)                                         |                4 |           452 |
| 41254275690 | [e2e (1/2)](https://github.com/democratizedspace/dspace/actions/runs/41254275690/job/124694014866)                                    |                3 |           245 |
| 41254275690 | [commit-identity-tests](https://github.com/democratizedspace/dspace/actions/runs/41254275690/job/124694014877)                        |                4 |             7 |
| 41254275708 | [Build multi-arch image](https://github.com/democratizedspace/dspace/actions/runs/41254275708/job/124694014307)                       |               14 |           568 |
| 41254986661 | [Build multi-arch image](https://github.com/democratizedspace/dspace/actions/runs/41254986661/job/124696128193)                       |                4 |           564 |
| 41255003765 | [root-tests](https://github.com/democratizedspace/dspace/actions/runs/41255003765/job/124696183992)                                   |                3 |           598 |
| 41255003765 | [docs-links](https://github.com/democratizedspace/dspace/actions/runs/41255003765/job/124696184005)                                   |                3 |            14 |
| 41255003765 | [frontend-indexeddb-regression-e2e](https://github.com/democratizedspace/dspace/actions/runs/41255003765/job/124696184049)            |                3 |           121 |
| 41255003765 | [build](https://github.com/democratizedspace/dspace/actions/runs/41255003765/job/124696184065)                                        |                3 |           371 |
| 41255003801 | [Validate Docker build with host node_modules](https://github.com/democratizedspace/dspace/actions/runs/41255003801/job/124696183979) |                3 |           308 |
| 41255003819 | [Build multi-arch image](https://github.com/democratizedspace/dspace/actions/runs/41255003819/job/124696184233)                       |                3 |           561 |
| 41255003865 | [commit-identity-tests](https://github.com/democratizedspace/dspace/actions/runs/41255003865/job/124696184353)                        |                3 |             8 |
| 41255003865 | [unit](https://github.com/democratizedspace/dspace/actions/runs/41255003865/job/124696184508)                                         |                3 |           259 |
| 41255003865 | [lint](https://github.com/democratizedspace/dspace/actions/runs/41255003865/job/124696184535)                                         |                3 |            65 |
| 41255003865 | [e2e (1/2)](https://github.com/democratizedspace/dspace/actions/runs/41255003865/job/124696184567)                                    |                3 |           321 |
| 41255003865 | [e2e (2/2)](https://github.com/democratizedspace/dspace/actions/runs/41255003865/job/124696184601)                                    |                3 |           648 |
