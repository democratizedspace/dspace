# Custom Content Bundle PR Workflow (v3.1)

## Context

We need to replace the quest-only PR flow with a bundle-based workflow that can promote
interrelated custom quests, items, and processes to built-in content. This work is explicitly
**deferred to v3.1**. The workflow must:

- Start from an initial user-selected subset (zero or more) of custom quests, items, and
  processes.
- Require any other custom entities referenced by the initial selection to be included before
  submission.
- Create a complete GitHub PR in one click, including metadata and 512x512 optimized images
  stored in IndexedDB.

This design doc describes the dependency closure logic, validation rules, and the GitHub PR
creation flow needed for the v3.1 implementation.

## Goals

1. Treat custom quests, items, and processes as a single **bundle** of interrelated entities.
2. Allow arbitrary initial selection, then automatically compute and require the full dependency
   closure.
3. Validate that all referenced custom entities are included in the bundle before PR creation.
4. Submit a fully formed PR (text + images) via the GitHub API using a PAT.
5. Promote content into repo-backed, built-in content locations:
   - `frontend/src/pages/quests/`
   - `frontend/src/pages/inventory/`
   - `frontend/src/pages/processes/`

## Non-goals

- Defining the exact UI for authoring custom content (already exists).
- Changing the schema for quests/items/processes.
- Supporting non-GitHub hosting or alternate VCS.

## Terminology

- **Custom entity**: a user-authored quest, item, or process stored in IndexedDB.
- **Bundle**: the set of custom entities selected + all required dependencies.
- **Dependency**: a reference from one entity to another (quest → item, quest → process,
  process → item, quest → quest). Each dependency may be zero or more.
- **Promotion**: converting custom entities into built-in content files in the repository.

## Data Model (client-side)

Custom content is stored in IndexedDB and includes:

- `id` (stable custom identifier)
- `type` (`quest`, `item`, `process`)
- `metadata` (name, description, etc.)
- `content` (canonical JSON payload for the entity)
- `image` (optional 512x512 optimized image, binary blob + metadata)
- `references` (optional derived list of dependencies for faster traversal)

We should treat the authoritative references as the content fields themselves (e.g., quest JSON
references to item IDs or process IDs). The derived `references` list is a cache that can be
regenerated to avoid stale data.

## Dependency Graph

### Reference extraction

Build a resolver that scans each entity type and extracts references:

- **Quest** references:
  - item IDs in rewards, requirements, inventory gates, or other quest surfaces
  - process IDs used for gating or reward actions
  - quest IDs used as prerequisites
- **Process** references:
  - item IDs in inputs/outputs or prerequisites
- **Item** references:
  - typically none (future-proof by allowing optional references)

### Graph representation

Represent dependencies as a directed graph of `entityId` nodes:

- Node key: `${type}:${id}` (e.g., `quest:play-2`, `item:carbon-fiber`)
- Edge: `A -> B` if entity A references entity B

This supports multiple reference types per entity and de-duplication across types.

### Dependency closure algorithm

Given an initial selection `S`, compute the transitive closure `C`:

1. Initialize `C = S`.
2. For each node in `C`, add all referenced nodes to `C` if they exist in IndexedDB.
3. Continue until no new nodes are added.

The result is the full bundle required for a consistent submission.

### Validation rules

- **Missing dependency**: A reference points to a custom entity not present in IndexedDB.
- **External dependency**: A reference points to a built-in entity (allowed, not required in
  bundle).
- **Dangling dependency**: A reference points to a custom entity that exists but is not in
  `C` (block submission until it is added via closure).

Validation output should include:

- Required additions (custom entities that must be included).
- Warnings about missing dependencies that do not exist locally.
- A stable, deterministic ordering for display.

## UX Flow (bundle selection)

1. **Selection step**: Users choose zero or more quests, items, and processes.
2. **Dependency resolution**: The app computes the dependency closure.
3. **Validation step**:
   - Show required additions, grouped by type.
   - Show missing dependencies (custom entities referenced but not found).
   - Offer a one-click "Include required items" to auto-extend the bundle.
4. **Review step**: Show a diff-style summary of files/images that will be added.
5. **Submit**: Use the GitHub API to create a branch, commit, and PR in one click.

## GitHub PR Creation

### Authentication

- Use the same GitHub PAT used for cloudsync (staging) if available and scoped for repo write.
- Store the PAT in the app's existing secure storage flow (never logged or persisted in plaintext
  beyond current session).

### API strategy

Use the GitHub REST API for Git data to create a PR in one click:

1. **Create branch** (from latest `main`):
   - `GET /repos/{owner}/{repo}/git/ref/heads/main`
   - `POST /repos/{owner}/{repo}/git/refs` with new branch name
2. **Create blobs** for each file (JSON + images):
   - `POST /repos/{owner}/{repo}/git/blobs` with base64 content
3. **Create tree** with all new/updated files:
   - `POST /repos/{owner}/{repo}/git/trees`
4. **Create commit**:
   - `POST /repos/{owner}/{repo}/git/commits`
5. **Update branch ref**:
   - `PATCH /repos/{owner}/{repo}/git/refs/heads/{branch}`
6. **Create PR**:
   - `POST /repos/{owner}/{repo}/pulls`

This avoids multiple incremental commits and allows a clean, single-commit PR.

### File layout

- Quests: `frontend/src/pages/quests/json/{path}/{questId}.json`
- Items: `frontend/src/pages/inventory/items/{itemId}.json`
- Processes: `frontend/src/pages/processes/{processId}.json`
- Images: colocated with entity metadata (e.g., `.../images/{entityId}.png`)

Exact paths should match existing conventions; the promotion flow should map custom IDs to
canonical file locations (potentially via existing metadata fields).

### Image handling

- Images are already stored as optimized 512x512 assets in IndexedDB.
- Encode as base64 and submit as binary blobs via the GitHub API.
- Preserve original filenames where possible, but ensure deterministic naming to avoid
  collisions (`{entityId}.png`).

### PR content

PR should include:

- A title that reflects the bundle (e.g., "Promote custom content bundle: {bundleName}")
- A body that lists included quests/items/processes and dependency notes
- An auto-generated checklist for review (links, validation status)

## Safety, Privacy, and Validation

- Never log PATs or include them in error telemetry.
- Avoid storing PATs on disk; use in-memory/session storage only.
- Before submission, validate that all required custom entities are present and serialized.
- Ensure no oversized blobs exceed GitHub API limits (surface errors early).

## Implementation Stages (v3.1)

1. **Dependency resolver + closure**: build a shared resolver utility with tests.
2. **Bundle selection UI**: selection + validation + review steps.
3. **GitHub API integration**: branch + tree + commit + PR creation in one flow.
4. **Telemetry + failure handling**: clear error states for missing data, API failures, or
   validation mismatches.

## Open Questions

- Do we need to support bundling multiple images per entity (future cosmetics)?
- What is the maximum bundle size to safely submit via GitHub API in one request?
- Should we optionally split large bundles into multiple commits while still one PR?

## Success Criteria

- Users can select any subset of custom quests/items/processes and still submit a consistent
  bundle with required dependencies.
- PRs include all metadata + images and promote content into built-in locations with a single
  click.
- Validation prevents missing custom dependencies from slipping into a PR.
