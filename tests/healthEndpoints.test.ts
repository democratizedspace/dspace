import { describe, expect, it } from 'vitest';

// @ts-expect-error Allow direct import of Astro endpoint modules
import { GET as healthzGET } from '../frontend/src/pages/healthz.ts';
// @ts-expect-error Allow direct import of Astro endpoint modules
import { GET as livezGET } from '../frontend/src/pages/livez.ts';

const parseJson = async (response: Response) => ({
    status: response.status,
    body: await response.json(),
    headers: response.headers,
});

describe('health endpoints', () => {
    it('returns ok status for /healthz', async () => {
        const { status, body, headers } = await parseJson(await healthzGET());

        expect(status).toBe(200);
        expect(body.status).toBe('ok');
        expect(typeof body.uptimeSeconds).toBe('number');
        expect(headers.get('cache-control')).toBe('no-store');
    });

    it('returns ok status for /livez', async () => {
        const { status, body } = await parseJson(await livezGET());

        expect(status).toBe(200);
        expect(body.status).toBe('ok');
    });
});
