import { describe, it, expect } from 'vitest';
import '@testing-library/jest-dom';
import { render } from '@testing-library/svelte';
import Menu from '../svelte/Menu.svelte';

describe('Menu active state regression coverage', () => {
    it('highlights only Quests for quest detail routes containing other menu keywords', () => {
        const { getByRole, queryByRole } = render(Menu, {
            pathname: '/quests/energy/battery-maintenance',
        });

        const questsLink = getByRole('link', { name: 'Quests' });
        const energyLink = getByRole('link', { name: 'Energy' });

        expect(questsLink).toHaveClass('active');
        expect(questsLink).toHaveAttribute('aria-current', 'page');
        expect(energyLink).not.toHaveClass('active');
        expect(queryByRole('link', { current: 'page', name: 'Energy' })).toBeNull();
    });

    it('keeps app-prefixed routes mapped to their menu destination', () => {
        const { getByRole } = render(Menu, { pathname: '/app/gamesaves' });

        const gamesavesLink = getByRole('link', { name: 'Import/export gamesaves' });
        expect(gamesavesLink).toHaveClass('active');
        expect(gamesavesLink).toHaveAttribute('aria-current', 'page');
    });
});
