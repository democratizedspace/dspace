const {
    parseCookie,
    getCookieValue,
    getCookies,
    getCookieItems,
    prettyPrintDuration,
} = require('../src/utils.js');

describe('cookie utilities', () => {
    const cookie = 'foo=bar; item-alpha=2; hello=world; item-beta=3';

    test('parseCookie parses key/value pairs', () => {
        expect(parseCookie(cookie)).toEqual({
            foo: 'bar',
            'item-alpha': '2',
            hello: 'world',
            'item-beta': '3',
        });
    });

    test('getCookieValue retrieves a value', () => {
        expect(getCookieValue(cookie, 'hello')).toBe('world');
    });

    test('getCookies returns array of objects', () => {
        expect(getCookies(cookie)).toEqual([
            { key: 'foo', value: 'bar' },
            { key: 'item-alpha', value: '2' },
            { key: 'hello', value: 'world' },
            { key: 'item-beta', value: '3' },
        ]);
    });

    test('getCookieItems extracts item counts', () => {
        expect(getCookieItems(cookie)).toEqual([
            { id: 'alpha', count: 2 },
            { id: 'beta', count: 3 },
        ]);
    });
});

describe('prettyPrintDuration', () => {
    test('formats seconds into human readable string', () => {
        expect(prettyPrintDuration(3661)).toBe('1h 1m 1s');
    });
});
