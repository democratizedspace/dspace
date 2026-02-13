---
title: 'Aquaria'
slug: 'aquaria'
---

This page documents the full **Aquaria** quest tree for QA and content validation.
Use it to verify prerequisites, item gates, process IO, and end-to-end progression.

## Quest tree

1. [Set up a Walstad tank](/quests/aquaria/walstad) (`aquaria/walstad`)
2. [Attach Aquarium Thermometer](/quests/aquaria/thermometer) (`aquaria/thermometer`)
3. [Move the Walstad tank](/quests/aquaria/position-tank) (`aquaria/position-tank`)
4. [Install a sponge filter](/quests/aquaria/sponge-filter) (`aquaria/sponge-filter`)
5. [Install an aquarium light](/quests/aquaria/aquarium-light) (`aquaria/aquarium-light`)
6. [Rinse Sponge Filter](/quests/aquaria/filter-rinse) (`aquaria/filter-rinse`)
7. [Install an aquarium heater](/quests/aquaria/heater-install) (`aquaria/heater-install`)
8. [Test water parameters](/quests/aquaria/water-testing) (`aquaria/water-testing`)
9. [Add guppies](/quests/aquaria/guppy) (`aquaria/guppy`)
10. [Log Water Parameters](/quests/aquaria/log-water-parameters) (`aquaria/log-water-parameters`)
11. [Check aquarium pH](/quests/aquaria/ph-strip-test) (`aquaria/ph-strip-test`)
12. [Balance aquarium pH](/quests/aquaria/balance-ph) (`aquaria/balance-ph`)
13. [Add dwarf shrimp](/quests/aquaria/shrimp) (`aquaria/shrimp`)
14. [Add Floating Plants](/quests/aquaria/floating-plants) (`aquaria/floating-plants`)
15. [Breed your guppies](/quests/aquaria/breeding) (`aquaria/breeding`)
16. [Set up an aquarium for a goldfish](/quests/aquaria/goldfish) (`aquaria/goldfish`)
17. [Perform a partial water change](/quests/aquaria/water-change) (`aquaria/water-change`)
18. [Catch a fish with a net](/quests/aquaria/net-fish) (`aquaria/net-fish`)
19. [Top Off Evaporated Water](/quests/aquaria/top-off) (`aquaria/top-off`)

## Quest details

### 1) Set up a Walstad tank (`aquaria/walstad`)
- Quest link: `/quests/aquaria/walstad`
- Unlock prerequisite (`requiresQuests`): `welcome/howtodoquests`
- Dialogue `requiresItems` gates:
  - Node `start` / Yes—show me the steps: aquarium (150 L) (`83fe7eee-135e-4885-9ce0-9042b9fb860a`) x1; aquarium stand (80 L) (`98609b23-4811-4275-8d83-ad59a2797753`) x1; aquarium gravel (1 kg) (`75cec98f-fcf0-4d73-8d31-5a53571317b2`) x3; aquarium LED light (20 W) (`62757412-be94-48c0-a1c0-8fad9bdb8c4a`) x1; Guppy grass starter (`0704e829-ce72-4c7d-91b0-8a774b11575d`) x1; Duckweed portion (`c5a7574e-515f-4e9a-83fc-350703131f25`) x1; 5 gallon bucket (`0564d441-7367-412e-b709-dad770814a39`) x1; Water conditioner (`16eb261b-9d93-4aff-ab31-40f6a78d04f1`) x1
  - Node `stage` / Bucket is dechlorinated and tools are staged: 5 gallon bucket of dechlorinated tap water (`71efa72a-8c87-4dc2-8e2c-9119bb28fe50`) x1
  - Node `build` / Substrate settled and plants look secure: Walstad aquarium (80 L) (`785fa6f3-bb66-4197-a43f-52fea9cebd48`) x1
  - Node `thermo` / Placement marked and glass is dry: Walstad aquarium (80 L) (`785fa6f3-bb66-4197-a43f-52fea9cebd48`) x1
- Grants from dialogue (`grantsItems` on options/steps):
  - None
- Quest-level `grantsItems`: None
- Rewards: cured compost bucket (`b281360b-2ecc-4fea-a248-36a61c5f7399`) x1
- Processes used:
  - [`assemble-walstad-tank`](/processes/assemble-walstad-tank)
    - Requires: aquarium (150 L) (`83fe7eee-135e-4885-9ce0-9042b9fb860a`) x1; aquarium stand (80 L) (`98609b23-4811-4275-8d83-ad59a2797753`) x1; aquarium gravel (1 kg) (`75cec98f-fcf0-4d73-8d31-5a53571317b2`) x3; aquarium LED light (20 W) (`62757412-be94-48c0-a1c0-8fad9bdb8c4a`) x1; Guppy grass starter (`0704e829-ce72-4c7d-91b0-8a774b11575d`) x1; Duckweed portion (`c5a7574e-515f-4e9a-83fc-350703131f25`) x1; 5 gallon bucket of dechlorinated tap water (`71efa72a-8c87-4dc2-8e2c-9119bb28fe50`) x1
    - Consumes: aquarium gravel (1 kg) (`75cec98f-fcf0-4d73-8d31-5a53571317b2`) x3; Guppy grass starter (`0704e829-ce72-4c7d-91b0-8a774b11575d`) x1; Duckweed portion (`c5a7574e-515f-4e9a-83fc-350703131f25`) x1; 5 gallon bucket of dechlorinated tap water (`71efa72a-8c87-4dc2-8e2c-9119bb28fe50`) x1
    - Creates: Walstad aquarium (80 L) (`785fa6f3-bb66-4197-a43f-52fea9cebd48`) x1
  - [`condition-bucket-water`](/processes/condition-bucket-water)
    - Requires: 5 gallon bucket (`0564d441-7367-412e-b709-dad770814a39`) x1; Water conditioner (`16eb261b-9d93-4aff-ab31-40f6a78d04f1`) x1
    - Consumes: Water conditioner (`16eb261b-9d93-4aff-ab31-40f6a78d04f1`) x0.1; 5 gallon bucket of tap water (chlorinated) (`156d06b2-ff10-4265-9ae9-3b7753c0206e`) x1
    - Creates: 5 gallon bucket of dechlorinated tap water (`71efa72a-8c87-4dc2-8e2c-9119bb28fe50`) x1

