# Image Variants and Provenance Framework (v3.1+ / v3.2+ roadmap)

Date: 2026-03-31
Status: Proposed design (not yet implemented)

## Problem statement

DSPACE currently ships image assets across three gameplay-facing domains:

- NPC portraits
- Item art
- Quest art

Today, these assets are effectively treated as static files attached to entities. This becomes limiting as
visual quality, generation tooling, and contributor workflows evolve over time. In particular:

- Some older assets were produced with earlier-generation AI image tooling.
- Newer generation quality is often materially higher.
- Players may prefer human-made artwork, AI artwork, or a mixed approach.
- We need to deprecate legacy visuals without breaking canonical gameplay identity.

This design proposes a shared **variant + provenance** framework that preserves canonical entity identity while
allowing presentation assets to evolve.

> Important: this document describes a forward-looking roadmap for v3.1 / v3.2+ and does **not** claim that this
> framework already exists in v3.

## Goals

- Preserve strict separation between canonical entity identity and image presentation.
- Support a common variant/provenance model across NPC, item, and quest corpora.
- Keep corpora separate for UX, moderation, fallback, and contributor operations.
- Enable provenance-aware player settings (including human-preference paths).
- Support deprecation/supersession of legacy art without save-file or logic breakage.
- Create a first-class path for human-made art (commissioned, community, contest, curated official).
- Provide enough metadata for attribution, license clarity, moderation, and auditability.

## Non-goals

- Changing game mechanics, quest progression, inventory semantics, or route behavior based on art.
- Fully solving legal policy details in this design alone.
- Requiring immediate full migration of all assets in v3.
- Forcing one provenance type globally for all users.
- Replacing existing content pipelines in one step.

## Current state vs proposed future state

### Current state (verified at design time)

- DSPACE has image usage across NPCs, items, and quests.
- Entity content and route behavior are defined independently of any formal variant selection system.
- No repository-wide, standardized variant metadata contract is currently documented for all three corpora.

### Proposed future state (roadmap)

- Each entity may have one canonical/default image plus additional variants.
- Variants carry provenance, licensing, moderation, lifecycle, and eligibility metadata.
- `/settings` (or equivalent) allows preference-based variant resolution at render time.
- Legacy/early-generation assets can be deprecated or hidden while preserving archival traceability.

## Why corpora stay separate (with a shared conceptual framework)

Images are not a monolithic pool. We preserve distinct corpora:

1. **NPC images**
2. **Item images**
3. **Quest images**

Why separation matters:

- **Different UX expectations**
  - NPC portraits may benefit from personality-consistent alternates.
  - Item art often needs readability and icon-like consistency.
  - Quest art may be contextual or scene-like and can be more experimental.
- **Different moderation/provenance concerns**
  - NPC likeness consistency and sensitive representation checks differ from item visuals.
- **Different settings granularity**
  - A user might prefer human NPC portraits while keeping default item art.
- **Different contributor workflows**
  - NPC portrait commissions differ from quest-scene contests.
- **Different fallback and style constraints**
  - Item silhouettes may need stricter fallback behavior than quest banners.

Despite separate corpora, all three use a **shared conceptual model**: canonical entity + variant metadata +
selection policy + safe fallback.

## Canonical identity vs presentation assets

DSPACE must enforce a strict boundary:

- **Canonical identity**: NPC/item/quest identity used by game logic and saves.
- **Presentation assets**: image variants used only for display.

Design requirements:

- Save files and cross-references point to canonical entity IDs, not image file paths.
- Variant swaps are cosmetic only.
- Variant swaps must never alter mechanics, quest logic, inventory behavior, or Astro route behavior.

## Proposed variant metadata model

A single schema direction can support all corpora, with corpus-specific tags/policies.

### Core fields

