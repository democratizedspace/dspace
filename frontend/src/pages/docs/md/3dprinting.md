---
title: '3dprinting'
slug: '3dprinting'
---

3dprinting quests form a skill tree with item gates, process execution steps, and reward handoffs. This page is a QA-oriented bird's-eye map of the full tree so progression checks are explicit.

## Quest tree

1. [Set up your first 3D printer](/quests/3dprinting/start) (`3dprinter/start`)
2. [Level the Print Bed](/quests/3dprinting/bed-leveling) (`3dprinting/bed-leveling`)
3. [Print a Calibration Cube](/quests/3dprinting/calibration-cube) (`3dprinting/calibration-cube`)
4. [Swap Filament](/quests/3dprinting/filament-change) (`3dprinting/filament-change`)
5. [3D Print 10 Benchies](/quests/3dprinting/benchy_10) (`3dprinting/benchy_10`)
6. [3D Print 25 Benchies](/quests/3dprinting/benchy_25) (`3dprinting/benchy_25`)
7. [3D Print 100 Benchies](/quests/3dprinting/benchy_100) (`3dprinting/benchy_100`)
8. [Print a Cable Clip](/quests/3dprinting/cable-clip) (`3dprinting/cable-clip`)
9. [Fix a Clogged Nozzle](/quests/3dprinting/nozzle-clog) (`3dprinting/nozzle-clog`)
10. [Clear a Clogged Nozzle](/quests/3dprinting/nozzle-cleaning) (`3dprinting/nozzle-cleaning`)
11. [Witness a Blob of Death](/quests/3dprinting/blob-of-death) (`3dprinting/blob-of-death`)
12. [Print a Phone Stand](/quests/3dprinting/phone-stand) (`3dprinting/phone-stand`)
13. [Print a Spool Holder](/quests/3dprinting/spool-holder) (`3dprinting/spool-holder`)
14. [Tune Retraction Settings](/quests/3dprinting/retraction-test) (`3dprinting/retraction-test`)
15. [Print a Temperature Tower](/quests/3dprinting/temperature-tower) (`3dprinting/temperature-tower`)
16. [Tighten the X-axis Belt](/quests/3dprinting/x-belt-tension) (`3dprinting/x-belt-tension`)

---

## 1) Set up your first 3D printer (`3dprinter/start`)

- Quest link: [/quests/3dprinting/start](/quests/3dprinting/start)
- Unlock prerequisite:
  - `welcome/howtodoquests`
- Dialogue `requiresItems` gates:
  - `grant` → "I've got the goods! What's next?"
    - 8aa6dc27-dc42-4622-ac88-cbd57f48625f ×1
    - d3590107-25ff-4de5-af3a-46e2497bfc52 ×1000
  - `benchy` → "I've printed the Benchy! What's next?"
    - 7892ffc6-c651-445f-946b-7edc998cf389 ×1
- Grants:
  - Option/step `grantsItems`:
    - `grant` → "Don't mind if I do!"
      - 8aa6dc27-dc42-4622-ac88-cbd57f48625f ×1
      - d3590107-25ff-4de5-af3a-46e2497bfc52 ×1000
  - Quest-level `grantsItems`:
    - None
- Rewards:
  - 5247a603-294a-4a34-a884-1ae20969b2a1 ×100
  - fe46e236-5d03-4c95-9b38-68b045a0df03 ×1
- Processes used:
  - [3dprint-benchy](/processes/3dprint-benchy)
    - Requires:
      - 8aa6dc27-dc42-4622-ac88-cbd57f48625f ×1
    - Consumes:
      - d3590107-25ff-4de5-af3a-46e2497bfc52 ×15
      - 061fd221-404a-4bd1-9432-3e25b0f17a2c ×150
    - Creates:
      - 7892ffc6-c651-445f-946b-7edc998cf389 ×1
      - 071ba424-3940-4c80-a782-5d7ea4d829ff ×15

---

## 2) Level the Print Bed (`3dprinting/bed-leveling`)

- Quest link: [/quests/3dprinting/bed-leveling](/quests/3dprinting/bed-leveling)
- Unlock prerequisite:
  - `3dprinter/start`
