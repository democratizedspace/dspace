import { GET as metricsGET, prerender } from '../frontend/src/pages/metrics';
import { register } from '../frontend/src/utils/metrics.js';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

const url = 'http://dspace.local/metrics';

describe('metrics endpoint', () => {
    beforeEach(() => {
        delete process.env.METRICS_TOKEN;
    });

    it('returns metrics without auth when no token is set', async () => {
        const res = await metricsGET({ request: new Request(url) });
        expect(res.status).toBe(200);
        const text = await res.text();
        expect(text).toContain('# HELP');
        expect(res.headers.get('content-type')).toBe(register.contentType);
    });

    it('requires bearer token when METRICS_TOKEN is set', async () => {
        process.env.METRICS_TOKEN = 'secret';

        const unauthorized = await metricsGET({ request: new Request(url) });
        expect(unauthorized.status).toBe(401);

        const authorized = await metricsGET({
            request: new Request(url, {
                headers: { Authorization: 'Bearer secret' },
            }),
        });
        expect(authorized.status).toBe(200);
    });

    afterEach(() => {
        delete process.env.METRICS_TOKEN;
    });

    it('is not prerendered', () => {
        expect(prerender).toBe(false);
    });
});
