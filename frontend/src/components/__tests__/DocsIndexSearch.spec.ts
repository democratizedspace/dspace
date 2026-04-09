import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';

import DocsIndex from '../svelte/DocsIndex.svelte';

const SECTIONS_FIXTURE = [
    {
        title: 'The basics',
        links: [
            { title: 'About', href: '/docs/about', features: ['link'] },
            { title: 'Mission', href: '/docs/mission', keywords: ['vision'], features: [] },
        ],
    },
    {
        title: 'Quests',
        links: [
            {
                title: 'Quest Development Guidelines',
                href: '/docs/quest-guidelines',
                keywords: ['quest'],
                features: ['link'],
            },
            {
                title: 'Quest Schema Requirements',
                href: '/docs/quest-schema',
                keywords: ['schema', 'quest'],
                features: ['link', 'image'],
            },
        ],
    },
];

const CORPUS_FIXTURE = {
    corpus: {
        about: 'Learn about the dSpace mission and long-term roadmap.',
        'quest-guidelines': 'Quest writing covers drafting and testing guidance.',
        'quest-schema': 'The quest schema requires start, middle, and completion nodes.',
    },
};

describe('DocsIndex search operators', () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('renders an accessible search box for docs', () => {
        render(DocsIndex, { props: { sections: SECTIONS_FIXTURE } });

        const searchBox = screen.getByRole('searchbox', { name: /search docs/i });

        expect(searchBox).not.toBeNull();
        expect(searchBox.getAttribute('id')).toBe('docs-search-input');
    });

    it('filters links using the search query after deferred corpus load', async () => {
        const fetchMock = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => CORPUS_FIXTURE,
        });
        vi.stubGlobal('fetch', fetchMock);

        render(DocsIndex, { props: { sections: SECTIONS_FIXTURE } });

        const searchBox = screen.getByRole('searchbox', { name: /search docs/i });

        await fireEvent.input(searchBox, { target: { value: 'drafting' } });

        await waitFor(() => {
            expect(fetchMock).toHaveBeenCalledTimes(1);
            expect(
                screen.getByRole('link', {
                    name: 'Quest Development Guidelines',
                })
            ).not.toBeNull();
        });

        expect(screen.queryByRole('link', { name: 'About' })).toBeNull();
        expect(screen.getByText(/writing covers/i)).not.toBeNull();
    });

    it('applies has:link operator filters without loading deferred corpus', async () => {
        const fetchMock = vi.fn();
        vi.stubGlobal('fetch', fetchMock);

        render(DocsIndex, { props: { sections: SECTIONS_FIXTURE } });

        const searchBox = screen.getByRole('searchbox', { name: /search docs/i });

        await fireEvent.input(searchBox, { target: { value: 'has:link' } });

        expect(screen.getByRole('link', { name: 'About' })).not.toBeNull();
        expect(screen.queryByRole('link', { name: 'Mission' })).toBeNull();
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it('combines text queries with has:image operator filters', async () => {
        const fetchMock = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => CORPUS_FIXTURE,
        });
        vi.stubGlobal('fetch', fetchMock);

        render(DocsIndex, { props: { sections: SECTIONS_FIXTURE } });

        const searchBox = screen.getByRole('searchbox', { name: /search docs/i });

        await fireEvent.input(searchBox, { target: { value: 'completion has:image' } });

        await waitFor(() => {
            expect(
                screen.getByRole('link', {
                    name: 'Quest Schema Requirements',
                })
            ).not.toBeNull();
        });

        expect(
            screen.queryByRole('link', {
                name: 'Quest Development Guidelines',
            })
        ).toBeNull();
    });

    it('reuses deferred corpus across subsequent keyword searches', async () => {
        const fetchMock = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => CORPUS_FIXTURE,
        });
        vi.stubGlobal('fetch', fetchMock);

        render(DocsIndex, { props: { sections: SECTIONS_FIXTURE } });
        const searchBox = screen.getByRole('searchbox', { name: /search docs/i });

        await fireEvent.input(searchBox, { target: { value: 'drafting' } });
        await waitFor(() => {
            expect(
                screen.getByRole('link', { name: 'Quest Development Guidelines' })
            ).not.toBeNull();
        });

        await fireEvent.input(searchBox, { target: { value: 'completion' } });
        await waitFor(() => {
            expect(screen.getByRole('link', { name: 'Quest Schema Requirements' })).not.toBeNull();
        });

        expect(fetchMock).toHaveBeenCalledTimes(1);
    });
});
