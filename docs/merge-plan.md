# DSPACE release management plan (evergreen)

This document replaces the old one-time v3 merge checklist. Use it for every release after
v3.0.0, including urgent patch releases (for example `v3.0.0.1`) and feature releases (for example
`v3.1.x`).

## Release model

- `main` is the default integration branch.
- Production deployments are always from immutable image tags.
- `*-latest` tags are convenience tags only (acceptable for dev convenience, not for prod sign-off).
- Staging is the release validation gate before prod promotion.

## Branching workflow

### 1) Day-to-day development

- Merge normal work to `main`.
- CI publishes immutable tags such as `main-<shortsha>` and convenience tags such as `main-latest`.

### 2) Choose release lane

#### Feature release lane (default)

- Continue stabilizing directly on `main`.
- Pick an immutable candidate image tag from `main-<shortsha>`.
- Deploy candidate to staging.
- Iterate until staging sign-off is complete.
- Promote the approved immutable tag to prod.
- Create the final semver tag (`vX.Y.Z`) on the approved commit.

#### Urgent patch lane (optional short-lived branch)

Use a short-lived release branch only when you must isolate urgent fixes while normal feature work
continues on `main`.

- Branch from the intended release base (for example `release/v3.0.0.1`).
- Land only urgent bugfixes/small improvements.
- Build candidate tags from that branch (for example `release-v3.0.0.1-<shortsha>` if your CI emits
  branch-prefixed tags).
- Deploy candidate to staging and validate.
- Promote approved immutable candidate to prod.
- Create semver tag `v3.0.0.1`.
- Merge/cherry-pick fixes back to `main`.
- Delete the short-lived release branch.

## Environment promotion contract

- **Dev (`env=dev`)**: convenience validation and debugging; may use `main-latest` or immutable tags.
- **Staging (`env=staging`)**: canonical pre-prod validation; use immutable candidate tags.
- **Prod (`env=prod`)**: use approved immutable tags only.

## Standard promotion procedure

### 1) Select a candidate image tag

```bash
gh run list --workflow ci-image.yml --limit 20
```

### 2) Record the candidate in the release log / QA doc

```bash
git rev-parse --short <candidate-commit-sha>
```

### 3) Deploy candidate to staging

Use the staging runbook: [k3s-sugarkube-staging.md](./k3s-sugarkube-staging.md).

### 4) Validate staging gates

- Health endpoints pass (`/config.json`, `/healthz`, `/livez`)
- Critical gameplay and release-specific QA checklist pass
- Rollback command is prepared and verified

### 5) Promote same immutable tag to prod

Use the production runbook: [k3s-sugarkube-prod.md](./k3s-sugarkube-prod.md).

### 6) Tag the release

```bash
git tag vX.Y.Z <approved-commit-sha>
```

```bash
git push origin vX.Y.Z
```

## Rollback policy

- Rollback is an explicit deploy of a previously approved immutable tag.
- Do not rely on mutable tags for rollback.
- Document rollback target tag in the release QA file before promoting to prod.

## QA checklists

- Launch-era v3 checklist (historical): [qa/v3.md](./qa/v3.md)
- Feature track checklist: [qa/v3.1.md](./qa/v3.1.md)
- Urgent patch checklist template for next patch line: [qa/v3.0.0.1.md](./qa/v3.0.0.1.md)
