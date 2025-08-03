const {
    base64ToObject,
    jsonToQuery,
    queryToJson,
    constructLink,
    getPriceStringComponents,
    getSymbolFromId,
} = require('../src/utils.js');
const items = require('../src/pages/inventory/json/items.json');

describe('encoding helpers', () => {
    test('jsonToQuery and queryToJson roundtrip', () => {
        const obj = { a: 1, b: 'hi' };
        const encoded = jsonToQuery(obj);
        expect(queryToJson(encoded)).toEqual(obj);
    });

    test('base64ToObject decodes encoded string', () => {
        const obj = { foo: 'bar', n: 42 };
        const encoded = Buffer.from(encodeURIComponent(JSON.stringify(obj))).toString('base64');
        expect(base64ToObject(encoded)).toEqual(obj);
    });

    test('base64ToObject returns empty object on invalid input', () => {
        expect(base64ToObject('@@invalid@@')).toEqual({});
    });
});

describe('URL helpers', () => {
    test('constructLink adds redirect query', () => {
        expect(constructLink(false, '/page', '/target')).toBe('/page?redirect=/target');
    });

    test('constructLink returns url without redirect', () => {
        expect(constructLink(false, '/page')).toBe('/page');
    });
});

describe('currency utilities', () => {
    test('getPriceStringComponents parses currency', () => {
        expect(getPriceStringComponents('10 dUSD')).toEqual({ price: 10, symbol: 'dUSD' });
    });

    test('getPriceStringComponents handles invalid input', () => {
        expect(getPriceStringComponents(null)).toEqual({ price: 0, symbol: '' });
    });

    test('getSymbolFromId fetches symbol from items', () => {
        const firstId = items[0].id;
        expect(getSymbolFromId(firstId)).toBe('dUSD');
    });
});
