---
title: 'Aquaria'
slug: 'aquaria'
---

Aquaria quests form a skill tree with item gates, process execution steps, and reward handoffs. This page is a QA-oriented bird's-eye map of the full tree so progression checks are explicit.

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

---

## 1) Set up a Walstad tank (`aquaria/walstad`)

- Quest link: [/quests/aquaria/walstad](/quests/aquaria/walstad)
- Unlock prerequisite:
  - `welcome/howtodoquests`
- Dialogue `requiresItems` gates:
  - `start` → "Yes—show me the steps"
    - 83fe7eee-135e-4885-9ce0-9042b9fb860a ×1
    - 98609b23-4811-4275-8d83-ad59a2797753 ×1
    - 75cec98f-fcf0-4d73-8d31-5a53571317b2 ×3
    - 62757412-be94-48c0-a1c0-8fad9bdb8c4a ×1
    - 0704e829-ce72-4c7d-91b0-8a774b11575d ×1
    - c5a7574e-515f-4e9a-83fc-350703131f25 ×1
    - 0564d441-7367-412e-b709-dad770814a39 ×1
    - 16eb261b-9d93-4aff-ab31-40f6a78d04f1 ×1
  - `stage` → "Bucket is dechlorinated and tools are staged"
    - 71efa72a-8c87-4dc2-8e2c-9119bb28fe50 ×1
  - `build` → "Substrate settled and plants look secure"
    - 785fa6f3-bb66-4197-a43f-52fea9cebd48 ×1
  - `thermo` → "Placement marked and glass is dry"
    - 785fa6f3-bb66-4197-a43f-52fea9cebd48 ×1
- Grants:
  - Option/step `grantsItems`: None
  - Quest-level `grantsItems`:
    - None
- Rewards:
  - b281360b-2ecc-4fea-a248-36a61c5f7399 ×1
- Processes used:
  - [assemble-walstad-tank](/processes/assemble-walstad-tank)
    - Requires:
      - 83fe7eee-135e-4885-9ce0-9042b9fb860a ×1
      - 98609b23-4811-4275-8d83-ad59a2797753 ×1
      - 75cec98f-fcf0-4d73-8d31-5a53571317b2 ×3
      - 62757412-be94-48c0-a1c0-8fad9bdb8c4a ×1
      - 0704e829-ce72-4c7d-91b0-8a774b11575d ×1
      - c5a7574e-515f-4e9a-83fc-350703131f25 ×1
      - 71efa72a-8c87-4dc2-8e2c-9119bb28fe50 ×1
    - Consumes:
      - 75cec98f-fcf0-4d73-8d31-5a53571317b2 ×3
      - 0704e829-ce72-4c7d-91b0-8a774b11575d ×1
      - c5a7574e-515f-4e9a-83fc-350703131f25 ×1
      - 71efa72a-8c87-4dc2-8e2c-9119bb28fe50 ×1
    - Creates:
      - 785fa6f3-bb66-4197-a43f-52fea9cebd48 ×1
  - [condition-bucket-water](/processes/condition-bucket-water)
    - Requires:
      - 0564d441-7367-412e-b709-dad770814a39 ×1
      - 16eb261b-9d93-4aff-ab31-40f6a78d04f1 ×1
    - Consumes:
      - 16eb261b-9d93-4aff-ab31-40f6a78d04f1 ×0.1
      - 156d06b2-ff10-4265-9ae9-3b7753c0206e ×1
    - Creates:
      - 71efa72a-8c87-4dc2-8e2c-9119bb28fe50 ×1

---

## 2) Attach Aquarium Thermometer (`aquaria/thermometer`)

- Quest link: [/quests/aquaria/thermometer](/quests/aquaria/thermometer)
- Unlock prerequisite:
  - `aquaria/walstad`
- Dialogue `requiresItems` gates:
  - `start` → "Glass is clean and dry"
    - 785fa6f3-bb66-4197-a43f-52fea9cebd48 ×1
    - 8e81b5e5-4aee-402c-bd04-fed9188f8c07 ×1
    - b16cd6c7-dfeb-49bf-8758-0cb3563b0d50 ×1
  - `attach` → "Strip is attached and seated"
    - 4e8db808-927f-4ac7-9d1f-1c8400c7f5d7 ×1
  - `check` → "Reading recorded"
    - 7f9d9d21-a4f2-4c48-b0e5-9a7483ab05d2 ×1
- Grants:
  - Option/step `grantsItems`: None
  - Quest-level `grantsItems`:
    - None
- Rewards:
  - b281360b-2ecc-4fea-a248-36a61c5f7399 ×1
- Processes used:
  - [attach-aquarium-thermometer](/processes/attach-aquarium-thermometer)
    - Requires:
      - 785fa6f3-bb66-4197-a43f-52fea9cebd48 ×1
      - 8e81b5e5-4aee-402c-bd04-fed9188f8c07 ×1
      - b16cd6c7-dfeb-49bf-8758-0cb3563b0d50 ×1
    - Consumes:
      - 8e81b5e5-4aee-402c-bd04-fed9188f8c07 ×1
      - b16cd6c7-dfeb-49bf-8758-0cb3563b0d50 ×1
    - Creates:
      - 4e8db808-927f-4ac7-9d1f-1c8400c7f5d7 ×1
  - [log-walstad-temperature](/processes/log-walstad-temperature)
    - Requires:
      - 4e8db808-927f-4ac7-9d1f-1c8400c7f5d7 ×1
    - Consumes:
      - None
    - Creates:
      - 7f9d9d21-a4f2-4c48-b0e5-9a7483ab05d2 ×1

