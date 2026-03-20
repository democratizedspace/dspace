# DSPACE v3 Launch-Assist Runbook (Remote QA + Rollout)

Use this page as the operator-facing sequence for v3 launch day. It keeps the remote harness
commands in one place and leaves human-judgment checks explicit.

## 1) Remote smoke (staging RC build)

```bash
pnpm run qa:remote-smoke -- --baseURL=https://staging.democratized.space
```

- Validates route/UI smoke coverage on the remote target.
- Optional (mutating/live-chat variants) remain available via `docs/qa/v3.md`.

## 2) Remote migration matrix (staging RC build)

```bash
pnpm run qa:remote-migration -- --baseURL=https://staging.democratized.space
```

- Validates v1/v2→v3 migration detection, merge/replace flows, and cleanup behavior.
- Optional real-v2 payload replay remains available via `--real-v2-save` / env variable input.

## 3) Remote Completionist Award III launch-gate validation

```bash
pnpm run qa:remote-completionist-award-iii -- --baseURL=https://staging.democratized.space
```

Automated by this harness:

- Locked before `completionist/award-iii.requiresQuests` are complete.
- Unlocks once prerequisites are marked complete.
- Each capstone process can start and cleanly cancel:
  - `print-completionist-iii-modules`
  - `mill-completionist-iii-wood-base`
  - `solder-completionist-iii-harness`
  - `integrate-completionist-iii-robotics`
  - `assemble-completionist-iii-planter`
  - `assemble-completionist-award-iii`
- Clean finish path.
- Exact single reward grant behavior:
  - finishing grants the legacy quest reward (`Completionist Award`) once
  - finishing does **not** duplicate `Completionist Award III` when it already exists from assembly

Manual-only checks that still require a human pass:

- Dialogue tone/content quality (congratulatory retrospective + future-facing framing).
- Aesthetic/content judgment checks (narrative polish and release-note/readability quality).

## 4) RC freeze

- Freeze RC SHA after all three harnesses are green on staging.
- Record harness artifacts in the release thread/checklist.
- Stop new feature merges until rollout completes.

## 5) Alias rollout (`prod.democratized.space`)

- Deploy frozen RC build to the production alias first.
- Re-run remote smoke quickly against alias:

```bash
pnpm run qa:remote-smoke -- --baseURL=https://prod.democratized.space
```

## 6) Apex rollout (`democratized.space`)

- Switch apex after alias verification is green.
- Re-run remote smoke against apex:

```bash
pnpm run qa:remote-smoke -- --baseURL=https://democratized.space
```

If apex smoke diverges from alias smoke, pause rollout and revert alias/apex cutover per deployment
runbook policy before resuming.
