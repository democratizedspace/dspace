import { GPT5ChatV2 } from '../../utils/openAI.js';
import { npcPersonas } from '../../data/npcPersonas.js';
import {
    recordDependencyRequest,
    recordDchatRequest,
    outcomeFromStatus,
    normalizeOutcome,
} from '../../utils/metrics.js';
import { resolveTokenPlaceBaseUrl } from '../../utils/tokenPlace.js';
import {
    CHAT_PROXY_SESSION_COOKIE,
    verifyChatProxySessionCookie,
} from '../../utils/runtimeEndpoints';

export const prerender = false;

const MAX_BODY_BYTES = 64 * 1024;
const TOKEN_PLACE_DISPATCH_MAX_BODY_BYTES = 2 * 1024 * 1024;
const TOKEN_PLACE_RELAY_OPERATIONS = new Set(['select', 'dispatch', 'retrieve', 'complete']);

const getServerOpenAIKey = () =>
    process.env.OPENAI_API_KEY || process.env.DSPACE_OPENAI_API_KEY || ''; // scan-secrets: ignore

const resolvePersonaOption = (value: unknown) => {
    if (value === undefined || value === null || value === '') return undefined;
    if (typeof value !== 'string' || !/^[a-z0-9-]{1,64}$/.test(value)) {
        throw Object.assign(new Error('Invalid persona'), { status: 400 });
    }
    const persona = npcPersonas.find((candidate) => candidate.id === value);
    if (!persona) throw Object.assign(new Error('Invalid persona'), { status: 400 });
    return persona;
};

const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_TTL_SECONDS = Math.ceil(RATE_LIMIT_WINDOW_MS / 1000);
const RATE_LIMIT_MAX = Number(process.env.DSPACE_CHAT_PROXY_SESSION_LIMIT || 20);
const GLOBAL_RATE_LIMIT_MAX = Number(process.env.DSPACE_CHAT_PROXY_GLOBAL_LIMIT || 200);

// Per-operation sub-budgets for token.place polling sub-operations. These counters are
// separate from the main dispatch budget to prevent normal select/retrieve polling from
// exhausting the logical-chat quota, while still bounding per-session abuse potential.
const SELECT_LIMIT_PER_WINDOW = Number(process.env.DSPACE_CHAT_PROXY_SUBOP_SELECT_LIMIT || 60);
const RETRIEVE_LIMIT_PER_WINDOW = Number(process.env.DSPACE_CHAT_PROXY_SUBOP_RETRIEVE_LIMIT || 200);

// Correlation tokens are stored in the shared Redis backend with a TTL. The token proves that
// a rate-limited dispatch was server-observed before a client-reported complete is accepted.
const CORREL_TTL_SECONDS = 300;

type SharedRateLimitResult = { allowed: boolean; unavailable?: boolean };

type ChatRequestBody = {
    provider?: unknown;
    operation?: unknown;
    payload?: unknown;
    messages?: unknown;
    apiKey?: unknown;
    options?: {
        promptPayload?: unknown;
        gameState?: unknown;
        serverOpenAIApiKey?: unknown;
        personaId?: unknown;
    };
};

const getSharedRateLimitConfig = () => ({
    url: process.env.DSPACE_CHAT_PROXY_RATE_LIMIT_REDIS_URL || '',
    token: process.env.DSPACE_CHAT_PROXY_RATE_LIMIT_REDIS_TOKEN || '', // scan-secrets: ignore
});

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

const parseRedisPipelineCount = (payload: unknown) => {
    if (!Array.isArray(payload)) return Number.NaN;
    const first = payload[0] as { result?: unknown } | unknown[] | undefined;
    if (Array.isArray(first)) return Number(first[1]);
    return Number((first as { result?: unknown } | undefined)?.result);
};

