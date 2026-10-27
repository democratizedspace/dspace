# DSPACE Release History

This is the canonical list of all historical DSPACE release tags.

- [Repository tags index](https://github.com/democratizedspace/dspace/tags)
- Keep this file up to date whenever a new release or release candidate tag is created.
- QA checklists in `docs/qa/` may include release metadata snapshots, but this file is the
  source of truth for historical tags.

## Tagged releases

| Tag | Channel | GitHub release page |
| --- | --- | --- |
| `v1.0.0` | Stable release | [`v1.0.0`](https://github.com/democratizedspace/dspace/releases/tag/v1.0.0) |
| `v2.1.0` | Stable release | [`v2.1.0`](https://github.com/democratizedspace/dspace/releases/tag/v2.1.0) |
| `v3.0.0-rc.1` | Release candidate | [`v3.0.0-rc.1`](https://github.com/democratizedspace/dspace/releases/tag/v3.0.0-rc.1) |
| `v3.0.0-rc.2` | Release candidate | [`v3.0.0-rc.2`](https://github.com/democratizedspace/dspace/releases/tag/v3.0.0-rc.2) |
| `v3.0.0-rc.3` | Release candidate | [`v3.0.0-rc.3`](https://github.com/democratizedspace/dspace/releases/tag/v3.0.0-rc.3) |
| `v3.0.0-rc.4` | Release candidate | [`v3.0.0-rc.4`](https://github.com/democratizedspace/dspace/releases/tag/v3.0.0-rc.4) |
| `v3.0.0` | Stable release | [`v3.0.0`](https://github.com/democratizedspace/dspace/releases/tag/v3.0.0) |
| `v3.0.1-rc.1` | Release candidate | [`v3.0.1-rc.1`](https://github.com/democratizedspace/dspace/releases/tag/v3.0.1-rc.1) |
| `v3.0.1-rc.2` | Release candidate | [`v3.0.1-rc.2`](https://github.com/democratizedspace/dspace/releases/tag/v3.0.1-rc.2) |
| `v3.0.1-rc.3` | Release candidate | [`v3.0.1-rc.3`](https://github.com/democratizedspace/dspace/releases/tag/v3.0.1-rc.3) |
| `v3.0.1-rc.4` | Release candidate | [`v3.0.1-rc.4`](https://github.com/democratizedspace/dspace/releases/tag/v3.0.1-rc.4) |
| `v3.0.1-rc.5` | Release candidate | [`v3.0.1-rc.5`](https://github.com/democratizedspace/dspace/releases/tag/v3.0.1-rc.5) |
| `v3.0.1-rc.6` | Release candidate | [`v3.0.1-rc.6`](https://github.com/democratizedspace/dspace/releases/tag/v3.0.1-rc.6) |

## QA checklists tracked separately (not a tag list)

The files below exist in `docs/qa/` but are not listed in the table above unless a matching git tag
exists:

- `docs/qa/v3.0.1.md`
- `docs/qa/v3.1.md`

## Update checklist

### Changelog files and patch addenda

Each new major or minor version creates one `YYYYMMDD.md` file under
`frontend/src/pages/docs/md/changelog/`, using that release's date. Record the
`major.minor.0` to filename mapping in `docs/changelog-release-lines.json`.
Each patch version appends a dated patch-addendum section to the same major/minor
file; it does not create a new date file. Keep patch sections unique and in
consecutive version order, with each patch following its predecessor. New major/minor
files require a full stable version heading; only the explicitly enumerated historical
base releases retain their original heading formats. Full stable version headings declare release sections;
ordinary prose references and fenced examples do not.

For example, `20260401.md` contains v3.0.0 and the complete v3.0.1 addendum;
v3.0.2 is appended immediately after v3.0.1. A future v3.1.0 or v4.0.0 needs its
own dated file and mapping. Preserve existing published prose when appending.
The manifest explicitly preserves the older unversioned entries and redirect;
that exception list is historical, not a way to register new releases.

`node scripts/check-changelog-release-lines.mjs` validates the mapping, date
filenames, current application version, unique patch sections and placement.
`tests/changelogReleaseLines.test.ts` exercises positive and negative fixtures.

### v3.0.2 cutover before tagging

The owner publishes the reviewed commit as an immutable image coordinate before
staging, verifies staging, and promotes the same digest to production. Only after
production verification may the owner create and push Git tag `v3.0.2` on that
exact deployed source commit. A pending changelog addendum is not proof of a tag,
release, or deployment. Do not add a historical tag row before the tag exists.
See [the hotfix handoff](v3.0.2-security-hotfix.md) for publication and rollback gates.

### After an authorized tag exists

When cutting a new release or RC tag:

1. Verify the tag exists (`git fetch --tags && git tag --list`).
2. Add the tag row to this file.
3. Update the active QA doc's release metadata section (for example `docs/qa/v3.0.2.md`).
4. Keep QA docs focused on release-specific execution notes, and keep historical tags centralized
   here.
