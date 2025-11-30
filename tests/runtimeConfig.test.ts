import { afterEach, beforeEach, describe, expect, it } from 'vitest';

// @ts-expect-error Allow importing the Astro endpoint with its `.ts` extension for testing
import { GET as getRuntimeConfig } from '../frontend/src/pages/config.json.ts';
// @ts-expect-error Allow importing the Astro endpoint with its `.ts` extension for testing
import { GET as getHealthz } from '../frontend/src/pages/healthz.ts';
// @ts-expect-error Allow importing the Astro endpoint with its `.ts` extension for testing
import { GET as getLivez } from '../frontend/src/pages/livez.ts';

const ORIGINAL_FLAGS = process.env.DSPACE_FEATURE_FLAGS;
const ORIGINAL_OFFLINE = process.env.DSPACE_OFFLINE_WORKER_ENABLED;
const ORIGINAL_VERSION = process.env.DSPACE_VERSION;

describe('runtime endpoints', () => {
  beforeEach(() => {
    delete process.env.DSPACE_FEATURE_FLAGS;
    delete process.env.DSPACE_OFFLINE_WORKER_ENABLED;
    delete process.env.DSPACE_VERSION;
  });

  afterEach(() => {
    if (ORIGINAL_FLAGS === undefined) {
      delete process.env.DSPACE_FEATURE_FLAGS;
    } else {
      process.env.DSPACE_FEATURE_FLAGS = ORIGINAL_FLAGS;
    }

    if (ORIGINAL_OFFLINE === undefined) {
      delete process.env.DSPACE_OFFLINE_WORKER_ENABLED;
    } else {
      process.env.DSPACE_OFFLINE_WORKER_ENABLED = ORIGINAL_OFFLINE;
    }

    if (ORIGINAL_VERSION === undefined) {
      delete process.env.DSPACE_VERSION;
    } else {
      process.env.DSPACE_VERSION = ORIGINAL_VERSION;
    }
  });

  it('enables the offline worker by default', async () => {
    const response = await getRuntimeConfig();
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.offlineWorker?.enabled).toBe(true);
  });

  it('disables the offline worker when the flag is set to false', async () => {
    process.env.DSPACE_FEATURE_FLAGS = 'offlineWorker.enabled=false';
    const response = await getRuntimeConfig();
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.offlineWorker?.enabled).toBe(false);
    expect(body.featureFlags).toContain('offlineWorker.enabled=false');
  });

  it('honors the explicit offline worker env override', async () => {
    process.env.DSPACE_OFFLINE_WORKER_ENABLED = '0';
    const response = await getRuntimeConfig();
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.offlineWorker?.enabled).toBe(false);
  });

  it('marks runtime config responses as non-cacheable', async () => {
    const response = await getRuntimeConfig();
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(response.headers.get('content-type')).toContain('application/json');
  });

  it('returns ok health and liveness payloads', async () => {
    process.env.DSPACE_VERSION = 'test-version';

    const healthResponse = await getHealthz();
    const liveResponse = await getLivez();

    for (const res of [healthResponse, liveResponse]) {
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.status === 'ready' || body.status === 'alive').toBe(true);
      expect(body.uptimeSeconds).toBeGreaterThanOrEqual(0);
      expect(body.version).toBe('test-version');
      expect(body.features).toStrictEqual([]);
    }
  });
});
