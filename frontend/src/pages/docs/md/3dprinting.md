---
title: '3dprinting'
slug: '3dprinting'
---

This page documents the full **3dprinting** quest tree for QA and content validation.
Use it to verify prerequisites, item gates, process IO, and end-to-end progression.

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

## Quest details

### 1) Set up your first 3D printer (`3dprinter/start`)
- Quest link: `/quests/3dprinting/start`
- Unlock prerequisite (`requiresQuests`): `welcome/howtodoquests`
- Dialogue `requiresItems` gates:
  - Node `grant` / I've got the goods! What's next?: entry-level FDM 3D printer (`8aa6dc27-dc42-4622-ac88-cbd57f48625f`) x1; green PLA filament (`d3590107-25ff-4de5-af3a-46e2497bfc52`) x1000
  - Node `benchy` / I've printed the Benchy! What's next?: Benchy (`7892ffc6-c651-445f-946b-7edc998cf389`) x1
- Grants from dialogue (`grantsItems` on options/steps):
  - Node `grant` / Don't mind if I do!: entry-level FDM 3D printer (`8aa6dc27-dc42-4622-ac88-cbd57f48625f`) x1; green PLA filament (`d3590107-25ff-4de5-af3a-46e2497bfc52`) x1000
- Quest-level `grantsItems`: None
- Rewards: dUSD (`5247a603-294a-4a34-a884-1ae20969b2a1`) x100; Benchy Award (`fe46e236-5d03-4c95-9b38-68b045a0df03`) x1
- Processes used:
  - [`3dprint-benchy`](/processes/3dprint-benchy)
    - Requires: entry-level FDM 3D printer (`8aa6dc27-dc42-4622-ac88-cbd57f48625f`) x1
    - Consumes: green PLA filament (`d3590107-25ff-4de5-af3a-46e2497bfc52`) x15; dWatt (`061fd221-404a-4bd1-9432-3e25b0f17a2c`) x150
    - Creates: Benchy (`7892ffc6-c651-445f-946b-7edc998cf389`) x1; dPrint (`071ba424-3940-4c80-a782-5d7ea4d829ff`) x15

### 2) Level the Print Bed (`3dprinting/bed-leveling`)
- Quest link: `/quests/3dprinting/bed-leveling`
- Unlock prerequisite (`requiresQuests`): `3dprinter/start`
- Dialogue `requiresItems` gates:
  - Node `prep` / Walk me through each pass.: entry-level FDM 3D printer (`8aa6dc27-dc42-4622-ac88-cbd57f48625f`) x1; sheet of printer paper (`60409c3f-56cf-4b9e-9e60-ca480d4896d0`) x1; safety goggles (`c9b51052-4594-42d7-a723-82b815ab8cc2`) x1
  - Node `prep` / Corners all tug the paper evenly.: entry-level FDM 3D printer (leveled bed) (`a42e441a-5569-490c-86e4-ce711117cd22`) x1
  - Node `first-layer` / Skirt looks even and glossy.: entry-level FDM 3D printer (leveled bed) (`a42e441a-5569-490c-86e4-ce711117cd22`) x1
- Grants from dialogue (`grantsItems` on options/steps):
  - None
- Quest-level `grantsItems`: None
- Rewards: cured compost bucket (`b281360b-2ecc-4fea-a248-36a61c5f7399`) x1
- Processes used:
  - [`level-3d-printer-bed`](/processes/level-3d-printer-bed)
    - Requires: entry-level FDM 3D printer (`8aa6dc27-dc42-4622-ac88-cbd57f48625f`) x1; sheet of printer paper (`60409c3f-56cf-4b9e-9e60-ca480d4896d0`) x1; safety goggles (`c9b51052-4594-42d7-a723-82b815ab8cc2`) x1
    - Consumes: None
    - Creates: entry-level FDM 3D printer (leveled bed) (`a42e441a-5569-490c-86e4-ce711117cd22`) x1

### 3) Print a Calibration Cube (`3dprinting/calibration-cube`)
- Quest link: `/quests/3dprinting/calibration-cube`
- Unlock prerequisite (`requiresQuests`): `3dprinting/bed-leveling`
- Dialogue `requiresItems` gates:
  - Node `print` / Cube cooled and removed.: entry-level FDM 3D printer (`8aa6dc27-dc42-4622-ac88-cbd57f48625f`) x1; green PLA filament (`d3590107-25ff-4de5-af3a-46e2497bfc52`) x15; safety goggles (`c9b51052-4594-42d7-a723-82b815ab8cc2`) x1; print removal scraper (`9b985439-3c19-4fa7-b864-34a3c5c33ac4`) x1
  - Node `measure` / Dimensions noted.: digital calipers (`e37c86b0-caaf-485d-b5c1-c15f7029973c`) x1
