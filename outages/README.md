# Outage Catalog

Structured archive of past outages. Each outage is stored as a JSON file using the
schema in `schema.json` with a companion Markdown narrative.

File naming: `YYYY-MM-DD-<slug>.json` paired with `YYYY-MM-DD-<slug>.md`.

Required JSON fields:
- `id`: unique identifier
- `date`: ISO date matching the filename prefix
- `component`: affected subsystem
- `rootCause`: brief description of failure cause
- `resolution`: how it was fixed
- `references`: array of related links (PRs, issues, docs)

Optional fields:
- `longForm`: path to the Markdown report (`outages/<filename>.md`)
- `dateRanges`: list of `{ start, end }` ISO dates when the outage spanned multiple days

Validation rules enforced by tests:
- JSON entries must conform to the schema
- Dates cannot be in the future and must match the filename prefix
- Every outage JSON has a matching Markdown file (and vice versa)
- `longForm`, when present, must point to the paired Markdown file
