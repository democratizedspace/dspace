import { fireEvent, render, screen } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vitest';

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
                bodyText: 'Quest development starts with narrative goals.',
            },
            {
                title: 'Quest Schema Requirements',
                href: '/docs/quest-schema',
                keywords: ['schema', 'quest'],
                features: ['link', 'image'],
                bodyText: 'Schema guides include image and link examples.',
            },
        ],
    },
];

describe('DocsIndex search operators', () => {
    it('renders an accessible search box for docs', () => {
        render(DocsIndex, { props: { sections: SECTIONS_FIXTURE } });

        const searchBox = screen.getByRole('searchbox', { name: /search docs/i });

        expect(searchBox).not.toBeNull();
        expect(searchBox.getAttribute('id')).toBe('docs-search-input');
    });

    it('filters links using the search query', async () => {
        render(DocsIndex, {
            props: { sections: SECTIONS_FIXTURE, loadFullTextCorpus: async () => ({}) },
        });

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
        const loadFullTextCorpus = vi.fn(async () => ({}));
        render(DocsIndex, { props: { sections: SECTIONS_FIXTURE, loadFullTextCorpus } });

        const searchBox = screen.getByRole('searchbox', { name: /search docs/i });

        await fireEvent.input(searchBox, { target: { value: 'has:link' } });

        expect(screen.getByRole('link', { name: 'About' })).not.toBeNull();
        expect(screen.queryByRole('link', { name: 'Mission' })).toBeNull();
        expect(loadFullTextCorpus).not.toHaveBeenCalled();
    });

    it('combines text queries with has:image operator filters', async () => {
        render(DocsIndex, {
            props: { sections: SECTIONS_FIXTURE, loadFullTextCorpus: async () => ({}) },
        });

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

    it('loads deferred full-text corpus once for keyword searches and reuses it', async () => {
        const loadFullTextCorpus = vi.fn(async () => ({
            '/docs/about': 'The mission includes turbine planning notes.',
            '/docs/mission': 'Wind turbine output forecasts.',
        }));
        const sections = [
            {
                title: 'The basics',
                links: [
                    { title: 'About', href: '/docs/about', features: [] },
                    { title: 'Mission', href: '/docs/mission', features: [] },
                ],
            },
        ];
        render(DocsIndex, { props: { sections, loadFullTextCorpus } });

        const searchBox = screen.getByRole('searchbox', { name: /search docs/i });
        await fireEvent.input(searchBox, { target: { value: 'turbine' } });

        expect(loadFullTextCorpus).toHaveBeenCalledTimes(1);
        expect(await screen.findByRole('link', { name: 'Mission' })).not.toBeNull();
        expect(await screen.findByTitle(/wind turbine output forecasts/i)).not.toBeNull();

        await fireEvent.input(searchBox, { target: { value: 'wind' } });
        expect(loadFullTextCorpus).toHaveBeenCalledTimes(1);
        expect(await screen.findByRole('link', { name: 'Mission' })).not.toBeNull();
    });
});