- Dialogue `requiresItems` gates:
  - `prep` → "Walk me through each pass."
    - 8aa6dc27-dc42-4622-ac88-cbd57f48625f ×1
    - 60409c3f-56cf-4b9e-9e60-ca480d4896d0 ×1
    - c9b51052-4594-42d7-a723-82b815ab8cc2 ×1
  - `prep` → "Corners all tug the paper evenly."
    - a42e441a-5569-490c-86e4-ce711117cd22 ×1
  - `first-layer` → "Skirt looks even and glossy."
    - a42e441a-5569-490c-86e4-ce711117cd22 ×1
- Grants:
  - Option/step `grantsItems`: None
  - Quest-level `grantsItems`:
    - None
- Rewards:
  - b281360b-2ecc-4fea-a248-36a61c5f7399 ×1
- Processes used:
  - [level-3d-printer-bed](/processes/level-3d-printer-bed)
    - Requires:
      - 8aa6dc27-dc42-4622-ac88-cbd57f48625f ×1
      - 60409c3f-56cf-4b9e-9e60-ca480d4896d0 ×1
      - c9b51052-4594-42d7-a723-82b815ab8cc2 ×1
    - Consumes:
      - None
    - Creates:
      - a42e441a-5569-490c-86e4-ce711117cd22 ×1

---

## 3) Print a Calibration Cube (`3dprinting/calibration-cube`)

- Quest link: [/quests/3dprinting/calibration-cube](/quests/3dprinting/calibration-cube)
- Unlock prerequisite:
  - `3dprinting/bed-leveling`
- Dialogue `requiresItems` gates:
  - `print` → "Cube cooled and removed."
    - 8aa6dc27-dc42-4622-ac88-cbd57f48625f ×1
    - d3590107-25ff-4de5-af3a-46e2497bfc52 ×15
    - c9b51052-4594-42d7-a723-82b815ab8cc2 ×1
    - 9b985439-3c19-4fa7-b864-34a3c5c33ac4 ×1
  - `measure` → "Dimensions noted."
    - e37c86b0-caaf-485d-b5c1-c15f7029973c ×1
- Grants:
  - Option/step `grantsItems`: None
  - Quest-level `grantsItems`:
    - None
- Rewards:
  - b281360b-2ecc-4fea-a248-36a61c5f7399 ×1
- Processes used:
  - [measure-calibration-cube](/processes/measure-calibration-cube)
    - Requires:
      - e37c86b0-caaf-485d-b5c1-c15f7029973c ×1
      - 70bb8d86-2c4e-4330-9705-371891934686 ×1
      - aa82b02f-2617-4474-a91b-29647e4a9780 ×1
    - Consumes:
      - None
    - Creates:
      - 280ed361-ac70-4ab9-bcd9-aee481790faf ×1
  - [measure-filament-diameter](/processes/measure-filament-diameter)
    - Requires:
      - e37c86b0-caaf-485d-b5c1-c15f7029973c ×1
      - 58580f6f-f3be-4be0-80b9-f6f8bf0b05a6 ×1
    - Consumes:
      - None
    - Creates:
      - None
  - [print-calibration-cube](/processes/print-calibration-cube)
    - Requires:
      - 8aa6dc27-dc42-4622-ac88-cbd57f48625f ×1
    - Consumes:
      - d3590107-25ff-4de5-af3a-46e2497bfc52 ×15
    - Creates:
      - None

---

## 4) Swap Filament (`3dprinting/filament-change`)

- Quest link: [/quests/3dprinting/filament-change](/quests/3dprinting/filament-change)
- Unlock prerequisite:
  - `3dprinting/calibration-cube`
- Dialogue `requiresItems` gates:
  - `start` → "Leveled and ready to heat."
    - a42e441a-5569-490c-86e4-ce711117cd22 ×1
  - `heat` → "Unload and load green PLA."
    - a42e441a-5569-490c-86e4-ce711117cd22 ×1
    - d3590107-25ff-4de5-af3a-46e2497bfc52 ×10
    - c9b51052-4594-42d7-a723-82b815ab8cc2 ×1
    - ce92a1a9-c817-40f0-92b1-24aff053903d ×1
  - `heat` → "Green filament is flowing without bubbles."
    - 97ec3b0b-1be0-4260-bbaf-62ccb935807e ×1
  - `purge` → "Swap locked in and purge line is solid."
    - 97ec3b0b-1be0-4260-bbaf-62ccb935807e ×1
- Grants:
  - Option/step `grantsItems`: None
  - Quest-level `grantsItems`:
    - None
- Rewards:
  - b281360b-2ecc-4fea-a248-36a61c5f7399 ×1
