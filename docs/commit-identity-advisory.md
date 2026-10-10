# Commit identity advisory

This is a warning-only metadata check for pull requests and branch pushes in
`democratizedspace/dspace`. It welcomes outside contributions. It does not block
merges, authenticate a person, infer unauthorized access, or rewrite history.
Corrections are manual. No comments, artifacts, Slack messages, new credentials,
required checks, branch protections, or permission changes are created.

## Reviewed identity policy

`.github/commit-identity-policy.json` is separate from repository membership.
Daniel approved the initial account ID and expected local agent identity using
his local commit log. The exact UTF-8 name and email are compared through SHA-256
digests; they are not printed or written to temporary files. Hashing is for
comparison and output minimization, not secrecy or identity authentication.
Review policy changes as carefully as workflow changes. The repository-keyed
schema supports future reuse; only DSPACE is configured here.

A committer is in scope if its API account ID, raw name digest, or raw email digest
matches a reviewed policy entry. A mismatch of the expected pair or a conflicting
API account ID emits `COMMITTER_IDENTITY_MISMATCH`. An unrelated outside committer
gets neutral `ATTRIBUTED_COMMITTER_UNREVIEWED` status, not a mismatch warning.
Authors are never compared: genuine contributors and imported/cherry-picked
authors keep their attribution. A GitHub-attributed Bot gets neutral
`BOT_ATTRIBUTION_UNREVIEWED` status. A self-declared bot name grants no exemption,
and bot attribution cannot override a match to the reviewed policy. GitHub's
web-flow committer is also preserved without assuming it is Daniel.

Null or malformed API attribution receives a coverage warning. Even an expected
name/email pair cannot establish authentication. Unrelated incorrect identities
cannot be detected from metadata alone; an agent that changes all its identity
fields is outside this narrow comparison. Do not treat neutral status as a
verified email allowlist or proof of provenance.

## Membership investigation

GitHub's [collaborator API](https://docs.github.com/en/rest/collaborators/collaborators)
can provide stable account IDs, logins, base-role `permissions.push`, and the
effective highest `role_name`, including inherited grants. It does not verify
emails or distinguish every source of a grant. A supported per-user permission
query confirmed the known account has admin permission. The connected tool could
not enumerate collaborators because that endpoint is outside its allowed routes.
No restriction was bypassed and no membership list is invented or embedded.
The workflow does not request extra permissions or attempt this unavailable list.
Future membership snapshots must paginate, preserve custom role information, and
remain separate from explicitly reviewed expected identities.

## Trust and privacy

The `pull_request_target` job never checks out or runs PR code, dependencies,
configuration, or policy. The fixed bootstrap resolves the repository's default
branch through GitHub, pins its full commit SHA, and loads the checker and policy
from that same revision into memory. Branch pushes use the same trusted files.
No metadata is interpolated into a shell, CLI argument, filename, job name, or
summary. API redirects and supplied pagination URLs are not followed. Requests
have timeouts, bounded response sizes and fatal UTF-8 decoding.

Output contains only validated full owner/repo, validated hexadecimal commit SHA
(when available), and fixed categories. Warning annotations use the same payload.
No names, emails, refs, messages, response bodies, or exception text are emitted.
Shell tracing is disabled and bootstrap stderr is suppressed; a failed step has
a fixed fallback warning. There are no summaries or artifacts containing metadata.
GitHub's own platform UI/event storage and unrelated workflows are outside this
check's output contract. Do not enable external HTTP/body logging around it.

Push workflow YAML is taken from the pushed branch by GitHub. A writer can change
or remove that YAML; this advisory is not a tamper-resistant security control.
The first PR introducing the workflow cannot run its checker from main until
merged; a branch-push bootstrap warning is expected during initial rollout.

## Coverage and manual review

- PR commits are paginated and checked against the PR count, head, and base before
  and after retrieval. GitHub [caps this endpoint at 250 commits](https://docs.github.com/en/rest/pulls/pulls#list-commits-on-a-pull-request).
  Larger PRs, races, duplicates, missing heads, or count discrepancies warn.
- Ordinary pushes use the before/after comparison with generated page numbers,
  deduplication and total-count agreement, capped at 30 pages (3,000 commits).
  Force pushes inspect introduced commits where available and warn that removed
  history is outside coverage; backwards/reset pushes also warn.
- New branches inspect only the head and explicitly warn that earlier branch
  history is not covered. Deletions report a coverage category without claiming
  that deleted history was inspected. Tags are excluded.
- API failures, rate limits, malformed JSON/encoding, unavailable trusted files,
  unexpected exceptions and interrupted steps emit fixed coverage warnings.
  `COVERAGE_COMMIT_LIST_COMPLETE` means enumeration completed, not that identities
  are verified or that no mismatch was found. It may accompany mismatch warnings.
- GitHub [does not trigger push workflows for pushes made with GITHUB_TOKEN](https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/trigger-a-workflow).
  Such pushes have no run to emit a warning. Disabled Actions, GitHub event
  suppression, job cancellation, runner outages and resource exhaustion can also
  prevent the final warning from running. This is not continuous monitoring.

For a warning, open the commit by its hash in `democratizedspace/dspace` and inspect
the metadata privately. Confirm whether the committer should use the reviewed
identity, or whether it is a legitimate outside/imported/platform identity.
Correct local configuration for future commits manually. Do not rewrite existing
history or change permissions based solely on an advisory.

## Tests

Run `node --test tests/commitIdentityAdvisory.test.mjs` with HOME, USERPROFILE,
XDG_CONFIG_HOME, XDG_CACHE_HOME and npm_config_cache set to task-local directories.
The suite uses Node built-ins, mock API responses, and captured stdout/stderr;
it requires no installation or network access. It tests privacy, enumeration,
attribution boundaries and the exact inline bootstrap failure paths.
