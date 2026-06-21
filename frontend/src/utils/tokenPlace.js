import { loadGameState, ready } from './gameState/common.js';
import { buildChatPrompt, validateChatResponseText } from './openAI.js';
import {
    createMalformedTokenPlaceResponseError,
    createTokenPlaceHttpError,
    createTokenPlaceNetworkError,
} from './tokenPlaceErrors.js';

const DEFAULT_ORIGIN = 'https://token.place';
const CHAT_COMPLETIONS_PATH = '/api/v1/chat/completions';
const RELAY_PROTOCOL = 'tokenplace_api_v1_relay_e2ee';
const RELAY_VERSION = 1;
const RELAY_SERVERS_NEXT_PATH = '/api/v1/relay/servers/next';
const RELAY_REQUESTS_PATH = '/api/v1/relay/requests';
const RELAY_RESPONSES_RETRIEVE_PATH = '/api/v1/relay/responses/retrieve';
const RELAY_REQUESTS_CANCEL_PATH = '/api/v1/relay/requests/cancel';
const DEFAULT_RELAY_POLL_INTERVAL_MS = 250;
const DEFAULT_RELAY_TIMEOUT_MS = 30000;
const DEFAULT_CHAT_MODEL = 'llama-3.1-8b-instruct';
const METADATA_DENY_PATTERN =
    /(?:key|token|secret|credential|password|authorization|auth|inventory|save|state|player)/i;
const VALID_CHAT_ROLES = new Set(['user', 'assistant', 'system']);

const readEnvValue = (key) => {
    if (typeof import.meta !== 'undefined' && import.meta.env?.[key]) {
        return import.meta.env[key];
    }
    if (typeof process !== 'undefined' && process.env?.[key]) {
        return process.env[key];
    }
    return undefined;
};

const stripTrailingSlashes = (value) =>
    String(value || '')
        .trim()
        .replace(/\/+$/g, '');

const isPlainObject = (value) =>
    Boolean(value) &&
    typeof value === 'object' &&
    Object.getPrototypeOf(value) === Object.prototype;

export const resolveTokenPlaceBaseUrl = (options = {}) => {
    const state = options.state || loadGameState();
    const candidate =
        options.url ||
        options.runtimeUrl ||
        state?.tokenPlace?.url ||
        readEnvValue('VITE_TOKEN_PLACE_URL') ||
        DEFAULT_ORIGIN;
    let baseUrl = stripTrailingSlashes(candidate) || DEFAULT_ORIGIN;

    baseUrl = baseUrl.replace(/\/api\/v1\/chat\/completions$/i, '');
    baseUrl = baseUrl.replace(/\/api\/v1$/i, '');
    baseUrl = baseUrl.replace(/\/api$/i, '');

    return stripTrailingSlashes(baseUrl) || DEFAULT_ORIGIN;
};

export const buildTokenPlaceChatCompletionsUrl = (baseUrl) =>
    `${resolveTokenPlaceBaseUrl({ url: baseUrl })}${CHAT_COMPLETIONS_PATH}`;

export const getTokenPlaceChatModel = (options = {}) =>
    String(
        options.model ||
            options.runtimeModel ||
            readEnvValue('VITE_TOKEN_PLACE_CHAT_MODEL') ||
            DEFAULT_CHAT_MODEL
    ).trim() || DEFAULT_CHAT_MODEL;

const sanitizeChatMessage = (message) => ({
    role: VALID_CHAT_ROLES.has(message?.role) ? message.role : 'user',
    content:
        typeof message?.content === 'string' ? message.content : String(message?.content || ''),
});

export const sanitizeTokenPlaceMessages = (messages = []) =>
    (Array.isArray(messages) ? messages : []).map(sanitizeChatMessage);

const sanitizeMetadataValue = (value) => {
    if (typeof value === 'string') return value.slice(0, 200);
    if (typeof value === 'number' || typeof value === 'boolean') return value;
    return undefined;
};

