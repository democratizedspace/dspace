const { getTokenPlaceErrorSummary } = require('../src/utils/tokenPlaceErrors.js');

describe('getTokenPlaceErrorSummary', () => {
    test('categorizes disabled errors', () => {
        const summary = getTokenPlaceErrorSummary(new Error('token.place is disabled'));
        expect(summary.type).toBe('disabled');
        expect(summary.message).toMatch(/disabled/i);
    });

    test('categorizes network errors', () => {
        const summary = getTokenPlaceErrorSummary(new Error('Failed to fetch'));
        expect(summary.type).toBe('network');
        expect(summary.message).toMatch(/could not reach token\.place/i);
    });

    test('categorizes provider errors', () => {
        const summary = getTokenPlaceErrorSummary(
            new Error('token.place API request failed: bad request')
        );
        expect(summary.type).toBe('provider');
        expect(summary.message).toMatch(/token\.place returned an error/i);
    });

    test('categorizes unknown errors', () => {
        const summary = getTokenPlaceErrorSummary(new Error('Unexpected crash'));
        expect(summary.type).toBe('unknown');
        expect(summary.message).toMatch(/unexpected error/i);
    });
});
