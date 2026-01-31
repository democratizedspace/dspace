import { describe, it, expect } from 'vitest';

import { SAVE_SNAPSHOT_HINT_TEXT, shouldShowSaveSnapshotHint } from '../src/utils/chatHints.js';

describe('shouldShowSaveSnapshotHint', () => {
    it('matches inventory questions', () => {
        expect(shouldShowSaveSnapshotHint("What's in my inventory right now?")).toBe(true);
    });

    it('matches quest progress questions', () => {
        expect(shouldShowSaveSnapshotHint('How do I check quest progress?')).toBe(true);
    });

    it('ignores unrelated questions', () => {
        expect(shouldShowSaveSnapshotHint('What are the current game routes?')).toBe(false);
    });
});

describe('SAVE_SNAPSHOT_HINT_TEXT', () => {
    it('mentions the gamesaves path', () => {
        expect(SAVE_SNAPSHOT_HINT_TEXT).toContain('/gamesaves');
    });
});