| Field | Type | Purpose |
|---|---|---|
| `entity_id` | string | Canonical NPC/item/quest identifier |
| `entity_type` | enum | `npc` \| `item` \| `quest` |
| `corpus` | enum | Same as entity type but explicit for policy partitioning |
| `variant_id` | string | Stable unique variant identifier |
| `is_default` | boolean | Canonical display fallback for entity |
| `provenance` | enum | `human` \| `ai` \| `hybrid` \| `unknown` |
| `provenance_detail` | enum/string | e.g., `human_commissioned`, `human_contest`, `human_community`, `ai_generated` |
| `artist_credit` | object | display name, optional URL, optional handle |
| `license` | object | license type, scope, usage rights summary |
| `status` | enum | `active` \| `deprecated` \| `superseded` \| `archived` |
| `tags` | string[] | style or event tags |
| `priority` | number | deterministic ranking |
| `pinned_rank` | number\|null | optional hard ordering |
| `created_at` | ISO datetime | lifecycle audit |
| `deprecated_at` | ISO datetime\|null | lifecycle audit |
| `supersedes` | string\|null | predecessor variant_id |
| `superseded_by` | string\|null | successor variant_id |
| `model_family` | string\|null | AI model family when known |
| `toolchain` | string\|null | generation/edit pipeline details |
| `prompt_version` | string\|null | prompt template/version for reproducibility |
| `moderation_state` | enum | `pending` \| `approved` \| `rejected` |
| `visibility` | object | runtime visibility flags (public/internal/legacy) |
| `preference_eligible` | boolean | whether settings toggles may consider this variant |

### Example A: NPC with older AI base portrait and newer replacement

```json
{
  "entity_id": "captain-mira",
  "entity_type": "npc",
  "corpus": "npc",
  "variants": [
    {
      "variant_id": "captain-mira-ai-v1",
      "is_default": false,
      "provenance": "ai",
      "provenance_detail": "ai_generated",
      "artist_credit": { "display_name": "DSPACE Early Gen Pipeline" },
      "license": { "code": "internal-commercial", "usage_scope": "in-game" },
      "status": "deprecated",
      "tags": ["portrait", "legacy", "v3_bootstrap"],
      "priority": 20,
      "created_at": "2025-07-04T00:00:00Z",
      "deprecated_at": "2026-07-15T00:00:00Z",
      "superseded_by": "captain-mira-ai-v2",
      "model_family": "gen1",
      "toolchain": "legacy-pipeline-a",
      "prompt_version": "mira_prompt_v1",
      "moderation_state": "approved",
      "visibility": { "public": false, "legacy_opt_in": true },
      "preference_eligible": true
    },
    {
      "variant_id": "captain-mira-ai-v2",
      "is_default": true,
      "provenance": "ai",
      "provenance_detail": "ai_generated",
      "artist_credit": { "display_name": "DSPACE Art Pipeline 2026" },
      "license": { "code": "internal-commercial", "usage_scope": "in-game" },
      "status": "active",
      "tags": ["portrait", "refresh"],
      "priority": 90,
      "created_at": "2026-07-15T00:00:00Z",
      "supersedes": "captain-mira-ai-v1",
      "model_family": "gen4",
      "toolchain": "pipeline-2026-b",
      "prompt_version": "mira_prompt_v4",
      "moderation_state": "approved",
      "visibility": { "public": true, "legacy_opt_in": false },
      "preference_eligible": true
    }
  ]
}
```

### Example B: entity with a human-made variant alongside AI/default

```json
{
  "entity_id": "item-solar-filter",
  "entity_type": "item",
  "corpus": "item",
  "variants": [
    {
      "variant_id": "solar-filter-default-ai",
      "is_default": true,
      "provenance": "ai",
      "provenance_detail": "ai_generated",
      "status": "active",
      "priority": 70,
      "moderation_state": "approved",
      "preference_eligible": true
    },
    {
      "variant_id": "solar-filter-human-contest-2027",
      "is_default": false,
      "provenance": "human",
      "provenance_detail": "human_contest",
      "artist_credit": {
        "display_name": "A. Rivera",
        "portfolio_url": "https://example.com/arivera"
      },
      "license": {
        "code": "contest-non-exclusive-commercial",
        "usage_scope": "in-game, promo",
        "artist_portfolio_rights": true
      },
      "status": "active",
      "tags": ["featured", "contest_winner"],
      "priority": 95,
      "created_at": "2027-02-01T00:00:00Z",
      "moderation_state": "approved",
      "visibility": { "public": true },
      "preference_eligible": true
    }
  ]
}
```

