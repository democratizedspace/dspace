/**
 * @jest-environment node
 */

const PATH = '../jest.setup.js';

// Helper to reset globals before requiring the setup file
function resetGlobals() {
    delete global.window;
    delete global.document;
    delete global.navigator;
    delete global.TextEncoder;
    delete global.TextDecoder;
    delete global.structuredClone;
    delete global.setImmediate;
    delete global.clearImmediate;
    delete global.Headers;
    delete global.FormData;
    delete global.Blob;
    delete global.CustomEvent;
    delete global.Event;
}

describe('jest.setup.js', () => {
    beforeEach(() => {
        jest.resetModules();
        resetGlobals();
    });

    test('polyfills browser globals when none exist', () => {
        require(PATH);
        const svelteInternal = require('svelte/internal');
        expect(svelteInternal.globals.Error).toBe(Error);

        // Setup script overrides the initial href during configuration
        expect(global.window.location.href).toBe('http://localhost:3000/');
        const div = global.document.createElement('div');
        expect(div.tagName).toBe('DIV');

        const blob = new global.Blob(['abc'], { type: 'text/plain' });
        expect(blob.type).toBe('text/plain');

        expect(global.structuredClone({ a: 1 }).a).toBe(1);
        expect(global.__SSR__).toBe(false);
        expect(global.__BROWSER__).toBe(true);
        expect(global.setImmediate).toBeDefined();
        expect(global.clearImmediate).toBeDefined();

        // Exercise DOM helpers
        const img = global.document.createElement('img');
        expect(img.src).toBe('');

        const input = global.document.createElement('input');
        input.value = 'a';
        expect(input.type).toBe('text');
        expect(input.value).toBe('a');

        const link = global.document.createElement('a');
        expect(link.href).toBe('');

        global.localStorage.setItem('x', '1');
        expect(global.localStorage.setItem).toHaveBeenCalledWith('x', '1');

        global.sessionStorage.setItem('y', '2');
        expect(global.sessionStorage.setItem).toHaveBeenCalledWith('y', '2');

        global.indexedDB.open('db');
        expect(global.indexedDB.open).toHaveBeenCalled();

        window.requestAnimationFrame(() => 1);
        window.cancelAnimationFrame(1);

        const parser = new global.DOMParser();
        expect(parser.parseFromString('<a></a>', 'text/html')).toBeDefined();

        expect(global.fetch).toBeDefined();
        return global.fetch().then((res) => {
            expect(res.ok).toBe(true);
        });
    });

    test('replaces any preexisting window object', () => {
        const original = { custom: true };
        global.window = original;
        jest.resetModules();
        require(PATH);

        expect(global.window).not.toBe(original);
        expect(global.window.custom).toBeUndefined();
        expect(global.window.location.href).toBe('http://localhost:3000/');
    });
});