---

## 3) Move the Walstad tank (`aquaria/position-tank`)

- Quest link: [/quests/aquaria/position-tank](/quests/aquaria/position-tank)
- Unlock prerequisite:
  - `aquaria/walstad`
  - `aquaria/thermometer`
- Dialogue `requiresItems` gates:
  - `start` → "Yes please, it's heavy."
    - 4e8db808-927f-4ac7-9d1f-1c8400c7f5d7 ×1
    - 98609b23-4811-4275-8d83-ad59a2797753 ×1
  - `heat` → "Install the heater and set it to 26°C"
    - 0b85f058-38f2-4e9a-93e9-d47441608619 ×1
    - 4e8db808-927f-4ac7-9d1f-1c8400c7f5d7 ×1
- Grants:
  - Option/step `grantsItems`: None
  - Quest-level `grantsItems`:
    - None
- Rewards:
  - 8c0f72a2-db79-4238-b80f-97721def169f ×1
- Processes used:
  - [heat-walstad](/processes/heat-walstad)
    - Requires:
      - None
    - Consumes:
      - 4e8db808-927f-4ac7-9d1f-1c8400c7f5d7 ×1
      - 0b85f058-38f2-4e9a-93e9-d47441608619 ×1
    - Creates:
      - 8c0f72a2-db79-4238-b80f-97721def169f ×1

---

## 4) Install a sponge filter (`aquaria/sponge-filter`)

- Quest link: [/quests/aquaria/sponge-filter](/quests/aquaria/sponge-filter)
- Unlock prerequisite:
  - `aquaria/position-tank`
- Dialogue `requiresItems` gates:
  - `start` → "Let's prep the rinse gear"
    - 496b4ebb-43c8-42d7-a921-fc6ee9d6ae56 ×1
    - 60e517b4-5807-4983-afb8-e2aad1566587 ×1
    - 5d5e4e29-94b7-4a03-b73d-7420841ae686 ×1
    - 0564d441-7367-412e-b709-dad770814a39 ×1
    - 16eb261b-9d93-4aff-ab31-40f6a78d04f1 ×1
    - 997eaba9-25ee-43d5-bbdc-5d6adf03adfa ×1
  - `prep` → "Bucket is full of dechlorinated water"
    - 71efa72a-8c87-4dc2-8e2c-9119bb28fe50 ×1
  - `rinse` → "Sponge rinsed and still wet"
    - 606c4f47-ca8f-4458-bc7f-0ab2957ef641 ×1
  - `restart` → "Flow is restored without splashing"
    - 6f08e704-1086-4fef-ad0a-f48922a5cfd0 ×1
- Grants:
  - Option/step `grantsItems`: None
  - Quest-level `grantsItems`:
    - None
- Rewards:
  - b281360b-2ecc-4fea-a248-36a61c5f7399 ×1
- Processes used:
  - [condition-bucket-water](/processes/condition-bucket-water)
    - Requires:
      - 0564d441-7367-412e-b709-dad770814a39 ×1
      - 16eb261b-9d93-4aff-ab31-40f6a78d04f1 ×1
    - Consumes:
      - 16eb261b-9d93-4aff-ab31-40f6a78d04f1 ×0.1
      - 156d06b2-ff10-4265-9ae9-3b7753c0206e ×1
    - Creates:
      - 71efa72a-8c87-4dc2-8e2c-9119bb28fe50 ×1
  - [restart-sponge-filter](/processes/restart-sponge-filter)
    - Requires:
      - 606c4f47-ca8f-4458-bc7f-0ab2957ef641 ×1
      - 5d5e4e29-94b7-4a03-b73d-7420841ae686 ×1
      - 60e517b4-5807-4983-afb8-e2aad1566587 ×1
    - Consumes:
      - 606c4f47-ca8f-4458-bc7f-0ab2957ef641 ×1
    - Creates:
      - 6f08e704-1086-4fef-ad0a-f48922a5cfd0 ×1
  - [rinse-aquarium-filter](/processes/rinse-aquarium-filter)
    - Requires:
      - 496b4ebb-43c8-42d7-a921-fc6ee9d6ae56 ×1
      - 71efa72a-8c87-4dc2-8e2c-9119bb28fe50 ×1
      - 997eaba9-25ee-43d5-bbdc-5d6adf03adfa ×1
    - Consumes:
      - 71efa72a-8c87-4dc2-8e2c-9119bb28fe50 ×1
    - Creates:
      - 606c4f47-ca8f-4458-bc7f-0ab2957ef641 ×1

---

## 5) Install an aquarium light (`aquaria/aquarium-light`)

- Quest link: [/quests/aquaria/aquarium-light](/quests/aquaria/aquarium-light)
- Unlock prerequisite:
  - `aquaria/sponge-filter`
- Dialogue `requiresItems` gates:
  - `mount` → "Light secured."
    - 62757412-be94-48c0-a1c0-8fad9bdb8c4a ×1
- Grants:
  - Option/step `grantsItems`: None
  - Quest-level `grantsItems`:
    - None
- Rewards:
  - c5a7574e-515f-4e9a-83fc-350703131f25 ×1
- Processes used:
  - None

---

## 6) Rinse Sponge Filter (`aquaria/filter-rinse`)