### 2) Attach Aquarium Thermometer (`aquaria/thermometer`)
- Quest link: `/quests/aquaria/thermometer`
- Unlock prerequisite (`requiresQuests`): `aquaria/walstad`
- Dialogue `requiresItems` gates:
  - Node `start` / Glass is clean and dry: Walstad aquarium (80 L) (`785fa6f3-bb66-4197-a43f-52fea9cebd48`) x1; aquarium thermometer (0–50°C) (`8e81b5e5-4aee-402c-bd04-fed9188f8c07`) x1; paper towel (`b16cd6c7-dfeb-49bf-8758-0cb3563b0d50`) x1
  - Node `attach` / Strip is attached and seated: Walstad aquarium with thermometer (80 L) (`4e8db808-927f-4ac7-9d1f-1c8400c7f5d7`) x1
  - Node `check` / Reading recorded: Aquarium temperature reading (`7f9d9d21-a4f2-4c48-b0e5-9a7483ab05d2`) x1
- Grants from dialogue (`grantsItems` on options/steps):
  - None
- Quest-level `grantsItems`: None
- Rewards: cured compost bucket (`b281360b-2ecc-4fea-a248-36a61c5f7399`) x1
- Processes used:
  - [`attach-aquarium-thermometer`](/processes/attach-aquarium-thermometer)
    - Requires: Walstad aquarium (80 L) (`785fa6f3-bb66-4197-a43f-52fea9cebd48`) x1; aquarium thermometer (0–50°C) (`8e81b5e5-4aee-402c-bd04-fed9188f8c07`) x1; paper towel (`b16cd6c7-dfeb-49bf-8758-0cb3563b0d50`) x1
    - Consumes: aquarium thermometer (0–50°C) (`8e81b5e5-4aee-402c-bd04-fed9188f8c07`) x1; paper towel (`b16cd6c7-dfeb-49bf-8758-0cb3563b0d50`) x1
    - Creates: Walstad aquarium with thermometer (80 L) (`4e8db808-927f-4ac7-9d1f-1c8400c7f5d7`) x1
  - [`log-walstad-temperature`](/processes/log-walstad-temperature)
    - Requires: Walstad aquarium with thermometer (80 L) (`4e8db808-927f-4ac7-9d1f-1c8400c7f5d7`) x1
    - Consumes: None
    - Creates: Aquarium temperature reading (`7f9d9d21-a4f2-4c48-b0e5-9a7483ab05d2`) x1

### 3) Move the Walstad tank (`aquaria/position-tank`)
- Quest link: `/quests/aquaria/position-tank`
- Unlock prerequisite (`requiresQuests`): `aquaria/walstad`, `aquaria/thermometer`
- Dialogue `requiresItems` gates:
  - Node `start` / Yes please, it's heavy.: Walstad aquarium with thermometer (80 L) (`4e8db808-927f-4ac7-9d1f-1c8400c7f5d7`) x1; aquarium stand (80 L) (`98609b23-4811-4275-8d83-ad59a2797753`) x1
  - Node `heat` / Install the heater and set it to 26°C: aquarium heater (150 W) (`0b85f058-38f2-4e9a-93e9-d47441608619`) x1; Walstad aquarium with thermometer (80 L) (`4e8db808-927f-4ac7-9d1f-1c8400c7f5d7`) x1
- Grants from dialogue (`grantsItems` on options/steps):
  - None
- Quest-level `grantsItems`: None
- Rewards: Heated Walstad aquarium (80 L, 26°C) (`8c0f72a2-db79-4238-b80f-97721def169f`) x1
- Processes used:
  - [`heat-walstad`](/processes/heat-walstad)
    - Requires: None
    - Consumes: Walstad aquarium with thermometer (80 L) (`4e8db808-927f-4ac7-9d1f-1c8400c7f5d7`) x1; aquarium heater (150 W) (`0b85f058-38f2-4e9a-93e9-d47441608619`) x1
    - Creates: Heated Walstad aquarium (80 L, 26°C) (`8c0f72a2-db79-4238-b80f-97721def169f`) x1

### 4) Install a sponge filter (`aquaria/sponge-filter`)
- Quest link: `/quests/aquaria/sponge-filter`
- Unlock prerequisite (`requiresQuests`): `aquaria/position-tank`
- Dialogue `requiresItems` gates:
  - Node `start` / Let's prep the rinse gear: Sponge filter (`496b4ebb-43c8-42d7-a921-fc6ee9d6ae56`) x1; Airline tubing (`60e517b4-5807-4983-afb8-e2aad1566587`) x1; aquarium air pump (`5d5e4e29-94b7-4a03-b73d-7420841ae686`) x1; 5 gallon bucket (`0564d441-7367-412e-b709-dad770814a39`) x1; Water conditioner (`16eb261b-9d93-4aff-ab31-40f6a78d04f1`) x1; nitrile gloves (pair) (`997eaba9-25ee-43d5-bbdc-5d6adf03adfa`) x1
  - Node `prep` / Bucket is full of dechlorinated water: 5 gallon bucket of dechlorinated tap water (`71efa72a-8c87-4dc2-8e2c-9119bb28fe50`) x1
  - Node `rinse` / Sponge rinsed and still wet: Rinsed sponge filter core (`606c4f47-ca8f-4458-bc7f-0ab2957ef641`) x1
  - Node `restart` / Flow is restored without splashing: Restored sponge filter flow (`6f08e704-1086-4fef-ad0a-f48922a5cfd0`) x1
- Grants from dialogue (`grantsItems` on options/steps):
  - None
