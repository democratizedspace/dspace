# DSPACE Release Management (Evergreen)

This document defines the repeatable release workflow for DSPACE after the `v3.0.0` launch.
It replaces one-time cutover language and should be used for all ongoing releases.

## Current environment model

- **Dev (planned, not live yet):** `env=dev` on `sugarkube6` (single-node, non-HA, non-public).
- **Staging (live):** `staging.democratized.space`, `env=staging`, HA on `sugarkube3..5`.
- **Prod (live):** `democratized.space`, `env=prod`, HA on `sugarkube0..2`.
- `prod.democratized.space` is an optional alias/rehearsal hostname, not a required permanent phase.

## Branching and tagging policy

### Default path

- `main` is the default integration branch.
- Day-to-day work lands on `main` via reviewed PRs.
- CI publishes image tags such as:
  - `main-latest` (mutable convenience tag)
  - `main-<shortsha>` (immutable, deploy-safe tag)

### Release tags

- **Release candidate tags (optional but recommended for sign-off):**
  - Example: `v3.1.0-rc.1`, `v3.0.0.1-rc.1`.
- **Final release tags (semver):**
  - Example: `v3.1.0`, `v3.0.0.1`.
- Staging/prod promotions should deploy immutable tags only (`main-<shortsha>`, `vX.Y.Z[-rc.N]`, `vX.Y.Z.W`).
- Avoid promoting `*-latest` to prod.

## When to use a release branch

Release branches are **optional** and should be short-lived.

Use a release branch only when stabilization on `main` is too risky for the current target release.

- Patch/hotfix example: `release/v3.0.0.1`
- Feature release stabilization example: `release/v3.1.0`

If no branch is needed, cut release candidates directly from `main`.

## Promotion flow (dev → staging → prod)

### 1) Candidate selection

Pick one immutable candidate tag from CI output.

```bash
git rev-parse --short HEAD
```

Use that SHA to identify `main-<shortsha>`.

### 2) Dev validation (once dev exists)

- Use `main-latest` for quick iteration.
- Re-run with immutable `main-<shortsha>` before advancing.
- Dev is intentionally low durability and non-HA.

### 3) Staging validation (required)

Deploy immutable candidate to staging and run release QA.

```bash
# example immutable candidate
export DSPACE_TAG=main-abc1234
```

If staging fails, fix forward and pick a new immutable candidate tag.

### 4) Production promotion (required)

Deploy only the approved immutable tag used for final staging sign-off.

```bash
# example final approved tag
export DSPACE_TAG=main-abc1234
```

If needed, use explicit rollback to the previous known-good immutable tag.

### 5) Semver finalization

After successful prod validation, create/push the final semver tag for that release line.

```bash
git tag v3.0.0.1
```

```bash
git push origin v3.0.0.1
```

## Patch vs feature release lanes

- **Patch lane (urgent bugfixes/small improvements):** keep scope tight, prefer minimal change set, and use
  `docs/qa/v3.0.0.1.md` as the release QA tracker.
- **Feature lane (planned feature work):** broader scope, use feature-track QA docs such as
  `docs/qa/v3.1.md`.

## Rollback policy

- Roll back by redeploying the last known-good immutable tag.
- Record:
  - failing tag
  - rollback tag
  - reason
  - follow-up fix owner

## Related runbooks

- [Dev runbook](./k3s-sugarkube-dev.md)
- [Staging runbook](./k3s-sugarkube-staging.md)
- [Prod runbook](./k3s-sugarkube-prod.md)
- [Patch QA tracker (`v3.0.0.1`)](./qa/v3.0.0.1.md)
- [Feature QA tracker (`v3.1`)](./qa/v3.1.md)
