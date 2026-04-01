# Writing great quest prompts for the _dspace_ repo

Codex is a sandboxed engineering agent that can open this repository,
run its own tests, and send you a ready‑made PR—but only if you give it a
clear, file‑scoped prompt. Use this guide alongside
[Codex Prompts](baseline.md) when working on quests. To keep the prompt
docs improving, see the [Codex meta prompt](meta.md). If these
templates drift, refresh them with the [Codex Prompt Upgrader](upgrader.md).
For failing GitHub Actions runs, use the [Codex CI-failure fix prompt](ci-fix.md).
For the steps required to share quests with the community, see the
[Quest Submission Guide](/docs/quest-submission). Comprehensive content
guidelines live in our [Content Development Guide](/docs/content-development),
which covers quests, items and processes in detail.

> **TL;DR**
>
> 1. Scope changes to a single quest file.
> 2. Say exactly what output you expect (tests, docs).
> 3. Stop when the spec is complete. Codex treats all remaining text as
>    mandatory instructions.
> 4. Run `npm run lint`, `npm run type-check`, `npm run build`, and `npm run test:ci`;
>    scan staged changes with `git diff --cached | ./scripts/scan-secrets.py`;
>    commit with an emoji prefix.

---

## 1. Quick start (Web vs CLI)

- **Add or update a quest**
  - Web: use the “Code” button and attach the repo.
  - CLI: `codex "add quest solar/led-basics"`
- **Ask about quest files**
  - Web: use the “Ask” button.
  - CLI: `codex exec "explain frontend/src/pages/quests/json/*.json"`
- **Run quest tests**
  - Web: not supported yet.
  - CLI:
    ```bash
      codex exec "npm run lint && npm run type-check && npm run build && \
        npm run test:ci -- questCanonical questQuality"
    ```

See the [OpenAI CLI repository][openai-cli] for more flags.

---

## 2. Prompt ingredients

| Ingredient           | Why it matters                                                      |
| -------------------- | ------------------------------------------------------------------- |
| **Goal sentence**    | Gives the agent a north star (“Add safety step to `energy/solar`”). |
| **Files to touch**   | Limits search space → faster & cheaper.                             |
| **Constraints**      | Coding style, a11y, quest schema rules.                             |
| **Acceptance check** | e.g. “`npm run test:ci -- questCanonical questQuality` passes”.     |

Codex merges those instructions with any `AGENTS.md` files it finds, so keep
prompt‑level rules short and concrete.

## 2.1 Quest quality bar (required for new and upgraded quests)

Passing schema/tests is necessary but not sufficient. A quest should also clear
this quality bar:

1. **Depth over thin shells**
   - Avoid `start -> one instruction -> finish` unless it is explicitly a micro-quest.
   - Prefer meaningful intermediate steps (setup, execute, verify, reflect).
2. **Mechanics-backed proof**
   - At least one completion-critical step should be evidenced by DSPACE mechanics
     (`process`, `requiresItems`, or equivalent gates), not only narrative text.
3. **Troubleshooting branch**
   - Technical quests should include at least one “what went wrong” branch
     (bad reading, failed run, unsafe condition) and recovery action.
4. **Safety + realism**
   - Include concrete safety checks when the domain implies risk.
   - Use tool/material sequencing that can be reproduced in real life.
5. **Proportionate rewards and prerequisites**
   - Reward should fit effort and unlock value; avoid repetitive generic rewards
     that flatten progression identity.

If you intentionally violate one of these, document why in the PR summary.

## 2.2 Anti-patterns to avoid

These patterns repeatedly produce low-quality quests and should be treated as
failures during review:

- **Three-node thin shell** with no meaningful branch or verification.
- **Accumulation-only grind ladder** with no strategic decisions.
- **Single giant prose node** that does all teaching without in-game checks.
- **Decorative hardening metadata** (high scores/passes without substantive edits).
- **Identity drift** where quest ID, filename, and narrative labels diverge enough
  to confuse QA or graph diagnostics.

Reference analysis: `docs/design/v3-quest-quality-review.md`.

## 2.3 Required quality linkage notes (authors + LLMs)

When writing or rewriting a quest, treat the v3 quality review as the structural baseline:

