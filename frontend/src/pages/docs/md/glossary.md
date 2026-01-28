---
title: 'Glossary'
slug: 'glossary'
---

## DSPACE

Short for Democratized Space (sometimes stylized as democratized.space).

## Entity

A game object that can be managed or referenced in gameplay. Core entities are quests, processes,
and items.

## Built-in entity

An entity shipped with the game and stored in the source repository. Built-in entities are
read-only in the in-game editors.

## Custom entity

An entity created in-game by a player and stored in the player's browser (typically in IndexedDB,
with a non-persistent in-memory fallback if IndexedDB is unavailable). Custom entities are
editable, exportable, and can be submitted for inclusion in the official game.

## Custom content bundle

A packaged set of related custom quests, items, and processes exported together for submission to
the official game.

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

## Process chain

A sequence of processes where the outputs of one process become inputs for the next, creating a
clear progression path.

## Quest

A task that can be completed by the player. Quests use branching dialogue with an NPC and can grant
or require items and processes.

## Quest node

One step in a quest's dialogue flow. Nodes contain NPC text plus one or more options that advance
or finish the quest.

## Quest option

An actionable choice on a quest node. Options can jump to another node, finish a quest, start a
process, or grant items.

## Questline

A series of quests that are related to each other. Questlines are broken down into **quests**.
