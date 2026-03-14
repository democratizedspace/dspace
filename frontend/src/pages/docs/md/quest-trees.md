---
title: 'Quest Trees'
slug: 'quest-trees'
---

# Quest Trees (v3)

DSPACE quests are organized into skill trees under
`frontend/src/pages/quests/json/<tree>/`.

The table below reflects the current v3 catalog.

| Tree          | Quests | Skills doc                                 |
| ------------- | -----: | ------------------------------------------ |
| 3D Printing   |     16 | [/docs/3dprinting](/docs/3dprinting)       |
| Aquaria       |     19 | [/docs/aquaria](/docs/aquaria)             |
| Astronomy     |     21 | [/docs/astronomy](/docs/astronomy)         |
| Chemistry     |     10 | [/docs/chemistry](/docs/chemistry)         |
| Completionist |      6 | [/docs/completionist](/docs/completionist) |
| Composting    |      4 | [/docs/composting](/docs/composting)       |
| DevOps        |     15 | [/docs/devops](/docs/devops)               |
| Electronics   |     22 | [/docs/electronics](/docs/electronics)     |
| Energy        |     21 | [/docs/energy](/docs/energy)               |
| First Aid     |     13 | [/docs/firstaid](/docs/firstaid)           |
| Geothermal    |     15 | [/docs/geothermal](/docs/geothermal)       |
| Hydroponics   |     23 | [/docs/hydroponics](/docs/hydroponics)     |
| Programming   |     18 | [/docs/programming](/docs/programming)     |
| Robotics      |     13 | [/docs/robotics](/docs/robotics)           |
| Rocketry      |     10 | [/docs/rocketry](/docs/rocketry)           |
| Sysadmin      |      3 | [/docs/sysadmin](/docs/sysadmin)           |
| UBI           |      4 | [/docs/ubi](/docs/ubi)                     |
| Welcome       |      5 | [/docs/welcome](/docs/welcome)             |
| Woodworking   |     10 | [/docs/woodworking](/docs/woodworking)     |

**Total quests:** 248

## How this stays up to date

- Quest pages are auto-discovered from the quest JSON directory structure.
- The Docs index merges curated skill links with generated tree links.
- If a quest tree exists without a matching docs page, the docs index reports it during build.

## Related docs

- [New quests list](/docs/new-quests)
- [Quest guidelines](/docs/quest-guidelines)
- [Quest submission guide](/docs/quest-submission)
