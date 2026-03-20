# DSPACE v3 launch-assist runbook

This runbook is the operator-facing order of operations for v3 launch validation and rollout.

## 1) Remote smoke (safe first pass)

Run against staging RC first:

```bash
pnpm run qa:remote-smoke -- --baseURL=https://staging.democratized.space
```

- Purpose: fast route/app-shell/process/chat UI sanity check.
- Artifact: `frontend/test-results/remote-smoke-summary.json`.

## 2) Remote migration harness (legacy save safety)

Run the migration matrix harness on the same RC origin:

```bash
pnpm run qa:remote-migration -- --baseURL=https://staging.democratized.space
```

- Purpose: verify v1/v2 migration detection and upgrade flows stay launch-safe.
- Artifacts:
  - `frontend/test-results/remote-migration-playwright-summary.json`
  - `frontend/test-results/remote-migration-harness-report.json`

## 3) Remote Completionist Award III harness (capstone launch blocker)

Run the capstone harness on the same origin:

```bash
pnpm run qa:remote-completionist-award-iii -- --baseURL=https://staging.democratized.space
```

- Purpose: automate the capstone lock/unlock/process/reward/finish sign-off path.
- Artifacts:
  - `frontend/test-results/remote-completionist-award-iii-playwright-summary.json`
  - `frontend/test-results/remote-completionist-award-iii-harness-report.json`
- Automated coverage includes:
  - locked before prerequisites
  - unlocked after prerequisites are seeded complete
  - process chain start/cancel viability for all six capstone processes
  - exact single canonical Award III item after finish
  - clean quest completion path

### Manual checks still required (do not skip)

- Dialogue tone and narrative quality in `completionist/award-iii` must be reviewed by a human.
- Aesthetic/content judgment checks (for example concept-image adequacy and narrative polish) remain manual.

## 4) RC freeze

When Steps 1-3 are green and manual checks are signed off:

- Freeze RC commit/tag.
- Stop feature merges into the release candidate.
- Record the approved staging URL + commit SHA in `docs/qa/v3.md` release metadata.

## 5) Alias rollout (prod alias first)

Roll out the approved RC image to `prod.democratized.space` first, then run:

```bash
pnpm run qa:remote-smoke -- --baseURL=https://prod.democratized.space
```

- This is the pre-apex live confirmation gate.

## 6) Apex rollout

After alias smoke is green:

```bash
pnpm run qa:remote-smoke -- --baseURL=https://democratized.space
```

- If apex smoke passes, publish release notes and close launch checklist items.