- Quest-level `grantsItems`: None
- Rewards: cured compost bucket (`b281360b-2ecc-4fea-a248-36a61c5f7399`) x1
- Processes used:
  - [`condition-bucket-water`](/processes/condition-bucket-water)
    - Requires: 5 gallon bucket (`0564d441-7367-412e-b709-dad770814a39`) x1; Water conditioner (`16eb261b-9d93-4aff-ab31-40f6a78d04f1`) x1
    - Consumes: Water conditioner (`16eb261b-9d93-4aff-ab31-40f6a78d04f1`) x0.1; 5 gallon bucket of tap water (chlorinated) (`156d06b2-ff10-4265-9ae9-3b7753c0206e`) x1
    - Creates: 5 gallon bucket of dechlorinated tap water (`71efa72a-8c87-4dc2-8e2c-9119bb28fe50`) x1
  - [`restart-sponge-filter`](/processes/restart-sponge-filter)
    - Requires: Rinsed sponge filter core (`606c4f47-ca8f-4458-bc7f-0ab2957ef641`) x1; aquarium air pump (`5d5e4e29-94b7-4a03-b73d-7420841ae686`) x1; Airline tubing (`60e517b4-5807-4983-afb8-e2aad1566587`) x1
    - Consumes: Rinsed sponge filter core (`606c4f47-ca8f-4458-bc7f-0ab2957ef641`) x1
    - Creates: Restored sponge filter flow (`6f08e704-1086-4fef-ad0a-f48922a5cfd0`) x1
  - [`rinse-aquarium-filter`](/processes/rinse-aquarium-filter)
    - Requires: Sponge filter (`496b4ebb-43c8-42d7-a921-fc6ee9d6ae56`) x1; 5 gallon bucket of dechlorinated tap water (`71efa72a-8c87-4dc2-8e2c-9119bb28fe50`) x1; nitrile gloves (pair) (`997eaba9-25ee-43d5-bbdc-5d6adf03adfa`) x1
    - Consumes: 5 gallon bucket of dechlorinated tap water (`71efa72a-8c87-4dc2-8e2c-9119bb28fe50`) x1
    - Creates: Rinsed sponge filter core (`606c4f47-ca8f-4458-bc7f-0ab2957ef641`) x1

### 5) Install an aquarium light (`aquaria/aquarium-light`)
- Quest link: `/quests/aquaria/aquarium-light`
- Unlock prerequisite (`requiresQuests`): `aquaria/sponge-filter`
- Dialogue `requiresItems` gates:
  - Node `mount` / Light secured.: aquarium LED light (20 W) (`62757412-be94-48c0-a1c0-8fad9bdb8c4a`) x1
- Grants from dialogue (`grantsItems` on options/steps):
  - None
- Quest-level `grantsItems`: None
- Rewards: Duckweed portion (`c5a7574e-515f-4e9a-83fc-350703131f25`) x1
- Processes used:
  - None

### 6) Rinse Sponge Filter (`aquaria/filter-rinse`)
- Quest link: `/quests/aquaria/filter-rinse`
- Unlock prerequisite (`requiresQuests`): `aquaria/sponge-filter`
- Dialogue `requiresItems` gates:
  - Node `start` / Bucket's ready and the pump is unplugged.: 5 gallon bucket of dechlorinated tap water (`71efa72a-8c87-4dc2-8e2c-9119bb28fe50`) x1; Sponge filter (`496b4ebb-43c8-42d7-a921-fc6ee9d6ae56`) x1; aquarium air pump (`5d5e4e29-94b7-4a03-b73d-7420841ae686`) x1; nitrile gloves (pair) (`997eaba9-25ee-43d5-bbdc-5d6adf03adfa`) x1
  - Node `prep` / Squeeze the sponge only in dechlorinated water.: Sponge filter (`496b4ebb-43c8-42d7-a921-fc6ee9d6ae56`) x1; 5 gallon bucket of dechlorinated tap water (`71efa72a-8c87-4dc2-8e2c-9119bb28fe50`) x1; nitrile gloves (pair) (`997eaba9-25ee-43d5-bbdc-5d6adf03adfa`) x1
  - Node `prep` / Media is rinsed and still wet.: Rinsed sponge filter core (`606c4f47-ca8f-4458-bc7f-0ab2957ef641`) x1
  - Node `restart` / Prime the air line and restart the flow.: Rinsed sponge filter core (`606c4f47-ca8f-4458-bc7f-0ab2957ef641`) x1; Airline tubing (`60e517b4-5807-4983-afb8-e2aad1566587`) x1; aquarium air pump (`5d5e4e29-94b7-4a03-b73d-7420841ae686`) x1
  - Node `restart` / Flow is restored without blasting the inhabitants.: Restored sponge filter flow (`6f08e704-1086-4fef-ad0a-f48922a5cfd0`) x1
- Grants from dialogue (`grantsItems` on options/steps):
  - None
- Quest-level `grantsItems`: None
- Rewards: cured compost bucket (`b281360b-2ecc-4fea-a248-36a61c5f7399`) x1
- Processes used:
  - [`bucket-water-dechlorinated`](/processes/bucket-water-dechlorinated)
    - Requires: None
    - Consumes: 5 gallon bucket of tap water (chlorinated) (`156d06b2-ff10-4265-9ae9-3b7753c0206e`) x1
    - Creates: 5 gallon bucket of dechlorinated tap water (`71efa72a-8c87-4dc2-8e2c-9119bb28fe50`) x1
  - [`restart-sponge-filter`](/processes/restart-sponge-filter)
    - Requires: Rinsed sponge filter core (`606c4f47-ca8f-4458-bc7f-0ab2957ef641`) x1; aquarium air pump (`5d5e4e29-94b7-4a03-b73d-7420841ae686`) x1; Airline tubing (`60e517b4-5807-4983-afb8-e2aad1566587`) x1
    - Consumes: Rinsed sponge filter core (`606c4f47-ca8f-4458-bc7f-0ab2957ef641`) x1
    - Creates: Restored sponge filter flow (`6f08e704-1086-4fef-ad0a-f48922a5cfd0`) x1
  - [`rinse-aquarium-filter`](/processes/rinse-aquarium-filter)
    - Requires: Sponge filter (`496b4ebb-43c8-42d7-a921-fc6ee9d6ae56`) x1; 5 gallon bucket of dechlorinated tap water (`71efa72a-8c87-4dc2-8e2c-9119bb28fe50`) x1; nitrile gloves (pair) (`997eaba9-25ee-43d5-bbdc-5d6adf03adfa`) x1
    - Consumes: 5 gallon bucket of dechlorinated tap water (`71efa72a-8c87-4dc2-8e2c-9119bb28fe50`) x1
    - Creates: Rinsed sponge filter core (`606c4f47-ca8f-4458-bc7f-0ab2957ef641`) x1

### 7) Install an aquarium heater (`aquaria/heater-install`)
- Quest link: `/quests/aquaria/heater-install`
- Unlock prerequisite (`requiresQuests`): `aquaria/sponge-filter`, `aquaria/thermometer`, `aquaria/walstad`
- Dialogue `requiresItems` gates:
  - Node `start` / Tank is ready for heat: Walstad aquarium with thermometer (80 L) (`4e8db808-927f-4ac7-9d1f-1c8400c7f5d7`) x1; aquarium heater (150 W) (`0b85f058-38f2-4e9a-93e9-d47441608619`) x1; Restored sponge filter flow (`6f08e704-1086-4fef-ad0a-f48922a5cfd0`) x1
  - Node `mount` / Heater installed and powered on: Heated Walstad aquarium (80 L, 26°C) (`8c0f72a2-db79-4238-b80f-97721def169f`) x1
  - Node `verify` / Reading recorded and steady: Aquarium temperature reading (`7f9d9d21-a4f2-4c48-b0e5-9a7483ab05d2`) x1
