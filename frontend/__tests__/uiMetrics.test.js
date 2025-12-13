import { describe, it, expect } from 'vitest';
import { calculateHydrationTime } from '../src/utils/uiMetrics.js';

describe('calculateHydrationTime', () => {
    it('calculates difference between end and start', () => {
        expect(calculateHydrationTime(100, 150)).toBe(50);
    });

    it('throws when inputs are invalid', () => {
        expect(() => calculateHydrationTime('a', 2)).toThrow();
        expect(() => calculateHydrationTime(1, 'b')).toThrow();
    });
});
