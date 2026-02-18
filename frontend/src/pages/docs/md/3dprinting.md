---
title: '3D Printing'
slug: '3dprinting'
---

3D Printing quests build practical progression through the 3dprinting skill tree. This page is a QA-oriented map of quest dependencies, process IO, and inventory gates.

## Quest tree

1. [Set up your first 3D printer](/quests/3dprinting/start)
2. [Level the Print Bed](/quests/3dprinting/bed-leveling)
3. [Print a Calibration Cube](/quests/3dprinting/calibration-cube)
4. [Swap Filament](/quests/3dprinting/filament-change)
5. [3D Print 10 Benchies](/quests/3dprinting/benchy_10)
6. [3D Print 25 Benchies](/quests/3dprinting/benchy_25)
7. [3D Print 100 Benchies](/quests/3dprinting/benchy_100)
8. [Print a Cable Clip](/quests/3dprinting/cable-clip)
9. [Fix a Clogged Nozzle](/quests/3dprinting/nozzle-clog)
10. [Clear a Clogged Nozzle](/quests/3dprinting/nozzle-cleaning)
11. [Witness a Blob of Death](/quests/3dprinting/blob-of-death)
12. [Print a Phone Stand](/quests/3dprinting/phone-stand)
13. [Print a Spool Holder](/quests/3dprinting/spool-holder)
14. [Tune Retraction Settings](/quests/3dprinting/retraction-test)
15. [Print a Temperature Tower](/quests/3dprinting/temperature-tower)
16. [Tighten the X-axis Belt](/quests/3dprinting/x-belt-tension)

## 1) Set up your first 3D printer (`3dprinter/start`)

- Quest link: [/quests/3dprinting/start](/quests/3dprinting/start)
- Unlock prerequisite:
    - `requiresQuests`: `welcome/howtodoquests`
- Dialogue `requiresItems` gates:
    - `grant` → "I've got the goods! What's next?" — entry-level FDM 3D printer ×1, green PLA filament ×1000
    - `benchy` → "I've printed the Benchy! What's next?" — Benchy ×1
- Grants:
    - `grant` → "Don't mind if I do!" — entry-level FDM 3D printer ×1, green PLA filament ×1000
    - Quest-level `grantsItems`: None
- Rewards:
    - dUSD ×100, Benchy Award ×1
- Processes used:
    - [3dprint-benchy](/processes/3dprint-benchy)
        - Requires: entry-level FDM 3D printer ×1
        - Consumes: green PLA filament ×15, dWatt ×150
        - Creates: Benchy ×1, dPrint ×15

## 2) Level the Print Bed (`3dprinting/bed-leveling`)

- Quest link: [/quests/3dprinting/bed-leveling](/quests/3dprinting/bed-leveling)
- Unlock prerequisite:
    - `requiresQuests`: `3dprinter/start`
- Dialogue `requiresItems` gates:
    - `prep` → "Walk me through each pass." — entry-level FDM 3D printer ×1, sheet of printer paper ×1, safety goggles ×1
    - `prep` → "Corners all tug the paper evenly." — entry-level FDM 3D printer (leveled bed) ×1
    - `first-layer` → "Skirt looks even and glossy." — entry-level FDM 3D printer (leveled bed) ×1
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: None
- Rewards:
    - cured compost bucket ×1
- Processes used:
    - [level-3d-printer-bed](/processes/level-3d-printer-bed)
        - Requires: entry-level FDM 3D printer ×1, sheet of printer paper ×1, safety goggles ×1
        - Consumes: none
        - Creates: entry-level FDM 3D printer (leveled bed) ×1

## 3) Print a Calibration Cube (`3dprinting/calibration-cube`)

- Quest link: [/quests/3dprinting/calibration-cube](/quests/3dprinting/calibration-cube)
- Unlock prerequisite:
    - `requiresQuests`: `3dprinting/bed-leveling`
- Dialogue `requiresItems` gates:
    - `print` → "Cube cooled and removed." — entry-level FDM 3D printer ×1, green PLA filament ×15, safety goggles ×1, print removal scraper ×1
    - `measure` → "Dimensions noted." — digital calipers ×1
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: None
- Rewards:
    - cured compost bucket ×1
