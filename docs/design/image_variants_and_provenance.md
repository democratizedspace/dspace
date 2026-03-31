# DSPACE design: image variants, provenance, and contributor pathways (v3.1/v3.2+ roadmap)

**Status:** Draft proposal for post-v3 implementation.

## Why this exists

DSPACE currently ships image assets for NPCs, items, and quests. Some earlier assets were produced
with older-generation AI tooling, while newer tooling now yields meaningfully higher quality output.
This creates a long-term product need:

- preserve canonical game identity for each NPC/item/quest,
- allow art quality refreshes over time,
- keep provenance and licensing transparent,
- support deprecating older art without breaking game behavior,
- and accommodate players who prefer human-made art.

This document proposes a shared image variant and provenance framework for v3.1/v3.2+.
It is not a statement of current behavior unless explicitly marked “Current state”.

## Current state vs proposed future

### Current state (verified at doc time)

- NPCs, items, and quests have image assets in the repo and runtime surfaces.
- There is no unified, cross-corpus image-variant metadata model documented in `docs/design/`.
- There is no documented player-facing provenance preference system for image rendering.

### Proposed future (this doc)

- Introduce variant metadata and selection logic that is presentation-only.
- Keep gameplay identity anchored to canonical entity IDs.
- Add settings-driven preference resolution (human/AI/default/newest/legacy/randomized).
- Support human-first contribution pathways (commission, contest, approved submissions).

## Goals

- Separate image corpora (NPC, item, quest) while using a common conceptual framework.
- Maintain canonical entity identity independent of image variant choice.
- Support provenance-aware image selection and transparent attribution.
- Enable deprecation/supersession of older art without identity or save breakage.
- Provide player-configurable rendering preferences, including human-made-first options.
- Establish future-ready contributor/commission/contest workflows with metadata auditability.

## Non-goals

- Changing quest logic, inventory semantics, or gameplay outcomes based on image variant.
- Solving all legal, tax, or policy details for commissions/contests in this one doc.
- Full immediate implementation in v3.
- Forcing one provenance type (human-only or AI-only) on all players.

## Core model: canonical identity vs presentation assets

### Canonical identity (gameplay layer)

- NPC identity: stable NPC ID used by dialogue, progression, saves.
- Item identity: stable item ID used by inventory/process systems.
- Quest identity: stable path/quest identifiers used by routing and progression.

### Presentation assets (image layer)

- One entity can have multiple image variants over time.
- Variant selection is cosmetic and render-time only.
- Save files and game references must point to canonical entity IDs, not image filenames.
- Swapping variants must not modify mechanics, route behavior, quest graph logic, or rewards.

## Separate corpora with shared framework

The system must preserve three distinct corpora:

1. NPC images
2. Item images
3. Quest images

### Why separation matters

- **UX expectations differ:** NPC portraits are character-facing; item art is functional catalog UI;
  quest art may be narrative/banner-like.
- **Moderation/provenance risk differs:** community-submitted NPC portraits may require different
  review sensitivity than item icons.
- **Preference defaults can differ:** players may prefer human NPC portraits but default item art.
- **Contributor workflows differ:** contest criteria for NPC portraits and item sprites will differ.
- **Fallback/style constraints differ:** each corpus can have distinct style guide and fallback rules.

### Shared conceptual layer

Despite corpus separation, all corpora should use the same variant vocabulary:

- provenance,
- status lifecycle,
- moderation/approval state,
- eligibility for settings toggles,
- supersession/deprecation linkage,
- selection priority semantics.

## Variant metadata model (proposed schema direction)

Each entity should resolve to a set of image variant records. Proposed shape:

```json
{
  "entity_id": "string",
  "entity_type": "npc | item | quest",
  "corpus": "npc | item | quest",
  "variant_id": "string",
  "asset_path": "string",
  "is_default": false,
  "is_canonical_presentation": false,
  "status": "active | deprecated | superseded | archived",
  "provenance": "human | ai | hybrid | unknown",
  "provenance_detail": "human_commissioned | human_contest | human_community | ai_generated | hybrid_overpaint | unknown",
  "artist_credit": {
    "display_name": "string",
    "profile_url": "string | null"
  },
  "license": {
    "license_id": "string",
    "usage_scope": "internal | in_game | commercial | restricted",
    "notes": "string | null"
  },
  "moderation": {
    "state": "approved | pending | rejected | limited",
    "reviewed_by": "string | null",
    "reviewed_at": "ISO-8601 | null"
  },
  "visibility": {
    "discoverable": true,
    "show_in_gallery": true,
    "allow_player_toggle": true,
    "legacy_opt_in_only": false
  },
  "tags": ["portrait_refresh", "seasonal", "event"],
  "priority": 100,
  "pinned_rank": 1,
  "created_at": "ISO-8601",
  "deprecated_at": "ISO-8601 | null",
  "supersedes": "variant_id | null",
  "superseded_by": "variant_id | null",
  "ai_metadata": {
    "model_family": "string | null",
    "toolchain": "string | null",
    "prompt_version": "string | null"
  }
}
```

