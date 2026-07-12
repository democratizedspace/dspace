import { describe, it, expect } from 'vitest';

describe('metrics util', () => {
  it('uses an explicit failure contract when prom-client is missing', async () => {
    const mod = await import('../frontend/src/utils/metrics.js');
    await mod.initMetrics(() => {
      throw new Error('module not found');
    });
    expect(mod.isMetricsReady()).toBe(false);
    expect(mod.register.contentType).toContain('text/plain');
    await expect(mod.register.metrics()).rejects.toThrow('metrics unavailable');
    await mod.initMetrics();
  });
});
