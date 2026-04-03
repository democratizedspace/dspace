# DSPACE Historical Releases (Canonical Tag Index)

This document is the canonical historical index of shipped and release-candidate DSPACE versions.

- Tag list on GitHub: <https://github.com/democratizedspace/dspace/tags>
- Ongoing release QA docs (for example `docs/qa/v3.0.1.md`, `docs/qa/v3.1.md`) should keep their
  local **Release metadata** sections, but use this file as the source of truth for the complete
  historical list.

## Releases

| Version | Type | Tag page | Source bundle |
| --- | --- | --- | --- |
| `v3.0.0` | GA release | <https://github.com/democratizedspace/dspace/releases/tag/v3.0.0> | <https://github.com/democratizedspace/dspace/archive/refs/tags/v3.0.0.tar.gz> |
| `v3.0.0-rc.4` | Release candidate | <https://github.com/democratizedspace/dspace/releases/tag/v3.0.0-rc.4> | <https://github.com/democratizedspace/dspace/archive/refs/tags/v3.0.0-rc.4.tar.gz> |
| `v3.0.0-rc.3` | Release candidate | <https://github.com/democratizedspace/dspace/releases/tag/v3.0.0-rc.3> | <https://github.com/democratizedspace/dspace/archive/refs/tags/v3.0.0-rc.3.tar.gz> |
| `v3.0.0-rc.2` | Release candidate | <https://github.com/democratizedspace/dspace/releases/tag/v3.0.0-rc.2> | <https://github.com/democratizedspace/dspace/archive/refs/tags/v3.0.0-rc.2.tar.gz> |
| `v3.0.0-rc.1` | Release candidate | <https://github.com/democratizedspace/dspace/releases/tag/v3.0.0-rc.1> | <https://github.com/democratizedspace/dspace/archive/refs/tags/v3.0.0-rc.1.tar.gz> |
| `v2.1.0` | GA release | <https://github.com/democratizedspace/dspace/releases/tag/v2.1.0> | <https://github.com/democratizedspace/dspace/archive/refs/tags/v2.1.0.tar.gz> |
| `v1.0.0` | GA release | <https://github.com/democratizedspace/dspace/releases/tag/v1.0.0> | <https://github.com/democratizedspace/dspace/archive/refs/tags/v1.0.0.tar.gz> |

## Maintenance

When cutting a new tag:

1. Add a new row to the table above (newest first).
2. Keep the link format consistent (`/releases/tag/<tag>` and `/archive/refs/tags/<tag>.tar.gz`).
3. If a release checklist has a local metadata section, keep it there and cross-reference this file.
