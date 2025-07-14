const {
    parseCookie,
    getCookieValue,
    getCookie,
    setCookieValue,
    deleteCookie,
    hasAcceptedCookies,
    getCookies,
    getCookieItems,
    prettyPrintDuration,
    durationInSeconds,
    formatNumberK,
    getPriceString,
    formatTime,
    getRelativeTimeString,
    getWalletBalance,
    burnCurrency,
    addWalletBalance,
    getSymbolFromId,
    filterQuests,
    truncateString,
    arrayBufferToBase64,
    getFileAsBase64,
} = require('../src/utils.js');

describe('additional coverage for utils.js', () => {
    test('parseCookie returns empty object on invalid input', () => {
        expect(parseCookie(null)).toEqual({});
    });

    test('getCookieValue returns null when missing', () => {
        expect(getCookieValue('foo=bar', 'baz')).toBeNull();
        const utils = require('../src/utils.js');
        const spy = jest.spyOn(utils, 'parseCookie').mockReturnValue(null);
        expect(getCookieValue('ignored', 'a')).toBeNull();
        spy.mockRestore();
    });

    test('getCookie reads from headers', () => {
        const req = { headers: { get: jest.fn(() => 'a=1') } };
        expect(getCookie(req, 'a')).toBe('1');
        expect(req.headers.get).toHaveBeenCalledWith('cookie');
    });

    test('setCookieValue and deleteCookie modify headers', () => {
        const res = { headers: { append: jest.fn() } };
        setCookieValue(res, 'foo', 'bar');
        deleteCookie(res, 'foo');
        expect(res.headers.append).toHaveBeenCalledWith(
            'Set-Cookie',
            'foo=bar; expires=Fri, 31 Dec 9999 23:59:59 GMT; path=/'
        );
        expect(res.headers.append).toHaveBeenCalledWith(
            'Set-Cookie',
            'foo=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/'
        );
    });

    test('hasAcceptedCookies parses cookie flag', () => {
        const reqTrue = { headers: { get: () => 'acceptedCookies=true' } };
        expect(hasAcceptedCookies(reqTrue)).toBe(true);
        const reqFalse = { headers: { get: () => '' } };
        expect(hasAcceptedCookies(reqFalse)).toBe(false);
    });

    test('getCookies and getCookieItems parse cookies', () => {
        const str = 'foo=bar; item-1=2; item-2=0';
        expect(getCookies(str)).toEqual([
            { key: 'foo', value: 'bar' },
            { key: 'item-1', value: '2' },
            { key: 'item-2', value: '0' },
        ]);
        expect(getCookieItems(str)).toEqual([{ id: '1', count: 2 }]);
    });

    test('prettyPrintDuration handles fractions and days', () => {
        expect(prettyPrintDuration(90061)).toBe('1d 1h 1m 1s');
        expect(prettyPrintDuration(0.5)).toBe('0.5s');
    });

    test('durationInSeconds returns 0 on invalid input', () => {
        expect(durationInSeconds('abc')).toBe(0);
        expect(durationInSeconds(null)).toBe(0);
        expect(durationInSeconds('1x')).toBe(0);
    });

    test('formatTime returns structured parts', () => {
        jest.useFakeTimers();
        const date = new Date('2023-01-01T13:05:09Z');
        jest.setSystemTime(date);
        const result = formatTime(date);
        const resultDefault = formatTime();
        expect(result.iso).toBe('2023-01-01T13:05:09.000Z');
        expect(result.dateOnly).toBe('1/1/2023');
        expect(result.timeOnly).toBe('1:05:09 PM');
        expect(resultDefault.iso).toBe('2023-01-01T13:05:09.000Z');
        jest.useRealTimers();
    });

    test('getRelativeTimeString returns just now', () => {
        jest.useFakeTimers();
        const now = new Date('2023-01-01T00:00:00Z');
        jest.setSystemTime(now);
        expect(getRelativeTimeString(now)).toBe('just now');
        jest.useRealTimers();
    });

    test('filterQuests default returns all quests', () => {
        const quests = [{ id: '1' }, { id: '2' }];
        expect(filterQuests(quests)).toEqual(quests);
    });

    test('formatNumberK and getPriceString handle large numbers', () => {
        expect(formatNumberK(1e9)).toBe('1B');
        expect(formatNumberK(1e12)).toBe('1T');
        expect(getPriceString('10 dUSD')).toBe('dUSD10');
    });

    test('truncateString handles edge cases', () => {
        expect(truncateString('abc', 5)).toBe('abc');
        expect(truncateString('abcdef', 5, false)).toBe('abcd&hellip;');
        expect(truncateString('', 3)).toBe('');
    });

    test('arrayBufferToBase64 converts buffer', () => {
        const buf = new Uint8Array([72, 101, 108, 108, 111]).buffer;
        expect(arrayBufferToBase64(buf)).toBe('SGVsbG8=');
    });

    test('wallet and symbol helpers cover edge cases', () => {
        const req = { headers: { get: () => '' } };
        const res = { headers: { append: jest.fn() } };
        expect(getWalletBalance(req, 'dUSD')).toBe(0);
        expect(burnCurrency(req, res, 'dUSD', 1)).toBe(false);
        expect(addWalletBalance(req, res, 'dUSD', 1)).toBe(1);
        expect(getSymbolFromId('999')).toBeUndefined();
    });

    test('getFileAsBase64 returns encoded string', async () => {
        const mockReader = {
            onloadend: null,
            readAsDataURL: function () {
                this.result = 'data:;base64,aGVsbG8=';
                this.onloadend();
            },
        };
        global.FileReader = function () {
            return mockReader;
        };
        global.fetch = jest.fn(() =>
            Promise.resolve({ blob: () => Promise.resolve(new Blob(['hello'])) })
        );
        const result = await getFileAsBase64('/file');
        expect(result).toBe('data:;base64,aGVsbG8=');
        global.fetch = jest.fn(() => Promise.reject(new Error('fail')));
        expect(await getFileAsBase64('/file')).toBe('');
        expect(await getFileAsBase64('')).toBe('');
        global.fetch = jest.fn(() =>
            Promise.resolve({ blob: () => Promise.resolve(new Blob(['hi'])) })
        );
        global.FileReader = function () {
            throw new Error('reader fail');
        };
        await expect(getFileAsBase64('/file')).rejects.toThrow('reader fail');
    });
});