- Quest link: [/quests/aquaria/filter-rinse](/quests/aquaria/filter-rinse)
- Unlock prerequisite:
  - `aquaria/sponge-filter`
- Dialogue `requiresItems` gates:
  - `start` → "Bucket's ready and the pump is unplugged."
    - 71efa72a-8c87-4dc2-8e2c-9119bb28fe50 ×1
    - 496b4ebb-43c8-42d7-a921-fc6ee9d6ae56 ×1
    - 5d5e4e29-94b7-4a03-b73d-7420841ae686 ×1
    - 997eaba9-25ee-43d5-bbdc-5d6adf03adfa ×1
  - `prep` → "Squeeze the sponge only in dechlorinated water."
    - 496b4ebb-43c8-42d7-a921-fc6ee9d6ae56 ×1
    - 71efa72a-8c87-4dc2-8e2c-9119bb28fe50 ×1
    - 997eaba9-25ee-43d5-bbdc-5d6adf03adfa ×1
  - `prep` → "Media is rinsed and still wet."
    - 606c4f47-ca8f-4458-bc7f-0ab2957ef641 ×1
  - `restart` → "Prime the air line and restart the flow."
    - 606c4f47-ca8f-4458-bc7f-0ab2957ef641 ×1
    - 60e517b4-5807-4983-afb8-e2aad1566587 ×1
    - 5d5e4e29-94b7-4a03-b73d-7420841ae686 ×1
  - `restart` → "Flow is restored without blasting the inhabitants."
    - 6f08e704-1086-4fef-ad0a-f48922a5cfd0 ×1
- Grants:
  - Option/step `grantsItems`: None
  - Quest-level `grantsItems`:
    - None
- Rewards:
  - b281360b-2ecc-4fea-a248-36a61c5f7399 ×1
- Processes used:
  - [bucket-water-dechlorinated](/processes/bucket-water-dechlorinated)
    - Requires:
      - None
    - Consumes:
      - 156d06b2-ff10-4265-9ae9-3b7753c0206e ×1
    - Creates:
      - 71efa72a-8c87-4dc2-8e2c-9119bb28fe50 ×1
  - [restart-sponge-filter](/processes/restart-sponge-filter)
    - Requires:
      - 606c4f47-ca8f-4458-bc7f-0ab2957ef641 ×1
      - 5d5e4e29-94b7-4a03-b73d-7420841ae686 ×1
      - 60e517b4-5807-4983-afb8-e2aad1566587 ×1
    - Consumes:
      - 606c4f47-ca8f-4458-bc7f-0ab2957ef641 ×1
    - Creates:
      - 6f08e704-1086-4fef-ad0a-f48922a5cfd0 ×1
  - [rinse-aquarium-filter](/processes/rinse-aquarium-filter)
    - Requires:
      - 496b4ebb-43c8-42d7-a921-fc6ee9d6ae56 ×1
      - 71efa72a-8c87-4dc2-8e2c-9119bb28fe50 ×1
      - 997eaba9-25ee-43d5-bbdc-5d6adf03adfa ×1
    - Consumes:
      - 71efa72a-8c87-4dc2-8e2c-9119bb28fe50 ×1
    - Creates:
      - 606c4f47-ca8f-4458-bc7f-0ab2957ef641 ×1

---

## 7) Install an aquarium heater (`aquaria/heater-install`)

- Quest link: [/quests/aquaria/heater-install](/quests/aquaria/heater-install)
- Unlock prerequisite:
  - `aquaria/sponge-filter`
  - `aquaria/thermometer`
  - `aquaria/walstad`
- Dialogue `requiresItems` gates:
  - `start` → "Tank is ready for heat"
    - 4e8db808-927f-4ac7-9d1f-1c8400c7f5d7 ×1
    - 0b85f058-38f2-4e9a-93e9-d47441608619 ×1
    - 6f08e704-1086-4fef-ad0a-f48922a5cfd0 ×1
  - `mount` → "Heater installed and powered on"
    - 8c0f72a2-db79-4238-b80f-97721def169f ×1
  - `verify` → "Reading recorded and steady"
    - 7f9d9d21-a4f2-4c48-b0e5-9a7483ab05d2 ×1
- Grants:
  - Option/step `grantsItems`: None
  - Quest-level `grantsItems`:
    - None
- Rewards:
  - b281360b-2ecc-4fea-a248-36a61c5f7399 ×1
- Processes used:
  - [heat-walstad](/processes/heat-walstad)
    - Requires:
      - None
    - Consumes:
      - 4e8db808-927f-4ac7-9d1f-1c8400c7f5d7 ×1
      - 0b85f058-38f2-4e9a-93e9-d47441608619 ×1
    - Creates:
      - 8c0f72a2-db79-4238-b80f-97721def169f ×1
  - [log-walstad-temperature](/processes/log-walstad-temperature)
    - Requires:
      - 4e8db808-927f-4ac7-9d1f-1c8400c7f5d7 ×1
    - Consumes:
      - None
    - Creates:
      - 7f9d9d21-a4f2-4c48-b0e5-9a7483ab05d2 ×1

---

## 8) Test water parameters (`aquaria/water-testing`)

- Quest link: [/quests/aquaria/water-testing](/quests/aquaria/water-testing)
- Unlock prerequisite:
  - `aquaria/thermometer`