export const buildTokenPlaceMetadata = (metadata = {}) => {
    const safeMetadata = {};

    if (isPlainObject(metadata)) {
        Object.entries(metadata).forEach(([key, value]) => {
            if (!key || METADATA_DENY_PATTERN.test(key)) return;
            const safeValue = sanitizeMetadataValue(value);
            if (safeValue !== undefined) {
                safeMetadata[key] = safeValue;
            }
        });
    }

    return {
        ...safeMetadata,
        client: 'dspace',
        provider: 'token.place',
    };
};

export const extractTokenPlaceAssistantText = (response) => {
    const content = response?.choices?.[0]?.message?.content;
    if (typeof content !== 'string' || !content.trim()) {
        throw createMalformedTokenPlaceResponseError(
            'Malformed token.place response: missing assistant content.'
        );
    }
    return content;
};

const parseErrorPayload = async (response) => {
    try {
        return await response.json();
    } catch {
        try {
            return { message: await response.text() };
        } catch {
            return { message: response.statusText };
        }
    }
};

const getCrypto = () => {
    const cryptoImpl = globalThis.crypto;
    if (!cryptoImpl?.subtle) {
        throw createMalformedTokenPlaceResponseError(
            'token.place relay E2EE requires browser Web Crypto support.'
        );
    }
    return cryptoImpl;
};

const bytesToBase64 = (bytes) => {
    const binary = Array.from(new Uint8Array(bytes), (byte) => String.fromCharCode(byte)).join('');
    if (typeof btoa === 'function') return btoa(binary);
    return Buffer.from(binary, 'binary').toString('base64');
};

const base64ToBytes = (value) => {
    const normalized = String(value || '').replace(/\s+/g, '');
    const binary =
        typeof atob === 'function'
            ? atob(normalized)
            : Buffer.from(normalized, 'base64').toString('binary');
    return Uint8Array.from(binary, (char) => char.charCodeAt(0));
};

const textToBytes = (value) => new TextEncoder().encode(value);
const bytesToText = (value) => new TextDecoder().decode(value);

const pemBody = (pem) =>
    String(pem || '')
        .replace(/-----BEGIN [^-]+-----/g, '')
        .replace(/-----END [^-]+-----/g, '')
        .replace(/\s+/g, '');

const base64ToPem = (base64, label) => {
    const body = String(base64 || '').replace(/\s+/g, '');
    const lines = body.match(/.{1,64}/g)?.join('\n') || body;
    return `-----BEGIN ${label}-----\n${lines}\n-----END ${label}-----`;
};

export const normalizeTokenPlacePublicKey = (value) => {
    const raw = String(value || '').trim();
    if (!raw) {
        throw createMalformedTokenPlaceResponseError(
            'token.place relay server did not provide a public key.'
        );
    }
    if (raw.includes('-----BEGIN PUBLIC KEY-----')) {
        return { pem: raw, base64: bytesToBase64(textToBytes(raw)) };
    }
    const decoded = (() => {
        try {
            return bytesToText(base64ToBytes(raw));
        } catch {
            return '';
        }
    })();
    if (decoded.includes('-----BEGIN PUBLIC KEY-----')) {
        return { pem: decoded.trim(), base64: raw.replace(/\s+/g, '') };
    }
    return { pem: base64ToPem(raw, 'PUBLIC KEY'), base64: raw.replace(/\s+/g, '') };
};

const exportPublicKeyPem = async (publicKey) =>
    base64ToPem(bytesToBase64(await getCrypto().subtle.exportKey('spki', publicKey)), 'PUBLIC KEY');

export const generateTokenPlaceClientKeyPair = async () => {
    const { subtle } = getCrypto();
    const keyPair = await subtle.generateKey(
        {
            name: 'RSA-OAEP',
            modulusLength: 2048,
            publicExponent: new Uint8Array([1, 0, 1]),
            hash: 'SHA-256',
        },
        true,
        ['encrypt', 'decrypt']
    );
    const publicKeyPem = await exportPublicKeyPem(keyPair.publicKey);
    return {
        ...keyPair,
        publicKeyPem,
        publicKeyBase64: bytesToBase64(textToBytes(publicKeyPem)),
    };
};

const importRsaPublicKey = (publicKeyPem) =>
    getCrypto().subtle.importKey(
        'spki',
        base64ToBytes(pemBody(publicKeyPem)),
        { name: 'RSA-OAEP', hash: 'SHA-256' },
        false,
        ['encrypt']
    );

