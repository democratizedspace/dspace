---
title: 'Quest Prompts'
slug: 'prompts-quests'
---

# AI-Assisted Content Development for DSPACE

This guide provides structured prompts for using AI assistants like Claude, GPT-4, and others to help create content for DSPACE. These prompts serve as starting templates that you can customize for your specific content needs.

For the steps required to share your quests with the community, see the [Quest Submission Guide](/docs/quest-submission).

> **Note:** For comprehensive content development guidelines, please refer to our [Content Development Guide](/docs/content-development), which includes specific documentation for [Quests](/docs/quest-guidelines), [Items](/docs/item-guidelines), and [Processes](/docs/process-guidelines).

## Getting Started with AI Assistance

Modern AI assistants can be powerful collaborators in content creation. Here are some tips for effective use:

- **Provide clear context** about DSPACE's educational mission and sustainability focus
- **Use system prompts** to guide the AI toward appropriate tone and technical accuracy
- **Iterate on outputs** rather than expecting perfect results on the first try
- **Fact-check technical information** since AI systems can sometimes generate plausible-sounding but incorrect details

## Quest Development Prompts

### Basic Quest Structure

```
I'm developing content for DSPACE, an educational game that teaches real-world skills related to space exploration and sustainability. I need help creating a quest about [TOPIC].

The quest should:
1. Be scientifically accurate and educational
2. Focus on something people can actually build or do at home
3. Follow a logical progression of steps
4. Include relevant safety considerations
5. Match the appropriate difficulty level ([BEGINNER/INTERMEDIATE/ADVANCED])

Please help me brainstorm:
1. A compelling title and description
2. An appropriate NPC character to guide the player
3. The key learning objectives
4. The main steps/activities in the quest
5. Required materials or prerequisites
6. Potential branching paths in the dialogue
```

### Dialogue Development

```
I'm creating dialogue for a quest in DSPACE about [TOPIC]. The NPC guiding the player is [NPC NAME], who is [BRIEF CHARACTER DESCRIPTION].

Please help me write natural-sounding dialogue that:
1. Explains [CONCEPT] in an accessible way
2. Maintains a consistent voice for the character
3. Includes both educational content and engaging interaction
4. Provides clear instructions for the player
5. Offers meaningful choices where appropriate

The dialogue should follow this general structure:
1. Introduction and explanation of the quest
2. Instructions for gathering materials/prerequisites
3. Step-by-step guidance through the process
4. Troubleshooting common issues
5. Conclusion and next steps
```

### Quest Schema Reference

All quests conform to this structure:

```json
{
    "id": "string", // Unique identifier (category/name format)
    "title": "string", // Display title
    "description": "string", // Brief quest description
    "image": "string", // Path to quest image
    "npc": "string", // Path to NPC avatar image
    "start": "string", // ID of the starting dialogue node
    "dialogue": [
        {
            "id": "string", // Node identifier
            "text": "string", // NPC's dialogue text
            "options": [
                {
                    "type": "string", // goto, finish, process, or grantsItems
                    "text": "string", // Player's response text
                    "goto": "string", // For type:goto, target node ID
                    "process": "string", // For type:process, process ID
                    "requiresItems": [
                        // Optional items needed to select option
                        { "id": "string", "count": "number" }
                    ],
                    "grantsItems": [
                        // Optional items given when selecting option
                        { "id": "string", "count": "number" }
                    ]
                }
            ]
        }
    ],
    "rewards": [
        // Items given upon quest completion
        { "id": "string", "count": "number" }
    ],
    "requiresQuests": [
        // Quest IDs that must be completed first
        "string"
    ]
}
```

## Item Development Prompts

### Basic Item Creation

```
I'm creating items for DSPACE, an educational game about space exploration and sustainability. I need help designing [NUMBER] items related to [CATEGORY].

For each item, please provide:
1. A clear, descriptive name
2. A concise but informative description (1-2 sentences)
3. Appropriate classification (Resource, Tool, Component, or Consumable)
4. Realistic properties or specifications
5. Potential uses in space-related activities

The items should be:
- Scientifically accurate
- Realistically obtainable or creatable
- Educational about their real-world counterparts
- Relevant to space exploration challenges
```

### Item Categories Reference

DSPACE items fall into these main categories:

1. **Resources**: Raw materials and basic resources (e.g., water, energy units, metals)
2. **Tools & Equipment**: Items used to perform tasks (e.g., 3D printers, solar panels)
3. **Components**: Parts used in larger systems (e.g., circuit boards, structural elements)
4. **Consumables**: Items that get used up (e.g., fuel, food, plant nutrients)
5. **Educational**: Items that represent knowledge or skills (e.g., blueprints, certifications)