## Base art + variants model

Per entity:

- Exactly one **default/canonical presentation** at a time (`is_default=true`).
- Zero or more additional variants.

This is similar in spirit to alternate-art systems in other games, but expressed in DSPACE terms:

- canonical entity identity remains fixed
- presentation layer can evolve safely

Variant category examples:

- Portrait refresh
- Seasonal/environmental variant
- Alternate costume/expedition gear
- Event variant
- Human commissioned official variant
- Approved community/fan-art-derived variant
- Restored/remastered legacy variant

## Deprecation and migration strategy

### Why deprecate

Older early-generation AI art may eventually be deprecated as tooling quality and consistency improve.
Deprecation enables quality refresh without identity churn.

### Deprecation behavior

- Mark variant status as `deprecated` or `superseded`; do not delete canonical entity.
- Maintain supersession links (`supersedes` / `superseded_by`) for audit history.
- Keep deprecated assets available for archival or explicit legacy opt-in settings when permitted.

### Migration sequence

1. **NPC-first migration** (highest player salience).
2. Expand framework to **items**.
3. Expand framework to **quests**.

### Backward safety

- Existing save/entity references remain unchanged.
- If setting filters remove all eligible variants, hard-fallback to default active variant.
- If default variant is deprecated and hidden by default policy, provide a replacement default before rollout.

## Player settings and personalization (future `/settings` direction)

Potential settings:

- Prefer human-made images when available.
- Prefer canonical/default art only.
- Allow both human and AI art.
- Prefer newest art.
- Allow legacy/deprecated art.
- Randomize among eligible variants.
- Per-corpus overrides (e.g., human NPC, default item, mixed quest).

### Global vs per-corpus precedence

- Global profile defines baseline behavior.
- Corpus-level overrides replace baseline for that corpus.
- Missing corpus override falls back to global setting.

### Determinism, stickiness, and UX

- Default behavior should be deterministic to avoid confusing visual churn.
- Optional randomization should be explicit opt-in.
- If randomization is enabled, prefer session-sticky or entity-sticky caching to reduce surprise.

## Variant selection algorithm (proposed)

Given `(entity_id, corpus, user_settings)`:

1. Load variants for entity.
2. Filter to matching corpus/entity type.
3. Filter `moderation_state=approved` and `visibility.public=true` (or allowed internal mode).
4. Apply legacy filter (`status != deprecated`) unless user enabled legacy.
5. Apply provenance preference filter (human/ai/mixed) using `preference_eligible=true`.
6. Apply license eligibility filters for runtime context if needed.
7. Sort by:
   - pinned/default precedence
   - explicit priority desc
   - created_at desc (if “prefer newest” is active)
8. If randomization enabled, randomize within top eligible pool according to configured rule.
9. If no variant remains, fallback to entity default variant.
10. If default missing or invalid (should be prevented), fallback to repository-safe placeholder and log.

### Example decision flow

User settings:

- Global: prefer human
- NPC override: prefer human + allow legacy false
- Item override: default-only
- Randomization: off

Entity request: `captain-mira` (NPC)

- Eligible active approved variants: `captain-mira-ai-v2`, `captain-mira-human-commission-2027`
- Human preference keeps only `captain-mira-human-commission-2027`
- Returns human commission variant deterministically.

Entity request: `item-solar-filter` (item)

- Item override is default-only, so selection ignores non-default contest variant.
- Returns `solar-filter-default-ai`.

## Human-made art as a first-class path

The framework explicitly supports human-created variants for NPCs, items, and quests:

- Bespoke commissioned art
- Approved community submissions
- Contest/competition winners
- Curated official human variant lines
- Coexistence with AI variants for the same entity

Why this matters:

- Respects player preference diversity.
- Improves artistic legitimacy and trust through transparent credits.
- Enables progressive replacement or augmentation of AI bootstrap assets.
- Supports a healthy long-term community art ecosystem.

## Financial incentives and contributor pathways

Future operational tracks:

