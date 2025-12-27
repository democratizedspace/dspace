---
title: 'DSPACE Image Batch Prompt'
slug: 'llm-image-batch'
conversational: true
---

# DSPACE Image Batch Prompt
Type: evergreen

NOTE: You can paste the fenced prompt below directly into an LLM chat.
Nested examples use `~~~` fences instead of ``` so they do not close the main block.

Before using the prompt, generate image-analyzer snippets locally from the DSPACE repo root:
1. Run the analyzer (it reports duplicates and missing assets):
   ```bash
   python -m scripts.duplicate_images find-duplicate-images
   ```
2. Copy one duplicate block from the output (one image path and its bullet list of entities).
   Skip the "Missing image assets" section; this prompt is only for duplicates.
3. Paste that single block **after** the fenced prompt below when chatting with the LLM.
4. After the LLM returns new assets for that block, paste the next block to process another batch.

```text
You will be given a snippet from the output of `scripts.duplicate_images find-duplicate-images`
after the following prompt. Use that snippet to generate new image filenames, two-paragraph
generation prompts, and JSON manifests for each duplicate listed under the shared image path at
the top of the snippet.

Responsibilities
- For each bullet line under the shared image path, propose a new, descriptive image filename
  that matches DSPACE conventions.
- Write a two-paragraph text prompt suitable for an image model.
- Produce a JSON manifest that records all metadata for that image.

Parsing the input block
- The duplicate block always has this structure:
  - First line: the shared image path and its use count, e.g.:
    ~~~text
    /assets/walstad.jpg (10 uses)
    ~~~
  - Following lines: one per entity that uses that image, in the form:
    ~~~text
    - <entity_path> :: <item_or_quest_title> - <uuid> [<entity_type>]
    ~~~
- Where:
  - `<entity_path>` is a repo-relative path to a JSON file, such as
    `frontend/src/pages/inventory/json/items/misc.json` or
    `frontend/src/pages/quests/json/aquaria/walstad.json`.
    - If the entity path is under `frontend/src/pages/inventory/`, put the resulting image
      filenames in `/assets/*.jpg`.
    - If the entity path is under `frontend/src/pages/quests/`, put the resulting image
      filenames in `/assets/quests/*.jpg`.
  - `<item_or_quest_title>` is the human-readable name.
  - `<uuid>` is the item or quest ID.
  - `<entity_type>` is either `item` or `quest`.
- Use this information to fill in the manifest fields exactly.

Choosing filenames
- Always base the new file's directory on the entity path, not the original image location:
  - Inventory entity paths (`frontend/src/pages/inventory/...`) must produce filenames under
    `/assets/*.jpg`.
  - Quest entity paths (`frontend/src/pages/quests/...`) must produce filenames under
    `/assets/quests/*.jpg`.
  - If the original image path disagrees with the entity path (e.g., an inventory entity using
    an image in `/assets/quests/`), ignore the original location and follow the entity path's
    category.
- Pick a descriptive filename in `snake_case`, ending in `.jpg`. Examples:
  - `/assets/walstad_heated_80L.jpg`
  - `/assets/quests/aquarium_top_off.jpg`
  - `/assets/turbine_500W.jpg`
  - `/assets/quests/dwind_status_panel.jpg`
- The filename should hint at the specific item or quest, not the generic original asset.

Writing the image prompts
For each entity, output two paragraphs of prompt text inside a `text` code fence:
1) Paragraph 1 – subject-specific description
   - Describe the concrete object or scene for this item/quest.
   - Use the title, path, and context clues (e.g., `aquaria`, `rocketry`, `hydroponics`) to
     infer details.
   - Make it visually unambiguous which item or quest it represents.
   - Mention important physical details: tools, plants, vehicles, instruments, UI elements,
     safety gear, etc.
   - Avoid referencing specific brands, logos, or real people.
2) Paragraph 2 – global style and setting
   - Use a consistent near-future, solarpunk / high-tech aesthetic suitable for DSPACE
     (2040s Earth or orbital/habitat environments).
   - Favor clean lab or workshop interiors, or plausible outdoor scenes.
   - Soft, cinematic lighting; no harsh text overlays.
   - Keep it photorealistic or lightly stylized, assuming square 512×512 images.
   - If people are present, prefer partial views (hands, arms) over clear identifiable faces;
     no gore or unsafe behavior.
   - Avoid any explicit text rendered inside the image (no UI labels, no big words on screen).

Example prompt structure (content will vary):
~~~text
A compact 500 W horizontal-axis wind turbine mounted on a sturdy freestanding tower, seen
outdoors on a breezy overcast day. The nacelle and blades are clean and modern, with visible
cabling running down the inside of the tower to a small weather-proof junction box at the
base. Rolling hills and a few distant turbines appear in soft focus behind it, emphasizing
that this is a small personal turbine, not a utility-scale wind farm.

Ultra-detailed, photorealistic 512×512 image with a grounded near-future renewable-energy
aesthetic: soft natural lighting, muted colors, realistic terrain and sky, no brand logos,
no large text, no people in frame. The composition is clear and uncluttered, with the
turbine centered or slightly off-center against a simple background so it reads well as a
small icon.
~~~