## Process Development Prompts

### Basic Process Creation

```
I'm creating processes for DSPACE, an educational game about space exploration and sustainability. I need help designing a process for [ACTIVITY].

Please provide:
1. A clear, descriptive title
2. An appropriate duration (format: "2h 30m" or "3d")
3. Required items (tools/equipment needed but not consumed)
4. Consumed items (resources used up during the process)
5. Created items (output of the process)

The process should:
- Reflect realistic time requirements
- Maintain logical resource conservation (input ≈ output)
- Represent an actual scientific or engineering procedure
- Have educational value relevant to space exploration
- Balance effort and reward appropriately
```

### Process Categories Reference

DSPACE processes generally fall into these categories:

1. **Manufacturing**: Creating physical components (e.g., 3D printing, assembly)
2. **Biological**: Growing organisms or managing ecosystems (e.g., hydroponics, composting)
3. **Energy**: Generating or transforming energy (e.g., solar power generation, battery charging)
4. **Educational**: Learning and experimentation (e.g., simulations, data analysis)

## Content Review and Improvement

### Scientific Accuracy Check

```
I've created the following content for DSPACE, an educational game about space exploration:

[PASTE CONTENT HERE]

Please review this for scientific accuracy and provide feedback on:
1. Any factual errors or misconceptions
2. Realistic timeframes and resource requirements
3. Safety considerations that should be addressed
4. Technical terminology usage
5. Educational value and clarity

If you identify issues, please suggest specific corrections.
```

### Dialogue Polish

```
I've written the following dialogue for a quest in DSPACE:

[PASTE DIALOGUE HERE]

The NPC is [CHARACTER NAME], who is [BRIEF CHARACTER DESCRIPTION].

Please help me improve this dialogue by:
1. Making it sound more natural and conversational
2. Ensuring consistent character voice
3. Simplifying overly complex explanations
4. Adding engagement through appropriate questions
5. Maintaining educational value while being entertaining
6. Identifying any confusing instructions or unclear directions

Suggest specific improvements rather than rewriting the entire dialogue.
```

### Quest Sequence Expansion

Use this when you want an AI assistant to propose follow-up quests that build on
existing content.

```
I maintain a quest tree for DSPACE. The latest quest I added was [LAST QUEST ID].
Suggest several logical next quests that would follow it. For each quest propose:
1. A short title
2. A one-sentence summary
3. The most fitting NPC guide
4. Key items or processes that should be introduced, focusing on hands-on steps rather than purely conversational beats
```

### Custom Quest Scaffolding

Use this when you want help creating a bare-bones quest JSON for the custom quest system.

```
Create a minimal DSPACE quest with the id `[CATEGORY]/[SHORT_ID]`. Populate the required fields according to the quest schema but keep dialogue text short and clearly marked as placeholders. Return only the JSON object.
```

After generating the JSON, run the generator to create the actual file:

```bash
npm run generate-quest electronics/basic-led
```

Use the `--no-llm` flag if you prefer to skip the automatic placeholder dialogue.
When you're done editing, verify the quest passes the canonical and quality checks:

```bash
npm test -- questCanonical
npm test -- questQuality
```

Follow the prompts to save the quest under the correct category and assign an NPC.

### Custom Content Bundle

Use this when you want to generate a single JSON file that groups quests, items and processes together. The bundle format is described in the [Custom Content Bundles guide](/docs/custom-bundles).

```
Create a DSPACE content bundle. Include minimal placeholder objects that follow the quest, item and process schemas:
{
    "quests": [],
    "items": [],
    "processes": []
}
Return only this JSON object.
```

After generating the bundle, run `node scripts/create-content-bundle.js` to combine your files under `submissions/bundles`.

## Example: Complete Quest Creation

Here's an example of how to use these prompts to create a complete quest:

1. Start with the Basic Quest Structure prompt to outline your quest
2. Use the Dialogue Development prompt to create the core narrative
3. Refine the dialogue using the Dialogue Polish prompt
4. Check for scientific accuracy with the Scientific Accuracy Check prompt
5. Format the content into the proper JSON structure using the Quest Schema Reference

Remember that AI assistants are collaborative tools. You'll get the best results by:

- Providing detailed context about DSPACE
- Iterating on content rather than accepting first drafts
- Focusing the AI on specific aspects at a time
- Combining AI suggestions with your own knowledge and creativity

By following these guidelines, you can leverage AI to create high-quality, educational content that advances DSPACE's mission of democratizing space exploration through practical, hands-on learning.
