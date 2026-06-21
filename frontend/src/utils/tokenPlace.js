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
const DEFAULT_CHAT_MODEL = 'llama-3.1-8b-instruct';
const DEFAULT_POLL_INTERVAL_MS = 25;
const DEFAULT_TIMEOUT_MS = 30_000;
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

const getCrypto = () => {
    const crypto = globalThis.crypto;
    if (!crypto?.subtle) {
        throw createMalformedTokenPlaceResponseError(
            'token.place relay E2EE requires Web Crypto support.'
        );
    }
    return crypto;
};

const encodeUtf8 = (value) => new TextEncoder().encode(value);
const decodeUtf8 = (value) => new TextDecoder().decode(value);

const toBase64 = (bytes) => {
    const binary = Array.from(new Uint8Array(bytes), (byte) => String.fromCharCode(byte)).join('');
    if (typeof btoa === 'function') return btoa(binary);
    return Buffer.from(binary, 'binary').toString('base64');
};

const fromBase64 = (value) => {
    const normalized = String(value || '').replace(/\s+/g, '');
    const binary =
        typeof atob === 'function'
            ? atob(normalized)
            : Buffer.from(normalized, 'base64').toString('binary');
    return Uint8Array.from(binary, (char) => char.charCodeAt(0));
};

const pemToBinary = (pem) => fromBase64(String(pem).replace(/-----[^-]+-----/g, ''));

const binaryToPem = (label, bytes) => {
    const base64 =
        toBase64(bytes)
            .match(/.{1,64}/g)
            ?.join('\n') || '';
    return `-----BEGIN ${label}-----\n${base64}\n-----END ${label}-----`;
};

const isPem = (value) => /-----BEGIN [^-]+-----/.test(String(value || ''));

export const normalizeTokenPlacePublicKey = (value) => {
    const raw = String(value || '').trim();
    if (!raw) {
        throw createMalformedTokenPlaceResponseError(
            'token.place relay server is missing a public key.'
        );
    }
    if (isPem(raw)) return toBase64(encodeUtf8(raw));
    const decoded = decodeUtf8(fromBase64(raw));
    return isPem(decoded) ? toBase64(encodeUtf8(decoded)) : raw.replace(/\s+/g, '');
};

const decodePublicKeyPemBase64 = (value) => {
    const text = decodeUtf8(fromBase64(normalizeTokenPlacePublicKey(value)));
    if (!isPem(text)) {
        throw createMalformedTokenPlaceResponseError('Malformed token.place public key.');
    }
    return text;
};

export const generateTokenPlaceClientKeypair = async () => {
    const crypto = getCrypto();
    const keyPair = await crypto.subtle.generateKey(
        {
            name: 'RSA-OAEP',
            modulusLength: 2048,
            publicExponent: new Uint8Array([1, 0, 1]),
            hash: 'SHA-256',
        },
        true,
        ['encrypt', 'decrypt']
    );
    const spki = await crypto.subtle.exportKey('spki', keyPair.publicKey);
    const publicKeyPem = binaryToPem('PUBLIC KEY', spki);
    return {
        ...keyPair,
        publicKeyPem,
        publicKey: toBase64(encodeUtf8(publicKeyPem)),
    };
};

export const encryptTokenPlaceEnvelope = async (envelope, serverPublicKeyBase64) => {
    const crypto = getCrypto();
    const publicKey = await crypto.subtle.importKey(
        'spki',
        pemToBinary(decodePublicKeyPemBase64(serverPublicKeyBase64)),
        { name: 'RSA-OAEP', hash: 'SHA-256' },
        false,
        ['encrypt']
    );
    const aesKey = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, [
        'encrypt',
        'decrypt',
    ]);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const ciphertext = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        aesKey,
        encodeUtf8(JSON.stringify(envelope))
    );
    const rawAesKey = await crypto.subtle.exportKey('raw', aesKey);
    const cipherkey = await crypto.subtle.encrypt({ name: 'RSA-OAEP' }, publicKey, rawAesKey);
    return { ciphertext: toBase64(ciphertext), cipherkey: toBase64(cipherkey), iv: toBase64(iv) };
};

