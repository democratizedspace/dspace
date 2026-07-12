import { beforeEach, describe, expect, it } from 'vitest';
import {
    classifyErrorOutcome,
    initMetrics,
    normalizeOutcome,
    normalizeProvider,
    normalizeRoute,
    recordDchatRequest,
    recordDependencyRequest,
    recordHttpRequest,
    register,
} from '../frontend/src/utils/metrics.js';

const metricText = () => register.metrics();

beforeEach(async () => {
    await initMetrics();
});

describe('DSPACE Prometheus metrics', () => {
    it('emits required metric families with bounded labels', async () => {
        recordHttpRequest({
            method: 'GET',
            route: '/quests/play/abc123',
            status: 200,
            outcome: 'success',
            durationSeconds: 0.12,
        });
        recordDchatRequest({ provider: 'token-place', outcome: 'success', durationSeconds: 1.2 });
        recordDependencyRequest({
            dependency: 'tokenplace',
            outcome: 'rate_limited',
            durationSeconds: 0.2,
        });
        const text = await metricText();
        expect(text).toContain(
            'dspace_http_requests_total{method="GET",route="/quests/[pathId]/[questId]",status_class="2xx",outcome="success"}'
        );
        expect(text).toContain('dspace_http_request_duration_seconds_bucket');
        expect(text).toContain(
            'dspace_dchat_requests_total{provider="tokenplace",outcome="success"}'
        );
        expect(text).toContain('dspace_dchat_request_duration_seconds_bucket');
        expect(text).toContain(
            'dspace_dependency_requests_total{dependency="tokenplace",outcome="rate_limited"}'
        );
        expect(text).toContain('dspace_dependency_request_duration_seconds_bucket');
        expect(text).toMatch(/dspace_build_info\{version="[^"]+",revision="[^"]+"\} 1/);
        expect(text).toContain('dspace_instrumentation_up 1');
    });

    it('normalizes routes and bounded enums', () => {
        expect(
            normalizeRoute('https://example.test/inventory/item/user-123-secret/edit?token=abc')
        ).toBe('/inventory/item/[itemId]');
        expect(normalizeRoute('/docs/about?user=daniel')).toBe('/docs/[slug]');
        expect(normalizeRoute('/metrics')).toBe('/metrics');
        expect(normalizeProvider('token.place')).toBe('tokenplace');
        expect(normalizeProvider('some-user-provider')).toBe('unknown');
        expect(normalizeOutcome('prompt leaked')).toBe('unknown_error');
    });

    it('classifies terminal outcomes without exception text labels', () => {
        expect(classifyErrorOutcome({ status: 408, message: 'request abc timed out' })).toBe(
            'timeout'
        );
        expect(classifyErrorOutcome({ status: 429, message: 'user quota' })).toBe('rate_limited');
        expect(classifyErrorOutcome({ type: 'validation', message: 'bad prompt secret' })).toBe(
            'validation_error'
        );
        expect(classifyErrorOutcome({ type: 'malformed', message: 'raw response secret' })).toBe(
            'malformed_response'
        );
        expect(
            classifyErrorOutcome({ type: 'network', message: 'https://unique.example/path' })
        ).toBe('dependency_failure');
        expect(classifyErrorOutcome({ status: 503, message: 'server stack trace' })).toBe(
            'server_error'
        );
    });

    it('does not grow label values with prohibited high-cardinality inputs', async () => {
        const prohibited: string[] = [];
        for (let i = 0; i < 50; i += 1) {
            const secret = `secret-user-${i}-prompt-${crypto.randomUUID()}-https://tracker.example/${i}`;
            prohibited.push(secret);
            recordHttpRequest({
                method: 'POST',
                route: `/quests/${secret}/${i}?request_id=${secret}`,
                status: 500,
                outcome: 'server_error',
                durationSeconds: 0.01,
            });
            recordDchatRequest({ provider: secret, outcome: secret, durationSeconds: 0.01 });
            recordDependencyRequest({ dependency: secret, outcome: secret, durationSeconds: 0.01 });
        }
        const text = await metricText();
        for (const value of prohibited) expect(text).not.toContain(value);
        expect(text).toContain('route="/quests/[pathId]/[questId]"');
        expect(text).toContain('provider="unknown",outcome="unknown_error"');
        expect(text).toContain('dependency="openai",outcome="unknown_error"');
    });

    it('excludes metrics endpoint from HTTP request instrumentation', async () => {
        recordHttpRequest({
            method: 'GET',
            route: '/metrics',
            status: 200,
            outcome: 'success',
            durationSeconds: 0.01,
        });
        const text = await metricText();
        expect(text).not.toContain('route="/metrics"');
    });
});
