import { describe, expect, it } from 'vitest';

import { isMenuItemActive } from '../svelte/menuActive.js';

describe('isMenuItemActive', () => {
    it('keeps /quests routes active without activating /energy', () => {
        const pathname = '/quests/energy/battery-maintenance';

        expect(isMenuItemActive(pathname, { href: '/quests' })).toBe(true);
        expect(isMenuItemActive(pathname, { href: '/energy' })).toBe(false);
    });

    it('activates a legacy /app prefixed route by final segment match', () => {
        expect(isMenuItemActive('/app/gamesaves', { href: '/gamesaves' })).toBe(true);
    });

    it('keeps nested legacy /app quest routes active without activating /energy', () => {
        const pathname = '/app/quests/energy/battery-maintenance';

        expect(isMenuItemActive(pathname, { href: '/quests' })).toBe(true);
        expect(isMenuItemActive(pathname, { href: '/energy' })).toBe(false);
    });

    it('keeps legitimate child routes active for top-level sections', () => {
        expect(isMenuItemActive('/energy/some-child', { href: '/energy' })).toBe(true);
        expect(isMenuItemActive('/quests/some-child', { href: '/quests' })).toBe(true);
    });

    it('never highlights two top-level sections for nested quest routes', () => {
        const pathname = '/quests/energy/battery-maintenance';
        const topLevelHrefs = [
            '/',
            '/quests',
            '/inventory',
            '/energy',
            '/wallet',
            '/profile',
            '/docs',
            '/chat',
            '/changelog',
        ];

        const activeCount = topLevelHrefs.filter((href) =>
            isMenuItemActive(pathname, {
                href,
            })
        ).length;

        expect(activeCount).toBe(1);
    });
});
