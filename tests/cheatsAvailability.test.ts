import { describe, expect, it, afterEach } from 'vitest';
import { isCheatsAvailable } from '../frontend/src/utils/cheatsAvailability';

const originalEnv = process.env.DSPACE_ENV;

afterEach(() => {
    process.env.DSPACE_ENV = originalEnv;
});

describe('isCheatsAvailable', () => {
    it('returns false when the environment is missing', () => {
        process.env.DSPACE_ENV = '';
        expect(isCheatsAvailable()).toBe(false);
    });

    it('disables cheats in production aliases', () => {
        expect(isCheatsAvailable('production')).toBe(false);
        expect(isCheatsAvailable('prod')).toBe(false);
    });

    it('enables cheats in development variants', () => {
        expect(isCheatsAvailable('dev')).toBe(true);
        expect(isCheatsAvailable('development')).toBe(true);
    });

    it('enables cheats in staging', () => {
        expect(isCheatsAvailable('staging')).toBe(true);
    });

    it('trims and normalizes environment names', () => {
        expect(isCheatsAvailable('  StAgInG ')).toBe(true);
        expect(isCheatsAvailable('   PROD   ')).toBe(false);
    });
});
