import { describe, it, expect } from 'vitest';
import validateQuestSchema from '../src/utils/validateQuestSchema.js';

const validQuest = {
    id: 'quest-1',
    title: 'A Quest',
    description: 'desc',
    image: 'image.png',
    npc: 'npc-1',
    start: 'start-node',
    dialogue: [
        {
            id: 'start-node',
            text: 'hi',
            options: [{ type: 'finish', text: 'done' }],
        },
    ],
};

describe('validateQuestSchema', () => {
    it('returns valid for a compliant quest', () => {
        const result = validateQuestSchema(validQuest);
        expect(result.valid).toBe(true);
        expect(result.errors).toBeNull();
    });

    it('returns errors for a quest missing required fields', () => {
        const { valid, errors } = validateQuestSchema({ id: 'x' });
        expect(valid).toBe(false);
        expect(errors).toBeTruthy();
        // ensure missing required property is reported
        const missingProps = errors.map((e) => e.params?.missingProperty);
        expect(missingProps).toContain('title');
    });
});
