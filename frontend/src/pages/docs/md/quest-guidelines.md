---
title: 'Quest Development Guidelines'
slug: 'quest-guidelines'
---

# Quest Development Guidelines

This guide provides structured instructions for creating engaging, educational quests that align
with DSPACE's mission to democratize space exploration through practical, hands-on learning
experiences. Start with the
[Quest Template Example](/docs/quest-template) and consult the
[Quest Schema Requirements](/docs/quest-schema) for field definitions. When your quest is ready,
follow the [Quest Contribution Guidelines](/docs/quest-contribution) and the
[Quest Submission Guide](/docs/quest-submission) to share it with the community. For an overview of
existing quest categories, see [Quest Trees](/docs/quest-trees).

## Quest Philosophy

DSPACE quests should:

1. **Be grounded in reality** - Focus on projects people can actually build at home
2. **Follow logical progression** - Start with beginner-friendly content before advanced concepts
3. **Provide educational value** - Teach useful skills that connect to space exploration themes
4. **Emphasize sustainability** - Showcase environmentally responsible approaches
5. **Be scientifically accurate** - Present correct information with proper terminology

## Quest Categories

Quest trees map to the folders in `frontend/src/pages/quests/json`. The current in-game trees are
listed in [Quest Trees](/docs/quest-trees). When writing new content, align the quest's `id` with an
existing tree unless you're intentionally adding a new category.

Current trees include:

- **3D Printing**
- **Aquaria**
- **Astronomy**
- **Chemistry**
- **Completionist**
- **Composting**
- **DevOps**
- **Electronics**
- **Energy**
- **First Aid**
- **Geothermal**
- **Hydroponics**
- **Programming**
- **Robotics**
- **Rocketry**
- **Sysadmin**
- **UBI**
- **Welcome**
- **Woodworking**

### Quest Tree Documentation Requirement

When you add a quest to an existing tree (or create a new tree), update a matching doc in the
Skills category under `frontend/src/pages/docs/md/` so reviewers can audit progression without
reverse-engineering JSON. Use [Composting](/docs/composting) as the reference format.

Each tree doc should include:

- Quest order and `requiresQuests` relationships
- Dialogue-level `requiresItems` gates that affect progression
- Quest-level `grantsItems` (or an explicit “None” when absent)
- Quest `rewards`
- Linked process references with accurate Requires / Consumes / Creates summaries

If you change quest gating or inventory flow, update the corresponding Skills doc in the same pull
request.

## Quest ↔ Docs 1:1 Contract (Required)

Every quest tree directory under `frontend/src/pages/quests/json/<tree>/` must have a matching
`/docs/<tree>` page and a Skills chip on `/docs`. Treat quest JSON and tree docs as a single
change unit in the same pull request.

### Required workflow checklist (copy/paste)

- [ ] If a tree directory is added/removed/renamed under `frontend/src/pages/quests/json/<tree>/`:
    - [ ] Ensure `/docs/<tree>` is present in the `/docs` Skills section via merged auto-discovery.
    - [ ] Ensure `frontend/src/pages/docs/md/<tree>.md` exists and documents the full tree.
- [ ] If any quest JSON changes:
    - [ ] Update `frontend/src/pages/docs/md/<tree>.md` in the same PR (gates, grants, rewards,
          process IO, QA notes).
    - [ ] Run `npm run lint`, `npm run link-check`, and the bulk quest validator.
- [ ] **Don't invent grants**: docs may only list `grantsItems` that exist in quest JSON (quest or
      option level). Process `creates` are process outputs and must not be labeled as quest grants
      unless explicitly granted by quest JSON.
- [ ] **Branched trees**: when `requiresQuests` branches, document Main path + Branches (or a clear
      edge list). Do not force false linear ordering.
- [ ] **After docs, tweak quests**: update docs first, then apply minimal quest JSON fixes justified
      by the docs review.

### Deterministic QA audit checklist

1. Anti-pattern scan (process option gated by its own output, or equivalent redundant gates):
   `rg -n "\"requiresItems\"|\"process\"\s*:\s*\"" frontend/src/pages/quests/json/<tree> -S`
2. Repeated-log minimum counts: when later quests require repeated measurements/logging, gate
   continue/skip options on count `>= N` instead of forcing process reruns for players who already
   have enough.
3. Rewards sanity: only tune rewards when docs expose a clear progression blocker.

### Required verification commands for PR descriptions

```bash
npm run lint
npm run link-check
for f in frontend/src/pages/quests/json/*/*.json; do node scripts/validate-quest.js "$f" || exit 1; done
```

### Quest quality and reliability test suites

Beyond JSON validation, quest quality relies on these automated suites:

- `frontend/__tests__/questCanonical.test.js`
- `frontend/__tests__/questQuality.test.js`
- `frontend/__tests__/questSimulation.test.js`
- `frontend/__tests__/questDependencies.test.js`
- `tests/questDialogueValidation.test.ts`
- `tests/questSchemaValidation.test.ts` and `tests/builtinQuestSchema.test.ts`
- `tests/questRewardsValidation.test.ts` and `tests/questCompletableItems.test.ts`
- `tests/questProcessCoverage.test.ts` and `tests/questProcessNecessitySimulation.test.ts`
- `tests/questReliabilityCoverage.test.ts`
- `tests/questProcessRecoveryPaths.test.ts` and `tests/questRewardGrantSeparation.test.ts`
- `tests/questStaticTestRegression.test.ts` (regression guard for static-test proof gating and process-option traversal semantics)
- `tests/questDependencyReferences.test.ts`, `tests/questGraphValidation.test.ts`, `tests/questGraph.test.ts`, and `tests/questPrerequisites.test.ts`
- `tests/progressionBalance.test.ts`
- `tests/sysadminQuestQuality.test.ts`

Run them with a command that accepts explicit test file paths, for example `npm run test:root -- frontend/__tests__/questCanonical.test.js frontend/__tests__/questQuality.test.js frontend/__tests__/questSimulation.test.js frontend/__tests__/questDependencies.test.js tests/questDialogueValidation.test.ts tests/questSchemaValidation.test.ts tests/builtinQuestSchema.test.ts tests/questRewardsValidation.test.ts tests/questCompletableItems.test.ts tests/questProcessCoverage.test.ts tests/questProcessNecessitySimulation.test.ts tests/questReliabilityCoverage.test.ts tests/questProcessRecoveryPaths.test.ts tests/questRewardGrantSeparation.test.ts tests/questStaticTestRegression.test.ts tests/questDependencyReferences.test.ts tests/questGraphValidation.test.ts tests/questGraph.test.ts tests/questPrerequisites.test.ts tests/progressionBalance.test.ts tests/sysadminQuestQuality.test.ts`.

## Quest Structure Guidelines

### Progressive Difficulty

Organize quests in a **clear progression** from beginner to advanced:

1. **Entry Level** - Minimal equipment, very accessible, quick results
2. **Beginner** - Common household items or inexpensive purchases
3. **Intermediate** - More specialized equipment, longer timeframes
4. **Advanced** - Specialized equipment, technical knowledge, significant commitment

### Quest Dependencies

- Make dependencies clear and logical
- Only `welcome/howtodoquests` should have an empty `requiresQuests` list. All other quests must
  depend on it directly or on a downstream quest so new players always learn the mechanics first.
  This rule is enforced by automated repository tests to prevent regressions.
- Each category should have a clear entry point that chains back to `welcome/howtodoquests`.
- Dependencies should mirror the real learning path so prerequisites teach the skills needed for
  later quests.
- Advanced quests should require completion of relevant prerequisites

## Content Guidelines

### Dialogue Best Practices

1. **Authentic Voice**: Each NPC should have a consistent personality
2. **Educational Tone**: Instructive without being condescending
3. **Technical Accuracy**: Use proper terminology and scientifically accurate information
4. **Clear Instructions**: Step-by-step guidance that's easy to follow
5. **Branching Options**: Provide meaningful choices where appropriate

### Safety First

- Always include appropriate safety warnings
- Recommend proper protective equipment when needed
- Never encourage dangerous activities or improper handling of materials

### Process Duration Realism

- Processes introduce time-based play and should reflect real-world timing. Quick setup actions
  (plugging in a smart plug, scanning a barcode, initiating a download) should resolve in seconds,
  while longer projects scale sensibly (filling a bucket in under a minute, printing a Benchy in a
  couple of hours, growing a plant over weeks).
- When quests reference processes, double-check durations against the real task to keep the
  experience grounded and avoid multi-hour waits for introductory tutorials.

## Examples of Well-Structured Quest Sequences

### Aquaria Sequence (Example)

1. **Position the Tank** (Entry) - Choose a safe, stable location
2. **Sponge Filter** (Beginner) - Add mechanical filtration
3. **Walstad Method** (Intermediate) - Set up a planted, low-tech tank
4. **Shrimp Care** (Intermediate) - Introduce shrimp and floating plants
5. **Goldfish Care** (Advanced) - Meet higher filtration and water quality needs

### Hydroponics Sequence (Example)

1. **Basil Growing** (Entry) - Simple setup with minimal equipment
2. **Bucket System** (Beginner) - Move to a basic bucket configuration
3. **Lettuce Production** (Intermediate) - Add leafy greens with routine checks
4. **Nutrient Refresh** (Intermediate) - Refresh reservoir nutrients and pH
5. **Stevia Regrowth** (Advanced) - Maintain and regrow a more sensitive crop

### Electronics Sequence (Example)

1. **Basic Circuit** (Entry) - Simple LED circuit with battery
2. **Arduino Blink** (Beginner) - Programmed interactions
3. **Light Sensor** (Intermediate) - Read sensor data reliably
4. **Temperature Logging** (Intermediate) - Capture and chart readings
5. **Potentiometer Dimmer** (Advanced) - Build a variable control circuit

## Quest Technical Requirements

### Required Fields

Every quest JSON file must include:

