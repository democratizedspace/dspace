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
const DEFAULT_CHAT_MODEL = 'llama-3.1-8b-instruct';
const METADATA_DENY_PATTERN =
    /(?:key|token|secret|credential|password|authorization|auth|inventory|save|state|player)/i;
const VALID_CHAT_ROLES = new Set(['user', 'assistant', 'system']);
const DEFAULT_POLL_INTERVAL_MS = 250;
const DEFAULT_RELAY_TIMEOUT_MS = 30_000;
const RSA_ALGORITHM = { name: 'RSA-OAEP', hash: 'SHA-256' };
const AES_ALGORITHM = { name: 'AES-GCM', length: 256 };

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

const getCrypto = () => {
    const cryptoImpl = globalThis.crypto;
    if (!cryptoImpl?.subtle) {
        throw createMalformedTokenPlaceResponseError('token.place E2EE requires Web Crypto.');
    }
    return cryptoImpl;
};

const textEncoder = () => new TextEncoder();
const textDecoder = () => new TextDecoder();

const bytesToBase64 = (bytes) => {
    if (typeof btoa === 'function') {
        let binary = '';
        bytes.forEach((byte) => {
            binary += String.fromCharCode(byte);
        });
        return btoa(binary);
    }
    return Buffer.from(bytes).toString('base64');
};

const base64ToBytes = (value) => {
    if (typeof atob === 'function') {
        const binary = atob(value);
        return Uint8Array.from(binary, (char) => char.charCodeAt(0));
    }
    return Uint8Array.from(Buffer.from(value, 'base64'));
};

const arrayBufferToBase64 = (buffer) => bytesToBase64(new Uint8Array(buffer));
const base64ToArrayBuffer = (value) => base64ToBytes(value);

const pemToBase64Der = (pem) =>
    String(pem || '')
        .replace(/-----BEGIN [^-]+-----/g, '')
        .replace(/-----END [^-]+-----/g, '')
        .replace(/\s+/g, '');

const wrapPem = (base64Der, label) => {
    const chunks = String(base64Der || '').match(/.{1,64}/g) || [];
    return `-----BEGIN ${label}-----\n${chunks.join('\n')}\n-----END ${label}-----`;
};

export const normalizeRelayPublicKey = (value) => {
    const raw = String(value || '').trim();
    if (!raw) {
        throw createMalformedTokenPlaceResponseError(
            'token.place relay server is missing a public key.'
        );
    }

    let pem = raw;
    if (!/-----BEGIN PUBLIC KEY-----/.test(pem)) {
        try {
            const decoded = textDecoder().decode(base64ToBytes(raw));
            pem = /-----BEGIN PUBLIC KEY-----/.test(decoded) ? decoded : wrapPem(raw, 'PUBLIC KEY');
        } catch {
            pem = wrapPem(raw, 'PUBLIC KEY');
        }
    }

    const derBase64 = pemToBase64Der(pem);
    return {
        pem: wrapPem(derBase64, 'PUBLIC KEY'),
        base64: bytesToBase64(textEncoder().encode(wrapPem(derBase64, 'PUBLIC KEY'))),
        derBase64,
    };
};

const exportPublicKeyPem = async (publicKey) => {
    const der = await getCrypto().subtle.exportKey('spki', publicKey);
    return wrapPem(arrayBufferToBase64(der), 'PUBLIC KEY');
};

export const generateRelayClientKeyPair = async () => {
    const cryptoImpl = getCrypto();
    const keyPair = await cryptoImpl.subtle.generateKey(
        { ...RSA_ALGORITHM, modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]) },
        true,
        ['encrypt', 'decrypt']
    );
    const publicKeyPem = await exportPublicKeyPem(keyPair.publicKey);
    return {
        ...keyPair,
        publicKeyPem,
        publicKeyBase64: bytesToBase64(textEncoder().encode(publicKeyPem)),
    };
};

const importPublicKey = (pem) =>
    getCrypto().subtle.importKey(
        'spki',
        base64ToArrayBuffer(pemToBase64Der(pem)),
        RSA_ALGORITHM,
        false,
        ['encrypt']
    );

