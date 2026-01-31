import { describe, expect, it } from 'vitest';

import { shouldShowSaveSnapshotHint } from '../src/utils/chatHints.js';

describe('shouldShowSaveSnapshotHint', () => {
    it('returns true for inventory questions', () => {
        expect(shouldShowSaveSnapshotHint("What's in my inventory right now?")).toBe(true);
    });

    it('returns true for quest progress questions', () => {
        expect(shouldShowSaveSnapshotHint('How do I check quest progress?')).toBe(true);
    });

    it('returns false for unrelated queries', () => {
        expect(shouldShowSaveSnapshotHint('What are the current game routes?')).toBe(false);
    });
});
