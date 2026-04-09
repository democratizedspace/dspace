# `/processes` performance and presentation design (v3.0.1)

## Problem statement

The `/processes` list currently mounts the full process detail experience for every process row,
rather than a lightweight list-card representation. That makes first paint and interactivity do more
work than the list page needs, especially as the catalog grows.

For `v3.0.1`, we need a narrow, low-risk plan that improves:

- render and hydration cost,
- critical-path payload and per-row computation,
- perceived responsiveness,
- visual clarity/scannability on dense lists,

without introducing new product features or architecture rewrites.

## Current state analysis (with code anchors)

### Route and hydration model

- `/processes` SSR route renders `<Processes client:load />`, so meaningful list content is delayed
  until client hydration. `frontend/src/pages/processes/index.astro`
- `Processes.svelte` gates the list behind `mounted`, showing `Loading processes...` until
  `onMount` runs and custom content is queried. `frontend/src/pages/processes/Processes.svelte`

### List row composition

- `Processes.svelte` imports `frontend/src/generated/processes.json`, merges built-ins + custom,
  then renders `<ProcessView slug={processId} />` for **every row**.
- `ProcessView.svelte` wraps `<Process>` and also includes list-inappropriate actions (for a list)
  like **Buy required items**, toast state, and per-row enable/disable logic.

### Detail component breadth reused on list

`Process.svelte` is a full interactive runtime component:

- imports game-state process mutations (`startProcess`, `pause`, `resume`, `finish`, etc.),
  inventory lookups, QA cheats stores, and runtime create-item logic,
- creates a `setInterval(updateState, 100)` ticker,
- also creates a separate 3-second refresh interval,
- subscribes to QA cheat stores,
- computes requirement-deficit pulse feedback and auto-scroll behavior,
- may lazy-load custom process content and requirement item maps.

This is appropriate for detail pages (`/processes/:id`) but expensive as a repeated list row.

### Data shape and catalog scale

- Built-in process payload file is ~315 KB (`frontend/src/generated/processes.json`).
- Built-in process count is 311 in this checkout.
- On `/processes`, current list architecture can instantiate detail-level logic up to catalog size.

### Custom process loading path

- `Processes.svelte` calls `db.list(ENTITY_TYPES.PROCESS)` on mount, using IndexedDB-backed
  `getProcesses()` / fallback in `customcontent.js`.
- This async merge is fine functionally, but combined with full list mount it delays meaningful UI
  and contributes additional client work during first interaction.

### Presentation rough edges (list-page specific)

- The list page currently has large, detail-like cards with full requirement/consume/create blocks,
  action chips, and state controls. This reduces scan efficiency on long lists.
- “Buy required items” appears on list rows (via `ProcessView`), which is a detail-style action and
  likely over-scopes list semantics.
- Global “Loading processes...” placeholder persists until mount instead of offering immediate SSR
  list skeleton/summary.
- Dense interactive controls per row increase visual noise and accidental-click surface.

## Observed facts vs informed hypotheses

### Measured/observed facts (from code + repository inspection)

1. `/processes` list mounts `ProcessView` for every process row.
2. `ProcessView` includes buy-required-items state/action logic in addition to `<Process>`.
3. `Process` runs multiple intervals and interactive state handling logic not specific to list
   browsing.
4. Built-in process payload is ~315 KB and catalog size is 311 processes.
5. `/processes` content is gated behind client mount/hydration.

### Informed hypotheses (to validate in implementation)

1. Hydration cost is dominated by per-row `Process` component initialization, not by custom-process
   IndexedDB fetch alone.
2. Removing detail-only logic from list rows should materially improve time-to-first-list-visible
   and input responsiveness on slower devices.
3. A list-summary shape (title + duration + compact I/O preview + link) can preserve utility while
   reducing layout density and JS work.
4. Moving “buy required items” to detail view only should reduce list cognitive load and runtime
   computations without gameplay loss.

## Goals

1. Improve `/processes` list perceived load and responsiveness with low-risk patch changes.
2. Reduce row-level rendering and hydration cost by avoiding detail-component fan-out on the list
   route.
3. Keep gameplay semantics and process runtime behavior unchanged on detail pages.
4. Improve list readability/scannability with minor presentation cleanup (no feature expansion).
5. Preserve SSR safety and offline-first behavior.

## Non-goals