- Grants from dialogue (`grantsItems` on options/steps):
  - None
- Quest-level `grantsItems`: None
- Rewards: cured compost bucket (`b281360b-2ecc-4fea-a248-36a61c5f7399`) x1
- Processes used:
  - [`measure-calibration-cube`](/processes/measure-calibration-cube)
    - Requires: digital calipers (`e37c86b0-caaf-485d-b5c1-c15f7029973c`) x1; mission logbook (`70bb8d86-2c4e-4330-9705-371891934686`) x1; feather quill (`aa82b02f-2617-4474-a91b-29647e4a9780`) x1
    - Consumes: None
    - Creates: mission log entry (`280ed361-ac70-4ab9-bcd9-aee481790faf`) x1
  - [`measure-filament-diameter`](/processes/measure-filament-diameter)
    - Requires: digital calipers (`e37c86b0-caaf-485d-b5c1-c15f7029973c`) x1; white PLA filament (`58580f6f-f3be-4be0-80b9-f6f8bf0b05a6`) x1
    - Consumes: None
    - Creates: None
  - [`print-calibration-cube`](/processes/print-calibration-cube)
    - Requires: entry-level FDM 3D printer (`8aa6dc27-dc42-4622-ac88-cbd57f48625f`) x1
    - Consumes: green PLA filament (`d3590107-25ff-4de5-af3a-46e2497bfc52`) x15
    - Creates: None

### 4) Swap Filament (`3dprinting/filament-change`)
- Quest link: `/quests/3dprinting/filament-change`
- Unlock prerequisite (`requiresQuests`): `3dprinting/calibration-cube`
- Dialogue `requiresItems` gates:
  - Node `start` / Leveled and ready to heat.: entry-level FDM 3D printer (leveled bed) (`a42e441a-5569-490c-86e4-ce711117cd22`) x1
  - Node `heat` / Unload and load green PLA.: entry-level FDM 3D printer (leveled bed) (`a42e441a-5569-490c-86e4-ce711117cd22`) x1; green PLA filament (`d3590107-25ff-4de5-af3a-46e2497bfc52`) x10; safety goggles (`c9b51052-4594-42d7-a723-82b815ab8cc2`) x1; wire cutters (`ce92a1a9-c817-40f0-92b1-24aff053903d`) x1
  - Node `heat` / Green filament is flowing without bubbles.: entry-level FDM 3D printer (green PLA loaded) (`97ec3b0b-1be0-4260-bbaf-62ccb935807e`) x1
  - Node `purge` / Swap locked in and purge line is solid.: entry-level FDM 3D printer (green PLA loaded) (`97ec3b0b-1be0-4260-bbaf-62ccb935807e`) x1
- Grants from dialogue (`grantsItems` on options/steps):
  - None
- Quest-level `grantsItems`: None
- Rewards: cured compost bucket (`b281360b-2ecc-4fea-a248-36a61c5f7399`) x1
- Processes used:
  - [`swap-green-pla-filament`](/processes/swap-green-pla-filament)
    - Requires: entry-level FDM 3D printer (leveled bed) (`a42e441a-5569-490c-86e4-ce711117cd22`) x1; safety goggles (`c9b51052-4594-42d7-a723-82b815ab8cc2`) x1; wire cutters (`ce92a1a9-c817-40f0-92b1-24aff053903d`) x1
    - Consumes: green PLA filament (`d3590107-25ff-4de5-af3a-46e2497bfc52`) x10
    - Creates: entry-level FDM 3D printer (green PLA loaded) (`97ec3b0b-1be0-4260-bbaf-62ccb935807e`) x1

### 5) 3D Print 10 Benchies (`3dprinting/benchy_10`)
- Quest link: `/quests/3dprinting/benchy_10`
- Unlock prerequisite (`requiresQuests`): `3dprinting/filament-change`
- Dialogue `requiresItems` gates:
  - Node `progress` / I have enough!: Benchy (`7892ffc6-c651-445f-946b-7edc998cf389`) x10
- Grants from dialogue (`grantsItems` on options/steps):
  - None
- Quest-level `grantsItems`: None
- Rewards: green PLA filament (`d3590107-25ff-4de5-af3a-46e2497bfc52`) x1000
- Processes used:
  - None

