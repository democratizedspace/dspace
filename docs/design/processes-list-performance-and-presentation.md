# `/processes` list performance + presentation design (v3.0.1)

## 1) Problem statement

The `/processes` page is currently doing detail-page-grade work for every list row, which increases
CPU, hydration, and rendering cost as process count grows. The route also withholds the entire list
until client mount, so users see a loading state even though built-in process data is available at
build time.

For v3.0.1, we need a **narrow, low-risk** plan that improves first meaningful paint,
interactivity readiness, and visual clarity of dense process lists **without adding new gameplay
features**.

## 2) Current state analysis (with code anchors)

### 2.1 Route and hydration model

- `frontend/src/pages/processes/index.astro` renders `<Processes client:load />`, so list content is
  client-only and does not SSR meaningful rows.
- `frontend/src/pages/processes/Processes.svelte` imports built-in JSON directly and then renders
  `{#each allProcesses}` where each row mounts `<ProcessView slug={processId} />`.

### 2.2 List rows currently mount detail-view logic

`ProcessView.svelte` (detail-route component) is reused inside every `/processes` row. For each row,
it currently:

- resolves built-in vs custom process;
- computes buyability (`canBuyRequired`, `updateDisabled`);
- does per-required-item lookups in `items` for price checks;
- mounts `<Process ...>`;
- conditionally renders `Buy required items` CTA and toast logic.

This is appropriate for `/processes/[slug]`, but heavy for a dense list.

### 2.3 Nested component cost in `Process.svelte`

Each mounted `Process` row also brings substantial runtime machinery:

- multiple timers/intervals (`updateIntervalMs = 100`, plus 3s refresh interval), mounted per row;
- state polling and sync (`syncGameStateFromLocalIfStale`, `getProcessState`, `getRuntimeCreateItems`);
- dynamic loading for custom process fallback;
- item metadata/map loading (`getItemMap`) and image lifecycle management;
- rich interaction states (start/pause/resume/cancel/collect, QA instant finish, pulse feedback).

When instantiated for many rows, this multiplies background work and DOM complexity.

### 2.4 Data-shape mismatch for list rendering

- Built-in process payload (`frontend/src/generated/processes.json`) is ~315 KB and 311 entries.
- The list page mainly needs summary fields (id, title, short requirements preview, duration,
  route href).
- Current implementation mounts full interaction surfaces (chips, progress/timers, item metadata
  resolution) up front for all rows.

### 2.5 Custom content merge behavior

`Processes.svelte` renders only after `mounted === true` and then merges built-ins with
`db.list(ENTITY_TYPES.PROCESS)` results.

- Good: custom content is loaded asynchronously.
- Cost issue: built-ins are also blocked behind mount, so first paint waits unnecessarily.

## 3) Observed facts vs informed hypotheses

### Measured/verified facts from code inspection

1. `/processes` list mounts `ProcessView` per row.
2. `ProcessView` mounts `Process` and includes buy-required-items logic intended for detailed
   interaction.
3. `Process` starts intervals and maintains dynamic process runtime state per mounted instance.
4. Built-in process corpus is currently 311 entries in generated JSON.

### Informed hypotheses (not benchmark-verified in this PR)

1. Per-row intervals/state polling are likely a primary contributor to sluggishness on low-end
   devices when rendering many rows.
2. Reusing detail component trees on list rows likely increases hydration time and memory pressure.
3. Deferring heavy interaction controls to detail pages (or row expansion) should improve perceived
   responsiveness for `/processes` without changing gameplay semantics.

## 4) Presentation/UX rough edges (list-page relevant)

1. **Delayed first content**: list hidden until mount (`Loading processes...`) despite built-ins being
   static and known.
2. **Dense visual overload**: each row shows full interactive process controls; this reduces
   scannability for long catalogs.
3. **Card height variability** from full requirement/consume/create blocks + action controls makes
   quick scanning harder.
