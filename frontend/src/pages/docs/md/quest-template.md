---
title: 'Quest Template Example'
slug: 'quest-template'
---

# Quest Template Example

This page provides a minimal quest JSON structure that you can use as a starting point for your own quests. Quests created with this format are compatible with the [token.place](https://token.place) project and can be shared across repos. Feel free to copy this snippet into your editor to speed up the process.

```json
{
    "id": "astronomy/constellations",
    "title": "Map the Constellations",
    "description": "Identify key star patterns to aid celestial navigation.",
    "image": "/assets/quests/solar.jpg",
    "npc": "/assets/npc/nova.jpg",
    "start": "start",
    "dialogue": [
        {
            "id": "start",
            "text": "Great progress so far! Next let's learn the constellations visible this season.",
            "options": [{ "type": "goto", "goto": "study", "text": "I'm excited to learn!" }]
        },
        {
            "id": "study",
            "text": "Using your telescope, locate Orion, Ursa Major, and Cassiopeia. Sketch their brightest stars and note their orientation each night.",
            "options": [
                {
                    "type": "process",
                    "process": "identify-constellations",
                    "text": "Charting patterns..."
                },
                {
                    "type": "goto",
                    "goto": "finish",
                    "text": "I can spot them easily now!",
                    "requiresItems": [{ "id": "134", "count": 1 }]
                }
            ]
        },
        {
            "id": "finish",
            "text": "Excellent! Recognizing these patterns will help you orient spacecraft sightings and plan future observations.",
            "options": [{ "type": "finish", "text": "Thanks, Nova!", "requiresGitHub": false }]
        }
    ],
    "rewards": [],
    "requiresQuests": ["astronomy/jupiter-moons"]
}
```

Use this template as a baseline and expand it with additional dialogue nodes, processes, item requirements, and rewards. For more in-depth guidance, see the [Quest Development Guidelines](/docs/quest-guidelines).
An automated Playwright example (`constellations-quest.spec.ts`) walks through creating this quest step by step if you prefer a hands-on reference.