### 6) 3D Print 25 Benchies (`3dprinting/benchy_25`)
- Quest link: `/quests/3dprinting/benchy_25`
- Unlock prerequisite (`requiresQuests`): `3dprinting/benchy_10`
- Dialogue `requiresItems` gates:
  - Node `progress` / I have enough!: Benchy (`7892ffc6-c651-445f-946b-7edc998cf389`) x25
- Grants from dialogue (`grantsItems` on options/steps):
  - None
- Quest-level `grantsItems`: None
- Rewards: green PLA filament (`d3590107-25ff-4de5-af3a-46e2497bfc52`) x10000
- Processes used:
  - None

### 7) 3D Print 100 Benchies (`3dprinting/benchy_100`)
- Quest link: `/quests/3dprinting/benchy_100`
- Unlock prerequisite (`requiresQuests`): `3dprinting/benchy_25`
- Dialogue `requiresItems` gates:
  - Node `progress` / I have enough!: Benchy (`7892ffc6-c651-445f-946b-7edc998cf389`) x100
- Grants from dialogue (`grantsItems` on options/steps):
  - None
- Quest-level `grantsItems`: None
- Rewards: green PLA filament (`d3590107-25ff-4de5-af3a-46e2497bfc52`) x100000
- Processes used:
  - None

### 8) Print a Cable Clip (`3dprinting/cable-clip`)
- Quest link: `/quests/3dprinting/cable-clip`
- Unlock prerequisite (`requiresQuests`): `3dprinting/filament-change`
- Dialogue `requiresItems` gates:
  - Node `prep` / Purge to white PLA.: entry-level FDM 3D printer (leveled bed) (`a42e441a-5569-490c-86e4-ce711117cd22`) x1; safety goggles (`c9b51052-4594-42d7-a723-82b815ab8cc2`) x1; wire cutters (`ce92a1a9-c817-40f0-92b1-24aff053903d`) x1
  - Node `prep` / Bed leveled and white PLA loaded.: entry-level FDM 3D printer (white PLA loaded) (`06b405f2-1728-4428-bc1c-abcf7ef36bcf`) x1; safety goggles (`c9b51052-4594-42d7-a723-82b815ab8cc2`) x1
  - Node `print` / Clips cooled and edges deburred.: 3D printed cable clip set (`269d2cfb-25de-417b-8e29-64e80aff934c`) x1
- Grants from dialogue (`grantsItems` on options/steps):
  - None
- Quest-level `grantsItems`: None
- Rewards: cured compost bucket (`b281360b-2ecc-4fea-a248-36a61c5f7399`) x1
- Processes used:
  - [`3dprint-cable-clips`](/processes/3dprint-cable-clips)
    - Requires: entry-level FDM 3D printer (white PLA loaded) (`06b405f2-1728-4428-bc1c-abcf7ef36bcf`) x1; safety goggles (`c9b51052-4594-42d7-a723-82b815ab8cc2`) x1
    - Consumes: white PLA filament (`58580f6f-f3be-4be0-80b9-f6f8bf0b05a6`) x12; dWatt (`061fd221-404a-4bd1-9432-3e25b0f17a2c`) x120
    - Creates: 3D printed cable clip set (`269d2cfb-25de-417b-8e29-64e80aff934c`) x1
  - [`level-3d-printer-bed`](/processes/level-3d-printer-bed)
    - Requires: entry-level FDM 3D printer (`8aa6dc27-dc42-4622-ac88-cbd57f48625f`) x1; sheet of printer paper (`60409c3f-56cf-4b9e-9e60-ca480d4896d0`) x1; safety goggles (`c9b51052-4594-42d7-a723-82b815ab8cc2`) x1
    - Consumes: None
    - Creates: entry-level FDM 3D printer (leveled bed) (`a42e441a-5569-490c-86e4-ce711117cd22`) x1
  - [`swap-white-pla-filament`](/processes/swap-white-pla-filament)
    - Requires: entry-level FDM 3D printer (leveled bed) (`a42e441a-5569-490c-86e4-ce711117cd22`) x1; safety goggles (`c9b51052-4594-42d7-a723-82b815ab8cc2`) x1; wire cutters (`ce92a1a9-c817-40f0-92b1-24aff053903d`) x1
    - Consumes: white PLA filament (`58580f6f-f3be-4be0-80b9-f6f8bf0b05a6`) x10
    - Creates: entry-level FDM 3D printer (white PLA loaded) (`06b405f2-1728-4428-bc1c-abcf7ef36bcf`) x1

