const { validateItemData } = require('../src/utils/customItemValidation.js');

describe('validateItemData', () => {
    test('accepts minimal valid item', () => {
        const result = validateItemData({
            id: 'item1',
            name: 'Test Item',
            description: 'A useful test item.',
        });
        expect(result.valid).toBe(true);
        expect(result.errors).toBeNull();
    });

    test('rejects item missing required fields', () => {
        const result = validateItemData({ id: 'item1', name: 'Missing description' });
        expect(result.valid).toBe(false);
        expect(result.errors).toBeTruthy();
    });
});
