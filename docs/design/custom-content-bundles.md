# Custom Content Bundles: v3.1 PR Promotion Flow

## Status

Proposed (target: v3.1). This is not in scope for v3.0.

## Context

The current QA workflow copy suggests “quest-only” submissions, but the actual
workflow must support *bundles* of custom content that reference each other.
Bundles can include any mix of custom quests, items, and processes. Each entity
may reference zero or more of the others, for example:

- A custom process may reference zero or more custom items as inputs/outputs.
- A custom quest may reference zero or more custom items or custom processes to
  gate steps, grant rewards, or define requirements.

When promoting custom content to built-in content, we need a one-click GitHub PR
creation flow that packages all required JSON metadata and associated 512x512
images stored in IndexedDB.

## Goals

- Support selection of **any combination** of custom quests, items, and
  processes.
- Automatically enforce that **all referenced custom entities are included**
  (closure over dependencies).
- Create a **single GitHub PR** that contains all selected/required entities and
  their images.
- Reuse the GitHub PAT already used for cloudsync if available.

## Non-goals

- Designing the full UI/UX for selection screens (only outline required steps).
- Changing the existing built-in content schemas in this iteration.
- Implementing server-side bundling; the flow is client-driven.

## Data Sources

- Custom content metadata is stored in IndexedDB.
- Custom quest and item images are stored as optimized 512x512 assets in
  IndexedDB alongside their metadata.

## Proposed Flow (High Level)

1. **Initial selection**
   - User selects zero or more custom quests, items, and processes.
2. **Dependency extraction**
   - Parse selected entities to extract references to other custom entities.
3. **Dependency closure**
   - Compute the transitive closure across custom quests, items, and processes.
4. **Validation & resolution UI**
   - If required entities are missing from the selection, show a blocking
     validation summary and provide a one-click “include all” action.
5. **PR generation**
   - Serialize all required entities + images into repo files and call the
     GitHub API to create a PR in one action.

## Dependency Model

We will treat content as a directed graph where nodes are entities and edges
represent references.

- **Quest → Item/Process**
  - References may appear in rewards, requirements, gating fields, or any other
    quest surface touched by items or processes.
- **Process → Item**
  - References may appear in inputs, outputs, requirements, or steps.
- **Item → (none)**
  - Items do not reference other entities today, but keep this extensible.

### Reference Extraction Strategy

Introduce a single “reference extractor” module that knows how to map each
schema to a list of referenced entity IDs. This should:

- Use explicit schema-aware paths (avoid ad-hoc string matching).
- Return a typed list of `{ type: 'quest' | 'item' | 'process', id: string }`.
- Be future-proofed by unit tests that capture new schema fields.

## Validation Algorithm

1. Build `selected` set from the user’s initial selection.
2. Build `graph` of references for all **custom entities available locally**.
3. Walk the graph from each selected node to compute `required` closure.
4. If `required` is not a subset of `selected`, raise a validation error listing
   missing entities grouped by type.
5. Provide a UI action to add all missing entities to the selection, or allow
   manual resolution per entity.

This guarantees that the PR contains a complete, self-consistent bundle.

## PR Packaging

### Target Repo Locations

Promotion converts custom content into built-in content stored in:

- `frontend/src/pages/quests/json/`
- `frontend/src/pages/inventory/json/`
- `frontend/src/pages/processes/` (JSON files; confirm exact subpath per process
  schema)

Images should be placed alongside the existing built-in assets for quests/items
(keep current naming conventions). If no canonical path exists yet, define a
single `assets/custom/` directory for built-in assets and reference it from
JSON.

### Content Mapping

For each entity in the `required` closure:

- Write JSON metadata files using the built-in schemas.
- Write image assets (512x512) as binary files in the repo.
- Ensure IDs match the existing naming/slug conventions for built-in content.

## GitHub API PR Creation

### Authentication

- Reuse the GitHub PAT used by cloudsync (`staging.democratized.space/cloudsync`)
  if possible.
- Store the token in the same secure client-side location as cloudsync (do not
  persist it in repo files or logs).

### API Strategy

Use the GitHub REST API to create a branch, commit, and PR in one flow:

1. **Get base ref**: `GET /repos/{owner}/{repo}/git/ref/heads/main`
2. **Create a new tree** with all JSON and image files:
   - `POST /repos/{owner}/{repo}/git/trees` with base tree SHA
   - Provide `content` as UTF-8 for JSON files.
   - Provide image data as base64-encoded content with `encoding: 'base64'`.
3. **Create commit**: `POST /repos/{owner}/{repo}/git/commits`
4. **Create ref**: `POST /repos/{owner}/{repo}/git/refs`
5. **Create PR**: `POST /repos/{owner}/{repo}/pulls`

This flow avoids per-file API calls and keeps the PR creation atomic.

### PR Metadata

- Title: `Promote custom content bundle: <bundle-name>`
- Body sections:
  - Summary of included quests/items/processes
  - Validation notes (dependency closure)
  - Test checklist (if any)

## UX Notes (Minimal Requirements)

- The selection UI should display dependency warnings before the PR is created.
- “Include all required dependencies” should be a single action.
- Expose the computed bundle manifest so users can inspect it before submit.

## Risks & Mitigations

- **Schema drift**: add unit tests for reference extraction paths.
- **Large images**: enforce 512x512 size and compression prior to PR creation.
- **Token misuse**: never store the PAT in IndexedDB; keep it in memory.

## Open Questions

- Where should built-in quest/item images live if no standard directory exists
  today?
- Should we generate a bundle manifest file for auditing and future tooling?
- Do we need to update the QA doc copy in v3.1 to reflect bundles vs. quests?
