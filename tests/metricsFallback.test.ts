import { describe, it, expect, beforeEach, afterEach } from 'vitest';

const prohibitedValues = [
    'user-secret-123',
    'prompt-secret-456',
    'request-secret-789',
    'https://evil.example/unique/path',
    'exception-message-secret',
    'npc-secret',
    'inventory-secret',
    'token-secret',
];

const importMetrics = async () => import('../frontend/src/utils/metrics.js');

const getMetricLines = (text: string, name: string) =>
    text.split('\n').filter((line) => line.startsWith(name));

const labelValuesFor = (text: string, name: string, label: string) => {
    const pattern = new RegExp(`${label}="([^"]+)"`, 'g');
    return new Set(
        getMetricLines(text, name).flatMap((line) =>
            [...line.matchAll(pattern)].map((match) => match[1])
        )
    );
};

describe('DSPACE application metrics', () => {
    beforeEach(async () => {
        const metrics = await importMetrics();
        await metrics.initMetrics();
    });

    afterEach(async () => {
        const metrics = await importMetrics();
        await metrics.initMetrics();
    });

    it('records canonical counters and histograms for bounded dChat and dependency outcomes', async () => {
        const metrics = await importMetrics();

        await metrics.instrumentDchatOperation('tokenplace', () =>
            metrics.instrumentDependencyOperation('tokenplace', async () => ({
                text: 'ok',
            }))
        );
        await expect(
            metrics.instrumentDchatOperation('openai', () =>
                metrics.instrumentDependencyOperation('openai', async () => {
                    const error = new Error('rate limited');
                    (error as Error & { status?: number }).status = 429;
                    throw error;
                })
            )
        ).rejects.toThrow('rate limited');
        await expect(
            metrics.instrumentDchatOperation('openai', async () => {
                const error = new Error('timeout');
                (error as Error & { status?: number }).status = 408;
                throw error;
            })
        ).rejects.toThrow('timeout');
        await expect(
            metrics.instrumentDchatOperation('tokenplace', async () => {
                const error = new Error('bad input');
                (error as Error & { status?: number }).status = 400;
                throw error;
            })
        ).rejects.toThrow('bad input');
        await expect(
            metrics.instrumentDchatOperation('tokenplace', async () => {
                const error = new Error('malformed');
                (error as Error & { type?: string }).type = 'malformed';
                throw error;
            })
        ).rejects.toThrow('malformed');
        await expect(
            metrics.instrumentDchatOperation('tokenplace', async () => {
                const error = new Error('network');
                (error as Error & { type?: string }).type = 'network';
                throw error;
            })
        ).rejects.toThrow('network');
        await expect(
            metrics.instrumentDchatOperation('tokenplace', async () => {
                const error = new Error('server');
                (error as Error & { status?: number }).status = 503;
                throw error;
            })
        ).rejects.toThrow('server');
        await metrics.instrumentDchatOperation('none', async () => ({
            metricsOutcome: 'fallback_used',
        }));
        await metrics.instrumentDchatOperation('none', async () => ({
            metricsOutcome: 'fallback_unavailable',
        }));

        const text = await metrics.register.metrics();
        for (const name of [
            'dspace_dchat_requests_total',
            'dspace_dchat_request_duration_seconds_bucket',
            'dspace_dependency_requests_total',
            'dspace_dependency_request_duration_seconds_bucket',
        ]) {
            expect(text).toContain(name);
        }
        for (const outcome of [
            'success',
            'timeout',
            'rate_limited',
            'validation_error',
            'malformed_response',
            'dependency_failure',
            'server_error',
            'fallback_used',
            'fallback_unavailable',
        ]) {
            expect(text).toContain(`outcome="${outcome}"`);
        }
    });

    it('normalizes routes, status classes, providers, dependencies, and outcomes', async () => {
        const metrics = await importMetrics();
        expect(metrics.normalizeRoute('/quests/play/123?request_id=secret')).toBe(
            '/quests/[pathId]/[questId]'
        );
        expect(metrics.normalizeRoute('/inventory/item/37/edit?user=secret')).toBe(
            '/inventory/item/[itemId]/edit'
        );
        expect(metrics.normalizeRoute('/docs/solar?source=https://example.invalid/x')).toBe(
            '/docs/[slug]'
        );
        expect(metrics.statusClassFor(503)).toBe('5xx');
        expect(metrics.statusClassFor(302)).toBe('unknown');
        expect(metrics.statusClassFor(102)).toBe('unknown');
        expect(metrics.normalizeRoute('/reset/user-secret-123')).toBe('/unknown');
        expect(metrics.normalizeRoute('/process/launch-rocket')).toBe('/process/[slug]');
        expect(metrics.normalizeHttpMethod('X_USER_SECRET')).toBe('UNKNOWN');
        expect(metrics.outcomeFromStatus(429)).toBe('rate_limited');
        expect(metrics.normalizeProvider('arbitrary-provider')).toBe('unknown');
        expect(metrics.normalizeDependency('arbitrary-dependency')).toBe('unknown');

        metrics.recordHttpRequest({
            method: 'post',
            route: '/quests/play/123?request_id=secret',
            status: 201,
            durationSeconds: 0.01,
        });
        metrics.recordHttpRequest({
            method: 'get',
            route: '/metrics',
            status: 200,
            durationSeconds: 0.01,
        });

        const text = await metrics.register.metrics();
        expect(text).toContain('route="/quests/[pathId]/[questId]"');
        expect(text).not.toContain('status_class="3xx"');
        expect(text).not.toContain('status_class="1xx"');
        expect(text).not.toContain('request_id=secret');
        expect(text).not.toContain('route="/metrics"');
    });

    it('keeps metric labels low-cardinality under unique sensitive inputs', async () => {
        const metrics = await importMetrics();

        for (let i = 0; i < 75; i += 1) {
            metrics.recordHttpRequest({
                method: i % 3 ? 'GET' : `X_USER_SECRET_${i}`,
                route:
                    i % 2
                        ? `/quests/path-${i}/quest-${i}?request_id=request-secret-789&user=user-secret-123&url=https://evil.example/unique/path`
                        : `/reset/user-secret-${i}`,
                status: i % 2 ? 200 : 500,
                outcome: i % 2 ? 'success' : 'server_error',
                durationSeconds: 0.001,
            });
            await expect(
                metrics.instrumentDchatOperation(`provider-${i}`, async () => {
                    const error = new Error(`exception-message-secret-${i} prompt-secret-456`);
                    (error as Error & { status?: number }).status = 500;
                    throw error;
                })
            ).rejects.toThrow('exception-message-secret');
        }

        const text = await metrics.register.metrics();
        expect(labelValuesFor(text, 'dspace_http_requests_total', 'route')).toContain(
            '/quests/[pathId]/[questId]'
        );
        expect(labelValuesFor(text, 'dspace_http_requests_total', 'route')).toContain('/unknown');
        expect(labelValuesFor(text, 'dspace_http_requests_total', 'method')).toContain('UNKNOWN');
        expect(labelValuesFor(text, 'dspace_dchat_requests_total', 'provider').has('unknown')).toBe(
            true
        );
        expect(
            labelValuesFor(text, 'dspace_dchat_requests_total', 'provider').size
        ).toBeLessThanOrEqual(4);

        for (const value of prohibitedValues) {
            expect(text).not.toContain(value);
        }
        expect(text).not.toContain('provider-42');
        expect(text).not.toContain('exception-message-secret-42');
    });

    it('rejects browser metric ingestion so untrusted clients cannot mutate the registry', async () => {
        const metrics = await importMetrics();
        const endpoint = await import('../frontend/src/pages/metrics');
        const before =
            getMetricLines(await metrics.register.metrics(), 'dspace_dchat_requests_total').join(
                '\n'
            ) +
            getMetricLines(
                await metrics.register.metrics(),
                'dspace_dependency_requests_total'
            ).join('\n');

        for (const request of [
            new Request('http://dspace.local/metrics', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Origin: 'http://dspace.local' },
                body: JSON.stringify({
                    kind: 'dchat',
                    provider: 'unknown',
                    outcome: 'success',
                    durationSeconds: 0.25,
                }),
            }),
            new Request('http://dspace.local/metrics', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Origin: 'http://evil.example',
                },
                body: JSON.stringify({
                    kind: 'dependency',
                    dependency: 'tokenplace',
                    outcome: 'server_error',
                    durationSeconds: 0.5,
                    replay: 'credential-secret-123',
                }),
            }),
        ]) {
            const response = await endpoint.POST({ request });
            expect(response.status).toBe(405);
        }

        const output = await metrics.register.metrics();
        const after =
            getMetricLines(output, 'dspace_dchat_requests_total').join('\n') +
            getMetricLines(output, 'dspace_dependency_requests_total').join('\n');
        expect(after).toBe(before);
        expect(after).not.toContain('credential-secret-123');
        expect(after).not.toContain('prompt-secret-456');
    });

    it('rejects sensitive chat proxy payloads and records sanitized server chat traffic', async () => {
        const metrics = await importMetrics();
        const endpoint = await import('../frontend/src/pages/api/chat');
        const runtime = await import('../frontend/src/utils/runtimeEndpoints');
        const calls: Array<{ model: string }> = [];
        const previousClient = (
            globalThis as typeof globalThis & { __DSpaceOpenAIClient?: unknown }
        ).__DSpaceOpenAIClient;
        const previousOpenAIKey = process.env.OPENAI_API_KEY;
        const previousChatProxyCredential = process.env.DSPACE_CHAT_PROXY_TOKEN; // scan-secrets: ignore
        const previousRateLimitUrl = process.env.DSPACE_CHAT_PROXY_RATE_LIMIT_REDIS_URL;
        const previousRateLimitToken = process.env.DSPACE_CHAT_PROXY_RATE_LIMIT_REDIS_TOKEN; // scan-secrets: ignore
        const previousFetch = global.fetch;
        const rateLimitCounts = new Map<string, number>();
        const relayCalls: string[] = [];
        global.fetch = async (url, init) => {
            const href = String(url);
            if (href.startsWith('https://redis.example.test')) {
                const body = JSON.parse(String(init?.body || '[]'));
                const key = body?.[0]?.[1] || 'unknown';
                const count = (rateLimitCounts.get(key) || 0) + 1;
                rateLimitCounts.set(key, count);
                return new Response(JSON.stringify([{ result: count }, { result: 1 }]), {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' },
                });
            }
            relayCalls.push(href);
            return new Response(JSON.stringify({ server_public_key: 'relay-public-key' }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
            });
        };
        process.env.OPENAI_API_KEY = 'test-server-openai-key'; // scan-secrets: ignore
        process.env.DSPACE_CHAT_PROXY_TOKEN = 'test-chat-proxy-token'; // scan-secrets: ignore
        process.env.DSPACE_CHAT_PROXY_RATE_LIMIT_REDIS_URL = 'https://redis.example.test';
        process.env.DSPACE_CHAT_PROXY_RATE_LIMIT_REDIS_TOKEN = 'test-rate-limit-token'; // scan-secrets: ignore
        endpoint.resetChatProxyRateLimitForTests();
        const chatCookie = () =>
            `${runtime.CHAT_PROXY_SESSION_COOKIE}=${runtime.createChatProxySessionCookie()}`;
        (
            globalThis as typeof globalThis & { __DSpaceOpenAIClient?: unknown }
        ).__DSpaceOpenAIClient = class MockOpenAIClient {
            responses = {
                create: async ({ model }: { model: string }) => {
                    calls.push({ model });
                    return { output_text: 'Server routed answer' };
                },
            };
        };

        try {
            const rejected = await endpoint.POST({
                request: new Request('http://dspace.local/api/chat', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Origin: 'http://dspace.local',
                        Cookie: chatCookie(),
                    },
                    body: JSON.stringify({
                        provider: 'openai',
                        messages: [{ role: 'user', content: 'hello' }],
                        options: {
                            promptPayload: {
                                combinedMessages: [{ role: 'user', content: 'hello' }],
                                gameState: { openAI: { apiKey: 'test-key' } }, // scan-secrets: ignore
                                contextSources: [],
                            },
                        },
                    }),
                }),
            });
            expect(rejected.status).toBe(400);
            expect(calls).toHaveLength(0);

            const tokenPlaceResponse = await endpoint.POST({
                request: new Request('http://dspace.local/api/chat', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Origin: 'http://dspace.local',
                        Cookie: chatCookie(),
                    },
                    body: JSON.stringify({
                        provider: 'token-place',
                        messages: [{ role: 'user', content: 'hello' }],
                    }),
                }),
            });
            expect(tokenPlaceResponse.status).toBe(400);

            const unauthorizedResponse = await endpoint.POST({
                request: new Request('http://dspace.local/api/chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', Origin: 'http://dspace.local' },
                    body: JSON.stringify({
                        provider: 'openai',
                        messages: [{ role: 'user', content: 'hello' }],
                    }),
                }),
            });
            expect(unauthorizedResponse.status).toBe(403);
            expect(calls).toHaveLength(0);

            const invalidCookieResponse = await endpoint.POST({
                request: new Request('http://dspace.local/api/chat', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Origin: 'http://dspace.local',
                        Cookie: `${runtime.CHAT_PROXY_SESSION_COOKIE}=bad.cookie.value`,
                    },
                    body: JSON.stringify({
                        provider: 'openai',
                        messages: [{ role: 'user', content: 'hello' }],
                    }),
                }),
            });
            expect(invalidCookieResponse.status).toBe(403);
            expect(calls).toHaveLength(0);

            const unauthenticatedRelay = await endpoint.POST({
                request: new Request('http://dspace.local/api/chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', Origin: 'http://dspace.local' },
                    body: JSON.stringify({
                        provider: 'tokenplace',
                        operation: 'select',
                        payload: { model: 'open-model', contextTier: 'small' },
                    }),
                }),
            });
            expect(unauthenticatedRelay.status).toBe(403);
            expect(relayCalls).toHaveLength(0);
            const authenticatedRelay = await endpoint.POST({
                request: new Request('http://dspace.local/api/chat', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Origin: 'http://dspace.local',
                        Cookie: chatCookie(),
                    },
                    body: JSON.stringify({
                        provider: 'tokenplace',
                        operation: 'select',
                        payload: { model: 'open-model', contextTier: 'small' },
                    }),
                }),
            });
            expect(authenticatedRelay.status).toBe(200);
            expect(relayCalls).toHaveLength(1);

            const tokenPlaceComplete = await endpoint.POST({
                request: new Request('http://dspace.local/api/chat', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Origin: 'http://dspace.local',
                        Cookie: chatCookie(),
                    },
                    body: JSON.stringify({
                        provider: 'tokenplace',
                        operation: 'complete',
                        payload: { outcome: 'success', durationSeconds: 0.25 },
                    }),
                }),
            });
            expect(tokenPlaceComplete.status).toBe(200);
            expect(relayCalls).toHaveLength(1);

            delete process.env.OPENAI_API_KEY;
            const unconfiguredResponse = await endpoint.POST({
                request: new Request('http://dspace.local/api/chat', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Origin: 'http://dspace.local',
                        Cookie: chatCookie(),
                    },
                    body: JSON.stringify({
                        provider: 'openai',
                        messages: [{ role: 'user', content: 'hello' }],
                    }),
                }),
            });
            expect(unconfiguredResponse.status).toBe(503);
            expect(calls).toHaveLength(0);
            process.env.OPENAI_API_KEY = 'test-server-openai-key'; // scan-secrets: ignore

            const response = await endpoint.POST({
                request: new Request('http://dspace.local/api/chat', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Origin: 'http://dspace.local',
                        Cookie: chatCookie(),
                    },
                    body: JSON.stringify({
                        provider: 'openai',
                        messages: [{ role: 'user', content: 'hello' }],
                        options: { serverChatProxy: true },
                    }),
                }),
            });

            expect(response.status).toBe(200);
            await expect(response.json()).resolves.toMatchObject({ text: 'Server routed answer' });
            expect(calls).toHaveLength(1);

            const reusableCookie = chatCookie();
            for (let index = 0; index < 20; index += 1) {
                const limitedOk = await endpoint.POST({
                    request: new Request('http://dspace.local/api/chat', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            Origin: 'http://dspace.local',
                            Cookie: reusableCookie,
                        },
                        body: JSON.stringify({
                            provider: 'openai',
                            messages: [{ role: 'user', content: `hello ${index}` }],
                        }),
                    }),
                });
                expect(limitedOk.status).toBe(200);
            }
            const overLimit = await endpoint.POST({
                request: new Request('http://dspace.local/api/chat', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Origin: 'http://dspace.local',
                        Cookie: reusableCookie,
                    },
                    body: JSON.stringify({
                        provider: 'openai',
                        messages: [{ role: 'user', content: 'over limit' }],
                    }),
                }),
            });
            expect(overLimit.status).toBe(429);
            expect(calls).toHaveLength(21);
            expect(endpoint.getChatProxyRateLimitStateForTests()).toMatchObject({
                bucketCount: 0,
                shared: true,
            });
            expect([...rateLimitCounts.keys()].some((key) => key.includes(':session:'))).toBe(true);
            expect([...rateLimitCounts.keys()].some((key) => key.includes(':global:'))).toBe(true);

            const text = await metrics.register.metrics();
            expect(text).toContain(
                'dspace_dchat_requests_total{provider="openai",outcome="success"}'
            );
            expect(text).toContain(
                'dspace_dependency_requests_total{dependency="openai",outcome="success"}'
            );
            expect(text).toContain(
                'dspace_dchat_requests_total{provider="tokenplace",outcome="success"}'
            );
        } finally {
            if (previousClient === undefined) {
                delete (globalThis as typeof globalThis & { __DSpaceOpenAIClient?: unknown })
                    .__DSpaceOpenAIClient;
            } else {
                (
                    globalThis as typeof globalThis & { __DSpaceOpenAIClient?: unknown }
                ).__DSpaceOpenAIClient = previousClient;
            }
            if (previousOpenAIKey === undefined) {
                delete process.env.OPENAI_API_KEY;
            } else {
                process.env.OPENAI_API_KEY = previousOpenAIKey; // scan-secrets: ignore
            }
            if (previousChatProxyCredential === undefined) {
                delete process.env.DSPACE_CHAT_PROXY_TOKEN;
            } else {
                process.env.DSPACE_CHAT_PROXY_TOKEN = previousChatProxyCredential; // scan-secrets: ignore
            }
            if (previousRateLimitUrl === undefined) {
                delete process.env.DSPACE_CHAT_PROXY_RATE_LIMIT_REDIS_URL;
            } else {
                process.env.DSPACE_CHAT_PROXY_RATE_LIMIT_REDIS_URL = previousRateLimitUrl;
            }
            if (previousRateLimitToken === undefined) { // scan-secrets: ignore
                delete process.env.DSPACE_CHAT_PROXY_RATE_LIMIT_REDIS_TOKEN;
            } else {
                process.env.DSPACE_CHAT_PROXY_RATE_LIMIT_REDIS_TOKEN = previousRateLimitToken; // scan-secrets: ignore
            }
            global.fetch = previousFetch;
        }
    });

    it('exports stable low-cardinality build and instrumentation gauges', async () => {
        const metrics = await importMetrics();
        const text = await metrics.register.metrics();
        const buildInfo = getMetricLines(text, 'dspace_build_info');
        expect(buildInfo.length).toBeGreaterThanOrEqual(1);
        expect(
            buildInfo.every((line) => line.includes('version=') && line.includes('revision='))
        ).toBe(true);
        expect(buildInfo.join('\n')).not.toMatch(/user|session|request|prompt|model|token/i);
        expect(text).toContain('dspace_instrumentation_up 1');
    });
});

describe('metrics fallback initialization', () => {
    it('falls back when prom-client is missing', async () => {
        const mod = await import('../frontend/src/utils/metrics.js');
        await mod.initMetrics(() => {
            throw new Error('module not found');
        });
        expect(mod.getMetricsStatus().available).toBe(false);
        expect(mod.register.contentType).toBe('text/plain; charset=utf-8');
        const metrics = await mod.register.metrics();
        expect(metrics).toContain('dspace metrics unavailable');
        await mod.initMetrics();
    });
});
