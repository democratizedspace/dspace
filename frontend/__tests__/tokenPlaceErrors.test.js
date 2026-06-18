import { getTokenPlaceErrorSummary } from '../src/utils/tokenPlaceErrors.js';

describe('getTokenPlaceErrorSummary', () => {
    test('categorizes network errors', () => {
        const summary = getTokenPlaceErrorSummary(new Error('Failed to fetch'));
        expect(summary.type).toBe('network');
        expect(summary.message).toMatch(/could not reach token\.place/i);
    });

    test('keeps structured server errors above provider fetch wording', () => {
        const error = new Error('token.place API v1 request failed: upstream model fetch timeout');
        error.type = 'server';
        error.status = 503;

        const summary = getTokenPlaceErrorSummary(error);
        expect(summary.type).toBe('server');
        expect(summary.message).toMatch(/temporarily unavailable/i);
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