- Read `docs/design/v3-quest-quality-review.md` before drafting quest changes.
- In PR notes, name at least one checked quest from `docs/qa/v3.md` §4.5 used as structural inspiration.
- In PR notes, name the anti-patterns you verified were avoided (for example: thin shell,
  accumulation-only ladder, giant prose node).
- Keep these notes lightweight (brief bullets are enough), but always include them.

---

## 3. Reusable template

```text
You are working in democratizedspace/dspace.

GOAL: <one sentence quest addition or edit>.

FILES OF INTEREST
- frontend/src/pages/quests/json/<quest-id>.json   ← quest definition

REQUIREMENTS
1. Follow the quest schema.
2. Reference at least one inventory item or process. Create missing items or
   processes in their registries and link them in the quest.
3. Find the most natural predecessor quest and update the `requiresQuests`
   chain so progression flows logically.
4. Use only existing image assets; do not add new image files because Codex cannot
   create new binary image files (for example `.png`, `.jpg`, `.webp`). For new quests,
   reuse an existing image in the PR and note that a human should replace it later via
   [https://github.com/democratizedspace/dspace/blob/v3/DEVELOPER_GUIDE.md#image-analysis-cli](https://github.com/democratizedspace/dspace/blob/v3/DEVELOPER_GUIDE.md#image-analysis-cli).
5. Run `npm run lint`, `npm run type-check`, and `npm run build`.
6. Run `npm run test:ci -- questCanonical questQuality` and fix any failures.
7. Run `npm run new-quests:update` and commit `/docs/new-quests.md`.
8. Run `git diff --cached | ./scripts/scan-secrets.py` and ensure no secrets.
9. Update docs or dialogue as needed.
10. Run a self-review and include the results in your PR notes:
    - What does the player learn?
    - What does the player prove using mechanics?
    - What can go wrong, and where is recovery modeled?
    - Why are prerequisites and rewards proportionate?
11. In PR notes, include (a) checked quest inspiration from `docs/qa/v3.md` §4.5 and
    (b) anti-patterns explicitly avoided, using `docs/design/v3-quest-quality-review.md`
    as your reference.

OUTPUT
A pull request with the completed quest and passing checks.
```

## Implementation Prompt

Use this when you want Codex to automatically create or upgrade a quest.

```text
SYSTEM:
You are an automated contributor for the DSPACE repository. Edit or create
quests under `frontend/src/pages/quests/json`. Ensure start, middle and
completion nodes, at least one item or process reference, and passing checks
(`npm run lint`, `npm run type-check`, `npm run build`, and
`npm run test:ci -- questCanonical questQuality`). Survey existing quests to
pick a natural predecessor and update `requiresQuests` accordingly. Add missing
items or processes to their registries, reuse existing image assets (Codex
cannot create new binary image files), and scan for secrets with
`git diff --cached | ./scripts/scan-secrets.py` before committing. In the PR
summary, ask a human to replace reused placeholder imagery via
[https://github.com/democratizedspace/dspace/blob/v3/DEVELOPER_GUIDE.md#image-analysis-cli](https://github.com/democratizedspace/dspace/blob/v3/DEVELOPER_GUIDE.md#image-analysis-cli).

USER:
1. Follow the steps above.
2. Run the commands listed in the system prompt before committing.
3. Run `npm run new-quests:update` and commit `/docs/new-quests.md`.
4. Summarize the new or updated quest in the PR description.
5. Include a brief self-review using the four quality questions above.
6. Include a short anti-pattern note explaining how the quest avoids thin-shell
   and accumulation-only designs.
7. Use an emoji-prefixed commit message.

OUTPUT:
A pull request implementing the quest with all tests green.
```

## One-click random quest

Spin up a brand‑new quest in a random quest tree with this drop‑in prompt. The
hand‑crafted quests on `main` are good references for tone and structure.

