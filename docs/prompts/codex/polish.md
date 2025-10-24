# DSPACE structural polish prompt

Use this when the repo needs structural hardening without dropping features or CI coverage.

## Copy-ready prompt
```markdown
# DSPACE structural polish playbook

You are Codex working in the democratizedspace/dspace repository. Follow every instruction exactly and
stop after delivering the requested artifacts.

## Mission
Rework structure, resilience, and documentation so the game ships smoother while every existing
feature, quest, and CI job stays intact.

## Snapshot
- **Workspace**: pnpm monorepo with `frontend/` (Svelte + Vite) and `backend/` (service helpers), plus
  `infra/ansible`, `infra/k8s`, `infra/monitoring`, `scripts/`, and `docs/`.
- **Node target**: Author for Node 18+, ensure Node 20 CI (`.nvmrc`, Jest, Vitest) keeps passing.
- **Accessibility posture**: WCAG 2.2 AA intent with consistent navigation, visible focus, and
  keyboard-first flows.

## High-ROI refactors
1. **Monorepo shape**
   - Gradually shift to `apps/frontend`, `apps/backend`, and `packages/*` (shared types, auth,
     content schemas).
   - Keep `infra/k8s`, `infra/ansible`, and `infra/monitoring` in sync with env-specific overlays and
     updated deploy docs.
   - Update pnpm workspaces, TypeScript paths, Jest/Vitest aliases, importers, and scripts as moves
     land.
2. **Offline-first rigor**
   - Specify a service-worker strategy: precache `/`, `/play`, `/quests/*`; runtime-cache assets and
     quest JSON; version cache keys for busting.
   - Keep local save data migratable with versioned schemas, fixtures for historic saves, and
     documented rollback steps.
   - Regression tests for offline quest start and persistence of cached assets live in
     `tests/offlineQuestCache.test.ts`.
3. **Accessibility & UX**
   - Enforce lint rules for `aria-*`, focus visibility, and contrast; break CI on violations.
   - Maintain a manual keyboard-only walkthrough (global nav → quest select → quest run → settings)
     in `docs/ops/a11y-checklist.md`.
   - Capture accessibility baselines via Playwright snapshots or accessibility tree exports.
4. **Testing & observability**
   - Establish contract tests between frontend and backend using shared JSON schema packages.
   - Snapshot quests/NPC bios so unintended edits surface immediately.
   - Thread opt-in telemetry hooks guarded by privacy toggles; test opt-out paths and document the
     behavior.
   - Keep docs link checking in CI; fix broken references during reorganizations.

## Directory hygiene
- Keep the root lean: `README.md`, workspace manifests, lockfiles, configs, entry scripts.
- Collect deploy/ops code under `infra/` (`infra/k8s`, `infra/ansible`, monitoring overlays).
- Split documentation: player guides under `docs/`, runbooks under `docs/ops/`, contributor material
  under `docs/contrib/`.
- Maintain a concise README entry map with "play", "develop", "test", and "deploy" quick links.

## Prompt migration guardrails
- Store Codex prompt docs in `docs/prompts/codex/` with concise filenames (drop "prompt"/"codex").
- Update internal/external links plus any generated prompt indexes after moves.
- Re-run docs link checkers whenever prompts relocate.

## Orthogonality & saturation rule
Switch from `implement.md` to this polish playbook when:
1. Two implementation PRs within a week collide and require manual rebases on overlapping files.
2. The queue shows repeated directory/import churn that blocks new features.
3. A sprint of polish lands with CI green and docs updated; then resume `implement.md`.

## Execution checklist
1. Align scope with stakeholders: no feature removals, all CI jobs stay.
2. Draft migration notes in `docs/contrib/architecture-notes.md` before touching code.
3. Roll out directory moves with feature flags or staged aliases so dev, CI, and deploy scripts stay
   aligned.
4. Run `pnpm install`, `pnpm run lint`, `pnpm run type-check`, `pnpm run build`, `pnpm run test:ci`,
   and re-run coverage if schemas shift.
5. Execute docs link checking (`pnpm run link-check` or equivalent) after reorganizing files.
6. Scan staged changes with `git diff --cached | ./scripts/scan-secrets.py`; commit with an
   emoji-prefixed message.
7. Update indexes (`docs/prompts/codex/baseline.md`, player docs) after adding or moving guides.

Deliver a concise PR summary, the tests you ran, and any follow-up tickets.
```

## Upgrade prompt
```markdown
# Upgrade the structural polish playbook

You are Codex reviewing `docs/prompts/codex/polish.md`. Improve the primary prompt so it stays
copy-paste ready, evergreen, and precise.

## Instructions
- Audit each section for clarity, duplication, and alignment with current repository realities.
- Preserve mission, snapshot, high-ROI tracks, directory hygiene, prompt migration guardrails,
  saturation rules, and execution checklist.
- Tighten language, merge redundant steps, and add any newly required guardrails discovered during
  recent work.
- Verify all referenced paths (`docs/ops/`, `docs/contrib/`, CI jobs, scripts) remain accurate.
- Output a single fenced code block replacing the existing prompt when done.
```
