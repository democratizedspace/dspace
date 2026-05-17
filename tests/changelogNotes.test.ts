import { describe, expect, it } from 'vitest';
import { getChangelogNotes } from '../frontend/src/utils/changelogNotes';

describe('changelog notes', () => {
    it('clarifies the inventory filter promise from June 30, 2023', () => {
        const notes = getChangelogNotes('20230630');
        const inventoryNote = notes.find((note) => note.message.includes('Inventory filters'));

        expect(inventoryNote, 'Expected a note explaining the shipped inventory filters').toBeDefined();
        expect(inventoryNote?.href).toBe('/docs/inventory');
    });
});
