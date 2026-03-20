# DSPACE v3 launch-assist runbook (remote harness order)

This page is the operator-facing sequence for the final v3 launch lane. Use it as the single
command checklist for staging/prod-origin validation and rollout.

## 1) Remote smoke (safe defaults)

```bash
pnpm run qa:remote-smoke -- --baseURL=https://staging.democratized.space
```

- Purpose: app shell/routes/process/chat UI sanity without optional mutating checks.
- Artifact: `frontend/test-results/remote-smoke-summary.json`.

## 2) Remote migration matrix

```bash
pnpm run qa:remote-migration -- --baseURL=https://staging.democratized.space
```

- Purpose: v1/v2 legacy detection + merge/replace/cleanup behavior from QA v3 §3.2.2.
- Artifact: `frontend/test-results/remote-migration-harness-report.json`.

## 3) Remote Completionist Award III launch-gate validation

```bash
pnpm run qa:remote-completionist-award-iii -- --baseURL=https://staging.democratized.space
```

- Purpose: automate Completionist Award III capstone lock-state/process/reward/finish checks.
- Artifact: `frontend/test-results/remote-completionist-award-iii-harness-report.json`.
- Automated by harness:
  - locked before prerequisites
  - unlocked after prerequisite quest seeding
  - six-step process chain startability with staged prerequisite inventory
  - exactly one canonical Completionist Award III (no quest-reward duplicate)
  - clean finish path after final assembly state
- Manual-only (must still be human-reviewed):
  - dialogue tone (congratulatory retrospective + future-facing voice)
  - aesthetic/content judgment checks (image fit, prose quality, thematic coherence)

## 4) RC freeze

- Stop content churn after harnesses are green.
- Record RC SHA/tag in `docs/qa/v3.md` section 0.
- Re-run only targeted checks if a freeze-breaking fix is unavoidable.

## 5) Alias rollout (`prod.democratized.space`)

- Promote the frozen RC image/tag to production alias target first.
- Re-run smoke command against alias before apex cutover:

```bash
pnpm run qa:remote-smoke -- --baseURL=https://prod.democratized.space
```

## 6) Apex rollout (`democratized.space`)

- Switch apex routing after alias validation is clean.
- Final confidence check:

```bash
pnpm run qa:remote-smoke -- --baseURL=https://democratized.space
```

- Keep rollback plan and deploy logs open for the post-cutover watch window.
