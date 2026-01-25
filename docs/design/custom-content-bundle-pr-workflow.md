# DSPACE v3.1 Design: Custom Content Bundle PR Workflow

**Status:** Draft (proposal for v3.1)  
**Audience:** Maintainers, content tooling contributors, QA  
**Scope:** Client-side bundle selection, dependency validation, and GitHub PR creation for
custom quests/items/processes.

## Context

The current v3 QA checklist references a quest-only submission flow, but the real-world workflow
needs to promote **bundles of interrelated custom quests, items, and processes**. The goal for
v3.1 is a **single-click PR** that promotes custom content into built-in content, including
**512×512 optimized images** stored alongside metadata in IndexedDB. This doc proposes the
workflow, dependency closure validation, and GitHub API steps needed to achieve that.

## Goals

- Support **bundle submissions** that include any mix of custom quests, items, and processes.
- Allow users to **initially select any subset** of custom entities, then automatically require
  **all referenced custom entities** via dependency closure.
- Include **all metadata + images** for the selected content in the PR (no manual uploads).
- Use the existing GitHub PAT stored in IndexedDB (the same token used for Cloud Sync when
  possible) to create a **full PR in one click**.
- Promote custom content into the repo’s built-in paths under
  `frontend/src/pages/quests`, `frontend/src/pages/inventory`, and `frontend/src/pages/processes`.

## Non-goals

- Server-side submission services (v3.1 remains client-only for this flow).
- New custom content schemas (reuse existing quest/item/process schemas).
- Auto-resolving **built-in** dependencies (only custom references are enforced).
- Multi-repo submission (still targeting `democratizedspace/dspace`).

## Current State (v3)

- Custom quests/items/processes are stored in **IndexedDB**.
- Quest and item images are downsampled to **512×512** and compressed for web storage.
- `submitBundlePR` currently uploads **only a JSON bundle** to `submissions/bundles/`, without
  promoting content to built-in paths.
- GitHub PATs are stored in IndexedDB under `gameState.github.token` for quest submission and
  Cloud Sync.

## Proposed Design (v3.1)

### 1) Bundle Selection + Dependency Closure

**User flow:**
1. The submission UI lists custom quests/items/processes (from IndexedDB).
2. The user selects any subset.
3. After selection, the system computes the **dependency closure**:
   - Any custom entity referenced by a selected entity becomes **required**.
   - The UI shows a **required additions** section and forces inclusion.

**Dependency rules (custom-only):**
- **Processes → Items:**
  - `requires`, `consumes`, `creates` item IDs are dependencies.
- **Quests → Items/Processes:**
  - Reward items, gating requirements, run-process steps, or any quest step that references
    item IDs or process IDs are dependencies.
- **Items → Items (if applicable):**
  - If item metadata declares ingredients or required items, those IDs are dependencies.

**Algorithm (simplified):**
1. Build a lookup of **custom IDs** for items, processes, quests.
2. Traverse selected entities, recording outbound references to IDs.
3. If a referenced ID is custom and not already selected, add it to the required set.
4. Repeat until no new custom references are found (fixpoint).
5. If unresolved references remain (missing custom data), block submission and show errors.

**Output:**
- `initialSelection`
- `closureSelection` (initial + required)
- `missingReferences` (blockers)

### 2) Validation Before Submission

Validation must run after closure is computed:

- **Schema validation:** each quest/item/process matches the existing schema.
- **Reference validation:** every referenced **custom** entity is present in the closure set.
- **Image validation:** custom quest/item images exist and are **512×512** compressed assets.
- **ID collision check:** ensure custom IDs do not collide with built-in IDs.

### 3) Repository Mapping (Promotion Paths)

When promoting custom content to built-in content, map to existing repo layouts:

- **Quests:** `frontend/src/pages/quests/json/<pathId>/<questId>.json`
- **Items:** `frontend/src/pages/inventory/json/items/<category>.json` (or a dedicated
  `custom.json` / `bundles/<bundle-id>.json` file, depending on final consolidation strategy)
- **Processes:** `frontend/src/pages/processes/` (based on the canonical process JSON layout)
- **Images:** `frontend/public/assets/` with dedicated subfolders to avoid collisions, e.g.
  `frontend/public/assets/custom/items/<itemId>.jpg` and
  `frontend/public/assets/custom/quests/<questId>.jpg`

**Note:** v3.1 should standardize a predictable folder for custom images so the promotion step can
rewrite image URLs in the JSON to their final asset path.

### 4) GitHub PR Creation (One Click)

**Token source:** use the GitHub PAT stored in IndexedDB (`gameState.github.token`). This token is
already used for Cloud Sync and quest submission, and should be reused when possible.

**GitHub API flow (client-side):**
1. **Fetch base branch SHA** (`v3` or the current release branch).
2. **Create a new branch** (`content-bundle-<timestamp>`).
3. **Create blobs** for each file (quest JSON, item JSON, process JSON, images).
4. **Create a tree** referencing all blobs in their target paths.
5. **Create a commit** against the new tree.
6. **Update the branch ref** to the new commit.
7. **Create a PR** with a pre-filled title/body describing the bundle.

**Why this approach:** using the GitHub tree/commit APIs avoids per-file PUT calls and ensures the
entire bundle (text + images) lands in a **single atomic commit**.

### 5) PR Content + Metadata

The PR should include:

- **All promoted JSON files** for quests/items/processes.
- **All required images** for custom quests/items.
- **Optional bundle manifest** for review (`submissions/bundles/<bundle-id>.json`).
- **PR body** summarizing:
  - Selected entities
  - Auto-included dependencies
  - Image assets included

### 6) UI & Messaging

The submission UI should:

- Show a **dependency summary** before submitting.
- Provide a **diff preview** (list of files that will be created/updated).
- Make clear that **custom content becomes built-in** after merge.
- Require confirmation before submitting (images + metadata will become public).

## Failure Modes & Mitigations

- **Missing references:** block submission with a clear error listing the missing IDs.
- **Image missing or wrong size:** block submission; guide the user to re-upload.
- **Token invalid or missing:** prompt for PAT and save it in IndexedDB.
- **GitHub API failure:** surface error details and allow retry without losing selection.
- **ID collisions:** block and prompt user to rename IDs.

## Open Questions

- Which specific files should receive promoted **items** and **processes**? (Centralized
  `custom.json` vs. merging into existing category files.)
- Should the submission UI allow **partial promotion** of updated items/processes or require a
  full replacement when IDs match?
- Should we auto-run `npm run new-quests:update` on submission, or rely on maintainers to do it
  during review?

## Implementation Plan (v3.1)

1. Add dependency graph builder for custom quests/items/processes.
2. Add validation layer and UI preview of required inclusions.
3. Implement repo mapping + asset rewrite rules.
4. Replace `submitBundlePR` with a tree/commit-based PR creator that uploads JSON + images.
5. Update docs/QA references to clarify bundle-based submission (post v3.1).

## Acceptance Criteria

- User can select any subset of custom content and is forced to include all referenced custom
  dependencies before submission.
- PRs include JSON + image assets with correct repo paths and updated image URLs.
- Submission uses the stored GitHub PAT and completes in one click.
- QA can verify the bundle contents directly in the PR without manual uploads.
