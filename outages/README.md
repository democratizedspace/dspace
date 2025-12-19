# Outage Catalog

Structured archive of past outages. Each outage is stored as a JSON file using the
schema in `schema.json` and, when possible, has a matching Markdown narrative.

Conventions
- File naming: `YYYY-MM-DD-<slug>.json` and `YYYY-MM-DD-<slug>.md` share the same basename.
- `longForm` points at the Markdown file (e.g., `outages/YYYY-MM-DD-slug.md`).
- Use `dateRanges` to record multi-day investigations while keeping `date` aligned to the
  primary incident close-out.
- Keep `references` populated with PRs, issues, or runbooks used during remediation.

Validation
- Root tests assert JSON files match the schema, dates are not in the future, and Markdown
  files have JSON companions.