export const decryptTokenPlaceEnvelope = async (payload, privateKey) => {
    const crypto = getCrypto();
    const rawAesKey = await crypto.subtle.decrypt(
        { name: 'RSA-OAEP' },
        privateKey,
        fromBase64(payload?.cipherkey)
    );
    const aesKey = await crypto.subtle.importKey('raw', rawAesKey, { name: 'AES-GCM' }, false, [
        'decrypt',
    ]);
    const plaintext = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: fromBase64(payload?.iv) },
        aesKey,
        fromBase64(payload?.ciphertext)
    );
    try {
        return JSON.parse(decodeUtf8(plaintext));
    } catch {
        throw createMalformedTokenPlaceResponseError('Malformed token.place relay response JSON.');
    }
};

const randomId = () => {
    const bytes = getCrypto().getRandomValues(new Uint8Array(16));
    return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
};

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

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

const fetchJson = async (url, init) => {
    let response;
    try {
        response = await fetch(url, {
            ...init,
            headers: { 'Content-Type': 'application/json', ...(init.headers || {}) },
            credentials: 'omit',
        });
    } catch (error) {
        throw createTokenPlaceNetworkError(error);
    }
    return response;
};

export const selectTokenPlaceRelayServer = async (baseUrl, options = {}) => {
    const response = await fetchJson(`${baseUrl}${RELAY_SERVERS_NEXT_PATH}`, {
        method: 'GET',
        signal: options.signal,
    });
    if (response.status === 404 || response.status === 410) {
        throw createTokenPlaceHttpError(
            response.status,
            { message: 'No token.place compute node is available.' },
            response.statusText
        );
    }
    if (!response.ok) {
        throw createTokenPlaceHttpError(
            response.status,
            await parseErrorPayload(response),
            response.statusText
        );
    }
    const data = await response.json();
    const serverPublicKey = normalizeTokenPlacePublicKey(data.server_public_key || data.public_key);
    return { ...data, server_public_key: serverPublicKey };
};

const dispatchTokenPlaceRelayRequest = async (baseUrl, payload, options = {}) => {
    const response = await fetchJson(`${baseUrl}${RELAY_REQUESTS_PATH}`, {
        method: 'POST',
        body: JSON.stringify(payload),
        signal: options.signal,
    });
    if (!response.ok) {
        throw createTokenPlaceHttpError(
            response.status,
            await parseErrorPayload(response),
            response.statusText
        );
    }
    return response;
};

const cancelTokenPlaceRelayRequest = async (baseUrl, payload, options = {}) => {
    if (!payload.cancel_token) return;
    try {
        await fetchJson(`${baseUrl}${RELAY_REQUESTS_CANCEL_PATH}`, {
            method: 'POST',
            body: JSON.stringify({
                client_public_key: payload.client_public_key,
                request_id: payload.request_id,
                cancel_token: payload.cancel_token,
            }),
            signal: options.signal,
        });
    } catch {
        // Best-effort cleanup only; preserve the timeout error for callers.
    }
};

export const validateTokenPlaceResponseEnvelope = (envelope, expected) => {
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
    if (envelope?.request_id !== expected.request_id) {
        throw createMalformedTokenPlaceResponseError(
            'Malformed token.place relay response: request mismatch.'
        );
    }
    if (envelope?.client_public_key !== expected.client_public_key) {
        throw createMalformedTokenPlaceResponseError(
            'Malformed token.place relay response: client key mismatch.'
        );
    }
    if (!envelope?.api_v1_response) {
        throw createMalformedTokenPlaceResponseError(
            'Malformed token.place relay response: missing API response.'
        );
    }
    return envelope.api_v1_response;
};

