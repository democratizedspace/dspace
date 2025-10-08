import { describe, it, expect } from 'vitest';
import menu from '../frontend/src/config/menu.json';

describe('Menu stats entry', () => {
    it('exposes Stats as an available destination', () => {
        const stats = menu.find((item) => item.name === 'Stats');

        expect(stats).toBeDefined();
        expect(stats?.comingSoon).not.toBe(true);
        expect(stats?.href).toBe('/stats');
    });
});