- Grants from dialogue (`grantsItems` on options/steps):
  - None
- Quest-level `grantsItems`: None
- Rewards: cured compost bucket (`b281360b-2ecc-4fea-a248-36a61c5f7399`) x1
- Processes used:
  - [`heat-walstad`](/processes/heat-walstad)
    - Requires: None
    - Consumes: Walstad aquarium with thermometer (80 L) (`4e8db808-927f-4ac7-9d1f-1c8400c7f5d7`) x1; aquarium heater (150 W) (`0b85f058-38f2-4e9a-93e9-d47441608619`) x1
    - Creates: Heated Walstad aquarium (80 L, 26°C) (`8c0f72a2-db79-4238-b80f-97721def169f`) x1
  - [`log-walstad-temperature`](/processes/log-walstad-temperature)
    - Requires: Walstad aquarium with thermometer (80 L) (`4e8db808-927f-4ac7-9d1f-1c8400c7f5d7`) x1
    - Consumes: None
    - Creates: Aquarium temperature reading (`7f9d9d21-a4f2-4c48-b0e5-9a7483ab05d2`) x1

### 8) Test water parameters (`aquaria/water-testing`)
- Quest link: `/quests/aquaria/water-testing`
- Unlock prerequisite (`requiresQuests`): `aquaria/thermometer`
- Dialogue `requiresItems` gates:
  - Node `explain` / Okay, I'll test now.: Aquarium liquid test kit (`8d30133e-0fbb-4e0f-845b-44d721a1f6b2`) x1; nitrile gloves (pair) (`997eaba9-25ee-43d5-bbdc-5d6adf03adfa`) x1; safety goggles (`c9b51052-4594-42d7-a723-82b815ab8cc2`) x1; water test logbook (`b8602362-2035-4f00-9376-f48d8668cf38`) x1
  - Node `results` / Nitrate is high—start a partial water change.: Heated Walstad aquarium (80 L, 26°C) (`8c0f72a2-db79-4238-b80f-97721def169f`) x1; gravel vacuum (`97317bc3-507a-4e2c-912b-507d586cee87`) x1; 5 gallon bucket (`0564d441-7367-412e-b709-dad770814a39`) x1; 5 gallon bucket of dechlorinated tap water (`71efa72a-8c87-4dc2-8e2c-9119bb28fe50`) x1; aquarium thermometer (0–50°C) (`8e81b5e5-4aee-402c-bd04-fed9188f8c07`) x1
- Grants from dialogue (`grantsItems` on options/steps):
  - None
- Quest-level `grantsItems`: None
- Rewards: Duckweed portion (`c5a7574e-515f-4e9a-83fc-350703131f25`) x1
- Processes used:
  - [`partial-water-change`](/processes/partial-water-change)
    - Requires: Heated Walstad aquarium (80 L, 26°C) (`8c0f72a2-db79-4238-b80f-97721def169f`) x1; gravel vacuum (`97317bc3-507a-4e2c-912b-507d586cee87`) x1; 5 gallon bucket (`0564d441-7367-412e-b709-dad770814a39`) x1; 5 gallon bucket of dechlorinated tap water (`71efa72a-8c87-4dc2-8e2c-9119bb28fe50`) x1
    - Consumes: 5 gallon bucket of dechlorinated tap water (`71efa72a-8c87-4dc2-8e2c-9119bb28fe50`) x0.25
    - Creates: Freshly changed aquarium (80 L) (`bc8ff31b-7c20-4c05-9af0-e3530d90fe3f`) x1

### 9) Add guppies (`aquaria/guppy`)
- Quest link: `/quests/aquaria/guppy`
- Unlock prerequisite (`requiresQuests`): `aquaria/water-testing`, `aquaria/heater-install`
- Dialogue `requiresItems` gates:
  - Node `start` / Tank is at guppy-friendly temperature.: Heated Walstad aquarium (80 L, 26°C) (`8c0f72a2-db79-4238-b80f-97721def169f`) x1
  - Node `release` / Guppies are now in the tank.: Heated Walstad aquarium with guppies (80 L, 26°C) (`21247ab3-427f-4448-8b68-4d8ad742cb7a`) x1
- Grants from dialogue (`grantsItems` on options/steps):
  - None
- Quest-level `grantsItems`: None
- Rewards: Heated Walstad aquarium with guppies (80 L, 26°C) (`21247ab3-427f-4448-8b68-4d8ad742cb7a`) x1
- Processes used:
  - [`heat-walstad`](/processes/heat-walstad)
    - Requires: None
    - Consumes: Walstad aquarium with thermometer (80 L) (`4e8db808-927f-4ac7-9d1f-1c8400c7f5d7`) x1; aquarium heater (150 W) (`0b85f058-38f2-4e9a-93e9-d47441608619`) x1
    - Creates: Heated Walstad aquarium (80 L, 26°C) (`8c0f72a2-db79-4238-b80f-97721def169f`) x1
  - [`stock-guppies`](/processes/stock-guppies)
    - Requires: None
    - Consumes: Heated Walstad aquarium (80 L, 26°C) (`8c0f72a2-db79-4238-b80f-97721def169f`) x1; Guppy group (`3f1cc002-1f7a-4301-a1c6-343f65e7f21a`) x1
    - Creates: Heated Walstad aquarium with guppies (80 L, 26°C) (`21247ab3-427f-4448-8b68-4d8ad742cb7a`) x1

