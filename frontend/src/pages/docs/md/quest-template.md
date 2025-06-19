---
title: 'Quest Template Example'
slug: 'quest-template'
---

# Quest Template Example

This page provides a minimal quest JSON structure that you can use as a starting point for your own quests. Quests created with this format are compatible with the [token.place](https://github.com/futuroptimist/token.place) project and can be shared across repos. Feel free to copy this snippet into your editor or use the [f2clipboard](https://github.com/futuroptimist/f2clipboard) tool to speed up the process.

```json
{
    "id": "example/basic-quest",
    "title": "My First Quest",
    "description": "A short example quest demonstrating the JSON format.",
    "image": "/assets/quests/example.jpg",
    "npc": "/assets/npc/example.jpg",
    "start": "start",
    "dialogue": [
        {
            "id": "start",
            "text": "Welcome to your first quest!",
            "options": [
                {
                    "type": "goto",
                    "goto": "finish",
                    "text": "Thanks!"
                }
            ]
        },
        {
            "id": "finish",
            "text": "Quest complete!",
            "options": [{ "type": "finish", "text": "End quest" }]
        }
    ],
    "rewards": [],
    "requiresQuests": []
}
```

Use this template as a baseline and expand it with additional dialogue nodes, processes, item requirements, and rewards. For more in-depth guidance, see the [Quest Development Guidelines](/docs/quest-guidelines).
