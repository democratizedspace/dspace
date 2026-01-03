import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/svelte';
import { describe, it, expect } from 'vitest';

import DocsIndex from '../../../components/svelte/DocsIndex.svelte';

const sections = [
    {
        title: 'Basics',
        links: [
            { title: 'About', href: '/docs/about' },
            { title: 'Mission', href: '/docs/mission' },
        ],
    },
    {
        title: 'Media',
        links: [
            { title: 'Team', href: '/docs/team' },
            { title: 'Changelog', href: '/docs/changelog' },
        ],
    },
];

const metadata = {
    '/docs/about': { hasLink: true, hasImage: false },
    '/docs/mission': { hasLink: false, hasImage: false },
    '/docs/team': { hasLink: true, hasImage: true },
    '/docs/changelog': { hasLink: true, hasImage: false },
};

describe('DocsIndex search operators', () => {
    it('returns docs with links when querying has:link', async () => {
        render(DocsIndex, { props: { sections, metadata } });

        const searchBox = screen.getByRole('searchbox', { name: /search docs/i });
        await fireEvent.input(searchBox, { target: { value: 'has:link' } });

        expect(screen.queryByRole('link', { name: 'Mission' })).not.toBeInTheDocument();
        expect(screen.getByRole('link', { name: 'About' })).toBeInTheDocument();
        expect(screen.getByRole('link', { name: 'Team' })).toBeInTheDocument();
    });

    it('returns docs with images when querying has:image', async () => {
        render(DocsIndex, { props: { sections, metadata } });

        const searchBox = screen.getByRole('searchbox', { name: /search docs/i });
        await fireEvent.input(searchBox, { target: { value: 'has:image' } });

        expect(screen.queryByRole('link', { name: 'Mission' })).not.toBeInTheDocument();
        expect(screen.getByRole('link', { name: 'Team' })).toBeInTheDocument();
    });

    it('supports combining text and operator filters', async () => {
        render(DocsIndex, { props: { sections, metadata } });

        const searchBox = screen.getByRole('searchbox', { name: /search docs/i });
        await fireEvent.input(searchBox, { target: { value: 'team has:image' } });

        expect(screen.getByRole('link', { name: 'Team' })).toBeInTheDocument();
        expect(screen.queryByRole('link', { name: 'Changelog' })).not.toBeInTheDocument();
    });
});