### Notes

- `entity_type` and `corpus` can be initially redundant; keeping both improves migration safety.
- `is_default` is the render fallback baseline for that entity.
- `is_canonical_presentation` can pin an official marketing/default presentation separately from
  experimentation.
- `allow_player_toggle` gates whether a variant is eligible for preference-based selection.

## Example metadata snippets

### Example A: NPC with older AI base art, newer replacement, plus human commissioned variant

```json
{
  "entity_id": "npc:captain-lyra",
  "entity_type": "npc",
  "variants": [
    {
      "variant_id": "lyra-ai-v1",
      "asset_path": "assets/npc/lyra/lyra-ai-v1.webp",
      "is_default": false,
      "status": "deprecated",
      "provenance": "ai",
      "provenance_detail": "ai_generated",
      "ai_metadata": {
        "model_family": "early-diffusion-v1",
        "toolchain": "legacy-pipeline",
        "prompt_version": "unknown"
      },
      "created_at": "2024-09-12T00:00:00Z",
      "deprecated_at": "2026-02-20T00:00:00Z",
      "superseded_by": "lyra-ai-v2",
      "visibility": {
        "allow_player_toggle": true,
        "legacy_opt_in_only": true
      },
      "moderation": { "state": "approved" }
    },
    {
      "variant_id": "lyra-ai-v2",
      "asset_path": "assets/npc/lyra/lyra-ai-v2.webp",
      "is_default": true,
      "status": "active",
      "provenance": "ai",
      "provenance_detail": "ai_generated",
      "ai_metadata": {
        "model_family": "modern-diffusion-v5",
        "toolchain": "dspace-image-pipeline-2",
        "prompt_version": "npc-portrait-v3"
      },
      "created_at": "2026-02-20T00:00:00Z",
      "supersedes": "lyra-ai-v1",
      "visibility": {
        "allow_player_toggle": true,
        "legacy_opt_in_only": false
      },
      "moderation": { "state": "approved" }
    },
    {
      "variant_id": "lyra-human-commission-01",
      "asset_path": "assets/npc/lyra/lyra-human-commission-01.webp",
      "is_default": false,
      "status": "active",
      "provenance": "human",
      "provenance_detail": "human_commissioned",
      "artist_credit": {
        "display_name": "A. Rivera",
        "profile_url": "https://example.com/arivera"
      },
      "license": {
        "license_id": "commission-contract-2026-lyra",
        "usage_scope": "commercial",
        "notes": "Artist retains portfolio display rights"
      },
      "created_at": "2026-03-05T00:00:00Z",
      "visibility": {
        "allow_player_toggle": true,
        "legacy_opt_in_only": false
      },
      "moderation": { "state": "approved" }
    }
  ]
}
```

### Example B: Quest image with community contest winner and strict moderation gate

```json
{
  "entity_id": "quest:hydroponics/nutrient-check",
  "entity_type": "quest",
  "variants": [
    {
      "variant_id": "nutrient-check-default-v1",
      "asset_path": "assets/quests/hydroponics/nutrient-check-v1.webp",
      "is_default": true,
      "status": "active",
      "provenance": "ai",
      "provenance_detail": "ai_generated",
      "visibility": { "allow_player_toggle": true },
      "moderation": { "state": "approved" },
      "created_at": "2025-01-10T00:00:00Z"
    },
    {
      "variant_id": "nutrient-check-contest-2027-winner",
      "asset_path": "assets/quests/hydroponics/nutrient-check-contest-2027.webp",
      "is_default": false,
      "status": "active",
      "provenance": "human",
      "provenance_detail": "human_contest",
      "artist_credit": {
        "display_name": "Contest Winner #2027-14",
        "profile_url": null
      },
      "license": {
        "license_id": "contest-terms-2027",
        "usage_scope": "commercial",
        "notes": "Non-exclusive; attribution required"
      },
      "visibility": {
        "allow_player_toggle": true,
        "show_in_gallery": true
      },
      "moderation": {
        "state": "approved",
        "reviewed_by": "content-moderation-team",
        "reviewed_at": "2027-06-01T00:00:00Z"
      },
      "created_at": "2027-05-28T00:00:00Z"
    }
  ]
}
```

## Base/default art + additional variants

