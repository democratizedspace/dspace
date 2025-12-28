import { describe, expect, test } from 'vitest';
import { isCheatsAvailable } from '../../src/utils/cheats';

describe('isCheatsAvailable', () => {
    test('returns false when env is missing', () => {
        expect(isCheatsAvailable(undefined)).toBe(false);
        expect(isCheatsAvailable(null as unknown as string)).toBe(false);
    });

    test('returns false for production aliases', () => {
        expect(isCheatsAvailable('production')).toBe(false);
        expect(isCheatsAvailable('prod')).toBe(false);
    });

    test('returns true for development aliases', () => {
        expect(isCheatsAvailable('dev')).toBe(true);
        expect(isCheatsAvailable('development')).toBe(true);
    });

    test('returns true for staging', () => {
        expect(isCheatsAvailable('staging')).toBe(true);
    });

    test('ignores casing and whitespace', () => {
        expect(isCheatsAvailable('  StAgInG  ')).toBe(true);
    });
});
