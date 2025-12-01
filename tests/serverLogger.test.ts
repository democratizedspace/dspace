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
            context: { status: 500 },
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

    it('falls back to unknown error when error is null', () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

        logServerError({ route: '/', method: 'POST', error: null });

        const payload = JSON.parse(consoleSpy.mock.calls[0][0]);
        expect(payload.message).toBe('Unknown error');
    });

    it('falls back to unknown error when error is undefined', () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

        logServerError({ route: '/', method: 'POST', error: undefined });

        const payload = JSON.parse(consoleSpy.mock.calls[0][0]);
        expect(payload.message).toBe('Unknown error');
    });

    it('redacts sensitive keys when serializing objects', () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        const errorObject = { message: 'boom', password: 'secret-token', status: 500 };

        logServerError({ route: '/', method: 'POST', error: errorObject });

        const payload = JSON.parse(consoleSpy.mock.calls[0][0]);
        expect(payload.message).toContain('boom');
        expect(payload.message).not.toContain('secret-token');
    });

    it('handles unserializable objects gracefully', () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        const errorObject = {
            message: 'boom',
            code: 'E_BAD',
            toJSON() {
                throw new Error('nope');
            },
        };

        logServerError({ route: '/', method: 'POST', error: errorObject });

        const payload = JSON.parse(consoleSpy.mock.calls[0][0]);
        expect(payload.message).toContain('boom');
    });
});