Each canonical entity has one default presentation image plus zero or more optional variants.

- **Default/base:** safe fallback used whenever preference filtering yields no eligible alternatives.
- **Variants:** alternate approved presentations that preserve entity identity.

This parallels alternate-art concepts from collectible games, but in DSPACE terms the key contract
is: **identity remains constant, presentation can evolve**.

### Variant categories (initial taxonomy)

- portrait refresh
- seasonal/environmental
- expedition/costume loadout
- event variants
- human commissioned
- approved community/fan-art derived
- restored/remastered legacy art

## Deprecation and migration strategy

### Why deprecate

- Older early-generation AI assets may not meet modern quality/style standards.
- Newer tooling or human-created replacements can better match narrative intent.
- Provenance clarity may improve over time, requiring status updates.

### Deprecation behavior

- Deprecating a variant does not remove or rename canonical entity IDs.
- Deprecated variants move out of normal default pools, but can be preserved for archival or
  user opt-in legacy mode.
- `supersedes`/`superseded_by` links preserve historical lineage.

### Proposed migration order

1. **NPC-first migration (Stage 1):** highest player-visibility and strongest preference demand.
2. **Item corpus migration (Stage 3):** inventory readability and style consistency.
3. **Quest corpus migration (Stage 3+):** banners/illustrations with narrative continuity.

### Legacy retention options

- Retain deprecated assets in metadata as hidden-by-default.
- Allow optional “show legacy/deprecated art” player setting.
- Optionally surface archival provenance history in docs/admin tooling.

## Player settings and personalization (future `/settings`)

### Candidate settings

Global defaults:

- Prefer human-made variants when available.
- Prefer default/canonical-only art.
- Allow both human and AI variants.
- Prefer newest eligible variant.
- Allow legacy/deprecated art.
- Randomize among eligible variants.

Per-corpus overrides:

- NPC preference profile (e.g., human-preferred).
- Item preference profile (e.g., canonical-only).
- Quest preference profile (e.g., mixed with no randomization).

### Resolution behavior

- Per-corpus override should win over global default.
- If no eligible variant remains after filters, fallback to entity default.
- If default is ineligible due to moderation, fallback to next approved safe variant.
- If none are approved/visible, use a corpus-level placeholder.

### Deterministic vs randomized behavior

- Deterministic mode: stable choice by sorted priority.
- Randomized mode: sample from eligible pool.
- Sticky random option (recommended): stable per entity per session to reduce UI flicker.

## Variant selection algorithm (proposed)

Given `(entity_id, corpus, player_settings, session_seed)`:

1. Gather variants for entity.
2. Validate corpus/entity_type match.
3. Filter by moderation (`approved` or policy-allowed limited states).
4. Filter by visibility flags (`discoverable`, `allow_player_toggle`, legacy setting).
5. Apply provenance preference filter (human-only, mixed, default-only, etc.).
6. Apply license/usage eligibility filter if environment requires it.
7. Sort by:
   - `is_default` / `is_canonical_presentation` (when default-only mode),
   - explicit pin rank,
   - priority,
   - recency (`created_at`) when “prefer newest” is enabled.
8. If randomization enabled, randomize within top eligible slice (seeded if sticky mode).
9. If empty after filtering, fallback to designated entity default.
10. If default unavailable, fallback to first approved active variant.
11. If still empty, fallback to corpus placeholder and emit diagnostics.

### Safe fallback guarantee

The renderer must always resolve to an image (variant or placeholder) without mutating gameplay
state, and without cross-corpus leakage.

## Example decision flow

**Input:**

- Entity: `npc:captain-lyra`
- Settings: `prefer_human=true`, `allow_legacy=false`, `randomize=false`
- Variants: `lyra-ai-v1 (deprecated)`, `lyra-ai-v2 (active)`,
  `lyra-human-commission-01 (active)`

**Flow:**

1. Exclude deprecated `lyra-ai-v1` (legacy disabled).
2. Remaining: `lyra-ai-v2`, `lyra-human-commission-01`.
3. Apply provenance preference: human-preferred chooses `lyra-human-commission-01`.
4. If human variant becomes unapproved later, auto-fallback to `lyra-ai-v2`.

**Outcome:** deterministic human-first rendering with safe fallback.

## Human-made art as a first-class path

Future system design should support human-created variants for all corpora:

- bespoke commissioned official art,
- approved community submissions,
- contest winners,
- curated featured variants,
- and coexistence with AI variants for the same entity.

### Why this matters

- respects player preference diversity,
- builds trust through clearer authorship and provenance,
- enables gradual replacement/augmentation of AI bootstrap art,
- creates a healthier long-term creative ecosystem around DSPACE content.

