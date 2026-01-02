import { afterEach, beforeEach, describe, expect, test } from 'vitest';

import { detectLegacyArtifacts } from '../src/utils/legacySaveDetection';

beforeEach(() => {
    document.cookie = '';
    localStorage.clear();
});

afterEach(() => {
    document.cookie = '';
    localStorage.clear();
});

describe('detectLegacyArtifacts', () => {
    test('detects legacy v1 item cookies', () => {
        document.cookie = 'item-3=75; path=/';

        const result = detectLegacyArtifacts();

        expect(result.hasV1Cookies).toBe(true);
        expect(result.hasV2LocalStorage).toBe(false);
    });

    test('detects legacy v2 localStorage keys', () => {
        localStorage.setItem('gameState', JSON.stringify({ inventory: { 1: 1 } }));

        const result = detectLegacyArtifacts();

        expect(result.hasV1Cookies).toBe(false);
        expect(result.hasV2LocalStorage).toBe(true);
    });

    test('returns false when no artifacts are present', () => {
        const result = detectLegacyArtifacts();

        expect(result.hasV1Cookies).toBe(false);
        expect(result.hasV2LocalStorage).toBe(false);
    });
});
