import { afterEach, describe, expect, it, vi } from 'vitest';
import { logServerError } from '../frontend/src/utils/serverLogger';

afterEach(() => {
    vi.restoreAllMocks();
});

describe('logServerError', () => {
    it('logs structured errors with stack traces', () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        const testError = new Error('boom');

        logServerError({
            route: '/',
            method: 'GET',
            message: 'Should be replaced by error message',
            error: testError,
            context: { status: 500 },
        });

        expect(consoleSpy).toHaveBeenCalledTimes(1);
        const payload = JSON.parse(consoleSpy.mock.calls[0][0]);
        expect(payload).toMatchObject({
            level: 'error',
            route: '/',
            method: 'GET',
            message: 'boom',
            status: 500,
        });
        expect(payload.stack).toContain('Error: boom');
    });

    it('logs string errors without throwing', () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

        logServerError({ route: '/', method: 'POST', error: 'string error' });

        expect(consoleSpy).toHaveBeenCalledTimes(1);
        const payload = JSON.parse(consoleSpy.mock.calls[0][0]);
        expect(payload).toMatchObject({
            level: 'error',
            route: '/',
            method: 'POST',
            message: 'string error',
        });
        expect(payload.stack).toBeUndefined();
    });
});