### 9) Fix a Clogged Nozzle (`3dprinting/nozzle-clog`)
- Quest link: `/quests/3dprinting/nozzle-clog`
- Unlock prerequisite (`requiresQuests`): `3dprinting/filament-change`
- Dialogue `requiresItems` gates:
  - Node `start` / Document the failure and how it clogged.: entry-level FDM 3D printer (`8aa6dc27-dc42-4622-ac88-cbd57f48625f`) x1; green PLA filament (`d3590107-25ff-4de5-af3a-46e2497bfc52`) x5; dWatt (`061fd221-404a-4bd1-9432-3e25b0f17a2c`) x50
  - Node `start` / Printer is powered down and cool.: entry-level FDM 3D printer (clogged nozzle) (`564a76de-925b-4457-a548-d015168abe0c`) x1
  - Node `cooldown` / Clear the nozzle and reseat it.: safety goggles (`c9b51052-4594-42d7-a723-82b815ab8cc2`) x1; needle-nose pliers (`5029f7cb-3359-4153-b7ca-4b53988ac086`) x1; sheet of printer paper (`60409c3f-56cf-4b9e-9e60-ca480d4896d0`) x1; entry-level FDM 3D printer (clogged nozzle) (`564a76de-925b-4457-a548-d015168abe0c`) x1; green PLA filament (`d3590107-25ff-4de5-af3a-46e2497bfc52`) x5
  - Node `cooldown` / Swap in a new nozzle.: safety goggles (`c9b51052-4594-42d7-a723-82b815ab8cc2`) x1; needle-nose pliers (`5029f7cb-3359-4153-b7ca-4b53988ac086`) x1; 0.4 mm brass nozzle (`fbecc523-fb93-4d00-be08-2ed9f53f158c`) x1; entry-level FDM 3D printer (clogged nozzle) (`564a76de-925b-4457-a548-d015168abe0c`) x1
  - Node `cooldown` / Hotend is rebuilt and moves smoothly.: entry-level FDM 3D printer (clean nozzle) (`45f6f1ce-18e4-481d-8635-23ea51e0c2fd`) x1
  - Node `purge` / Flow is smooth and first layer is verified.: entry-level FDM 3D printer (clean nozzle) (`45f6f1ce-18e4-481d-8635-23ea51e0c2fd`) x1; sheet of printer paper (`60409c3f-56cf-4b9e-9e60-ca480d4896d0`) x1
- Grants from dialogue (`grantsItems` on options/steps):
  - None
- Quest-level `grantsItems`: None
- Rewards: cured compost bucket (`b281360b-2ecc-4fea-a248-36a61c5f7399`) x1
- Processes used:
  - [`3dprint-nozzle-clog`](/processes/3dprint-nozzle-clog)
    - Requires: None
    - Consumes: entry-level FDM 3D printer (`8aa6dc27-dc42-4622-ac88-cbd57f48625f`) x1; green PLA filament (`d3590107-25ff-4de5-af3a-46e2497bfc52`) x5; dWatt (`061fd221-404a-4bd1-9432-3e25b0f17a2c`) x50
    - Creates: entry-level FDM 3D printer (clogged nozzle) (`564a76de-925b-4457-a548-d015168abe0c`) x1
  - [`repair-clogged-nozzle`](/processes/repair-clogged-nozzle)
    - Requires: safety goggles (`c9b51052-4594-42d7-a723-82b815ab8cc2`) x1; needle-nose pliers (`5029f7cb-3359-4153-b7ca-4b53988ac086`) x1; sheet of printer paper (`60409c3f-56cf-4b9e-9e60-ca480d4896d0`) x1
    - Consumes: entry-level FDM 3D printer (clogged nozzle) (`564a76de-925b-4457-a548-d015168abe0c`) x1; green PLA filament (`d3590107-25ff-4de5-af3a-46e2497bfc52`) x5
    - Creates: entry-level FDM 3D printer (clean nozzle) (`45f6f1ce-18e4-481d-8635-23ea51e0c2fd`) x1
  - [`replace-brass-nozzle`](/processes/replace-brass-nozzle)
    - Requires: safety goggles (`c9b51052-4594-42d7-a723-82b815ab8cc2`) x1; needle-nose pliers (`5029f7cb-3359-4153-b7ca-4b53988ac086`) x1; 0.4 mm brass nozzle (`fbecc523-fb93-4d00-be08-2ed9f53f158c`) x1
    - Consumes: entry-level FDM 3D printer (clogged nozzle) (`564a76de-925b-4457-a548-d015168abe0c`) x1; 0.4 mm brass nozzle (`fbecc523-fb93-4d00-be08-2ed9f53f158c`) x1
    - Creates: entry-level FDM 3D printer (clean nozzle) (`45f6f1ce-18e4-481d-8635-23ea51e0c2fd`) x1