- Dialogue `requiresItems` gates:
  - `explain` → "Okay, I'll test now."
    - 8d30133e-0fbb-4e0f-845b-44d721a1f6b2 ×1
    - 997eaba9-25ee-43d5-bbdc-5d6adf03adfa ×1
    - c9b51052-4594-42d7-a723-82b815ab8cc2 ×1
    - b8602362-2035-4f00-9376-f48d8668cf38 ×1
  - `results` → "Nitrate is high—start a partial water change."
    - 8c0f72a2-db79-4238-b80f-97721def169f ×1
    - 97317bc3-507a-4e2c-912b-507d586cee87 ×1
    - 0564d441-7367-412e-b709-dad770814a39 ×1
    - 71efa72a-8c87-4dc2-8e2c-9119bb28fe50 ×1
    - 8e81b5e5-4aee-402c-bd04-fed9188f8c07 ×1
- Grants:
  - Option/step `grantsItems`: None
  - Quest-level `grantsItems`:
    - None
- Rewards:
  - c5a7574e-515f-4e9a-83fc-350703131f25 ×1
- Processes used:
  - [partial-water-change](/processes/partial-water-change)
    - Requires:
      - 8c0f72a2-db79-4238-b80f-97721def169f ×1
      - 97317bc3-507a-4e2c-912b-507d586cee87 ×1
      - 0564d441-7367-412e-b709-dad770814a39 ×1
      - 71efa72a-8c87-4dc2-8e2c-9119bb28fe50 ×1
    - Consumes:
      - 71efa72a-8c87-4dc2-8e2c-9119bb28fe50 ×0.25
    - Creates:
      - bc8ff31b-7c20-4c05-9af0-e3530d90fe3f ×1

---

## 9) Add guppies (`aquaria/guppy`)

- Quest link: [/quests/aquaria/guppy](/quests/aquaria/guppy)
- Unlock prerequisite:
  - `aquaria/water-testing`
  - `aquaria/heater-install`
- Dialogue `requiresItems` gates:
  - `start` → "Tank is at guppy-friendly temperature."
    - 8c0f72a2-db79-4238-b80f-97721def169f ×1
  - `release` → "Guppies are now in the tank."
    - 21247ab3-427f-4448-8b68-4d8ad742cb7a ×1
- Grants:
  - Option/step `grantsItems`: None
  - Quest-level `grantsItems`:
    - None
- Rewards:
  - 21247ab3-427f-4448-8b68-4d8ad742cb7a ×1
- Processes used:
  - [heat-walstad](/processes/heat-walstad)
    - Requires:
      - None
    - Consumes:
      - 4e8db808-927f-4ac7-9d1f-1c8400c7f5d7 ×1
      - 0b85f058-38f2-4e9a-93e9-d47441608619 ×1
    - Creates:
      - 8c0f72a2-db79-4238-b80f-97721def169f ×1
  - [stock-guppies](/processes/stock-guppies)
    - Requires:
      - None
    - Consumes:
      - 8c0f72a2-db79-4238-b80f-97721def169f ×1
      - 3f1cc002-1f7a-4301-a1c6-343f65e7f21a ×1
    - Creates:
      - 21247ab3-427f-4448-8b68-4d8ad742cb7a ×1

---

## 10) Log Water Parameters (`aquaria/log-water-parameters`)

- Quest link: [/quests/aquaria/log-water-parameters](/quests/aquaria/log-water-parameters)
- Unlock prerequisite:
  - `aquaria/water-testing`
- Dialogue `requiresItems` gates:
  - `start` → "Bench is clear and kit is open."
    - 8d30133e-0fbb-4e0f-845b-44d721a1f6b2 ×1
    - 997eaba9-25ee-43d5-bbdc-5d6adf03adfa ×1
  - `measure` → "Run the liquid tests."
    - 8d30133e-0fbb-4e0f-845b-44d721a1f6b2 ×1
    - 997eaba9-25ee-43d5-bbdc-5d6adf03adfa ×1
  - `measure` → "Readings are ready to log."
    - 9748fccc-ec16-4664-982e-c79b1c082e5e ×1
  - `log` → "Record the results in the logbook."
    - 8d30133e-0fbb-4e0f-845b-44d721a1f6b2 ×1
    - 9748fccc-ec16-4664-982e-c79b1c082e5e ×1
    - b8602362-2035-4f00-9376-f48d8668cf38 ×1
    - 997eaba9-25ee-43d5-bbdc-5d6adf03adfa ×1
  - `log` → "Entry logged with today's readings."
    - 9c60b34c-f0f0-4ed4-b490-e1d781ecb83c ×1
- Grants:
  - Option/step `grantsItems`: None
  - Quest-level `grantsItems`:
    - None
- Rewards:
  - b281360b-2ecc-4fea-a248-36a61c5f7399 ×1
- Processes used:
  - [log-aquarium-test-results](/processes/log-aquarium-test-results)
    - Requires:
      - 8d30133e-0fbb-4e0f-845b-44d721a1f6b2 ×1
      - 9748fccc-ec16-4664-982e-c79b1c082e5e ×1
      - b8602362-2035-4f00-9376-f48d8668cf38 ×1
      - 997eaba9-25ee-43d5-bbdc-5d6adf03adfa ×1
    - Consumes:
      - 9748fccc-ec16-4664-982e-c79b1c082e5e ×1
    - Creates:
      - 9c60b34c-f0f0-4ed4-b490-e1d781ecb83c ×1
  - [measure-liquid-parameters](/processes/measure-liquid-parameters)
    - Requires:
      - 8d30133e-0fbb-4e0f-845b-44d721a1f6b2 ×1
      - 997eaba9-25ee-43d5-bbdc-5d6adf03adfa ×1
    - Consumes:
      - 8d30133e-0fbb-4e0f-845b-44d721a1f6b2 ×0.05
    - Creates:
      - 9748fccc-ec16-4664-982e-c79b1c082e5e ×1

