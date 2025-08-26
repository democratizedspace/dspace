import { describe, it, expect } from 'vitest';
import { durationInSeconds } from '../src/utils.js';

describe('durationInSeconds', () => {
    it('parses uppercase units', () => {
        expect(durationInSeconds('1H 30M')).toBe(5400);
        expect(durationInSeconds('45S')).toBe(45);
    });
});