### 10) Clear a Clogged Nozzle (`3dprinting/nozzle-cleaning`)
- Quest link: `/quests/3dprinting/nozzle-cleaning`
- Unlock prerequisite (`requiresQuests`): `3dprinting/nozzle-clog`
- Dialogue `requiresItems` gates:
  - Node `start` / I already have a clogged hotend.: entry-level FDM 3D printer (clogged nozzle) (`564a76de-925b-4457-a548-d015168abe0c`) x1
  - Node `clean` / Flow restored and test extrusion complete.: entry-level FDM 3D printer (clean nozzle) (`45f6f1ce-18e4-481d-8635-23ea51e0c2fd`) x1
- Grants from dialogue (`grantsItems` on options/steps):
  - None
- Quest-level `grantsItems`: None
- Rewards: cured compost bucket (`b281360b-2ecc-4fea-a248-36a61c5f7399`) x1
- Processes used:
  - [`3dprint-nozzle-clog`](/processes/3dprint-nozzle-clog)
    - Requires: None
    - Consumes: entry-level FDM 3D printer (`8aa6dc27-dc42-4622-ac88-cbd57f48625f`) x1; green PLA filament (`d3590107-25ff-4de5-af3a-46e2497bfc52`) x5; dWatt (`061fd221-404a-4bd1-9432-3e25b0f17a2c`) x50
    - Creates: entry-level FDM 3D printer (clogged nozzle) (`564a76de-925b-4457-a548-d015168abe0c`) x1
  - [`repair-clogged-nozzle`](/processes/repair-clogged-nozzle)
    - Requires: safety goggles (`c9b51052-4594-42d7-a723-82b815ab8cc2`) x1; needle-nose pliers (`5029f7cb-3359-4153-b7ca-4b53988ac086`) x1; sheet of printer paper (`60409c3f-56cf-4b9e-9e60-ca480d4896d0`) x1
    - Consumes: entry-level FDM 3D printer (clogged nozzle) (`564a76de-925b-4457-a548-d015168abe0c`) x1; green PLA filament (`d3590107-25ff-4de5-af3a-46e2497bfc52`) x5
    - Creates: entry-level FDM 3D printer (clean nozzle) (`45f6f1ce-18e4-481d-8635-23ea51e0c2fd`) x1

### 11) Witness a Blob of Death (`3dprinting/blob-of-death`)
- Quest link: `/quests/3dprinting/blob-of-death`
- Unlock prerequisite (`requiresQuests`): `3dprinting/nozzle-cleaning`
- Dialogue `requiresItems` gates:
  - Node `start` / Kill power, let the blob cool, and list the damage.: entry-level FDM 3D printer (blob of death) (`8896a0ef-edd8-4d19-ac14-19ee66470e54`) x1
  - Node `cooldown` / Printer cleaned and reassembled.: entry-level FDM 3D printer (`8aa6dc27-dc42-4622-ac88-cbd57f48625f`) x1
- Grants from dialogue (`grantsItems` on options/steps):
  - None
- Quest-level `grantsItems`: None
- Rewards: cured compost bucket (`b281360b-2ecc-4fea-a248-36a61c5f7399`) x1
- Processes used:
  - [`3dprint-blob-of-death`](/processes/3dprint-blob-of-death)
    - Requires: None
    - Consumes: entry-level FDM 3D printer (`8aa6dc27-dc42-4622-ac88-cbd57f48625f`) x1; green PLA filament (`d3590107-25ff-4de5-af3a-46e2497bfc52`) x10; dWatt (`061fd221-404a-4bd1-9432-3e25b0f17a2c`) x100
    - Creates: entry-level FDM 3D printer (blob of death) (`8896a0ef-edd8-4d19-ac14-19ee66470e54`) x1
  - [`repair-blob-of-death`](/processes/repair-blob-of-death)
    - Requires: safety goggles (`c9b51052-4594-42d7-a723-82b815ab8cc2`) x1; needle-nose pliers (`5029f7cb-3359-4153-b7ca-4b53988ac086`) x1
    - Consumes: entry-level FDM 3D printer (blob of death) (`8896a0ef-edd8-4d19-ac14-19ee66470e54`) x1; 0.4 mm brass nozzle (`fbecc523-fb93-4d00-be08-2ed9f53f158c`) x1
    - Creates: entry-level FDM 3D printer (`8aa6dc27-dc42-4622-ac88-cbd57f48625f`) x1

