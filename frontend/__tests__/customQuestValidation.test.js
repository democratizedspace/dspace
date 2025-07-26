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

    test('missing description fails', () => {
        const result = validateQuestData({
            title: 'A',
            image: 'img',
        });
        expect(result.valid).toBe(false);
    });

    test('missing image fails', () => {
        const result = validateQuestData({
            title: 'A',
            description: 'B',
        });
        expect(result.valid).toBe(false);
    });

    test('non-array requiresQuests fails', () => {
        const result = validateQuestData({
            title: 'A',
            description: 'B',
            image: 'img',
            requiresQuests: 'q1',
        });
        expect(result.valid).toBe(false);
    });

    test('requiresQuests with non-string entries fails', () => {
        const result = validateQuestData({
            title: 'A',
            description: 'B',
            image: 'img',
            requiresQuests: [1, 2],
        });
        expect(result.valid).toBe(false);
    });

    test('valid without requiresQuests passes', () => {
        const result = validateQuestData({
            title: 'A',
            description: 'B',
            image: 'img',
        });
        expect(result.valid).toBe(true);
    });
});
