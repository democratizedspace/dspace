# DSPACE release management and promotion plan

This document defines the **steady-state** release process for DSPACE after the v3.0.0 launch.
It replaces one-time cutover language and supports repeatable promotions:

- `dev` (planned, non-HA, sugarkube6) →
- `staging` (live, HA, sugarkube3-5) →
- `prod` (live, HA, sugarkube0-2)

Related runbooks:

- [Dev runbook](./k3s-sugarkube-dev.md)
- [Staging runbook](./k3s-sugarkube-staging.md)
- [Prod runbook](./k3s-sugarkube-prod.md)
- [Patch QA template (v3.0.0.1)](./qa/v3.0.0.1.md)
- [Feature-track QA template (v3.1)](./qa/v3.1.md)

## 1) Branching model

### Default path

- `main` is the default integration branch.
- Daily development lands on `main` via reviewed PRs.
- CI publishes images with convenience + immutable tags (for example `main-latest` and
  `main-<shortsha>`).

### Optional release branch (when stabilization is needed)

Use a short-lived `release/<version>` branch only when needed (for example `release/v3.0.0.1`):

- Purpose: isolate urgent fixes or release hardening from ongoing feature work on `main`.
- Lifetime: from branch cut until release tag is finalized; then merge back and delete.
- Scope: bugfixes/small improvements only for patch trains (for example `v3.0.0.1`).

For larger feature trains (for example `v3.1.x`), use `main` directly unless stabilization pressure
justifies a temporary release branch.

## 2) Tagging model

Use immutable tags for validation, sign-off, promotion, and rollback.

### Convenience tags (mutable)

- `main-latest` (and similar) are convenience tags only.
- Suitable for fast iteration in dev.
- Not suitable as release sign-off artifacts.

### Immutable build tags

- `main-<shortsha>` from `main` builds.
- `release-<shortsha>` or `<branch>-<shortsha>` from temporary release branch builds.
- Deploy these to staging/prod for reproducible validation and explicit rollback.

### RC and release tags

- RC tags: `vX.Y.Z-rc.N` for candidate sign-off in staging.
- Final release tags: `vX.Y.Z` once candidate is approved.
- Semver tags should reference the commit that actually shipped.

## 3) Environment promotion policy

### Dev (planned)

- Planned topology: single node (`sugarkube6`), `env=dev`, non-HA.
- Use `main-latest` for convenience.
- Use `main-<shortsha>` when a reproducible debugging/QA state is needed.

### Staging (live)

- Live topology: 3-node HA (`sugarkube3`, `sugarkube4`, `sugarkube5`), `env=staging`.
- Canonical pre-prod validation environment.
- Deploy immutable candidate tags first; validate; iterate until sign-off.

### Prod (live)

- Live topology: 3-node HA (`sugarkube0`, `sugarkube1`, `sugarkube2`), `env=prod`.
- Deploy only approved immutable tags.
- Keep rollback target ready (last known-good immutable tag).

## 4) Standard release flow (repeatable)

1. Pick target version and scope (patch vs feature).
2. Decide whether a temporary release branch is needed.
3. Produce candidate image/chart artifacts.
4. Deploy immutable candidate tag to staging.
5. Run QA gates (use the appropriate QA doc).
6. Iterate candidates until staging sign-off.
7. Approve final immutable tag for prod deployment.
8. Deploy approved immutable tag to prod.
9. Run prod smoke checks.
10. Create final semver tag if not already created.
11. Record deployment and rollback metadata in release notes.

## 5) Patch vs feature guidance

### Patch train example: `v3.0.0.1`

- Scope: urgent bugfixes and small improvements only.
- Prefer short-lived `release/v3.0.0.1` only if needed to shield patch work.
- Validate in staging using immutable candidate tags.
- Promote approved immutable tag to prod.
- Finalize `v3.0.0.1` semver tag.

### Feature train example: `v3.1.x`

- Scope: feature changes and broader validation.
- Use the [v3.1 QA checklist](./qa/v3.1.md).
- Use RC tags as needed for staged sign-off.
- Promote approved immutable tag to prod, then finalize semver tag.

## 6) Minimal operator checklist

- [ ] Candidate tag is immutable (`*-<shortsha>` or `vX.Y.Z-rc.N`).
- [ ] Staging deploy uses the intended values overlay for `env=staging`.
- [ ] QA sign-off completed for the release type (patch or feature).
- [ ] Prod deploy uses approved immutable tag.
- [ ] Rollback command and previous tag are documented before prod deploy.
- [ ] Final semver tag and release notes are recorded.
