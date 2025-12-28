import { describe, expect, it } from 'vitest';
import { cheatsEnvironment, isCheatsAvailable } from '../frontend/src/utils/cheatsAvailability';

describe('cheats availability helper', () => {
    it('disables cheats when environment is missing', () => {
        expect(isCheatsAvailable(undefined)).toBe(false);
        expect(isCheatsAvailable(null)).toBe(false);
    });

    it('allows cheats in dev-like environments', () => {
        expect(isCheatsAvailable('dev')).toBe(true);
        expect(isCheatsAvailable('development')).toBe(true);
    });

    it('allows cheats in staging', () => {
        expect(isCheatsAvailable('staging')).toBe(true);
        expect(isCheatsAvailable('Staging')).toBe(true);
    });

    it('blocks cheats in production', () => {
        expect(isCheatsAvailable('production')).toBe(false);
        expect(isCheatsAvailable('prod')).toBe(false);
    });

    it('exposes the allowed environments list for documentation helpers', () => {
        expect(cheatsEnvironment.allowed).toEqual(['dev', 'development', 'staging']);
    });
});
