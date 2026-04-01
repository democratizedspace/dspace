/** @jest-environment node */
import { GET as readinessGET, prerender as readinessPrerender } from '../src/pages/healthz.ts';
import { GET as livenessGET, prerender as livenessPrerender } from '../src/pages/livez.ts';

import { describe, it, expect } from 'vitest';

describe('health probes', () => {
    it('reports readiness', async () => {
        const res = await readinessGET();
        expect(res.status).toBe(200);
        const body = await res.json();
        expect(body.status).toBe('ready');
        expect(typeof body.timestamp).toBe('string');
        expect(Array.isArray(body.features)).toBe(true);
    });

    it('marks readiness route as dynamic', () => {
        expect(readinessPrerender).toBe(false);
    });

    it('reports liveness', async () => {
        const res = await livenessGET();
        expect(res.status).toBe(200);
        const body = await res.json();
        expect(body.status).toBe('alive');
        expect(typeof body.uptimeSeconds).toBe('number');
    });

    it('marks liveness route as dynamic', () => {
        expect(livenessPrerender).toBe(false);
    });
});
