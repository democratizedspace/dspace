import { describe, expect, it, vi, afterEach } from 'vitest';
import { logRequestError } from '../frontend/src/utils/server-logger.js';

describe('logRequestError', () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('emits structured JSON with route context and stack', () => {
        const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
        const error = new Error('boom');

        logRequestError({
            route: '/',
            method: 'GET',
            message: 'Failed to render homepage',
            error,
            context: { requestId: 'abc-123' },
        });

        expect(spy).toHaveBeenCalledTimes(1);
        const [serialized] = spy.mock.calls[0];
        const payload = JSON.parse(serialized as string);

        expect(payload).toMatchObject({
            level: 'error',
            route: '/',
            method: 'GET',
            message: 'Failed to render homepage',
            stack: error.stack,
            requestId: 'abc-123',
        });
        expect(typeof payload.time).toBe('string');
    });

    it('handles non-Error throwables gracefully', () => {
        const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

        logRequestError({ route: '/', method: 'GET', error: 'plain error' });

        const payload = JSON.parse(spy.mock.calls[0][0] as string);
        expect(payload.message).toBe('plain error');
        expect(payload.stack).toBeUndefined();
    });
});