- Processes used:
    - [measure-filament-diameter](/processes/measure-filament-diameter)
        - Requires: digital calipers ×1, white PLA filament ×1
        - Consumes: none
        - Creates: none
    - [print-calibration-cube](/processes/print-calibration-cube)
        - Requires: entry-level FDM 3D printer ×1
        - Consumes: green PLA filament ×15
        - Creates: none
    - [measure-calibration-cube](/processes/measure-calibration-cube)
        - Requires: digital calipers ×1, mission logbook ×1, feather quill ×1
        - Consumes: none
        - Creates: mission log entry ×1

## 4) Swap Filament (`3dprinting/filament-change`)

- Quest link: [/quests/3dprinting/filament-change](/quests/3dprinting/filament-change)
- Unlock prerequisite:
    - `requiresQuests`: `3dprinting/calibration-cube`
- Dialogue `requiresItems` gates:
    - `start` → "Leveled, unplugged accessories, and ready to heat." — entry-level FDM 3D printer (leveled bed) ×1, safety goggles ×1
    - `heat` → "Unload old filament and load green PLA." — entry-level FDM 3D printer (leveled bed) ×1, green PLA filament ×10, safety goggles ×1, wire cutters ×1
    - `heat` → "Green filament is flowing without bubbles." — entry-level FDM 3D printer (green PLA loaded) ×1
    - `flow-check` → "Purge line is steady and first-layer strip looks clean." — entry-level FDM 3D printer (green PLA loaded) ×1, sheet of printer paper ×1
    - `recover` → "Run a recovery swap and purge cycle." — entry-level FDM 3D printer (leveled bed) ×1, green PLA filament ×5, safety goggles ×1, wire cutters ×1
    - `recover` → "Recovery done, rechecking purge quality." — entry-level FDM 3D printer (green PLA loaded) ×1
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: None
- Rewards:
    - cured compost bucket ×1
- Processes used:
    - [swap-green-pla-filament](/processes/swap-green-pla-filament)
        - Requires: entry-level FDM 3D printer (leveled bed) ×1, safety goggles ×1, wire cutters ×1
        - Consumes: green PLA filament ×10
        - Creates: entry-level FDM 3D printer (green PLA loaded) ×1

## 5) 3D Print 10 Benchies (`3dprinting/benchy_10`)

- Quest link: [/quests/3dprinting/benchy_10](/quests/3dprinting/benchy_10)
- Unlock prerequisite:
    - `requiresQuests`: `3dprinting/filament-change`
- Dialogue `requiresItems` gates:
    - `progress` → "I have enough!" — Benchy ×10
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: None
- Rewards:
    - green PLA filament ×1000
- Processes used:
    - None

## 6) 3D Print 25 Benchies (`3dprinting/benchy_25`)

- Quest link: [/quests/3dprinting/benchy_25](/quests/3dprinting/benchy_25)
- Unlock prerequisite:
    - `requiresQuests`: `3dprinting/benchy_10`
- Dialogue `requiresItems` gates:
    - `progress` → "I have enough!" — Benchy ×25
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: None
- Rewards:
    - green PLA filament ×10000
- Processes used:
    - None

## 7) 3D Print 100 Benchies (`3dprinting/benchy_100`)

- Quest link: [/quests/3dprinting/benchy_100](/quests/3dprinting/benchy_100)
- Unlock prerequisite:
    - `requiresQuests`: `3dprinting/benchy_25`
- Dialogue `requiresItems` gates:
    - `progress` → "I have enough!" — Benchy ×100
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: None
- Rewards:
    - green PLA filament ×100000
- Processes used:
    - None

## 8) Print a Cable Clip (`3dprinting/cable-clip`)

- Quest link: [/quests/3dprinting/cable-clip](/quests/3dprinting/cable-clip)
- Unlock prerequisite:
    - `requiresQuests`: `3dprinting/filament-change`
