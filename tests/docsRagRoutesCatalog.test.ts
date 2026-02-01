import { describe, expect, it } from 'vitest';
import { searchDocsRag } from '../frontend/src/utils/docsRag.js';

describe('docs RAG route catalog retrieval', () => {
  it('returns /docs/routes with the content backup route', async () => {
    const { excerptsText, sources } = await searchDocsRag(
      'What is the canonical route for custom content backup?',
      {
        maxResults: 5,
        maxChars: 2500,
      }
    );

    expect(excerptsText).toContain('/contentbackup');
    expect(
      sources.some((entry) => String(entry.url || '').startsWith('/docs/routes'))
    ).toBe(true);
  });
});
