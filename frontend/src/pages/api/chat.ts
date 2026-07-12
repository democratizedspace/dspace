import { GPT5ChatV2 } from '../../utils/openAI.js';
import { TokenPlaceChatV2 } from '../../utils/tokenPlace.js';

export const prerender = false;

const MAX_BODY_BYTES = 256 * 1024;
const PROVIDERS = new Set(['openai', 'token-place', 'tokenplace']);

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
        const body = await readBoundedJson(request);
        const provider = String(body?.provider || '').toLowerCase();
        if (!PROVIDERS.has(provider)) {
            return Response.json({ error: 'invalid_provider' }, { status: 400 });
        }
        const messages = Array.isArray(body?.messages) ? body.messages : [];
        const options = body?.options && typeof body.options === 'object' ? body.options : {};
        const result =
            provider === 'openai'
                ? await GPT5ChatV2(messages, options)
                : await TokenPlaceChatV2(messages, options);
        return Response.json(result);
    } catch (error) {
        const payload = sanitizeError(error);
        const status = Number(payload.status);
        return Response.json(payload, { status: Number.isFinite(status) ? status : 500 });
    }
}
