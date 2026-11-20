# G2 Completionist and browser runner regression controls

Date: November 19, 2026. Source baseline:
`fa81db307ec6f4ff3ac16525f56f61c07e84bc27` (merged PR #4889).
Scope: the first two G2 criteria in [hotfix parity](../v3.1-hotfix-parity.md).
No release checkbox is closed by this record.

## Changes

- Completionist runner tests reject unsupported, below-patch-floor and malformed
  versions before CLI resolution or spawn; retain frontend/root resolution tests;
  exercise missing CLI, exact executable/arguments/environment, nonzero and null
  child exits, spawn errors, and signal forwarding. Child execution and signal
  delivery are mocked, so these tests do not launch a browser or contact staging.
- Workflow tests require the aggregate lint/type/build/test/link command block,
  IndexedDB launch and full shard launch. Negative fixtures reject workflow/job/
  step or inline `SKIP_E2E`, soft failure, conditional or removed launch, commented
  commands, masked exit status, incorrect working directory and reduced execution
  filters. Separate controls reject missing browser installs, missing shards and
  matrix exclusions. Existing explicit Ubuntu runner policy is retained.
- Runtime implementation, workflows, smoke images, verifier, G6 and shared release
  checklists are unchanged.

## Local validation and limits

The two changed test files passed **87/87 tests** (19 Completionist, 68 workflow)
in a Windows checkout using existing Node **22.23.4**, Vitest **2.1.9** and copied
existing tooling. No dependencies or runtimes were downloaded or installed.
This is supplemental isolated unit evidence, not the repository-pinned Node
24.22.3 / Vitest 3.2.4 validation. A temporary configuration used the Node test
environment and included only these two test files; it did not load the repository
Svelte configuration. The command was:

```text
node ../node_modules/vitest/vitest.mjs run --config ../g2-vitest.config.mjs --maxWorkers=1 --minWorkers=1
```

The temporary configuration was:

```javascript
export default {
  test: {
    environment: 'node',
    include: [
      'tests/playwrightRunnerCompatibility.test.ts',
      'tests/runRemoteCompletionistAwardIIIResolver.test.ts',
    ],
  },
};
```

Prettier checks for the changed files and `git diff --check` passed.
`node scripts/check-node-runtime.mjs` passed its pin consistency and eight negative
controls; it is not proof that the executing Node version is supported.

Required checks were attempted with the default shell's Node 18.17.1:

- `npm run check` failed at the a11y lint import because `svelte` is unavailable.
- `npm test` failed in process generation because `prettier-plugin-svelte` is
  unavailable.

No complete repository dependency tree or Node 24.22.3 runtime was found in the
inspected local tool locations. Full aggregate, type/build, coverage, browser,
both-shard execution, IndexedDB browser execution and native smoke execution remain
unverified. No staging or production operation was performed.

The required pre-push `npm run check` cannot pass in this environment. Publication
is blocked pending the supported runtime and complete dependencies; hooks have not
been bypassed. The next bounded action is to apply this patch in an authorized,
fully provisioned checkout, run required checks and browser evidence on the pinned
runtime, then commit with the required identity and open a focused draft PR.

## Isolated cloud validation and review follow-up

The original 17,442-byte transfer patch was independently verified as SHA-256
`a797fdb1a55d184dc2b7cde09d12d8036633a687b3e9cf824f1912fa3be1d291`,
and applying it to the baseline reproduced staged tree
`e6b41b6a3b3cd4a5f8dfea47028b587e5efc37b3` exactly.

Read-only review identified additional false-pass cases. The follow-up tests reject
non-fail-fast shell overrides at the step, job and workflow levels, absent or
filtered PR triggers, omission of the dedicated IndexedDB Chromium install, and
`CI_COVERAGE_DONE` flags that would skip the aggregate root/quest tests.
Static checks also retain both remote QA entry points and report paths. These
changes remain test-only. The browser installation list is not execution evidence:
the current unfiltered shard command defaults to Chromium, so installation of
Firefox/WebKit does not prove those browsers execute.

On Node 24.22.3 with frozen pnpm dependencies restored from an existing offline
store and Vitest 3.2.4, the two focused suites pass **107/107 tests** (88 workflow, 19 Completionist). The repository
Vitest configuration, rather than the temporary Windows configuration, was used:

```bash
node scripts/run-vitest.mjs run --config vitest.config.mts \
  tests/playwrightRunnerCompatibility.test.ts \
  tests/runRemoteCompletionistAwardIIIResolver.test.ts --maxWorkers=1
```

`npm run check` and `npm run type-check` passed. `npm run build` initially failed
because Astro telemetry could not create its home configuration directory;
`ASTRO_TELEMETRY_DISABLED=1 npm run build` passed without source changes.
`npm run audit:ci` passed the root audit but failed the frontend audit with nine
reported vulnerabilities, including four high-severity findings. Dependency
manifests and the pnpm lockfile are unchanged; no audit fix was attempted.

The required browser bootstrap (`npm run playwright:install`) failed during OS
dependency setup with `su: System error`. Actual browsers, both-shard execution and
IndexedDB browser behavior remain unverified. A preliminary `SKIP_E2E=1 npm test`
run failed with 27 failures: 26 Helm checks could not find `helm`, and one
build-output check hit the Astro telemetry directory error. That run overlapped
patch preparation and is not exact-final-tree evidence. The first bounded rerun timed out after 300 seconds. A subsequent run used a
previously cached Helm 3.12.3 binary verified against its archive/checksum,
task-local PATH, `ASTRO_TELEMETRY_DISABLED=1` and `SKIP_E2E=1`. It passed:
337 root test files / 2,401 tests, 19 quest-regression tests, hardening validation,
docs-RAG checks and preparation lint/format checks. This validates the final test
code, but intentionally omits E2E because the pinned browser bootstrap failed.
It is not browser or release-acceptance evidence.
No remote operations,
registry writes, merge, deployment or release acceptance follows from this record.
