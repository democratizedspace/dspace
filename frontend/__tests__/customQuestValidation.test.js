/**
 * @jest-environment node
 */
import {
    validateQuestData,
    validateQuestDependencies,
} from '../src/utils/customQuestValidation.js';

describe('validateQuestData', () => {
    test('valid quest passes', () => {
        const result = validateQuestData({
            title: 'Valid Quest',
            description: 'This quest has a sufficiently long description.',
            image: 'https://example.com/image.png',
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

    test('short fields or invalid image fail', () => {
        const cases = [
            {
                title: 'AB',
                description: 'This description is long enough',
                image: 'https://example.com/img.png',
            },
            {
                title: 'Valid',
                description: 'Too short',
                image: 'https://example.com/img.png',
            },
            {
                title: 'Valid',
                description: 'Long enough description',
                image: 'invalid-image-path',
            },
        ];

        for (const data of cases) {
            const result = validateQuestData(data);
            expect(result.valid).toBe(false);
        }
    });

    test('duplicate requirements fail validation', () => {
        const result = validateQuestData({
            title: 'Quest',
            description: 'This quest has duplicates in requiresQuests.',
            image: 'data:image/png;base64,abcd',
            requiresQuests: ['q1', 'q1'],
        });

        expect(result.valid).toBe(false);
    });

    test('data URL image passes validation', () => {
        const result = validateQuestData({
            title: 'Quest',
            description: 'This quest uses a data URL image.',
            image: 'data:image/png;base64,abcd',
        });

        expect(result.valid).toBe(true);
    });

    test('extra properties are allowed', () => {
        const result = validateQuestData({
            title: 'Extra Quest',
            description: 'Valid description for quest.',
            image: 'https://example.com/img.png',
            unknown: 'field',
        });
        expect(result.valid).toBe(true);
    });

    test('HTML tags are rejected', () => {
        const result = validateQuestData({
            title: 'Quest',
            description: 'This <b>quest</b> uses HTML.',
            image: 'https://example.com/img.png',
        });
        expect(result.valid).toBe(false);

        const result2 = validateQuestData({
            title: '<script>alert(1)</script>',
            description: 'Valid description for quest.',
            image: 'https://example.com/img.png',
        });
        expect(result2.valid).toBe(false);
    });

    test('requiresQuests must be array of strings', () => {
        const result = validateQuestData({
            title: 'Bad Quest',
            description: 'Valid description for quest.',
            image: 'https://example.com/img.png',
            requiresQuests: [1, 2],
        });
        expect(result.valid).toBe(false);
    });

    test('requiresQuests as non-array fails', () => {
        const result = validateQuestData({
            title: 'Another Bad Quest',
            description: 'Valid description for quest.',
            image: 'https://example.com/img.png',
            requiresQuests: 'q1',
        });
        expect(result.valid).toBe(false);
    });

    test('validateQuestDependencies passes for existing ids', () => {
        const result = validateQuestDependencies(['q1', 'q2'], ['q1', 'q2', 'q3']);
        expect(result).toBe(true);
    });

    test('validateQuestDependencies fails for unknown ids', () => {
        const result = validateQuestDependencies(['q1', 'q4'], ['q1', 'q2']);
        expect(result).toBe(false);
    });
});
