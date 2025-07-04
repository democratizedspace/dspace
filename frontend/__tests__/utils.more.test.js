const {
    prettyPrintNumber,
    parseBool,
    datetimeAfterDuration,
    getWalletBalance,
    burnCurrency,
    addWalletBalance,
    fixMarkdownText,
    getPriceStringComponents,
    getSymbolFromId,
    constructLink,
    base64ToObject,
    jsonToQuery,
    queryToJson,
} = require('../src/utils.js');

describe('number and boolean utilities', () => {
    test('prettyPrintNumber handles small and large numbers', () => {
        expect(prettyPrintNumber(0.0003)).toBe('3.E-4');
        expect(prettyPrintNumber(10000)).toBe('1.E4');
        expect(prettyPrintNumber(1.234)).toBe('1.234');
    });

    test('parseBool returns true only for "true"', () => {
        expect(parseBool('true')).toBe(true);
        expect(parseBool('false')).toBe(false);
        expect(parseBool('random')).toBe(false);
    });
});

describe('date utilities', () => {
    test('datetimeAfterDuration adds seconds', () => {
        jest.useFakeTimers();
        const now = new Date('2023-01-01T00:00:00Z');
        jest.setSystemTime(now);
        const result = datetimeAfterDuration(60);
        expect(result.getTime()).toBe(now.getTime() + 60000);
        jest.useRealTimers();
    });
});

describe('wallet utilities', () => {
    let req;
    let res;
    beforeEach(() => {
        req = { headers: { get: () => 'currency-balance-dUSD=5' } };
        res = { headers: { append: jest.fn() } };
    });

    test('getWalletBalance parses balance', () => {
        expect(getWalletBalance(req, 'dUSD')).toBe(5);
    });

    test('burnCurrency updates balance when sufficient', () => {
        expect(burnCurrency(req, res, 'dUSD', 2)).toBe(true);
        expect(res.headers.append).toHaveBeenCalledWith(
            'Set-Cookie',
            'currency-balance-dUSD=3; expires=Fri, 31 Dec 9999 23:59:59 GMT; path=/'
        );
    });

    test('burnCurrency fails when insufficient balance', () => {
        const req2 = { headers: { get: () => 'currency-balance-dUSD=1' } };
        expect(burnCurrency(req2, res, 'dUSD', 2)).toBe(false);
    });

    test('addWalletBalance increments balance', () => {
        expect(addWalletBalance(req, res, 'dUSD', 5)).toBe(10);
        expect(res.headers.append).toHaveBeenCalledWith(
            'Set-Cookie',
            'currency-balance-dUSD=10; expires=Fri, 31 Dec 9999 23:59:59 GMT; path=/'
        );
    });
});

describe('string and object helpers', () => {
    test('fixMarkdownText keeps straight quotes', () => {
        expect(fixMarkdownText("it's fine")).toBe("it's fine");
    });

    test('getPriceStringComponents parses currency', () => {
        expect(getPriceStringComponents('10 dUSD')).toEqual({ price: 10, symbol: 'dUSD' });
        expect(getPriceStringComponents()).toEqual({ price: 0, symbol: '' });
    });

    test('getSymbolFromId reads item price', () => {
        expect(getSymbolFromId('0')).toBe('dUSD');
        expect(getSymbolFromId('1')).toBe('');
    });

    test('constructLink appends redirect', () => {
        expect(constructLink(false, '/foo', '/bar')).toBe('/foo?redirect=/bar');
        expect(constructLink(false, '/foo')).toBe('/foo');
    });

    test('base64ToObject decodes valid string', () => {
        const obj = { a: 1 };
        const base64 = Buffer.from(encodeURIComponent(JSON.stringify(obj))).toString('base64');
        expect(base64ToObject(base64)).toEqual(obj);
    });

    test('base64ToObject handles invalid input', () => {
        expect(base64ToObject('not-base64')).toEqual({});
    });

    test('jsonToQuery and queryToJson roundtrip', () => {
        const obj = { foo: 'bar' };
        const query = jsonToQuery(obj);
        expect(queryToJson(query)).toEqual(obj);
    });
});
