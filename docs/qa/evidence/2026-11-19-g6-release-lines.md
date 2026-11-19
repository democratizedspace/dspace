# G6 release-line validation evidence

Scope: focused pre-merge G6 work from main
`fa81db307ec6f4ff3ac16525f56f61c07e84bc27`, verified as the merge of #4889.
This evidence does not close the shared release checklist or authorize publication.

The maintenance release-line validator was absent on this base. The new
`docs/changelog-release-lines.json` maps the three historical major/minor lines
and the existing v3.1 draft `20261101.md`. The validator checks date filenames,
unique line ownership, current application version, consecutive patch headings,
missing/duplicate/misplaced sections, and the closed historical exception list.
Prose references and fenced examples are not release declarations.

Main's current draft declares `v3.1.0` at the start of its frontmatter tagline,
not in a heading. The validator accepts a full mapped base version in either a
heading or the tagline, checks any explicit tagline against the mapped base, and
retains the three exact historical base-heading exceptions. This avoids editing
dated entries or weakening validation to accept arbitrary prose mentions.
Frontmatter is parsed with the existing `yaml` dependency and publication state
is checked through the existing `getChangelogStatus` helper; dates never change it.

Run from the repository root with its existing dependencies:

```sh
node scripts/check-changelog-release-lines.mjs
node --test scripts/check-changelog-release-lines.test.mjs
```

CI's build job runs both commands after frozen dependency installation, with no
conditional skip or soft failure. The regression suite also checks that wiring.
The 35 tests cover valid current repository/draft/patch behavior, malformed or
missing mappings, invalid dates/slugs/states, duplicate YAML states, misplaced
published-history release headings, patch ordering and closed exceptions. Tests
exercise the actual existing draft/published selector: production/default remains
published-only and explicit staging preview returns the draft without mutation.

Published prose preservation remains enforced by existing
`tests/changelogHistoryGuard.test.ts` (preserved bodies and snapshot hashes) and
`tests/changelogState.test.ts` (April/v3.0.1 body hash and draft lifecycle).
`tests/changelogDocsReleaseChecklist.test.ts` preserves rc.6 range evidence without
claiming full QA, and `tests/homepageChangelog.test.ts` covers environment selection.
These complement structural validation; this new validator does not authorize
narrative changes or infer release-owner approval from valid syntax. Existing
correction metadata/snapshot review rules continue to apply.

Local verification on 2026-11-19 UTC: 35/35 standalone tests and the repository
validator passed using already cached Node 22.23.4 and YAML, without installation.
This is not the supported Node 24.22.3 CI result; final-head CI must supply that
evidence and run the existing history/lifecycle suite. Scoped formatting and
`git diff --check` pass. No dated changelog, lifecycle/UI source, snapshot,
dependency, runtime pin, or shared release checklist is changed. No staging,
registry, deployment or release action was performed.