export const encryptRelayEnvelope = async (envelope, publicKeyPem) => {
    const cryptoImpl = getCrypto();
    const aesKey = await cryptoImpl.subtle.generateKey(AES_ALGORITHM, true, ['encrypt', 'decrypt']);
    const iv = cryptoImpl.getRandomValues(new Uint8Array(12));
    const ciphertext = await cryptoImpl.subtle.encrypt(
        { name: 'AES-GCM', iv },
        aesKey,
        textEncoder().encode(JSON.stringify(envelope))
    );
    const rawKey = await cryptoImpl.subtle.exportKey('raw', aesKey);
    const publicKey = await importPublicKey(publicKeyPem);
    const cipherkey = await cryptoImpl.subtle.encrypt(RSA_ALGORITHM, publicKey, rawKey);
    return {
        ciphertext: arrayBufferToBase64(ciphertext),
        cipherkey: arrayBufferToBase64(cipherkey),
        iv: bytesToBase64(iv),
    };
};

export const decryptRelayEnvelope = async (payload, privateKey) => {
    const cryptoImpl = getCrypto();
    const rawKey = await cryptoImpl.subtle.decrypt(
        RSA_ALGORITHM,
        privateKey,
        base64ToArrayBuffer(payload.cipherkey)
    );
    const aesKey = await cryptoImpl.subtle.importKey('raw', rawKey, AES_ALGORITHM, false, [
        'decrypt',
    ]);
    const plaintext = await cryptoImpl.subtle.decrypt(
        { name: 'AES-GCM', iv: base64ToBytes(payload.iv) },
        aesKey,
        base64ToArrayBuffer(payload.ciphertext)
    );
    return JSON.parse(textDecoder().decode(plaintext));
};

export const validateRelayResponseEnvelope = (envelope, { requestId, clientPublicKey }) => {
    if (envelope?.protocol !== RELAY_PROTOCOL) {
        throw createMalformedTokenPlaceResponseError(
            'Malformed token.place response: wrong protocol.'
        );
    }
    if (envelope?.version !== RELAY_VERSION) {
        throw createMalformedTokenPlaceResponseError(
            'Malformed token.place response: wrong version.'
        );
    }
    if (envelope?.request_id !== requestId) {
        throw createMalformedTokenPlaceResponseError(
            'Malformed token.place response: request mismatch.'
        );
    }
    if (envelope?.client_public_key !== clientPublicKey) {
        throw createMalformedTokenPlaceResponseError(
            'Malformed token.place response: client key mismatch.'
        );
    }
    if (!envelope?.api_v1_response) {
        throw createMalformedTokenPlaceResponseError(
            'Malformed token.place response: missing API response.'
        );
    }
    return envelope.api_v1_response;
};

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

const fetchJson = async (url, init) => {
    let response;
    try {
        response = await fetch(url, { ...init, credentials: 'omit' });
    } catch (error) {
        throw createTokenPlaceNetworkError(error);
    }
    return response;
};

export const selectRelayServer = async (baseUrl, options = {}) => {
    const response = await fetchJson(`${baseUrl}/api/v1/relay/servers/next`, {
        method: 'GET',
        signal: options.signal,
    });
    if (!response.ok) {
        const errorPayload = await parseErrorPayload(response);
        throw createTokenPlaceHttpError(response.status, errorPayload, response.statusText);
    }
    const data = await response.json();
    const publicKey = normalizeRelayPublicKey(data.server_public_key || data.public_key);
    return { ...data, server_public_key: publicKey.base64, publicKeyPem: publicKey.pem };
};

const isSelectedServerTerminalStatus = (status) =>
    status === 404 || status === 410 || status === 409;

const dispatchRelayRequest = async (baseUrl, body, options = {}) => {
    const response = await fetchJson(`${baseUrl}/api/v1/relay/requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: options.signal,
    });
    if (!response.ok) {
        const errorPayload = await parseErrorPayload(response);
        throw createTokenPlaceHttpError(response.status, errorPayload, response.statusText);
    }
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const cancelRelayRequest = async (baseUrl, cancelToken, options = {}) => {
    if (!cancelToken) return;
    try {
        await fetchJson(`${baseUrl}/api/v1/relay/requests/cancel`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cancel_token: cancelToken }),
            signal: options.signal,
        });
    } catch {
        // Best-effort cleanup only; preserve the original timeout/error for the user.
    }
};

const retrieveRelayResponse = async (baseUrl, body, options = {}) =>
    fetchJson(`${baseUrl}/api/v1/relay/responses/retrieve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: options.signal,
    });

