#!/usr/bin/env bash
# Trusted, fixed-operation validation wrapper for the dspace @claude workflow.
# This script is always installed from the pinned workflow ref
# (github.workflow_sha), never from arbitrary pull request content, so it
# stays trustworthy even when the checked-out repository content is
# adversarial. Every operation is a verbatim command this repo already runs
# in real CI (.github/workflows/ci.yml's root-tests job), with no arguments
# and no shell interpolation of caller-provided data. Heavier jobs (Playwright
# e2e, remote chat smoke tests against token.place, Helm chart lint/template)
# are intentionally out of scope here -- they need live network/browser
# dependencies unsuited to a sandboxed, network-denied validation step.
set -euo pipefail

usage() {
  cat <<'EOF'
Usage: claude-validate.sh <operation>

Fixed operations (each takes zero arguments):
  prepare-deps    corepack pnpm install --frozen-lockfile
  lint            npm run lint
  type-check      npm run type-check
  build           npm run build
  test-ci         npm test (the full run-tests.js suite ci.yml's root-tests job runs)
  link-check      npm run link-check
  network-probe   Assert no secret-bearing env vars are visible and outbound network is denied.
EOF
}

if [[ "$#" -ne 1 ]]; then
  usage >&2
  exit 64
fi

op="$1"

case "$op" in
  prepare-deps)
    corepack enable
    corepack prepare pnpm@9.0.0 --activate
    HUSKY=0 pnpm install --frozen-lockfile --reporter=append-only
    ;;
  lint)
    npm run lint
    ;;
  type-check)
    npm run type-check
    ;;
  build)
    npm run build
    ;;
  test-ci)
    npm test
    ;;
  link-check)
    npm run link-check
    ;;
  network-probe)
    node -e '
      const net = require("net");
      const markers = ["TOKEN", "SECRET", "OIDC", "ACTIONS_ID_TOKEN", "GITHUB_TOKEN", "CLAUDE_CODE_OAUTH_TOKEN"];
      const leaked = Object.keys(process.env).filter((name) =>
        markers.some((marker) => name.toUpperCase().includes(marker))
      );
      if (leaked.length > 0) {
        console.error("secret-bearing environment variables visible: " + leaked.sort().join(","));
        process.exit(1);
      }
      const socket = net.connect({ host: "1.1.1.1", port: 443, timeout: 2000 });
      socket.on("connect", () => {
        console.error("outbound network unexpectedly reachable");
        socket.destroy();
        process.exit(1);
      });
      socket.on("error", () => process.exit(0));
      socket.on("timeout", () => {
        socket.destroy();
        process.exit(0);
      });
    '
    ;;
  *)
    echo "Unknown operation: $op" >&2
    usage >&2
    exit 64
    ;;
esac
