---
title: 'Quest Trees'
slug: 'quest-trees'
---

# Quest Trees

DSPACE quests are organized into themed trees. This page maps each active tree to its skills doc
so players and contributors can move between gameplay and reference material without guesswork.

## How to use this page

1. Start with **Welcome** if you're new.
2. Pick 1-2 applied trees (for example, Energy + Electronics).
3. Layer in systems trees (Programming, DevOps, Sysadmin) as your projects grow.
4. Use the linked skills docs for detailed checklists, process links, and QA guidance.

## Quick availability highlights

- **Chemistry** – available today in the active quest catalog.
- **Programming** – available today in the active quest catalog.

## Active quest tree catalog

| Tree          | Core focus                                  | Skills doc                                 |
| ------------- | ------------------------------------------- | ------------------------------------------ |
| Welcome       | onboarding, inventory, test workflow basics | [/docs/welcome](/docs/welcome)             |
| 3D Printing   | fabrication setup + print workflow          | [/docs/3dprinting](/docs/3dprinting)       |
| Aquaria       | habitat setup and care loops                | [/docs/aquaria](/docs/aquaria)             |
| Astronomy     | observing and instrumentation basics        | [/docs/astronomy](/docs/astronomy)         |
| Chemistry     | lab habits and reaction literacy            | [/docs/chemistry](/docs/chemistry)         |
| Composting    | organics loops and soil inputs              | [/docs/composting](/docs/composting)       |
| DevOps        | deployment and automation practices         | [/docs/devops](/docs/devops)               |
| Electronics   | circuits, measurement, and integration      | [/docs/electronics](/docs/electronics)     |
| Energy        | generation/storage decision loops           | [/docs/energy](/docs/energy)               |
| First Aid     | preparedness and response skills            | [/docs/firstaid](/docs/firstaid)           |
| Geothermal    | ground-loop and thermal systems             | [/docs/geothermal](/docs/geothermal)       |
| Hydroponics   | controlled agriculture lifecycle            | [/docs/hydroponics](/docs/hydroponics)     |
| Programming   | tooling and scripting foundations           | [/docs/programming](/docs/programming)     |
| Robotics      | sensing + motion control fundamentals       | [/docs/robotics](/docs/robotics)           |
| Rocketry      | launch prep and safety sequencing           | [/docs/rocketry](/docs/rocketry)           |
| Sysadmin      | operations, reliability, and recovery       | [/docs/sysadmin](/docs/sysadmin)           |
| UBI           | economic literacy and planning              | [/docs/ubi](/docs/ubi)                     |
| Woodworking   | tool safety and build planning              | [/docs/woodworking](/docs/woodworking)     |
| Completionist | meta-progression milestones                 | [/docs/completionist](/docs/completionist) |

## Suggested progression paths

### Practical hardware-first

Welcome → Energy → Electronics → 3D Printing → Robotics → Rocketry

### Life-support-first

Welcome → Hydroponics → Composting → Aquaria → Chemistry → Geothermal

### Ops + contribution-first

Welcome → Programming → DevOps → Sysadmin → custom content contribution

## Contributor validation note

When quests change in any tree, update the matching skills doc in the same PR. Keep quest JSON and
skills docs synchronized for gates, grants, process I/O, and QA walkthrough notes.

For maintainers, `node scripts/generate-quest-chart.js` generates a tree-size radar chart from the
current quest catalog.
