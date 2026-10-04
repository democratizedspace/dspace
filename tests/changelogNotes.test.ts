import { describe, expect, it } from 'vitest';
import {
  appendChangelogNotes,
  getChangelogNotes,
} from '../frontend/src/utils/changelogNotes';

describe('changelog notes', () => {
  it('shows current preparation status without rewriting the archived entry', () => {
    const archivedHtml = '<p>Archived release claim.</p>';
    const rendered = appendChangelogNotes(archivedHtml, '20260801');
    expect(rendered).toContain('tentative November 1, 2026');
    expect(rendered).toContain('href="/docs/v3-1-release-preparation"');
    expect(rendered.endsWith(archivedHtml)).toBe(true);
  });

  it('keeps unrelated archived entries unchanged', () => {
    const archivedHtml = '<p>Earlier history.</p>';
    expect(appendChangelogNotes(archivedHtml, '20260401')).toBe(archivedHtml);
    expect(appendChangelogNotes(archivedHtml, undefined)).toBe(archivedHtml);
  });

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

  it('keeps v3.0.1 patch details in the April changelog body instead of changelog notes', () => {
    const notes = getChangelogNotes('20260401');

    expect(notes.some((note) => note.message.includes('v3.0.1'))).toBe(false);
  });
});
