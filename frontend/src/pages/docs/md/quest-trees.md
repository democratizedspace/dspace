---
title: 'Quest Trees'
slug: 'quest-trees'
---

# Quest Trees

DSPACE v3 includes **248 official quests** grouped into themed learning trees. Each tree has a
matching Skills doc so you can review prerequisites, process gates, and practical walkthroughs
before you start.

## Current tree coverage (v3)

| Tree          | Quests | Skills doc                                   |
| ------------- | ------ | -------------------------------------------- |
| Hydroponics   | 23     | [/docs/hydroponics](/docs/hydroponics)       |
| Electronics   | 22     | [/docs/electronics](/docs/electronics)       |
| Astronomy     | 21     | [/docs/astronomy](/docs/astronomy)           |
| Energy        | 21     | [/docs/energy-systems](/docs/energy-systems) |
| Aquaria       | 19     | [/docs/aquaria](/docs/aquaria)               |
| Programming   | 18     | [/docs/programming](/docs/programming)       |
| 3D Printing   | 16     | [/docs/3dprinting](/docs/3dprinting)         |
| DevOps        | 15     | [/docs/devops](/docs/devops)                 |
| Geothermal    | 15     | [/docs/geothermal](/docs/geothermal)         |
| First Aid     | 13     | [/docs/first-aid](/docs/first-aid)           |
| Robotics      | 13     | [/docs/robotics](/docs/robotics)             |
| Chemistry     | 10     | [/docs/chemistry](/docs/chemistry)           |
| Rocketry      | 10     | [/docs/rockets](/docs/rockets)               |
| Woodworking   | 10     | [/docs/woodworking](/docs/woodworking)       |
| Completionist | 6      | [/docs/completionist](/docs/completionist)   |
| Welcome       | 5      | [/docs/welcome](/docs/welcome)               |
| Composting    | 4      | [/docs/composting](/docs/composting)         |
| UBI           | 4      | [/docs/ubi](/docs/ubi)                       |
| Sysadmin      | 3      | [/docs/sysadmin](/docs/sysadmin)             |

## What changed in v3

- Chemistry and Programming moved from draft stubs into the main progression path.
- Rocketry now includes a split guided sequence: build + guided hop.
- The quest graph tooling can surface missing dependencies, cycles, and unreachable quests.
- `/quests/[id]` now renders the canonical quest JSON details (dialogue branches, rewards,
  requirements) instead of placeholder copy.

## Keep this page current

When quest totals change, refresh the source-of-truth count with:

```bash
npm run new-quests:update
```

Then update this page and the matching Skills docs in the same PR so docs and progression stay in
sync.
