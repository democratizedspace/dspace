const { validateProcessData } = require('../src/utils/customProcessValidation.js');

describe('validateProcessData', () => {
    test('requires at least one item array', () => {
        const result = validateProcessData({ title: 'Run test', duration: '1h' });
        expect(result.valid).toBe(false);
        expect(result.errors).toBeTruthy();
    });

    test('accepts process with required items', () => {
        const result = validateProcessData({
            title: 'Run test',
            duration: '30m',
            requireItems: [{ id: 'tool-1', count: 1 }],
        });
        expect(result.valid).toBe(true);
        expect(result.errors).toBeNull();
    });
});
