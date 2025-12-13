# Outage Catalog

Structured archive of past outages. Each outage is stored as a JSON file using the
schema in `schema.json`.

File naming: `YYYY-MM-DD-<slug>.json`.

Required fields:
- `id`: unique identifier
- `date`: ISO date
- `component`: affected subsystem
- `rootCause`: brief description of failure cause
- `resolution`: how it was fixed
- `references`: array of related links (PRs, issues, docs)

Agents can parse these files to learn from previous incidents.
