# Image variants and provenance roadmap (v3.1 / v3.2+)

## Status

- **Current (verified in v3 repo):** DSPACE ships image assets across NPC, item, and quest surfaces.
- **Proposed (this document):** A future-facing design for image variants, provenance metadata,
  player preference controls, and contributor workflows.
- **Not implemented yet:** The schema, render-time selector, `/settings` controls, and moderation
  workflow described below are roadmap material, not current behavior.

## Why this exists

DSPACE already relies on visual assets for gameplay context (NPC portraits, item art, and quest
visuals), but image quality and origin are not static over project lifetime. Early assets may have
been produced with older-generation tooling, while newer tooling (AI and human pipelines) can
produce higher quality and better stylistic consistency.

We need a design that supports all of the following simultaneously:

1. Keep **canonical entity identity** stable for gameplay and save-data durability.
2. Allow art to evolve over time via **variants** and refresh passes.
3. Preserve historical/provenance context so deprecation is transparent and reversible.
4. Support players who prefer **human-made art** when available.
5. Support long-term contributor paths (commissioned work, contests, curated community art).

## Goals

- Introduce a shared variant/provenance model for NPC, item, and quest images.
- Preserve corpus separation (NPC vs item vs quest) while sharing conceptual tooling.
- Keep image changes presentation-only; never alter gameplay identity or mechanics.
- Support provenance-aware player preferences (human/AI/mixed/default/newest/legacy).
- Enable deprecation/supersession of older assets without breaking references.
- Provide metadata hooks for future moderation, licensing, auditability, and contributor programs.

## Non-goals

- Changing quest logic, inventory semantics, process behavior, routing, or save identity based on
  selected image variant.
- Solving every legal or policy detail in this design doc (this is not legal advice).
- Immediate full implementation in v3.
- Forcing one provenance type for all players.
- Defining final UI copy for every settings/provenance label.

## Current state vs proposed future

### Current state (high-level)

- DSPACE contains image assets for NPCs, items, and quests.
- Asset provenance and variant lineage are not yet standardized under one metadata model.
- Player-facing provenance preference controls are not yet a first-class `/settings` feature.

### Proposed future (v3.1 / v3.2+)

- Each image corpus supports multiple variants per canonical entity.
- Variant metadata captures provenance, credit, license scope, status, and lineage.
- Render-time selection uses a deterministic fallback-safe pipeline with optional randomization.
- Player settings support provenance and legacy preferences globally and per corpus.

## Separate image corpora, shared conceptual framework

DSPACE should treat image assets as three distinct corpora:

- **NPC images**
- **Item images**
- **Quest images**

### Why corpus separation matters

1. **UX expectations differ**
   - NPC portraits are identity-forward and frequently visible.
   - Item images prioritize recognizability and inventory readability.
   - Quest images may be contextual/scene-oriented and can vary in style density.
2. **Moderation and provenance risks differ**
   - NPC likeness consistency and character continuity are stricter.
   - Item art may have iconographic constraints.
   - Quest imagery may include broader scene content requiring stricter moderation filters.
3. **Settings and fallback needs differ**
   - Players may want human-made NPC portraits but default item art for clarity.
4. **Contributor pipelines differ**
   - NPC commissions may be bespoke portrait work.
   - Item art may favor constrained style packs.
   - Quest art may fit event-driven/seasonal submissions.
5. **Style constraints differ**
   - Each corpus can have independent curation standards and randomization rules.

Despite these differences, all corpora should share one conceptual model: canonical entity identity
+ variant metadata + selection policy.

## Canonical entity identity vs presentation layer

This separation is mandatory.

### Canonical identity (gameplay layer)

- Canonical IDs for NPCs/items/quests remain the source of truth.
- Save files and gameplay references point to the canonical entity ID only.
- Gameplay logic, route behavior, inventory semantics, and quest progression remain unchanged when
  art variants switch.

### Presentation assets (image layer)

- Variants are cosmetic/render-time assets attached to canonical entities.
- Variant swaps are presentation-only.
- Superseding or deprecating a variant must not break entity lookups or existing saves.

