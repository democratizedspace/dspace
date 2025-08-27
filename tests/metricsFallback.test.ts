import { describe, it, expect } from 'vitest';

describe('metrics util', () => {
    it('falls back when prom-client is missing', async () => {
        const mod = await import('../frontend/src/utils/metrics.js');
        await mod.initMetrics(() => {
            throw new Error('module not found');
        });
        expect(mod.register.contentType).toBe('text/plain');
        const metrics = await mod.register.metrics();
        expect(metrics).toContain('metrics unavailable');
    });
});