---

## 11) Check aquarium pH (`aquaria/ph-strip-test`)

- Quest link: [/quests/aquaria/ph-strip-test](/quests/aquaria/ph-strip-test)
- Unlock prerequisite:
  - `aquaria/water-testing`
- Dialogue `requiresItems` gates:
  - `start` → "Strip and gloves ready."
    - 13167d6a-5617-4931-8a6e-6f463c6b8835 ×1
    - 997eaba9-25ee-43d5-bbdc-5d6adf03adfa ×1
  - `dip` → "Dip and read the strip."
    - 13167d6a-5617-4931-8a6e-6f463c6b8835 ×1
    - 997eaba9-25ee-43d5-bbdc-5d6adf03adfa ×1
  - `dip` → "Reading recorded from the strip."
    - 2d1b7889-b28c-4970-8be9-5de092cfd4d9 ×1
  - `log` → "Write it in the logbook."
    - 2d1b7889-b28c-4970-8be9-5de092cfd4d9 ×1
    - b8602362-2035-4f00-9376-f48d8668cf38 ×1
  - `log` → "Entry logged and dated."
    - 9c392043-4067-4f49-8038-38eef00e0b24 ×1
- Grants:
  - Option/step `grantsItems`:
    - `start` → "I need a strip."
      - 13167d6a-5617-4931-8a6e-6f463c6b8835 ×1
  - Quest-level `grantsItems`:
    - None
- Rewards:
  - b281360b-2ecc-4fea-a248-36a61c5f7399 ×1
- Processes used:
  - [log-aquarium-ph-reading](/processes/log-aquarium-ph-reading)
    - Requires:
      - 2d1b7889-b28c-4970-8be9-5de092cfd4d9 ×1
      - b8602362-2035-4f00-9376-f48d8668cf38 ×1
      - 997eaba9-25ee-43d5-bbdc-5d6adf03adfa ×1
    - Consumes:
      - 2d1b7889-b28c-4970-8be9-5de092cfd4d9 ×1
    - Creates:
      - 9c392043-4067-4f49-8038-38eef00e0b24 ×1
  - [measure-aquarium-ph](/processes/measure-aquarium-ph)
    - Requires:
      - 13167d6a-5617-4931-8a6e-6f463c6b8835 ×1
      - 997eaba9-25ee-43d5-bbdc-5d6adf03adfa ×1
    - Consumes:
      - 13167d6a-5617-4931-8a6e-6f463c6b8835 ×1
    - Creates:
      - 2d1b7889-b28c-4970-8be9-5de092cfd4d9 ×1

---

## 12) Balance aquarium pH (`aquaria/balance-ph`)

- Quest link: [/quests/aquaria/balance-ph](/quests/aquaria/balance-ph)
- Unlock prerequisite:
  - `aquaria/ph-strip-test`
- Dialogue `requiresItems` gates:
  - `verify` → "pH stable"
    - 13167d6a-5617-4931-8a6e-6f463c6b8835 ×1
- Grants:
  - Option/step `grantsItems`: None
  - Quest-level `grantsItems`:
    - None
- Rewards:
  - b281360b-2ecc-4fea-a248-36a61c5f7399 ×1
- Processes used:
  - [adjust-ph](/processes/adjust-ph)
    - Requires:
      - 997eaba9-25ee-43d5-bbdc-5d6adf03adfa ×1
      - c9b51052-4594-42d7-a723-82b815ab8cc2 ×1
      - c46e98b4-0c1a-478b-988c-8c9260dce434 ×1
      - d5fbffe6-7e22-4cbc-84d3-f8f5bf023d04 ×1
      - 9cdd41b1-392e-40c2-8072-0c1351b1a26b ×1
    - Consumes:
      - d5fbffe6-7e22-4cbc-84d3-f8f5bf023d04 ×0.05
      - 9cdd41b1-392e-40c2-8072-0c1351b1a26b ×0.05
    - Creates:
      - None

---

## 13) Add dwarf shrimp (`aquaria/shrimp`)

- Quest link: [/quests/aquaria/shrimp](/quests/aquaria/shrimp)
- Unlock prerequisite:
  - `aquaria/ph-strip-test`
  - `aquaria/heater-install`
  - `aquaria/log-water-parameters`
- Dialogue `requiresItems` gates:
  - `start` → "Sounds good!"
    - 8d30133e-0fbb-4e0f-845b-44d721a1f6b2 ×1
  - `acclimate` → "Start drip acclimation"
    - 60e517b4-5807-4983-afb8-e2aad1566587 ×1
    - 0564d441-7367-412e-b709-dad770814a39 ×1
  - `release` → "Shrimp are in and exploring!"
    - ee7d437d-7426-47cd-b691-386dd20f4e47 ×1
- Grants:
  - Option/step `grantsItems`: None
  - Quest-level `grantsItems`:
    - None
- Rewards:
  - b494f643-a77a-4edf-be7e-5f7ff2dfba6a ×3
