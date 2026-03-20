# DSPACE v3 launch-assist runbook (remote QA + rollout order)

Use this runbook as the operator-facing sequence for v3 launch assists. It intentionally keeps one
clear command per remote harness and explicitly separates automated checks from manual judgment
calls.

## 1) Remote smoke (non-destructive default)

```bash
pnpm run qa:remote-smoke -- --baseURL=https://staging.democratized.space
```

- Covers app-shell route health, quest/process interaction sanity, and chat UI availability.
- Keep `--mutate` off for shared staging unless a mutation check is explicitly needed.

## 2) Remote migration matrix

```bash
pnpm run qa:remote-migration -- --baseURL=https://staging.democratized.space
```

- Covers v1/v2 legacy save detection, merge/replace paths, cleanup, and malformed-payload safety.
- Optional real v2 payload replay can be layered in with `--real-v2-save`.

## 3) Remote Completionist Award III launch-gate harness

```bash
pnpm run qa:remote-completionist-award-iii -- --baseURL=https://staging.democratized.space
```

Automated by harness:

- lock-state check before prerequisites are fully complete
- unlock-state check after prerequisites are seeded complete
- capstone process chain start/finish viability in sequence
- singleton reward invariant (**Completionist Award III** remains exactly one)
- clean quest finish path after final assembly

Manual-only (human judgment required):

- dialogue tone quality (congratulatory retrospective + future-facing voice)
- aesthetic/content judgment (e.g., concept-image description quality)

## 4) RC freeze

- Record RC SHA/tag and lock content changes to critical-path fixes only.
- Capture harness artifacts from `frontend/test-results/` and link them in release notes/QA sign-off.

## 5) Alias rollout (`prod.democratized.space`)

- Roll out immutable RC image/tag to prod alias target first.
- Re-run smoke quickly on the alias host before touching apex.

## 6) Apex rollout (`democratized.space`)

- Promote the already-verified alias release to apex.
- Run post-cutover smoke and monitor logs/errors during the agreed observation window.