const retrieveTokenPlaceRelayResponse = async (baseUrl, requestPayload, keyPair, options = {}) => {
    const startedAt = Date.now();
    const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    const pollIntervalMs = options.pollIntervalMs ?? DEFAULT_POLL_INTERVAL_MS;

    while (Date.now() - startedAt < timeoutMs) {
        const response = await fetchJson(`${baseUrl}${RELAY_RESPONSES_RETRIEVE_PATH}`, {
            method: 'POST',
            body: JSON.stringify({
                client_public_key: requestPayload.client_public_key,
                request_id: requestPayload.request_id,
            }),
            signal: options.signal,
        });

        if (response.status === 202) {
            await delay(pollIntervalMs);
            continue;
        }
        if (response.status === 404 || response.status === 410) {
            const errorPayload = await parseErrorPayload(response);
            errorPayload.error = {
                ...(errorPayload.error || {}),
                code: 'selected_server_disconnected',
            };
            throw createTokenPlaceHttpError(response.status, errorPayload, response.statusText);
        }
        if (!response.ok) {
            throw createTokenPlaceHttpError(
                response.status,
                await parseErrorPayload(response),
                response.statusText
            );
        }
        const encryptedResponse = await response.json();
        const envelope = await decryptTokenPlaceEnvelope(encryptedResponse, keyPair.privateKey);
        return validateTokenPlaceResponseEnvelope(envelope, requestPayload);
    }

    await cancelTokenPlaceRelayRequest(baseUrl, requestPayload, options);
    throw createTokenPlaceHttpError(
        408,
        { message: 'token.place relay response timed out.' },
        'Request Timeout'
    );
};

const buildRelayPayload = async ({
    keyPair,
    server,
    promptPayload,
    requestId,
    cancelToken,
    options,
}) => {
    const encryptedEnvelope = await encryptTokenPlaceEnvelope(
        {
            protocol: RELAY_PROTOCOL,
            version: RELAY_VERSION,
            request_id: requestId,
            client_public_key: keyPair.publicKey,
            api_v1_request: {
                model: getTokenPlaceChatModel(options),
                messages: sanitizeTokenPlaceMessages(promptPayload.combinedMessages),
                options: {},
                metadata: buildTokenPlaceMetadata(options.metadata),
            },
        },
        server.server_public_key
    );

    return {
        server_public_key: server.server_public_key,
        client_public_key: keyPair.publicKey,
        request_id: requestId,
        protocol: RELAY_PROTOCOL,
        version: RELAY_VERSION,
        ...encryptedEnvelope,
        cancel_token: cancelToken,
    };
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
    const keyPair = options.keyPair || (await generateTokenPlaceClientKeypair());
    const requestId = options.requestId || randomId();
    const cancelToken = options.cancelToken || randomId();
    let server = await selectTokenPlaceRelayServer(baseUrl, options);
    let relayPayload = await buildRelayPayload({
        keyPair,
        server,
        promptPayload,
        requestId,
        cancelToken,
        options,
    });

    await dispatchTokenPlaceRelayRequest(baseUrl, relayPayload, options);
    let data;
    try {
        data = await retrieveTokenPlaceRelayResponse(baseUrl, relayPayload, keyPair, options);
    } catch (error) {
        if (
            error?.status === 404 ||
            error?.status === 410 ||
            error?.code === 'selected_server_disconnected'
        ) {
            server = await selectTokenPlaceRelayServer(baseUrl, options);
            relayPayload = await buildRelayPayload({
                keyPair,
                server,
                promptPayload,
                requestId,
                cancelToken,
                options,
            });
            await dispatchTokenPlaceRelayRequest(baseUrl, relayPayload, options);
            data = await retrieveTokenPlaceRelayResponse(baseUrl, relayPayload, keyPair, options);
        } else {
            throw error;
        }
    }

    const outputText = extractTokenPlaceAssistantText(data);
    const { text } = validateChatResponseText(outputText, { contextSources });

    return {
        text,
        contextSources,
        usage: data?.usage,
        metadata: data?.metadata,
    };
};

export const tokenPlaceChat = async (messages, options = {}) => {
    const result = await TokenPlaceChatV2(messages, options);
    return result.text;
};
