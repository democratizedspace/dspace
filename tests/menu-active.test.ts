import { describe, it, expect } from 'vitest';
import menu from '../frontend/src/config/menu.json' assert { type: 'json' };
import { isMenuItemActive } from '../frontend/src/components/svelte/menuActive.js';

describe('Menu active state for unpinned links', () => {
    it('marks unpinned routes active even when served from a subpath', () => {
        const gamesaves = menu.find((item) => item.href === '/gamesaves');

        expect(isMenuItemActive('/app/gamesaves', gamesaves)).toBe(true);
    });

    it('does not mark /energy active for quest routes that contain an energy path segment', () => {
        const quests = menu.find((item) => item.href === '/quests');
        const energy = menu.find((item) => item.href === '/energy');
        const pathname = '/quests/energy/battery-maintenance';

        expect(isMenuItemActive(pathname, quests)).toBe(true);
        expect(isMenuItemActive(pathname, energy)).toBe(false);
    });
});