const incrementSharedRateLimitKey = async (key: string, limit: number) => {
    if (limit <= 0) return { allowed: false };
    const { url, token } = getSharedRateLimitConfig();
    if (!url || !token) return { allowed: false, unavailable: true };
    try {
        const response = await fetch(`${url.replace(/\/$/, '')}/pipeline`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify([
                ['INCR', key],
                ['EXPIRE', key, RATE_LIMIT_TTL_SECONDS, 'NX'],
            ]),
        });
        if (!response.ok) return { allowed: false, unavailable: true };
        const count = parseRedisPipelineCount(await response.json());
        if (!Number.isFinite(count)) return { allowed: false, unavailable: true };
        return { allowed: count <= limit };
    } catch {
        return { allowed: false, unavailable: true };
    }
};

const consumeRateLimit = async (sessionId: string): Promise<SharedRateLimitResult> => {
    const minuteWindow = Math.floor(Date.now() / RATE_LIMIT_WINDOW_MS);
    const session = await incrementSharedRateLimitKey(
        `dspace:chat-proxy:session:${minuteWindow}:${sessionId}`,
        RATE_LIMIT_MAX
    );
    if (!session.allowed || session.unavailable) return session;
    return incrementSharedRateLimitKey(
        `dspace:chat-proxy:global:${minuteWindow}`,
        GLOBAL_RATE_LIMIT_MAX
    );
};

// Consume a per-operation sub-budget for token.place polling sub-operations. These counters
// are separate from the main dispatch budget so that normal polling (select, retrieve) cannot
// exhaust the logical-chat quota, while still preventing unlimited hammering of upstream.
const consumeSubOperationBudget = async (
    sessionId: string,
    operation: string
): Promise<SharedRateLimitResult> => {
    const limit = operation === 'select' ? SELECT_LIMIT_PER_WINDOW : RETRIEVE_LIMIT_PER_WINDOW;
    if (limit <= 0) return { allowed: false };
    const { url, token } = getSharedRateLimitConfig();
    if (!url || !token) return { allowed: false, unavailable: true };
    const minuteWindow = Math.floor(Date.now() / RATE_LIMIT_WINDOW_MS);
    return incrementSharedRateLimitKey(
        `dspace:chat-proxy:subop:${operation}:${minuteWindow}:${sessionId}`,
        limit
    );
};

// Generate a cryptographically random opaque correlation token. Never used as a metric label.
const generateCorrelationToken = (): string => {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
    }
    // Fallback path — not reachable in Node 19+, kept for extreme environments.
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
};