## Base/default art plus variants

DSPACE should support:

- **One base/default canonical presentation variant** per entity (at any point in time).
- **Zero or more additional variants**.

This is analogous to alternate-art systems in collectible games, but in DSPACE terms the canonical
entity remains mechanically fixed while visual representation can evolve.

Potential variant categories:

- Portrait refresh
- Seasonal/environmental variants
- Alternate costume/expedition gear
- Event variants
- Human-made commissioned variants
- Curated community/fan-art approved variants
- Restored/remastered variants for legacy assets

## Proposed variant metadata model (schema direction)

The following fields define a common shape across corpora.

| Field | Purpose |
|---|---|
| `entity_id` | Canonical NPC/item/quest ID |
| `entity_type` | `npc` / `item` / `quest` |
| `corpus` | Explicit corpus bucket (`npc_images`, `item_images`, `quest_images`) |
| `variant_id` | Unique stable identifier for variant |
| `is_default` | Whether this variant is current default fallback |
| `provenance` | `human` / `ai` / `hybrid` / `unknown` |
| `provenance_detail` | e.g. `human_commissioned`, `human_contest`, `ai_generated` |
| `artist_credit` | Displayable attribution metadata |
| `license` | License id + usage scope + exclusivity notes |
| `status` | `active`, `superseded`, `deprecated`, `archived`, `draft` |
| `tags` | Style/theme tags for filtering |
| `priority` | Numeric ordering weight |
| `pinned` | Top-order boost independent of recency |
| `created_at` | Creation timestamp |
| `deprecated_at` | Optional deprecation timestamp |
| `supersedes` / `superseded_by` | Variant lineage references |
| `model_family` | AI model family (if relevant/known) |
| `toolchain` | Human/AI pipeline notes |
| `prompt_version` | Optional prompt lineage for AI-generated assets |
| `moderation_state` | `pending`, `approved`, `rejected`, `needs_review` |
| `visibility` | `public`, `staff_only`, `legacy_opt_in`, etc. |
| `preference_eligible` | Boolean for settings selector eligibility |
| `asset_uri` | Logical storage key or public URL reference (resolver may map key → served URL) |
| `checksum` | Optional content hash for provenance/audit |

### Example A: NPC with older AI default superseded by newer AI + human variant

Status semantics used in this doc:

- `active`: eligible for normal selection (subject to moderation/visibility/settings filters).
- `superseded`: replaced by a newer preferred variant but still preserved and potentially visible.
- `deprecated`: intentionally legacy-only (hidden from normal pools unless legacy opt-in is enabled).
- `archived`: retained for audit/history; not expected in normal player-facing selection.
- `draft`: pre-publication and never player-visible.

