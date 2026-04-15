# DSPACE Release History

This is the canonical list of all historical DSPACE release tags.

- [Repository tags index](https://github.com/democratizedspace/dspace/tags)
- Keep this file up to date whenever a new release or release candidate tag is created.
- QA checklists in `docs/qa/` may include release metadata snapshots, but this file is the
  source of truth for historical tags.

## Tagged releases

| Tag           | Channel           | GitHub release page                                                                   |
| ------------- | ----------------- | ------------------------------------------------------------------------------------- |
| `v1.0.0`      | Stable release    | [`v1.0.0`](https://github.com/democratizedspace/dspace/releases/tag/v1.0.0)           |
| `v2.1.0`      | Stable release    | [`v2.1.0`](https://github.com/democratizedspace/dspace/releases/tag/v2.1.0)           |
| `v3.0.0-rc.1` | Release candidate | [`v3.0.0-rc.1`](https://github.com/democratizedspace/dspace/releases/tag/v3.0.0-rc.1) |
| `v3.0.0-rc.2` | Release candidate | [`v3.0.0-rc.2`](https://github.com/democratizedspace/dspace/releases/tag/v3.0.0-rc.2) |
| `v3.0.0-rc.3` | Release candidate | [`v3.0.0-rc.3`](https://github.com/democratizedspace/dspace/releases/tag/v3.0.0-rc.3) |
| `v3.0.0-rc.4` | Release candidate | [`v3.0.0-rc.4`](https://github.com/democratizedspace/dspace/releases/tag/v3.0.0-rc.4) |
| `v3.0.1-rc.1` | Release candidate | [`v3.0.1-rc.1`](https://github.com/democratizedspace/dspace/releases/tag/v3.0.1-rc.1) |
| `v3.0.1-rc.2` | Release candidate | [`v3.0.1-rc.2`](https://github.com/democratizedspace/dspace/releases/tag/v3.0.1-rc.2) |
| `v3.0.1-rc.3` | Release candidate | [`v3.0.1-rc.3`](https://github.com/democratizedspace/dspace/releases/tag/v3.0.1-rc.3) |

## QA checklists tracked separately (not a tag list)

The files below exist in `docs/qa/` but are not listed in the table above unless a matching git tag
exists:

- `docs/qa/v3.0.1.md`
- `docs/qa/v3.1.md`

## Update checklist

When cutting a new release or RC tag:

1. Verify the tag exists (`git fetch --tags && git tag --list`).
2. Add the tag row to this file.
3. Update the active QA doc's release metadata section (for example `docs/qa/v3.0.2.md`).
4. Keep QA docs focused on release-specific execution notes, and keep historical tags centralized
   here.
