---
title: 'Glossary'
slug: 'glossary'
---

## DSPACE

Short for Democratized Space (sometimes stylized as democratized.space).

## Built-in quest

A quest shipped with the game and stored in the source repository. Built-in quests are read-only
in the in-game editors.

## Built-in item

An item shipped with the game and stored in the source repository. Built-in items are read-only in
the in-game editors.

## Built-in process

A process shipped with the game and stored in the source repository. Built-in processes are
read-only in the in-game editors.

## Custom entity

A quest, item, or process created in-game by a player and stored in the player's browser
(typically in IndexedDB, with a non-persistent in-memory fallback if IndexedDB is unavailable).
Custom entities are editable, exportable, and can be submitted for inclusion in the official
game.

## Custom content bundle

A packaged set of related custom quests, items, and processes exported together for submission to
the official game.

## Custom content backup

The backup export/import workflow on [/contentbackup](/contentbackup) used to package custom
quests, items, and processes for transfer or recovery.

## Custom item

An item created in-game and stored in the player's browser. Custom items are editable, exportable,
and can be referenced by custom quests and custom processes.

## Custom process

A process created in-game and stored in the player's browser. Custom processes are editable,
exportable, and can reference both built-in and custom items.

## Custom quest

A quest created in-game and stored in the player's browser. Custom quests are editable,
exportable, and can reward items or trigger processes.

## Guild

A collection of players populating the solar system under the same banner. A guild has its own unique name and 2-4 character tag. Tags consist of any combination of the 26 letters of the English alphabet.

## Hyperstructure

A [hyperstructure](https://jacob.energy/hyperstructures.html) is a set of protocols that adhere to the criteria listed in the [jacob.energy](https://jacob.energy/hyperstructures.html) article.

## Inventory

The player's collection of items and currency balances. Inventory changes when quests grant items
or when processes consume or create items.

## Item

An object stored in the inventory. Items can be required or consumed by processes, created by
processes, and granted as quest rewards.

## NPC

Short for non-player character. NPCs deliver quest dialogue and anchor the narrative voice of
questlines.

## Process

An activity that transforms items into new ones. [Processes](/docs/processes) can require items,
consume items, and create items, making them the primary method for crafting objects, machines,
decor, and plants.

## Quest

A task that can be completed by the player. Quests use branching dialogue with an NPC and can grant
or require items and processes.

## Quest options

An actionable choice in a quest's dialogue flow. Options can jump to another step, finish a quest,
start a process, or grant items.

## In-game editor

The in-app UI for creating or updating custom quests, items, and processes. Editors store entries
locally until they are exported or submitted.

## Questline

A series of quests that are related to each other. Questlines are broken down into **quests**.
