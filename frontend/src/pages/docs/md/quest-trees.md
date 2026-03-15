---
title: 'Quest Trees'
slug: 'quest-trees'
---

# Quest Trees

DSPACE organizes official quests into themed trees. This page maps each tree to its matching
skills doc and provides planning guidance for players and contributors.

## v3 catalog snapshot

- **248 official quests**
- **19 active quest trees**
- Newer v3-era growth areas include chemistry, astronomy, and programming expansions

## Active quest tree catalog

| Tree          | Core focus                                | Skills doc                                 |
| ------------- | ----------------------------------------- | ------------------------------------------ |
| Welcome       | onboarding, inventory, progression basics | [/docs/welcome](/docs/welcome)             |
| 3D Printing   | fabrication setup + print workflow        | [/docs/3dprinting](/docs/3dprinting)       |
| Aquaria       | habitat setup and care loops              | [/docs/aquaria](/docs/aquaria)             |
| Astronomy     | observing and instrumentation basics      | [/docs/astronomy](/docs/astronomy)         |
| Chemistry     | lab habits and reaction literacy          | [/docs/chemistry](/docs/chemistry)         |
| Completionist | meta-progression milestones               | [/docs/completionist](/docs/completionist) |
| Composting    | organics loops and soil inputs            | [/docs/composting](/docs/composting)       |
| DevOps        | deployment and automation practices       | [/docs/devops](/docs/devops)               |
| Electronics   | circuits, measurement, and integration    | [/docs/electronics](/docs/electronics)     |
| Energy        | generation/storage decision loops         | [/docs/energy](/docs/energy)               |
| First Aid     | preparedness and response skills          | [/docs/firstaid](/docs/firstaid)           |
| Geothermal    | ground-loop and thermal systems           | [/docs/geothermal](/docs/geothermal)       |
| Hydroponics   | controlled agriculture lifecycle          | [/docs/hydroponics](/docs/hydroponics)     |
| Programming   | tooling and scripting foundations         | [/docs/programming](/docs/programming)     |
| Robotics      | sensing + motion control fundamentals     | [/docs/robotics](/docs/robotics)           |
| Rocketry      | launch prep and safety sequencing         | [/docs/rocketry](/docs/rocketry)           |
| Sysadmin      | operations, reliability, and recovery     | [/docs/sysadmin](/docs/sysadmin)           |
| UBI           | economic literacy and planning            | [/docs/ubi](/docs/ubi)                     |
| Woodworking   | tool safety and build planning            | [/docs/woodworking](/docs/woodworking)     |

## Suggested progression paths

### Hardware-first

Welcome → Energy → Electronics → 3D Printing → Robotics → Rocketry

### Bio systems-first

Welcome → Hydroponics → Composting → Aquaria → Chemistry → Geothermal

### Automation + operations-first

Welcome → Programming → DevOps → Sysadmin → contribution workflows

## Contributor contract (required)

When any tree's quest JSON changes, update the matching skills doc in the same PR.
Keep quest docs synchronized with gates, grants, process I/O, and QA notes.

For maintainers, `node scripts/generate-quest-chart.js` can generate tree-size visuals from the
current quest catalog.