4. **Action ambiguity on list page**: “Buy required items” appears per row in list context; this is a
   detail-task action and can distract from browse/scan intent.
5. **Potential motion churn** from many row-level dynamic states (progress/remaining-time updates,
   pulse feedback) on one page.

## 5) Goals

- Reduce initial `/processes` render and hydration cost with minimal architecture risk.
- Improve first meaningful content by showing built-in process list content earlier.
- Preserve core process semantics and offline-first behavior.
- Improve list-page scan clarity (summary-first presentation).
- Keep v3.0.1 scope patch-safe and implementation-friendly.

## 6) Non-goals

- New product features (new search/filter UX, pagination, new gameplay semantics).
- Reworking process runtime engine.
- Schema migrations unless strictly necessary for list summary generation.
- Replacing custom-content storage architecture.
- Full virtualization framework adoption in v3.0.1.

## 7) Constraints and risks

- Must remain SSR-safe and offline-first.
- Must not break existing process route behavior (`/processes/:slug`).
- Must preserve custom-process visibility.
- Must avoid correctness regressions in process start/finish flows.
- Patch-release risk control: keep changes mostly to list route composition and rendering boundaries.

## 8) Candidate approaches considered

### A) Keep current architecture, add micro-optimizations only

Examples: memoized lookups, minor style trimming, reduced timers.

- Pros: smallest diff.
- Cons: leaves core issue (detail component per row) intact; likely limited impact.
- Verdict: insufficient alone.

### B) Introduce a lightweight list-row component and keep detail logic on slug route

Create a summary row component for `/processes` (title, duration, compact IO preview, link to
`/processes/{id}`), and stop mounting `ProcessView` for each row.

- Pros: high confidence, narrow change, directly removes heavy per-row runtime.
- Cons: requires careful parity decisions on what list should show.
- Verdict: strongest v3.0.1 candidate.

### C) Build-time process list manifest (summary shape)

Generate a list-specific artifact (id/title/duration/compact counts/optional normalized fields), and
have `/processes` use that instead of full rich process payload.

- Pros: lower payload/prop surface for list path; deterministic and scalable.
- Cons: introduces generation pipeline adjustments.
- Verdict: good companion to B; keep schema minimal.

### D) Split built-in first render from deferred custom merge

Render built-ins immediately (SSR-compatible path where possible), then merge custom processes from
IndexedDB after mount.

- Pros: improves perceived responsiveness; preserves custom support.
- Cons: requires careful “custom arriving later” UI treatment.
- Verdict: good must-have if done conservatively.

### E) Virtualized list/windowing in v3.0.1

- Pros: handles very large lists.
- Cons: higher complexity and regression risk (a11y, focus, dynamic heights).
- Verdict: defer to v3.1+ unless profiling proves unavoidable.

## 9) Recommended approach for v3.0.1

Adopt **B + D** as must-have, with **C** as a plausible patch-safe enhancement if implemented
minimally.

### 9.1 Must-have / safest patch-release changes

1. **Stop mounting `ProcessView` per list row** on `/processes`.
   - Replace with a lightweight summary row component focused on browse/scan.
2. **Keep heavy interaction on detail route** (`/processes/[slug]`) where `ProcessView` belongs.
3. **Render built-in list content immediately** (do not block all rows on `onMount`).
4. **Load custom processes after mount and append/merge** without re-rendering the whole page
   structure abruptly.
5. **Presentation cleanup for dense lists**:
   - tighter row layout,
   - consistent heading/duration placement,
   - concise IO preview rather than full interaction controls.

### 9.2 Nice-to-have (still plausible for patch release)

1. **Process list manifest** generated under `frontend/src/generated/processes/` (or equivalent)
   containing only list-needed fields.
2. **Stable sort/grouping guarantees** for built-in + custom merge to reduce visual reflow.
3. **Minimal list-level affordance copy tweaks** (e.g., “Open details” action) for clarity.

