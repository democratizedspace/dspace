import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import { beforeEach, describe, expect, it, vi } from 'vitest';

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
                slug: 'quest-guidelines',
                keywords: ['quest', 'turbine'],
                features: ['link'],
            },
            {
                title: 'Quest Schema Requirements',
                href: '/docs/quest-schema',
                slug: 'quest-schema',
                keywords: ['schema', 'quest'],
                features: ['link', 'image'],
            },
        ],
    },
];

const createFetchResponse = (bodyBySlug = {}) =>
    Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ bodyBySlug }),
    });

describe('DocsIndex search operators', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
        vi.unstubAllGlobals();
        vi.stubGlobal('fetch', vi.fn().mockImplementation(() => createFetchResponse()));
    });

    it('renders an accessible search box for docs', () => {
        render(DocsIndex, { props: { sections: SECTIONS_FIXTURE } });

        const searchBox = screen.getByRole('searchbox', { name: /search docs/i });

        expect(searchBox).not.toBeNull();
        expect(searchBox.getAttribute('id')).toBe('docs-search-input');
    });

    it('filters links using the search query', async () => {
        render(DocsIndex, { props: { sections: SECTIONS_FIXTURE } });

        const searchBox = screen.getByRole('searchbox', { name: /search docs/i });

        await fireEvent.input(searchBox, { target: { value: 'quest' } });

        expect(screen.queryByRole('link', { name: 'About' })).toBeNull();
        expect(
            screen.getByRole('link', {
                name: 'Quest Development Guidelines',
            })
        ).not.toBeNull();
    });

    it('applies has:link operator filters', async () => {
        const fetchSpy = globalThis.fetch as unknown as ReturnType<typeof vi.fn>;

        render(DocsIndex, { props: { sections: SECTIONS_FIXTURE } });

        const searchBox = screen.getByRole('searchbox', { name: /search docs/i });

        await fireEvent.input(searchBox, { target: { value: 'has:link' } });

        expect(screen.getByRole('link', { name: 'About' })).not.toBeNull();
        expect(screen.queryByRole('link', { name: 'Mission' })).toBeNull();
        expect(fetchSpy).not.toHaveBeenCalled();
    });

    it('loads deferred corpus on first keyword query and reuses it', async () => {
        const fetchSpy = vi.fn().mockImplementation(
            () =>
                createFetchResponse({
                    'quest-guidelines': 'Playbooks include turbine setup and validation.',
                    'quest-schema': 'Schema docs describe quest image metadata.',
                })
        );
        vi.stubGlobal('fetch', fetchSpy);

        render(DocsIndex, { props: { sections: SECTIONS_FIXTURE } });

        const searchBox = screen.getByRole('searchbox', { name: /search docs/i });

        await fireEvent.input(searchBox, { target: { value: 'turbine' } });

        expect(
            await screen.findByRole('link', { name: 'Quest Development Guidelines' })
        ).not.toBeNull();
        expect(fetchSpy).toHaveBeenCalledTimes(1);

        await fireEvent.input(searchBox, { target: { value: 'schema' } });
        expect(
            await screen.findByRole('link', { name: 'Quest Schema Requirements' })
        ).not.toBeNull();
        expect(fetchSpy).toHaveBeenCalledTimes(1);
    });

    it('retries corpus loading after an initial fetch failure', async () => {
        const fetchSpy = vi
            .fn()
            .mockRejectedValueOnce(new Error('temporary failure'))
            .mockImplementationOnce(() =>
                createFetchResponse({
                    'quest-guidelines': 'Playbooks include turbine setup and validation.',
                })
            );
        vi.stubGlobal('fetch', fetchSpy);

        render(DocsIndex, { props: { sections: SECTIONS_FIXTURE } });

        const searchBox = screen.getByRole('searchbox', { name: /search docs/i });

        await fireEvent.input(searchBox, { target: { value: 'playbooksx' } });
        expect(screen.queryByRole('link', { name: 'Quest Development Guidelines' })).toBeNull();

        await fireEvent.input(searchBox, { target: { value: 'has:link' } });
        await fireEvent.input(searchBox, { target: { value: 'playbooks' } });
        expect(await screen.findByRole('link', { name: 'Quest Development Guidelines' })).not.toBeNull();
        expect(fetchSpy).toHaveBeenCalledTimes(2);
    });

    it('combines text queries with has:image operator filters', async () => {
        const fetchSpy = vi.fn().mockImplementation(
            () =>
                createFetchResponse({
                    'quest-guidelines': 'Quest development procedures.',
                    'quest-schema': 'Quest schema includes image requirements.',
                })
        );
        vi.stubGlobal('fetch', fetchSpy);

        render(DocsIndex, { props: { sections: SECTIONS_FIXTURE } });

        const searchBox = screen.getByRole('searchbox', { name: /search docs/i });

        await fireEvent.input(searchBox, { target: { value: 'quest has:image' } });

        expect(
            screen.getByRole('link', {
                name: 'Quest Schema Requirements',
            })
        ).not.toBeNull();
        expect(
            screen.queryByRole('link', {
                name: 'Quest Development Guidelines',
            })
        ).toBeNull();
    });

    it('shows snippets for mixed keyword and has: queries', async () => {
        vi.stubGlobal(
            'fetch',
            vi.fn().mockImplementation(() =>
                createFetchResponse({
                    'quest-guidelines':
                        'Quest playbooks include turbine setup and guided link collections.',
                })
            )
        );

        const { container } = render(DocsIndex, { props: { sections: SECTIONS_FIXTURE } });

        const searchBox = screen.getByRole('searchbox', { name: /search docs/i });

        await fireEvent.input(searchBox, { target: { value: 'playbooks has:link' } });

        await waitFor(() => expect(container.querySelector('.doc-snippet')).not.toBeNull());
        const snippet = container.querySelector('.doc-snippet');
        expect(snippet.textContent?.toLowerCase()).toContain('playbooks');
    });
});
