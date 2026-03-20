# QA Checklists

DSPACE uses repeatable QA checklists to keep release candidates stable and to make future minor
releases easy to stage.

## Checklists

- [v3 release QA](./v3) - primary checklist for the v3 launch
- [v3 launch-assist runbook](./v3-launch-assist-runbook.md) - operator command order for remote harnesses + rollout
- [v3 quest speedrun artifact (cheat-enabled, 2026-03-13)](./speedrun_qa-cheats_20260313.csv) - full end-to-end quest QA record
- [v3.1 release QA](./v3.1.md) - placeholder for token.place integration plus a rerun of the v3 suite
- [Template](./template.md) - copy for new releases

## How to use this folder

- Copy the latest checklist for each release (`v3.0.1`, `v3.1`, etc.) and tailor the notes for the
  feature set.
- Keep a **Quick command index** near the top of each checklist so the automation entrypoints stay
  visible.
- Link back here from READMEs and developer docs so future releases can find the right checklist.
