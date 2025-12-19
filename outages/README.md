# Outage Catalog

Structured archive of past outages. Each outage is stored as a JSON file using the
schema in `schema.json`, and long-form narratives live alongside them in Markdown.

File naming: `YYYY-MM-DD-<slug>.json` and `YYYY-MM-DD-<slug>.md` for the companion
narrative. The JSON `longForm` field should point at the Markdown path when present.

Required fields:
- `id`: unique identifier
- `date`: ISO date
- `component`: affected subsystem
- `rootCause`: brief description of failure cause
- `resolution`: how it was fixed
- `references`: array of related links (PRs, issues, docs)

Optional fields:
- `longForm`: `outages/<basename>.md` path for the Markdown report
- `dateRanges`: list of `{ start, end }` ranges capturing multi-day incidents

Agents and humans can parse these files to learn from previous incidents.
