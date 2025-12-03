---
title: 'Outage Catalog'
slug: 'outages'
---

# Outage Catalog

A structured history of dspace outages lives under `/outages`. Each incident is stored as a
JSON file matching [`outages/schema.json`](../../../../../outages/schema.json).

## Adding a record

1. Create `outages/YYYY-MM-DD-<slug>.json`.
2. Follow the schema fields:
    - `id` – unique identifier
    - `date` – ISO format date
    - `component` – affected subsystem
    - `rootCause` – brief description of the failure
    - `resolution` – how it was fixed
    - `references` – related PR or documentation links
3. Submit a PR with the new file.

Agents can parse the JSON files to reason about prior outages and avoid repeating mistakes.
Prompts for incident response should instruct agents to consult this catalog and add new entries.

## Recent narrative entries

-   [2025-12-02 – v3 UI regressions](/docs/outages/2025-12-02-v3-ui-regressions)