- Processes used:
  - [swap-green-pla-filament](/processes/swap-green-pla-filament)
    - Requires:
      - a42e441a-5569-490c-86e4-ce711117cd22 ×1
      - c9b51052-4594-42d7-a723-82b815ab8cc2 ×1
      - ce92a1a9-c817-40f0-92b1-24aff053903d ×1
    - Consumes:
      - d3590107-25ff-4de5-af3a-46e2497bfc52 ×10
    - Creates:
      - 97ec3b0b-1be0-4260-bbaf-62ccb935807e ×1

---

## 5) 3D Print 10 Benchies (`3dprinting/benchy_10`)

- Quest link: [/quests/3dprinting/benchy_10](/quests/3dprinting/benchy_10)
- Unlock prerequisite:
  - `3dprinting/filament-change`
- Dialogue `requiresItems` gates:
  - `progress` → "I have enough!"
    - 7892ffc6-c651-445f-946b-7edc998cf389 ×10
- Grants:
  - Option/step `grantsItems`: None
  - Quest-level `grantsItems`:
    - None
- Rewards:
  - d3590107-25ff-4de5-af3a-46e2497bfc52 ×1000
- Processes used:
  - None

---

## 6) 3D Print 25 Benchies (`3dprinting/benchy_25`)

- Quest link: [/quests/3dprinting/benchy_25](/quests/3dprinting/benchy_25)
- Unlock prerequisite:
  - `3dprinting/benchy_10`
- Dialogue `requiresItems` gates:
  - `progress` → "I have enough!"
    - 7892ffc6-c651-445f-946b-7edc998cf389 ×25
- Grants:
  - Option/step `grantsItems`: None
  - Quest-level `grantsItems`:
    - None
- Rewards:
  - d3590107-25ff-4de5-af3a-46e2497bfc52 ×10000
- Processes used:
  - None

---

## 7) 3D Print 100 Benchies (`3dprinting/benchy_100`)

- Quest link: [/quests/3dprinting/benchy_100](/quests/3dprinting/benchy_100)
- Unlock prerequisite:
  - `3dprinting/benchy_25`
- Dialogue `requiresItems` gates:
  - `progress` → "I have enough!"
    - 7892ffc6-c651-445f-946b-7edc998cf389 ×100
- Grants:
  - Option/step `grantsItems`: None
  - Quest-level `grantsItems`:
    - None
- Rewards:
  - d3590107-25ff-4de5-af3a-46e2497bfc52 ×100000
- Processes used:
  - None

---

## 8) Print a Cable Clip (`3dprinting/cable-clip`)

- Quest link: [/quests/3dprinting/cable-clip](/quests/3dprinting/cable-clip)
- Unlock prerequisite:
  - `3dprinting/filament-change`
- Dialogue `requiresItems` gates:
  - `prep` → "Purge to white PLA."
    - a42e441a-5569-490c-86e4-ce711117cd22 ×1
    - c9b51052-4594-42d7-a723-82b815ab8cc2 ×1
    - ce92a1a9-c817-40f0-92b1-24aff053903d ×1
  - `prep` → "Bed leveled and white PLA loaded."
    - 06b405f2-1728-4428-bc1c-abcf7ef36bcf ×1
    - c9b51052-4594-42d7-a723-82b815ab8cc2 ×1
  - `print` → "Clips cooled and edges deburred."
    - 269d2cfb-25de-417b-8e29-64e80aff934c ×1
- Grants:
  - Option/step `grantsItems`: None
  - Quest-level `grantsItems`:
    - None
- Rewards:
  - b281360b-2ecc-4fea-a248-36a61c5f7399 ×1
- Processes used:
  - [3dprint-cable-clips](/processes/3dprint-cable-clips)
    - Requires:
      - 06b405f2-1728-4428-bc1c-abcf7ef36bcf ×1
      - c9b51052-4594-42d7-a723-82b815ab8cc2 ×1
    - Consumes:
      - 58580f6f-f3be-4be0-80b9-f6f8bf0b05a6 ×12
      - 061fd221-404a-4bd1-9432-3e25b0f17a2c ×120
    - Creates:
      - 269d2cfb-25de-417b-8e29-64e80aff934c ×1
  - [level-3d-printer-bed](/processes/level-3d-printer-bed)
    - Requires:
      - 8aa6dc27-dc42-4622-ac88-cbd57f48625f ×1
      - 60409c3f-56cf-4b9e-9e60-ca480d4896d0 ×1
      - c9b51052-4594-42d7-a723-82b815ab8cc2 ×1
    - Consumes:
      - None
    - Creates:
      - a42e441a-5569-490c-86e4-ce711117cd22 ×1
  - [swap-white-pla-filament](/processes/swap-white-pla-filament)
    - Requires:
      - a42e441a-5569-490c-86e4-ce711117cd22 ×1
      - c9b51052-4594-42d7-a723-82b815ab8cc2 ×1
      - ce92a1a9-c817-40f0-92b1-24aff053903d ×1
    - Consumes:
      - 58580f6f-f3be-4be0-80b9-f6f8bf0b05a6 ×10
    - Creates:
      - 06b405f2-1728-4428-bc1c-abcf7ef36bcf ×1

