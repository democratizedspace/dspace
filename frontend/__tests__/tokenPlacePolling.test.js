import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

vi.mock('../src/utils/gameState/common.js', () => ({
    loadGameState: vi.fn(() => ({})),
    ready: Promise.resolve(),
}));
vi.mock('../src/utils/docsRag.js', () => ({
    searchDocsRag: vi.fn(async () => ({ excerptsText: '', sources: [] })),
}));

const { pollTokenPlaceRelayResponse } = await import('../src/utils/tokenPlace.js');
const { getTokenPlaceErrorSummary } = await import('../src/utils/tokenPlaceErrors.js');
const pending = () => new Promise(() => {});
const body = { client_public_key: 'fixture-client', request_id: 'fixture-request' };
const startPolling = (options = {}) => {
    const observed = { result: undefined, error: undefined };
    pollTokenPlaceRelayResponse('https://relay.invalid', body, {
        timeoutMs: 50,
        pollIntervalMs: 10,
        ...options,
    }).then(
        (result) => {
            observed.result = result;
        },
        (error) => {
            observed.error = error;
        }
    );
    return observed;
};

describe('token.place polling deadlines', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.stubGlobal('fetch', vi.fn());
    });
    afterEach(() => {
        vi.clearAllTimers();
        vi.useRealTimers();
        vi.unstubAllGlobals();
    });

    test('bounds a stalled retrieval fetch and aborts its transport', async () => {
        fetch.mockImplementation(pending);
        const observed = startPolling();
        await vi.advanceTimersByTimeAsync(50);
        expect(observed.error).toMatchObject({ status: 408 });
        expect(fetch.mock.calls[0][1].signal.aborted).toBe(true);
        expect(fetch).toHaveBeenCalledTimes(1);
        expect(vi.getTimerCount()).toBe(0);
    });

    test.each([200, 503])('bounds a stalled HTTP %s response body', async (status) => {
        fetch.mockResolvedValue({ status, ok: status === 200, json: pending });
        const observed = startPolling();
        await vi.advanceTimersByTimeAsync(50);
        expect(observed.error).toMatchObject({ status: 408 });
        expect(fetch.mock.calls[0][1].signal.aborted).toBe(true);
    });

    test('returns the timeout without waiting for stalled best-effort cancellation', async () => {
        fetch.mockImplementation((url) =>
            url.endsWith('/cancel') ? pending() : Promise.resolve({ status: 202, ok: true })
        );
        const observed = startPolling({ cancelToken: 'fixture-cancel' });
        await vi.advanceTimersByTimeAsync(50);
        expect(observed.error).toMatchObject({ status: 408 });
        const cancellation = fetch.mock.calls.find(([url]) => url.endsWith('/cancel'));
        expect(cancellation).toBeDefined();
        expect(JSON.parse(cancellation[1].body)).toEqual({ cancel_token: 'fixture-cancel' });
        await vi.advanceTimersByTimeAsync(1000);
        expect(cancellation[1].signal.aborted).toBe(true);
        expect(vi.getTimerCount()).toBe(0);
    });

    test('preserves caller abort during a stalled retrieval', async () => {
        fetch.mockImplementation(pending);
        const controller = new AbortController();
        const observed = startPolling({ signal: controller.signal });
        await vi.advanceTimersByTimeAsync(0);
        controller.abort();
        await vi.advanceTimersByTimeAsync(0);
        expect(observed.error).toMatchObject({ type: 'abort' });
        expect(getTokenPlaceErrorSummary(observed.error).type).toBe('abort');
        expect(fetch.mock.calls[0][1].signal.aborted).toBe(true);
        expect(vi.getTimerCount()).toBe(0);
    });

    test('does not fetch when the caller already aborted', async () => {
        const controller = new AbortController();
        controller.abort();
        const observed = startPolling({ signal: controller.signal });
        await vi.advanceTimersByTimeAsync(0);
        expect(observed.error).toMatchObject({ type: 'abort' });
        expect(fetch).not.toHaveBeenCalled();
        expect(vi.getTimerCount()).toBe(0);
    });

    test('aborts the polling delay without starting another retrieval', async () => {
        fetch.mockResolvedValue({ status: 202, ok: true });
        const controller = new AbortController();
        const observed = startPolling({ signal: controller.signal, pollIntervalMs: 1000 });
        await vi.advanceTimersByTimeAsync(0);
        controller.abort();
        await vi.advanceTimersByTimeAsync(0);
        expect(observed.error).toMatchObject({ type: 'abort' });
        expect(fetch).toHaveBeenCalledTimes(1);
        expect(vi.getTimerCount()).toBe(0);
    });

    test('clears its deadline and caller listener after a successful response', async () => {
        const response = { ciphertext: 'fixture' };
        fetch.mockResolvedValue({ status: 200, ok: true, json: async () => response });
        const controller = new AbortController();
        const observed = startPolling({ signal: controller.signal });
        await vi.advanceTimersByTimeAsync(0);
        expect(observed.result).toEqual(response);
        expect(vi.getTimerCount()).toBe(0);
        controller.abort();
        expect(fetch.mock.calls[0][1].signal.aborted).toBe(false);
    });
});
