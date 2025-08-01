/** @jest-environment node */
import { GET as metricsGET, prerender } from '../src/pages/metrics.ts';
import { register } from '../src/utils/metrics.js';

import { describe, it, expect } from 'vitest';

describe('metrics endpoint', () => {
    it('returns prometheus metrics', async () => {
        const res = await metricsGET();
        expect(res.status).toBe(200);
        const text = await res.text();
        expect(text).toContain('# HELP');
        expect(res.headers.get('content-type')).toBe(register.contentType);
    });
    it('is not prerendered', () => {
        expect(prerender).toBe(false);
    });
});
