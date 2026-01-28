---
title: 'Quest Schema Requirements'
slug: 'quest-schema'
---

# Quest Schema Requirements

Every quest JSON file must conform to the [quest schema](https://github.com/democratizedspace/dspace/blob/v3/frontend/src/pages/quests/jsonSchemas/quest.json) to be
loaded by DSPACE. Review the [Quest Development Guidelines](/docs/quest-guidelines) for design tips
and the [Quest Submission Guide](/docs/quest-submission) when you're ready to publish. This page
summarizes the required structure.

## Top-level properties

| Field            | Type   | Required | Description                                              |
| ---------------- | ------ | -------- | -------------------------------------------------------- |
| `id`             | string | ✔️       | Unique quest identifier, e.g. `astronomy/constellations` |
| `title`          | string | ✔️       | Display name for the quest                               |
| `description`    | string | ✔️       | Short summary shown before starting                      |
| `image`          | string | ✔️       | Path to quest image asset                                |
| `npc`            | string | ✔️       | NPC image or identifier shown in dialogue                |
| `start`          | string | ✔️       | ID of the first dialogue node                            |
| `dialogue`       | array  | ✔️       | Ordered list of dialogue nodes                           |
| `hardening`      | object | ✔️       | Hardening metadata used by tests and QA tooling          |
| `rewards`        | array  | ❌       | Items granted on completion                              |
| `requiresQuests` | array  | ❌       | Quest IDs that must be finished first                    |

## Dialogue nodes

Each entry in `dialogue` is an object with:

| Field     | Type   | Required | Description                                |
| --------- | ------ | -------- | ------------------------------------------ |
| `id`      | string | ✔️       | Node identifier used by `start` and `goto` |
| `text`    | string | ✔️       | Dialogue text displayed to the player      |
| `options` | array  | ❌       | Player choices available at this node      |

## Options

Options control quest flow and may grant or require items.

| Field            | Type    | Required | Description                                   |
| ---------------- | ------- | -------- | --------------------------------------------- |
| `type`           | string  | ✔️       | `goto`, `process`, `finish`, or `grantsItems` |
| `text`           | string  | ✔️       | Option label shown to the player              |
| `goto`           | string  | depends  | Target node when `type` is `goto`             |
| `process`        | string  | depends  | Process ID when `type` is `process`           |
| `requiresItems`  | array   | ❌       | Items that must be owned to choose the option |
| `grantsItems`    | array   | depends  | Items granted when `type` is `grantsItems`    |
| `requiresGitHub` | boolean | ❌       | Option requires GitHub authentication         |

Item arrays consist of objects with `id` (string) and `count` (number). In practice, tests also
expect every dialogue node to have at least one option, and every quest to provide a reachable
`finish` option.

For a full example, see the [Quest Template Example](/docs/quest-template). Validation against the
schema is performed by the quest validation test. Run it from the frontend workspace:
`cd frontend && npm test -- questValidation`.
