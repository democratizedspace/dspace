---
title: 'Quest Trees'
slug: 'quest-trees'
---

# Quest Trees

DSPACE quests are organized into themed trees that build skills over time. This page summarizes the
current quest categories.

## Existing Quest Trees

- **Welcome** – onboarding quests that cover quest flow, inventory, and GitHub connection basics
- **3D Printing** – bed leveling, calibration cubes, nozzle maintenance, and Benchy print runs
- **Aquaria** – Walstad setup, water testing, sponge filters, shrimp/guppy care, and goldfish steps
- **Astronomy** – moon observations, telescope setup, Jupiter’s moons, constellations, and ISS passes
- **Chemistry** – acid dilution, pH testing, buffer solutions, precipitation reactions, and stevia extraction
- **Composting** – start a pile, check temperatures, turn the heap, and sift finished compost
- **Completionist** – catalog, display, polish, and reminder quests for full completion
- **DevOps** – Raspberry Pi cluster prep, k3s deployment, monitoring, backups, and hardening
- **Electronics** – basic circuits, soldering practice, sensor readings, and data logging
- **Energy** – solar setup, battery upgrades, wind turbines, dSolar and dWatt milestones
- **First Aid** – assemble a kit, treat burns and wounds, and practice CPR
- **Geothermal** – survey ground temps, log heat pump data, and maintain loop pressure/air
- **Hydroponics** – basil starts, bucket systems, EC calibration, and nutrient checks
- **Programming** – temperature logging, JSON APIs, alerts, and web server basics
- **Robotics** – line followers, servo control, pan-tilt rigs, and obstacle avoidance
- **Rocketry** – first launches, parachute recovery, fuel mixture safety, and guided builds
- **Sysadmin** – Linux basics, log analysis, and resource monitoring
- **UBI** – basic income onboarding, first payout, and savings goals
- **Woodworking** – sanding, birdhouses, shelves, and furniture builds

Run `node scripts/generate-quest-chart.js` from the repository root to produce a radar chart summarizing the quest tree sizes. The PNG output is ignored by Git, but CI artifacts attach the latest image.
