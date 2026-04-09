import fs from 'node:fs';
import path from 'node:path';
import { fireEvent, render, screen } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vitest';

import DocsIndex from '../../../components/svelte/DocsIndex.svelte';

const docsIndexFile = path.join(process.cwd(), 'frontend/src/pages/docs/index.astro');

describe('/docs index page payload shape', () => {
    it('keeps initial sections payload lightweight and points to deferred corpus', () => {
        const content = fs.readFileSync(docsIndexFile, 'utf8');

        expect(content).toMatch(/deferredCorpusHref\s*=\s*["']\/docs\/full-text-corpus\.json["']/);
        expect(content).toMatch(/return\s*\{\s*\.\.\.link,\s*slug,\s*features\s*\};/);
        expect(content).not.toMatch(/\bbodyText\s*:/);
    });

    it('renders and filters lightweight section links without bodyText in the initial payload', async () => {
        const fetchSpy = vi.fn();
        vi.stubGlobal('fetch', fetchSpy);

        render(DocsIndex, {
            props: {
                sections: [
                    {
                        title: 'Docs',
                        links: [
                            { title: 'About', href: '/docs/about', features: ['link'] },
                            { title: 'Mission', href: '/docs/mission', features: [] },
                        ],
                    },
                ],
            },
        });

        const searchBox = screen.getByRole('searchbox', { name: /search docs/i });
        await fireEvent.input(searchBox, { target: { value: 'has:link' } });

        expect(screen.getByRole('link', { name: 'About' })).not.toBeNull();
        expect(screen.queryByRole('link', { name: 'Mission' })).toBeNull();
        expect(fetchSpy).not.toHaveBeenCalled();
    });
});