- Dialogue `requiresItems` gates:
    - `prep` → "Purge to white PLA." — entry-level FDM 3D printer (leveled bed) ×1, safety goggles ×1, wire cutters ×1
    - `prep` → "Bed leveled and white PLA loaded." — entry-level FDM 3D printer (white PLA loaded) ×1, safety goggles ×1
    - `print` → "Clips cooled and edges deburred." — 3D printed cable clip set ×1
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: None
- Rewards:
    - cured compost bucket ×1
- Processes used:
    - [level-3d-printer-bed](/processes/level-3d-printer-bed)
        - Requires: entry-level FDM 3D printer ×1, sheet of printer paper ×1, safety goggles ×1
        - Consumes: none
        - Creates: entry-level FDM 3D printer (leveled bed) ×1
    - [swap-white-pla-filament](/processes/swap-white-pla-filament)
        - Requires: entry-level FDM 3D printer (leveled bed) ×1, safety goggles ×1, wire cutters ×1
        - Consumes: white PLA filament ×10
        - Creates: entry-level FDM 3D printer (white PLA loaded) ×1
    - [3dprint-cable-clips](/processes/3dprint-cable-clips)
        - Requires: entry-level FDM 3D printer (white PLA loaded) ×1, safety goggles ×1
        - Consumes: white PLA filament ×12, dWatt ×120
        - Creates: 3D printed cable clip set ×1

## 9) Fix a Clogged Nozzle (`3dprinting/nozzle-clog`)

- Quest link: [/quests/3dprinting/nozzle-clog](/quests/3dprinting/nozzle-clog)
- Unlock prerequisite:
    - `requiresQuests`: `3dprinting/filament-change`
- Dialogue `requiresItems` gates:
    - `start` → "Document the failure and trigger a clog state." — entry-level FDM 3D printer ×1, green PLA filament ×5, dWatt ×50
    - `start` → "Printer is powered down, ventilated, and cool." — entry-level FDM 3D printer (clogged nozzle) ×1
    - `cooldown` → "Clear the nozzle and reseat it." — safety goggles ×1, needle-nose pliers ×1, sheet of printer paper ×1, entry-level FDM 3D printer (clogged nozzle) ×1, green PLA filament ×5
    - `cooldown` → "Swap in a new nozzle." — safety goggles ×1, needle-nose pliers ×1, 0.4 mm brass nozzle ×1, entry-level FDM 3D printer (clogged nozzle) ×1
    - `cooldown` → "Hotend is rebuilt and ready for monitored purge." — entry-level FDM 3D printer (clean nozzle) ×1
    - `monitor` → "Logs show stable flow and no anomalies across all three checks." — entry-level FDM 3D printer (clean nozzle) ×1, sheet of printer paper ×2
    - `anomaly` → "Adjusted cooling/feed settings and logged the change; rerun snapshots." — entry-level FDM 3D printer (clean nozzle) ×1, sheet of printer paper ×2
    - `anomaly` → "Symptoms look like a hard clog; return to teardown and service." — entry-level FDM 3D printer (clogged nozzle) ×1
    - `anomaly` → "Corrective action applied; start a fresh monitoring window." — entry-level FDM 3D printer (clean nozzle) ×1
    - `verify` → "First layer holds and monitoring log is complete." — entry-level FDM 3D printer (clean nozzle) ×1, sheet of printer paper ×2
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: None
- Rewards:
    - cured compost bucket ×1
- Processes used:
    - [3dprint-nozzle-clog](/processes/3dprint-nozzle-clog)
        - Requires: none
        - Consumes: entry-level FDM 3D printer ×1, green PLA filament ×5, dWatt ×50
        - Creates: entry-level FDM 3D printer (clogged nozzle) ×1
    - [repair-clogged-nozzle](/processes/repair-clogged-nozzle)
        - Requires: safety goggles ×1, needle-nose pliers ×1, sheet of printer paper ×1
        - Consumes: entry-level FDM 3D printer (clogged nozzle) ×1, green PLA filament ×5
        - Creates: entry-level FDM 3D printer (clean nozzle) ×1
    - [replace-brass-nozzle](/processes/replace-brass-nozzle)
        - Requires: safety goggles ×1, needle-nose pliers ×1, 0.4 mm brass nozzle ×1
        - Consumes: entry-level FDM 3D printer (clogged nozzle) ×1, 0.4 mm brass nozzle ×1
        - Creates: entry-level FDM 3D printer (clean nozzle) ×1