---

## 9) Fix a Clogged Nozzle (`3dprinting/nozzle-clog`)

- Quest link: [/quests/3dprinting/nozzle-clog](/quests/3dprinting/nozzle-clog)
- Unlock prerequisite:
  - `3dprinting/filament-change`
- Dialogue `requiresItems` gates:
  - `start` → "Document the failure and how it clogged."
    - 8aa6dc27-dc42-4622-ac88-cbd57f48625f ×1
    - d3590107-25ff-4de5-af3a-46e2497bfc52 ×5
    - 061fd221-404a-4bd1-9432-3e25b0f17a2c ×50
  - `start` → "Printer is powered down and cool."
    - 564a76de-925b-4457-a548-d015168abe0c ×1
  - `cooldown` → "Clear the nozzle and reseat it."
    - c9b51052-4594-42d7-a723-82b815ab8cc2 ×1
    - 5029f7cb-3359-4153-b7ca-4b53988ac086 ×1
    - 60409c3f-56cf-4b9e-9e60-ca480d4896d0 ×1
    - 564a76de-925b-4457-a548-d015168abe0c ×1
    - d3590107-25ff-4de5-af3a-46e2497bfc52 ×5
  - `cooldown` → "Swap in a new nozzle."
    - c9b51052-4594-42d7-a723-82b815ab8cc2 ×1
    - 5029f7cb-3359-4153-b7ca-4b53988ac086 ×1
    - fbecc523-fb93-4d00-be08-2ed9f53f158c ×1
    - 564a76de-925b-4457-a548-d015168abe0c ×1
  - `cooldown` → "Hotend is rebuilt and moves smoothly."
    - 45f6f1ce-18e4-481d-8635-23ea51e0c2fd ×1
  - `purge` → "Flow is smooth and first layer is verified."
    - 45f6f1ce-18e4-481d-8635-23ea51e0c2fd ×1
    - 60409c3f-56cf-4b9e-9e60-ca480d4896d0 ×1
- Grants:
  - Option/step `grantsItems`: None
  - Quest-level `grantsItems`:
    - None
- Rewards:
  - b281360b-2ecc-4fea-a248-36a61c5f7399 ×1
- Processes used:
  - [3dprint-nozzle-clog](/processes/3dprint-nozzle-clog)
    - Requires:
      - None
    - Consumes:
      - 8aa6dc27-dc42-4622-ac88-cbd57f48625f ×1
      - d3590107-25ff-4de5-af3a-46e2497bfc52 ×5
      - 061fd221-404a-4bd1-9432-3e25b0f17a2c ×50
    - Creates:
      - 564a76de-925b-4457-a548-d015168abe0c ×1
  - [repair-clogged-nozzle](/processes/repair-clogged-nozzle)
    - Requires:
      - c9b51052-4594-42d7-a723-82b815ab8cc2 ×1
      - 5029f7cb-3359-4153-b7ca-4b53988ac086 ×1
      - 60409c3f-56cf-4b9e-9e60-ca480d4896d0 ×1
    - Consumes:
      - 564a76de-925b-4457-a548-d015168abe0c ×1
      - d3590107-25ff-4de5-af3a-46e2497bfc52 ×5
    - Creates:
      - 45f6f1ce-18e4-481d-8635-23ea51e0c2fd ×1
  - [replace-brass-nozzle](/processes/replace-brass-nozzle)
    - Requires:
      - c9b51052-4594-42d7-a723-82b815ab8cc2 ×1
      - 5029f7cb-3359-4153-b7ca-4b53988ac086 ×1
      - fbecc523-fb93-4d00-be08-2ed9f53f158c ×1
    - Consumes:
      - 564a76de-925b-4457-a548-d015168abe0c ×1
      - fbecc523-fb93-4d00-be08-2ed9f53f158c ×1
    - Creates:
      - 45f6f1ce-18e4-481d-8635-23ea51e0c2fd ×1

