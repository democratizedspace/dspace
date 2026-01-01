const { vi } = require('vitest');
const jest = vi;

jest.mock('../src/utils/gameState/common.js', () => ({
    loadGameState: jest.fn(),
    ready: Promise.resolve(),
}));

const { tokenPlaceChat, isTokenPlaceEnabled } = require('../src/utils/tokenPlace.js');
const { loadGameState } = require('../src/utils/gameState/common.js');

describe('tokenPlaceChat', () => {
    beforeEach(() => {
        global.fetch = jest.fn(() =>
            Promise.resolve({
                ok: true,
                json: () => Promise.resolve({ reply: 'mocked reply' }),
            })
        );
    });

    afterEach(() => {
        jest.resetAllMocks();
        delete process.env.VITE_TOKEN_PLACE_URL;
        delete process.env.VITE_TOKEN_PLACE_ENABLED;
    });

    test('uses game state url when configured', async () => {
        loadGameState.mockReturnValue({ tokenPlace: { url: 'http://token.place' } });
        await tokenPlaceChat([{ role: 'user', content: 'hello' }]);
        expect(fetch).toHaveBeenCalledWith('http://token.place/chat', expect.any(Object));
    });

    test('falls back to env url when game state missing', async () => {
        loadGameState.mockReturnValue({});
        process.env.VITE_TOKEN_PLACE_URL = 'http://env.token';
        await tokenPlaceChat([]);
        expect(fetch).toHaveBeenCalledWith('http://env.token/chat', expect.any(Object));
    });

    test('prepends system message and returns response', async () => {
        loadGameState.mockReturnValue({ tokenPlace: { url: 'http://token.place' } });
        const result = await tokenPlaceChat([{ role: 'user', content: 'hello' }]);
        const body = JSON.parse(fetch.mock.calls[0][1].body);
        expect(body.messages[0].role).toBe('system');
        expect(result).toBe('mocked reply');
    });

    test('passes abort signal to fetch', async () => {
        loadGameState.mockReturnValue({});
        const controller = new AbortController();
        await tokenPlaceChat([], { signal: controller.signal });
        expect(fetch.mock.calls[0][1].signal).toBe(controller.signal);
    });

    test('throws helpful error when request fails', async () => {
        loadGameState.mockReturnValue({});
        fetch.mockResolvedValueOnce({
            ok: false,
            json: () => Promise.resolve({ error: 'bad request' }),
        });
        await expect(tokenPlaceChat([])).rejects.toThrow(
            'token.place API request failed: bad request'
        );
    });

    test('throws when disabled by default', async () => {
        loadGameState.mockReturnValue({});
        await expect(tokenPlaceChat([])).rejects.toThrow('token.place is disabled');
    });

    test('uses default url when explicitly enabled without overrides', async () => {
        loadGameState.mockReturnValue({});
        process.env.VITE_TOKEN_PLACE_ENABLED = 'true';
        await tokenPlaceChat([]);
        expect(fetch).toHaveBeenCalledWith('https://token.place/api/chat', expect.any(Object));
    });
});

describe('isTokenPlaceEnabled', () => {
    afterEach(() => {
        delete process.env.VITE_TOKEN_PLACE_URL;
        delete process.env.VITE_TOKEN_PLACE_ENABLED;
    });

    test('is false when no overrides are set', () => {
        expect(isTokenPlaceEnabled({ state: {} })).toBe(false);
    });

    test('is true when tokenPlace url exists in state', () => {
        expect(isTokenPlaceEnabled({ state: { tokenPlace: { url: 'http://tp' } } })).toBe(true);
    });

    test('is true when env url is set', () => {
        process.env.VITE_TOKEN_PLACE_URL = 'http://tp';
        expect(isTokenPlaceEnabled({ state: {} })).toBe(true);
    });

    test('respects explicit env disable', () => {
        process.env.VITE_TOKEN_PLACE_URL = 'http://tp';
        process.env.VITE_TOKEN_PLACE_ENABLED = 'false';
        expect(isTokenPlaceEnabled({ state: {} })).toBe(false);
    });
});