## 10) Clear a Clogged Nozzle (`3dprinting/nozzle-cleaning`)

- Quest link: [/quests/3dprinting/nozzle-cleaning](/quests/3dprinting/nozzle-cleaning)
- Unlock prerequisite:
    - `requiresQuests`: `3dprinting/nozzle-clog`
- Dialogue `requiresItems` gates:
    - `start` → "I already have a clogged hotend." — entry-level FDM 3D printer (clogged nozzle) ×1
    - `precheck` → "Baseline residue check documented." — entry-level FDM 3D printer (clogged nozzle) ×1, sheet of printer paper ×1
    - `clean` → "Install a fresh 0.4 mm nozzle." — safety goggles ×1, needle-nose pliers ×1, 0.4 mm brass nozzle ×1, entry-level FDM 3D printer (clogged nozzle) ×1
    - `clean` → "Nozzle is rebuilt; run post-clean verification." — entry-level FDM 3D printer (clean nozzle) ×1
    - `postcheck` → "Before/after check passed and flow is stable." — entry-level FDM 3D printer (clean nozzle) ×1, sheet of printer paper ×2
    - `contamination` → "Area cleaned; retrying the cleaning cycle." — entry-level FDM 3D printer (clogged nozzle) ×1
    - `contamination` → "Residue cleared on a clean nozzle; rerun post-check." — entry-level FDM 3D printer (clean nozzle) ×1
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: None
- Rewards:
    - cured compost bucket ×1
- Processes used:
    - [3dprint-nozzle-clog](/processes/3dprint-nozzle-clog)
        - Requires: none
        - Consumes: entry-level FDM 3D printer ×1, green PLA filament ×5, dWatt ×50
        - Creates: entry-level FDM 3D printer (clogged nozzle) ×1
    - [repair-clogged-nozzle](/processes/repair-clogged-nozzle)
        - Requires: safety goggles ×1, needle-nose pliers ×1, sheet of printer paper ×1
        - Consumes: entry-level FDM 3D printer (clogged nozzle) ×1, green PLA filament ×5
        - Creates: entry-level FDM 3D printer (clean nozzle) ×1
    - [replace-brass-nozzle](/processes/replace-brass-nozzle)
        - Requires: safety goggles ×1, needle-nose pliers ×1, 0.4 mm brass nozzle ×1
        - Consumes: entry-level FDM 3D printer (clogged nozzle) ×1, 0.4 mm brass nozzle ×1
        - Creates: entry-level FDM 3D printer (clean nozzle) ×1

## 11) Witness a Blob of Death (`3dprinting/blob-of-death`)

- Quest link: [/quests/3dprinting/blob-of-death](/quests/3dprinting/blob-of-death)
- Unlock prerequisite:
    - `requiresQuests`: `3dprinting/nozzle-cleaning`
- Dialogue `requiresItems` gates:
    - `start` → "Kill power, let the blob cool, and list the damage." — entry-level FDM 3D printer (blob of death) ×1
    - `cooldown` → "Printer cleaned and reassembled." — entry-level FDM 3D printer ×1
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: None
- Rewards:
    - cured compost bucket ×1
- Processes used:
    - [3dprint-blob-of-death](/processes/3dprint-blob-of-death)
        - Requires: none
        - Consumes: entry-level FDM 3D printer ×1, green PLA filament ×10, dWatt ×100
        - Creates: entry-level FDM 3D printer (blob of death) ×1
    - [repair-blob-of-death](/processes/repair-blob-of-death)
        - Requires: safety goggles ×1, needle-nose pliers ×1
        - Consumes: entry-level FDM 3D printer (blob of death) ×1, 0.4 mm brass nozzle ×1
        - Creates: entry-level FDM 3D printer ×1

## 12) Print a Phone Stand (`3dprinting/phone-stand`)

