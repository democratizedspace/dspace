import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';

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

describe('DocsIndex search operators', () => {
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

    it('applies has:link operator filters', async () => {
        render(DocsIndex, { props: { sections: SECTIONS_FIXTURE } });

        const searchBox = screen.getByRole('searchbox', { name: /search docs/i });

        await fireEvent.input(searchBox, { target: { value: 'has:link' } });

        expect(screen.getByRole('link', { name: 'About' })).toBeInTheDocument();
        expect(screen.queryByRole('link', { name: 'Mission' })).not.toBeInTheDocument();
    });

    it('combines text queries with has:image operator filters', async () => {
        render(DocsIndex, { props: { sections: SECTIONS_FIXTURE } });

        const searchBox = screen.getByRole('searchbox', { name: /search docs/i });

        await fireEvent.input(searchBox, { target: { value: 'quest has:image' } });

        expect(
            screen.getByRole('link', {
                name: 'Quest Schema Requirements',
            })
        ).toBeInTheDocument();
        expect(
            screen.queryByRole('link', {
                name: 'Quest Development Guidelines',
            })
        ).not.toBeInTheDocument();
    });

    it('shows a snippet when matching body text', async () => {
        render(DocsIndex, {
            props: {
                sections: [
                    {
                        title: 'Skills',
                        links: [
                            {
                                title: 'Solar Power',
                                href: '/docs/solar',
                                bodyText: 'Wind turbines are also available for renewable power.',
                            },
                        ],
                    },
                ],
            },
        });

        const searchBox = screen.getByRole('searchbox', { name: /search docs/i });

        await fireEvent.input(searchBox, { target: { value: 'turbine' } });

        expect(screen.getByRole('link', { name: 'Solar Power' })).toBeInTheDocument();

        const snippet = screen.getByTestId('docs-snippet');

        expect(snippet).toHaveTextContent('Wind turbines are also');
        expect(snippet.querySelector('strong')).toHaveTextContent(/turbine/i);
    });
});
