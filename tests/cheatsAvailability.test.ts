import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { isCheatsAvailable } from '../frontend/src/utils/cheats';

const originalEnv = process.env.DSPACE_ENV;

describe('isCheatsAvailable', () => {
    beforeEach(() => {
        delete process.env.DSPACE_ENV;
    });

    afterEach(() => {
        if (originalEnv === undefined) {
            delete process.env.DSPACE_ENV;
        } else {
            process.env.DSPACE_ENV = originalEnv;
        }
    });

    it('returns false when env value is missing', () => {
        expect(isCheatsAvailable()).toBe(false);
        expect(isCheatsAvailable(null)).toBe(false);
    });

    it('disables cheats for production environments', () => {
        expect(isCheatsAvailable('production')).toBe(false);
        expect(isCheatsAvailable('Prod')).toBe(false);
    });

    it('enables cheats for dev and staging environments', () => {
        expect(isCheatsAvailable('dev')).toBe(true);
        expect(isCheatsAvailable('development')).toBe(true);
        expect(isCheatsAvailable('staging')).toBe(true);
    });
});
