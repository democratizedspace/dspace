# Containerized remote chat smoke

This image runs the existing isolated, intercepted Chromium chat journey against
an existing HTTPS deployment. It does not perform live inference, build an app
preview, deploy, or change application/chart versions. The remote target identity
and provider contracts remain mandatory. TLS verification is enabled.

## Build once on the runner host

Requires an existing Linux Docker daemon and Node.js (22.23.4 or newer compatible
LTS) for the executable adapter. Linux amd64 and native Linux arm64 are supported;
ARM32 and implicit emulation are rejected. Docker Desktop must use a Linux daemon.
No browser or npm packages are installed on the host. Build from a clean checkout
of the reviewed runner commit; do not label dirty source as a reviewed commit.

```sh
test -z "$(git status --porcelain)"
RUNNER_REVISION=$(git rev-parse HEAD)
docker build -f containers/remote-chat-smoke/Dockerfile \
  --build-arg RUNNER_REVISION="$RUNNER_REVISION" \
  -t "dspace-chat-smoke:$RUNNER_REVISION" .
export DSPACE_SMOKE_IMAGE="dspace-chat-smoke:$RUNNER_REVISION"
```

The official Playwright 1.54.2 Noble multiarch base is pinned by index digest
`sha256:18b4bcff4f8ba0ac8c44b09f09def6a4f6cb8579e5f26381c21f38b50935d5d8`.
Its native children are amd64
`sha256:78b0b0dd476f868e443cfdf58a01f747524504f0bdbe0fff9e6a47b334198f19`
and arm64 `sha256:5877f80096c0980bf602a85e1ddbb95b99a2ba64d5c068a7c75d833dd8bffb94`.
Node and npm are copied from the native official Node 22.23.4 Bookworm stage pinned
to index `sha256:5ec23b7c622b00547753bc6ffd78085dd868a68aeb41c8e0a1418f033e13d96d`.
Both the build and offline self-check enforce Node 22.23.4, satisfying the repo's
patched minimum rather than relying on the historical browser base's Node.
The repo's pnpm lockfile freezes dependencies; pnpm is 9.0.0. Build-time lifecycle
scripts are disabled because this remote-only runner needs no app build or native
canvas build. Playwright package version is checked against the installed browser
base. Runtime never installs dependencies/browsers. Changing Playwright requires
updating the base digest/version together and validating both native architectures.

Before staging use, verify actual Chromium launch (no target network request):

```sh
node scripts/check-container-chat-smoke.mjs "$DSPACE_SMOKE_IMAGE"
```

## Verifier integration

Set Sugarkube's executable `smoke_runner` to the absolute path of
`scripts/run-container-chat-smoke.mjs` in this checkout. It accepts the existing
runner's argv, including hotfix flags, `--result-file` and `--runner-revision`.
Keep the adapter and image built from the same reviewed source commit. The latter
flag is runner source provenance, **not** the target application's revision; it
must match the image's `org.opencontainers.image.revision` label.

The current Sugarkube modern-build argv omits `--provider-config-contract`.
Explicitly scope the required contract in the verifier environment:

```sh
export DSPACE_EXPECTED_PROVIDER_CONFIG_CONTRACT=chat-default-provider-v1
export DSPACE_SMOKE_TIMEOUT_MS=240000
# Invoke the existing verifier with smoke_runner pointing to this adapter.
```

There is no inferred fallback or Sugarkube source change. Use the appropriate
explicit contract for legacy/hotfix runs; a CLI flag takes precedence. For a direct
modern staging invocation, fill in the verified target origin/model:

```sh
scripts/run-container-chat-smoke.mjs \
  --base-url https://YOUR-STAGING-HOST \
  --expected-version 3.1.0 \
  --expected-revision 89991c3ca5407f42313ce3ba9021610ce17f7827 \
  --identity-contract build-info-v1 \
  --provider-config-contract chat-default-provider-v1 \
  --expected-provider token-place \
  --expected-token-place-origin https://YOUR-VERIFIED-PROVIDER \
  --expected-token-place-model YOUR-VERIFIED-MODEL \
  --result-file /tmp/dspace-chat-result.json \
  --runner-revision "$RUNNER_REVISION"
```

That target revision is an example for the planned image, not a claim that it has
been deployed. Never change expected identity just to make staging pass.

The adapter resolves a local tag to an image ID once and never pulls automatically.
It checks daemon/image architecture, logs image ID and runner SHA independently of
target revision, and runs as the image's non-root `pwuser`. It mounts no checkout,
home, credentials, kubeconfig, or Docker socket, and passes no host environment
variables into the container. Artifacts live in the disposable container's writable
layer at `/artifacts`; only fresh completion JSON is copied out. `/tmp` is tmpfs.
Source/dependency files remain root-owned. Existing result paths are cleared before
runtime preflight; valid results are atomically replaced. Do not share a result path
between simultaneous runs. The runner's completion marker remains authoritative;
exit zero without fresh matching proof becomes failure.

Smoke exit codes propagate; adapter/preflight errors use 2, overall deadline expiry 124, SIGINT 130,
and SIGTERM 143. Unexpected Docker client signal/null exit is failure, never zero.
SIGINT/SIGTERM and timeout force-remove the uniquely named
container, with a final cleanup retry. SIGINT/SIGTERM handling stays active through
result collection, publication and
final cleanup; cancellation removes any result published during the interrupted run.
The default 240-second monotonic budget
includes preflight, attach, inspection and proof copy; each Docker control command
is bounded to at most 10 seconds within that budget.
Command timeouts before the overall deadline keep their ordinary failure code (2
for adapter/preflight failures, 1 for proof-copy failure after smoke exit zero).
A nonzero smoke exit still takes precedence over a later proof-copy failure.
Final removal gets an additional
10 seconds, leaving 50 seconds within Sugarkube's 300-second outer timeout. Keep
custom budgets at least 60 seconds below the outer timeout. SIGKILL/power loss
cannot be trapped; inspect and remove any orphan `dspace-smoke-*` container before
retrying. An unavailable daemon can also prevent cleanup; errors are not suppressed.

## Verification and release evidence

```sh
node --test scripts/run-container-chat-smoke.test.mjs
```

These dependency-free tests mock Docker and cover argument/environment isolation,
architecture, absent runtime/image, failed smoke or missing browser proof, stale or
invalid proof, result publication, timeout/signal return codes and cleanup requests.
They do not establish actual signal delivery, container build, browser launch, native
ARM64 execution or deployed behavior. Validate the build and browser command above
on each intended native runner, then perform the authorized staging smoke and retain
the logged runner image ID/source revision and fresh JSON beside target image evidence.
The PR-only `Container chat smoke tooling` workflow builds this dedicated Dockerfile
on hosted native AMD64 and ARM64 runners, without publishing an image or using secrets.
It invokes `check-container-chat-smoke.mjs`, which shares the adapter's hardening flags
and additionally disables container networking. The check loads all real smoke test
imports with Playwright `--list`, launches Chromium and renders an in-memory page,
then verifies a missing-browser negative control fails at launch. CI is tooling
evidence only; no staging requests or live inference occur.
No release QA gate is closed by these mock tests.