```json
{
  "entity_id": "npc-captain-nyra",
  "entity_type": "npc",
  "corpus": "npc_images",
  "variants": [
    {
      "variant_id": "npc-captain-nyra-ai-v1",
      "is_default": false,
      "provenance": "ai",
      "provenance_detail": "ai_generated",
      "artist_credit": { "display": "DSPACE model pipeline (legacy)" },
      "license": { "id": "internal-commercial", "usage_scope": "game-and-marketing" },
      "status": "superseded",
      "tags": ["portrait", "legacy"],
      "priority": 10,
      "pinned": false,
      "created_at": "2024-07-14T00:00:00Z",
      "deprecated_at": "2026-11-01T00:00:00Z",
      "superseded_by": "npc-captain-nyra-ai-v2",
      "model_family": "legacy-diffusion",
      "toolchain": "internal-ai-pipeline-v1",
      "prompt_version": "captain_nyra_v1",
      "moderation_state": "approved",
      "visibility": "legacy_opt_in",
      "preference_eligible": true,
      "asset_uri": "/assets/npc/captain-nyra-v1.png"
    },
    {
      "variant_id": "npc-captain-nyra-ai-v2",
      "is_default": true,
      "provenance": "ai",
      "provenance_detail": "ai_generated",
      "artist_credit": { "display": "DSPACE model pipeline" },
      "license": { "id": "internal-commercial", "usage_scope": "game-and-marketing" },
      "status": "active",
      "tags": ["portrait", "refresh"],
      "priority": 100,
      "pinned": true,
      "created_at": "2026-10-24T00:00:00Z",
      "supersedes": "npc-captain-nyra-ai-v1",
      "model_family": "nextgen-diffusion",
      "toolchain": "internal-ai-pipeline-v3",
      "prompt_version": "captain_nyra_v4",
      "moderation_state": "approved",
      "visibility": "public",
      "preference_eligible": true,
      "asset_uri": "/assets/npc/captain-nyra-v2.png"
    },
    {
      "variant_id": "npc-captain-nyra-human-commission-01",
      "is_default": false,
      "provenance": "human",
      "provenance_detail": "human_commissioned",
      "artist_credit": {
        "display": "Ari Sol",
        "url": "https://portfolio.example/arisol"
      },
      "license": {
        "id": "commissioned-exclusive",
        "usage_scope": "in-game-and-promotional",
        "portfolio_rights": true
      },
      "status": "active",
      "tags": ["portrait", "official", "human"],
      "priority": 95,
      "pinned": false,
      "created_at": "2027-01-11T00:00:00Z",
      "moderation_state": "approved",
      "visibility": "public",
      "preference_eligible": true,
      "asset_uri": "/assets/npc/captain-nyra-human-commission-01.png"
    }
  ]
}
```

### Example B: Quest visual with contest winner and restricted legacy asset

```json
{
  "entity_id": "quest-hydroponics-2",
  "entity_type": "quest",
  "corpus": "quest_images",
  "variants": [
    {
      "variant_id": "quest-hydroponics-2-default-v1",
      "is_default": true,
      "provenance": "hybrid",
      "provenance_detail": "human_overpaint_ai_base",
      "artist_credit": { "display": "DSPACE hybrid pipeline + paintover artist (example)" },
      "status": "active",
      "priority": 100,
      "moderation_state": "approved",
      "visibility": "public",
      "preference_eligible": true,
      "asset_uri": "/assets/quests/hydroponics-2-default-v1.webp"
    },
    {
      "variant_id": "quest-hydroponics-2-contest-2027",
      "is_default": false,
      "provenance": "human",
      "provenance_detail": "human_contest",
      "artist_credit": { "display": "DSPACE Art Jam 2027 Winner: M. Lin" },
      "license": {
        "id": "contest-nonexclusive",
        "usage_scope": "in-game",
        "commercial_use": true
      },
      "status": "active",
      "tags": ["event", "contest", "featured"],
      "priority": 110,
      "pinned": true,
      "moderation_state": "approved",
      "visibility": "public",
      "preference_eligible": true,
      "asset_uri": "/assets/quests/hydroponics-2-contest-2027.webp"
    },
    {
      "variant_id": "quest-hydroponics-2-legacy-beta",
      "is_default": false,
      "provenance": "unknown",
      "provenance_detail": "legacy_import",
      "status": "deprecated",
      "deprecated_at": "2027-04-01T00:00:00Z",
      "priority": 5,
      "moderation_state": "approved",
      "visibility": "legacy_opt_in",
      "preference_eligible": false,
      "asset_uri": "/assets/quests/hydroponics-2-legacy-beta.webp"
    }
  ]
}
```

## Deprecation and migration strategy

### Why deprecate

- Early-generation AI output quality can become visibly stale or inconsistent with later art.
- Better image tooling and human contributions justify refresh/remaster passes.
- Deprecation allows quality evolution without deleting historical provenance.

### Deprecation rules

- Deprecating a variant never changes canonical entity ID.
- A deprecated variant can remain accessible under explicit legacy settings.
- `supersedes`/`superseded_by` should capture lineage for auditability.
- Removal (hard-delete) should be exceptional and policy-driven; default is archival retention.

### Migration order

1. **NPC-first** (highest identity impact and strongest player preference signal).
2. **Items next** (readability + style consistency concerns).
3. **Quests last or in parallel with events** (higher style variability tolerance).

