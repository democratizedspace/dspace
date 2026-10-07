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

### Changelog lifecycle and a slipped release date

Every dated entry has required frontmatter `status: draft` or `status: published`. The enum is
validated by `frontend/src/utils/changelogState.mjs`. Missing/invalid values fail closed; there is
no implicit legacy state and no clock/filename-based transition. Start new entries as `draft`.
Change to `published` only with explicit human release authorization and verified publication or
deployment evidence; a passed target date or an artifact tag alone does not authorize that edit.

The homepage and latest-release list use only `published` entries. The changelog shows drafts in a
separate "Upcoming drafts" section, and release-history RAG discovery excludes draft entries.
For legacy migration, verify each entry rather than assigning a blanket default. On October 4,
2026, all 13 existing entries through April 1 were verified as anchors on production `/changelog`,
including April's v3.0.1 addendum. Their migration adds frontmatter only; their bodies are unchanged.

Each new major or minor SemVer release gets one changelog entry. Patch versions add an addendum
to that same major/minor entry. For example, `frontend/src/pages/docs/md/changelog/20260401.md`
contains the v3.0.0 release and the May 21 v3.0.1 patch notes; the patch does not get a new file.
Do not rename the published major/minor entry for a patch. Preserve its earlier narrative and
append a dated patch section when authorized. The existing entry remains `published`; any patch
planning text must be explicitly labeled as draft until that patch is authorized and verified.

For an unpublished draft whose release date slips:

1. Confirm its unpublished status from the release owner's context, source history, and
   production changelog/deployment evidence. A filename, release-style wording, presence on main,
   or GitHub artifact record alone is not proof that the player-facing entry was published.
2. Rename the existing draft to the new `YYYYMMDD.md` filename. Update its frontmatter title/slug
   and tentative date while preserving `status: draft`, the intended release and its current scope.
3. Update internal links, navigation references, and tests to that single canonical draft. Do not
   leave an obsolete draft presented as a historical release, duplicate the entry, or substitute
   a separate release-preparation page or historical advisory.
   Preserve old draft URLs/anchors as redirects when needed, without retaining a duplicate entry.
4. Keep genuinely published entries and their patch addenda intact. Only published narrative
   history belongs in the preservation snapshots; an unpublished draft must remain editable.
5. Rerun history/link/rendering checks and candidate QA. The new date does not establish that
   readiness gates passed or authorize production promotion.

The release owner confirmed that the former August 1, 2026 v3.1.0 draft was never published.
Its canonical file is now `frontend/src/pages/docs/md/changelog/20261101.md`, for the same
**v3.1.0** release tentatively planned for **November 1, 2026**. Readiness takes priority.

### Application versions and chart versions

The application SemVer and Helm `appVersion` describe the same application; `appVersion` is not
a separate end-user release version. Root/frontend packages, root lockfile metadata, chart
`appVersion`, and the default semantic image tag must agree. Helm chart `version` is an independent
package version and agrees with `docs/apps/dspace.version` and the packaged chart filename.

Reconcile source metadata and existing immutable artifact records with the release owner's
intended version before publishing. Do not infer a new product target from an earlier metadata
bump, blindly downgrade coordinates, or overwrite an existing immutable tag/digest. A GitHub
artifact release record does not by itself establish which application is deployed in production
or whether a draft changelog was published.

The release owner approved source-only normalization to application **3.1.0** for the November
draft. Root/frontend packages, root lockfile metadata, canonical chart `appVersion`, and its
default semantic image tag now agree with that target. Independent chart **3.1.3** remains a
provisional prepared coordinate, not proof that it is available or published. Before chart
publication, verify its absence with the existing fail-closed guard; an occupied coordinate
requires a separately approved unused chart version and synchronized chart metadata.

This changes prepared source metadata only. It does not roll back code, rewrite retained images,
create tags/releases, or establish staging or production deployment. The existing
`20261101.md` remains `status: draft`; publication still requires explicit release authorization
and verified evidence. Published changelog bodies and their history remain unchanged.

For the November draft, artifact reconciliation remains a publication gate. Read-only checks on
October 4, 2026 found:

- [bd1ad0c15](https://github.com/democratizedspace/dspace/commit/bd1ad0c15aedaa886276318c7b190e3a88559519)
  prepared application/chart 3.1.0. Public GHCR already serves `dspace:v3.1.0` at
  `sha256:8c82cc08586637af2635f6caa331592b8dace4216cf0c54d5eb09fa0dec26430`, with image revision
  `ac5d26c62129a1be9d4e513a37475e6bef3e3321` (application package 3.1.0). The absence of a GitHub
  v3.1.0 release/tag does not make this occupied registry coordinate reusable.
- [14f2fcebe](https://github.com/democratizedspace/dspace/commit/14f2fcebefc59dda47332f878ea0b90f2f837067)
  prepared application 3.1.1/chart 3.1.2. A GitHub v3.1.1 record was published August 5;
  the October 4 check found public GHCR `dspace:v3.1.1` at
  `sha256:467890df969cc7938cb760f965fd8f90a8912b1dcb1f8425bc808216b7e1512b`, revision
  `22f506e07e0b5abfd0cf756e9c5827c0458fb4b2`. These artifact records do not publish the August draft.
- [ff8674fdd](https://github.com/democratizedspace/dspace/commit/ff8674fddfe78639c10f98f2b3fda9279af77066)
  bumped application/appVersion to 3.1.2 and chart to 3.1.3 while adding runtime default-provider
  configuration. Those earlier prepared metadata did not replace the user's requested v3.1.0
  goal; the source normalization above reconciles the application fields without republishing
  their artifacts.
- The production homepage check showed April 1 and its v3.0.1 patch addendum. Anonymous chart
  registry inspection returned an authorization response, so chart availability was not independently
  established by this check.

On October 6, the release owner reported deleting the invalid GitHub v3.1.1 release and Git tag
himself and directed that its container image remain. These are distinct artifact types; that
report does not establish deletion of any registry coordinate or explain other missing releases.
Retain the existing container images, including the older v3.1.0 image.

The verified October 6 branch build `main-8b3f6d5` has source
`8b3f6d51a503cbd745326da7918ef2feb7f1d63a`, image-index digest
`sha256:3aea64fd11b1d19a8106ccd967c9d372403a748d1b2efc6007adb4385a5559e7`, and embedded version
`v3.1.2+8b3f6d5`. It remains valid evidence for that earlier source, not a normalized v3.1.0
candidate or proof of deployment.

The occupied v3.1.0 application coordinate blocks semantic publication under the unchanged
immutable-artifact policy. Source normalization neither resolves that gate nor authorizes deletion,
retagging, overwrite, or a different publication policy. A separate release-owner decision is
required before semantic publication; do not silently relabel the intended release as 3.1.2.
The chart default `v3.1.0` may resolve to the retained older image, so never use it as evidence of
the November candidate. Staging must select the newly approved immutable branch-SHA image or
digest and verified chart from the same full source SHA, record runtime identity and QA evidence,
and pass before any separately authorized production promotion.

### Recording tags

When cutting a new release or RC tag:

1. Verify the tag exists (`git fetch --tags && git tag --list`).
2. Add the tag row to this file.
3. Update the active QA doc's release metadata section (for example `docs/qa/v3.0.2.md`).
4. Keep QA docs focused on release-specific execution notes, and keep historical tags centralized
   here.
