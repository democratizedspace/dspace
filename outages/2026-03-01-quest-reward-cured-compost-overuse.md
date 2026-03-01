# Quest reward audit: cured compost bucket overuse

## Summary
A global audit found that many quests across unrelated trees were granting **1 x cured compost bucket** on completion.

We replaced those rewards with more appropriate, tree-specific rewards and cycled reward pools to increase variety.

## Scope of impact
- **Quests affected:** 177
- **Quest trees affected:** 17
- **Primary issue:** reward-theme mismatch and repeated reward monotony

## Before
- 177 quests granted `1 x cured compost bucket` on completion.
- This included quests in non-composting domains (e.g., robotics, devops, astronomy, first aid).

## After
- All 177 affected quest completion rewards were reassigned to thematic reward pools by quest tree.
- Reward pools are rotated per tree to improve variety and avoid a single repeated reward.

## Per-tree impact (quests updated)
- 3dprinting: 12
- aquaria: 13
- astronomy: 15
- chemistry: 10
- completionist: 5
- composting: 2
- devops: 15
- electronics: 12
- energy: 10
- firstaid: 13
- geothermal: 13
- hydroponics: 20
- programming: 18
- robotics: 10
- rocketry: 2
- ubi: 2
- woodworking: 5

## Notes
This outage record documents a content-quality correction (balance/theming), not a runtime availability incident.