### Legacy compatibility

- Optional setting: allow deprecated/legacy variants.
- Default UX should prioritize active approved variants.
- Archival/admin surfaces can expose full lineage even when player UI hides legacy art.

## Player settings and personalization (future `/settings` surface)

Proposed settings (global + per-corpus override):

- Prefer human-made variants when available.
- Prefer default/canonical-only presentation.
- Allow both human and AI variants.
- Prefer newest eligible variant.
- Allow deprecated/legacy art.
- Randomize among eligible variants.
- Override by corpus (e.g., human NPC / default item / mixed quest).

### Global vs per-corpus resolution

1. Apply global defaults.
2. Apply corpus overrides if present.
3. Resolve with safe fallback to the entity default variant.

### Deterministic vs randomized behavior

- Deterministic mode reduces surprise and aids screenshot consistency.
- Randomized mode should be opt-in and can be session-sticky or entity-sticky.
- Recommendation: initial rollout uses deterministic mode by default; randomization only where UX is
  stable and corpus style constraints permit.

### Sticky policy options

- **Per-render re-evaluation:** simple but can feel noisy.
- **Session-sticky:** stable for a session, refreshed next session.
- **Entity-sticky:** stable until cache/settings invalidation.

Recommended default: **entity-sticky deterministic** unless user explicitly enables random mode.

## Variant selection algorithm (proposed)

Given `(entity_id, corpus, player_settings)`:

1. Load all variants for entity.
2. Filter to matching corpus/entity type.
3. Filter by moderation gate (`approved` only for player-visible).
4. Filter by visibility gate (`public` plus any allowed legacy scope).
5. Filter by player provenance preference (`human`, `ai`, `mixed`, `default-only`) using explicit
   provenance mapping:
   - `human`: only `provenance=human` variants.
   - `ai`: only `provenance=ai` variants.
   - `mixed`: `human`, `ai`, or `hybrid` variants.
   - `default-only`: only `is_default=true` variants (regardless of provenance).
   - `hybrid` is treated as mixed provenance (eligible for `mixed` and for `default-only` when it is
     the default), not as strict `human` or strict `ai`.
6. Filter by license/usage eligibility if runtime context requires it.
7. If empty, relax preferences in this controlled order (never bypass moderation gate):
   - `human` → `mixed` → `ai` → `default-only`.
   - `ai` → `mixed` → `human` → `default-only`.
   - `mixed` → `default-only`.
   - `default-only` has no provenance relaxation; continue to hard fallback rules below.
8. Sort by `pinned desc`, `is_default desc`, `priority desc`, `created_at desc`.
9. If randomization enabled, randomize within top eligible tier per sticky policy.
10. If still empty, hard fallback to canonical default active variant.
11. If canonical default unavailable (data integrity issue), use corpus placeholder and log audit
    error.

### Example decision flow

Player settings:

- Global: `prefer_human=true`, `allow_legacy=false`, `randomize=false`
- Overrides: `item_images: default_only=true`

For `npc-captain-nyra`:

- Eligible approved/public variants: AI v2, Human Commission 01
- Human preference selects Human Commission 01.

For an item with only AI active variant:

- Human filter yields empty pool.
- Controlled relaxation falls back to item default active AI variant.

For a quest with only deprecated human variant and one active AI variant:

- Legacy not allowed => deprecated human excluded.
- Active AI variant selected as safe fallback.

## Human-made art as a first-class path

This roadmap treats human-created work as a core pillar, not an exception.

Supported pathways:

- Bespoke commissioned official art.
- Approved community-submitted variants.
- Contest/competition winners.
- Curated featured human variants.
- Coexistence with AI variants on same canonical entity.

Why this matters:

- Accommodates player preference diversity.
- Improves trust and artistic legitimacy.
- Enables progressive replacement/augmentation of bootstrap AI art.
- Creates a healthier long-term creative ecosystem for DSPACE.

## Financial incentives and contribution workflows

Future contributor systems should include compensated and community channels.

### Commission model