- No new search/filter/pagination feature set for players.
- No process schema changes or migrations unless unavoidable (not currently needed).
- No new backend/service caching system.
- No redesign of process runtime mechanics.
- No broad component architecture rewrite across unrelated routes.

## Constraints and risks

### Constraints

- Patch-line scope (`v3.0.1`) requires narrowly scoped, high-confidence changes.
- Must remain SSR-safe (browser APIs only in browser lifecycle/guards).
- Must remain offline-first with existing local storage and IndexedDB behavior.
- Must avoid regressions for custom process visibility and detail interactions.

### Risks

- Splitting list/detail UI may accidentally diverge displayed process metadata.
- If summary data is generated separately, drift risk exists unless sourced from the same generated
  process dataset.
- Moving actions off list could be interpreted as behavior regression unless affordances clearly
  link to detail pages.
- Over-tight card compaction could reduce accessibility/readability if not tested.

## Candidate approaches considered

### Approach A — Keep current components, tune around edges

**Description:** Keep `<ProcessView>` per row and only tweak CSS, conditional sections, and defer
some calculations.

- **Pros:** Minimal file churn.
- **Cons:** Core issue (detail component fan-out) remains; likely limited gains.
- **Patch fit:** Weak.

### Approach B — Introduce lightweight list row component (recommended)

**Description:** Keep full `ProcessView` + `Process` for detail routes, but use a dedicated
list-summary component on `/processes` that renders only list-critical fields.

- **Pros:** Directly removes most per-row runtime cost from list route; low-risk separation of
  responsibilities.
- **Cons:** Requires a new list component and tests; careful parity checks needed.
- **Patch fit:** Strong.

### Approach C — Route-level progressive rendering with built-in first, custom second

**Description:** Show built-in summaries immediately; merge custom processes asynchronously after
first render.

- **Pros:** Faster initial list visibility; preserves custom content support.
- **Cons:** Requires careful ordering/stability to avoid jarring reflow.
- **Patch fit:** Strong when paired with B.

### Approach D — Build a generated lightweight process list manifest

**Description:** Add a generated summary artifact separate from full `processes.json`.

- **Pros:** Smaller payload + clearer list contract long-term.
- **Cons:** Adds build-step complexity and maintenance surface for a patch release.
- **Patch fit:** Medium (plausible, but defer if B+C already meet launch gate).

### Approach E — Virtualization/windowing for long list

**Description:** Render only visible rows.

- **Pros:** Significant scaling upside at very large catalog sizes.
- **Cons:** Higher complexity/risk, keyboard-navigation and SSR/hydration nuances.
- **Patch fit:** Low for `v3.0.1`; better for `v3.1+`.

## Recommended approach for `v3.0.1`

Adopt **Approach B + C** as the core patch plan, with a small subset of D only if needed.

### 1) Must-have / safest patch-release changes

1. **Decouple list rows from detail runtime component tree**
   - Replace per-row `<ProcessView>` on `/processes` with a lightweight list row component
     (e.g., title, duration, compact requires/consumes/creates counts or concise preview).
   - Keep full runtime actions (`Start/Pause/Resume/Collect`, progress bar, buy-required-items,
     QA chip behavior) on detail page component path only.

2. **Render built-in list content immediately; async-merge custom**
   - Avoid blocking first list paint on `onMount`-only gate.
   - Present built-in list shell/content first; merge custom rows after `db.list(...)` resolves.
   - Preserve stable keying/sort to minimize layout shift.

3. **Presentation cleanup focused on scanability**
   - Reduce card density and action noise on list page.
   - Keep primary navigation affordance to detail page explicit (e.g., row click/link/chip) without
     introducing new feature concepts.

4. **Keep SSR/offline safety intact**
   - No browser API access at module top-level for new list code.
   - Maintain fallback behavior when IndexedDB unavailable.

### 2) Nice-to-have but still plausible in patch line

1. **Minimal summary projection helper**
   - Introduce a shared helper that projects full process definitions to list-summary shape at
     runtime, avoiding a new build pipeline.

2. **Small visual stability improvements**
   - Reserve row spacing for async custom merge and loading transitions.
   - Tighten typography/spacing for large lists while preserving accessibility contrast.

3. **Add explicit list/detail component responsibility docs/comments**
   - Prevent regression where list route re-imports detail runtime component by convenience.

### 3) Explicit deferrals for `v3.1+`

1. Generated process list manifest artifact and build pipeline changes.
2. Virtualization/windowing.
3. Advanced search/filter/pagination UX improvements.
4. Any new gameplay actions on list route.
5. Broader process information architecture redesign.

