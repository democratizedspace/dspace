import { beforeEach, describe, expect, it } from 'vitest';

import { detectLegacyArtifacts, detectV1CookieItems } from '../src/utils/legacySaveDetection';

const clearCookies = () => {
    document.cookie.split(';').forEach((cookie) => {
        const name = cookie.split('=')[0]?.trim();
        if (!name) return;
        document.cookie = `${name}=; Max-Age=0; path=/`;
    });
};

describe('legacy save detection', () => {
    beforeEach(() => {
        clearCookies();
        localStorage.clear();
    });

    it('parses v1 item and currency cookies while ignoring invalid entries', () => {
        const detection = detectV1CookieItems(
            [
                'item-3=12.5',
                'item-10=2',
                'item-21=20%2B',
                'item-99=abc',
                'currency-balance-dUSD=123.45',
                'currency-balance-dUSD=abc',
            ].join('; ')
        );

        const itemIds = detection.items
            .filter((item) => item.source === 'item')
            .map((item) => item.id);
        const currency = detection.items.find((item) => item.source === 'currency');

        expect(itemIds).toEqual(expect.arrayContaining(['3', '10', '21']));
        expect(currency?.currencySymbol).toBe('dUSD');
        expect(currency?.count).toBe(123.45);
        expect(detection.invalidItems.length).toBeGreaterThan(0);
    });

    it('detects v2 localStorage gameState without version markers', () => {
        localStorage.setItem('gameState', JSON.stringify({ inventory: { 1: 2 } }));

        const detection = detectLegacyArtifacts();

        expect(detection.hasV2LocalStorage).toBe(true);
        expect(detection.v2ParseErrors).toEqual([]);
    });

    it('surfaces parse errors for corrupt v2 localStorage JSON', () => {
        localStorage.setItem('gameState', '{invalid');

        const detection = detectLegacyArtifacts();

        expect(detection.hasV2LocalStorage).toBe(true);
        expect(detection.v2ParseErrors.length).toBeGreaterThan(0);
    });
});
