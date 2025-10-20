/** @jest-environment node */
import { GET as healthGET, prerender as healthPrerender } from '../src/pages/health.ts';
import { GET as readinessGET } from '../src/pages/healthz.ts';
import { GET as livenessGET } from '../src/pages/livez.ts';

import { describe, it, expect } from 'vitest';

describe('health endpoint', () => {
    it('returns status ok', async () => {
        const res = await healthGET();
        expect(res.status).toBe(200);
        const body = await res.json();
        expect(body.status).toBe('ok');
        expect(typeof body.timestamp).toBe('string');
        expect(typeof body.uptimeSeconds).toBe('number');
    });
    it('is not prerendered', () => {
        expect(healthPrerender).toBe(false);
    });
    it('exposes readiness endpoint', async () => {
        const res = await readinessGET();
        expect(res.status).toBe(200);
        const body = await res.json();
        expect(body.status).toBe('ok');
    });
    it('exposes liveness endpoint', async () => {
        const res = await livenessGET();
        expect(res.status).toBe(200);
        const body = await res.json();
        expect(body.status).toBe('ok');
    });
});
