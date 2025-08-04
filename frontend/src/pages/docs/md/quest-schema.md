---
title: 'Quest Schema Requirements'
slug: 'quest-schema'
---

# Quest Schema Requirements

Every quest JSON file must conform to the [quest schema](../quests/jsonSchemas/quest.json) to be loaded by DSPACE. This page summarizes the required structure.

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
| `type`           | string  | ✔️       | `goto`, `process`, or `finish`                |
| `text`           | string  | ✔️       | Option label shown to the player              |
| `goto`           | string  | depends  | Target node when `type` is `goto`             |
| `process`        | string  | depends  | Process ID when `type` is `process`           |
| `requiresItems`  | array   | ❌       | Items that must be owned to choose the option |
| `grantsItems`    | array   | ❌       | Items granted when selected                   |
| `requiresGitHub` | boolean | ❌       | Option requires GitHub authentication         |

Item arrays consist of objects with `id` (string) and `count` (number).

For a full example, see the [Quest Template Example](/docs/quest-template). Validation against the schema is performed by test suites such as `npm test -- questValidation`.
