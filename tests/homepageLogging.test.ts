import { describe, expect, it, vi, afterEach } from 'vitest';
import {
    loadHomepageChangelogs,
    logHomepageError,
} from '../frontend/src/utils/homepageLogging';

const mockRequest = new Request('http://example.test/', { method: 'GET' });
const mockUrl = new URL('http://example.test/');

afterEach(() => {
    vi.restoreAllMocks();
});

describe('loadHomepageChangelogs', () => {
    it('returns entries from the loader when successful', async () => {
        const entries = [{ frontmatter: { title: 'Hello' } }];

        const result = await loadHomepageChangelogs({
            loader: async () => entries,
            request: mockRequest,
            url: mockUrl,
        });

        expect(result).toEqual(entries);
    });

    it('logs a structured error and returns an empty array on failure', async () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

        const result = await loadHomepageChangelogs({
            loader: async () => {
                throw new Error('boom');
            },
            request: mockRequest,
            url: mockUrl,
        });

        expect(result).toEqual([]);
        expect(consoleSpy).toHaveBeenCalledTimes(1);
        const payload = JSON.parse(consoleSpy.mock.calls[0][0]);
        expect(payload).toMatchObject({
            level: 'error',
            route: '/',
            method: 'GET',
            step: 'load-changelogs',
            message: 'boom',
        });
        expect(payload.stack).toBeTruthy();
    });
});

describe('logHomepageError', () => {
    it('serializes unexpected values for logging', () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

        logHomepageError(mockRequest, mockUrl, 'unexpected', { step: 'test' });

        expect(consoleSpy).toHaveBeenCalledTimes(1);
        const payload = JSON.parse(consoleSpy.mock.calls[0][0]);
        expect(payload).toMatchObject({
            level: 'error',
            route: '/',
            method: 'GET',
            step: 'test',
            message: 'unexpected',
        });
        expect(payload.stack ?? undefined).toBeUndefined();
    });
});
