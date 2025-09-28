import { describe, it, expect } from 'vitest';
import menu from '../frontend/src/config/menu.json';
import { isMenuItemActive } from '../frontend/src/components/svelte/menuActive.js';

describe('Menu active state for unpinned links', () => {
    it('marks unpinned routes active even when served from a subpath', () => {
        const gamesaves = menu.find((item) => item.href === '/gamesaves');

        expect(isMenuItemActive('/app/gamesaves', gamesaves)).toBe(true);
    });
});
