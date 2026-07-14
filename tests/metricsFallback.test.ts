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

const metricValueForLine = (text: string, prefix: string) => {
    const line = text.split('\n').find((candidate) => candidate.startsWith(prefix));
    if (!line) return 0;
    return Number(line.trim().split(/\s+/).at(-1) || 0);
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
        expect(metrics.normalizeRoute('/api/chat')).toBe('/api/chat');
        expect(metrics.normalizeRoute('https://dspace.local/api/chat?opaque=value')).toBe(
            '/api/chat'
        );
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
            route: '/api/chat?request_id=secret',
            status: 200,
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
        expect(text).toContain('route="/api/chat"');
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
        const calls: Array<{ model: string; input?: unknown }> = [];
        const previousClient = (
            globalThis as typeof globalThis & { __DSpaceOpenAIClient?: unknown }
        ).__DSpaceOpenAIClient;
        const previousOpenAIKey = process.env.OPENAI_API_KEY;
        const previousChatProxyCredential = process.env.DSPACE_CHAT_PROXY_TOKEN; // scan-secrets: ignore
        const previousRateLimitUrl = process.env.DSPACE_CHAT_PROXY_RATE_LIMIT_REDIS_URL;
        const previousRateLimitValue = process.env['DSPACE_CHAT_PROXY_' + 'RATE_LIMIT_REDIS_TOKEN']; // scan-secrets: ignore
        const previousPublicAccess = process.env.DSPACE_CHAT_PROXY_PUBLIC_ACCESS;
        const previousAuthorizationValue =
            process.env['DSPACE_CHAT_PROXY_' + 'AUTHORIZATION_TOKEN']; // scan-secrets: ignore
        const previousFetch = global.fetch;
        const rateLimitCounts = new Map<string, number>();
        const redisStore = new Map<string, string>();
        const relayCalls: string[] = [];
        let lastCorrelationToken: string | null = null;
        let getdelCount = 0;
        let redisUnavailable = false;
        let rejectNextCorrelationStore = false;
        global.fetch = async (url, init) => {
            const href = String(url);
            if (href.startsWith('https://redis.example.test')) {
                if (redisUnavailable) {
                    return new Response('unavailable', { status: 503 });
                }
                const commands = JSON.parse(String(init?.body || '[]')) as unknown[][];
                const results = commands.map((cmd) => {
                    const [command, key, ...args] = cmd as string[];
                    if (command === 'INCR') {
                        const count = (rateLimitCounts.get(key) || 0) + 1;
                        rateLimitCounts.set(key, count);
                        return { result: count };
                    }
                    if (command === 'EXPIRE') {
                        return { result: 1 };
                    }
                    if (command === 'SET') {
                        // SET key value [EX ttl] [NX]
                        if (rejectNextCorrelationStore) {
                            rejectNextCorrelationStore = false;
                            return { result: null };
                        }
                        const isNX = args.includes('NX');
                        if (isNX && redisStore.has(key)) {
                            return { result: null };
                        }
                        redisStore.set(key, args[0]);
                        return { result: 'OK' };
                    }
                    if (command === 'GETDEL') {
                        getdelCount += 1;
                        const value = redisStore.get(key) ?? null;
                        redisStore.delete(key);
                        return { result: value };
                    }
                    return { result: null };
                });
                return new Response(JSON.stringify(results), {
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
        process.env['DSPACE_CHAT_PROXY_' + 'RATE_LIMIT_REDIS_TOKEN'] = 'test-rate-limit-token'; // scan-secrets: ignore
        process.env.DSPACE_CHAT_PROXY_PUBLIC_ACCESS = 'true';
        process.env['DSPACE_CHAT_PROXY_' + 'AUTHORIZATION_TOKEN'] = 'authorized-test-user'; // scan-secrets: ignore
        endpoint.resetChatProxyRateLimitForTests();
        const authorizedRequest = new Request('http://dspace.local/chat', {
            headers: { 'x-dspace-chat-proxy-authorization': 'authorized-test-user' },
        });
        const authorizedIdentity = runtime.getAuthorizedChatProxyIdentity(authorizedRequest);
        const chatCookie = () =>
            `${runtime.CHAT_PROXY_SESSION_COOKIE}=${runtime.createChatProxySessionCookie(authorizedIdentity)}`;
        (
            globalThis as typeof globalThis & { __DSpaceOpenAIClient?: unknown }
        ).__DSpaceOpenAIClient = class MockOpenAIClient {
            responses = {
                create: async ({ model, input }: { model: string; input?: unknown }) => {
                    calls.push({ model, input });
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

            const malformedJson = await endpoint.POST({
                request: new Request('http://dspace.local/api/chat', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Origin: 'http://dspace.local',
                        Cookie: chatCookie(),
                    },
                    body: '{"provider":"openai",',
                }),
            });
            expect(malformedJson.status).toBe(400);
            const malformedPayload = await malformedJson.json();
            expect(JSON.stringify(malformedPayload)).not.toContain('SyntaxError');
            expect(JSON.stringify(malformedPayload)).not.toContain('provider');
            expect(calls).toHaveLength(0);
            expect(relayCalls).toHaveLength(0);

            const oversizedOpenAi = await endpoint.POST({
                request: new Request('http://dspace.local/api/chat', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Origin: 'http://dspace.local',
                        Cookie: chatCookie(),
                    },
                    body: JSON.stringify({
                        provider: 'openai',
                        messages: [{ role: 'user', content: 'x'.repeat(80 * 1024) }],
                    }),
                }),
            });
            expect(oversizedOpenAi.status).toBe(413);
            expect(calls).toHaveLength(0);
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

            const authenticatedDispatch = await endpoint.POST({
                request: new Request('http://dspace.local/api/chat', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Origin: 'http://dspace.local',
                        Cookie: chatCookie(),
                    },
                    body: JSON.stringify({
                        provider: 'tokenplace',
                        operation: 'dispatch',
                        payload: {
                            server_public_key: 'server',
                            client_public_key: 'client',
                            request_id: 'request',
                            protocol: 'tokenplace_api_v1_relay_e2ee',
                            version: '1',
                            ciphertext: 'ciphertext',
                            cipherkey: 'cipherkey',
                            iv: 'iv',
                            cancel_token: 'cancel-placeholder', // scan-secrets: ignore
                        },
                    }),
                }),
            });
            expect(authenticatedDispatch.status).toBe(200);
            // Dispatch success: server issues a correlation token in a response header.
            // The token proves a server-observed dispatch happened for this session.
            lastCorrelationToken = authenticatedDispatch.headers.get('X-DSpace-Correlation-Token');
            expect(lastCorrelationToken).toBeTruthy();
            // Correlation token must not appear in metrics output (not a label).
            const metricsAfterDispatch = await metrics.register.metrics();
            expect(metricsAfterDispatch).not.toContain(lastCorrelationToken);
            const authenticatedRetrieve = await endpoint.POST({
                request: new Request('http://dspace.local/api/chat', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Origin: 'http://dspace.local',
                        Cookie: chatCookie(),
                    },
                    body: JSON.stringify({
                        provider: 'tokenplace',
                        operation: 'retrieve',
                        payload: { client_public_key: 'client', request_id: 'request' },
                    }),
                }),
            });
            expect(authenticatedRetrieve.status).toBe(200);
            expect(relayCalls).toHaveLength(3);

            const tokenPlaceMetricsBeforeInvalidPayload = await metrics.register.metrics();
            const tokenPlaceLinesBeforeInvalidPayload =
                getMetricLines(
                    tokenPlaceMetricsBeforeInvalidPayload,
                    'dspace_dchat_requests_total'
                ).join('\n') +
                getMetricLines(
                    tokenPlaceMetricsBeforeInvalidPayload,
                    'dspace_dependency_requests_total'
                ).join('\n');
            for (const payload of [
                // select with extra disallowed key
                { model: 'open-model', contextTier: 'small', messages: [{ content: 'plain' }] },
                // retrieve with prohibited key
                { client_public_key: 'client', request_id: 'request', privateKey: 'secret' },
                // complete without required correlationToken (has gameState which is also disallowed)
                { outcome: 'success', durationSeconds: 0.25, gameState: { inventory: [] } },
            ]) {
                const invalidPayloadResponse = await endpoint.POST({
                    request: new Request('http://dspace.local/api/chat', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            Origin: 'http://dspace.local',
                            Cookie: chatCookie(),
                        },
                        body: JSON.stringify({
                            provider: 'tokenplace',
                            operation: payload.outcome ? 'complete' : 'select',
                            payload,
                        }),
                    }),
                });
                expect(invalidPayloadResponse.status).toBe(400);
            }
            // complete with missing correlationToken also returns 400 (validation)
            const completeMissingToken = await endpoint.POST({
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
                        payload: { outcome: 'success' },
                    }),
                }),
            });
            expect(completeMissingToken.status).toBe(400);
            expect(relayCalls).toHaveLength(3);
            const tokenPlaceMetricsAfterInvalidPayload = await metrics.register.metrics();
            const tokenPlaceLinesAfterInvalidPayload =
                getMetricLines(
                    tokenPlaceMetricsAfterInvalidPayload,
                    'dspace_dchat_requests_total'
                ).join('\n') +
                getMetricLines(
                    tokenPlaceMetricsAfterInvalidPayload,
                    'dspace_dependency_requests_total'
                ).join('\n');
            expect(tokenPlaceLinesAfterInvalidPayload).toBe(tokenPlaceLinesBeforeInvalidPayload);
            expect(tokenPlaceMetricsAfterInvalidPayload).not.toContain('plain');
            expect(tokenPlaceMetricsAfterInvalidPayload).not.toContain('secret');
            expect(tokenPlaceMetricsAfterInvalidPayload).not.toContain('inventory');

            const terminalFailureBeforeStoreFailure = getMetricLines(
                tokenPlaceMetricsAfterInvalidPayload,
                'dspace_dchat_requests_total{provider="tokenplace"'
            );
            const dependencyFailureBeforeStoreFailure = metricValueForLine(
                tokenPlaceMetricsAfterInvalidPayload,
                'dspace_dchat_requests_total{provider="tokenplace",outcome="dependency_failure"}'
            );
            rejectNextCorrelationStore = true;
            const correlationStoreFailure = await endpoint.POST({
                request: new Request('http://dspace.local/api/chat', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Origin: 'http://dspace.local',
                        Cookie: chatCookie(),
                    },
                    body: JSON.stringify({
                        provider: 'tokenplace',
                        operation: 'dispatch',
                        payload: {
                            server_public_key: 'server',
                            client_public_key: 'client',
                            request_id: 'request-store-failure',
                            protocol: 'tokenplace_api_v1_relay_e2ee',
                            version: '1',
                            ciphertext: 'ciphertext-store-failure',
                            cipherkey: 'cipherkey',
                            iv: 'iv',
                            cancel_token: 'cancel-placeholder', // scan-secrets: ignore
                        },
                    }),
                }),
            });
            expect(correlationStoreFailure.status).toBe(503);
            expect(correlationStoreFailure.headers.get('X-DSpace-Correlation-Token')).toBeNull();
            const correlationStoreFailurePayload = await correlationStoreFailure.json();
            expect(correlationStoreFailurePayload).toEqual({
                error: 'chat_proxy_correlation_unavailable',
            });
            expect(JSON.stringify(correlationStoreFailurePayload)).not.toContain(
                'request-store-failure'
            );
            expect(JSON.stringify(correlationStoreFailurePayload)).not.toContain(
                'ciphertext-store-failure'
            );
            const metricsAfterStoreFailure = await metrics.register.metrics();
            const terminalFailureAfterStoreFailure = getMetricLines(
                metricsAfterStoreFailure,
                'dspace_dchat_requests_total{provider="tokenplace"'
            );
            expect(terminalFailureAfterStoreFailure.length).toBe(
                terminalFailureBeforeStoreFailure.length
            );
            expect(
                metricValueForLine(
                    metricsAfterStoreFailure,
                    'dspace_dchat_requests_total{provider="tokenplace",outcome="dependency_failure"}'
                )
            ).toBe(dependencyFailureBeforeStoreFailure + 1);
            expect(
                metricValueForLine(
                    metricsAfterStoreFailure,
                    'dspace_dchat_requests_total{provider="tokenplace",outcome="server_error"}'
                )
            ).toBe(
                metricValueForLine(
                    tokenPlaceMetricsAfterInvalidPayload,
                    'dspace_dchat_requests_total{provider="tokenplace",outcome="server_error"}'
                )
            );
            expect(metricsAfterStoreFailure).not.toContain('request-store-failure');
            expect(metricsAfterStoreFailure).not.toContain('ciphertext-store-failure');
            const relayCallsAfterStoreFailure = relayCalls.length;

            // complete with a wrong/replayed/cross-session correlation token returns 400
            const completeWrongToken = await endpoint.POST({
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
                        payload: { correlationToken: 'nonexistent-token', outcome: 'success' },
                    }),
                }),
            });
            expect(completeWrongToken.status).toBe(400);
            expect(getdelCount).toBe(1);

            // complete with valid correlation token records one terminal dChat outcome
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
                        payload: { correlationToken: lastCorrelationToken, outcome: 'success' },
                    }),
                }),
            });
            expect(tokenPlaceComplete.status).toBe(200);
            expect(relayCalls).toHaveLength(relayCallsAfterStoreFailure);
            expect(getdelCount).toBe(2);

            // Replay prevention: the same correlation token cannot be used a second time
            const replayComplete = await endpoint.POST({
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
                        payload: { correlationToken: lastCorrelationToken, outcome: 'success' },
                    }),
                }),
            });
            expect(replayComplete.status).toBe(400);
            expect(getdelCount).toBe(3);

            // After valid complete, dChat metric for tokenplace is populated
            const metricsAfterComplete = await metrics.register.metrics();
            expect(metricsAfterComplete).toContain(
                'dspace_dchat_requests_total{provider="tokenplace",outcome="success"}'
            );

            const getdelBeforeUnavailableComplete = getdelCount;
            redisUnavailable = true;
            const unavailableComplete = await endpoint.POST({
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
                        payload: {
                            ['correlation' + 'Token']:
                                'random-correlation-while-budget-unavailable',
                            outcome: 'success',
                        },
                    }),
                }),
            });
            redisUnavailable = false;
            expect(unavailableComplete.status).toBe(503);
            expect(getdelCount).toBe(getdelBeforeUnavailableComplete);

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
                        options: { serverChatProxy: true, personaId: 'sydney' },
                    }),
                }),
            });

            expect(response.status).toBe(200);
            await expect(response.json()).resolves.toMatchObject({ text: 'Server routed answer' });
            expect(calls).toHaveLength(1);
            expect(JSON.stringify(calls[0].input)).toContain('You are Sydney');

            rateLimitCounts.clear();
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

            // Token.place sub-operations: dispatch consumes the main session quota; select and
            // retrieve have separate per-operation sub-budgets (not the main dispatch limit);
            // complete is bounded by the correlation token (one per dispatch). Verify with the
            // already-exhausted reusableCookie that dispatch still fails (main limit) but select
            // and retrieve use their own sub-budget counters (not the main :session: key).
            // Do NOT clear rateLimitCounts here — the exhausted session state must persist.
            redisStore.clear();
            // Dispatch is rate-limited and should fail because the main quota is exhausted
            const exhaustedDispatch = await endpoint.POST({
                request: new Request('http://dspace.local/api/chat', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Origin: 'http://dspace.local',
                        Cookie: reusableCookie,
                    },
                    body: JSON.stringify({
                        provider: 'tokenplace',
                        operation: 'dispatch',
                        payload: {
                            server_public_key: 'server',
                            client_public_key: 'client',
                            request_id: 'req-exhaust',
                            protocol: 'tokenplace_api_v1_relay_e2ee',
                            version: '1',
                            ciphertext: 'ct',
                            cipherkey: 'ck',
                            iv: 'iv',
                        },
                    }),
                }),
            });
            expect(exhaustedDispatch.status).toBe(429);
            // select and retrieve use sub-op budget keys (contain :subop:), not :session: or :global:
            rateLimitCounts.clear();
            for (const [op, pl] of [
                ['select', { model: 'open-model', contextTier: 'small' }] as const,
                ['retrieve', { client_public_key: 'client', request_id: 'req2' }] as const,
            ]) {
                const nonDispatch = await endpoint.POST({
                    request: new Request('http://dspace.local/api/chat', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            Origin: 'http://dspace.local',
                            Cookie: reusableCookie,
                        },
                        body: JSON.stringify({
                            provider: 'tokenplace',
                            operation: op,
                            payload: pl,
                        }),
                    }),
                });
                expect(nonDispatch.status).toBe(200);
            }
            // select and retrieve hit :subop: keys; main :session: and :global: are untouched
            expect([...rateLimitCounts.keys()].some((key) => key.includes(':subop:'))).toBe(true);
            expect([...rateLimitCounts.keys()].some((key) => key.includes(':session:'))).toBe(
                false
            );
            // complete (with a fresh dispatch to get a valid correlation token) consumes a
            // separate complete-attempt sub-budget before the single-use correlation token,
            // without touching the main dispatch/session quota.
            rateLimitCounts.clear();
            // Use the main cookie (not reusableCookie) which has capacity for dispatch
            const freshDispatch = await endpoint.POST({
                request: new Request('http://dspace.local/api/chat', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Origin: 'http://dspace.local',
                        Cookie: chatCookie(),
                    },
                    body: JSON.stringify({
                        provider: 'tokenplace',
                        operation: 'dispatch',
                        payload: {
                            server_public_key: 'server2',
                            client_public_key: 'client2',
                            request_id: 'req-fresh',
                            protocol: 'tokenplace_api_v1_relay_e2ee',
                            version: '1',
                            ciphertext: 'ct2',
                            cipherkey: 'ck2',
                            iv: 'iv2',
                        },
                    }),
                }),
            });
            expect(freshDispatch.status).toBe(200);
            const freshCorrToken = freshDispatch.headers.get('X-DSpace-Correlation-Token');
            expect(freshCorrToken).toBeTruthy();
            rateLimitCounts.clear();
            const completeWithToken = await endpoint.POST({
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
                        payload: { correlationToken: freshCorrToken, outcome: 'success' },
                    }),
                }),
            });
            expect(completeWithToken.status).toBe(200);
            expect(
                [...rateLimitCounts.keys()].some((key) => key.includes(':subop:complete:'))
            ).toBe(true);
            expect([...rateLimitCounts.keys()].some((key) => key.includes(':session:'))).toBe(
                false
            );

            const text = await metrics.register.metrics();
            expect(text).toContain(
                'dspace_dchat_requests_total{provider="openai",outcome="success"}'
            );
            expect(text).toContain(
                'dspace_dependency_requests_total{dependency="openai",outcome="success"}'
            );
            // token.place dChat outcome is now recorded via server-owned correlation token:
            // the complete operation verifies a server-observed dispatch and records one
            // bounded terminal outcome in the server registry.
            expect(text).toContain(
                'dspace_dchat_requests_total{provider="tokenplace",outcome="success"}'
            );
            expect(text).toContain(
                'dspace_dependency_requests_total{dependency="tokenplace",outcome="success"}'
            );

            // Validly shaped but nonexistent/replayed complete tokens have a separate
            // per-session attempt budget before GETDEL. Once exhausted, requests return 429
            // without more GETDEL calls, without touching upstream, and without mutating metrics.
            const completeBudgetCookie = chatCookie();
            const metricsBeforeCompleteBudget = await metrics.register.metrics();
            const dchatLinesBeforeCompleteBudget = getMetricLines(
                metricsBeforeCompleteBudget,
                'dspace_dchat_requests_total'
            ).join('\n');
            const getdelBeforeBudgetExhaustion = getdelCount;
            let firstBudgetLimitedStatus = 0;
            for (let index = 0; index < 150; index += 1) {
                const randomComplete = await endpoint.POST({
                    request: new Request('http://dspace.local/api/chat', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            Origin: 'http://dspace.local',
                            Cookie: completeBudgetCookie,
                        },
                        body: JSON.stringify({
                            provider: 'tokenplace',
                            operation: 'complete',
                            payload: {
                                ['correlation' + 'Token']:
                                    `random-or-replayed-correlation-${index}`,
                                outcome: 'success',
                            },
                        }),
                    }),
                });
                if (randomComplete.status === 429) {
                    firstBudgetLimitedStatus = randomComplete.status;
                    break;
                }
                expect(randomComplete.status).toBe(400);
            }
            expect(firstBudgetLimitedStatus).toBe(429);
            const getdelAfterBudgetExhaustion = getdelCount;
            const budgetLimitedComplete = await endpoint.POST({
                request: new Request('http://dspace.local/api/chat', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Origin: 'http://dspace.local',
                        Cookie: completeBudgetCookie,
                    },
                    body: JSON.stringify({
                        provider: 'tokenplace',
                        operation: 'complete',
                        payload: {
                            ['correlation' + 'Token']: 'another-random-correlation-after-budget',
                            outcome: 'success',
                        },
                    }),
                }),
            });
            expect(budgetLimitedComplete.status).toBe(429);
            expect(getdelCount).toBe(getdelAfterBudgetExhaustion);
            expect(getdelAfterBudgetExhaustion).toBeGreaterThan(getdelBeforeBudgetExhaustion);
            const metricsAfterCompleteBudget = await metrics.register.metrics();
            expect(
                getMetricLines(metricsAfterCompleteBudget, 'dspace_dchat_requests_total').join('\n')
            ).toBe(dchatLinesBeforeCompleteBudget);
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
            if (previousRateLimitValue === undefined) {
                delete process.env['DSPACE_CHAT_PROXY_' + 'RATE_LIMIT_REDIS_TOKEN'];
            } else {
                process.env['DSPACE_CHAT_PROXY_' + 'RATE_LIMIT_REDIS_TOKEN'] =
                    previousRateLimitValue; // scan-secrets: ignore
            }
            if (previousPublicAccess === undefined) {
                delete process.env.DSPACE_CHAT_PROXY_PUBLIC_ACCESS;
            } else {
                process.env.DSPACE_CHAT_PROXY_PUBLIC_ACCESS = previousPublicAccess;
            }
            if (previousAuthorizationValue === undefined) {
                delete process.env['DSPACE_CHAT_PROXY_' + 'AUTHORIZATION_TOKEN'];
            } else {
                process.env['DSPACE_CHAT_PROXY_' + 'AUTHORIZATION_TOKEN'] =
                    previousAuthorizationValue; // scan-secrets: ignore
            }
            global.fetch = previousFetch;
        }
    });

    it('allows only large encrypted token.place dispatch bodies through the proxy', async () => {
        const metrics = await importMetrics();
        const endpoint = await import('../frontend/src/pages/api/chat');
        const runtime = await import('../frontend/src/utils/runtimeEndpoints');
        const previousFetch = global.fetch;
        const previousChatProxyCredential = process.env.DSPACE_CHAT_PROXY_TOKEN; // scan-secrets: ignore
        const previousRateLimitUrl = process.env.DSPACE_CHAT_PROXY_RATE_LIMIT_REDIS_URL;
        const previousRateLimitValue = process.env['DSPACE_CHAT_PROXY_' + 'RATE_LIMIT_REDIS_TOKEN']; // scan-secrets: ignore
        const previousPublicAccess = process.env.DSPACE_CHAT_PROXY_PUBLIC_ACCESS;
        const previousAuthorizationValue =
            process.env['DSPACE_CHAT_PROXY_' + 'AUTHORIZATION_TOKEN']; // scan-secrets: ignore
        const rateLimitCounts = new Map<string, number>();
        const redisStore = new Map<string, string>();
        const upstreamRequests: Array<{ url: string; body: string }> = [];

        global.fetch = async (url, init) => {
            const href = String(url);
            if (href.startsWith('https://redis.example.test')) {
                const commands = JSON.parse(String(init?.body || '[]')) as unknown[][];
                const results = commands.map((cmd) => {
                    const [command, key, ...args] = cmd as string[];
                    if (command === 'INCR') {
                        const count = (rateLimitCounts.get(key) || 0) + 1;
                        rateLimitCounts.set(key, count);
                        return { result: count };
                    }
                    if (command === 'EXPIRE') return { result: 1 };
                    if (command === 'SET') {
                        redisStore.set(key, args[0]);
                        return { result: 'OK' };
                    }
                    return { result: null };
                });
                return new Response(JSON.stringify(results), {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' },
                });
            }
            upstreamRequests.push({ url: href, body: String(init?.body || '') });
            return new Response(JSON.stringify({ accepted: true }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
            });
        };

        process.env.DSPACE_CHAT_PROXY_TOKEN = 'test-chat-proxy-token'; // scan-secrets: ignore
        process.env.DSPACE_CHAT_PROXY_RATE_LIMIT_REDIS_URL = 'https://redis.example.test';
        process.env['DSPACE_CHAT_PROXY_' + 'RATE_LIMIT_REDIS_TOKEN'] = 'test-rate-limit-token'; // scan-secrets: ignore
        process.env.DSPACE_CHAT_PROXY_PUBLIC_ACCESS = 'true';
        process.env['DSPACE_CHAT_PROXY_' + 'AUTHORIZATION_TOKEN'] = 'authorized-test-user'; // scan-secrets: ignore

        const authorizedIdentity = runtime.getAuthorizedChatProxyIdentity(
            new Request('http://dspace.local/chat', {
                headers: { 'x-dspace-chat-proxy-authorization': 'authorized-test-user' },
            })
        );
        const cookie = `${runtime.CHAT_PROXY_SESSION_COOKIE}=${runtime.createChatProxySessionCookie(authorizedIdentity)}`;
        const makeRequest = (body: unknown) =>
            new Request('http://dspace.local/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Origin: 'http://dspace.local',
                    Cookie: cookie,
                },
                body: JSON.stringify(body),
            });
        const largeCiphertext = 'a'.repeat(80 * 1024);
        const dispatchPayload = {
            server_public_key: 'server',
            client_public_key: 'client',
            request_id: 'large-dispatch-request',
            protocol: 'tokenplace_api_v1_relay_e2ee',
            version: '1',
            ciphertext: largeCiphertext,
            cipherkey: 'cipherkey',
            iv: 'iv',
            auth_tag: 'tag',
        };

        try {
            const dispatchResponse = await endpoint.POST({
                request: makeRequest({
                    provider: 'tokenplace',
                    operation: 'dispatch',
                    payload: dispatchPayload,
                }),
            });
            expect(dispatchResponse.status).toBe(200);
            expect(upstreamRequests).toHaveLength(1);
            expect(JSON.parse(upstreamRequests[0].body)).toEqual(dispatchPayload);
            expect(rateLimitCounts.size).toBeGreaterThan(0);

            const metricsBeforeRejected = await metrics.register.metrics();
            const metricLinesBeforeRejected =
                getMetricLines(metricsBeforeRejected, 'dspace_dchat_requests_total').join('\n') +
                getMetricLines(metricsBeforeRejected, 'dspace_dependency_requests_total').join(
                    '\n'
                );
            const upstreamCountBeforeRejected = upstreamRequests.length;
            const rateLimitCountBeforeRejected = [...rateLimitCounts.values()].reduce(
                (total, count) => total + count,
                0
            );

            const overCeilingDispatch = await endpoint.POST({
                request: makeRequest({
                    provider: 'tokenplace',
                    operation: 'dispatch',
                    payload: { ...dispatchPayload, ciphertext: 'b'.repeat(2 * 1024 * 1024) },
                }),
            });
            expect(overCeilingDispatch.status).toBe(413);

            const largeRetrieve = await endpoint.POST({
                request: makeRequest({
                    provider: 'tokenplace',
                    operation: 'retrieve',
                    payload: {
                        client_public_key: 'c'.repeat(80 * 1024),
                        request_id: 'large-retrieve-request',
                    },
                }),
            });
            expect(largeRetrieve.status).toBe(413);

            const metricsAfterRejected = await metrics.register.metrics();
            const metricLinesAfterRejected =
                getMetricLines(metricsAfterRejected, 'dspace_dchat_requests_total').join('\n') +
                getMetricLines(metricsAfterRejected, 'dspace_dependency_requests_total').join('\n');
            expect(metricLinesAfterRejected).toBe(metricLinesBeforeRejected);
            expect(upstreamRequests).toHaveLength(upstreamCountBeforeRejected);
            expect([...rateLimitCounts.values()].reduce((total, count) => total + count, 0)).toBe(
                rateLimitCountBeforeRejected
            );
        } finally {
            global.fetch = previousFetch;
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
            if (previousRateLimitValue === undefined) {
                delete process.env['DSPACE_CHAT_PROXY_' + 'RATE_LIMIT_REDIS_TOKEN'];
            } else {
                process.env['DSPACE_CHAT_PROXY_' + 'RATE_LIMIT_REDIS_TOKEN'] =
                    previousRateLimitValue; // scan-secrets: ignore
            }
            if (previousPublicAccess === undefined) {
                delete process.env.DSPACE_CHAT_PROXY_PUBLIC_ACCESS;
            } else {
                process.env.DSPACE_CHAT_PROXY_PUBLIC_ACCESS = previousPublicAccess;
            }
            if (previousAuthorizationValue === undefined) {
                delete process.env['DSPACE_CHAT_PROXY_' + 'AUTHORIZATION_TOKEN'];
            } else {
                process.env['DSPACE_CHAT_PROXY_' + 'AUTHORIZATION_TOKEN'] =
                    previousAuthorizationValue; // scan-secrets: ignore
            }
        }
    });

    it('stops reading the body stream at the 2 MiB dispatch ceiling (chunked-stream regression)', async () => {
        const endpoint = await import('../frontend/src/pages/api/chat');
        const runtime = await import('../frontend/src/utils/runtimeEndpoints');
        const previousFetch = global.fetch;
        const previousChatProxyCredential = process.env.DSPACE_CHAT_PROXY_TOKEN; // scan-secrets: ignore
        const previousRateLimitUrl = process.env.DSPACE_CHAT_PROXY_RATE_LIMIT_REDIS_URL;
        const previousRateLimitValue = process.env['DSPACE_CHAT_PROXY_' + 'RATE_LIMIT_REDIS_TOKEN']; // scan-secrets: ignore
        const previousPublicAccess = process.env.DSPACE_CHAT_PROXY_PUBLIC_ACCESS;
        const previousAuthorizationValue =
            process.env['DSPACE_CHAT_PROXY_' + 'AUTHORIZATION_TOKEN']; // scan-secrets: ignore

        process.env.DSPACE_CHAT_PROXY_TOKEN = 'test-chunked-ceiling-token'; // scan-secrets: ignore
        process.env.DSPACE_CHAT_PROXY_RATE_LIMIT_REDIS_URL = 'https://redis.example.test';
        process.env['DSPACE_CHAT_PROXY_' + 'RATE_LIMIT_REDIS_TOKEN'] = 'test-chunked-rate-token'; // scan-secrets: ignore
        process.env.DSPACE_CHAT_PROXY_PUBLIC_ACCESS = 'true';
        process.env['DSPACE_CHAT_PROXY_' + 'AUTHORIZATION_TOKEN'] = 'authorized-chunked-user'; // scan-secrets: ignore

        const rateLimitCounts = new Map<string, number>();
        global.fetch = async (url, init) => {
            const href = String(url);
            if (href.startsWith('https://redis.example.test')) {
                const commands = JSON.parse(String(init?.body || '[]')) as unknown[][];
                const results = commands.map((cmd) => {
                    const [command, key] = cmd as string[];
                    if (command === 'INCR') {
                        const count = (rateLimitCounts.get(key) || 0) + 1;
                        rateLimitCounts.set(key, count);
                        return { result: count };
                    }
                    return { result: 1 };
                });
                return new Response(JSON.stringify(results), {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' },
                });
            }
            return new Response(JSON.stringify({ accepted: true }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
            });
        };

        const authorizedIdentity = runtime.getAuthorizedChatProxyIdentity(
            new Request('http://dspace.local/chat', {
                headers: { 'x-dspace-chat-proxy-authorization': 'authorized-chunked-user' },
            })
        );
        const cookie = `${runtime.CHAT_PROXY_SESSION_COOKIE}=${runtime.createChatProxySessionCookie(authorizedIdentity)}`;

        try {
            const TOKEN_PLACE_DISPATCH_MAX_BODY_BYTES = 2 * 1024 * 1024;
            const CHUNK_SIZE = 64 * 1024;

            // Build an over-ceiling body (≈ 3 MiB) encoded as a dispatch JSON payload.
            const overCeilingBody = new TextEncoder().encode(
                JSON.stringify({
                    provider: 'tokenplace',
                    operation: 'dispatch',
                    payload: { ciphertext: 'x'.repeat(3 * 1024 * 1024) },
                })
            );

            let bytesPulled = 0;
            let streamCanceled = false;
            let streamOffset = 0;

            const trackingStream = new ReadableStream<Uint8Array>({
                pull(controller) {
                    if (streamOffset >= overCeilingBody.byteLength) {
                        controller.close();
                        return;
                    }
                    const chunk = overCeilingBody.slice(streamOffset, streamOffset + CHUNK_SIZE);
                    streamOffset += chunk.byteLength;
                    bytesPulled += chunk.byteLength;
                    controller.enqueue(chunk);
                },
                cancel() {
                    streamCanceled = true;
                },
            });

            const response = await endpoint.POST({
                request: new Request('http://dspace.local/api/chat', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Origin: 'http://dspace.local',
                        Cookie: cookie,
                    },
                    body: trackingStream,
                    // duplex is required for streaming request bodies in Node.js fetch
                    ...({ duplex: 'half' } as object),
                }),
            });

            // The body exceeds the 2 MiB ceiling so the endpoint must reject it.
            expect(response.status).toBe(413);

            // Reading must have stopped before the full body was consumed.
            expect(bytesPulled).toBeLessThan(overCeilingBody.byteLength);
            // At most one extra chunk beyond the ceiling may be read before stopping.
            expect(bytesPulled).toBeLessThanOrEqual(
                TOKEN_PLACE_DISPATCH_MAX_BODY_BYTES + CHUNK_SIZE
            );
            // The stream must have been cancelled to signal upstream to stop sending.
            expect(streamCanceled).toBe(true);
        } finally {
            global.fetch = previousFetch;
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
            if (previousRateLimitValue === undefined) {
                delete process.env['DSPACE_CHAT_PROXY_' + 'RATE_LIMIT_REDIS_TOKEN'];
            } else {
                process.env['DSPACE_CHAT_PROXY_' + 'RATE_LIMIT_REDIS_TOKEN'] =
                    previousRateLimitValue; // scan-secrets: ignore
            }
            if (previousPublicAccess === undefined) {
                delete process.env.DSPACE_CHAT_PROXY_PUBLIC_ACCESS;
            } else {
                process.env.DSPACE_CHAT_PROXY_PUBLIC_ACCESS = previousPublicAccess;
            }
            if (previousAuthorizationValue === undefined) {
                delete process.env['DSPACE_CHAT_PROXY_' + 'AUTHORIZATION_TOKEN'];
            } else {
                process.env['DSPACE_CHAT_PROXY_' + 'AUTHORIZATION_TOKEN'] =
                    previousAuthorizationValue; // scan-secrets: ignore
            }
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