export const encryptTokenPlaceEnvelope = async (envelope, publicKeyPem) => {
    const cryptoImpl = getCrypto();
    const aesKey = await cryptoImpl.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, [
        'encrypt',
        'decrypt',
    ]);
    const iv = cryptoImpl.getRandomValues(new Uint8Array(12));
    const ciphertext = await cryptoImpl.subtle.encrypt(
        { name: 'AES-GCM', iv },
        aesKey,
        textToBytes(JSON.stringify(envelope))
    );
    const rawAesKey = await cryptoImpl.subtle.exportKey('raw', aesKey);
    const rsaKey = await importRsaPublicKey(publicKeyPem);
    const cipherkey = await cryptoImpl.subtle.encrypt({ name: 'RSA-OAEP' }, rsaKey, rawAesKey);
    return {
        ciphertext: bytesToBase64(ciphertext),
        cipherkey: bytesToBase64(cipherkey),
        iv: bytesToBase64(iv),
    };
};

export const decryptTokenPlaceEnvelope = async (payload, privateKey) => {
    const { subtle } = getCrypto();
    const rawAesKey = await subtle.decrypt(
        { name: 'RSA-OAEP' },
        privateKey,
        base64ToBytes(payload?.cipherkey)
    );
    const aesKey = await subtle.importKey('raw', rawAesKey, { name: 'AES-GCM' }, false, [
        'decrypt',
    ]);
    const plaintext = await subtle.decrypt(
        { name: 'AES-GCM', iv: base64ToBytes(payload?.iv) },
        aesKey,
        base64ToBytes(payload?.ciphertext)
    );
    return JSON.parse(bytesToText(plaintext));
};

export const validateTokenPlaceRelayResponseEnvelope = (envelope, expected) => {
    if (envelope?.protocol !== RELAY_PROTOCOL) {
        throw createMalformedTokenPlaceResponseError(
            'Malformed token.place relay response: wrong protocol.'
        );
    }
    if (envelope?.version !== RELAY_VERSION) {
        throw createMalformedTokenPlaceResponseError(
            'Malformed token.place relay response: wrong version.'
        );
    }
    if (envelope?.request_id !== expected.requestId) {
        throw createMalformedTokenPlaceResponseError(
            'Malformed token.place relay response: wrong request id.'
        );
    }
    if (envelope?.client_public_key !== expected.clientPublicKey) {
        throw createMalformedTokenPlaceResponseError(
            'Malformed token.place relay response: wrong client key.'
        );
    }
    if (!envelope?.api_v1_response) {
        throw createMalformedTokenPlaceResponseError(
            'Malformed token.place relay response: missing API v1 response.'
        );
    }
    return envelope.api_v1_response;
};

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const randomRelayId = () => {
    const bytes = getCrypto().getRandomValues(new Uint8Array(16));
    return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
};

const relayFetchJson = async (url, init, unavailableMessage = 'token.place relay unavailable') => {
    let response;
    try {
        response = await fetch(url, { credentials: 'omit', ...init });
    } catch (error) {
        throw createTokenPlaceNetworkError(error);
    }
    if (!response.ok && response.status !== 202) {
        const payload = await parseErrorPayload(response);
        throw createTokenPlaceHttpError(
            response.status,
            payload,
            response.statusText || unavailableMessage
        );
    }
    return response;
};

export const selectTokenPlaceRelayServer = async (baseUrl, options = {}) => {
    const response = await relayFetchJson(`${baseUrl}${RELAY_SERVERS_NEXT_PATH}`, {
        method: 'GET',
        signal: options.signal,
    });
    const server = await response.json();
    const publicKey = normalizeTokenPlacePublicKey(server?.server_public_key || server?.public_key);
    return { ...server, server_public_key: publicKey.base64, serverPublicKeyPem: publicKey.pem };
};

