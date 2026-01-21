import { describe, expect, test } from 'vitest';

import { parseLegacyV2Raw } from '../legacySaveParsing.js';

describe('parseLegacyV2Raw', () => {
    test('ignores v3-shaped localStorage payloads without a version number', () => {
        const v3State = {
            quests: {},
            inventory: {},
            processes: {},
            settings: {},
            _meta: {
                lastUpdated: Date.now(),
            },
        };

        const result = parseLegacyV2Raw(JSON.stringify(v3State));

        expect(result.isLegacy).toBe(false);
        expect(result.state).toBeNull();
        expect(result.error).toBeNull();
    });

    test('flags v2 payloads for migration', () => {
        const v2State = {
            versionNumberString: '2.1',
            quests: {},
            inventory: {},
            processes: {},
        };

        const result = parseLegacyV2Raw(JSON.stringify(v2State));

        expect(result.isLegacy).toBe(true);
        expect(result.state).not.toBeNull();
        expect(result.error).toBeNull();
    });
});
