import { describe, expect, it } from 'vitest';
import {
    normalizeOutcome,
    normalizeProvider,
    normalizeRoute,
    outcomeFromError,
    recordDchatRequest,
    recordDependencyRequest,
    recordHttpRequest,
    register,
} from '../src/utils/metrics.js';

const prohibitedValues = [
    'user-secret-123',
    'session-secret-123',
    'request-secret-123',
    'prompt-secret-123',
    'https://evil.example/path/secret',
    'exception secret text',
    '192.0.2.55',
    'tok_secret_123',
];

const metricOutput = () => register.metrics();

describe('DSPACE metrics instrumentation', () => {
    it('normalizes routes, providers, and outcomes to bounded label values', () => {
        expect(normalizeRoute('/quests/play/123?requestId=secret')).toBe(
            '/quests/[pathId]/[questId]'
        );
        expect(normalizeRoute('/docs/token-place')).toBe('/docs/[slug]');
        expect(normalizeRoute('/_astro/index.secret.js')).toBe('/_astro/[asset]');
        expect(normalizeProvider('token-place')).toBe('tokenplace');
        expect(normalizeProvider('arbitrary-provider-secret')).toBe('unknown');
        expect(normalizeOutcome('rate-limited')).toBe('rate_limited');
        expect(normalizeOutcome('secret-outcome')).toBe('unknown_error');
    });

    it.each([
        ['timeout', { type: 'abort', message: 'prompt-secret-123' }],
        ['rate_limited', { status: 429, message: 'request-secret-123' }],
        ['validation_error', { type: 'validation', message: 'user-secret-123' }],
        ['malformed_response', { type: 'malformed', message: 'exception secret text' }],
        ['dependency_failure', { type: 'network', message: 'https://evil.example/path/secret' }],
        ['server_error', { status: 503, message: 'tok_secret_123' }],
        ['unknown_error', { message: 'session-secret-123' }],
    ])('maps %s errors without exposing raw messages', (expected, error) => {
        expect(outcomeFromError(error)).toBe(expected);
    });

    it('emits required counters and histograms after controlled traffic', async () => {
        recordHttpRequest({
            method: 'GET',
            route: '/docs/about?user=user-secret-123',
            status: 200,
        });
        recordHttpRequest({ method: 'POST', route: '/metrics', status: 200 });
        recordDchatRequest({ provider: 'token-place', outcome: 'success', durationSeconds: 0.01 });
        recordDchatRequest({ provider: 'openai', outcome: 'fallback_used', durationSeconds: 0.02 });
        recordDependencyRequest({
            dependency: 'token-place',
            outcome: 'rate_limited',
            durationSeconds: 0.03,
        });
        recordDependencyRequest({
            dependency: 'openai',
            outcome: 'server_error',
            durationSeconds: 0.04,
        });

        const output = await metricOutput();
        expect(output).toContain('dspace_http_requests_total');
        expect(output).toContain('dspace_http_request_duration_seconds_bucket');
        expect(output).toContain(
            'dspace_dchat_requests_total{provider="tokenplace",outcome="success"}'
        );
        expect(output).toContain('dspace_dchat_request_duration_seconds_bucket');
        expect(output).toContain(
            'dspace_dependency_requests_total{dependency="tokenplace",outcome="rate_limited"}'
        );
        expect(output).toContain('dspace_dependency_request_duration_seconds_bucket');
        expect(output).toContain('dspace_build_info{version="3.0.1"');
        expect(output).toContain('dspace_instrumentation_up 1');
        expect(output).not.toContain('/metrics",status_class');
    });

    it('keeps label sets bounded for synthetic high-cardinality inputs', async () => {
        for (let i = 0; i < 50; i += 1) {
            recordHttpRequest({
                method: 'GET',
                route: `/docs/page-${i}?requestId=request-secret-123-${i}&user=user-secret-123-${i}`,
                status: 500,
                outcome: 'server_error',
            });
            recordDchatRequest({ provider: `provider-${i}`, outcome: `outcome-${i}` });
            recordDependencyRequest({
                dependency: `https://evil.example/${i}`,
                outcome: `outcome-${i}`,
            });
        }
        const output = await metricOutput();
        const docsHttpLines = output
            .split('\n')
            .filter(
                (line) =>
                    line.startsWith('dspace_http_requests_total{') &&
                    line.includes('route="/docs/[slug]"') &&
                    line.includes('status_class="5xx"')
            );
        const unknownDchatLines = output
            .split('\n')
            .filter((line) =>
                line.startsWith(
                    'dspace_dchat_requests_total{provider="unknown",outcome="unknown_error"'
                )
            );
        const openaiDependencyLines = output
            .split('\n')
            .filter((line) =>
                line.startsWith(
                    'dspace_dependency_requests_total{dependency="openai",outcome="unknown_error"'
                )
            );
        expect(docsHttpLines).toHaveLength(1);
        expect(unknownDchatLines).toHaveLength(1);
        expect(openaiDependencyLines).toHaveLength(1);
        for (const value of prohibitedValues) {
            expect(output).not.toContain(value);
        }
    });
});