- `id`: Unique identifier following the pattern `category/name`
- `title`: Display title of the quest
- `description`: Brief description explaining the quest purpose
- `image`: Path to quest image
- `npc`: Path to NPC avatar image (choose from the NPC list in [/docs/npcs](/docs/npcs))
- `start`: ID of the starting dialogue node
- `dialogue`: Array of dialogue nodes, each containing:
    - `id`: Node identifier
    - `text`: NPC's dialogue text
    - `options`: Array of player response options, including:
        - `type`: Action type (goto, finish, process, grantsItems)
        - `text`: Player's response text
        - `goto`: For type:goto, target node ID
        - `process`: For type:process, process ID
        - `requiresItems`: Optional items needed to select option
        - `grantsItems`: Optional items given when selecting option
        - `requiresGitHub`: Optional schema field used by the quest runtime to gate an option
- `rewards`: Items given upon quest completion
- `requiresQuests`: Array of quest IDs that must be completed first (select these in the quest
  form under **Quest Requirements**). Automated tests ensure these dependencies reference
  existing quests and avoid cycles.

Quest data is validated against a JSON schema. In the in-game editor, titles and descriptions
reject `<` and `>` characters, and `image` must be a data URL, an absolute HTTP(S) link, or a
root-relative path. Quest titles must be unique across all existing quests.

### Current Implementation State

> **Note:** The quest editor lets you build branching dialogue directly in the browser. The current
> implementation in `QuestForm.svelte` supports quest metadata (title, description, image),
> selecting required quests, choosing an NPC, creating dialogue nodes with `goto`, `finish`,
> `process`, or `grantsItems` options, and adding item requirements or rewards on each option. You
> can choose the start node and manage options without writing JSON, and the preview updates live
> for uploaded images. The form remains mobile‑responsive and stacks action buttons on small
> screens. Advanced option flags like `requiresGitHub` are part of the JSON schema/runtime but are
> not exposed in the editor UI.

The editor focuses on the fundamentals today and exposes controls to gate dialogue options on
specific items or grant rewards inline. You can run `npm run generate-quest --template basic`
(or `branching`) to scaffold a template JSON file with placeholder dialogue.

- Item requirement and reward configuration for dialogue options
- Process action selection
- Preview functionality to test dialogue flow

### In-game editor flow (create + edit)

Use the in-game quest editor to create and update custom quests that are stored locally in your
browser's IndexedDB custom content database (with an in-memory fallback if IndexedDB is not
available, so changes will not persist after refresh). The editor only saves locally; to submit
content, export JSON and use the submission forms described in the [Quest Submission Guide](/docs/quest-submission).

**Create a quest**

1. Open `/quests/create`.
2. Fill out the quest metadata (title, description, image, NPC).
3. Add dialogue nodes and options (goto, finish, process, or grantsItems) and choose the start
   node.
4. Save the quest to store it locally and receive a link to view it.

**Edit a quest**

1. Open `/quests/manage`.
2. Click **Edit** on a custom quest (built-in quests are read-only); this routes to
   `/quests/[id]/edit`.
3. Update the fields and save to update the local IndexedDB record.

**Validation and image handling**

- Titles must be unique and at least 3 characters; descriptions must be at least 10 characters.
- NPC selection defaults to **Mission Control** if left blank.
- Dialogue node IDs must be unique, nodes require text, and each node needs at least one option.
- Goto options must target existing node IDs; process options require a process ID.
- Required and granted item rows must include an item ID and positive count (the same applies to
  quest reward items).
- Image uploads are downsampled into square JPEG data URLs (target ~50KB). If you leave the image
  blank on a new quest, the editor uses `/assets/quests/howtodoquests.jpg` as the default.
- The simulation summary warns if dialogue paths cannot reach a finish option, but it does not
  block saving.

### Testing Your Quest

Before submitting a quest, verify:

- All dialogue paths lead to completion
- Item grants and requirements function correctly
- Process integrations work as expected
- Educational content is accurate and clear
- Safety warnings are included where appropriate

## Contribution Workflow

### Preferred: In-game editor + submission forms

1. Use the in-game editor at `/quests/create` or `/quests/[id]/edit`.
2. Test using the preview and simulation summary to confirm dialogue flow and rewards.
3. Export your custom content from `/contentbackup`.
4. Submit the quest JSON at `/quests/submit` (or bundle JSON at `/bundles/submit`) with a GitHub
   token.
5. Track review feedback in the linked GitHub pull request and iterate as needed.

### Manual JSON contribution

1. Develop your quest locally following these guidelines. Start with
   `npm run generate-quest --template basic` for a ready-made template.
2. Validate the quest JSON with `node scripts/validate-quest.js path/to/quest.json`.
3. Update the matching Skills-category quest-tree doc (for example, `/docs/composting`) so it
   reflects any new quests or changed gates/rewards.
4. Submit a [pull request](https://github.com/democratizedspace/dspace/compare) with your quest JSON
   file.
5. Respond to feedback during code review.

## Areas Needing More Content

We're particularly interested in new quests that cover:

- Sustainable energy systems
- Small-scale biology experiments
- Chemistry demonstrations relevant to space exploration
- Sensor systems and data collection
- Resource recycling and waste management
- Low-cost astronomy projects
- Materials testing experiments

By following these guidelines, you'll create quests that engage players while advancing DSPACE's mission of democratizing space exploration through practical, hands-on education.
