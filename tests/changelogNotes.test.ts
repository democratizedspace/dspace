import { describe, expect, it } from 'vitest';
import { getChangelogNotes } from '../frontend/src/utils/changelogNotes';

describe('changelog notes', () => {
  it('clarifies the inventory filter promise from June 30, 2023', () => {
    const notes = getChangelogNotes('20230630');
    const inventoryNote = notes.find((note) =>
      note.message.includes('Inventory filters')
    );

    expect(
      inventoryNote,
      'Expected a note explaining the shipped inventory filters'
    ).toBeDefined();
    expect(inventoryNote?.href).toBe('/docs/inventory');
  });

  it('keeps v3.1 QA context as April 2026 changelog notes', () => {
    const notes = getChangelogNotes('20260401');
    const v31Note = notes.find((note) =>
      note.message.includes('v3.1 mainline QA note')
    );
    const tokenPlaceNote = notes.find((note) =>
      note.message.includes('token.place remains')
    );

    expect(
      v31Note,
      'Expected v3.1 follow-up context to live in changelog notes'
    ).toBeDefined();
    expect(tokenPlaceNote?.href).toBe('/docs/token-place');
  });
});
