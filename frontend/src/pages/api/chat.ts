import { GPT5ChatV2 } from '../../utils/openAI.js';
import {
    CHAT_PROXY_SESSION_COOKIE,
    verifyChatProxySessionCookie,
} from '../../utils/runtimeEndpoints';

export const prerender = false;

const MAX_BODY_BYTES = 64 * 1024;

const getServerOpenAIKey = () =>
    process.env.OPENAI_API_KEY || process.env.DSPACE_OPENAI_API_KEY || ''; // scan-secrets: ignore

const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX = 20;
const rateLimitBuckets = new Map<string, { count: number; resetAt: number }>();

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

const consumeRateLimit = (sessionId: string, now = Date.now()) => {
    const bucket = rateLimitBuckets.get(sessionId);
    if (!bucket || bucket.resetAt <= now) {
        rateLimitBuckets.set(sessionId, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
        return true;
    }
    if (bucket.count >= RATE_LIMIT_MAX) return false;
    bucket.count += 1;
    return true;
};

export const resetChatProxyRateLimitForTests = () => rateLimitBuckets.clear();

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
        // rate limit. Browser-held OpenAI keys and token.place relay secrets are never accepted here.
        if (!isSameOriginRequest(request)) {
            return Response.json({ error: 'chat_proxy_unauthorized' }, { status: 403 });
        }
        const sessionId = verifyChatProxySessionCookie(
            readCookie(request, CHAT_PROXY_SESSION_COOKIE)
        );
        if (!sessionId) {
            return Response.json({ error: 'chat_proxy_unauthorized' }, { status: 403 });
        }
        if (!consumeRateLimit(sessionId)) {
            return Response.json({ error: 'chat_proxy_rate_limited' }, { status: 429 });
        }
        const body = await readBoundedJson(request);
        const provider = String(body?.provider || '').toLowerCase();
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
        // Do not accept browser-held game state or credentials here. token.place stays entirely
        // browser-side so relay plaintext and private keys never cross into DSPACE server handling.
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