- Quest link: [/quests/3dprinting/phone-stand](/quests/3dprinting/phone-stand)
- Unlock prerequisite:
    - `requiresQuests`: `3dprinting/filament-change`
- Dialogue `requiresItems` gates:
    - `prep` → "Swap to white PLA and purge." — entry-level FDM 3D printer (leveled bed) ×1, safety goggles ×1, wire cutters ×1
    - `prep` → "Ready to slice and print." — entry-level FDM 3D printer (white PLA loaded) ×1
    - `print` → "The stand is finished and cooled!" — 3D Printed Phone Stand ×1
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: None
- Rewards:
    - cured compost bucket ×1
- Processes used:
    - [level-3d-printer-bed](/processes/level-3d-printer-bed)
        - Requires: entry-level FDM 3D printer ×1, sheet of printer paper ×1, safety goggles ×1
        - Consumes: none
        - Creates: entry-level FDM 3D printer (leveled bed) ×1
    - [swap-white-pla-filament](/processes/swap-white-pla-filament)
        - Requires: entry-level FDM 3D printer (leveled bed) ×1, safety goggles ×1, wire cutters ×1
        - Consumes: white PLA filament ×10
        - Creates: entry-level FDM 3D printer (white PLA loaded) ×1
    - [print-phone-stand](/processes/print-phone-stand)
        - Requires: entry-level FDM 3D printer (white PLA loaded) ×1
        - Consumes: white PLA filament ×20
        - Creates: 3D Printed Phone Stand ×1

## 13) Print a Spool Holder (`3dprinting/spool-holder`)

- Quest link: [/quests/3dprinting/spool-holder](/quests/3dprinting/spool-holder)
- Unlock prerequisite:
    - `requiresQuests`: `3dprinting/phone-stand`
- Dialogue `requiresItems` gates:
    - `prep` → "Tension the belts so layers stack straight." — entry-level FDM 3D printer (leveled bed) ×1
    - `prep` → "Load white PLA and purge 10 grams of filament." — entry-level FDM 3D printer (leveled bed) ×1, safety goggles ×1, wire cutters ×1
    - `prep` → "Ready to print the spool holder." — entry-level FDM 3D printer (white PLA loaded) ×1, safety goggles ×1
    - `print` → "Holder cooled and fits the spool axle." — 3D printed filament spool holder ×1
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: None
- Rewards:
    - cured compost bucket ×1
- Processes used:
    - [level-3d-printer-bed](/processes/level-3d-printer-bed)
        - Requires: entry-level FDM 3D printer ×1, sheet of printer paper ×1, safety goggles ×1
        - Consumes: none
        - Creates: entry-level FDM 3D printer (leveled bed) ×1
    - [tighten-x-belt](/processes/tighten-x-belt)
        - Requires: entry-level FDM 3D printer (leveled bed) ×1, precision screwdriver set ×1, safety goggles ×1
        - Consumes: none
        - Creates: entry-level FDM 3D printer (belt tensioned) ×1
    - [swap-white-pla-filament](/processes/swap-white-pla-filament)
        - Requires: entry-level FDM 3D printer (leveled bed) ×1, safety goggles ×1, wire cutters ×1
        - Consumes: white PLA filament ×10
        - Creates: entry-level FDM 3D printer (white PLA loaded) ×1
    - [3dprint-spool-holder](/processes/3dprint-spool-holder)
        - Requires: entry-level FDM 3D printer (white PLA loaded) ×1, safety goggles ×1
        - Consumes: white PLA filament ×120, dWatt ×520
        - Creates: 3D printed filament spool holder ×1

## 14) Tune Retraction Settings (`3dprinting/retraction-test`)

- Quest link: [/quests/3dprinting/retraction-test](/quests/3dprinting/retraction-test)
- Unlock prerequisite:
    - `requiresQuests`: `3dprinting/spool-holder`