const cancelRelayRequest = async (baseUrl, cancelToken, signal) => {
    if (!cancelToken) return;
    try {
        await fetch(`${baseUrl}${RELAY_REQUESTS_CANCEL_PATH}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cancel_token: cancelToken }),
            signal,
            credentials: 'omit',
        });
    } catch {
        // Best-effort timeout cleanup; preserve the original timeout error for callers.
    }
};

const retrieveRelayResponse = async (baseUrl, clientPublicKey, requestId, options = {}) => {
    const startedAt = Date.now();
    const timeoutMs = options.timeoutMs ?? DEFAULT_RELAY_TIMEOUT_MS;
    const pollIntervalMs = options.pollIntervalMs ?? DEFAULT_RELAY_POLL_INTERVAL_MS;
    while (Date.now() - startedAt < timeoutMs) {
        const response = await relayFetchJson(`${baseUrl}${RELAY_RESPONSES_RETRIEVE_PATH}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ client_public_key: clientPublicKey, request_id: requestId }),
            signal: options.signal,
        });
        if (response.status !== 202) return response.json();
        await delay(pollIntervalMs);
    }
    throw createTokenPlaceHttpError(
        408,
        { message: 'Timed out waiting for token.place relay response.' },
        'Timeout'
    );
};

export const TokenPlaceChatV2 = async (messages, options = {}) => {
    await ready;
    const promptPayload = options.promptPayload || (await buildChatPrompt(messages, options));
    const contextSources = Array.isArray(promptPayload.contextSources)
        ? promptPayload.contextSources
        : [];
    const baseUrl = resolveTokenPlaceBaseUrl({
        url: options.url,
        state: promptPayload.gameState,
        runtimeUrl: options.runtimeUrl,
    });

    const clientKeys = await (options.generateClientKeyPair || generateTokenPlaceClientKeyPair)();
    const clientPublicKey = clientKeys.publicKeyBase64;
    const requestId = options.requestId || randomRelayId();
    const cancelToken = options.cancelToken || randomRelayId();
    const requestBody = {
        protocol: RELAY_PROTOCOL,
        version: RELAY_VERSION,
        request_id: requestId,
        client_public_key: clientPublicKey,
        api_v1_request: {
            model: getTokenPlaceChatModel(options),
            messages: sanitizeTokenPlaceMessages(promptPayload.combinedMessages),
            options: {},
        },
    };
    const metadata = buildTokenPlaceMetadata(options.metadata);
    if (Object.keys(metadata).length > 0) {
        requestBody.api_v1_request.metadata = metadata;
    }

    const maxAttempts = options.maxServerAttempts ?? 2;
    let lastError;
    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
        let server;
        try {
            server = await selectTokenPlaceRelayServer(baseUrl, { signal: options.signal });
            const encrypted = await (options.encryptEnvelope || encryptTokenPlaceEnvelope)(
                requestBody,
                server.serverPublicKeyPem
            );
            const outerBody = {
                server_public_key: server.server_public_key,
                client_public_key: clientPublicKey,
                request_id: requestId,
                protocol: RELAY_PROTOCOL,
                version: RELAY_VERSION,
                ...encrypted,
                cancel_token: cancelToken,
            };
            const dispatch = await relayFetchJson(`${baseUrl}${RELAY_REQUESTS_PATH}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(outerBody),
                signal: options.signal,
            });
            if (dispatch.status === 202 || dispatch.ok) {
                const encryptedResponse = await retrieveRelayResponse(
                    baseUrl,
                    clientPublicKey,
                    requestId,
                    options
                );
                const responseEnvelope = await (
                    options.decryptEnvelope || decryptTokenPlaceEnvelope
                )(encryptedResponse, clientKeys.privateKey);
                const data = validateTokenPlaceRelayResponseEnvelope(responseEnvelope, {
                    requestId,
                    clientPublicKey,
                });
                const outputText = extractTokenPlaceAssistantText(data);
                const { text } = validateChatResponseText(outputText, { contextSources });
                return { text, contextSources, usage: data?.usage, metadata: data?.metadata };
            }
        } catch (error) {
            lastError = error;
            if (error?.status === 408) {
                await cancelRelayRequest(baseUrl, cancelToken, options.signal);
                throw error;
            }
            if (![404, 410, 409].includes(error?.status) || attempt === maxAttempts - 1) {
                throw error;
            }
        }
    }
    throw lastError;
};

export const tokenPlaceChat = async (messages, options = {}) => {
    const result = await TokenPlaceChatV2(messages, options);
    return result.text;
};