### 12) Print a Phone Stand (`3dprinting/phone-stand`)
- Quest link: `/quests/3dprinting/phone-stand`
- Unlock prerequisite (`requiresQuests`): `3dprinting/filament-change`
- Dialogue `requiresItems` gates:
  - Node `prep` / Swap to white PLA and purge.: entry-level FDM 3D printer (leveled bed) (`a42e441a-5569-490c-86e4-ce711117cd22`) x1; safety goggles (`c9b51052-4594-42d7-a723-82b815ab8cc2`) x1; wire cutters (`ce92a1a9-c817-40f0-92b1-24aff053903d`) x1
  - Node `prep` / Ready to slice and print.: entry-level FDM 3D printer (white PLA loaded) (`06b405f2-1728-4428-bc1c-abcf7ef36bcf`) x1
  - Node `print` / The stand is finished and cooled!: 3D Printed Phone Stand (`9018feac-7213-4eef-9654-b06dbd9404ea`) x1
- Grants from dialogue (`grantsItems` on options/steps):
  - None
- Quest-level `grantsItems`: None
- Rewards: cured compost bucket (`b281360b-2ecc-4fea-a248-36a61c5f7399`) x1
- Processes used:
  - [`level-3d-printer-bed`](/processes/level-3d-printer-bed)
    - Requires: entry-level FDM 3D printer (`8aa6dc27-dc42-4622-ac88-cbd57f48625f`) x1; sheet of printer paper (`60409c3f-56cf-4b9e-9e60-ca480d4896d0`) x1; safety goggles (`c9b51052-4594-42d7-a723-82b815ab8cc2`) x1
    - Consumes: None
    - Creates: entry-level FDM 3D printer (leveled bed) (`a42e441a-5569-490c-86e4-ce711117cd22`) x1
  - [`print-phone-stand`](/processes/print-phone-stand)
    - Requires: entry-level FDM 3D printer (white PLA loaded) (`06b405f2-1728-4428-bc1c-abcf7ef36bcf`) x1
    - Consumes: white PLA filament (`58580f6f-f3be-4be0-80b9-f6f8bf0b05a6`) x20
    - Creates: 3D Printed Phone Stand (`9018feac-7213-4eef-9654-b06dbd9404ea`) x1
  - [`swap-white-pla-filament`](/processes/swap-white-pla-filament)
    - Requires: entry-level FDM 3D printer (leveled bed) (`a42e441a-5569-490c-86e4-ce711117cd22`) x1; safety goggles (`c9b51052-4594-42d7-a723-82b815ab8cc2`) x1; wire cutters (`ce92a1a9-c817-40f0-92b1-24aff053903d`) x1
    - Consumes: white PLA filament (`58580f6f-f3be-4be0-80b9-f6f8bf0b05a6`) x10
    - Creates: entry-level FDM 3D printer (white PLA loaded) (`06b405f2-1728-4428-bc1c-abcf7ef36bcf`) x1

### 13) Print a Spool Holder (`3dprinting/spool-holder`)
- Quest link: `/quests/3dprinting/spool-holder`
- Unlock prerequisite (`requiresQuests`): `3dprinting/phone-stand`
- Dialogue `requiresItems` gates:
  - Node `prep` / Tension the belts so layers stack straight.: entry-level FDM 3D printer (leveled bed) (`a42e441a-5569-490c-86e4-ce711117cd22`) x1
  - Node `prep` / Load white PLA and purge 10 grams of filament.: entry-level FDM 3D printer (leveled bed) (`a42e441a-5569-490c-86e4-ce711117cd22`) x1; safety goggles (`c9b51052-4594-42d7-a723-82b815ab8cc2`) x1; wire cutters (`ce92a1a9-c817-40f0-92b1-24aff053903d`) x1
  - Node `prep` / Ready to print the spool holder.: entry-level FDM 3D printer (white PLA loaded) (`06b405f2-1728-4428-bc1c-abcf7ef36bcf`) x1; safety goggles (`c9b51052-4594-42d7-a723-82b815ab8cc2`) x1
  - Node `print` / Holder cooled and fits the spool axle.: 3D printed filament spool holder (`3721d5e0-a148-4f67-9150-55492873a576`) x1
- Grants from dialogue (`grantsItems` on options/steps):
  - None
