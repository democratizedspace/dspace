---
title: 'v3 Release State'
slug: 'v3-release-state'
---

# v3 Release State

This page is the source-of-truth snapshot for v3 release scope and current release-state limits.
Use it alongside the v3 release notes at [/docs/changelog/20260401](/docs/changelog/20260401) and
the full release QA checklist in
[docs/qa/v3.md](https://github.com/democratizedspace/dspace/blob/v3/docs/qa/v3.md).

## v3 in-scope systems

### Core gameplay and progression

- The quest + inventory + process loop is fully in scope for v3.
- Official content now includes **248 quests across 19 quest trees** (current v3 branch snapshot).
- Quest details render from canonical quest JSON, including branching dialogue, rewards, and
  requirements.
- Completionist Award III (`completionist/award-iii`) is in the v3 capstone lane and remains part
  of launch sign-off (not a v3.1 deferral); the canonical item is created by
  `assemble-completionist-award-iii`, and quest completion does not grant a second copy.

### Navigation and utility surfaces

The More menu includes in-scope routes for:

- `/processes`
- `/gamesaves`
- `/cloudsync`
- `/contentbackup`
- `/stats`
- `/achievements`
- `/leaderboard`
- `/titles`
- `/toolbox`
- `/settings`

### Custom content tooling (headline v3 feature)

- Players can create custom quests at `/quests/create`.
- Players can create custom items at `/inventory/create`.
- `/items/create` remains available as a legacy alias that resolves to the same custom item form.
- Players can create custom processes at `/processes/create`.
- Players can manage custom content from each matching `/manage` route.
- Players can export/import custom content bundles from `/contentbackup`.
- Players can submit bundles through `/bundles/submit`.

### Save safety and migration

- v3 uses IndexedDB as primary storage.
- Legacy upgrade flows support v1 cookie saves and v2 localStorage saves.
- Save portability is available through `/gamesaves` plus optional `/cloudsync` automation.

### NPC chat and AI

- v3 includes persona-style chat experiences (for example Sydney, Nova, Hydro).
- OpenAI-only chat is the supported provider path in v3.
- Chat surfaces include `/chat` and `/dchat`.

## Deferred or intentionally limited in v3

### Guild gameplay

- `/guilds` remains marked as coming soon in menu navigation.
- Leaderboard framing exists, but full guild mechanics are not live yet.

### Locations destination

- `/locations` remains marked as coming soon in menu navigation.

### token.place integration

- token.place integration exists behind flags but remains disabled for the v3 launch release.
- token.place activation is deferred to the v3.1 follow-up track and is not a v3 launch gate.
- Current status is tracked at [/docs/token-place](/docs/token-place).

## What changed from earlier versions

- dUSD, dWatt, and dCarbon are in-game progression currencies (not on-chain tokens).
- localStorage is no longer the primary save layer.
- Legacy artifacts are migration sources, not active state.

## v2-only mechanics removed / not applicable in v3

- v2 localStorage-first saving is replaced by IndexedDB-first persistence in v3.
- Cookie-based v1/v2 save behavior is migration-only and no longer an active save path.
- Legacy token/currency assumptions from pre-v3 docs are not applicable to v3 progression.

## Documentation quality gate for v3 changes

When changing gameplay docs, verify all of the following:

1. Route is reachable and not marked coming soon.
2. Behavior matches implemented behavior.
3. Partially-live systems clearly call out live vs deferred scope.
4. Linked docs avoid duplicate guidance and defer to canonical pages for details.