## Financial incentives and contribution workflows (future)

### Supported pathways

- **Direct commissions:** maintainers contract artists for targeted entities.
- **Contests/competitions:** themed calls for NPC/item/quest variants.
- **Featured curation:** selected community works promoted as official variants.
- **Future crowdfunding tie-ins:** optional sponsorship of specific refresh tracks.

### Operational requirements (design-level)

- clear attribution fields and display surfaces,
- explicit license + commercial usage metadata,
- moderation/approval states before in-game visibility,
- contest policy flags for exclusive vs non-exclusive usage,
- artist portfolio-rights notation,
- provenance audit trail in metadata for each accepted asset.

This section is product/operations design guidance, not legal advice.

## Policy, moderation, and provenance transparency

- Provenance should be inspectable in metadata and optionally surfaced in UI (“Human-made”,
  “AI-generated”, “Hybrid”, “Unknown”).
- Unknown/mixed provenance assets should be allowed only under explicit policy and clear labeling.
- Human-preference toggles should only consider verified eligible assets (`approved`, licensed,
  and `allow_player_toggle=true`).
- Community submissions should require moderation approval before user-facing rollout.
- Credit display should be consistent but lightweight to avoid UI overload.

## Future implementation touchpoints (no code in this doc)

Likely v3.1/v3.2+ implementation areas:

- Content metadata and JSON schema additions for variant records.
- Asset storage/layout conventions per corpus and per entity.
- Render-time variant resolution utility with deterministic fallback.
- `/settings` UI and persistence for global + per-corpus preferences.
- Migration utilities for bulk status transitions (e.g., deprecate legacy AI sets).
- Admin/contributor moderation tooling for provenance/license review.
- Docs/admin surfaces for provenance inspection and audit history.

## Rollout plan

### Stage 0: design and metadata conventions

- Finalize schema keys and status vocabulary.
- Define corpus-specific style and moderation policy baselines.

### Stage 1: NPC variant support

- Add NPC variant metadata and resolver in rendering pipeline.
- Keep canonical NPC IDs unchanged.

### Stage 2: settings integration for provenance preferences

- Add global and per-corpus settings.
- Support deterministic human-preferred and canonical-only modes.

### Stage 3: item and quest variant support

- Extend schema and resolver to item/quest corpora.
- Validate corpus isolation and fallback guarantees.

### Stage 4: contributor/commission/contest workflow enablement

- Add submission intake, moderation review states, and attribution/license records.
- Enable official featured-variant program.

### Stage 5: legacy art deprecation and refresh passes

- Execute phased deprecation of selected early-generation assets.
- Preserve archival traceability and optional legacy visibility setting.

## Testing and acceptance criteria (for future implementation)

### Core correctness

- Canonical entity references remain stable when variants are added, swapped, or deprecated.
- Variant resolution never alters gameplay mechanics, quest logic, inventory semantics, or routes.
- Cross-corpus leakage is prevented (NPC resolver never returns item/quest assets).

### Settings behavior

- Human-preferred mode deterministically selects approved human variants when available.
- If no human variant is eligible, fallback to default approved variant works reliably.
- Canonical-only mode always returns designated default presentation.
- Legacy toggle correctly hides/shows deprecated variants.
- Per-corpus overrides take precedence over global settings.

### Provenance and moderation integrity

- Unapproved community variants never surface to end users.
- Provenance and credit metadata is inspectable for selected variants.
- Selection logic honors `allow_player_toggle` and license constraints.

### Migration safety

- Bulk deprecation migrations preserve supersession links and timestamps.
- Save/load behavior remains unchanged across art migration events.

## Failure modes and open questions

### Failure modes

- Variant sprawl leads to high curation cost and inconsistent quality.
- Metadata drift causes incorrect provenance or license labeling.
- Missing rights/provenance data blocks eligibility for human-preference modes.
- Over-restrictive settings may yield empty candidate pools too often.
- Inconsistent moderation throughput delays community art visibility.

### Open questions

- Should randomization be session-sticky by default, or always deterministic?
- How should “official” vs “community” labels be surfaced in UI without clutter?
- Should some corpora (for example, quest art) initially disable randomization?
- What minimum metadata is required to accept unknown/hybrid provenance assets?
- Should deprecated assets remain downloadable/exportable for archival use?
- What governance model approves commission/contest terms and payout policies?

## Summary

DSPACE should evolve from single-image-per-entity assumptions to a corpus-aware variant framework
that preserves canonical gameplay identity, improves art quality over time, and makes provenance a
first-class concept. The proposed roadmap explicitly supports human-created art pathways (including
commission and contest workflows), while keeping a safe fallback model and stable gameplay behavior.
