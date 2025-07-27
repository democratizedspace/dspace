/**
 * @jest-environment jsdom
 */
import { submitQuestPR } from '../src/utils/submitQuestPR.js';

describe('submitQuestPR', () => {
    beforeEach(() => {
        global.fetch = jest.fn();
    });

    it('calls GitHub APIs with auth header and returns PR url', async () => {
        global.fetch
            .mockResolvedValueOnce({ ok: true, text: () => '', json: () => ({}) })
            .mockResolvedValueOnce({ ok: true, json: () => ({ html_url: 'http://pr' }) });
        const url = await submitQuestPR('ghp_123', '', '{"a":1}');
        expect(global.fetch).toHaveBeenCalledTimes(2);
        const [firstCall] = global.fetch.mock.calls;
        expect(firstCall[1].headers.Authorization).toBe('token ghp_123');
        expect(url).toBe('http://pr');
    });

    it('throws when API returns error', async () => {
        global.fetch.mockResolvedValueOnce({ ok: false, text: () => 'err' });
        await expect(submitQuestPR('t', '', '{}')).rejects.toThrow('err');
    });
});