- Processes used:
  - [drip-acclimate-shrimp](/processes/drip-acclimate-shrimp)
    - Requires:
      - 60e517b4-5807-4983-afb8-e2aad1566587 ×1
      - 0564d441-7367-412e-b709-dad770814a39 ×1
      - b494f643-a77a-4edf-be7e-5f7ff2dfba6a ×1
      - 785fa6f3-bb66-4197-a43f-52fea9cebd48 ×1
    - Consumes:
      - None
    - Creates:
      - None

---

## 14) Add Floating Plants (`aquaria/floating-plants`)

- Quest link: [/quests/aquaria/floating-plants](/quests/aquaria/floating-plants)
- Unlock prerequisite:
  - `aquaria/shrimp`
- Dialogue `requiresItems` gates:
  - `start` → "Bucket, net, and guppy grass ready."
    - 0704e829-ce72-4c7d-91b0-8a774b11575d ×1
    - 71efa72a-8c87-4dc2-8e2c-9119bb28fe50 ×1
    - ee7d437d-7426-47cd-b691-386dd20f4e47 ×1
    - 997eaba9-25ee-43d5-bbdc-5d6adf03adfa ×1
  - `rinse` → "Rinse and inspect the plants."
    - 0704e829-ce72-4c7d-91b0-8a774b11575d ×1
    - 71efa72a-8c87-4dc2-8e2c-9119bb28fe50 ×1
    - ee7d437d-7426-47cd-b691-386dd20f4e47 ×1
    - 997eaba9-25ee-43d5-bbdc-5d6adf03adfa ×1
  - `rinse` → "Rinsed bundle ready for the tank."
    - c1f5f126-ad6b-4ba8-86ad-5598fb5038e9 ×1
  - `place` → "Float and spread the guppy grass."
    - c1f5f126-ad6b-4ba8-86ad-5598fb5038e9 ×1
    - 62757412-be94-48c0-a1c0-8fad9bdb8c4a ×1
  - `place` → "Mat is floating and clear of the intake."
    - 1bdcb22a-17e2-42f8-b990-b842f9684169 ×1
- Grants:
  - Option/step `grantsItems`: None
  - Quest-level `grantsItems`:
    - None
- Rewards:
  - b281360b-2ecc-4fea-a248-36a61c5f7399 ×1
- Processes used:
  - [bucket-water-dechlorinated](/processes/bucket-water-dechlorinated)
    - Requires:
      - None
    - Consumes:
      - 156d06b2-ff10-4265-9ae9-3b7753c0206e ×1
    - Creates:
      - 71efa72a-8c87-4dc2-8e2c-9119bb28fe50 ×1
  - [place-floating-plants](/processes/place-floating-plants)
    - Requires:
      - c1f5f126-ad6b-4ba8-86ad-5598fb5038e9 ×1
      - 62757412-be94-48c0-a1c0-8fad9bdb8c4a ×1
    - Consumes:
      - c1f5f126-ad6b-4ba8-86ad-5598fb5038e9 ×1
    - Creates:
      - 1bdcb22a-17e2-42f8-b990-b842f9684169 ×1
  - [rinse-floating-plants](/processes/rinse-floating-plants)
    - Requires:
      - 0704e829-ce72-4c7d-91b0-8a774b11575d ×1
      - 71efa72a-8c87-4dc2-8e2c-9119bb28fe50 ×1
      - ee7d437d-7426-47cd-b691-386dd20f4e47 ×1
      - 997eaba9-25ee-43d5-bbdc-5d6adf03adfa ×1
    - Consumes:
      - 0704e829-ce72-4c7d-91b0-8a774b11575d ×1
      - 71efa72a-8c87-4dc2-8e2c-9119bb28fe50 ×1
    - Creates:
      - c1f5f126-ad6b-4ba8-86ad-5598fb5038e9 ×1

---

## 15) Breed your guppies (`aquaria/breeding`)

- Quest link: [/quests/aquaria/breeding](/quests/aquaria/breeding)
- Unlock prerequisite:
  - `aquaria/guppy`
  - `aquaria/floating-plants`
- Dialogue `requiresItems` gates:
  - `start` → "Floating mat and warm tank are ready."
    - 21247ab3-427f-4448-8b68-4d8ad742cb7a ×1
    - 1bdcb22a-17e2-42f8-b990-b842f9684169 ×1
  - `cover` → "Thicken the floating cover."
    - 21247ab3-427f-4448-8b68-4d8ad742cb7a ×1
    - 1bdcb22a-17e2-42f8-b990-b842f9684169 ×1
    - a7ba3f18-510d-47cb-b73f-91b8e2a72e73 ×1
  - `cover` → "Cover is dense and sheltering the fry."
    - bda9e450-499d-41d6-ab32-df73528dc68f ×1
  - `feed` → "Powder a week's worth of fry food."
    - 8807f2f1-3ca2-48da-9b2b-1915604a63e2 ×1
  - `feed` → "Feed and watch them grow out."
    - bda9e450-499d-41d6-ab32-df73528dc68f ×1
    - eb0f7f00-98dc-44b0-bf7c-9c8d998cbbcb ×1
    - 21247ab3-427f-4448-8b68-4d8ad742cb7a ×1
    - 8e81b5e5-4aee-402c-bd04-fed9188f8c07 ×1
  - `feed` → "Juveniles are ready to rehome."
    - 18a20f4e-a351-448e-837b-3caca90f71f4 ×1
- Grants:
  - Option/step `grantsItems`:
    - `start` → "Send extra stems to weave in."
      - 0704e829-ce72-4c7d-91b0-8a774b11575d ×1
      - a7ba3f18-510d-47cb-b73f-91b8e2a72e73 ×1
  - Quest-level `grantsItems`:
    - None
