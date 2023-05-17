---
title: "Quest prompts"
slug: "prompts-quests"
---

## Instructions

These prompts help with quest creation and are intended to work with GPT-4 on ChatGPT (or using the API). They should fit in the 8K token context window.

These prompts are a work in progress. Eventually, quest creation will be done using an in-game WYSIWYG editor.

Run the first quest (replacing the placeholder JSON for the new quest appropriately), copy the dialogue sample, and paste it in the second prompt and run that one too. This should generate the dialogue option, which you can paste back in the original placeholder JSON. You're welcome to submit [pull requests](https://github.com/democratizedspace/dspace/pulls) to improve these prompts!

Ideally do each prompt in a fresh chat in order to minimize side-effects (as the previous prompt will still be in the context window and may cause GPT-4 to improvize).

If your prompt doesn't work as expected, regenerate the response. It seems to be somewhat inconsistent sometimes.

TODO: link to source code in the main branchafter v2 launch

For now, copy directly from the [source file](https://github.com/democratizedspace/dspace/blob/v2/frontend/src/pages/docs/md/prompts-quests.md) so that backticks are included around code blocks.

## Create a new quest from starter JSON

I'm trying to create branching dialogue for a game.

Here's an example quest:

```
{
    "id": "3dprinter/start",
    "title": "Set up your first 3D printer",
    "description": "Accept Sydney's offer of a 3D printer, and learn how to set it up for use in your space exploration adventure.",
    "image": "/assets/quests/start.png",
    "npc": "/assets/npc/sydney.jpg",
    "start": "start",
    "dialogue": [
        {
            "id": "start",
            "text": "Hello, friend! I'm Sydney, a 3D printing expert with the metaguild. dChat referred me. I've got a proposition for you: how would you like to have your very own 3D printer?",
            "options": [
                {
                    "type": "goto",
                    "goto": "enthusiastic",
                    "text": "A 3D printer? That sounds amazing! Tell me more."
                },
                {
                    "type": "goto",
                    "goto": "skeptical",
                    "text": "A 3D printer? How would that help me?"
                }
            ]
        },
        {
            "id": "enthusiastic",
            "text": "Fantastic! A 3D printer is an invaluable tool for space exploration. It can create tools, equipment, and even spare parts for your ship. The printer is fully assembled and calibrated, so all you need to do is complete a test print.",
            "options": [
                {
                    "type": "goto",
                    "goto": "grant",
                    "text": "Great, let's get started!"
                }
            ]
        },
        {
            "id": "skeptical",
            "text": "A 3D printer can be a game-changer in not only space exploration but a ton of other industries. It allows you to create tools, equipment, and spare parts on demand. I've got a fully assembled and calibrated printer for you. All you need to do is complete a test print to see its capabilities.",
            "options": [
                {
                    "type": "goto",
                    "goto": "grant",
                    "text": "Alright, let's give it a try."
                }
            ]
        },
        {
            "id": "grant",
            "text": "First things first, I need you to accept the 3D printer. It's fully assembled and calibrated, so you're ready to go. Just take it and we'll proceed.",
            "options": [
                {
                    "type": "grantsItems",
                    "grantsItems": [
                        {
                            "id": "0",
                            "count": 1
                        },
                        {
                            "id": "12",
                            "count": 1000
                        }
                    ],
                    "text": "Don't mind if I do!"
                },
                {
                    "type": "goto",
                    "goto": "benchy",
                    "requiresItems": [
                        {
                            "id": "0",
                            "count": 1
                        },
                        {
                            "id": "12",
                            "count": 1000
                        }
                    ],
                    "text": "I've got the 3D printer and some PLA filament! What's next?"
                }
            ]
        },
        {
            "id": "benchy",
            "text": "For your test print, I recommend printing a Benchy. It's a small boat model often used to validate 3D printer setups. Once you've successfully printed Benchy, we'll know your 3D printer is ready for action.",
            "options": [
                {
                    "type": "process",
                    "process": "3dprint-benchy",
                    "text": "Starting the Benchy print."
                },
                {
                    "type": "goto",
                    "goto": "finish",
                    "requiresItems": [
                        {
                            "id": "1",
                            "count": 1
                        }
                    ],
                    "text": "I've printed the Benchy! What's next?"
                }
            ]
        },
        {
            "id": "finish",
            "text": "Great job! You're all set to use your 3D printer for your space exploration adventures. If you need help or tips on 3D printing, feel free to reach out. Good luck!",
            "options": [
                {
                    "type": "finish",
                    "text": "Thanks, Sydney! I appreciate your help."
                }
            ]
        }
    ],
    "rewards": [
        {
            "id": "24",
            "count": 100
        }
    ],
    "requiresQuests": [
    ]
}
```

I'd like you to create a new quest that uses similar dialogue. Here's a starting JSON file:

```
{
    "id": "vehicles/charge",
    "title": "Charge your Hypercar",
    "description": "Charge your Hypercar at your home charging station.",
    "image": "/assets/quests/charge.jpg",
    "npc": "/assets/npc/phoenix.png",
    "start": "start",
    "dialogue": [],
    "rewards": [],
    "requiresQuests": []
}
```

but the NPC may be different. Here's the NPC bio:

```
Phoenix is a professional chemist specializing in sustainable rocket fuel development. With a strong background in chemistry and a focus on environmental conservation, they are committed to finding innovative solutions for the space industry that have a minimal impact on our planet. Phoenix's work has the potential to revolutionize space travel by making it more eco-friendly and accessible to a wider range of people.
```

Feel free to ask clarifying questions first. I'd like you to just focus on the dialogue. As a shorthand, use the following format (do not include inline comments in your response code block):

```
[start]
NPC: hello
PLAYER: world >[foo] // this signifies that clicking this option shows the dialogue option with id foo (e.g. `[foo]`)
PLAYER: lorem >[bar]

[foo]
NPC: ipsum
PLAYER: one >[] // this signifies an empty list, no action

[bar]
NPC: two
[] PLAYER: three
```

[id] is an id for the dialogue step. [] empty brackets mean it's a leaf node, something other than type:goto (e.g. finish). Think of this as a directed cyclic graph. Keep the nodes (along with their IDs) from the quest above when you output the transformed version. Can you give me that transformed version now, or do you have clarifying questions?

If you have clarifying questions, send them as a numbered list, and I'll send the answers back as a numbered list. Repeat as many times as needed and then give me the output. Thank you so much in advance!

## Dialogue to JSON

I have the following dialogue:

```
[start]
NPC: Hey there, I'm Vega. I hear you're interested in starting an aquarium. I have an idea: How about setting up a new home for a goldfish? It's a great start for budding aquarists.
PLAYER: A goldfish? That sounds fun! Tell me more. >[enthusiastic]
PLAYER: A goldfish? I thought they were pretty basic. >[skeptical]

[enthusiastic]
NPC: I'm glad you're excited! Goldfish might seem simple, but they're actually quite interesting. They need a fairly large tank and good water quality to thrive. I have a kit to help you get started.
PLAYER: That sounds great, let's do this! >[grant]

[skeptical]
NPC: You'd be surprised! Goldfish are easy to care for, yes, but they also require some attention to detail. They need a decent-sized tank and good water quality. How about we get you set up with a starter kit?
PLAYER: Alright, let's give it a shot. >[grant]

[grant]
NPC: Perfect! I've got this starter kit for you. It includes a 20-gallon tank, a filter, and some food for your new pet.
PLAYER: I'll gladly take that! >[]
PLAYER: I've got the aquarium kit! What's next? >[setup]

[setup]
NPC: Great! Now, the first thing you need to do is set up the aquarium. Install the filter and fill the tank with water. Remember to condition the water before introducing the fish.
PLAYER: Alright, setting up the tank. >[process]
PLAYER: I've set up the tank and conditioned the water. What's next? >[introduce]

[process]
NPC: Fantastic! Once you're done setting up, let's introduce your new goldfish into its home.
PLAYER: Let's introduce the goldfish. >[introduce]

[introduce]
NPC: Now gently introduce the goldfish into the tank. Remember, it's essential to acclimate the fish to the new water temperature by floating the bag in the tank for about 15 minutes before fully releasing it.
PLAYER: Ok, introducing the goldfish now. >[]
PLAYER: I've introduced the goldfish into the tank. What's next? >[finish]

[finish]
NPC: That's it! You've done a great job setting up your new goldfish tank. Remember, goldfish are pretty hardy, but they still need regular feeding and tank cleaning. Let me know if you need any more help with your aquarium!
PLAYER: Thanks, Vega! I appreciate your help. >[]
```

I want to transform it into a dialogue array in JSON. Here's a sample from a quest:

```
        {
            "id": "start",
            "text": "Hello, friend! I'm Sydney, a 3D printing expert with the metaguild. dChat referred me. I've got a proposition for you: how would you like to have your very own 3D printer?",
            "options": [
                {
                    "type": "goto",
                    "goto": "enthusiastic",
                    "text": "A 3D printer? That sounds amazing! Tell me more."
                },
                {
                    "type": "goto",
                    "goto": "skeptical",
                    "text": "A 3D printer? How would that help me?"
                }
            ]
        },
        {
            "id": "enthusiastic",
            "text": "Fantastic! A 3D printer is an invaluable tool for space exploration. It can create tools, equipment, and even spare parts for your ship. The printer is fully assembled and calibrated, so all you need to do is complete a test print.",
            "options": [
                {
                    "type": "goto",
                    "goto": "grant",
                    "text": "Great, let's get started!"
                }
            ]
        },        
```

Can you help me transform the dialogue into the proper JSON?

[id] is an id for the dialogue step. [] empty brackets mean it's a leaf node, something other than type:goto (e.g. finish). Think of this as a directed cyclic graph. Keep the nodes (along with their IDs) from the quest above when you output the transformed version. Can you give me that transformed version now, or do you have clarifying questions?

If you have clarifying questions, send them as a numbered list, and I'll send the answers back as a numbered list. Repeat as many times as needed and then give me the output. Thank you so much in advance!