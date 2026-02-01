import { describe, expect, it } from 'vitest';
import { searchDocsRag } from '../frontend/src/utils/docsRag.js';

describe('Docs RAG routes catalog', () => {
    it('returns routes catalog chunk for custom content backup queries', async () => {
        const { excerptsText, sources } = await searchDocsRag(
            'What is the canonical route for custom content backup?',
            {
                maxResults: 6,
                maxChars: 3000,
            }
        );

        expect(excerptsText).toContain('/contentbackup');
        expect(
            sources.some(
                (entry) =>
                    entry.type === 'route' &&
                    String(entry.url || '').startsWith('/docs/routes#canonical-route-index')
            )
        ).toBe(true);
    });
});