- Rewards:
  - b281360b-2ecc-4fea-a248-36a61c5f7399 ×1
- Processes used:
  - [portion-fry-food](/processes/portion-fry-food)
    - Requires:
      - 8807f2f1-3ca2-48da-9b2b-1915604a63e2 ×1
    - Consumes:
      - 8807f2f1-3ca2-48da-9b2b-1915604a63e2 ×0.5
    - Creates:
      - eb0f7f00-98dc-44b0-bf7c-9c8d998cbbcb ×1
  - [prepare-guppy-fry-cover](/processes/prepare-guppy-fry-cover)
    - Requires:
      - 21247ab3-427f-4448-8b68-4d8ad742cb7a ×1
      - 1bdcb22a-17e2-42f8-b990-b842f9684169 ×1
      - a7ba3f18-510d-47cb-b73f-91b8e2a72e73 ×1
    - Consumes:
      - 1bdcb22a-17e2-42f8-b990-b842f9684169 ×1
      - a7ba3f18-510d-47cb-b73f-91b8e2a72e73 ×1
    - Creates:
      - bda9e450-499d-41d6-ab32-df73528dc68f ×1
  - [raise-guppy-fry](/processes/raise-guppy-fry)
    - Requires:
      - bda9e450-499d-41d6-ab32-df73528dc68f ×1
      - eb0f7f00-98dc-44b0-bf7c-9c8d998cbbcb ×1
      - 21247ab3-427f-4448-8b68-4d8ad742cb7a ×1
      - 8e81b5e5-4aee-402c-bd04-fed9188f8c07 ×1
    - Consumes:
      - eb0f7f00-98dc-44b0-bf7c-9c8d998cbbcb ×1
    - Creates:
      - 18a20f4e-a351-448e-837b-3caca90f71f4 ×1

---

## 16) Set up an aquarium for a goldfish (`aquaria/goldfish`)

- Quest link: [/quests/aquaria/goldfish](/quests/aquaria/goldfish)
- Unlock prerequisite:
  - `welcome/howtodoquests`
  - `aquaria/breeding`
- Dialogue `requiresItems` gates:
  - `setup` → "Aquarium is fully set up! Time to add the fish, right?"
    - ca7c1069-4ba3-4339-9a10-0b690a690e60 ×1
  - `fish` → "I'm so excited to have a fish! Thanks for all your help!"
    - 76307a8e-4e0e-4dfa-abc2-7917d384d82c ×1
- Grants:
  - Option/step `grantsItems`:
    - `setup` → "Mmm, tasty!"
      - 71efa72a-8c87-4dc2-8e2c-9119bb28fe50 ×1
  - Quest-level `grantsItems`:
    - None
- Rewards:
  - a07b75e3-f828-4cb1-81d6-1ab0e9857a79 ×1
- Processes used:
  - [add-goldfish](/processes/add-goldfish)
    - Requires:
      - ee7d437d-7426-47cd-b691-386dd20f4e47 ×1
    - Consumes:
      - ca7c1069-4ba3-4339-9a10-0b690a690e60 ×1
      - 40920981-bf9f-4b89-b887-bebe7006f7dc ×1
    - Creates:
      - 76307a8e-4e0e-4dfa-abc2-7917d384d82c ×1
  - [check-aquarium-temperature](/processes/check-aquarium-temperature)
    - Requires:
      - ca7c1069-4ba3-4339-9a10-0b690a690e60 ×1
      - 8e81b5e5-4aee-402c-bd04-fed9188f8c07 ×1
    - Consumes:
      - None
    - Creates:
      - None
  - [feed-goldfish](/processes/feed-goldfish)
    - Requires:
      - 76307a8e-4e0e-4dfa-abc2-7917d384d82c ×1
    - Consumes:
      - 8807f2f1-3ca2-48da-9b2b-1915604a63e2 ×0.1
    - Creates:
      - 36a1168f-0109-4a8c-b70b-45f8ca582297 ×1
  - [prepare-aquarium](/processes/prepare-aquarium)
    - Requires:
      - None
    - Consumes:
      - 83fe7eee-135e-4885-9ce0-9042b9fb860a ×1
      - 71efa72a-8c87-4dc2-8e2c-9119bb28fe50 ×1
      - 496b4ebb-43c8-42d7-a921-fc6ee9d6ae56 ×1
      - 0b85f058-38f2-4e9a-93e9-d47441608619 ×1
      - 62757412-be94-48c0-a1c0-8fad9bdb8c4a ×1
      - 8e81b5e5-4aee-402c-bd04-fed9188f8c07 ×1
      - 75cec98f-fcf0-4d73-8d31-5a53571317b2 ×20
    - Creates:
      - 0564d441-7367-412e-b709-dad770814a39 ×1
      - ca7c1069-4ba3-4339-9a10-0b690a690e60 ×1

---

## 17) Perform a partial water change (`aquaria/water-change`)

- Quest link: [/quests/aquaria/water-change](/quests/aquaria/water-change)
- Unlock prerequisite:
  - `aquaria/guppy`