### 10) Log Water Parameters (`aquaria/log-water-parameters`)
- Quest link: `/quests/aquaria/log-water-parameters`
- Unlock prerequisite (`requiresQuests`): `aquaria/water-testing`
- Dialogue `requiresItems` gates:
  - Node `start` / Bench is clear and kit is open.: Aquarium liquid test kit (`8d30133e-0fbb-4e0f-845b-44d721a1f6b2`) x1; nitrile gloves (pair) (`997eaba9-25ee-43d5-bbdc-5d6adf03adfa`) x1
  - Node `measure` / Run the liquid tests.: Aquarium liquid test kit (`8d30133e-0fbb-4e0f-845b-44d721a1f6b2`) x1; nitrile gloves (pair) (`997eaba9-25ee-43d5-bbdc-5d6adf03adfa`) x1
  - Node `measure` / Readings are ready to log.: Liquid test readings (`9748fccc-ec16-4664-982e-c79b1c082e5e`) x1
  - Node `log` / Record the results in the logbook.: Aquarium liquid test kit (`8d30133e-0fbb-4e0f-845b-44d721a1f6b2`) x1; Liquid test readings (`9748fccc-ec16-4664-982e-c79b1c082e5e`) x1; water test logbook (`b8602362-2035-4f00-9376-f48d8668cf38`) x1; nitrile gloves (pair) (`997eaba9-25ee-43d5-bbdc-5d6adf03adfa`) x1
  - Node `log` / Entry logged with today's readings.: Logged water parameters (`9c60b34c-f0f0-4ed4-b490-e1d781ecb83c`) x1
- Grants from dialogue (`grantsItems` on options/steps):
  - None
- Quest-level `grantsItems`: None
- Rewards: cured compost bucket (`b281360b-2ecc-4fea-a248-36a61c5f7399`) x1
- Processes used:
  - [`log-aquarium-test-results`](/processes/log-aquarium-test-results)
    - Requires: Aquarium liquid test kit (`8d30133e-0fbb-4e0f-845b-44d721a1f6b2`) x1; Liquid test readings (`9748fccc-ec16-4664-982e-c79b1c082e5e`) x1; water test logbook (`b8602362-2035-4f00-9376-f48d8668cf38`) x1; nitrile gloves (pair) (`997eaba9-25ee-43d5-bbdc-5d6adf03adfa`) x1
    - Consumes: Liquid test readings (`9748fccc-ec16-4664-982e-c79b1c082e5e`) x1
    - Creates: Logged water parameters (`9c60b34c-f0f0-4ed4-b490-e1d781ecb83c`) x1
  - [`measure-liquid-parameters`](/processes/measure-liquid-parameters)
    - Requires: Aquarium liquid test kit (`8d30133e-0fbb-4e0f-845b-44d721a1f6b2`) x1; nitrile gloves (pair) (`997eaba9-25ee-43d5-bbdc-5d6adf03adfa`) x1
    - Consumes: Aquarium liquid test kit (`8d30133e-0fbb-4e0f-845b-44d721a1f6b2`) x0.05
    - Creates: Liquid test readings (`9748fccc-ec16-4664-982e-c79b1c082e5e`) x1

### 11) Check aquarium pH (`aquaria/ph-strip-test`)
- Quest link: `/quests/aquaria/ph-strip-test`
- Unlock prerequisite (`requiresQuests`): `aquaria/water-testing`
- Dialogue `requiresItems` gates:
  - Node `start` / Strip and gloves ready.: pH strip (`13167d6a-5617-4931-8a6e-6f463c6b8835`) x1; nitrile gloves (pair) (`997eaba9-25ee-43d5-bbdc-5d6adf03adfa`) x1
  - Node `dip` / Dip and read the strip.: pH strip (`13167d6a-5617-4931-8a6e-6f463c6b8835`) x1; nitrile gloves (pair) (`997eaba9-25ee-43d5-bbdc-5d6adf03adfa`) x1
  - Node `dip` / Reading recorded from the strip.: Aquarium pH reading (`2d1b7889-b28c-4970-8be9-5de092cfd4d9`) x1
  - Node `log` / Write it in the logbook.: Aquarium pH reading (`2d1b7889-b28c-4970-8be9-5de092cfd4d9`) x1; water test logbook (`b8602362-2035-4f00-9376-f48d8668cf38`) x1
  - Node `log` / Entry logged and dated.: Logged pH entry (`9c392043-4067-4f49-8038-38eef00e0b24`) x1
- Grants from dialogue (`grantsItems` on options/steps):
  - Node `start` / I need a strip.: pH strip (`13167d6a-5617-4931-8a6e-6f463c6b8835`) x1
- Quest-level `grantsItems`: None
- Rewards: cured compost bucket (`b281360b-2ecc-4fea-a248-36a61c5f7399`) x1
- Processes used:
  - [`log-aquarium-ph-reading`](/processes/log-aquarium-ph-reading)
    - Requires: Aquarium pH reading (`2d1b7889-b28c-4970-8be9-5de092cfd4d9`) x1; water test logbook (`b8602362-2035-4f00-9376-f48d8668cf38`) x1; nitrile gloves (pair) (`997eaba9-25ee-43d5-bbdc-5d6adf03adfa`) x1
    - Consumes: Aquarium pH reading (`2d1b7889-b28c-4970-8be9-5de092cfd4d9`) x1
    - Creates: Logged pH entry (`9c392043-4067-4f49-8038-38eef00e0b24`) x1
  - [`measure-aquarium-ph`](/processes/measure-aquarium-ph)
    - Requires: pH strip (`13167d6a-5617-4931-8a6e-6f463c6b8835`) x1; nitrile gloves (pair) (`997eaba9-25ee-43d5-bbdc-5d6adf03adfa`) x1
    - Consumes: pH strip (`13167d6a-5617-4931-8a6e-6f463c6b8835`) x1
    - Creates: Aquarium pH reading (`2d1b7889-b28c-4970-8be9-5de092cfd4d9`) x1

### 12) Balance aquarium pH (`aquaria/balance-ph`)
- Quest link: `/quests/aquaria/balance-ph`
- Unlock prerequisite (`requiresQuests`): `aquaria/ph-strip-test`
- Dialogue `requiresItems` gates:
  - Node `verify` / pH stable: pH strip (`13167d6a-5617-4931-8a6e-6f463c6b8835`) x1
- Grants from dialogue (`grantsItems` on options/steps):
  - None
