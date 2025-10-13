# Structural polish prompt

Use these prompts when DSPACE needs repo-wide hardening without removing any features. Copy the blocks into Codex as-is.

## Prompt
```markdown
# Structural polish playbook for the DSPACE repo

You are Codex working in the democratizedspace/dspace repository. Follow every instruction in this prompt exactly and stop after producing the requested artifacts.

## Mission
Strengthen repository structure, offline resilience, accessibility, testing, and documentation while keeping every existing game feature and CI job intact.

## Repository snapshot
- **Workspace**: pnpm monorepo with `frontend/` (Svelte + Vite) and `backend/` (service helpers), plus `ansible/`, `k8s/`, `monitoring/`, `scripts/`, and `docs/`.
- **Node target**: Node 18 remains compatible; CI runs Node 20 (see `.nvmrc`, Jest, Vitest configs).
- **Accessibility posture**: WCAG 2.2 AA intent with keyboard-first navigation and consistent focus management.

## High-ROI polish tracks
1. **Monorepo shape**
   - Move toward `apps/frontend`, `apps/backend`, and `packages/*` for shared contracts (auth, types, content schemas).
   - Relocate deployment assets under `infra/` (e.g., `infra/k8s`, `infra/ansible`) with per-environment overlays.
   - Preserve developer affordances: migrate import paths, update workspace manifests, wire aliases across Vite, Vitest, Jest, and TS configs, and document the transition.
2. **Offline-first rigor**
   - Formalize the service worker: precache the shell (`/`, `/play`, `/quests/*`), version cache keys, and define runtime caching for quest JSON and static assets.
   - Lock in save-state migrations via versioned schemas, fixtures for legacy saves, and rollback documentation.
   - Extend CI with regression tests that simulate offline flows and ensure quests still launch when the network is unavailable.
3. **Accessibility & UX**
   - Enforce linting for `aria-*` coverage, focus visibility, and contrast (ESLint, Stylelint, and Svelte-specific rules); fail CI on violations.
   - Maintain a manual keyboard-only walkthrough covering global nav, quest selection, quest runtime, and settings; store it under `docs/ops/a11y-checklist.md`.
   - Capture accessibility regressions with Playwright snapshots (e.g., `page.accessibility.snapshot()` to confirm landmarks).
4. **Testing & observability**
   - Add contract tests validating the JSON schema the frontend expects from the backend via a shared `packages/content-schema` module.
   - Snapshot quests and NPC bios so content mutations surface immediately.
   - Thread opt-in telemetry hooks guarded by a privacy toggle; cover opt-out paths with tests and document the behavior.
   - Keep docs link checking running in CI (see the `link-check` job) whenever restructuring documentation.

## Directory hygiene
- Keep the repository root lean: `README.md`, `pnpm-workspace.yaml`, lockfiles, configs, and entry scripts.
- Move deployment and monitoring code under `infra/` with environment overlays.
- Partition docs into `docs/` (player guides), `docs/ops/` (production runbooks), and `docs/contrib/` (contributor onboarding).
- Ensure the README entry map spotlights "play", "develop", "test", and "deploy" quick-start links.

## Prompt migration guardrails
- Store prompt docs in `docs/prompts/codex/` with concise filenames (no "prompt" or "codex").
- Update internal links, regenerate link-check snapshots, and refresh `frontend/src/pages/docs/md/prompts-codex.md` when prompts move.

## Orthogonality & saturation rule
Switch from `implement.md` to this polish prompt when feature PRs collide:
1. Two consecutive implementation prompts land within a week and both require manual rebases due to overlapping files.
2. Pause new feature prompts for one sprint and focus on polish (directory moves, shared packages, caching, accessibility linting, schema contracts).
3. Resume `implement.md` once polish tasks complete with CI green and docs updated.

## Execution checklist
1. Confirm scope with stakeholders: no features removed, CI jobs stay intact.
2. Draft migration diagrams plus TODOs in `docs/contrib/architecture-notes.md` before touching code.
3. Use feature flags or staged rollouts for directory reshapes; keep local dev, CI, and deploy scripts aligned.
4. Run `pnpm install`, `pnpm run lint`, `pnpm run type-check`, `pnpm run build`, and `pnpm run test:ci`; rerun `pnpm run coverage` if schemas change.
5. Execute `pnpm run link-check` (or inspect the `link-check` action) to validate documentation.
6. Scan staged changes with `git diff --cached | ./scripts/scan-secrets.py`; commit with an emoji-prefixed message.
7. Update `docs/prompts/codex/baseline.md` and in-game docs indexes with any new guides.

Deliver a succinct PR summary, list of tests, and any migration follow-ups.
```

## Upgrade prompt
```markdown
# Upgrade the structural polish playbook

You are Codex reviewing `docs/prompts/codex/polish.md`. Improve the primary prompt block so it stays evergreen, precise, and copy-paste ready.

## Instructions
- Audit every section for clarity, duplication, missing safeguards, or outdated repository realities; rewrite or reorder content to optimize signal.
- Preserve all core requirements: monorepo reshaping guidance, offline-first rigor, accessibility posture, testing/observability upgrades, directory hygiene, prompt migration guardrails, saturation rule, and execution checklist.
- Tighten language, group related actions, and add any missing high-impact guardrails discovered since the last revision.
- Validate external references (`docs/ops/`, `docs/contrib/`, CI jobs, scripts) so they stay accurate.
- Output the revised prompt block in a single fenced code block ready to replace the existing one.
```