---

## 10) Clear a Clogged Nozzle (`3dprinting/nozzle-cleaning`)

- Quest link: [/quests/3dprinting/nozzle-cleaning](/quests/3dprinting/nozzle-cleaning)
- Unlock prerequisite:
  - `3dprinting/nozzle-clog`
- Dialogue `requiresItems` gates:
  - `start` → "I already have a clogged hotend."
    - 564a76de-925b-4457-a548-d015168abe0c ×1
  - `clean` → "Flow restored and test extrusion complete."
    - 45f6f1ce-18e4-481d-8635-23ea51e0c2fd ×1
- Grants:
  - Option/step `grantsItems`: None
  - Quest-level `grantsItems`:
    - None
- Rewards:
  - b281360b-2ecc-4fea-a248-36a61c5f7399 ×1
- Processes used:
  - [3dprint-nozzle-clog](/processes/3dprint-nozzle-clog)
    - Requires:
      - None
    - Consumes:
      - 8aa6dc27-dc42-4622-ac88-cbd57f48625f ×1
      - d3590107-25ff-4de5-af3a-46e2497bfc52 ×5
      - 061fd221-404a-4bd1-9432-3e25b0f17a2c ×50
    - Creates:
      - 564a76de-925b-4457-a548-d015168abe0c ×1
  - [repair-clogged-nozzle](/processes/repair-clogged-nozzle)
    - Requires:
      - c9b51052-4594-42d7-a723-82b815ab8cc2 ×1
      - 5029f7cb-3359-4153-b7ca-4b53988ac086 ×1
      - 60409c3f-56cf-4b9e-9e60-ca480d4896d0 ×1
    - Consumes:
      - 564a76de-925b-4457-a548-d015168abe0c ×1
      - d3590107-25ff-4de5-af3a-46e2497bfc52 ×5
    - Creates:
      - 45f6f1ce-18e4-481d-8635-23ea51e0c2fd ×1

---

## 11) Witness a Blob of Death (`3dprinting/blob-of-death`)

- Quest link: [/quests/3dprinting/blob-of-death](/quests/3dprinting/blob-of-death)
- Unlock prerequisite:
  - `3dprinting/nozzle-cleaning`
- Dialogue `requiresItems` gates:
  - `start` → "Kill power, let the blob cool, and list the damage."
    - 8896a0ef-edd8-4d19-ac14-19ee66470e54 ×1
  - `cooldown` → "Printer cleaned and reassembled."
    - 8aa6dc27-dc42-4622-ac88-cbd57f48625f ×1
- Grants:
  - Option/step `grantsItems`: None
  - Quest-level `grantsItems`:
    - None
- Rewards:
  - b281360b-2ecc-4fea-a248-36a61c5f7399 ×1
- Processes used:
  - [3dprint-blob-of-death](/processes/3dprint-blob-of-death)
    - Requires:
      - None
    - Consumes:
      - 8aa6dc27-dc42-4622-ac88-cbd57f48625f ×1
      - d3590107-25ff-4de5-af3a-46e2497bfc52 ×10
      - 061fd221-404a-4bd1-9432-3e25b0f17a2c ×100
    - Creates:
      - 8896a0ef-edd8-4d19-ac14-19ee66470e54 ×1
  - [repair-blob-of-death](/processes/repair-blob-of-death)
    - Requires:
      - c9b51052-4594-42d7-a723-82b815ab8cc2 ×1
      - 5029f7cb-3359-4153-b7ca-4b53988ac086 ×1
    - Consumes:
      - 8896a0ef-edd8-4d19-ac14-19ee66470e54 ×1
      - fbecc523-fb93-4d00-be08-2ed9f53f158c ×1
    - Creates:
      - 8aa6dc27-dc42-4622-ac88-cbd57f48625f ×1

---

## 12) Print a Phone Stand (`3dprinting/phone-stand`)

- Quest link: [/quests/3dprinting/phone-stand](/quests/3dprinting/phone-stand)
- Unlock prerequisite:
  - `3dprinting/filament-change`
