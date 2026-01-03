/**
 * @jest-environment jsdom
 */
import { describe, it, expect } from 'vitest';
import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/svelte';

import DocsIndex from '../src/components/svelte/DocsIndex.svelte';

const SECTIONS_FIXTURE = [
    {
        title: 'The basics',
        links: [
            { title: 'About', href: '/docs/about' },
            { title: 'Mission', href: '/docs/mission', keywords: ['vision'] },
        ],
    },
    {
        title: 'Quests',
        links: [
            {
                title: 'Quest Development Guidelines',
                href: '/docs/quest-guidelines',
                keywords: ['quest'],
            },
            {
                title: 'Quest Schema Requirements',
                href: '/docs/quest-schema',
                keywords: ['schema', 'quest'],
            },
        ],
    },
    {
        title: 'Showcase',
        links: [
            { title: 'Amazing', href: '/docs/amazing', keywords: ['image'] },
            { title: 'Bounties', href: '/docs/bounties', keywords: ['tokens'] },
        ],
    },
];

describe('DocsIndex component', () => {
    it('renders an accessible search box for docs', () => {
        render(DocsIndex, { props: { sections: SECTIONS_FIXTURE } });

        const searchBox = screen.getByRole('searchbox', { name: /search docs/i });

        expect(searchBox).toBeInTheDocument();
        expect(searchBox).toHaveAttribute('id', 'docs-search-input');
    });

    it('filters links using the search query', async () => {
        render(DocsIndex, { props: { sections: SECTIONS_FIXTURE } });

        const searchBox = screen.getByRole('searchbox', { name: /search docs/i });

        await fireEvent.input(searchBox, { target: { value: 'quest' } });

        expect(screen.queryByRole('link', { name: 'About' })).not.toBeInTheDocument();
        expect(
            screen.getByRole('link', {
                name: 'Quest Development Guidelines',
            })
        ).toBeInTheDocument();
    });

    it('supports has:link operator', async () => {
        render(DocsIndex, { props: { sections: SECTIONS_FIXTURE } });

        const searchBox = screen.getByRole('searchbox', { name: /search docs/i });

        await fireEvent.input(searchBox, { target: { value: 'has:link' } });

        expect(screen.getByRole('link', { name: 'About' })).toBeInTheDocument();
        expect(screen.queryByRole('link', { name: 'Bounties' })).not.toBeInTheDocument();
    });

    it('supports has:image operator', async () => {
        render(DocsIndex, { props: { sections: SECTIONS_FIXTURE } });

        const searchBox = screen.getByRole('searchbox', { name: /search docs/i });

        await fireEvent.input(searchBox, { target: { value: 'has:image' } });

        expect(screen.getByRole('link', { name: 'Amazing' })).toBeInTheDocument();
        expect(screen.queryByRole('link', { name: 'About' })).not.toBeInTheDocument();
    });
});
