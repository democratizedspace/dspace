# Image variants and provenance roadmap (v3.1 / v3.2+)

## Status and scope

- **Status**: design proposal only; this document describes target behavior for future releases.
- **Applies to**: image assets for NPCs, items, and quests.
- **Current state**: DSPACE already ships image assets across those corpora, but does **not** yet have
  a unified variant/provenance metadata system described here.
- **Intended rollout window**: staged adoption beginning in v3.1 (NPC-first), then broader adoption
  in v3.2+.

This doc is intentionally implementation-aware (data model and rollout sequencing) without
introducing product code in this change.

## Why this exists

DSPACE has grown through multiple content eras. Existing images across NPCs, items, and quests were
produced at different times and with different methods, including earlier-generation AI workflows
and newer image generation approaches with improved quality/consistency.

We need a long-term model that:

- preserves **canonical entity identity** while allowing visual evolution over time,
- supports explicit **provenance** and auditability,
- allows old art to be **deprecated or superseded** without breaking saves/references,
- supports players who prefer **human-made** art,
- creates a practical path for future commissions, contests, and curated community submissions.

## Design principles

1. **Identity is canonical, art is presentation**.
2. **Separate corpora, shared framework** (NPC/item/quest each keep distinct pipelines).
3. **Safe fallback always wins** (entity must always render even if preferences are strict).
4. **Provenance transparency is a first-class concern**.
5. **Human and AI variants can coexist for the same entity**.
6. **Deprecation preserves history** (do not erase lineage by default).

## Goals

- Introduce a shared image-variant model that works across NPC, item, and quest corpora.
- Add provenance-aware metadata and selection logic.
- Support human-made art as a first-class path (commissioned, contest, community-approved).
- Allow deprecation/supersession of legacy art without breaking canonical entity references.
- Enable settings-driven player control (global + per-corpus overrides).
- Keep rollout incremental: NPC-first, then item/quest.

## Non-goals

- Changing gameplay, quest logic, inventory semantics, or route behavior based on art variant.
- Solving every legal/moderation policy detail in this design doc.
- Immediate full implementation in v3.
- Forcing a single provenance mode for all players.
- Requiring historical assets to be deleted when deprecated.

## Canonical entity vs presentation layer

### Canonical identity

Canonical entities remain the system of record:

- NPC identity (`npcId` or equivalent canonical key)
- item identity (`itemId`)
- quest identity (`pathId + questId` or equivalent canonical key)

Save data, references, and gameplay systems should continue to point to canonical entity IDs.

### Presentation identity

Image variants are presentation assets attached to canonical entities:

- Variants are cosmetic.
- Variant swaps must not change mechanics, process IO, quest progression, or navigation/routes.
- Rendering layer resolves a variant at display time from settings + eligibility + fallback rules.

## Separate image corpora with shared concepts

Images are **not** one monolithic pool. DSPACE should preserve distinct corpora:

- NPC images
- item images
- quest images

Why separation matters:

- **UX expectations differ**
  - NPCs: identity/portrait continuity matters most.
  - Items: recognizability and icon readability matter most.
  - Quests: scene tone/context and narrative framing matter most.
- **Moderation and provenance differ**
  - Community quest art may require stricter narrative-content review.
  - Item icons may need style consistency checks.
- **Settings preferences differ**
  - A player may prefer human NPC portraits but default item icons.
- **Contributor workflows differ**
  - NPC portrait commissioning cadence differs from quest illustration contests.
- **Fallback/style constraints differ**
  - Missing item icon fallback and missing quest scene fallback should not behave identically.

Despite these differences, all corpora should share one conceptual metadata vocabulary for
variants/provenance so tooling and selection logic stay consistent.

## Proposed variant metadata model (future)

The exact storage location may evolve, but future content metadata should support fields like:

| Field | Type | Notes |
|---|---|---|
| `entity_type` | enum | `npc` \| `item` \| `quest` |
| `entity_id` | string/object | Canonical entity key (quest may be composite). |
| `corpus` | enum | `npc_images` \| `item_images` \| `quest_images` |
| `variant_id` | string | Stable unique ID within entity. |
| `is_default` | boolean | Marks canonical/default presentation choice. |
| `is_base` | boolean | Optional explicit base asset marker. |
| `status` | enum | `active` \| `deprecated` \| `superseded` \| `archived` |
| `supersedes` | string? | Variant lineage link. |
| `superseded_by` | string? | Reverse lineage link. |
| `provenance` | enum | `human` \| `ai` \| `hybrid` \| `unknown` |
| `provenance_detail` | enum/string | e.g., `human_commissioned`, `human_contest`, `ai_generated`. |
| `artist_credit` | object | Display name, handle, and optional URL. |
| `license` | object | SPDX/custom code, usage scope, attribution requirements. |
| `usage_scope` | enum/string | e.g., in-game commercial/non-exclusive rights metadata. |
| `tags` | string[] | Style/category tags (seasonal, remaster, expedition, etc.). |
| `priority` | number | Sorting hint among eligible variants. |
| `pinned_rank` | number? | Optional explicit ordering control. |
| `created_at` | ISO date | Variant creation timestamp. |
| `deprecated_at` | ISO date? | Set when variant becomes deprecated/superseded. |
| `model_family` | string? | AI model family/tool generation identifier when known. |
| `toolchain` | string? | Generator + post-processing pipeline when known. |
| `prompt_version` | string? | Internal prompt/template reference when applicable. |
| `moderation_state` | enum | `pending` \| `approved` \| `rejected` \| `restricted` |
| `visibility` | object | `public`, `internal`, `legacy_only`, etc. |
| `eligible_for_preferences` | boolean | Whether variant can be selected via player toggles. |
| `verification` | object | Provenance confidence, reviewer ID/date, evidence references. |

### Example metadata snippet A: NPC with legacy AI base and newer replacement

```json
{
    "entity_type": "npc",
    "entity_id": "engineer-mara",
    "corpus": "npc_images",
    "variants": [
        {
            "variant_id": "portrait-v1-legacy-ai",
            "is_default": false,
            "is_base": true,
            "status": "deprecated",
            "deprecated_at": "2026-08-12T00:00:00Z",
            "superseded_by": "portrait-v2-ai-refresh",
            "provenance": "ai",
            "provenance_detail": "ai_generated",
            "model_family": "legacy-gen-1",
            "toolchain": "legacy-prompt-pipeline",
            "prompt_version": "npc_portrait_v1",
            "artist_credit": {
                "display_name": "DSPACE system generation"
            },
            "license": {
                "code": "INTERNAL-DSPACE-ASSET",
                "usage_scope": "in_game"
            },
            "moderation_state": "approved",
            "visibility": {
                "public": true,
                "legacy_only": true
            },
            "eligible_for_preferences": true,
            "priority": 10,
            "tags": ["portrait", "legacy", "remaster-source"]
        },
        {
            "variant_id": "portrait-v2-ai-refresh",
            "is_default": true,
            "status": "active",
            "supersedes": "portrait-v1-legacy-ai",
            "provenance": "ai",
            "provenance_detail": "ai_generated",
            "model_family": "gen-4",
            "toolchain": "dspace-art-pipeline-v2",
            "prompt_version": "npc_portrait_v2",
            "artist_credit": {
                "display_name": "DSPACE system generation"
            },
            "license": {
                "code": "INTERNAL-DSPACE-ASSET",
                "usage_scope": "in_game"
            },
            "moderation_state": "approved",
            "visibility": {
                "public": true,
                "legacy_only": false
            },
            "eligible_for_preferences": true,
            "priority": 100,
            "tags": ["portrait", "refresh", "official"]
        }
    ]
}
```

### Example metadata snippet B: entity with human-made variant alongside AI

```json
{
    "entity_type": "quest",
    "entity_id": {
        "pathId": "play",
        "questId": "2"
    },
    "corpus": "quest_images",
    "variants": [
        {
            "variant_id": "scene-default-ai-v1",
            "is_default": true,
            "status": "active",
            "provenance": "ai",
            "provenance_detail": "ai_generated",
            "moderation_state": "approved",
            "eligible_for_preferences": true,
            "priority": 80,
            "tags": ["scene", "official"]
        },
        {
            "variant_id": "scene-human-contest-winner-2027",
            "is_default": false,
            "status": "active",
            "provenance": "human",
            "provenance_detail": "human_contest",
            "artist_credit": {
                "display_name": "Alex Rivera",
                "portfolio_url": "https://example.com/portfolio"
            },
            "license": {
                "code": "CC-BY-NC-4.0",
                "usage_scope": "in_game_nonexclusive",
                "attribution_required": true
            },
            "moderation_state": "approved",
            "verification": {
                "provenance_confidence": "verified",
                "reviewed_by": "content-admin-1",
                "reviewed_at": "2027-03-04T18:22:00Z"
            },
            "eligible_for_preferences": true,
            "priority": 120,
            "tags": ["scene", "contest-winner", "human-featured"]
        }
    ]
}
```

## Base/default art and variant categories

Each canonical entity should have:

- one **base/default** image (stable fallback), and
- zero or more additional variants.

This is similar in spirit to alternate-art systems in collectible games, but in DSPACE terms the
canonical entity remains stable while presentation may evolve.

Proposed variant categories:

- Portrait refresh variants (quality upgrades)
- Seasonal/environment variants
- Costume/expedition-gear variants
- Event/timeline variants
- Human commissioned variants
- Community/fan-art-derived approved variants
- Restored/remastered legacy variants

## Deprecation and migration model

### Why deprecate some older art

Early-generation AI outputs may become inconsistent with current quality/style standards or with
future provenance goals. Newer tooling and human-created replacements may justify refreshed passes.

### Deprecation semantics

- Deprecation changes variant eligibility/default ranking, not canonical entity identity.
- Deprecated variants can remain in metadata as historical artifacts.
- Optional settings may allow legacy visibility for archival/player preference use.

### Migration direction

1. **NPC-first migration** (highest player-facing identity impact).
2. Extend to **items** once icon consistency rules are finalized.
3. Extend to **quests** once narrative scene moderation path is ready.

### Compatibility expectations

- Existing references continue resolving by canonical entity ID.
- If a stored preference points to an unavailable variant, resolver falls back safely to default.

## Player settings and personalization (future `/settings` direction)

Potential settings model:

- Provenance preference:
  - Prefer human-made when available
  - Prefer canonical/default only
  - Allow both human and AI
- Freshness preference:
  - Prefer newest eligible variant
  - Prefer stable default only
- Legacy preference:
  - Allow deprecated/legacy art
  - Hide deprecated/legacy art
- Variant behavior:
  - Deterministic selection
  - Randomize among eligible variants
- Scope:
  - Global default + per-corpus overrides (NPC/item/quest)

Example per-corpus configuration:

- NPC: prefer human
- Item: canonical-only
- Quest: mixed (human+AI), no randomization

### UX predictability constraints

- Avoid surprising swaps mid-session unless randomization is explicitly enabled.
- If randomization is enabled, define stickiness policy (session-sticky or entity-sticky).
- Expose brief explanation in settings when fallback occurs.

## Variant selection algorithm (proposed)

Given `(entity_type, entity_id, corpus, player_settings)`:

1. Load variants for canonical entity.
2. Keep variants matching requested corpus/entity type.
3. Filter to visibility + moderation-approved candidates.
4. Apply deprecated filter based on `allow_legacy` setting.
5. Apply provenance preference filter (`human`, `ai`, `mixed`, `default-only`).
6. Apply eligibility filter (`eligible_for_preferences=true` unless default fallback pass).
7. Sort by:
   1. `is_default` (if default-only mode)
   2. `pinned_rank` ascending (if set)
   3. `priority` descending
   4. `created_at` descending (if prefer-newest)
8. If no candidate remains, retry with progressively relaxed constraints:
   - ignore provenance preference
   - include deprecated only if allowed
   - finally choose canonical default (even if not preference-eligible)
9. If randomization enabled, sample from top eligible pool according to configured policy.
10. Return selected variant ID + decision trace (debug/audit only).

### Example selection decision flow

**Input**:

- Entity: `npc:engineer-mara`
- Variants: `v2_ai_refresh (active default)`, `human_commission_1 (active)`,
  `v1_legacy_ai (deprecated)`
- Settings:
  - NPC corpus: `prefer_human=true`
  - `allow_legacy=false`
  - `randomize=false`

**Resolution**:

1. Drop deprecated `v1_legacy_ai`.
2. Keep approved/visible: `v2_ai_refresh`, `human_commission_1`.
3. Apply human preference -> `human_commission_1`.
4. Deterministic mode -> select highest-ranked human variant.

**Fallback case** (if human variant later set to pending moderation):

- Human pool becomes empty; resolver safely falls back to `v2_ai_refresh` default.

## Human-made art as a first-class path

Future DSPACE should support and normalize multiple human-art pathways:

- Direct commissioned official variants
- Approved community submissions
- Contest/competition winners
- Curated featured human variant collections
- Coexistence with AI variants for the same canonical entity

Why this matters:

- Accommodates player provenance preferences.
- Improves artistic legitimacy and trust.
- Enables gradual replacement/augmentation of bootstrap AI art.
- Builds a healthier long-term creative ecosystem around DSPACE content.

## Financial incentives and contribution pathways

This section is product/operations guidance, not legal advice.

### Commission pathway (official)

- DSPACE commissions specific assets (NPC/item/quest) with explicit briefs.
- Required metadata: artist credit, contract/license reference, usage scope, provenance verification.
- Commissioned outputs can ship as official default or official alternate variants.

### Contest pathway (IRL/online)

- Time-boxed themed calls (example: NPC portrait refresh season).
- Submissions require standardized rights/provenance declarations.
- Winners may become featured/official variants; non-winners may still be approved as optional
  community variants depending on quality/moderation outcomes.

