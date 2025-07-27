/** @jest-environment node */
import { GET as metricsGET } from '../src/pages/metrics.ts';

import { describe, it, expect } from '@jest/globals';

describe('metrics endpoint', () => {
    it('returns prometheus metrics', async () => {
        const res = await metricsGET();
        expect(res.status).toBe(200);
        const text = await res.text();
        expect(text).toContain('# HELP');
    });
});
