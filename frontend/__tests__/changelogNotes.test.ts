import { getChangelogNotes, renderChangelogNotes } from '../src/utils/changelogNotes';

describe('renderChangelogNotes', () => {
    it('highlights the published contributors guide for the June 30, 2023 changelog', () => {
        const html = renderChangelogNotes('20230630');

        expect(html).toContain('Contributors Guide');
        expect(html).toContain('/docs/contributors-guide');
        expect(html).toContain('/docs/contribute');
    });

    it('surfaces contributor links as structured metadata', () => {
        const notes = getChangelogNotes('20230630');

        expect(notes.map((note) => note.href)).toEqual(
            expect.arrayContaining(['/docs/contributors-guide', '/docs/contribute'])
        );
    });
});
