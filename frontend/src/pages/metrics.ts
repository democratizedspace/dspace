import {
    ensureMetricsInitialized,
    register,
    recordDchatRequest,
    recordDependencyRequest,
} from '../utils/metrics.js';

export const prerender = false;

const MAX_BODY_BYTES = 512;
const VALID_KINDS = new Set(['dchat', 'dependency']);
const VALID_PROVIDERS = new Set(['tokenplace', 'openai', 'none', 'unknown']);
const VALID_DEPENDENCIES = new Set(['tokenplace', 'openai', 'unknown']);
const VALID_OUTCOMES = new Set([
    'success',
    'timeout',
    'rate_limited',
    'validation_error',
    'malformed_response',
    'dependency_failure',
    'server_error',
    'fallback_used',
    'fallback_unavailable',
    'unknown_error',
]);
const DCHAT_KEYS = new Set(['kind', 'provider', 'outcome', 'durationSeconds']);
const DEPENDENCY_KEYS = new Set(['kind', 'dependency', 'outcome', 'durationSeconds']);

const isSameOrigin = (request: Request) => {
    const origin = request.headers.get('origin');
    if (!origin) return true;
    try {
        return new URL(origin).origin === new URL(request.url).origin;
    } catch {
        return false;
    }
};

const boundedDuration = (value: unknown) => {
    const duration = Number(value);
    if (!Number.isFinite(duration) || duration < 0 || duration > 300) return undefined;
    return duration;
};

const hasOnlyKeys = (payload: Record<string, unknown>, allowed: Set<string>) =>
    Object.keys(payload).every((key) => allowed.has(key));

const invalidPayload = () => new Response('invalid metrics payload\n', { status: 400 });

/**
 * Returns Prometheus metrics for the running instance.
 * If the METRICS_TOKEN env var is set, clients must include
 * `Authorization: Bearer <token>` or they'll receive 401.
 */
export async function GET({ request }: { request: Request }) {
    const token = process.env.METRICS_TOKEN;
    if (token) {
        const auth = request.headers.get('authorization');
        if (auth !== `Bearer ${token}`) {
            return new Response('Unauthorized', { status: 401 });
        }
    }

    const status = await ensureMetricsInitialized();
    if (!status.available) {
        return new Response('metrics unavailable\n', {
            status: 503,
            headers: { 'Content-Type': 'text/plain; charset=utf-8' },
        });
    }

    const metrics = await register.metrics();
    return new Response(metrics, {
        headers: { 'Content-Type': register.contentType },
    });
}

export async function POST({ request }: { request: Request }) {
    if (!isSameOrigin(request)) return invalidPayload();

    const contentType = request.headers.get('content-type') || '';
    if (!contentType.toLowerCase().includes('application/json')) return invalidPayload();

    const text = await request.text();
    if (!text || new TextEncoder().encode(text).byteLength > MAX_BODY_BYTES) {
        return invalidPayload();
    }

    let payload: Record<string, unknown>;
    try {
        const parsed = JSON.parse(text);
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return invalidPayload();
        payload = parsed as Record<string, unknown>;
    } catch {
        return invalidPayload();
    }

    const kind = String(payload.kind || '');
    const outcome = String(payload.outcome || '');
    const durationSeconds = boundedDuration(payload.durationSeconds);
    if (!VALID_KINDS.has(kind) || !VALID_OUTCOMES.has(outcome) || durationSeconds === undefined) {
        return invalidPayload();
    }

    if (kind === 'dchat') {
        const provider = String(payload.provider || '');
        if (!hasOnlyKeys(payload, DCHAT_KEYS) || !VALID_PROVIDERS.has(provider))
            return invalidPayload();
        recordDchatRequest({ provider, outcome, durationSeconds });
        return new Response(null, { status: 204 });
    }

    const dependency = String(payload.dependency || '');
    if (!hasOnlyKeys(payload, DEPENDENCY_KEYS) || !VALID_DEPENDENCIES.has(dependency)) {
        return invalidPayload();
    }
    recordDependencyRequest({ dependency, outcome, durationSeconds });
    return new Response(null, { status: 204 });
}
