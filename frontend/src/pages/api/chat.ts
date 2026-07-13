import { GPT5ChatV2 } from '../../utils/openAI.js';

export const prerender = false;

const MAX_BODY_BYTES = 64 * 1024;

const getServerOpenAIKey = () =>
    process.env.OPENAI_API_KEY || process.env.DSPACE_OPENAI_API_KEY || ''; // scan-secrets: ignore

const getChatProxyToken = () => process.env.DSPACE_CHAT_PROXY_TOKEN || ''; // scan-secrets: ignore

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
        // Trust boundary: this endpoint spends the server OpenAI credential, so every request
        // must present a server-configured bearer-style token. Browser-held OpenAI keys and
        // token.place relay secrets are never accepted here.
        const expectedToken = getChatProxyToken(); // scan-secrets: ignore
        const suppliedToken = request.headers.get('x-dspace-chat-proxy-token') || ''; // scan-secrets: ignore
        if (!expectedToken || suppliedToken !== expectedToken) {
            return Response.json({ error: 'chat_proxy_unauthorized' }, { status: 403 });
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
