import { describe, it, expect } from 'vitest';
import { validateQuestData } from '../frontend/src/utils/customQuestValidation.js';

type DialogueOption = {
    type: string;
    text: string;
    goto?: string;
    requiresItems?: Array<{ id?: string; count?: number }>;
    grantsItems?: Array<{ id?: string; count?: number }>;
};

type DialogueNode = {
    id: string;
    text: string;
    options: DialogueOption[];
};

type QuestPayload = {
    title: string;
    description: string;
    image: string;
    npc: string;
    start: string;
    dialogue: DialogueNode[];
};

const baseQuest: QuestPayload = {
    title: 'Quest Title',
    description: 'Detailed quest description for validation.',
    image: '/assets/quests/howtodoquests.jpg',
    npc: '/assets/npc/dChat.jpg',
    start: 'start',
    dialogue: [
        {
            id: 'start',
            text: 'Start node',
            options: [
                {
                    type: 'goto',
                    goto: 'finish',
                    text: 'Continue',
                },
            ],
        },
        {
            id: 'finish',
            text: 'Finish node',
            options: [
                {
                    type: 'finish',
                    text: 'Done',
                },
            ],
        },
    ],
};

describe('custom quest validation for option items', () => {
    it('flags options that gate on items without valid identifiers', () => {
        const quest: QuestPayload = JSON.parse(JSON.stringify(baseQuest));
        quest.dialogue[0].options[0].requiresItems = [{ count: 1 }];

        const result = validateQuestData(quest);
        expect(result.valid).toBe(false);
        expect(result.errors).toBeTruthy();
    });

    it('accepts options with valid required and granted item entries', () => {
        const quest: QuestPayload = JSON.parse(JSON.stringify(baseQuest));
        quest.dialogue[0].options[0].requiresItems = [{ id: 'item-1', count: 2 }];
        quest.dialogue[0].options.push({
            type: 'grantsItems',
            text: 'Grant rewards',
            grantsItems: [{ id: 'reward-1', count: 1 }],
        });

        const result = validateQuestData(quest);
        expect(result.valid).toBe(true);
        expect(result.errors).toBeNull();
    });
});
