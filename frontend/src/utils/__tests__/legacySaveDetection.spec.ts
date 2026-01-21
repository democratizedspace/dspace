import { beforeEach, describe, expect, test } from 'vitest';

import { detectLegacyArtifacts } from '../legacySaveDetection';

const createV3LocalState = () => ({
    quests: {},
    inventory: {},
    processes: {},
    settings: {},
    _meta: {
        lastUpdated: Date.now(),
    },
});

describe('detectLegacyArtifacts', () => {
    beforeEach(() => {
        document.cookie = '';
        localStorage.clear();
    });

    test('ignores v3 localStorage mirrors', () => {
        localStorage.setItem('gameState', JSON.stringify(createV3LocalState()));

        const detection = detectLegacyArtifacts();

        expect(detection.hasV2LocalStorage).toBe(false);
        expect(detection.hasV1Cookies).toBe(false);
        expect(detection.v2ParseIssues).toEqual([]);
    });
});
