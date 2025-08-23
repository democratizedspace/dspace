/** @jest-environment jsdom */
import { describe, it, expect } from 'vitest';
import '@testing-library/jest-dom';
import { render, fireEvent } from '@testing-library/svelte';
import Menu from '../src/components/svelte/Menu.svelte';

// Ensure localStorage available
if (!global.localStorage) {
    global.localStorage = {
        getItem: () => null,
        setItem: () => {},
        removeItem: () => {},
    };
}

describe('Menu accessibility', () => {
    it('toggles aria-expanded on More button', async () => {
        const { getByRole } = render(Menu, { pathname: '/' });
        const toggle = getByRole('button', { name: /More/ });
        const unpinned = document.getElementById('unpinned-menu');

        expect(toggle).toHaveAttribute('aria-expanded', 'false');
        expect(unpinned).toHaveAttribute('hidden');

        await fireEvent.click(toggle);

        expect(toggle).toHaveAttribute('aria-expanded', 'true');
        expect(unpinned).not.toHaveAttribute('hidden');
    });

    it('marks active link with aria-current', () => {
        const { getByRole } = render(Menu, { pathname: '/' });
        const homeLink = getByRole('link', { name: 'Home' });
        expect(homeLink).toHaveAttribute('aria-current', 'page');
    });
});
