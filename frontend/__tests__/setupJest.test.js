/**
 * @jest-environment node
 */

const PATH = '../setupJest.js';

function resetGlobals() {
    delete global.window;
    delete global.document;
    delete global.navigator;
    delete global.Element;
    delete global.HTMLElement;
    delete global.CustomEvent;
    delete global.TextEncoder;
    delete global.TextDecoder;
    delete global.structuredClone;
}

describe('setupJest.js', () => {
    beforeEach(() => {
        jest.resetModules();
        resetGlobals();
    });

    test('creates browser-like globals', () => {
        expect(global.window).toBeUndefined();
        require(PATH);
        expect(global.window).toBeDefined();
        expect(global.document).toBeDefined();
        expect(global.navigator).toBeDefined();
        expect(global.Element).toBeDefined();
        expect(global.structuredClone).toBeDefined();
        expect(global.structuredClone({ a: 1 })).toEqual({ a: 1 });
    });

    test('preserves existing structuredClone', () => {
        const original = () => 'ok';
        global.structuredClone = original;
        require(PATH);
        expect(global.structuredClone).toBe(original);
    });
});