### Curated featured variants

- Editorially selected variants highlighted in UI/docs.
- Must preserve attribution and provenance visibility.
- Featured status should be metadata-driven and revocable.

### Future funding tie-ins (optional roadmap)

- Crowdfunding-backed commission pools.
- Sponsor-supported variant packs.
- Reward programs for approved contributors.

### Operational requirements for any incentivized path

- Clear attribution requirements.
- License clarity and commercial usage rights tracking.
- Moderation/approval gate before in-game visibility.
- Explicit contest terms: exclusive vs non-exclusive rights.
- Artist portfolio-right policy clarity.
- Provenance and decision auditability in metadata.

## Provenance, policy, and moderation considerations

- Provenance should be transparent enough for trust without UI overload.
- Artist credit should be displayable where practical (entity detail, tooltip, credits panel).
- Unknown/mixed provenance should be representable (`unknown`, `hybrid`) and optionally
  de-prioritized by settings.
- Community submissions must never appear in-game without explicit moderation approval.
- Human-preference toggles should operate on **verified** human-eligible assets only.
- Admin tools should support audit views for provenance evidence and approval history.

## Future implementation touchpoints (no code in this doc)

- Content metadata schema updates (likely JSON schema additions for variant/provenance fields).
- Asset storage conventions for corpus-scoped variant files.
- Render-time resolver utility for deterministic selection + fallback.
- `/settings` model and UI for global/per-corpus preferences.
- Migration/admin tooling:
  - bulk tagging of legacy assets,
  - supersession mapping,
  - provenance backfill workflows.
- Contributor intake/moderation tooling for submissions, commissions, and contests.
- Documentation/admin surfaces for provenance inspection and attribution exports.

## Rollout and staging plan

### Stage 0: Design and metadata conventions

- Finalize variant/provenance vocabulary and schema draft.
- Define corpus boundaries and fallback invariants.
- Inventory current assets and provenance confidence levels.

### Stage 1: NPC variant support

- Introduce metadata + resolver for NPC images only.
- Mark initial legacy/deprecated NPC variants where appropriate.
- Ensure canonical NPC identity remains stable in saves/routes.

### Stage 2: Settings integration for provenance preferences

- Add global + NPC override settings in `/settings`.
- Ship deterministic fallback behavior and explainability notes.

### Stage 3: Item and quest variant support

- Extend schema/resolver to item and quest corpora.
- Add per-corpus overrides and corpus-specific randomization guardrails.

### Stage 4: Contributor/commission/contest workflows

- Add intake, moderation, provenance verification, and featured promotion flows.
- Support official human commissions and approved community pathways.

### Stage 5: Legacy deprecation and refresh passes

- Perform planned refresh waves by corpus.
- Deprecate/supersede aging variants while retaining archival lineage metadata.

## Testing and acceptance criteria (for future implementation)

1. Canonical entity references remain stable when displayed variant changes.
2. Variant swaps never alter gameplay semantics (quests, inventory, process outcomes, routes).
3. Settings preference `prefer_human` deterministically selects approved human variant when
   eligible.
4. If no eligible human variant exists, resolver falls back to canonical default without errors.
5. Deprecated variants are hidden or shown according to settings.
6. Per-corpus overrides take precedence over global defaults for that corpus.
7. Provenance metadata is inspectable in tooling and includes moderation state.
8. Resolver does not leak candidates across corpora (NPC logic cannot select item/quest assets).
9. Randomization mode (if enabled) follows documented stickiness policy.
10. Supersession lineage (`supersedes`/`superseded_by`) is internally consistent.

## Failure modes and open questions

### Likely failure modes

- Variant sprawl causing curation and performance overhead.
- Inconsistent or incomplete metadata quality across older assets.
- Missing license/provenance fields for legacy imports.
- Community submissions with unclear or conflicting rights.
- Overly strict settings yielding empty candidate sets.
- Confusion when defaults change between releases.

### Open questions

- Should randomization be session-sticky, entity-sticky, or deterministic per seed?
- How should UI label `official` vs `community` without implying quality hierarchy?
- Should some corpora initially disallow randomization (for readability/consistency)?
- What minimum evidence is required to mark provenance as `verified`?
- When (if ever) should deprecated art be physically removed vs archived-only?
- Should `hybrid` provenance be user-toggleable independently from `human`/`ai`?

## Summary

This roadmap keeps DSPACE’s canonical gameplay identity stable while introducing a robust,
provenance-aware presentation layer for image variants across NPCs, items, and quests. It creates a
clear path for higher-quality refreshes, human-made art participation, player preference controls,
and long-term governance of asset history without coupling visual changes to game mechanics.