- Dialogue `requiresItems` gates:
  - `prep` → "Swap to white PLA and purge."
    - a42e441a-5569-490c-86e4-ce711117cd22 ×1
    - c9b51052-4594-42d7-a723-82b815ab8cc2 ×1
    - ce92a1a9-c817-40f0-92b1-24aff053903d ×1
  - `prep` → "Ready to slice and print."
    - 06b405f2-1728-4428-bc1c-abcf7ef36bcf ×1
  - `print` → "The stand is finished and cooled!"
    - 9018feac-7213-4eef-9654-b06dbd9404ea ×1
- Grants:
  - Option/step `grantsItems`: None
  - Quest-level `grantsItems`:
    - None
- Rewards:
  - b281360b-2ecc-4fea-a248-36a61c5f7399 ×1
- Processes used:
  - [level-3d-printer-bed](/processes/level-3d-printer-bed)
    - Requires:
      - 8aa6dc27-dc42-4622-ac88-cbd57f48625f ×1
      - 60409c3f-56cf-4b9e-9e60-ca480d4896d0 ×1
      - c9b51052-4594-42d7-a723-82b815ab8cc2 ×1
    - Consumes:
      - None
    - Creates:
      - a42e441a-5569-490c-86e4-ce711117cd22 ×1
  - [print-phone-stand](/processes/print-phone-stand)
    - Requires:
      - 06b405f2-1728-4428-bc1c-abcf7ef36bcf ×1
    - Consumes:
      - 58580f6f-f3be-4be0-80b9-f6f8bf0b05a6 ×20
    - Creates:
      - 9018feac-7213-4eef-9654-b06dbd9404ea ×1
  - [swap-white-pla-filament](/processes/swap-white-pla-filament)
    - Requires:
      - a42e441a-5569-490c-86e4-ce711117cd22 ×1
      - c9b51052-4594-42d7-a723-82b815ab8cc2 ×1
      - ce92a1a9-c817-40f0-92b1-24aff053903d ×1
    - Consumes:
      - 58580f6f-f3be-4be0-80b9-f6f8bf0b05a6 ×10
    - Creates:
      - 06b405f2-1728-4428-bc1c-abcf7ef36bcf ×1

---

## 13) Print a Spool Holder (`3dprinting/spool-holder`)

- Quest link: [/quests/3dprinting/spool-holder](/quests/3dprinting/spool-holder)
- Unlock prerequisite:
  - `3dprinting/phone-stand`
- Dialogue `requiresItems` gates:
  - `prep` → "Tension the belts so layers stack straight."
    - a42e441a-5569-490c-86e4-ce711117cd22 ×1
  - `prep` → "Load white PLA and purge 10 grams of filament."
    - a42e441a-5569-490c-86e4-ce711117cd22 ×1
    - c9b51052-4594-42d7-a723-82b815ab8cc2 ×1
    - ce92a1a9-c817-40f0-92b1-24aff053903d ×1
  - `prep` → "Ready to print the spool holder."
    - 06b405f2-1728-4428-bc1c-abcf7ef36bcf ×1
    - c9b51052-4594-42d7-a723-82b815ab8cc2 ×1
  - `print` → "Holder cooled and fits the spool axle."
    - 3721d5e0-a148-4f67-9150-55492873a576 ×1
- Grants:
  - Option/step `grantsItems`: None
  - Quest-level `grantsItems`:
    - None
- Rewards:
  - b281360b-2ecc-4fea-a248-36a61c5f7399 ×1
- Processes used:
  - [3dprint-spool-holder](/processes/3dprint-spool-holder)
    - Requires:
      - 06b405f2-1728-4428-bc1c-abcf7ef36bcf ×1
      - c9b51052-4594-42d7-a723-82b815ab8cc2 ×1
    - Consumes:
      - 58580f6f-f3be-4be0-80b9-f6f8bf0b05a6 ×120
      - 061fd221-404a-4bd1-9432-3e25b0f17a2c ×520
    - Creates:
      - 3721d5e0-a148-4f67-9150-55492873a576 ×1
  - [level-3d-printer-bed](/processes/level-3d-printer-bed)
    - Requires:
      - 8aa6dc27-dc42-4622-ac88-cbd57f48625f ×1
      - 60409c3f-56cf-4b9e-9e60-ca480d4896d0 ×1
      - c9b51052-4594-42d7-a723-82b815ab8cc2 ×1
    - Consumes:
      - None
    - Creates:
      - a42e441a-5569-490c-86e4-ce711117cd22 ×1
  - [swap-white-pla-filament](/processes/swap-white-pla-filament)
    - Requires:
      - a42e441a-5569-490c-86e4-ce711117cd22 ×1
      - c9b51052-4594-42d7-a723-82b815ab8cc2 ×1
      - ce92a1a9-c817-40f0-92b1-24aff053903d ×1
    - Consumes:
      - 58580f6f-f3be-4be0-80b9-f6f8bf0b05a6 ×10
    - Creates:
      - 06b405f2-1728-4428-bc1c-abcf7ef36bcf ×1
  - [tighten-x-belt](/processes/tighten-x-belt)
    - Requires:
      - a42e441a-5569-490c-86e4-ce711117cd22 ×1
      - 8299ac3f-c232-46d4-a007-2ad86ec70361 ×1
      - c9b51052-4594-42d7-a723-82b815ab8cc2 ×1
    - Consumes:
      - None
    - Creates:
      - 448e9fbb-8464-4799-956d-cc465a4a8376 ×1

