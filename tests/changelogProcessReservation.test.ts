import { describe, it, expect } from 'vitest';
import { getChangelogNotes } from '../frontend/src/pages/docs/md/changelog/notes';

describe('Process reservation follow-up', () => {
    it('adds a note pointing readers to the v3 update that closes the loop', () => {
        const notes = getChangelogNotes('20230101');
        const mentionsProcessUpdate = notes.some(
            (note) => /process material reservations/i.test(note.html) && note.html.includes('#20251101')
        );

        expect(mentionsProcessUpdate).toBe(true);
    });

    it('surfaces the same follow-up from the original October 19, 2022 notes', () => {
        const notes = getChangelogNotes('20221019');
        const mentionsProcessUpdate = notes.some(
            (note) => /process material reservations/i.test(note.html) && note.html.includes('#20251101')
        );

        expect(mentionsProcessUpdate).toBe(true);
    });
});
