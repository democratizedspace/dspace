const { jest } = require('@jest/globals');

jest.mock('../src/utils/gameState/common.js', () => ({
    loadGameState: jest.fn(() => ({ tokenPlace: { url: 'http://token.place' } })),
}));

const { tokenPlaceChat } = require('../src/utils/tokenPlace.js');

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
    });

    test('prepends system message and returns response', async () => {
        const result = await tokenPlaceChat([{ role: 'user', content: 'hello' }]);
        expect(fetch).toHaveBeenCalledTimes(1);
        const body = JSON.parse(fetch.mock.calls[0][1].body);
        expect(body.messages[0].role).toBe('system');
        expect(result).toBe('mocked reply');
    });
});
