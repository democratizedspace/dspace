// cspell:ignore unstub eventloop

import { afterEach, describe, expect, it, vi } from 'vitest';
import { GET as metricsGET } from '../frontend/src/pages/metrics';

const url = 'http://dspace.local/metrics';

describe('process and runtime metrics', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('serves process and runtime samples to an authenticated caller when configured', async () => {
    vi.stubEnv('METRICS_ENABLED', 'true');
    vi.stubEnv('METRICS_TOKEN', 'metrics-test-token');

    const denied = await metricsGET({ request: new Request(url) });
    expect(denied.status).toBe(401);
    expect(await denied.text()).not.toContain('process_');

    const response = await metricsGET({
      request: new Request(url, {
        headers: { Authorization: 'Bearer metrics-test-token' },
      }),
    });

    expect(response.status).toBe(200);
    const text = await response.text();
    expect(text).not.toContain('metrics-test-token');

    // Assert real samples, not just HELP lines or a successful HTTP status.
    // These samples are emitted without labels supplied by clients.
    for (const name of [
      'process_cpu_seconds_total',
      'process_start_time_seconds',
      'process_resident_memory_bytes',
      'nodejs_heap_size_used_bytes',
      'nodejs_eventloop_lag_seconds',
    ]) {
      const sample = text
        .split('\n')
        .find((line) => line.startsWith(`${name} `));
      expect(sample, name).toBeDefined();
      const value = Number(sample?.slice(name.length + 1));
      expect(Number.isFinite(value), name).toBe(true);
      expect(value, name).toBeGreaterThanOrEqual(0);

      if (name === 'process_start_time_seconds') {
        const expectedStart = Date.now() / 1000 - process.uptime();
        expect(value, name).toBeGreaterThan(0);
        // The default collector rounds its epoch timestamp to seconds.
        expect(Math.abs(value - expectedStart), name).toBeLessThan(5);
      }
    }
  });
});
