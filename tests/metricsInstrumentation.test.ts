import { beforeEach, describe, expect, it } from 'vitest';
import {
    initMetrics,
    normalizeOutcome,
    normalizeProvider,
    normalizeRoute,
    recordDchatRequest,
    recordDependencyRequest,
    recordHttpRequest,
    register,
} from '../frontend/src/utils/metrics.js';

const prohibitedValues = [
    'user-abc-123',
    'session-xyz-789',
    'request-secret-456',
    'how do I launch a rocket with secret sauce?',
    'https://example.test/private/path?token=abc',
    'Error: database exploded for player alice',
    'npc-sydney',
    'Bearer secret-token',
];

const metricLines = async () => (await register.metrics()).split('\n');
const sampleLinesFor = async (name: string) =>
    (await metricLines()).filter((line) => line.startsWith(`${name}{`));

describe('DSPACE application metrics', () => {
    beforeEach(async () => {
        await initMetrics();
    });

    it('emits valid canonical metric families after controlled traffic', async () => {
        recordHttpRequest({
            method: 'GET',
            route: '/quests/play/2?requestId=user-abc-123',
            status: 200,
            outcome: 'success',
            durationSeconds: 0.12,
        });
        recordDchatRequest({ provider: 'tokenplace', outcome: 'success', durationSeconds: 0.25 });
        recordDependencyRequest({
            dependency: 'tokenplace',
            outcome: 'success',
            durationSeconds: 0.2,
        });

        const text = await register.metrics();
        expect(text).toContain('# HELP dspace_http_requests_total');
        expect(text).toContain('dspace_http_request_duration_seconds_bucket');
        expect(text).toContain('dspace_dchat_requests_total');
        expect(text).toContain('dspace_dchat_request_duration_seconds_bucket');
        expect(text).toContain('dspace_dependency_requests_total');
        expect(text).toContain('dspace_dependency_request_duration_seconds_bucket');
        expect(text).toContain('dspace_build_info{version="3.0.1",revision=');
        expect(text).toContain('dspace_instrumentation_up 1');
    });

    it('normalizes routes and bounded enum label values', () => {
        expect(normalizeRoute('/metrics')).toBe('/metrics');
        expect(normalizeRoute('/quests/play/2?raw=secret')).toBe('/quests/[pathId]/[questId]');
        expect(normalizeRoute('/inventory/item/37/edit')).toBe('/inventory/item/[itemId]');
        expect(normalizeRoute('/docs/solar?source=https://example.test')).toBe('/docs/[slug]');
        expect(normalizeProvider('malicious-provider-user-abc-123')).toBe('unknown');
        expect(normalizeOutcome('rate limited')).toBe('rate_limited');
        expect(normalizeOutcome('contains-secret-user-id')).toBe('unknown_error');
    });

    it('records expected terminal dChat and dependency outcomes', async () => {
        for (const outcome of [
            'success',
            'timeout',
            'rate_limited',
            'validation_error',
            'dependency_failure',
            'fallback_used',
            'fallback_unavailable',
            'server_error',
        ]) {
            recordDchatRequest({ provider: 'openai', outcome, durationSeconds: 0.01 });
            recordDependencyRequest({ dependency: 'openai', outcome, durationSeconds: 0.01 });
        }

        const text = await register.metrics();
        expect(text).toContain('dspace_dchat_requests_total{provider="openai",outcome="timeout"}');
        expect(text).toContain(
            'dspace_dependency_requests_total{dependency="openai",outcome="rate_limited"}'
        );
        expect(text).toContain('dspace_dchat_request_duration_seconds_bucket');
        expect(text).toContain('dspace_dependency_request_duration_seconds_bucket');
    });

    it('does not instrument /metrics HTTP scrapes', async () => {
        recordHttpRequest({
            method: 'GET',
            route: '/metrics',
            status: 200,
            outcome: 'success',
            durationSeconds: 0.001,
        });
        expect(await sampleLinesFor('dspace_http_requests_total')).toHaveLength(0);
    });

    it('keeps label sets bounded for high-cardinality synthetic inputs', async () => {
        for (let index = 0; index < 50; index += 1) {
            recordHttpRequest({
                method: 'POST',
                route: `/quests/play/${index}?requestId=request-secret-${index}&prompt=${encodeURIComponent(prohibitedValues[3])}`,
                status: 500,
                outcome: `Error: database exploded for player ${index}`,
                durationSeconds: 0.01,
            });
            recordDchatRequest({
                provider: `provider-user-${index}`,
                outcome: `exception-message-${index}`,
                durationSeconds: 0.01,
            });
            recordDependencyRequest({
                dependency: `https://example.test/private/${index}`,
                outcome: `token-${index}`,
                durationSeconds: 0.01,
            });
        }

        const text = await register.metrics();
        for (const value of prohibitedValues) {
            expect(text).not.toContain(value);
        }
        expect(await sampleLinesFor('dspace_http_requests_total')).toHaveLength(1);
        expect(await sampleLinesFor('dspace_dchat_requests_total')).toHaveLength(1);
        expect(await sampleLinesFor('dspace_dependency_requests_total')).toHaveLength(1);
        expect(text).toContain('route="/quests/[pathId]/[questId]"');
        expect(text).toContain('provider="unknown"');
        expect(text).toContain('dependency="unknown"');
    });

    it('keeps build info stable and low cardinality', async () => {
        recordHttpRequest({
            method: 'GET',
            route: '/config.json',
            status: 200,
            outcome: 'success',
            durationSeconds: 0.01,
        });
        const lines = await sampleLinesFor('dspace_build_info');
        expect(lines).toHaveLength(1);
        expect(lines[0]).toMatch(/^dspace_build_info\{version="3\.0\.1",revision="[^"]+"\} 1$/);
        expect(lines[0]).not.toMatch(/user|session|request|prompt|model|url|ip/i);
    });
});
