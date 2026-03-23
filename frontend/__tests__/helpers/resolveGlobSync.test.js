/**
 * @jest-environment node
 */
const { resolveGlobSync } = require('./resolveGlobSync');

describe('resolveGlobSync', () => {
    test('prefers globSync when present', () => {
        const globSync = jest.fn();
        const resolved = resolveGlobSync({ globSync, sync: jest.fn() }, 'helpers test');
        expect(resolved).toBe(globSync);
    });

    test('falls back to sync when globSync is absent', () => {
        const sync = jest.fn();
        const resolved = resolveGlobSync({ sync }, 'helpers test');
        expect(resolved).toBe(sync);
    });

    test('falls back to callable module export', () => {
        const callableExport = jest.fn();
        const resolved = resolveGlobSync(callableExport, 'helpers test');
        expect(resolved).toBe(callableExport);
    });

    test('throws a descriptive error for unsupported module shape', () => {
        expect(() => resolveGlobSync({}, 'questQuality.test.js')).toThrow(
            'Unsupported "glob" module API in questQuality.test.js'
        );
    });
});
