import { fireEvent, render, screen } from '@testing-library/svelte';
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
                keywords: ['quest'],
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

describe('DocsIndex search operators', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
    });

    it('renders an accessible search box for docs', () => {
        render(DocsIndex, { props: { sections: SECTIONS_FIXTURE } });

        const searchBox = screen.getByRole('searchbox', { name: /search docs/i });

        expect(searchBox).not.toBeNull();
        expect(searchBox.getAttribute('id')).toBe('docs-search-input');
    });

    it('filters links using the search query', async () => {
        vi.spyOn(globalThis, 'fetch').mockResolvedValue({
            ok: true,
            json: async () => ({
                bySlug: {
                    'quest-guidelines': 'Quest development playbook.',
                    'quest-schema': 'Quest schema requirements.',
                },
            }),
        } as Response);

        render(DocsIndex, { props: { sections: SECTIONS_FIXTURE } });

        const searchBox = screen.getByRole('searchbox', { name: /search docs/i });

        await fireEvent.input(searchBox, { target: { value: 'quest' } });

        expect(screen.queryByRole('link', { name: 'About' })).toBeNull();
        expect(
            await screen.findByRole('link', {
                name: 'Quest Development Guidelines',
            })
        ).not.toBeNull();
    });

    it('applies has:link operator filters', async () => {
        render(DocsIndex, { props: { sections: SECTIONS_FIXTURE } });

        const searchBox = screen.getByRole('searchbox', { name: /search docs/i });

        await fireEvent.input(searchBox, { target: { value: 'has:link' } });

        expect(screen.getByRole('link', { name: 'About' })).not.toBeNull();
        expect(screen.queryByRole('link', { name: 'Mission' })).toBeNull();
    });

    it('combines text queries with has:image operator filters', async () => {
        vi.spyOn(globalThis, 'fetch').mockResolvedValue({
            ok: true,
            json: async () => ({
                bySlug: {
                    'quest-schema': 'Schema docs include quest rewards and structure.',
                },
            }),
        } as Response);

        render(DocsIndex, { props: { sections: SECTIONS_FIXTURE } });

        const searchBox = screen.getByRole('searchbox', { name: /search docs/i });

        await fireEvent.input(searchBox, { target: { value: 'quest has:image' } });

        expect(
            await screen.findByRole('link', {
                name: 'Quest Schema Requirements',
            })
        ).not.toBeNull();
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

    it('applies has:image without loading deferred full-text corpus', async () => {
        const fetchSpy = vi.spyOn(globalThis, 'fetch');
        render(DocsIndex, { props: { sections: SECTIONS_FIXTURE } });

        const searchBox = screen.getByRole('searchbox', { name: /search docs/i });
        await fireEvent.input(searchBox, { target: { value: 'has:image' } });

        expect(fetchSpy).not.toHaveBeenCalled();
        expect(screen.getByRole('link', { name: 'Quest Schema Requirements' })).not.toBeNull();
    });

    it('loads deferred corpus for first keyword query and reuses it for later queries', async () => {
        const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
            ok: true,
            json: async () => ({
                bySlug: {
                    'quest-schema': 'Use durable quest schema constraints for deterministic validation.',
                },
            }),
        } as Response);

        render(DocsIndex, { props: { sections: SECTIONS_FIXTURE } });

        const searchBox = screen.getByRole('searchbox', { name: /search docs/i });
        await fireEvent.input(searchBox, { target: { value: 'deterministic' } });

        expect(await screen.findByRole('link', { name: 'Quest Schema Requirements' })).not.toBeNull();
        expect(await screen.findByText(/deterministic/i)).not.toBeNull();
        expect(fetchSpy).toHaveBeenCalledTimes(1);

        await fireEvent.input(searchBox, { target: { value: 'validation' } });
        expect(fetchSpy).toHaveBeenCalledTimes(1);
        expect(await screen.findByText(/validation/i)).not.toBeNull();
    });
});
