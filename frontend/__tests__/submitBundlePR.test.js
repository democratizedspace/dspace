/**
 * @jest-environment jsdom
 */
import { submitBundlePR } from '../src/utils/submitBundlePR.js';

describe('submitBundlePR', () => {
    beforeEach(() => {
        global.fetch = jest.fn();
    });

    it('calls GitHub APIs with auth header and returns PR url', async () => {
        global.fetch
            .mockResolvedValueOnce({ ok: true, text: () => '', json: () => ({}) })
            .mockResolvedValueOnce({ ok: true, json: () => ({ html_url: 'http://pr' }) });
        const bundleJson = JSON.stringify({
            quests: [{ id: 'q1', title: 'Test Quest' }],
            items: [{ id: 1, name: 'Test Item' }],
            processes: [],
        });
        const url = await submitBundlePR('ghp_123', '', bundleJson);
        expect(global.fetch).toHaveBeenCalledTimes(2);
        const [firstCall] = global.fetch.mock.calls;
        expect(firstCall[1].headers.Authorization).toBe('token ghp_123');
        expect(url).toBe('http://pr');
    });

    it('throws when API returns error', async () => {
        global.fetch.mockResolvedValueOnce({ ok: false, text: () => 'err' });
        await expect(submitBundlePR('t', '', '{}')).rejects.toThrow('err');
    });

    it('uses default branch name when not provided', async () => {
        global.fetch
            .mockResolvedValueOnce({ ok: true, text: () => '', json: () => ({}) })
            .mockResolvedValueOnce({ ok: true, json: () => ({ html_url: 'http://pr' }) });
        const bundleJson = JSON.stringify({ quests: [], items: [], processes: [] });
        await submitBundlePR('ghp_123', '', bundleJson);
        const [firstCall] = global.fetch.mock.calls;
        expect(firstCall[0]).toMatch(/submissions\/bundles\/bundle-\d+\.json/);
    });

    it('submits bundle to bundles directory', async () => {
        global.fetch
            .mockResolvedValueOnce({ ok: true, text: () => '', json: () => ({}) })
            .mockResolvedValueOnce({ ok: true, json: () => ({ html_url: 'http://pr' }) });
        const bundleJson = JSON.stringify({ quests: [], items: [], processes: [] });
        await submitBundlePR('ghp_123', 'my-bundle', bundleJson);
        const [firstCall] = global.fetch.mock.calls;
        expect(firstCall[0]).toContain('submissions/bundles/my-bundle.json');
    });
});
