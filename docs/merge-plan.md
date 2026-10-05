# DSPACE release and promotion procedure

This document defines the steady-state release flow for DSPACE after `v3.0.0`.

## Why this exists

- `main` is the default integration branch.
- The old `v3` branch cutover flow is retired.
- Releases now follow repeatable promotion across environments:
  - planned `dev` (`env=dev`, sugarkube6)
  - live `staging` (`env=staging`, sugarkube3–5)
  - live `prod` (`env=prod`, sugarkube0–2)

Cross-reference runbooks:

- [k3s + sugarkube dev runbook](./k3s-sugarkube-dev.md)
- [k3s + sugarkube staging runbook](./k3s-sugarkube-staging.md)
- [k3s + sugarkube prod runbook](./k3s-sugarkube-prod.md)

## Branching and tagging model

### 1) Day-to-day integration

- Merge normal feature/fix PRs into `main`.
- `ci-image.yml` publishes immutable branch+SHA tags like `main-<shortsha>` and convenience tags
  like `main-latest`.
- `build.yml` validates both architectures on its existing triggers, including git tag pushes;
  it does not publish images or registry cache.
- Use immutable tags (`main-<shortsha>`) for sign-off, promotion, and rollback.

### 2) Optional stabilization branch (only when needed)

Use a short-lived release branch when a release needs focused stabilization (for example `release/v3.0.1`).

```bash
git checkout -b release/vX.Y.Z
```

- Only cherry-pick or merge scoped fixes for that release line.
- Keep branch lifetime short; delete it after release is finalized.

### 3) RC tags for candidate validation

Mark candidate commits with release-candidate git tags before final release sign-off.

```bash
git tag vX.Y.Z-rc.1
```

```bash
git push origin vX.Y.Z-rc.1
```

- RC git tags identify candidate commits; tag pushes run validation without publishing images.
- Select the matching immutable branch-SHA image or digest from a successful `ci-image.yml` run
  for staging sign-off. Keep the full source SHA and approved chart coordinate with the evidence.
- Iterate with new reviewed commits and their immutable images until staging gates pass.

### 4) Final SemVer git tag for production release

After staging approval, create the final SemVer git tag from the approved commit.

```bash
git tag vX.Y.Z
```

```bash
git push origin vX.Y.Z
```

- A tag push alone does not publish a semantic image. Follow the
  [canonical release runbook](./ops/sugarkube-release.md): verify the immutable image and chart
  from the approved source commit before publishing the GitHub release. That published-release
  event makes `ci-image.yml` create the guarded `vX.Y.Z` digest alias without rebuilding.
- Promote the same approved immutable branch-SHA image or digest to prod after approval.
- Record the exact deployed artifact tag and commit SHA in release notes and QA checklist.

## Environment promotion rules

### Dev (planned, non-HA)

- Intended for rapid validation once stood up on sugarkube6.
- `main-latest` is acceptable for convenience iteration.
- `main-<shortsha>` is preferred when you need reproducibility.

### Staging (canonical pre-prod)

- Always deploy immutable candidate tags for release sign-off.
- Validate functional, smoke, and release-specific QA gates.
- Promote only the exact approved immutable tag to prod.

### Prod (public, stable)

- Deploy immutable approved tags only.
- Keep a previous known-good immutable tag ready for rollback.
- Keep QA Cheats off (`DSPACE_ENV=prod`).
- Treat `prod.democratized.space` as optional rehearsal/alias guidance only; the default production
  path is `democratized.space`.

## Patch vs feature releases

### Urgent patch release (example: `v3.0.1`)

- Scope is bugfixes and small improvements only.
- Prefer direct work on `main` unless stabilization isolation is needed.
- If risk is elevated, use short-lived `release/v3.0.1` plus RC tags.
- Validate with patch-focused checklist: [docs/qa/v3.0.1.md](./qa/v3.0.1.md).

### Feature release (example: `v3.1.x`)

- Use normal `main` integration with broader QA scope.
- Optionally cut a short-lived release branch near code freeze for hardening.
- Validate with feature-track checklist: [docs/qa/v3.1.md](./qa/v3.1.md).

## Rollback standard

If a release fails after deploy, roll back to the previous known-good immutable tag.

```bash
cd ~/sugarkube
```

```bash
just helm-oci-upgrade release=dspace namespace=dspace chart=oci://ghcr.io/democratizedspace/charts/dspace values=<env-values-file> version_file=docs/apps/dspace.version tag=<previous-immutable-tag>
```

Then verify runtime health endpoints.

```bash
curl -fsS https://<environment-hostname>/config.json
```

```bash
curl -fsS https://<environment-hostname>/healthz
```

```bash
curl -fsS https://<environment-hostname>/livez
```

## Release record minimums

For each production release, record:

- release git tag (`vX.Y.Z`)
- deployed immutable branch-SHA image tag (for example `main-<shortsha>`) and digest
- commit SHA
- staging validation timestamp + approver
- production deploy timestamp + operator
- rollback tag validated and ready