---

## 14) Tune Retraction Settings (`3dprinting/retraction-test`)

- Quest link: [/quests/3dprinting/retraction-test](/quests/3dprinting/retraction-test)
- Unlock prerequisite:
  - `3dprinting/spool-holder`
- Dialogue `requiresItems` gates:
  - `start` → "Green PLA is loaded and ready."
    - 97ec3b0b-1be0-4260-bbaf-62ccb935807e ×1
  - `setup` → "Print the stepped Benchy."
    - 97ec3b0b-1be0-4260-bbaf-62ccb935807e ×1
    - c9b51052-4594-42d7-a723-82b815ab8cc2 ×1
    - e37c86b0-caaf-485d-b5c1-c15f7029973c ×1
  - `setup` → "Benchy finished and cooled."
    - 141581bf-be69-4522-973b-3d22292a85fa ×1
  - `inspect` → "Stringing is gone and notes are saved."
    - 141581bf-be69-4522-973b-3d22292a85fa ×1
- Grants:
  - Option/step `grantsItems`: None
  - Quest-level `grantsItems`:
    - None
- Rewards:
  - b281360b-2ecc-4fea-a248-36a61c5f7399 ×1
- Processes used:
  - [tune-retraction-benchy](/processes/tune-retraction-benchy)
    - Requires:
      - 97ec3b0b-1be0-4260-bbaf-62ccb935807e ×1
      - c9b51052-4594-42d7-a723-82b815ab8cc2 ×1
      - e37c86b0-caaf-485d-b5c1-c15f7029973c ×1
    - Consumes:
      - d3590107-25ff-4de5-af3a-46e2497bfc52 ×20
      - 061fd221-404a-4bd1-9432-3e25b0f17a2c ×200
    - Creates:
      - 141581bf-be69-4522-973b-3d22292a85fa ×1
      - 071ba424-3940-4c80-a782-5d7ea4d829ff ×20

---

## 15) Print a Temperature Tower (`3dprinting/temperature-tower`)

- Quest link: [/quests/3dprinting/temperature-tower](/quests/3dprinting/temperature-tower)
- Unlock prerequisite:
  - `3dprinting/retraction-test`
- Dialogue `requiresItems` gates:
  - `start` → "Benchy notes are ready; let's slice it."
    - 8aa6dc27-dc42-4622-ac88-cbd57f48625f ×1
    - 141581bf-be69-4522-973b-3d22292a85fa ×1
  - `slice` → "Print the temperature tower."
    - 8aa6dc27-dc42-4622-ac88-cbd57f48625f ×1
    - c9b51052-4594-42d7-a723-82b815ab8cc2 ×1
    - 58580f6f-f3be-4be0-80b9-f6f8bf0b05a6 ×30
  - `slice` → "Tower cooled and labeled."
    - efcf79a5-1616-490e-add7-40f7fdb628b4 ×1
  - `review` → "Picked the best-looking band."
    - efcf79a5-1616-490e-add7-40f7fdb628b4 ×1
    - e37c86b0-caaf-485d-b5c1-c15f7029973c ×1
- Grants:
  - Option/step `grantsItems`: None
  - Quest-level `grantsItems`:
    - None
- Rewards:
  - b281360b-2ecc-4fea-a248-36a61c5f7399 ×1