```text
SYSTEM:
You are an automated contributor for the DSPACE repository. List
the folders under `frontend/src/pages/quests/json` and pick one at random. Use
existing quests in that tree as examples for tone and structure.

USER:
1. Create a new quest JSON in the chosen tree following the quest schema.
2. Reference at least one inventory item or process.
3. Run `npm run lint`, `npm run type-check`, `npm run build`, and
   `npm run test:ci -- questCanonical questQuality`. Fix any failures.
4. Run `npm run new-quests:update` and commit `/docs/new-quests.md`.
5. Scan for secrets with `git diff --cached | ./scripts/scan-secrets.py` before committing.
6. Use an emoji-prefixed commit message.
7. Include a short note explaining how the quest avoids thin-shell and
   accumulation-only anti-patterns.

OUTPUT:
A pull request with the new quest.
```

## Upgrade prompt for new quests

Focus on recently added quests — [see the list](/docs/new-quests) —
to keep quality high as the codebase grows. This prompt uses the quest
quality tests to ensure that every technological step is represented in
the inventory (item registry) and process (`generated/processes.json`) registries and
grounded in reality with components that can be replicated in real life,
while the hardening loop tracks refinement passes over time.

```text
SYSTEM:
You are an automated contributor for the DSPACE repository.

USER:
1. Pick a quest ID from `frontend/src/pages/quests/json` that also appears in
   `/docs/new-quests`.
2. Improve clarity, safety notes and item or process references.
3. Check that every technology mentioned has a granular, real‑world entry in
    `frontend/src/pages/inventory/json/items` or
    `frontend/src/generated/processes.json`. Add missing items or
   processes so quests stay grounded in reality and are reproducible IRL.
4. If the quest includes an image, reuse an existing image URL already in the
   repository; do not add new or external images. For Codex-created PRs, reuse an
   existing image and explicitly mark human follow-up via
   [https://github.com/democratizedspace/dspace/blob/v3/DEVELOPER_GUIDE.md#image-analysis-cli](https://github.com/democratizedspace/dspace/blob/v3/DEVELOPER_GUIDE.md#image-analysis-cli).
5. Update the quest's `hardening` block, incrementing `passes`, refreshing the
   evaluator `score`, swapping the status `emoji` and appending a history entry
   with the Codex task ID, date and score. Choose the emoji based on:
   - 0 passes → score 0 → 🛠️ Draft
   - ≥1 pass & score ≥60 → 🌀 First polishing pass
   - ≥2 passes & score ≥75 → ✅ Meets internal quality bar
   - ≥3 passes & score ≥90 → 💯 Hardened – locked until spec change
   Example:
   "hardening": {
     "passes": 1,
     "score": 60,
     "emoji": "🌀",
     "history": [
       { "task": "codex-upgrade-2025-09-01", "date": "2025-09-01", "score": 60 }
     ]
   }
6. Run `npm run lint`, `npm run type-check`, `npm run build`, and
   `npm run test:ci -- questCanonical questQuality`. Update docs if needed.
7. Run `git diff --cached | ./scripts/scan-secrets.py` and ensure no secrets.
8. Include a four-question self-review note (learn / prove / failure / proportion).
9. Include a short anti-pattern note explaining how the update avoids thin-shell
   and accumulation-only patterns.
10. Use an emoji-prefixed commit message.

OUTPUT:
A pull request with the refined quest, updated hardening block and passing tests.
```

## Additional tips for AI assistance

Modern assistants can be powerful collaborators. Keep in mind:

- **Provide clear context** about DSPACE's educational mission and sustainability focus.
- **Use system prompts** to guide tone and technical accuracy.
- **Iterate on outputs** rather than expecting perfection on the first try.
- **Fact-check technical information** since AI systems can generate plausible
  but incorrect details.

[openai-cli]: https://platform.openai.com/docs/guides/openai-cli/

## Upgrader Prompt

Type: evergreen

Use this prompt to keep quest-writing guidance current.

```text
SYSTEM:
You are an automated contributor for the DSPACE repository. Follow `AGENTS.md` and `README.md`.
Ensure `npm run lint`, `npm run type-check`, `npm run build`,
and `npm run test:ci` pass before committing.

USER:
1. Ensure quest schema links, hardening steps, and submission docs are current.
2. Update examples when item or process registries change.
3. Run the checks above.
4. Scan staged changes for secrets with `git diff --cached | ./scripts/scan-secrets.py`.
5. Commit with an emoji-prefixed message.

OUTPUT:
A pull request refining the quest prompt doc with passing checks.
```