const redisPipeline = async (commands: unknown[][]): Promise<unknown[] | null> => {
    const { url, token } = getSharedRateLimitConfig();
    if (!url || !token) return null;
    const authHeader = 'Bearer '.concat(token); // scan-secrets: ignore
    try {
        const response = await fetch(`${url.replace(/\/$/, '')}/pipeline`, {
            method: 'POST',
            headers: {
                Authorization: authHeader,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(commands),
        });
        if (!response.ok) return null;
        return (await response.json()) as unknown[];
    } catch {
        return null;
    }
};

// Store a correlation token in the shared Redis backend. The value encodes the session ID
// and server-owned start timestamp so that complete can derive duration without trusting
// any client-supplied durationSeconds field. SET NX prevents token reuse across races.
const storeCorrelationToken = async (
    sessionId: string,
    corrToken: string,
    startedAt: number
): Promise<boolean> => {
    const result = await redisPipeline([
        [
            'SET',
            `dspace:chat-proxy:correl:${corrToken}`,
            JSON.stringify({ sessionId, startedAt }),
            'EX',
            CORREL_TTL_SECONDS,
            'NX',
        ],
    ]);
    return Array.isArray(result) && (result[0] as { result?: unknown })?.result === 'OK';
};

// Atomically consume a correlation token (GETDEL). Returns stored state only when the token
// exists and belongs to the same session, preventing replay and cross-session use.
const consumeCorrelationToken = async (
    sessionId: string,
    corrToken: unknown
): Promise<{ sessionId: string; startedAt: number } | null> => {
    if (!corrToken || typeof corrToken !== 'string') return null;
    const result = await redisPipeline([['GETDEL', `dspace:chat-proxy:correl:${corrToken}`]]);
    if (!result) return null;
    const raw = (result[0] as { result?: unknown })?.result;
    if (!raw || typeof raw !== 'string') return null;
    try {
        const stored = JSON.parse(raw) as { sessionId?: unknown; startedAt?: unknown };
        if (typeof stored.sessionId !== 'string' || stored.sessionId !== sessionId) return null;
        if (typeof stored.startedAt !== 'number') return null;
        return { sessionId: stored.sessionId, startedAt: stored.startedAt };
    } catch {
        return null;
    }
};

export const resetChatProxyRateLimitForTests = () => {};
export const getChatProxyRateLimitStateForTests = () => ({
    bucketCount: 0,
    globalCount: 0,
    shared: Boolean(getSharedRateLimitConfig().url && getSharedRateLimitConfig().token),
});

const readBoundedJson = async (request: Request): Promise<ChatRequestBody> => {
    const contentType = request.headers.get('content-type') || '';
    if (!contentType.toLowerCase().includes('application/json')) {
        throw Object.assign(new Error('Unsupported content type'), { status: 415 });
    }
    const text = await request.text();
    const byteLength = new TextEncoder().encode(text).length;
    if (byteLength > TOKEN_PLACE_DISPATCH_MAX_BODY_BYTES) {
        throw Object.assign(new Error('Chat request too large'), { status: 413 });
    }
    let body: unknown;
    try {
        body = JSON.parse(text);
    } catch (error) {
        if (byteLength > MAX_BODY_BYTES) {
            throw Object.assign(new Error('Chat request too large'), { status: 413 });
        }
        throw error;
    }
    const candidate = body as { provider?: unknown; operation?: unknown } | null;
    const isTokenPlaceDispatch =
        candidate &&
        typeof candidate === 'object' &&
        String(candidate.provider || '').toLowerCase() === 'tokenplace' &&
        String(candidate.operation || '').toLowerCase() === 'dispatch';
    if (byteLength > MAX_BODY_BYTES && !isTokenPlaceDispatch) {
        throw Object.assign(new Error('Chat request too large'), { status: 413 });
    }
    return body as ChatRequestBody;
};

const TOKEN_PLACE_PAYLOAD_KEYS: Record<string, Set<string>> = {
    select: new Set(['model', 'contextTier']),
    dispatch: new Set([
        'server_public_key',
        'client_public_key',
        'request_id',
        'protocol',
        'version',
        'ciphertext',
        'chat_history',
        'cipherkey',
        'iv',
        'auth_tag',
        'cancel_token',
    ]),
    retrieve: new Set(['client_public_key', 'request_id']),
    // correlationToken is required for complete; it proves a server-observed dispatch happened.
    // durationSeconds is accepted (ignored; duration is server-derived from dispatch timestamp).
    complete: new Set(['outcome', 'durationSeconds', 'correlationToken']),
};

const TOKEN_PLACE_PROHIBITED_PAYLOAD_KEYS = new Set([
    'apiKey',
    'api_key',
    'authorization',
    'credential',
    'credentials',
    'gameState',
    'game_state',
    'inventory',
    'messages',
    'modelName',
    'plaintext',
    'privateKey',
    'private_key',
    'prompt',
    'promptPayload',
    'secret',
    'serverOpenAIApiKey',
    'token',
]);

const validateTokenPlaceRelayPayload = (operation: string, payload: unknown) => {
    const allowedKeys = TOKEN_PLACE_PAYLOAD_KEYS[operation];
    if (!allowedKeys || !payload || typeof payload !== 'object' || Array.isArray(payload)) {
        return false;
    }
    for (const key of Object.keys(payload)) {
        if (!allowedKeys.has(key) || TOKEN_PLACE_PROHIBITED_PAYLOAD_KEYS.has(key)) return false;
    }
    if (operation === 'complete') {
        // correlationToken is required; it proves a server-observed dispatch happened before this
        // client-reported complete is accepted. outcome is constrained to the bounded enum.
        const body = payload as {
            outcome?: unknown;
            durationSeconds?: unknown;
            correlationToken?: unknown;
        };
        return (
            typeof body.correlationToken === 'string' &&
            body.correlationToken.length > 0 &&
            (body.outcome === undefined || typeof body.outcome === 'string') &&
            (body.durationSeconds === undefined ||
                (typeof body.durationSeconds === 'number' && Number.isFinite(body.durationSeconds)))
        );
    }
    return true;
};

const recordTokenPlaceRelay = async (
    // Trust boundary: sessionId is server-verified from the signed HttpOnly cookie.
    sessionId: string,
    operation: string,
    payload: unknown,
    signal?: AbortSignal
) => {
    if (!TOKEN_PLACE_RELAY_OPERATIONS.has(operation)) {
        return Response.json({ error: 'unsupported_tokenplace_operation' }, { status: 400 });
    }
    if (!validateTokenPlaceRelayPayload(operation, payload)) {
        return Response.json({ error: 'invalid_tokenplace_payload' }, { status: 400 });
    }
    if (operation === 'complete') {
        // complete requires a correlation token proving that a rate-limited dispatch was
        // server-observed for this session. The token is atomically consumed (GETDEL) so
        // replayed or cross-session complete calls are rejected. Duration is derived from the
        // server-owned dispatch timestamp; client-supplied durationSeconds is ignored.
        const corrToken = (payload as Record<string, unknown>).correlationToken;
        const stored = await consumeCorrelationToken(sessionId, corrToken);
        if (!stored) {
            return Response.json(
                { error: 'invalid_or_expired_correlation_token' },
                { status: 400 }
            );
        }
        const durationSeconds = Math.max(0, (Date.now() - stored.startedAt) / 1000);
        const clientOutcome = String((payload as Record<string, unknown>).outcome || 'success');
        // Constrain outcome to the bounded enum; ignore unrecognized client values.
        const serverOutcome = normalizeOutcome(clientOutcome);
        recordDchatRequest({ provider: 'tokenplace', outcome: serverOutcome, durationSeconds });
        return Response.json({ ok: true });
    }
    // select and retrieve are polling sub-operations of a single logical chat. They have
    // separate bounded per-session budgets that are higher than the dispatch limit, to allow
    // normal polling without exhausting the logical-chat quota. complete is bounded by the
    // correlation token (one per dispatch), so it has no separate counter.
    if (operation === 'select' || operation === 'retrieve') {
        const subBudget = await consumeSubOperationBudget(sessionId, operation);
        if (subBudget.unavailable) {
            return Response.json({ error: 'chat_proxy_rate_limit_unavailable' }, { status: 503 });
        }
        if (!subBudget.allowed) {
            return Response.json({ error: 'chat_proxy_rate_limited' }, { status: 429 });
        }
    }
    const baseUrl = resolveTokenPlaceBaseUrl({
        url: process.env.DSPACE_TOKEN_PLACE_URL,
        state: {},
    });
    const dispatchStartedAt = Date.now();
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
        const responseHeaders = new Headers({
            'Content-Type': upstream.headers.get('content-type') || 'application/json',
        });
        if (operation === 'dispatch' && upstream.ok) {
            // Issue a correlation token so the client can later report a server-verified
            // complete. The token is stored in Redis with a short TTL and is never used as a
            // metric label or returned through /metrics.
            const corrToken = generateCorrelationToken();
            const stored = await storeCorrelationToken(sessionId, corrToken, dispatchStartedAt);
            if (stored) {
                responseHeaders.set('X-DSpace-Correlation-Token', corrToken);
            }
        } else if (operation === 'dispatch' && !upstream.ok) {
            // A failed dispatch is a terminal dChat outcome: no client-reported complete will
            // follow, so record the dChat failure now.
            const dchatOutcome = outcomeFromStatus(upstream.status);
            const durationSeconds = Math.max(0, (performance.now() - started) / 1000);
            recordDchatRequest({ provider: 'tokenplace', outcome: dchatOutcome, durationSeconds });
        }
        return new Response(text, { status: upstream.status, headers: responseHeaders });
    } catch {
        const durationSeconds = Math.max(0, (performance.now() - started) / 1000);
        recordDependencyRequest({
            dependency: 'tokenplace',
            outcome: 'dependency_failure',
            durationSeconds,
        });
        if (operation === 'dispatch') {
            // Network-level dispatch failure is a terminal dChat outcome.
            recordDchatRequest({
                provider: 'tokenplace',
                outcome: 'dependency_failure',
                durationSeconds,
            });
        }
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
        // HttpOnly session cookie minted by the SSR chat page only after explicit
        // operator usage authorization, and stay within bounded shared Redis-compatible
        // atomic rate limits before any provider dispatch. Browser-held OpenAI keys
        // are never accepted here; token.place relay requests may carry only routing fields and
        // ciphertext.
        if (!isSameOriginRequest(request)) {
            return Response.json({ error: 'chat_proxy_unauthorized' }, { status: 403 });
        }
        const sessionId = verifyChatProxySessionCookie(
            readCookie(request, CHAT_PROXY_SESSION_COOKIE)
        );
        if (!sessionId) {
            return Response.json({ error: 'chat_proxy_unauthorized' }, { status: 403 });
        }
        // Parse the body before rate-limiting so that oversized or malformed requests are
        // rejected without consuming a rate-limit token.
        const body = await readBoundedJson(request);
        const provider = String(body?.provider || '').toLowerCase();
        const operation = String(body?.operation || '').toLowerCase();
        // For token.place, only dispatch initiates an expensive model call; select, retrieve,
        // and complete are sub-operations of a single logical chat. The main session quota
        // applies only to dispatch (and all OpenAI requests). select and retrieve have separate
        // per-operation budgets in recordTokenPlaceRelay; complete is bounded by the correlation
        // token (one per dispatch), which also prevents unlimited complete calls.
        const isRateLimitedOperation = provider !== 'tokenplace' || operation === 'dispatch';
        if (isRateLimitedOperation) {
            const rateLimit = await consumeRateLimit(sessionId);
            if (rateLimit.unavailable) {
                return Response.json(
                    { error: 'chat_proxy_rate_limit_unavailable' },
                    { status: 503 }
                );
            }
            if (!rateLimit.allowed) {
                return Response.json({ error: 'chat_proxy_rate_limited' }, { status: 429 });
            }
        }
        if (provider === 'tokenplace') {
            // token.place browser traffic keeps encryption and private keys client-side; this
            // boundary forwards only routing fields or ciphertext so server metrics can observe
            // actual relay attempts without receiving prompts, inventory, game state, credentials,
            // or relay private keys. sessionId is passed so correlation tokens are session-bound.
            return recordTokenPlaceRelay(
                sessionId,
                String(body?.operation || ''),
                body?.payload,
                request.signal
            );
        }
        if (provider !== 'openai') {
            return Response.json({ error: 'unsupported_provider' }, { status: 400 });
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
        const messages = Array.isArray(body?.messages) ? body.messages : [];
        const persona = resolvePersonaOption(body?.options?.personaId);
        // Do not accept browser-held game state or credentials here. token.place plaintext and
        // private keys stay browser-side; only ciphertext relay traffic may cross this server.
        const result = await GPT5ChatV2(messages, {
            serverChatProxy: true,
            serverOpenAIApiKey,
            ...(persona ? { persona } : {}),
        });
        return Response.json(result);
    } catch (error) {
        const payload = sanitizeError(error);
        const status = Number(payload.status);
        return Response.json(payload, { status: Number.isFinite(status) ? status : 500 });
    }
}
