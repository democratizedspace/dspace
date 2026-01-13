import { afterEach, beforeEach, describe, expect, test } from 'vitest';

import { detectLegacyArtifacts, detectV1CookieItems } from '../src/utils/legacySaveDetection';

beforeEach(() => {
    document.cookie = '';
    localStorage.clear();
});

afterEach(() => {
    document.cookie = '';
    localStorage.clear();
});

describe('legacy save detection', () => {
    test('detectV1CookieItems parses item cookies and currency balances', () => {
        const detection = detectV1CookieItems(
            'item-3=12.5; item-10=2; item-21=20%2B; item-99=abc; currency-balance-dUSD=123.45'
        );

        expect(detection.items).toEqual([
            { id: '3', count: 12.5 },
            { id: '10', count: 2 },
            { id: '21', count: 20 },
        ]);
        expect(detection.currencyBalances).toEqual([{ symbol: 'dUSD', balance: 123.45 }]);
        expect(detection.invalidItems).toEqual([
            { name: 'item-99', value: 'abc', reason: 'non-numeric value' },
        ]);
    });

    test('detectLegacyArtifacts reads legacy v2 localStorage state', () => {
        localStorage.setItem(
            'gameState',
            JSON.stringify({ inventory: { 1: 1 }, quests: {}, processes: {} })
        );

        const detection = detectLegacyArtifacts();

        expect(detection.hasV2LocalStorage).toBe(true);
        expect(detection.v2State).toEqual({ inventory: { 1: 1 }, quests: {}, processes: {} });
        expect(detection.v2Errors).toEqual([]);
    });

    test('detectLegacyArtifacts surfaces invalid JSON errors', () => {
        localStorage.setItem('gameState', '{not-json');

        const detection = detectLegacyArtifacts();

        expect(detection.hasV2LocalStorage).toBe(true);
        expect(detection.v2State).toBeUndefined();
        expect(detection.v2Errors?.[0].reason).toBe('invalid-json');
    });
});