1. **Direct commissions**
   - Contracted art for high-priority NPC/item/quest entities.
2. **IRL/online contests**
   - Time-boxed themes (e.g., seasonal quest art refresh).
3. **Curated featured variants**
   - Rotating officially featured human-made variants.
4. **Potential crowdfunding tie-ins (future)**
   - Community-backed art drives with transparent reward scope.

Design requirements (operational, not legal advice):

- Clear artist attribution metadata.
- Explicit licensing and commercial usage scope.
- Moderation + approval gating before in-game visibility.
- Contest rules capture exclusivity/non-exclusivity terms.
- Portfolio-rights expectations are recorded.
- Provenance and auditability are machine-readable in metadata.

## Policy, moderation, and provenance transparency

- Provenance should be inspectable in metadata and optionally surfaced in UI.
- Artist credit display should be consistent and easy to access.
- Unknown/hybrid provenance must be representable (`unknown`, `hybrid`).
- Community submissions must pass moderation prior to gameplay surfaces.
- Human-preference toggles must only consider verified eligible variants.
- UI should expose meaningful provenance choices without overwhelming users.

## Future implementation touchpoints (non-binding)

- **Content metadata and schema**
  - JSON schema for variant registry entries per corpus.
- **Asset layout**
  - Consistent path conventions keyed by corpus/entity/variant.
- **Render-time resolution**
  - Shared resolver utility with corpus-aware policy filters.
- **`/settings` integration**
  - Global + per-corpus preference controls.
- **Migration/admin tooling**
  - Scripts to mark deprecations, set supersession links, and validate defaults.
- **Contributor/moderation tooling**
  - Intake, review states, and approval publication controls.
- **Inspection surfaces**
  - Internal docs/admin pages for provenance and rights auditing.

## Rollout plan (staged)

- **Stage 0 (Design + metadata conventions)**
  - Finalize schema and naming conventions; audit existing assets.
- **Stage 1 (NPC variants)**
  - Add variant metadata and resolver for NPC portraits only.
- **Stage 2 (Settings for provenance preferences)**
  - Add user-facing controls and deterministic defaults.
- **Stage 3 (Item + quest variant expansion)**
  - Apply framework to item and quest corpora.
- **Stage 4 (Contributor/commission/contest workflows)**
  - Add submission, review, and publication workflows.
- **Stage 5 (Legacy deprecation + refresh passes)**
  - Deprecate/supersede targeted legacy assets with archival policy.

## Testing and acceptance criteria for future implementation

- Canonical entity references remain stable when image variants change.
- Variant swap does not affect quest logic, inventory semantics, or routing behavior.
- Human-preference setting deterministically picks approved eligible human variant when present.
- Fallback to default works when no eligible variant matches user preferences.
- Legacy/deprecated assets can be hidden or shown according to settings.
- Per-corpus overrides take precedence over global defaults for that corpus only.
- Resolver cannot leak variant policies across corpora.
- Provenance, license, and moderation metadata are inspectable for each selected variant.
- Deprecated/superseded chains are internally consistent.

## Failure modes and open questions

- Variant sprawl creates curation and moderation burden.
- Metadata quality drift (missing provenance/license fields) blocks safe selection.
- Community submissions may arrive with unclear rights ownership.
- Some settings combinations may yield no eligible variants.
- Tension between legacy removal and historical preservation.
- Randomization policy: per-render vs per-session vs per-entity stickiness.
- UI labeling: how to present “official” vs “community” without status confusion.
- Whether some corpora (especially items) should initially disable randomization for clarity.

## Migration notes and safeguards

- Treat this as additive metadata first, then resolver behavior.
- Avoid mass file moves until schema and fallback behavior are validated.
- Require at least one approved default per entity before enabling strict preference filters.
- Add lint/validation checks to prevent invalid state (multiple defaults, no fallback, broken supersession links).

## Summary

DSPACE should move toward a provenance-aware, corpus-aware image variant framework that preserves gameplay
identity while enabling art evolution, player choice, and human-artist contribution pathways. This design
prioritizes safe fallback behavior, transparent metadata, and staged adoption over a one-shot migration.