const pollRelayResponse = async (baseUrl, body, privateKey, options = {}) => {
    const started = Date.now();
    const timeoutMs = options.timeoutMs ?? DEFAULT_RELAY_TIMEOUT_MS;
    const intervalMs = options.pollIntervalMs ?? DEFAULT_POLL_INTERVAL_MS;

    while (Date.now() - started < timeoutMs) {
        const response = await retrieveRelayResponse(baseUrl, body, options);
        if (response.status === 202) {
            await sleep(intervalMs);
            continue;
        }
        if (!response.ok) {
            const errorPayload = await parseErrorPayload(response);
            throw createTokenPlaceHttpError(response.status, errorPayload, response.statusText);
        }
        const data = await response.json();
        const encrypted = data.response || data;
        try {
            return await decryptRelayEnvelope(encrypted, privateKey);
        } catch (error) {
            throw createMalformedTokenPlaceResponseError(
                'Malformed token.place response: could not decrypt relay response.'
            );
        }
    }

    const timeoutError = new Error('token.place relay response timed out. Please try again.');
    timeoutError.type = 'timeout';
    throw timeoutError;
};

const randomId = (prefix) => {
    const bytes = getCrypto().getRandomValues(new Uint8Array(16));
    return `${prefix}_${bytesToBase64(bytes).replace(/[+/=]/g, '')}`;
};

const runRelayAttempt = async (baseUrl, promptPayload, clientKeys, options = {}) => {
    const server = await selectRelayServer(baseUrl, options);
    const requestId = options.requestId || randomId('dspace');
    const cancelToken = options.cancelToken || randomId('cancel');
    const safeMetadata = buildTokenPlaceMetadata(options.metadata);
    const apiRequest = {
        model: getTokenPlaceChatModel(options),
        messages: sanitizeTokenPlaceMessages(promptPayload.combinedMessages),
        options: {},
    };
    if (Object.keys(safeMetadata).length) {
        apiRequest.metadata = safeMetadata;
    }
    const plaintextEnvelope = {
        protocol: RELAY_PROTOCOL,
        version: RELAY_VERSION,
        request_id: requestId,
        client_public_key: clientKeys.publicKeyBase64,
        api_v1_request: apiRequest,
    };
    const encrypted = await encryptRelayEnvelope(plaintextEnvelope, server.publicKeyPem);
    const outerBody = {
        server_public_key: server.server_public_key,
        client_public_key: clientKeys.publicKeyBase64,
        request_id: requestId,
        protocol: RELAY_PROTOCOL,
        version: RELAY_VERSION,
        ...encrypted,
        cancel_token: cancelToken,
    };

    await dispatchRelayRequest(baseUrl, outerBody, options);
    try {
        const responseEnvelope = await pollRelayResponse(
            baseUrl,
            { client_public_key: clientKeys.publicKeyBase64, request_id: requestId },
            clientKeys.privateKey,
            options
        );
        return validateRelayResponseEnvelope(responseEnvelope, {
            requestId,
            clientPublicKey: clientKeys.publicKeyBase64,
        });
    } catch (error) {
        if (error?.type === 'timeout') {
            await cancelRelayRequest(baseUrl, cancelToken, options);
        }
        throw error;
    }
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
    const clientKeys = options.clientKeys || (await generateRelayClientKeyPair());

    let data;
    try {
        data = await runRelayAttempt(baseUrl, promptPayload, clientKeys, options);
    } catch (error) {
        if (isSelectedServerTerminalStatus(error?.status)) {
            data = await runRelayAttempt(baseUrl, promptPayload, clientKeys, {
                ...options,
                requestId: undefined,
                cancelToken: undefined,
            });
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