- Quest-level `grantsItems`: None
- Rewards: cured compost bucket (`b281360b-2ecc-4fea-a248-36a61c5f7399`) x1
- Processes used:
  - [`adjust-ph`](/processes/adjust-ph)
    - Requires: nitrile gloves (pair) (`997eaba9-25ee-43d5-bbdc-5d6adf03adfa`) x1; safety goggles (`c9b51052-4594-42d7-a723-82b815ab8cc2`) x1; glass stir rod (`c46e98b4-0c1a-478b-988c-8c9260dce434`) x1; pH down solution (500 mL) (`d5fbffe6-7e22-4cbc-84d3-f8f5bf023d04`) x1; pH up solution (potassium carbonate) (`9cdd41b1-392e-40c2-8072-0c1351b1a26b`) x1
    - Consumes: pH down solution (500 mL) (`d5fbffe6-7e22-4cbc-84d3-f8f5bf023d04`) x0.05; pH up solution (potassium carbonate) (`9cdd41b1-392e-40c2-8072-0c1351b1a26b`) x0.05
    - Creates: None

### 13) Add dwarf shrimp (`aquaria/shrimp`)
- Quest link: `/quests/aquaria/shrimp`
- Unlock prerequisite (`requiresQuests`): `aquaria/ph-strip-test`, `aquaria/heater-install`, `aquaria/log-water-parameters`
- Dialogue `requiresItems` gates:
  - Node `start` / Sounds good!: Aquarium liquid test kit (`8d30133e-0fbb-4e0f-845b-44d721a1f6b2`) x1
  - Node `acclimate` / Start drip acclimation: Airline tubing (`60e517b4-5807-4983-afb8-e2aad1566587`) x1; 5 gallon bucket (`0564d441-7367-412e-b709-dad770814a39`) x1
  - Node `release` / Shrimp are in and exploring!: aquarium net (`ee7d437d-7426-47cd-b691-386dd20f4e47`) x1
- Grants from dialogue (`grantsItems` on options/steps):
  - None
- Quest-level `grantsItems`: None
- Rewards: Dwarf shrimp (`b494f643-a77a-4edf-be7e-5f7ff2dfba6a`) x3
- Processes used:
  - [`drip-acclimate-shrimp`](/processes/drip-acclimate-shrimp)
    - Requires: Airline tubing (`60e517b4-5807-4983-afb8-e2aad1566587`) x1; 5 gallon bucket (`0564d441-7367-412e-b709-dad770814a39`) x1; Dwarf shrimp (`b494f643-a77a-4edf-be7e-5f7ff2dfba6a`) x1; Walstad aquarium (80 L) (`785fa6f3-bb66-4197-a43f-52fea9cebd48`) x1
    - Consumes: None
    - Creates: None

### 14) Add Floating Plants (`aquaria/floating-plants`)
- Quest link: `/quests/aquaria/floating-plants`
- Unlock prerequisite (`requiresQuests`): `aquaria/shrimp`
- Dialogue `requiresItems` gates:
  - Node `start` / Bucket, net, and guppy grass ready.: Guppy grass starter (`0704e829-ce72-4c7d-91b0-8a774b11575d`) x1; 5 gallon bucket of dechlorinated tap water (`71efa72a-8c87-4dc2-8e2c-9119bb28fe50`) x1; aquarium net (`ee7d437d-7426-47cd-b691-386dd20f4e47`) x1; nitrile gloves (pair) (`997eaba9-25ee-43d5-bbdc-5d6adf03adfa`) x1
  - Node `rinse` / Rinse and inspect the plants.: Guppy grass starter (`0704e829-ce72-4c7d-91b0-8a774b11575d`) x1; 5 gallon bucket of dechlorinated tap water (`71efa72a-8c87-4dc2-8e2c-9119bb28fe50`) x1; aquarium net (`ee7d437d-7426-47cd-b691-386dd20f4e47`) x1; nitrile gloves (pair) (`997eaba9-25ee-43d5-bbdc-5d6adf03adfa`) x1
  - Node `rinse` / Rinsed bundle ready for the tank.: Rinsed guppy grass (`c1f5f126-ad6b-4ba8-86ad-5598fb5038e9`) x1
  - Node `place` / Float and spread the guppy grass.: Rinsed guppy grass (`c1f5f126-ad6b-4ba8-86ad-5598fb5038e9`) x1; aquarium LED light (20 W) (`62757412-be94-48c0-a1c0-8fad9bdb8c4a`) x1
  - Node `place` / Mat is floating and clear of the intake.: Floating plant mat (`1bdcb22a-17e2-42f8-b990-b842f9684169`) x1
- Grants from dialogue (`grantsItems` on options/steps):
  - None
- Quest-level `grantsItems`: None
- Rewards: cured compost bucket (`b281360b-2ecc-4fea-a248-36a61c5f7399`) x1
- Processes used:
  - [`bucket-water-dechlorinated`](/processes/bucket-water-dechlorinated)
    - Requires: None
    - Consumes: 5 gallon bucket of tap water (chlorinated) (`156d06b2-ff10-4265-9ae9-3b7753c0206e`) x1
    - Creates: 5 gallon bucket of dechlorinated tap water (`71efa72a-8c87-4dc2-8e2c-9119bb28fe50`) x1
  - [`place-floating-plants`](/processes/place-floating-plants)
    - Requires: Rinsed guppy grass (`c1f5f126-ad6b-4ba8-86ad-5598fb5038e9`) x1; aquarium LED light (20 W) (`62757412-be94-48c0-a1c0-8fad9bdb8c4a`) x1
    - Consumes: Rinsed guppy grass (`c1f5f126-ad6b-4ba8-86ad-5598fb5038e9`) x1
    - Creates: Floating plant mat (`1bdcb22a-17e2-42f8-b990-b842f9684169`) x1
  - [`rinse-floating-plants`](/processes/rinse-floating-plants)
    - Requires: Guppy grass starter (`0704e829-ce72-4c7d-91b0-8a774b11575d`) x1; 5 gallon bucket of dechlorinated tap water (`71efa72a-8c87-4dc2-8e2c-9119bb28fe50`) x1; aquarium net (`ee7d437d-7426-47cd-b691-386dd20f4e47`) x1; nitrile gloves (pair) (`997eaba9-25ee-43d5-bbdc-5d6adf03adfa`) x1
    - Consumes: Guppy grass starter (`0704e829-ce72-4c7d-91b0-8a774b11575d`) x1; 5 gallon bucket of dechlorinated tap water (`71efa72a-8c87-4dc2-8e2c-9119bb28fe50`) x1
    - Creates: Rinsed guppy grass (`c1f5f126-ad6b-4ba8-86ad-5598fb5038e9`) x1

