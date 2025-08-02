/** @jest-environment node */
import { GET as healthGET, prerender } from '../src/pages/health.ts';

import { describe, it, expect } from 'vitest';

describe('health endpoint', () => {
    it('returns status ok', async () => {
        const res = await healthGET();
        expect(res.status).toBe(200);
        const body = await res.json();
        expect(body).toEqual({ status: 'ok' });
    });
    it('is not prerendered', () => {
        expect(prerender).toBe(false);
    });
});