### 9.3 Explicit deferrals for v3.1+

1. List virtualization/windowing.
2. New search/filter/pagination UX.
3. Rich inline actions (including “buy required items”) on list page.
4. Broader process runtime state architecture changes.

## 10) Why this is appropriate for v3.0.1

- It removes obvious structural inefficiency (detail logic mounted N times) with localized route/UI
  composition changes.
- It avoids gameplay or schema semantics changes.
- It preserves existing, battle-tested detail interactions on slug pages.
- It aligns with patch-release risk profile: focused, high-confidence, testable.

## 11) Rollout and verification plan

### 11.1 Implementation rollout strategy

1. Land summary-row list path behind direct replacement in `/processes` page.
2. Keep `/processes/[slug]` unchanged for interaction behavior.
3. Add/adjust tests for list rendering expectations and no-detail-per-row regression.
4. Run release QA commands relevant to docs + route + core process behavior.

### 11.2 Verification guidance (DSPACE-specific)

At implementation time, include at minimum:

- Automated:
  - `npm run lint`
  - `npm run type-check`
  - `npm run build`
  - `npm run link-check`
  - process-related unit/component tests
- Route smoke:
  - `/processes` renders quickly with built-ins visible before custom merge completes.
  - `/processes/:slug` interaction parity (start/pause/resume/cancel/collect) unaffected.
- Custom content:
  - custom processes still appear on `/processes` after mount and remain editable via manage route.

Use `docs/qa/template.md` and `docs/qa/v3.md` as launch-gate references.

## 12) Acceptance criteria

1. `/processes` no longer mounts `ProcessView` for every list row.
2. List rows render a lightweight summary component with stable layout.
3. Built-in process rows are visible without waiting on IndexedDB custom process fetch.
4. `/processes/:slug` retains existing behavior for process actions.
5. Custom processes still appear on list after asynchronous load.
6. No new route or SSR regressions introduced.
7. QA gates for lint/type/build/link-check and process smoke pass.

## 13) Recommended implementation slices (2–4 PR-sized chunks)

1. **Slice 1 (must-have):**
   - Introduce lightweight `ProcessListRow` presentation component and wire `/processes` to use it.
   - Remove per-row `ProcessView` usage from list page.
2. **Slice 2 (must-have):**
   - Render built-ins immediately; defer custom merge post-mount.
   - Add tests covering built-in-first rendering and custom merge.
3. **Slice 3 (nice-to-have):**
   - Add optional generated process list manifest and migrate `/processes` list input to manifest.
4. **Slice 4 (nice-to-have polish):**
   - Compact spacing/typography pass for dense list readability; ensure no layout jump on custom
     merge.

## 14) Open questions and deferred follow-ups

1. Should list rows include any inline action beyond “open details,” or stay purely summary in
   v3.0.1?
2. Do we want a manifest immediately, or can v3.0.1 ship with lightweight row + built-in-first
   rendering and adopt manifest in v3.1?
3. If custom process count grows substantially, should v3.1 prioritize virtualization or server-side
   prerendered grouping first?
4. Should we add lightweight telemetry (dev-only) for `/processes` first-content timing to validate
   improvements post-release?

---

## Appendix A: Primary files inspected

- `frontend/src/pages/processes/index.astro`
- `frontend/src/pages/processes/Processes.svelte`
- `frontend/src/pages/process/[slug]/ProcessView.svelte`
- `frontend/src/components/svelte/Process.svelte`
- `frontend/src/components/svelte/ProcessPreview.svelte`
- `frontend/src/pages/processes/svelte/ManageProcesses.svelte`
- `frontend/src/generated/processes.json`
- `frontend/src/utils/customcontent.js`
- `frontend/src/utils/indexeddb.js`
- `docs/qa/template.md`
- `docs/qa/v3.md`
- `docs/design/quests-tti-optimization.md`
