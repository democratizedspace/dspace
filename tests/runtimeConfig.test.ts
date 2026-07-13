import { createHmac } from 'node:crypto';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { GET as getRuntimeConfig } from '../frontend/src/pages/config.json.ts';
import { GET as getHealthz } from '../frontend/src/pages/healthz.ts';
import { GET as getLivez } from '../frontend/src/pages/livez.ts';
import {
  createChatProxySessionCookie,
  verifyChatProxySessionCookie,
} from '../frontend/src/utils/runtimeEndpoints.ts';

const ORIGINAL_FLAGS = process.env.DSPACE_FEATURE_FLAGS;
const ORIGINAL_OFFLINE = process.env.DSPACE_OFFLINE_WORKER_ENABLED;
const ORIGINAL_TELEMETRY = process.env.DSPACE_TELEMETRY_ENABLED;
const ORIGINAL_VERSION = process.env.DSPACE_VERSION;
const ORIGINAL_TOKEN_PLACE_URL = process.env.DSPACE_TOKEN_PLACE_URL;
const ORIGINAL_TOKEN_PLACE_MODEL = process.env.DSPACE_TOKEN_PLACE_CHAT_MODEL;
const ORIGINAL_CHAT_PROXY_CREDENTIAL = process.env['DSPACE_CHAT_PROXY_TOKEN']; // scan-secrets: ignore
const ORIGINAL_RATE_LIMIT_URL = process.env.DSPACE_CHAT_PROXY_RATE_LIMIT_REDIS_URL;
const ORIGINAL_RATE_LIMIT_CREDENTIAL =
  process.env['DSPACE_CHAT_PROXY_RATE_LIMIT_REDIS_TOKEN']; // scan-secrets: ignore
const ORIGINAL_CHAT_PROXY_PUBLIC_ACCESS = process.env.DSPACE_CHAT_PROXY_PUBLIC_ACCESS;
const ORIGINAL_CHAT_PROXY_AUTHORIZATION_VALUE = process.env['DSPACE_CHAT_PROXY_' + 'AUTHORIZATION_TOKEN']; // scan-secrets: ignore

