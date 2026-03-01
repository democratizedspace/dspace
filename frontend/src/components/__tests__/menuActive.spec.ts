import { describe, expect, it } from 'vitest';

import { isMenuItemActive } from '../svelte/menuActive.js';

const item = (href: string) => ({ href });

describe('isMenuItemActive', () => {
    it('activates quest menu item for nested quest routes', () => {
        const pathname = '/quests/energy/battery-maintenance';

        expect(isMenuItemActive(pathname, item('/quests'))).toBe(true);
    });

    it('does not activate unrelated menu item for path segment collisions', () => {
        const pathname = '/quests/energy/battery-maintenance';

        expect(isMenuItemActive(pathname, item('/energy'))).toBe(false);
    });

    it('supports /app base path while keeping matching scoped', () => {
        expect(isMenuItemActive('/app/gamesaves', item('/gamesaves'))).toBe(true);
        expect(isMenuItemActive('/app/quests/energy/battery-maintenance', item('/energy'))).toBe(
            false
        );
    });
});
