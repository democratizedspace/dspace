import { describe, expect, it } from 'vitest';
import {
    applyQuestDefaults,
    DEFAULT_DIALOGUE_NODE_ID,
    DEFAULT_DIALOGUE_TEXT,
    DEFAULT_NPC_NAME,
    DEFAULT_QUEST_IMAGE,
} from '../src/utils/questDefaults.js';

describe('applyQuestDefaults', () => {
    it('fills required quest fields when minimal data is provided', () => {
        const result = applyQuestDefaults({
            title: 'Test Quest',
            description: 'A short quest created for testing.',
        });

        expect(result.image).toBe(DEFAULT_QUEST_IMAGE);
        expect(result.npc).toBe(DEFAULT_NPC_NAME);
        expect(result.start).toBe(DEFAULT_DIALOGUE_NODE_ID);
        expect(result.dialogue).toHaveLength(1);
        expect(result.dialogue[0]?.id).toBe(DEFAULT_DIALOGUE_NODE_ID);
        expect(result.dialogue[0]?.text).toBe(DEFAULT_DIALOGUE_TEXT);
        expect(result.dialogue[0]?.options).toHaveLength(1);
        expect(result.dialogue[0]?.options[0]?.type).toBe('finish');
    });

    it('preserves provided quest structure', () => {
        const result = applyQuestDefaults({
            title: 'Custom Quest',
            description: 'Includes custom dialogue and npc.',
            npc: 'Guide Bot',
            image: '/assets/quests/custom.png',
            start: 'intro',
            dialogue: [
                {
                    id: 'intro',
                    text: 'Welcome to the quest.',
                    options: [
                        {
                            type: 'goto',
                            text: 'Continue',
                            goto: 'end',
                        },
                    ],
                },
                {
                    id: 'end',
                    text: 'Quest complete.',
                    options: [
                        {
                            type: 'finish',
                            text: 'Finish quest',
                        },
                    ],
                },
            ],
        });

        expect(result.npc).toBe('Guide Bot');
        expect(result.image).toBe('/assets/quests/custom.png');
        expect(result.start).toBe('intro');
        expect(result.dialogue).toHaveLength(2);
    });
});
