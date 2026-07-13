import { GPT5ChatV2 } from '../../utils/openAI.js';
import { recordDependencyRequest, outcomeFromStatus } from '../../utils/metrics.js';
import { resolveTokenPlaceBaseUrl } from '../../utils/tokenPlace.js';
import {
    CHAT_PROXY_SESSION_COOKIE,
    verifyChatProxySessionCookie,
} from '../../utils/runtimeEndpoints';

export const prerender = false;

const MAX_BODY_BYTES = 64 * 1024;
const TOKEN_PLACE_RELAY_OPERATIONS = new Set(['select', 'dispatch', 'retrieve']);

const getServerOpenAIKey = () =>
    process.env.OPENAI_API_KEY || process.env.DSPACE_OPENAI_API_KEY || ''; // scan-secrets: ignore

const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX = Number(process.env.DSPACE_CHAT_PROXY_SESSION_LIMIT || 20);
const GLOBAL_RATE_LIMIT_MAX = Number(process.env.DSPACE_CHAT_PROXY_GLOBAL_LIMIT || 200);
const MAX_RATE_LIMIT_BUCKETS = Number(process.env.DSPACE_CHAT_PROXY_MAX_BUCKETS || 256);
const rateLimitBuckets = new Map<string, { count: number; resetAt: number }>();
let globalRateLimitBucket: { count: number; resetAt: number } | null = null;

const isSameOriginRequest = (request: Request) => {
    const origin = request.headers.get('origin');
    if (!origin) return false;
    try {
        return new URL(origin).origin === new URL(request.url).origin;
    } catch {
        return false;
    }
};

const readCookie = (request: Request, name: string) => {
    const cookieHeader = request.headers.get('cookie') || '';
    for (const part of cookieHeader.split(';')) {
        const [rawName, ...rawValue] = part.trim().split('=');
        if (rawName === name) return rawValue.join('=');
    }
    return null;
};

const cleanupRateLimitBuckets = (now = Date.now()) => {
    for (const [sessionId, bucket] of rateLimitBuckets) {
        if (bucket.resetAt <= now) rateLimitBuckets.delete(sessionId);
    }
    while (rateLimitBuckets.size > MAX_RATE_LIMIT_BUCKETS) {
        const oldestSessionId = rateLimitBuckets.keys().next().value;
        if (!oldestSessionId) break;
        rateLimitBuckets.delete(oldestSessionId);
    }
};

