---
title: 'Quest Trees'
slug: 'quest-trees'
---

# Quest Trees

DSPACE quests are organized into themed trees that build skills over time. This page lists the
current quest trees tracked in the repository and points to where the data lives.

## Current Quest Trees

These trees are represented by folders under `frontend/src/pages/quests/json`:

- **Welcome** – onboarding tutorial for quest basics
- **3D Printing** – printer setup, calibration, and maintenance
- **Aquaria** – aquarium setup, care, and routine maintenance
- **Astronomy** – observation skills and sky tracking
- **Chemistry** – safe experiments and lab fundamentals
- **Composting** – compost setup, maintenance, and use
- **Completionist** – meta quests that track overall progress
- **DevOps** – self-hosting, automation, and operations workflows
- **Electronics** – circuits, sensors, and microcontroller basics
- **Energy** – renewable power, storage, and measurement
- **First Aid** – safety preparedness and basic care
- **Geothermal** – monitoring and maintaining geothermal systems
- **Hydroponics** – growing plants in water-based systems
- **Programming** – scripts, data logging, and automation
- **Robotics** – chassis builds, servos, and control systems
- **Rocketry** – model rocket design, printing, and launch steps
- **Sysadmin** – foundational Linux workflows and maintenance
- **UBI** – metaguild and basic-income concepts
- **Woodworking** – tooling, safety, and build projects

To browse the quests themselves, visit `/quests` in the app or open the JSON files in the folders
above. If you add or remove quests, update the quest counts with `npm run new-quests:update`.

Run `node scripts/generate-quest-chart.js` from the repository root to produce a radar chart
summarizing the quest tree sizes. The PNG output is ignored by Git, but CI artifacts attach the
latest image.