JSON manifest format
After the text prompt for each entity, output a `json` code fence with the metadata. Use
these fields:
- `filename`: the new image path you chose.
- `entity`: the JSON path from the bullet line (`<entity_path>`).
- `item_name`: the human-readable name (`<item_or_quest_title>`).
- `item_id`: the UUID from the bullet line.
- `entity_type`: must be exactly `"item"` or `"quest"` in lowercase (from the bracket at
  the end); do not vary casing or use other values.
- `prompt`: the full two-paragraph prompt, as a single string with a literal `\n\n` between
  paragraphs.
- `image_model`: `"Z-Image Turbo"` (unless explicitly told otherwise).
- `resolution`: `"512x512"`.
- `steps`: `4`.
- `cfg`: `1.0`.

Example manifest structure (values are illustrative):
~~~json
{
  "filename": "/assets/turbine_500W.jpg",
  "entity": "frontend/src/pages/inventory/json/items/misc.json",
  "item_name": "500 W wind turbine",
  "item_id": "743681a7-d2e7-465c-af07-43665079bf4d",
  "entity_type": "item",
  "prompt": "A compact 500 W horizontal-axis wind turbine mounted on a sturdy freestanding tower, seen outdoors on a breezy overcast day. The nacelle and blades are clean and modern, with visible cabling running down the inside of the tower to a small weather-proof junction box at the base. Rolling hills and a few distant turbines appear in soft focus behind it, emphasizing that this is a small personal turbine, not a utility-scale wind farm.\n\nUltra-detailed, photorealistic 512×512 image with a grounded near-future renewable-energy aesthetic: soft natural lighting, muted colors, realistic terrain and sky, no brand logos, no large text, no people in frame. The composition is clear and uncluttered, with the turbine centered or slightly off-center against a simple background so it reads well as a small icon.",
  "image_model": "Z-Image Turbo",
  "resolution": "512x512",
  "steps": 4,
  "cfg": 1.0
}
~~~

Required output format
By default, respond to the most recent duplicate snippet provided. For each entity in that
input block, respond in this exact pattern:
1) A line with the new filename:
   ~~~text
   /assets/some_descriptive_name.jpg
   ~~~
2) A `text` code fence containing the two-paragraph prompt.
3) A `json` code fence containing the manifest.
Repeat that 3-part block for each entity in the order they appear in the input. For example:
~~~text
/assets/turbine_500W.jpg

~~~text
[paragraph 1]

[paragraph 2]
~~~

~~~json
{ ... }
~~~

/assets/dwind_status_panel.jpg

~~~text
[paragraph 1]

[paragraph 2]
~~~

~~~json
{ ... }
~~~
~~~

Do not include any extra commentary outside those blocks. Do not restate the input snippet.
Do not invent additional filenames beyond those needed for the entities provided.
If the user sends follow-up instructions that do **not** look like a duplicate snippet, treat
them as corrections or refinements for the current batch. Adjust the existing prompts and
manifests accordingly without creating new filenames unless explicitly requested.
When the user pastes another duplicate block (a new `/assets/... (N uses)` line plus bullets), treat
that as the next batch. Generate outputs for that snippet using the same pattern.

Instruction Recap:
- For each duplicate entry, propose a new filename under the same base directory (/assets or
  /assets/quests).
- For each entity, output the filename line, a two-paragraph text prompt, and a JSON
  manifest.
- The first paragraph describes the specific subject; the second enforces a consistent
  near-future DSPACE visual style.
- Fill manifest fields from the bullet line (entity path, title, UUID, entity type) and the
  generated prompt.
- Use Z-Image Turbo, 512x512, steps=4, cfg=1.0 unless explicitly told otherwise.
- Do not add commentary; only output the requested blocks in order.
- Default to handling one pasted snippet per response; allow follow-up messages that refine
  or correct outputs for the current snippet without starting a new batch.
- When a new duplicate block is provided, begin generating outputs for that new batch in the
  same format.
- Propagate this instruction recap again if the session exceeds the context window.
- Assume implied requests do not exist; follow only explicit instructions.
```

---

## Upgrade Prompt
Type: evergreen

```text
Use this prompt to refine or evolve the image-batch instructions above as DSPACE v3+
changes.

Review the DSPACE Image Batch Prompt snippet below and improve its clarity, safety, and
correctness.

1. Provide the revised snippet inside a fenced block.
2. List bullet points summarizing your changes and rationale. Focus on:
   - Better aligning with current DSPACE visual/style guidelines.
   - Handling new asset directories or entity types.
   - Making filename and prompt conventions more robust and less ambiguous.

After editing, run (from the repo root):
- `pre-commit run --all-files`
- `python -m scripts.duplicate_images find-duplicate-images`
- `npm test` (for the frontend, if applicable)
- `git diff --cached | ./scripts/scan-secrets.py`

If all commands succeed, reply with `All lightweight checks passed. Ready for CI.`
Otherwise, report the failing step(s) with a brief explanation.

Run heavier integration tests and full end-to-end flows in CI rather than inside this
prompt.
```
