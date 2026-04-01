/**
 * @jest-environment node
 */
import { describe, it, expect } from 'vitest';
import validateQuestSchema from '../src/utils/validateQuestSchema.js';

describe('validateQuestSchema', () => {
    const baseQuest = {
        id: 'quest1',
        title: 'Sample Quest',
        description: 'A simple quest for testing',
        image: 'quest.png',
        npc: 'tester',
        start: 'start',
        dialogue: [
            {
                id: 'start',
                text: 'begin',
                options: [{ type: 'finish', text: 'done' }],
            },
        ],
    };

    it('accepts a valid quest object', () => {
        const { valid, errors } = validateQuestSchema(baseQuest);
        expect(valid).toBe(true);
        expect(errors).toBeNull();
    });

    it('rejects an invalid quest object', () => {
        const invalidQuest = { ...baseQuest };
        delete invalidQuest.title;
        const { valid, errors } = validateQuestSchema(invalidQuest);
        expect(valid).toBe(false);
        expect(Array.isArray(errors)).toBe(true);
    });
});
