import { describe, expect, it } from 'vitest';

// @ts-expect-error astro endpoint import
import { GET as getHealthz } from '../frontend/src/pages/healthz.ts';
// @ts-expect-error astro endpoint import
import { GET as getLivez } from '../frontend/src/pages/livez.ts';

const expectJsonResponse = async (response: Response) => {
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toMatch(/application\/json/);
    expect(response.headers.get('cache-control')).toBe('no-store');
    const body = await response.json();
    expect(body.status).toBe('ok');
    expect(typeof body.uptimeSeconds).toBe('number');
    expect(body.uptimeSeconds).toBeGreaterThanOrEqual(0);
    expect(body.startedAt).toBeTypeOf('string');
};

describe('health endpoints', () => {
    it('healthz returns readiness payload', async () => {
        const response = await getHealthz();
        await expectJsonResponse(response);
    });

    it('livez returns liveness payload', async () => {
        const response = await getLivez();
        await expectJsonResponse(response);
    });
});