- Dialogue `requiresItems` gates:
    - `start` → "Green PLA is loaded and ready." — entry-level FDM 3D printer (green PLA loaded) ×1
    - `setup` → "Print the stepped Benchy." — entry-level FDM 3D printer (green PLA loaded) ×1, safety goggles ×1, digital calipers ×1
    - `setup` → "Benchy finished and cooled." — stringing-tuned Benchy ×1
    - `inspect` → "Stringing is gone and notes are saved." — stringing-tuned Benchy ×1
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: None
- Rewards:
    - cured compost bucket ×1
- Processes used:
    - [tune-retraction-benchy](/processes/tune-retraction-benchy)
        - Requires: entry-level FDM 3D printer (green PLA loaded) ×1, safety goggles ×1, digital calipers ×1
        - Consumes: green PLA filament ×20, dWatt ×200
        - Creates: stringing-tuned Benchy ×1, dPrint ×20

## 15) Print a Temperature Tower (`3dprinting/temperature-tower`)

- Quest link: [/quests/3dprinting/temperature-tower](/quests/3dprinting/temperature-tower)
- Unlock prerequisite:
    - `requiresQuests`: `3dprinting/retraction-test`
- Dialogue `requiresItems` gates:
    - `start` → "Benchy notes are ready; let's slice it." — entry-level FDM 3D printer ×1, stringing-tuned Benchy ×1
    - `slice` → "Print the temperature tower." — entry-level FDM 3D printer ×1, safety goggles ×1, white PLA filament ×30
    - `slice` → "Tower cooled and labeled." — temperature tower sample ×1
    - `review` → "Picked the best-looking band." — temperature tower sample ×1, digital calipers ×1
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: None
- Rewards:
    - cured compost bucket ×1
- Processes used:
    - [print-temperature-tower](/processes/print-temperature-tower)
        - Requires: entry-level FDM 3D printer ×1, safety goggles ×1
        - Consumes: white PLA filament ×30, dWatt ×240
        - Creates: temperature tower sample ×1, dPrint ×30

## 16) Tighten the X-axis Belt (`3dprinting/x-belt-tension`)

- Quest link: [/quests/3dprinting/x-belt-tension](/quests/3dprinting/x-belt-tension)
- Unlock prerequisite:
    - `requiresQuests`: `3dprinting/cable-clip`
- Dialogue `requiresItems` gates:
    - `baseline` → "Baseline logged; start adjustment." — digital calipers ×1, sheet of printer paper ×1, entry-level FDM 3D printer (leveled bed) ×1
    - `baseline` → "Baseline is inconsistent between repeated moves." — digital calipers ×1, sheet of printer paper ×1, entry-level FDM 3D printer (leveled bed) ×1
    - `adjust` → "Apply controlled tension adjustment." — entry-level FDM 3D printer (leveled bed) ×1, precision screwdriver set ×1, safety goggles ×1
    - `adjust` → "Adjustment complete; run tolerance retest." — entry-level FDM 3D printer (belt tensioned) ×1
    - `retest` → "Tolerance holds and motion is smooth." — entry-level FDM 3D printer (belt tensioned) ×1, digital calipers ×1, sheet of printer paper ×1
    - `drift` → "Apply a corrective micro-adjustment." — entry-level FDM 3D printer (leveled bed) ×1, precision screwdriver set ×1, safety goggles ×1
    - `drift` → "Correction made; retesting tolerance." — entry-level FDM 3D printer (belt tensioned) ×1
- Grants:
    - Dialogue options/steps grantsItems: None
    - Quest-level `grantsItems`: None
- Rewards:
    - cured compost bucket ×1
- Processes used:
    - [tighten-x-belt](/processes/tighten-x-belt)
        - Requires: entry-level FDM 3D printer (leveled bed) ×1, precision screwdriver set ×1, safety goggles ×1
        - Consumes: none
        - Creates: entry-level FDM 3D printer (belt tensioned) ×1

## QA flow notes

- Cross-quest dependencies: follow quest unlocks in order; each quest above lists exact `requiresQuests` and inventory gates that must be present before completion paths appear.
- Progression integrity checks: verify each process-backed step can be completed either by running the process or by satisfying the documented continuation gate items.
- Known pitfalls: repeated processes may generate stackable logs or outputs; validate minimum item counts on continuation options before skipping process steps.