const consumeRateLimit = (sessionId: string, now = Date.now()) => {
    cleanupRateLimitBuckets(now);
    if (!globalRateLimitBucket || globalRateLimitBucket.resetAt <= now) {
        globalRateLimitBucket = { count: 0, resetAt: now + RATE_LIMIT_WINDOW_MS };
    }
    if (globalRateLimitBucket.count >= GLOBAL_RATE_LIMIT_MAX) return false;

    const bucket = rateLimitBuckets.get(sessionId);
    if (!bucket || bucket.resetAt <= now) {
        if (RATE_LIMIT_MAX <= 0) return false;
        rateLimitBuckets.set(sessionId, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
        globalRateLimitBucket.count += 1;
        return true;
    }
    if (bucket.count >= RATE_LIMIT_MAX) return false;
    bucket.count += 1;
    globalRateLimitBucket.count += 1;
    return true;
};

export const resetChatProxyRateLimitForTests = () => {
    rateLimitBuckets.clear();
    globalRateLimitBucket = null;
};
export const getChatProxyRateLimitStateForTests = () => ({
    bucketCount: rateLimitBuckets.size,
    globalCount: globalRateLimitBucket?.count || 0,
});

const readBoundedJson = async (request: Request) => {
    const contentType = request.headers.get('content-type') || '';
    if (!contentType.toLowerCase().includes('application/json')) {
        throw Object.assign(new Error('Unsupported content type'), { status: 415 });
    }
    const text = await request.text();
    if (new TextEncoder().encode(text).length > MAX_BODY_BYTES) {
        throw Object.assign(new Error('Chat request too large'), { status: 413 });
    }
    return JSON.parse(text);
};

const recordTokenPlaceRelay = async (operation: string, payload: unknown, signal?: AbortSignal) => {
    if (!TOKEN_PLACE_RELAY_OPERATIONS.has(operation)) {
        return Response.json({ error: 'unsupported_tokenplace_operation' }, { status: 400 });
    }
    const baseUrl = resolveTokenPlaceBaseUrl({
        url: process.env.DSPACE_TOKEN_PLACE_URL,
        state: {},
    });
    const started = performance.now();
    const record = (status: number, fallbackOutcome?: string) => {
        recordDependencyRequest({
            dependency: 'tokenplace',
            outcome: fallbackOutcome || outcomeFromStatus(status),
            durationSeconds: Math.max(0, (performance.now() - started) / 1000),
        });
    };
    try {
        const init: RequestInit = { signal };
        let url = baseUrl;
        if (operation === 'select') {
            const params = new URLSearchParams();
            const body = payload as { model?: unknown; contextTier?: unknown };
            if (typeof body?.model === 'string') params.set('model', body.model);
            if (typeof body?.contextTier === 'string') params.set('context_tier', body.contextTier);
            url += `/api/v1/relay/servers/next${params.toString() ? `?${params}` : ''}`;
            init.method = 'GET';
        } else {
            url +=
                operation === 'dispatch'
                    ? '/api/v1/relay/requests'
                    : '/api/v1/relay/responses/retrieve';
            init.method = 'POST';
            init.headers = { 'Content-Type': 'application/json' };
            init.body = JSON.stringify(payload || {});
        }
        const upstream = await fetch(url, { ...init, credentials: 'omit' });
        const text = await upstream.text();
        record(
            upstream.status,
            operation === 'retrieve' && [404, 410].includes(upstream.status)
                ? 'dependency_failure'
                : undefined
        );
        return new Response(text, {
            status: upstream.status,
            headers: { 'Content-Type': upstream.headers.get('content-type') || 'application/json' },
        });
    } catch {
        recordDependencyRequest({
            dependency: 'tokenplace',
            outcome: 'dependency_failure',
            durationSeconds: Math.max(0, (performance.now() - started) / 1000),
        });
        return Response.json({ error: 'tokenplace_relay_unavailable' }, { status: 502 });
    }
};

const sanitizeError = (error: unknown) => {
    const candidate = error as {
        status?: number;
        statusCode?: number;
        name?: string;
        message?: string;
    };
    const status = Number(candidate?.status ?? candidate?.statusCode);
    return {
        error: 'chat_failed',
        type: typeof candidate?.name === 'string' ? candidate.name : 'Error',
        message: typeof candidate?.message === 'string' ? candidate.message : 'Chat request failed',
        ...(Number.isFinite(status) ? { status } : {}),
    };
};

export async function POST({ request }: { request: Request }) {
    try {
        // Trust boundary: this endpoint spends the server OpenAI credential. The shared signing
        // secret never leaves the server; browser requests must be same-origin, carry a valid
        // HttpOnly session cookie minted by the SSR chat page, and stay within a small per-session
        // rate limit. Browser-held OpenAI keys are never accepted here; token.place relay requests may carry only routing fields and ciphertext.
        if (!isSameOriginRequest(request)) {
            return Response.json({ error: 'chat_proxy_unauthorized' }, { status: 403 });
        }
        const body = await readBoundedJson(request);
        const provider = String(body?.provider || '').toLowerCase();
        if (provider === 'tokenplace') {
            // token.place browser traffic keeps encryption and private keys client-side; this
            // boundary forwards only routing fields or ciphertext so server metrics can observe
            // actual relay attempts without receiving prompts, inventory, game state, credentials,
            // or relay private keys.
            return recordTokenPlaceRelay(
                String(body?.operation || ''),
                body?.payload,
                request.signal
            );
        }
        if (provider !== 'openai') {
            return Response.json({ error: 'unsupported_provider' }, { status: 400 });
        }
        const sessionId = verifyChatProxySessionCookie(
            readCookie(request, CHAT_PROXY_SESSION_COOKIE)
        );
        if (!sessionId) {
            return Response.json({ error: 'chat_proxy_unauthorized' }, { status: 403 });
        }
        if (
            body?.options?.promptPayload ||
            body?.options?.gameState ||
            body?.options?.serverOpenAIApiKey ||
            body?.apiKey
        ) {
            return Response.json({ error: 'sensitive_payload_rejected' }, { status: 400 });
        }
        const serverOpenAIApiKey = getServerOpenAIKey(); // scan-secrets: ignore
        if (!serverOpenAIApiKey) {
            return Response.json({ error: 'server_openai_unconfigured' }, { status: 503 });
        }
        if (!consumeRateLimit(sessionId)) {
            return Response.json({ error: 'chat_proxy_rate_limited' }, { status: 429 });
        }
        const messages = Array.isArray(body?.messages) ? body.messages : [];
        // Do not accept browser-held game state or credentials here. token.place plaintext and
        // private keys stay browser-side; only ciphertext relay traffic may cross this server.
        const result = await GPT5ChatV2(messages, {
            serverChatProxy: true,
            serverOpenAIApiKey,
        });
        return Response.json(result);
    } catch (error) {
        const payload = sanitizeError(error);
        const status = Number(payload.status);
        return Response.json(payload, { status: Number.isFinite(status) ? status : 500 });
    }
}