- Quest-level `grantsItems`: None
- Rewards: cured compost bucket (`b281360b-2ecc-4fea-a248-36a61c5f7399`) x1
- Processes used:
  - [`3dprint-spool-holder`](/processes/3dprint-spool-holder)
    - Requires: entry-level FDM 3D printer (white PLA loaded) (`06b405f2-1728-4428-bc1c-abcf7ef36bcf`) x1; safety goggles (`c9b51052-4594-42d7-a723-82b815ab8cc2`) x1
    - Consumes: white PLA filament (`58580f6f-f3be-4be0-80b9-f6f8bf0b05a6`) x120; dWatt (`061fd221-404a-4bd1-9432-3e25b0f17a2c`) x520
    - Creates: 3D printed filament spool holder (`3721d5e0-a148-4f67-9150-55492873a576`) x1
  - [`level-3d-printer-bed`](/processes/level-3d-printer-bed)
    - Requires: entry-level FDM 3D printer (`8aa6dc27-dc42-4622-ac88-cbd57f48625f`) x1; sheet of printer paper (`60409c3f-56cf-4b9e-9e60-ca480d4896d0`) x1; safety goggles (`c9b51052-4594-42d7-a723-82b815ab8cc2`) x1
    - Consumes: None
    - Creates: entry-level FDM 3D printer (leveled bed) (`a42e441a-5569-490c-86e4-ce711117cd22`) x1
  - [`swap-white-pla-filament`](/processes/swap-white-pla-filament)
    - Requires: entry-level FDM 3D printer (leveled bed) (`a42e441a-5569-490c-86e4-ce711117cd22`) x1; safety goggles (`c9b51052-4594-42d7-a723-82b815ab8cc2`) x1; wire cutters (`ce92a1a9-c817-40f0-92b1-24aff053903d`) x1
    - Consumes: white PLA filament (`58580f6f-f3be-4be0-80b9-f6f8bf0b05a6`) x10
    - Creates: entry-level FDM 3D printer (white PLA loaded) (`06b405f2-1728-4428-bc1c-abcf7ef36bcf`) x1
  - [`tighten-x-belt`](/processes/tighten-x-belt)
    - Requires: entry-level FDM 3D printer (leveled bed) (`a42e441a-5569-490c-86e4-ce711117cd22`) x1; precision screwdriver set (`8299ac3f-c232-46d4-a007-2ad86ec70361`) x1; safety goggles (`c9b51052-4594-42d7-a723-82b815ab8cc2`) x1
    - Consumes: None
    - Creates: entry-level FDM 3D printer (belt tensioned) (`448e9fbb-8464-4799-956d-cc465a4a8376`) x1

### 14) Tune Retraction Settings (`3dprinting/retraction-test`)
- Quest link: `/quests/3dprinting/retraction-test`
- Unlock prerequisite (`requiresQuests`): `3dprinting/spool-holder`
- Dialogue `requiresItems` gates:
  - Node `start` / Green PLA is loaded and ready.: entry-level FDM 3D printer (green PLA loaded) (`97ec3b0b-1be0-4260-bbaf-62ccb935807e`) x1
  - Node `setup` / Print the stepped Benchy.: entry-level FDM 3D printer (green PLA loaded) (`97ec3b0b-1be0-4260-bbaf-62ccb935807e`) x1; safety goggles (`c9b51052-4594-42d7-a723-82b815ab8cc2`) x1; digital calipers (`e37c86b0-caaf-485d-b5c1-c15f7029973c`) x1
  - Node `setup` / Benchy finished and cooled.: stringing-tuned Benchy (`141581bf-be69-4522-973b-3d22292a85fa`) x1
  - Node `inspect` / Stringing is gone and notes are saved.: stringing-tuned Benchy (`141581bf-be69-4522-973b-3d22292a85fa`) x1
- Grants from dialogue (`grantsItems` on options/steps):
  - None
- Quest-level `grantsItems`: None
- Rewards: cured compost bucket (`b281360b-2ecc-4fea-a248-36a61c5f7399`) x1
- Processes used:
  - [`tune-retraction-benchy`](/processes/tune-retraction-benchy)
    - Requires: entry-level FDM 3D printer (green PLA loaded) (`97ec3b0b-1be0-4260-bbaf-62ccb935807e`) x1; safety goggles (`c9b51052-4594-42d7-a723-82b815ab8cc2`) x1; digital calipers (`e37c86b0-caaf-485d-b5c1-c15f7029973c`) x1
    - Consumes: green PLA filament (`d3590107-25ff-4de5-af3a-46e2497bfc52`) x20; dWatt (`061fd221-404a-4bd1-9432-3e25b0f17a2c`) x200
    - Creates: stringing-tuned Benchy (`141581bf-be69-4522-973b-3d22292a85fa`) x1; dPrint (`071ba424-3940-4c80-a782-5d7ea4d829ff`) x20