- Dialogue `requiresItems` gates:
  - `start` → "Gear gathered and tank is safe to work"
    - 8c0f72a2-db79-4238-b80f-97721def169f ×1
    - 97317bc3-507a-4e2c-912b-507d586cee87 ×1
    - 0564d441-7367-412e-b709-dad770814a39 ×1
    - 16eb261b-9d93-4aff-ab31-40f6a78d04f1 ×1
    - 997eaba9-25ee-43d5-bbdc-5d6adf03adfa ×1
    - d7d7f91c-7c51-4fd0-bdd1-f8d25d4f03e0 ×1
  - `prep` → "Replacement water is conditioned and matched"
    - 71efa72a-8c87-4dc2-8e2c-9119bb28fe50 ×1
  - `remove` → "Water swapped and heater restarted"
    - bc8ff31b-7c20-4c05-9af0-e3530d90fe3f ×1
- Grants:
  - Option/step `grantsItems`: None
  - Quest-level `grantsItems`:
    - None
- Rewards:
  - b281360b-2ecc-4fea-a248-36a61c5f7399 ×1
- Processes used:
  - [condition-bucket-water](/processes/condition-bucket-water)
    - Requires:
      - 0564d441-7367-412e-b709-dad770814a39 ×1
      - 16eb261b-9d93-4aff-ab31-40f6a78d04f1 ×1
    - Consumes:
      - 16eb261b-9d93-4aff-ab31-40f6a78d04f1 ×0.1
      - 156d06b2-ff10-4265-9ae9-3b7753c0206e ×1
    - Creates:
      - 71efa72a-8c87-4dc2-8e2c-9119bb28fe50 ×1
  - [partial-water-change](/processes/partial-water-change)
    - Requires:
      - 8c0f72a2-db79-4238-b80f-97721def169f ×1
      - 97317bc3-507a-4e2c-912b-507d586cee87 ×1
      - 0564d441-7367-412e-b709-dad770814a39 ×1
      - 71efa72a-8c87-4dc2-8e2c-9119bb28fe50 ×1
    - Consumes:
      - 71efa72a-8c87-4dc2-8e2c-9119bb28fe50 ×0.25
    - Creates:
      - bc8ff31b-7c20-4c05-9af0-e3530d90fe3f ×1

---

## 18) Catch a fish with a net (`aquaria/net-fish`)

- Quest link: [/quests/aquaria/net-fish](/quests/aquaria/net-fish)
- Unlock prerequisite:
  - `aquaria/water-change`
- Dialogue `requiresItems` gates:
  - `catch` → "Fish is secure in the bucket."
    - ee7d437d-7426-47cd-b691-386dd20f4e47 ×1
- Grants:
  - Option/step `grantsItems`: None
  - Quest-level `grantsItems`:
    - None
- Rewards:
  - b281360b-2ecc-4fea-a248-36a61c5f7399 ×1
- Processes used:
  - None

---

## 19) Top Off Evaporated Water (`aquaria/top-off`)

- Quest link: [/quests/aquaria/top-off](/quests/aquaria/top-off)
- Unlock prerequisite:
  - `aquaria/water-change`
- Dialogue `requiresItems` gates:
  - `start` → "Setup done."
    - 97317bc3-507a-4e2c-912b-507d586cee87 ×1
    - 0564d441-7367-412e-b709-dad770814a39 ×2
- Grants:
  - Option/step `grantsItems`: None
  - Quest-level `grantsItems`:
    - None
- Rewards:
  - b281360b-2ecc-4fea-a248-36a61c5f7399 ×1
- Processes used:
  - None

---

## QA flow notes

- Cross-quest dependencies:
  - `aquaria/walstad` depends on external quests: `welcome/howtodoquests`.
  - `aquaria/goldfish` depends on external quests: `welcome/howtodoquests`.
- Progression integrity checks:
  - `aquaria/walstad`: verify prerequisite completion and inventory gates (notable count gates: 75cec98f-fcf0-4d73-8d31-5a53571317b2 ×3).
  - `aquaria/thermometer`: verify prerequisite completion and inventory gates.
  - `aquaria/position-tank`: verify prerequisite completion and inventory gates.
  - `aquaria/sponge-filter`: verify prerequisite completion and inventory gates.
  - `aquaria/aquarium-light`: verify prerequisite completion and inventory gates.
  - `aquaria/filter-rinse`: verify prerequisite completion and inventory gates.
  - `aquaria/heater-install`: verify prerequisite completion and inventory gates.
  - `aquaria/water-testing`: verify prerequisite completion and inventory gates.
  - `aquaria/guppy`: verify prerequisite completion and inventory gates.
  - `aquaria/log-water-parameters`: verify prerequisite completion and inventory gates.
  - `aquaria/ph-strip-test`: verify prerequisite completion and inventory gates.
  - `aquaria/balance-ph`: verify prerequisite completion and inventory gates.
  - `aquaria/shrimp`: verify prerequisite completion and inventory gates.
  - `aquaria/floating-plants`: verify prerequisite completion and inventory gates.
  - `aquaria/breeding`: verify prerequisite completion and inventory gates.
  - `aquaria/goldfish`: verify prerequisite completion and inventory gates.
  - `aquaria/water-change`: verify prerequisite completion and inventory gates.
  - `aquaria/net-fish`: verify prerequisite completion and inventory gates.
  - `aquaria/top-off`: verify prerequisite completion and inventory gates (notable count gates: 0564d441-7367-412e-b709-dad770814a39 ×2).
- End-to-end validation checklist:
  - Play quests in dependency order and confirm each `/quests/...` link resolves.
  - For each process option, run the process once and confirm process output satisfies the next gate.
  - Confirm rewards and grants are present after completion without bypassing prerequisite gates.
