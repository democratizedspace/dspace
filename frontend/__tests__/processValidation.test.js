import { validateProcessData } from '../src/utils/customProcessValidation.js';

describe('validateProcessData', () => {
    test('accepts valid process', () => {
        const { valid, errors } = validateProcessData({
            title: 'Test Process',
            duration: '1h',
            requireItems: [{ id: 'item1', count: 1 }],
        });
        expect(valid).toBe(true);
        expect(errors).toBeNull();
    });

    test('rejects missing title', () => {
        const { valid, errors } = validateProcessData({
            duration: '1h',
            requireItems: [{ id: 'item1', count: 1 }],
        });
        expect(valid).toBe(false);
        expect(errors).toBeTruthy();
    });

    test('rejects invalid duration', () => {
        const { valid, errors } = validateProcessData({
            title: 'Bad Duration',
            duration: 'abc',
            requireItems: [{ id: 'item1', count: 1 }],
        });
        expect(valid).toBe(false);
        expect(errors).toBeTruthy();
    });

    test('requires at least one item relationship', () => {
        const { valid, errors } = validateProcessData({
            title: 'No Items',
            duration: '1h',
            requireItems: [],
            consumeItems: [],
            createItems: [],
        });
        expect(valid).toBe(false);
        expect(errors).toBeTruthy();
    });

    test('rejects negative item count', () => {
        const { valid, errors } = validateProcessData({
            title: 'Negative Count',
            duration: '1h',
            requireItems: [{ id: 'item1', count: -1 }],
        });
        expect(valid).toBe(false);
        expect(errors).toBeTruthy();
    });
});
