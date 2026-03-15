---
title: 'v3 Release State'
slug: 'v3-release-state'
---

# v3 Release State

This page is the concise, player-facing v3 ship-state snapshot. It should stay aligned with:

- [April 2026 release notes](/changelog#20260401)
- [v3 QA checklist](https://github.com/democratizedspace/dspace/blob/v3/docs/qa/v3.md)
- [Routes](/docs/routes)

## Fully live in v3

### Core loops and progression

- Quest, process, and inventory loops are fully playable.
- Expanded quest trees (including chemistry and programming) are part of the active catalog.
- Achievements and titles are live and connected to progression state.

### Utility destinations

The following routes are live from nav/More utilities:

- `/gamesaves`
- `/cloudsync`
- `/contentbackup`
- `/stats`
- `/leaderboard`
- `/titles`
- `/toolbox`
- `/settings`

### Custom content tooling

- In-game creation/edit flows exist for custom quests, items, and processes.
- Custom content can be exported/imported through `/contentbackup`.
- Quest contribution docs and schema validation workflows are published.

### Save architecture

- IndexedDB is the primary v3 save backend.
- Legacy import paths exist for v1 cookies and v2 localStorage saves.
- Cloud sync and local import/export provide recovery redundancy.

### AI chat

- v3 ships OpenAI-backed chat flows and NPC persona chat support.

## Limited or deferred in v3

### Guild gameplay

- Guild systems remain non-playable in v3 (menu entry still coming soon).
- Social/community framing is represented through docs and `/leaderboard`.

### Locations destination

- `/locations` is still a coming-soon nav entry.

### token.place

- Integration scaffolding exists, but the player-facing rollout is deferred beyond v3 launch.

## v3 documentation correctness checklist

Use this checklist when editing in-game docs:

1. Route status matches current menu configuration (`live` vs `coming soon`).
2. Claims about systems map to tested behavior in the QA checklist.
3. Partial systems clearly separate available features from deferred roadmap items.
4. Cross-link to canonical references (`/docs/routes`, `/docs/quest-trees`,
   `/docs/content-development`) so players can self-serve details.
