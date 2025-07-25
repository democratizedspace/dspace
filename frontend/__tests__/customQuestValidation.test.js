/**
 * @jest-environment node
 */
import { validateQuestData } from '../src/utils/customQuestValidation.js';

describe('validateQuestData', () => {
    test('valid quest passes', () => {
        const result = validateQuestData({
            title: 'A',
            description: 'B',
            image: 'img',
            requiresQuests: ['q1'],
        });
        expect(result.valid).toBe(true);
    });

    test('missing title fails', () => {
        const result = validateQuestData({
            description: 'B',
            image: 'img',
        });
        expect(result.valid).toBe(false);
    });
});
