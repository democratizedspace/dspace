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
                }
            ]
        },
        {
            "id": "enthusiastic",
            "text": "Fantastic! A 3D printer is an invaluable tool! It can be used to quickly prototype new designs, print decor, and even build robots!! I've taken the liberty of fully assembling and calibrating one for you. So, what do you say?",
            "options": [
                {
                    "type": "goto",
                    "goto": "grant",
                    "text": "I say let's do this!!"
                }
            ]
        },
        {
            "id": "grant",
            "text": "First things first, I need you to accept the 3D printer. Just take it and we'll proceed. Oh, and I threw in some filament! That filament gets melted at a high temperature and laid down one layer at a time. It may take a while at first, but over time you'll be able tweak settings and make it run way faster! Plus, this is a cheap beginner model. There are way more powerful printers out there if you've got the cash!",
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

## Final pass with polish

I have the following quest:

```
{
    "id": "rocketry/parachute",
    "title": "Add a parachute",
    "description": "The launch was a success, but let's improve the design for future launches. We'll add a parachute to ensure a safer landing and potential reuse.",
    "image": "/assets/quests/parachute.jpg",
    "npc": "/assets/npc/nova.jpg",
    "start": "start",
    "dialogue": [
        {
            "id": "start",
            "text": "Hey there! I hope you're still feeling the excitement from your first rocket launch! We've learned a lot, and now it's time to make some improvements. To ensure a safer landing and potential reuse for future rockets, let's add a parachute to the design.",
            "options": [
                {
                    "type": "goto",
                    "goto": "parachute",
                    "text": "Sounds like a plan! How do we go about adding a parachute?"
                }
            ]
        },
        {
            "id": "parachute",
            "text": "Adding a parachute will help slow down the descent of the rocket, ensuring a gentler landing. This will increase the chances of a successful recovery and potential reuse of the rocket. We'll need a few additional components: a parachute, some shock cord, and a recovery wadding. The recovery wadding protects the parachute from the ejection charge of the rocket motor. Once we have those items, we can proceed with the modifications.",
            "options": [
                {
                    "type": "process",
                    "process": "assemble-rocket-parachute",
                    "text": "Let's assemble the parachute system!"
                },
                {
                    "type": "goto",
                    "goto": "launch",
                    "text": "Great! Once the parachute system is ready, are we good to go for another launch?"
                }
            ]
        },
        {
            "id": "launch",
            "text": "Absolutely! With the parachute system installed, we're ready for another launch. As before, place the rocket on the launchpad, insert the igniter, and connect the igniter to your launch controller. Once you're ready, press the launch button and watch the rocket take flight!",
            "options": [
                {
                    "type": "process",
                    "process": "launch-rocket-parachute",
                    "text": "This feels so exhilarating!!"
                },
                {
                    "type": "goto",
                    "goto": "success",
                    "requiresItems": [
                        {
                            "id": "40",
                            "count": 1
                        }
                    ],
                    "text": "Congratulations on another successful launch! How did the rocket fare with the parachute?"
                }
            ]
        },
        {
            "id": "success",
            "text": "The addition of the parachute worked like a charm, ensuring a safer landing for the rocket! It's a significant improvement from our previous attempt, and we're making great strides in rocketry!",
            "options": [
                {
                    "type": "finish",
                    "text": "Thank you, Nova! I'm thrilled with the progress we've made!"
                }
            ]
        }
    ],
    "rewards": [
        {
            "id": "4",
            "count": 1
        }
    ],
    "requiresQuests": [
    ]
}
```

Can you help me improve the dialogue? Assume all the items have descriptions in other files, and don't worry about images or other content. Just focus on dialogue.

Here are some examples of things I'd like to improve:

- catch any improper use of a word or phrase. Explain why it's improper and suggest a better alternative.
- catch any awkward phrasing. Explain why it's awkward and suggest a better alternative.
- catch any overly complex sentences. Explain why it's overly complex and suggest a better alternative.
- make sure the dialogue matches the NPC's personality, as inferred by the information in their bio:

```
Nova, an ingenious engineer with a quick wit, excels at rocketry. She designs and constructs the spacecraft used by the metaguild to explore the solar system. After studying aerospace engineering in college, she rapidly gained expertise in the field. Known for her perfectionism and ability to overcome obstacles, Nova embraced the metaguild as a means to employ her skills in groundbreaking ways. She's a natural leader and a great mentor to new recruits.
```
```

List your suggestions in a numbered list. After reading your response, I'll reply with a list of numbers that I'd like you to incorporate into the JSON file. Please return the entire JSON file with your changes once I respond. Thank you so much in advance!