- Processes used:
  - [print-temperature-tower](/processes/print-temperature-tower)
    - Requires:
      - 8aa6dc27-dc42-4622-ac88-cbd57f48625f ×1
      - c9b51052-4594-42d7-a723-82b815ab8cc2 ×1
    - Consumes:
      - 58580f6f-f3be-4be0-80b9-f6f8bf0b05a6 ×30
      - 061fd221-404a-4bd1-9432-3e25b0f17a2c ×240
    - Creates:
      - efcf79a5-1616-490e-add7-40f7fdb628b4 ×1
      - 071ba424-3940-4c80-a782-5d7ea4d829ff ×30

---

## 16) Tighten the X-axis Belt (`3dprinting/x-belt-tension`)

- Quest link: [/quests/3dprinting/x-belt-tension](/quests/3dprinting/x-belt-tension)
- Unlock prerequisite:
  - `3dprinting/cable-clip`
- Dialogue `requiresItems` gates:
  - `tension` → "Walk me through each step."
    - a42e441a-5569-490c-86e4-ce711117cd22 ×1
    - 8299ac3f-c232-46d4-a007-2ad86ec70361 ×1
    - c9b51052-4594-42d7-a723-82b815ab8cc2 ×1
  - `tension` → "Belt tightened and moving smoothly."
    - 448e9fbb-8464-4799-956d-cc465a4a8376 ×1
- Grants:
  - Option/step `grantsItems`: None
  - Quest-level `grantsItems`:
    - None
- Rewards:
  - b281360b-2ecc-4fea-a248-36a61c5f7399 ×1
- Processes used:
  - [tighten-x-belt](/processes/tighten-x-belt)
    - Requires:
      - a42e441a-5569-490c-86e4-ce711117cd22 ×1
      - 8299ac3f-c232-46d4-a007-2ad86ec70361 ×1
      - c9b51052-4594-42d7-a723-82b815ab8cc2 ×1
    - Consumes:
      - None
    - Creates:
      - 448e9fbb-8464-4799-956d-cc465a4a8376 ×1

---

## QA flow notes

- Cross-quest dependencies:
  - `3dprinter/start` depends on external quests: `welcome/howtodoquests`.
  - `3dprinting/bed-leveling` depends on external quests: `3dprinter/start`.
- Progression integrity checks:
  - `3dprinter/start`: verify prerequisite completion and inventory gates (notable count gates: d3590107-25ff-4de5-af3a-46e2497bfc52 ×1000).
  - `3dprinting/bed-leveling`: verify prerequisite completion and inventory gates.
  - `3dprinting/calibration-cube`: verify prerequisite completion and inventory gates (notable count gates: d3590107-25ff-4de5-af3a-46e2497bfc52 ×15).
  - `3dprinting/filament-change`: verify prerequisite completion and inventory gates (notable count gates: d3590107-25ff-4de5-af3a-46e2497bfc52 ×10).
  - `3dprinting/benchy_10`: verify prerequisite completion and inventory gates (notable count gates: 7892ffc6-c651-445f-946b-7edc998cf389 ×10).
  - `3dprinting/benchy_25`: verify prerequisite completion and inventory gates (notable count gates: 7892ffc6-c651-445f-946b-7edc998cf389 ×25).
  - `3dprinting/benchy_100`: verify prerequisite completion and inventory gates (notable count gates: 7892ffc6-c651-445f-946b-7edc998cf389 ×100).
  - `3dprinting/cable-clip`: verify prerequisite completion and inventory gates.
  - `3dprinting/nozzle-clog`: verify prerequisite completion and inventory gates (notable count gates: d3590107-25ff-4de5-af3a-46e2497bfc52 ×5, 061fd221-404a-4bd1-9432-3e25b0f17a2c ×50).
  - `3dprinting/nozzle-cleaning`: verify prerequisite completion and inventory gates.
  - `3dprinting/blob-of-death`: verify prerequisite completion and inventory gates.
  - `3dprinting/phone-stand`: verify prerequisite completion and inventory gates.
  - `3dprinting/spool-holder`: verify prerequisite completion and inventory gates.
  - `3dprinting/retraction-test`: verify prerequisite completion and inventory gates.
  - `3dprinting/temperature-tower`: verify prerequisite completion and inventory gates (notable count gates: 58580f6f-f3be-4be0-80b9-f6f8bf0b05a6 ×30).
  - `3dprinting/x-belt-tension`: verify prerequisite completion and inventory gates.
- End-to-end validation checklist:
  - Play quests in dependency order and confirm each `/quests/...` link resolves.
  - For each process option, run the process once and confirm process output satisfies the next gate.
  - Confirm rewards and grants are present after completion without bypassing prerequisite gates.