- Directly commission artists for prioritized NPC/item/quest refreshes.
- Mark outputs with explicit provenance detail (`human_commissioned`).
- Record attribution, license scope, usage rights, and portfolio allowances in metadata.

### Contest/competition model

- Host online/IRL events with clear submission terms.
- Support featured winners and runner-up variants.
- Encode contest origin in provenance metadata (`human_contest`).

### Curation and rewards

- Curated featured variant rotations.
- Potential future crowdfunding/reward tie-ins (design consideration only).

### Operational requirements (non-legal)

- Attribution required and user-visible where appropriate.
- License metadata must declare commercial usage scope.
- Moderation and approval are mandatory before public in-game visibility.
- Contest entry metadata should capture exclusive/non-exclusive status.
- Portfolio-right indicators should be explicit.
- Provenance and moderation actions should be auditable.

## Policy, moderation, and provenance transparency

- Provenance should be tracked in metadata and surfaced in lightweight UI affordances.
- Unknown/mixed provenance assets should be allowed but clearly labeled.
- Human-preference toggles must only consider assets with verified provenance classifications.
- Community submissions must pass moderation and rights checks before `public` visibility.
- Provenance UX should remain understandable (avoid overwhelming users with internal fields).

## Future implementation touchpoints (no code in this doc)

Likely implementation surfaces for future milestones:

- Content metadata and JSON schema extensions for variants.
- Asset storage/layout conventions per corpus (`asset_uri` can be a logical key mapped by the
  resolver; examples here use current public URL-style paths for readability).
- Render-time selection resolver in image rendering paths.
- `/settings` integration for global/per-corpus variant preferences.
- Migration/admin utilities for legacy variant tagging and lineage backfill.
- Contributor ingestion and moderation tooling.
- Internal docs/admin pages for provenance and audit inspection.

## Rollout plan (staged)

- **Stage 0:** Finalize design, schema conventions, naming, and governance definitions.
- **Stage 1:** NPC variant support + metadata ingestion + deterministic selector fallback.
- **Stage 2:** `/settings` provenance preferences (global first, then per-corpus overrides).
- **Stage 3:** Extend variant framework to item and quest corpora.
- **Stage 4:** Enable contributor pathways (commissions, contests, curation pipeline).
- **Stage 5:** Execute legacy deprecation + refresh/remaster campaigns with archival strategy.

## Testing and acceptance criteria (future implementation)

1. Canonical entity references remain stable when displayed variant changes.
2. Quest/item/NPC mechanics remain unchanged across variant swaps.
3. Human-preference setting deterministically picks verified eligible human variants when present.
4. If no eligible human variant exists, resolver falls back safely to default active variant.
5. Deprecated variants are hidden by default and shown only when legacy settings permit.
6. Per-corpus overrides supersede global settings only for targeted corpus.
7. Moderation gate prevents unapproved community variants from entering player-visible pools.
8. Provenance metadata is inspectable for all active/deprecated variants.
9. Resolver does not cross corpus boundaries (NPC settings never leak into item/quest behavior).
10. Randomization (if enabled) follows configured sticky policy and remains debuggable.

## Failure modes and open questions

### Potential failure modes

- Variant sprawl causing curation complexity.
- Incomplete/low-quality provenance or license metadata.
- Community submissions with ambiguous rights.
- Settings combinations yielding empty variant pools.
- Over-randomization that makes UX feel inconsistent.
- Hard-removal pressure conflicting with archival/provenance needs.

### Open questions

- Should some corpora (e.g., items) initially forbid randomization for readability?
- Should “official” vs “community” be a visible badge, filter, both, or neither?
- What minimum metadata is required before a variant can be `preference_eligible=true`?
- Should randomization be session-sticky by default, or entity-sticky?
- What archival retention policy applies when rights/licenses are amended post-release?
- How should unknown provenance legacy assets be prioritized for cleanup?

## Migration notes and documentation expectations

- This design should be treated as roadmap guidance for v3.1/v3.2+ planning.
- Subsequent implementation PRs should remain incremental by stage.
- Each implementation stage should update relevant docs and include acceptance-test mapping to the
  criteria above.
