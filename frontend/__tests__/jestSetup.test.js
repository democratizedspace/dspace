/**
 * @jest-environment node
 */

const PATH = '../jest-setup.js';

// Helper to reset globals before requiring the setup file
function resetGlobals() {
    delete global.window;
    delete global.document;
    delete global.TextEncoder;
    delete global.TextDecoder;
    delete global.structuredClone;
    delete global.Buffer;
    delete global.process;
    delete global.Headers;
    delete global.FormData;
    delete global.Blob;
    delete global.CustomEvent;
    delete global.Event;
}

describe('jest-setup.js', () => {
    beforeEach(() => {
        jest.resetModules();
        resetGlobals();
    });

    test('polyfills browser globals when none exist', () => {
        const MockFormData = require('../__mocks__/formData.js');
        require(PATH);

        // Setup script overrides the initial href during configuration
        expect(global.window.location.href).toBe('http://localhost:3000/');
        const div = global.document.createElement('div');
        expect(div.tagName).toBe('DIV');

        const headers = new global.Headers();
        headers.append('X-Test', 'value');
        expect(headers.get('X-Test')).toBe('value');

        const fd = new global.FormData();
        fd.append('foo', 'bar');
        expect(fd.get('foo')).toBe('bar');
        expect(global.FormData).toBe(MockFormData);

        const blob = new global.Blob(['abc'], { type: 'text/plain' });
        expect(blob.type).toBe('text/plain');

        expect(global.structuredClone({ a: 1 }).a).toBe(1);
        expect(global.__SSR__).toBe(false);
        expect(global.__BROWSER__).toBe(true);
        expect(global.jest).toBeDefined();
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
