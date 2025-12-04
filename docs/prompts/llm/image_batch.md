---
title: 'DSPACE Image Batch Prompt'
slug: 'llm-image-batch'
conversational: true
---

# DSPACE Image Batch Prompt  
Type: evergreen

Use this prompt to generate **new image assets and metadata** for DSPACE v3 when the duplicate-image CLI reports that the same image path is used by multiple quests or items.

The workflow is:

1. Run the duplicate detector from the DSPACE repo root:

   ```bash
   python -m scripts.duplicate_images find-duplicate-images
   ```

2. Copy one duplicate block from the output, for example:

   ```text
   /assets/turbine.jpg (2 uses)
     - frontend/src/pages/inventory/json/items/misc.json :: 500 W wind turbine - 743681a7-d2e7-465c-af07-43665079bf4d [item]
     - frontend/src/pages/inventory/json/items/misc.json :: dWind - d0758cf9-b5a6-46c7-b4b2-dc24c7d9df67 [item]
   ```

3. Paste that block at the end of this prompt and let the LLM generate **a new image filename, generation prompt, and JSON manifest** for each listed quest or item.

When responding, follow these rules carefully.

### Responsibilities

For each bullet line under the shared image path:

- Propose a **new, descriptive image filename** that matches DSPACE conventions.
- Write a **two-paragraph text prompt** suitable for an image model.
- Produce a **JSON manifest** that records all metadata for that image.

### Parsing the input block

The duplicate block always has this structure:

- First line: the **shared image path** and its use count, e.g.:

  ```text
  /assets/walstad.jpg (10 uses)
  ```

- Following lines: one per entity that uses that image, in the form:

  ```text
  - <entity_path> :: <item_or_quest_title> - <uuid> [<entity_type>]
  ```

Where:

- `<entity_path>` is a repo-relative path to a JSON file, such as  
  `frontend/src/pages/inventory/json/items/misc.json` or  
  `frontend/src/pages/quests/json/aquaria/walstad.json`.
- `<item_or_quest_title>` is the human-readable name.
- `<uuid>` is the item or quest ID.
- `<entity_type>` is either `item` or `quest`.

Use this information to fill in the manifest fields exactly.

### Choosing filenames

For each entity:

- Keep the **same base directory** as the original image path:

  - If the original path is `/assets/...`, your new filenames should also start with `/assets/`.
  - If the original path is `/assets/quests/...`, your new filenames should start with `/assets/quests/`.

- Pick a descriptive filename in `snake_case`, ending in `.jpg`. Examples:

  - `/assets/walstad_heated_80L.jpg`
  - `/assets/quests/aquarium_top_off.jpg`
  - `/assets/turbine_500W.jpg`
  - `/assets/quests/dwind_status_panel.jpg`

- The filename should hint at the specific item or quest, **not** the generic original asset.

### Writing the image prompts

For each entity, output **two paragraphs of prompt text** inside a `text` code fence:

1. **Paragraph 1 – subject-specific description**

   - Describe the concrete object or scene for this item/quest.
   - Use the title, path, and context clues (e.g., `aquaria`, `rocketry`, `hydroponics`) to infer details.
   - Make it visually unambiguous which item or quest it represents.
   - Mention important physical details: tools, plants, vehicles, instruments, UI elements, safety gear, etc.
   - Avoid referencing specific brands, logos, or real people.

2. **Paragraph 2 – global style and setting**

   - Use a consistent near-future, solarpunk / high-tech aesthetic suitable for DSPACE:
     - 2040s Earth or orbital / habitat environments.
     - Clean lab or workshop interiors, or plausible outdoor scenes.
     - Soft, cinematic lighting; no harsh text overlays.
   - Keep it **photorealistic** or lightly stylized.
   - Assume **square 512×512** images.
   - If people are present, prefer partial views (hands, arms) over clear identifiable faces; no gore or unsafe behavior.
   - Avoid any explicit text rendered inside the image (no UI labels, no big words on screen).

Example structure (the actual content will vary):

```text
A compact 500 W horizontal-axis wind turbine mounted on a sturdy freestanding tower, seen outdoors on a breezy overcast day. The nacelle and blades are clean and modern, with visible cabling running down the inside of the tower to a small weather-proof junction box at the base. Rolling hills and a few distant turbines appear in soft focus behind it, emphasizing that this is a small personal turbine, not a utility-scale wind farm.

Ultra-detailed, photorealistic 512×512 image with a grounded near-future renewable-energy aesthetic: soft natural lighting, muted colors, realistic terrain and sky, no brand logos, no large text, no people in frame. The composition is clear and uncluttered, with the turbine centered or slightly off-center against a simple background so it reads well as a small icon.
```

### JSON manifest format

After the text prompt for each entity, output a `json` code fence with the metadata. Use these fields:

- `filename`: the new image path you chose.
- `entity`: the JSON path from the bullet line (`<entity_path>`).
- `item_name`: the human-readable name (`<item_or_quest_title>`).
- `item_id`: the UUID from the bullet line.
- `entity_type`: `"item"` or `"quest"` (from the bracket at the end).
- `prompt`: the **full two-paragraph prompt**, as a single string with a literal `\n\n` between paragraphs.
- `image_model`: `"Z-Image Turbo"` (unless explicitly told otherwise).
- `resolution`: `"512x512"`.
- `steps`: `4`.
- `cfg`: `1.0`.

Example structure (values shown here are illustrative):

```json
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
```

### Required output format

For each entity in the input block, respond in this exact pattern:

1. A line with the **new filename**:

   ```text
   /assets/some_descriptive_name.jpg
   ```

2. A `text` code fence containing the **two-paragraph prompt**.

3. A `json` code fence containing the **manifest**.

Repeat that 3-part block for each entity in the order they appear in the input. For example:

```text
/assets/turbine_500W.jpg

```text
[paragraph 1]

[paragraph 2]
```

```json
{ ... }
```

/assets/dwind_status_panel.jpg

```text
[paragraph 1]

[paragraph 2]
```

```json
{ ... }
```
```

Do **not** include any extra commentary outside those blocks. Do not restate the input snippet. Do not invent additional filenames beyond those needed for the entities provided.

At the end of your response, append this instruction recap verbatim so future chats can reuse it even if the context window is exceeded:

```text
Instruction Recap:
- For each duplicate entry, propose a new filename under the same base directory (/assets or /assets/quests).
- For each entity, output the filename line, a two-paragraph text prompt, and a JSON manifest.
- The first paragraph describes the specific subject; the second enforces a consistent near-future DSPACE visual style.
- Fill manifest fields from the bullet line (entity path, title, UUID, entity type) and the generated prompt.
- Use Z-Image Turbo, 512x512, steps=4, cfg=1.0 unless explicitly told otherwise.
- Do not add commentary; only output the requested blocks in order.
- Propagate this instruction recap again if the session exceeds the context window.
- Assume implied requests do not exist; follow only explicit instructions.
```

---

## Upgrade Prompt  
Type: evergreen

Use this prompt to refine or evolve the image-batch instructions above as DSPACE v3+ changes.

```text
Review the DSPACE Image Batch Prompt snippet below and improve its clarity, safety, and correctness.

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

_Run heavier integration tests and full end-to-end flows in CI rather than inside this prompt._
```