### 15) Print a Temperature Tower (`3dprinting/temperature-tower`)
- Quest link: `/quests/3dprinting/temperature-tower`
- Unlock prerequisite (`requiresQuests`): `3dprinting/retraction-test`
- Dialogue `requiresItems` gates:
  - Node `start` / Benchy notes are ready; let's slice it.: entry-level FDM 3D printer (`8aa6dc27-dc42-4622-ac88-cbd57f48625f`) x1; stringing-tuned Benchy (`141581bf-be69-4522-973b-3d22292a85fa`) x1
  - Node `slice` / Print the temperature tower.: entry-level FDM 3D printer (`8aa6dc27-dc42-4622-ac88-cbd57f48625f`) x1; safety goggles (`c9b51052-4594-42d7-a723-82b815ab8cc2`) x1; white PLA filament (`58580f6f-f3be-4be0-80b9-f6f8bf0b05a6`) x30
  - Node `slice` / Tower cooled and labeled.: temperature tower sample (`efcf79a5-1616-490e-add7-40f7fdb628b4`) x1
  - Node `review` / Picked the best-looking band.: temperature tower sample (`efcf79a5-1616-490e-add7-40f7fdb628b4`) x1; digital calipers (`e37c86b0-caaf-485d-b5c1-c15f7029973c`) x1
- Grants from dialogue (`grantsItems` on options/steps):
  - None
- Quest-level `grantsItems`: None
- Rewards: cured compost bucket (`b281360b-2ecc-4fea-a248-36a61c5f7399`) x1
- Processes used:
  - [`print-temperature-tower`](/processes/print-temperature-tower)
    - Requires: entry-level FDM 3D printer (`8aa6dc27-dc42-4622-ac88-cbd57f48625f`) x1; safety goggles (`c9b51052-4594-42d7-a723-82b815ab8cc2`) x1
    - Consumes: white PLA filament (`58580f6f-f3be-4be0-80b9-f6f8bf0b05a6`) x30; dWatt (`061fd221-404a-4bd1-9432-3e25b0f17a2c`) x240
    - Creates: temperature tower sample (`efcf79a5-1616-490e-add7-40f7fdb628b4`) x1; dPrint (`071ba424-3940-4c80-a782-5d7ea4d829ff`) x30

### 16) Tighten the X-axis Belt (`3dprinting/x-belt-tension`)
- Quest link: `/quests/3dprinting/x-belt-tension`
- Unlock prerequisite (`requiresQuests`): `3dprinting/cable-clip`
- Dialogue `requiresItems` gates:
  - Node `tension` / Walk me through each step.: entry-level FDM 3D printer (leveled bed) (`a42e441a-5569-490c-86e4-ce711117cd22`) x1; precision screwdriver set (`8299ac3f-c232-46d4-a007-2ad86ec70361`) x1; safety goggles (`c9b51052-4594-42d7-a723-82b815ab8cc2`) x1
  - Node `tension` / Belt tightened and moving smoothly.: entry-level FDM 3D printer (belt tensioned) (`448e9fbb-8464-4799-956d-cc465a4a8376`) x1
- Grants from dialogue (`grantsItems` on options/steps):
  - None
- Quest-level `grantsItems`: None
- Rewards: cured compost bucket (`b281360b-2ecc-4fea-a248-36a61c5f7399`) x1
- Processes used:
  - [`tighten-x-belt`](/processes/tighten-x-belt)
    - Requires: entry-level FDM 3D printer (leveled bed) (`a42e441a-5569-490c-86e4-ce711117cd22`) x1; precision screwdriver set (`8299ac3f-c232-46d4-a007-2ad86ec70361`) x1; safety goggles (`c9b51052-4594-42d7-a723-82b815ab8cc2`) x1
    - Consumes: None
    - Creates: entry-level FDM 3D printer (belt tensioned) (`448e9fbb-8464-4799-956d-cc465a4a8376`) x1

## QA flow notes

- Cross-quest dependencies are enforced through `requiresQuests` and per-node item gates listed above.
- Progression integrity checks:
  - Verify each quest unlocks only after listed prerequisites are completed.
  - Verify each gated dialogue option appears only when required item counts are met.
  - Verify process outputs satisfy downstream quest gates without requiring unrelated items.
- Known pitfalls to test:
  - Reused processes across quests may require multiple item counts (confirm minimum counts before continue options).
  - If a process is repeatable, ensure “continue” dialogue remains blocked until expected logs/artifacts exist.
- End-to-end validation walkthrough:
  - Complete quests in tree order from the first root quest.
  - At each quest, run every listed process path at least once and confirm resulting inventory deltas.
  - Re-open the next quest and confirm required items and prerequisites are recognized correctly.
