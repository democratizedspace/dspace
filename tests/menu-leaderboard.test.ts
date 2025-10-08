import { describe, it, expect } from 'vitest';
import menu from '../frontend/src/config/menu.json';

describe('Menu leaderboard entry', () => {
    it('exposes Leaderboard as an available destination', () => {
        const leaderboard = menu.find((item) => item.name === 'Leaderboard');

        expect(leaderboard).toBeDefined();
        expect(leaderboard?.comingSoon).not.toBe(true);
        expect(leaderboard?.href).toBe('/leaderboard');
    });
});