### 15) Breed your guppies (`aquaria/breeding`)
- Quest link: `/quests/aquaria/breeding`
- Unlock prerequisite (`requiresQuests`): `aquaria/guppy`, `aquaria/floating-plants`
- Dialogue `requiresItems` gates:
  - Node `start` / Floating mat and warm tank are ready.: Heated Walstad aquarium with guppies (80 L, 26°C) (`21247ab3-427f-4448-8b68-4d8ad742cb7a`) x1; Floating plant mat (`1bdcb22a-17e2-42f8-b990-b842f9684169`) x1
  - Node `cover` / Thicken the floating cover.: Heated Walstad aquarium with guppies (80 L, 26°C) (`21247ab3-427f-4448-8b68-4d8ad742cb7a`) x1; Floating plant mat (`1bdcb22a-17e2-42f8-b990-b842f9684169`) x1; Hornwort cuttings (`a7ba3f18-510d-47cb-b73f-91b8e2a72e73`) x1
  - Node `cover` / Cover is dense and sheltering the fry.: Dense fry cover (`bda9e450-499d-41d6-ab32-df73528dc68f`) x1
  - Node `feed` / Powder a week's worth of fry food.: goldfish food (`8807f2f1-3ca2-48da-9b2b-1915604a63e2`) x1
  - Node `feed` / Feed and watch them grow out.: Dense fry cover (`bda9e450-499d-41d6-ab32-df73528dc68f`) x1; Fry food pinch (`eb0f7f00-98dc-44b0-bf7c-9c8d998cbbcb`) x1; Heated Walstad aquarium with guppies (80 L, 26°C) (`21247ab3-427f-4448-8b68-4d8ad742cb7a`) x1; aquarium thermometer (0–50°C) (`8e81b5e5-4aee-402c-bd04-fed9188f8c07`) x1
  - Node `feed` / Juveniles are ready to rehome.: Juvenile guppy brood (`18a20f4e-a351-448e-837b-3caca90f71f4`) x1
- Grants from dialogue (`grantsItems` on options/steps):
  - Node `start` / Send extra stems to weave in.: Guppy grass starter (`0704e829-ce72-4c7d-91b0-8a774b11575d`) x1; Hornwort cuttings (`a7ba3f18-510d-47cb-b73f-91b8e2a72e73`) x1
- Quest-level `grantsItems`: None
- Rewards: cured compost bucket (`b281360b-2ecc-4fea-a248-36a61c5f7399`) x1
- Processes used:
  - [`portion-fry-food`](/processes/portion-fry-food)
    - Requires: goldfish food (`8807f2f1-3ca2-48da-9b2b-1915604a63e2`) x1
    - Consumes: goldfish food (`8807f2f1-3ca2-48da-9b2b-1915604a63e2`) x0.5
    - Creates: Fry food pinch (`eb0f7f00-98dc-44b0-bf7c-9c8d998cbbcb`) x1
  - [`prepare-guppy-fry-cover`](/processes/prepare-guppy-fry-cover)
    - Requires: Heated Walstad aquarium with guppies (80 L, 26°C) (`21247ab3-427f-4448-8b68-4d8ad742cb7a`) x1; Floating plant mat (`1bdcb22a-17e2-42f8-b990-b842f9684169`) x1; Hornwort cuttings (`a7ba3f18-510d-47cb-b73f-91b8e2a72e73`) x1
    - Consumes: Floating plant mat (`1bdcb22a-17e2-42f8-b990-b842f9684169`) x1; Hornwort cuttings (`a7ba3f18-510d-47cb-b73f-91b8e2a72e73`) x1
    - Creates: Dense fry cover (`bda9e450-499d-41d6-ab32-df73528dc68f`) x1
  - [`raise-guppy-fry`](/processes/raise-guppy-fry)
    - Requires: Dense fry cover (`bda9e450-499d-41d6-ab32-df73528dc68f`) x1; Fry food pinch (`eb0f7f00-98dc-44b0-bf7c-9c8d998cbbcb`) x1; Heated Walstad aquarium with guppies (80 L, 26°C) (`21247ab3-427f-4448-8b68-4d8ad742cb7a`) x1; aquarium thermometer (0–50°C) (`8e81b5e5-4aee-402c-bd04-fed9188f8c07`) x1
    - Consumes: Fry food pinch (`eb0f7f00-98dc-44b0-bf7c-9c8d998cbbcb`) x1
    - Creates: Juvenile guppy brood (`18a20f4e-a351-448e-837b-3caca90f71f4`) x1

### 16) Set up an aquarium for a goldfish (`aquaria/goldfish`)
- Quest link: `/quests/aquaria/goldfish`
- Unlock prerequisite (`requiresQuests`): `welcome/howtodoquests`, `aquaria/breeding`
- Dialogue `requiresItems` gates:
  - Node `setup` / Aquarium is fully set up! Time to add the fish, right?: 7 pH freshwater aquarium (150 L) (`ca7c1069-4ba3-4339-9a10-0b690a690e60`) x1
  - Node `fish` / I'm so excited to have a fish! Thanks for all your help!: aquarium (goldfish) (150 L) (`76307a8e-4e0e-4dfa-abc2-7917d384d82c`) x1
- Grants from dialogue (`grantsItems` on options/steps):
  - Node `setup` / Mmm, tasty!: 5 gallon bucket of dechlorinated tap water (`71efa72a-8c87-4dc2-8e2c-9119bb28fe50`) x1