## Why this recommendation fits `v3.0.1`

- It targets the biggest likely cost center (detail-component fan-out) with minimal conceptual
  change.
- It avoids risky data-model and runtime-mechanics changes.
- It can be implemented in small PR-sized slices and validated with existing QA machinery.
- It improves both performance and presentation without introducing user-facing feature scope creep.

## Rollout and verification plan

### Engineering verification (pre-merge)

Required baseline checks from patch QA guidance:

- `npm run lint`
- `npm run type-check`
- `npm run link-check`
- `node run-tests.js` (or `npm run qa:smoke` only if runtime-constrained and explicitly recorded)

Route-specific checks to add/use:

- Unit/component tests ensuring `/processes` list renders lightweight rows and still exposes manage
  and create navigation.
- Regression tests for custom process merge behavior on list route.
- Regression tests confirming detail route retains full runtime controls and buy-required-items
  behavior.

### Staging launch gate (`v3.0.1`-appropriate)

1. Deploy immutable candidate to staging.
2. Verify health endpoints and config (`/config.json`, `/healthz`, `/livez`).
3. Manual route checks:
   - `/processes` first paint shows list content quickly and remains usable while custom merge
     happens.
   - `/processes/:id` retains full interaction semantics.
   - `/processes/manage` unchanged for custom authoring workflow.
4. Capture comparative browser performance traces for `/processes` (pre/post candidate) and store
   artifacts in release notes or PR discussion.

> Note: This design does **not** claim numeric performance deltas. Measurements must be collected
> during implementation validation.

## Acceptance criteria

1. `/processes` no longer mounts full detail runtime component (`ProcessView`/`Process`) per list
   row.
2. Built-in process list content becomes visible without waiting for custom-process IndexedDB fetch
   completion.
3. Custom processes still appear on `/processes` after async merge, with no duplicate/missing rows.
4. `/processes/:processId` detail behavior (including buy-required-items and process runtime
   controls) remains functionally unchanged.
5. Patch QA gates pass (`lint`, `type-check`, `link-check`, tests/smoke as documented).
6. No SSR safety regressions introduced by list changes.

## Recommended implementation slices (2–4 PR-sized chunks)

1. **Slice 1: List/detail separation (core)**
   - Add lightweight process list row component.
   - Update `Processes.svelte` to render summary rows, not `ProcessView`.
   - Keep detail routes unchanged.

2. **Slice 2: First-render and merge behavior**
   - Rework mount gating so built-ins render immediately.
   - Async merge custom processes with stable ordering/keys.
   - Add tests for initial + merged states.

3. **Slice 3: Presentation polish + guardrails**
   - Compact list styles for scanability.
   - Ensure action surface is list-appropriate and detail-link-forward.
   - Add regression tests/docs notes to prevent detail-component reintroduction.

4. **Optional Slice 4 (if needed): Runtime summary projection helper**
   - Centralize process-to-list-summary projection utility.
   - Keep full manifest generation deferred unless required.

## Open questions and deferred follow-ups

1. Should process list default ordering be adjusted (e.g., alphabetical vs source order) for better
   scanability, or is that out of scope for patch line?
2. Is a generated summary manifest warranted after `v3.0.1` if runtime projection still leaves
   material payload overhead?
3. Do we need a formal `/processes` timing harness (analogous to `/quests`) in `v3.1` to keep
   regressions visible?
4. Should list rows ever include lightweight start actions, or should all runtime mutations remain
   detail-only by policy?

## Primary code anchors reviewed

- `frontend/src/pages/processes/index.astro`
- `frontend/src/pages/processes/Processes.svelte`
- `frontend/src/pages/process/[slug]/ProcessView.svelte`
- `frontend/src/components/svelte/Process.svelte`
- `frontend/src/generated/processes.json`
- `frontend/src/utils/customcontent.js`
- `frontend/src/utils/indexeddb.js`
- `frontend/src/pages/process/[slug].astro`
- `frontend/src/pages/processes/[processId].astro`
- `frontend/src/pages/processes/svelte/ManageProcesses.svelte`
- `frontend/src/components/svelte/ProcessPreview.svelte`
- `frontend/__tests__/manageActionButtons.test.js`
- `frontend/__tests__/ProcessStartFeedback.test.js`
- `docs/qa/v3.0.1.md`
