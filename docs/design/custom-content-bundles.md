# Custom content bundle PR workflow (v3.1)

## Problem statement

The current v3 QA doc for quest PRs is too narrow: promotion to built-in content should cover
bundles of custom quests, items, and processes that reference each other. For v3.1, we need a
workflow that lets a user select any set of custom entities, then automatically includes any other
custom entities that are referenced so the bundle is consistent. We also need a one-click PR flow
that captures both JSON metadata and 512x512 web-optimized images stored in IndexedDB.

## Goals

- Support bundles containing **custom quests, items, and processes** that may reference each other.
- Allow an **initial arbitrary selection**, then compute the **dependency closure** and validate
  that all referenced custom entities are included.
- Export metadata + images (512x512 PNG/JPG optimized versions) stored in IndexedDB.
- Create a GitHub PR **in one click** using a PAT (reuse the cloudsync PAT if possible).
- Promote custom content into built-in repo locations under:
  - `frontend/src/pages/quests/json/`
  - `frontend/src/pages/inventory/json/`
  - `frontend/src/pages/processes/`

## Non-goals

- Editing built-in content once promoted (that remains a manual repo change).
- Supporting non-custom entities (built-in content is treated as external references).
- Replacing the cloudsync pipeline; this is only for PR creation.

## Key definitions

- **Custom entity**: a quest, item, or process created by a user and stored in IndexedDB.
- **Reference edge**: a directed edge from one custom entity to another custom entity that it
  references (e.g., a quest that rewards a custom item).
- **Bundle closure**: the transitive set of all custom entities reachable from the initially
  selected entities via reference edges.

## Data sources and storage

Custom content (metadata + images) lives in IndexedDB, alongside built-in content. Each custom
entity is expected to have:

- A stable `id` or `slug`.
- A `type` (`quest`, `item`, `process`).
- The metadata payload (quest JSON, item JSON, process JSON).
- Optional image blobs (512x512 optimized images) for quests and items.

### Image handling

- The 512x512 optimized images are stored as blobs in IndexedDB.
- During PR creation, these blobs are converted to base64 and written into the repo under the
  same assets path conventions used for built-in content (e.g., `assets/` or a new
  `frontend/src/pages/.../images/` directory as defined in the export mapping).
- The metadata JSON is rewritten (if needed) to point at the new in-repo image path.

## Reference extraction and dependency graph

We need deterministic rules for extracting references from each entity type.

### Quests

Extract references from all quest surfaces where items/processes appear, including:

- Requirements/gates (any step or option that references items or processes).
- Rewards (items or processes awarded on completion).
- Any other schema fields that reference items/processes.

### Items

Items currently have no required dependencies, but the graph should still allow item -> process
or item -> item references for future features (crafting chains, upgrades, etc.).

### Processes

Processes may reference items as inputs/outputs; capture these references as process -> item
edges.

### Graph construction

1. Normalize all custom entities into `{ id, type, data, references[] }`.
2. For each entity, generate a list of reference edges to other **custom** entities.
3. Build an adjacency list keyed by `type:id`.

## Bundle selection and validation

### Initial selection

- UI allows selecting any number of custom quests/items/processes.
- Each selected entity is marked as a **root** for the bundle.

### Dependency closure algorithm

- Perform DFS/BFS from all roots using the adjacency list.
- The union of all reachable nodes is the **required bundle set**.
- If a reference points to a **built-in** entity, it is ignored for inclusion but recorded in the
  report.

### Validation results

- **Pass**: all referenced custom entities are included in the closure.
- **Fail**: any referenced custom entity is missing or corrupted (missing metadata or image).
- Output a report with:
  - Missing custom entities (by type + id).
  - Built-in references (for transparency only).
  - Image validation errors (missing blobs or invalid sizes).

### UX summary

- Show a diff-style summary: *Selected* vs *Required* vs *Built-in references*.
- Allow users to confirm the closure or cancel.
- Block PR creation if validation fails.

## PR creation flow (one-click)

### Authentication

- Reuse the existing cloudsync GitHub PAT if available.
- Do not store tokens in localStorage; keep in-memory and let the user re-authenticate if needed.

### GitHub API flow

1. **Create branch** from the target base (e.g., `main` or `v3.1`):
   - `POST /repos/{owner}/{repo}/git/refs`
2. **Create blobs** for each file payload (JSON + images):
   - `POST /repos/{owner}/{repo}/git/blobs`
   - Use base64 encoding for images.
3. **Create a tree** containing all files:
   - `POST /repos/{owner}/{repo}/git/trees`
4. **Create a commit** referencing the tree:
   - `POST /repos/{owner}/{repo}/git/commits`
5. **Update the branch ref** to the new commit:
   - `PATCH /repos/{owner}/{repo}/git/refs/{ref}`
6. **Create the PR**:
   - `POST /repos/{owner}/{repo}/pulls`

### Payload requirements

- All JSON and image files must be included in the same tree/commit to produce a single PR.
- Images are passed as base64 blobs with their exact 512x512 optimized bytes.
- Metadata JSON should reference the in-repo image paths after export.

## Export mapping

Define a mapping from custom entities to repo paths. This mapping should be centralized so the
validation step and the PR exporter use identical rules.

Example mapping (subject to confirmation with current repo layout):

- Quests: `frontend/src/pages/quests/json/{pathId}/{questId}.json`
- Items: `frontend/src/pages/inventory/json/items/{category}.json` or per-item JSON if needed
- Processes: `frontend/src/pages/processes/{processId}/index.json` (or existing layout)
- Images: `assets/custom/{type}/{id}.{ext}`

## Security and compliance

- Never log or persist the PAT in plaintext.
- Reject oversized images or non-512x512 assets during validation.
- Strip any PII or user-only metadata fields before export.

## Testing and validation plan

- Unit tests for dependency extraction (quests/items/processes).
- Unit tests for bundle closure and missing dependency detection.
- Integration test for PR payload assembly to ensure tree/blobs align.
- Manual QA: create a bundle with cross-references and verify the PR is complete.

## Open questions

- Final repo path mapping for processes and item JSON layout.
- Whether to embed images under `assets/` or a new custom-specific directory.
- Whether to target `main`, `v3`, or `v3.1` branch for PRs.
- How to handle name collisions if a custom id already exists in built-in content.