describe('runtime endpoints', () => {
  beforeEach(() => {
    delete process.env.DSPACE_FEATURE_FLAGS;
    delete process.env.DSPACE_OFFLINE_WORKER_ENABLED;
    delete process.env.DSPACE_TELEMETRY_ENABLED;
    delete process.env.DSPACE_VERSION;
    delete process.env.DSPACE_TOKEN_PLACE_URL;
    delete process.env.DSPACE_TOKEN_PLACE_CHAT_MODEL;
    delete process.env['DSPACE_CHAT_PROXY_TOKEN'];
    delete process.env.DSPACE_CHAT_PROXY_RATE_LIMIT_REDIS_URL;
    delete process.env['DSPACE_CHAT_PROXY_RATE_LIMIT_REDIS_TOKEN'];
    delete process.env.DSPACE_CHAT_PROXY_PUBLIC_ACCESS;
    delete process.env['DSPACE_CHAT_PROXY_' + 'AUTHORIZATION_TOKEN'];
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

    if (ORIGINAL_TELEMETRY === undefined) {
      delete process.env.DSPACE_TELEMETRY_ENABLED;
    } else {
      process.env.DSPACE_TELEMETRY_ENABLED = ORIGINAL_TELEMETRY;
    }

    if (ORIGINAL_VERSION === undefined) {
      delete process.env.DSPACE_VERSION;
    } else {
      process.env.DSPACE_VERSION = ORIGINAL_VERSION;
    }

    if (ORIGINAL_TOKEN_PLACE_URL === undefined) {
      delete process.env.DSPACE_TOKEN_PLACE_URL;
    } else {
      process.env.DSPACE_TOKEN_PLACE_URL = ORIGINAL_TOKEN_PLACE_URL;
    }

    if (ORIGINAL_TOKEN_PLACE_MODEL === undefined) {
      delete process.env.DSPACE_TOKEN_PLACE_CHAT_MODEL;
    } else {
      process.env.DSPACE_TOKEN_PLACE_CHAT_MODEL = ORIGINAL_TOKEN_PLACE_MODEL;
    }

    if (ORIGINAL_CHAT_PROXY_CREDENTIAL === undefined) {
      delete process.env['DSPACE_CHAT_PROXY_TOKEN'];
    } else {
      process.env['DSPACE_CHAT_PROXY_TOKEN'] = ORIGINAL_CHAT_PROXY_CREDENTIAL;
    }

    if (ORIGINAL_RATE_LIMIT_URL === undefined) {
      delete process.env.DSPACE_CHAT_PROXY_RATE_LIMIT_REDIS_URL;
    } else {
      process.env.DSPACE_CHAT_PROXY_RATE_LIMIT_REDIS_URL = ORIGINAL_RATE_LIMIT_URL;
    }

    if (ORIGINAL_RATE_LIMIT_CREDENTIAL === undefined) {
      delete process.env['DSPACE_CHAT_PROXY_RATE_LIMIT_REDIS_TOKEN'];
    delete process.env.DSPACE_CHAT_PROXY_PUBLIC_ACCESS;
    } else {
      process.env['DSPACE_CHAT_PROXY_RATE_LIMIT_REDIS_TOKEN'] = ORIGINAL_RATE_LIMIT_CREDENTIAL;
    }
  });

  it('exposes production token.place defaults when runtime env is absent', async () => {
    const response = await getRuntimeConfig();
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.tokenPlace).toStrictEqual({
      url: 'https://token.place',
      model: 'llama-3.1-8b-instruct',
      relayProxyAvailable: false,
    });
  });


  it('only advertises chat relay proxy when the complete shared boundary is configured', async () => {
    process.env['DSPACE_CHAT_PROXY_TOKEN'] = 'test-chat-proxy-token'; // scan-secrets: ignore

    let response = await getRuntimeConfig();
    let body = await response.json();
    expect(body.tokenPlace.relayProxyAvailable).toBe(false);

    process.env.DSPACE_CHAT_PROXY_RATE_LIMIT_REDIS_URL = 'https://redis.example.test';
    process.env['DSPACE_CHAT_PROXY_RATE_LIMIT_REDIS_TOKEN'] = 'test-rate-limit-token'; // scan-secrets: ignore

    response = await getRuntimeConfig();
    body = await response.json();
    expect(body.tokenPlace.relayProxyAvailable).toBe(false);

    process.env.DSPACE_CHAT_PROXY_PUBLIC_ACCESS = 'true';
    response = await getRuntimeConfig();
    body = await response.json();
    expect(body.tokenPlace.relayProxyAvailable).toBe(false);

    process.env['DSPACE_CHAT_PROXY_' + 'AUTHORIZATION_TOKEN'] = 'authorized-test-user'; // scan-secrets: ignore
    response = await getRuntimeConfig();
    body = await response.json();
    expect(body.tokenPlace.relayProxyAvailable).toBe(true);
  });


  it('parses chat proxy sessions with the fixed identity and nonce format', () => {
    process.env['DSPACE_CHAT_PROXY_TOKEN'] = 'test-chat-proxy-token'; // scan-secrets: ignore
    process.env.DSPACE_CHAT_PROXY_RATE_LIMIT_REDIS_URL = 'https://redis.example.test';
    process.env['DSPACE_CHAT_PROXY_RATE_LIMIT_REDIS_TOKEN'] = 'test-rate-limit-token'; // scan-secrets: ignore
    process.env.DSPACE_CHAT_PROXY_PUBLIC_ACCESS = 'true';
    process.env['DSPACE_CHAT_PROXY_' + 'AUTHORIZATION_TOKEN'] = 'authorized-test-user'; // scan-secrets: ignore

    const identity = 'abc_defghiJKLMN01234_X';
    expect(identity).toHaveLength(22);

    const cookie = createChatProxySessionCookie(identity, 1_700_000_000_000);
    expect(cookie).toMatch(/^[A-Za-z0-9_-]{22}_[A-Za-z0-9_-]{22}\.[0-9]+\.[A-Za-z0-9_-]+$/);
    expect(verifyChatProxySessionCookie(cookie, 1_700_000_001_000)).toBe(identity);
  });

  it('rejects legacy anonymous chat proxy session IDs', () => {
    process.env['DSPACE_CHAT_PROXY_TOKEN'] = 'test-chat-proxy-token'; // scan-secrets: ignore
    process.env.DSPACE_CHAT_PROXY_RATE_LIMIT_REDIS_URL = 'https://redis.example.test';
    process.env['DSPACE_CHAT_PROXY_RATE_LIMIT_REDIS_TOKEN'] = 'test-rate-limit-token'; // scan-secrets: ignore
    process.env.DSPACE_CHAT_PROXY_PUBLIC_ACCESS = 'true';
    process.env['DSPACE_CHAT_PROXY_' + 'AUTHORIZATION_TOKEN'] = 'authorized-test-user'; // scan-secrets: ignore

    const legacyId = 'abcdefghijklmnopqrstuv';
    const expiresAt = Math.floor(1_700_000_000_000 / 1000) + 60 * 60;
    const signature = createHmac('sha256', process.env['DSPACE_CHAT_PROXY_TOKEN'] || '')
      .update(`${legacyId}.${expiresAt}`)
      .digest('base64url');

    expect(
      verifyChatProxySessionCookie(`${legacyId}.${expiresAt}.${signature}`, 1_700_000_001_000)
    ).toBeNull();
  });

  it('exposes normalized runtime token.place URL and model overrides', async () => {
    process.env.DSPACE_TOKEN_PLACE_URL = 'https://staging.token.place/api/v1/';
    process.env.DSPACE_TOKEN_PLACE_CHAT_MODEL = 'staging-chat-model';

    const response = await getRuntimeConfig();
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.tokenPlace).toStrictEqual({
      url: 'https://staging.token.place',
      model: 'staging-chat-model',
      relayProxyAvailable: false,
    });
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

  it('disables telemetry collection by default', async () => {
    const response = await getRuntimeConfig();
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.telemetry?.enabled).toBe(false);
  });

  it('enables telemetry when the feature flag is opted in', async () => {
    process.env.DSPACE_FEATURE_FLAGS = 'telemetry.enabled=true';
    const response = await getRuntimeConfig();
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.telemetry?.enabled).toBe(true);
    expect(body.featureFlags).toContain('telemetry.enabled=true');
  });

  it('disables telemetry when the feature flag is explicitly opted out', async () => {
    process.env.DSPACE_FEATURE_FLAGS = 'telemetry.enabled=false';
    const response = await getRuntimeConfig();
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.telemetry?.enabled).toBe(false);
    expect(body.featureFlags).toContain('telemetry.enabled=false');
  });

  it('honors the explicit telemetry env override', async () => {
    process.env.DSPACE_TELEMETRY_ENABLED = '1';
    const response = await getRuntimeConfig();
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.telemetry?.enabled).toBe(true);
  });

  it('prefers the telemetry env override over the feature flag', async () => {
    process.env.DSPACE_FEATURE_FLAGS = 'telemetry.enabled=true';
    process.env.DSPACE_TELEMETRY_ENABLED = '0';
    const response = await getRuntimeConfig();
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.telemetry?.enabled).toBe(false);
    expect(body.featureFlags).toContain('telemetry.enabled=true');
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
