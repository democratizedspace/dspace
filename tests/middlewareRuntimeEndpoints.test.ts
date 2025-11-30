import { describe, expect, it } from 'vitest';
import type { APIContext } from 'astro';

import { onRequest } from '../frontend/src/middleware';

function createContext(pathname: string): APIContext {
  return {
    request: new Request(`http://localhost${pathname}`),
  } as unknown as APIContext;
}

describe('runtime middleware fallback', () => {
  it('falls back to shared handlers when a route is missing', async () => {
    const context = createContext('/config.json');
    const response = await onRequest(context, async () => new Response(null, { status: 404 }));

    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('no-store');
    const body = await response.json();
    expect(body.offlineWorker?.enabled).toBe(true);
  });

  it('passes through to existing routes when they respond', async () => {
    const context = createContext('/healthz');
    const upstream = new Response('page-route');
    const response = await onRequest(context, async () => upstream);

    expect(response).toBe(upstream);
  });

  it('handles the /health alias when missing from the build', async () => {
    const context = createContext('/health');
    const response = await onRequest(context, async () => new Response(null, { status: 404 }));

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.status).toBe('ready');
  });

  it('ignores unrelated paths', async () => {
    const context = createContext('/unrelated');
    const response = await onRequest(context, async () => new Response('ok', { status: 200 }));

    expect(response.status).toBe(200);
    expect(await response.text()).toBe('ok');
  });
});
