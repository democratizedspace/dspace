/**
 * @jest-environment jsdom
 */
import { submitProcessPR } from '../src/utils/submitProcessPR.js';

describe('submitProcessPR', () => {
    beforeEach(() => {
        global.fetch = jest.fn();
    });

    it('calls GitHub APIs with auth header and returns PR url', async () => {
        global.fetch
            .mockResolvedValueOnce({ ok: true, text: () => '', json: () => ({}) })
            .mockResolvedValueOnce({ ok: true, json: () => ({ html_url: 'http://pr' }) });
        const url = await submitProcessPR('ghp_123', '', '{"name":"test-process"}');
        expect(global.fetch).toHaveBeenCalledTimes(2);
        const [firstCall] = global.fetch.mock.calls;
        expect(firstCall[1].headers.Authorization).toBe('token ghp_123');
        expect(url).toBe('http://pr');
    });

    it('throws when API returns error', async () => {
        global.fetch.mockResolvedValueOnce({ ok: false, text: () => 'err' });
        await expect(submitProcessPR('t', '', '{}')).rejects.toThrow('err');
    });

    it('uses default branch name when not provided', async () => {
        global.fetch
            .mockResolvedValueOnce({ ok: true, text: () => '', json: () => ({}) })
            .mockResolvedValueOnce({ ok: true, json: () => ({ html_url: 'http://pr' }) });
        await submitProcessPR('ghp_123', '', '{"name":"test"}');
        const [firstCall] = global.fetch.mock.calls;
        expect(firstCall[0]).toMatch(/submissions\/processes\/process-\d+\.json/);
    });
});
