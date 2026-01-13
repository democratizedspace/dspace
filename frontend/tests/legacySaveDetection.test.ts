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
            'item-3=12.5; item-10=2; item-99=abc; item-21=-1; currency-balance-dUSD=123.45'
        );

        expect(detection.items).toEqual([
            { id: '3', count: 12.5 },
            { id: '10', count: 2 },
        ]);
        expect(detection.currencyBalances).toEqual([{ symbol: 'dUSD', balance: 123.45 }]);
        expect(detection.invalidItems.length).toBe(2);
    });

    test('detectLegacyArtifacts detects v2 save from legacy gameState shape', () => {
        localStorage.setItem(
            'gameState',
            JSON.stringify({ inventory: { '1': 1 }, quests: {}, processes: {} })
        );

        const detection = detectLegacyArtifacts();

        expect(detection.hasV2LocalStorage).toBe(true);
        expect(detection.v2ParseErrors).toEqual([]);
    });

    test('detectLegacyArtifacts reports invalid legacy JSON', () => {
        localStorage.setItem('gameState', '{broken-json');

        const detection = detectLegacyArtifacts();

        expect(detection.hasV2LocalStorage).toBe(false);
        expect(detection.v2ParseErrors.length).toBeGreaterThan(0);
        expect(detection.v2ParseErrors[0].key).toBe('gameState');
    });
});