- Quest-level `grantsItems`: None
- Rewards: Fish Friend Award (`a07b75e3-f828-4cb1-81d6-1ab0e9857a79`) x1
- Processes used:
  - [`add-goldfish`](/processes/add-goldfish)
    - Requires: aquarium net (`ee7d437d-7426-47cd-b691-386dd20f4e47`) x1
    - Consumes: 7 pH freshwater aquarium (150 L) (`ca7c1069-4ba3-4339-9a10-0b690a690e60`) x1; goldfish (`40920981-bf9f-4b89-b887-bebe7006f7dc`) x1
    - Creates: aquarium (goldfish) (150 L) (`76307a8e-4e0e-4dfa-abc2-7917d384d82c`) x1
  - [`check-aquarium-temperature`](/processes/check-aquarium-temperature)
    - Requires: 7 pH freshwater aquarium (150 L) (`ca7c1069-4ba3-4339-9a10-0b690a690e60`) x1; aquarium thermometer (0–50°C) (`8e81b5e5-4aee-402c-bd04-fed9188f8c07`) x1
    - Consumes: None
    - Creates: None
  - [`feed-goldfish`](/processes/feed-goldfish)
    - Requires: aquarium (goldfish) (150 L) (`76307a8e-4e0e-4dfa-abc2-7917d384d82c`) x1
    - Consumes: goldfish food (`8807f2f1-3ca2-48da-9b2b-1915604a63e2`) x0.1
    - Creates: dGoldfish (`36a1168f-0109-4a8c-b70b-45f8ca582297`) x1
  - [`prepare-aquarium`](/processes/prepare-aquarium)
    - Requires: None
    - Consumes: aquarium (150 L) (`83fe7eee-135e-4885-9ce0-9042b9fb860a`) x1; 5 gallon bucket of dechlorinated tap water (`71efa72a-8c87-4dc2-8e2c-9119bb28fe50`) x1; Sponge filter (`496b4ebb-43c8-42d7-a921-fc6ee9d6ae56`) x1; aquarium heater (150 W) (`0b85f058-38f2-4e9a-93e9-d47441608619`) x1; aquarium LED light (20 W) (`62757412-be94-48c0-a1c0-8fad9bdb8c4a`) x1; aquarium thermometer (0–50°C) (`8e81b5e5-4aee-402c-bd04-fed9188f8c07`) x1; aquarium gravel (1 kg) (`75cec98f-fcf0-4d73-8d31-5a53571317b2`) x20
    - Creates: 5 gallon bucket (`0564d441-7367-412e-b709-dad770814a39`) x1; 7 pH freshwater aquarium (150 L) (`ca7c1069-4ba3-4339-9a10-0b690a690e60`) x1

### 17) Perform a partial water change (`aquaria/water-change`)
- Quest link: `/quests/aquaria/water-change`
- Unlock prerequisite (`requiresQuests`): `aquaria/guppy`
- Dialogue `requiresItems` gates:
  - Node `start` / Gear gathered and tank is safe to work: Heated Walstad aquarium (80 L, 26°C) (`8c0f72a2-db79-4238-b80f-97721def169f`) x1; gravel vacuum (`97317bc3-507a-4e2c-912b-507d586cee87`) x1; 5 gallon bucket (`0564d441-7367-412e-b709-dad770814a39`) x1; Water conditioner (`16eb261b-9d93-4aff-ab31-40f6a78d04f1`) x1; nitrile gloves (pair) (`997eaba9-25ee-43d5-bbdc-5d6adf03adfa`) x1; utility cart (`d7d7f91c-7c51-4fd0-bdd1-f8d25d4f03e0`) x1
  - Node `prep` / Replacement water is conditioned and matched: 5 gallon bucket of dechlorinated tap water (`71efa72a-8c87-4dc2-8e2c-9119bb28fe50`) x1
  - Node `remove` / Water swapped and heater restarted: Freshly changed aquarium (80 L) (`bc8ff31b-7c20-4c05-9af0-e3530d90fe3f`) x1
- Grants from dialogue (`grantsItems` on options/steps):
  - None
- Quest-level `grantsItems`: None
- Rewards: cured compost bucket (`b281360b-2ecc-4fea-a248-36a61c5f7399`) x1
- Processes used:
  - [`condition-bucket-water`](/processes/condition-bucket-water)
    - Requires: 5 gallon bucket (`0564d441-7367-412e-b709-dad770814a39`) x1; Water conditioner (`16eb261b-9d93-4aff-ab31-40f6a78d04f1`) x1
    - Consumes: Water conditioner (`16eb261b-9d93-4aff-ab31-40f6a78d04f1`) x0.1; 5 gallon bucket of tap water (chlorinated) (`156d06b2-ff10-4265-9ae9-3b7753c0206e`) x1
    - Creates: 5 gallon bucket of dechlorinated tap water (`71efa72a-8c87-4dc2-8e2c-9119bb28fe50`) x1
  - [`partial-water-change`](/processes/partial-water-change)
    - Requires: Heated Walstad aquarium (80 L, 26°C) (`8c0f72a2-db79-4238-b80f-97721def169f`) x1; gravel vacuum (`97317bc3-507a-4e2c-912b-507d586cee87`) x1; 5 gallon bucket (`0564d441-7367-412e-b709-dad770814a39`) x1; 5 gallon bucket of dechlorinated tap water (`71efa72a-8c87-4dc2-8e2c-9119bb28fe50`) x1
    - Consumes: 5 gallon bucket of dechlorinated tap water (`71efa72a-8c87-4dc2-8e2c-9119bb28fe50`) x0.25
    - Creates: Freshly changed aquarium (80 L) (`bc8ff31b-7c20-4c05-9af0-e3530d90fe3f`) x1

### 18) Catch a fish with a net (`aquaria/net-fish`)
- Quest link: `/quests/aquaria/net-fish`
- Unlock prerequisite (`requiresQuests`): `aquaria/water-change`
- Dialogue `requiresItems` gates:
  - Node `catch` / Fish is secure in the bucket.: aquarium net (`ee7d437d-7426-47cd-b691-386dd20f4e47`) x1
- Grants from dialogue (`grantsItems` on options/steps):
  - None
- Quest-level `grantsItems`: None
- Rewards: cured compost bucket (`b281360b-2ecc-4fea-a248-36a61c5f7399`) x1
- Processes used:
  - `catch-fish` (process definition not found)
  - `return-fish` (process definition not found)

### 19) Top Off Evaporated Water (`aquaria/top-off`)
- Quest link: `/quests/aquaria/top-off`
- Unlock prerequisite (`requiresQuests`): `aquaria/water-change`
- Dialogue `requiresItems` gates:
  - Node `start` / Setup done.: gravel vacuum (`97317bc3-507a-4e2c-912b-507d586cee87`) x1; 5 gallon bucket (`0564d441-7367-412e-b709-dad770814a39`) x2
- Grants from dialogue (`grantsItems` on options/steps):
  - None
- Quest-level `grantsItems`: None
- Rewards: cured compost bucket (`b281360b-2ecc-4fea-a248-36a61c5f7399`) x1
- Processes used:
  - [`bucket-water-dechlorinated`](/processes/bucket-water-dechlorinated)
    - Requires: None
    - Consumes: 5 gallon bucket of tap water (chlorinated) (`156d06b2-ff10-4265-9ae9-3b7753c0206e`) x1
    - Creates: 5 gallon bucket of dechlorinated tap water (`71efa72a-8c87-4dc2-8e2c-9119bb28fe50`) x1

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
