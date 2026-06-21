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
const DEFAULT_RELAY_TIMEOUT_MS = 30_000;
const DEFAULT_RELAY_POLL_INTERVAL_MS = 500;
const METADATA_DENY_PATTERN =
    /(?:key|token|secret|credential|password|authorization|auth|inventory|save|state|player)/i;
const VALID_CHAT_ROLES = new Set(['user', 'assistant', 'system']);

const getCrypto = () => globalThis.crypto;
const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

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

const getStructuredApiErrorStatus = (apiResponse) => {
    const candidates = [
        apiResponse?.error?.status,
        apiResponse?.error?.status_code,
        apiResponse?.status,
        apiResponse?.status_code,
    ];
    const status = candidates
        .map((candidate) => Number(candidate))
        .find((candidate) => Number.isInteger(candidate) && candidate >= 400 && candidate <= 599);
    return status ?? 400;
};

const throwStructuredTokenPlaceApiError = (apiResponse) => {
    if (!apiResponse?.error || typeof apiResponse.error !== 'object') return;
    throw createTokenPlaceHttpError(getStructuredApiErrorStatus(apiResponse), {
        error: apiResponse.error,
    });
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

const toUint8Array = (bytes) => {
    if (bytes instanceof Uint8Array) return bytes;
    if (bytes instanceof ArrayBuffer) return new Uint8Array(bytes);
    if (ArrayBuffer.isView(bytes)) {
        return new Uint8Array(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    }
    return new Uint8Array(bytes);
};

const bytesToBase64 = (bytes) => {
    const array = toUint8Array(bytes);
    if (typeof Buffer !== 'undefined') {
        return Buffer.from(array).toString('base64');
    }
    let binary = '';
    const chunkSize = 0x8000;
    for (let i = 0; i < array.length; i += chunkSize) {
        const chunk = array.subarray(i, i + chunkSize);
        binary += String.fromCharCode.apply(null, chunk);
    }
    return btoa(binary);
};

const base64ToBytes = (value) => {
    if (typeof Buffer !== 'undefined') {
        return new Uint8Array(Buffer.from(String(value), 'base64'));
    }
    return Uint8Array.from(atob(value), (char) => char.charCodeAt(0));
};
const pemToBase64 = (pem) =>
    String(pem).replace(/-----BEGIN [^-]+-----|-----END [^-]+-----|\s+/g, '');
const base64ToPem = (base64, label = 'PUBLIC KEY') => {
    const lines = String(base64).match(/.{1,64}/g) || [];
    return `-----BEGIN ${label}-----\n${lines.join('\n')}\n-----END ${label}-----`;
};

export const normalizeTokenPlacePublicKey = (value) => {
    const raw = String(value || '').trim();
    if (!raw)
        throw createMalformedTokenPlaceResponseError(
            'token.place relay server is missing a public key.'
        );
    if (/-----BEGIN [^-]+-----/.test(raw)) {
        return { pem: raw, base64: bytesToBase64(textEncoder.encode(raw)) };
    }
    const decoded = textDecoder.decode(base64ToBytes(raw));
    if (/-----BEGIN [^-]+-----/.test(decoded)) {
        return { pem: decoded, base64: raw };
    }
    return { pem: base64ToPem(raw), base64: bytesToBase64(textEncoder.encode(base64ToPem(raw))) };
};

const importRsaPublicKey = async (pem) =>
    getCrypto().subtle.importKey(
        'spki',
        base64ToBytes(pemToBase64(pem)),
        { name: 'RSA-OAEP', hash: 'SHA-256' },
        true,
        ['encrypt']
    );

const importRsaPrivateKey = async (base64Pkcs8) =>
    getCrypto().subtle.importKey(
        'pkcs8',
        base64ToBytes(base64Pkcs8),
        { name: 'RSA-OAEP', hash: 'SHA-256' },
        true,
        ['decrypt']
    );

export const generateTokenPlaceClientKeypair = async () => {
    const pair = await getCrypto().subtle.generateKey(
        {
            name: 'RSA-OAEP',
            modulusLength: 2048,
            publicExponent: new Uint8Array([1, 0, 1]),
            hash: 'SHA-256',
        },
        true,
        ['encrypt', 'decrypt']
    );
    const spki = await getCrypto().subtle.exportKey('spki', pair.publicKey);
    const pkcs8 = await getCrypto().subtle.exportKey('pkcs8', pair.privateKey);
    const publicPem = base64ToPem(bytesToBase64(spki));
    return {
        publicKey: pair.publicKey,
        privateKey: pair.privateKey,
        publicKeyPem: publicPem,
        publicKeyBase64: bytesToBase64(textEncoder.encode(publicPem)),
        privateKeyBase64: bytesToBase64(pkcs8),
    };
};

export const encryptTokenPlaceEnvelope = async (envelope, serverPublicKeyPem) => {
    const crypto = getCrypto();
    const aesKey = await crypto.subtle.generateKey({ name: 'AES-CBC', length: 256 }, true, [
        'encrypt',
    ]);
    const rawAesKey = await crypto.subtle.exportKey('raw', aesKey);
    const encodedAesKey = textEncoder.encode(bytesToBase64(rawAesKey));
    const iv = crypto.getRandomValues(new Uint8Array(16));
    const ciphertext = await crypto.subtle.encrypt(
        { name: 'AES-CBC', iv },
        aesKey,
        textEncoder.encode(JSON.stringify(envelope))
    );
    const serverKey = await importRsaPublicKey(serverPublicKeyPem);
    const cipherkey = await crypto.subtle.encrypt({ name: 'RSA-OAEP' }, serverKey, encodedAesKey);
    return {
        ciphertext: bytesToBase64(ciphertext),
        cipherkey: bytesToBase64(cipherkey),
        iv: bytesToBase64(iv),
    };
};

const decryptGcmTokenPlaceEnvelope = async (payload, rawAesKey) => {
    const aesKey = await getCrypto().subtle.importKey(
        'raw',
        rawAesKey,
        { name: 'AES-GCM' },
        false,
        ['decrypt']
    );
    const ciphertext = base64ToBytes(payload.ciphertext);
    const tag = payload.tag ? base64ToBytes(payload.tag) : new Uint8Array();
    let encrypted;
    if (tag.length) {
        encrypted = new Uint8Array(ciphertext.length + tag.length);
        encrypted.set(ciphertext);
        encrypted.set(tag, ciphertext.length);
    } else {
        encrypted = ciphertext;
    }
    return getCrypto().subtle.decrypt(
        { name: 'AES-GCM', iv: base64ToBytes(payload.iv) },
        aesKey,
        encrypted
    );
};

const decodeTokenPlaceCbcAesKey = (wrappedAesKey) => {
    const decodedKeyText = textDecoder.decode(wrappedAesKey);
    try {
        const decodedKey = base64ToBytes(decodedKeyText);
        if ([16, 24, 32].includes(decodedKey.byteLength)) return decodedKey;
    } catch {
        // Fall through to the raw-key compatibility check below.
    }
    // Compatibility fallback: current token.place CBC payloads wrap the base64-encoded
    // AES key, but early/internal payloads may have wrapped the raw 256-bit key bytes.
    if (wrappedAesKey.byteLength === 32) return new Uint8Array(wrappedAesKey);
    throw new Error('Malformed encrypted token.place response.');
};

export const decryptTokenPlaceEnvelope = async (payload, clientPrivateKey) => {
    const privateKey =
        typeof clientPrivateKey === 'string'
            ? await importRsaPrivateKey(clientPrivateKey)
            : clientPrivateKey;
    const wrappedAesKey = await getCrypto().subtle.decrypt(
        { name: 'RSA-OAEP' },
        privateKey,
        base64ToBytes(payload.cipherkey)
    );
    const usesGcm = String(payload.mode || '')
        .toLowerCase()
        .includes('gcm');
    const rawAesKey = usesGcm ? wrappedAesKey : decodeTokenPlaceCbcAesKey(wrappedAesKey);
    const encryptedText = payload.chat_history || payload.ciphertext;
    if (!encryptedText) {
        throw new Error('Malformed encrypted token.place response: missing ciphertext field.');
    }

    const plaintext = usesGcm
        ? await decryptGcmTokenPlaceEnvelope({ ...payload, ciphertext: encryptedText }, rawAesKey)
        : // token.place's current relay wire format is AES-CBC without a MAC. Keep this
          // compatibility path narrow and prefer/restore AEAD (AES-GCM) when the relay declares it.
          await getCrypto().subtle.decrypt(
              { name: 'AES-CBC', iv: base64ToBytes(payload.iv) },
              await getCrypto().subtle.importKey('raw', rawAesKey, { name: 'AES-CBC' }, false, [
                  'decrypt',
              ]),
              base64ToBytes(encryptedText)
          );
    return JSON.parse(textDecoder.decode(plaintext));
};

const randomBase64Url = (bytes = 18) =>
    bytesToBase64(getCrypto().getRandomValues(new Uint8Array(bytes)))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/g, '');

const fetchJson = async (url, init, unavailableMessage) => {
    let response;
    try {
        response = await fetch(url, { ...init, credentials: 'omit' });
    } catch (error) {
        throw createTokenPlaceNetworkError(error);
    }
    if (!response.ok) {
        const payload = await parseErrorPayload(response);
        const err = createTokenPlaceHttpError(
            response.status,
            payload,
            response.statusText || unavailableMessage
        );
        if (response.status >= 500) err.message = unavailableMessage;
        throw err;
    }
    try {
        return await response.json();
    } catch {
        throw createMalformedTokenPlaceResponseError(
            'Malformed token.place relay response: invalid JSON.'
        );
    }
};

export const selectTokenPlaceRelayServer = async (baseUrl, options = {}) => {
    const data = await fetchJson(
        `${baseUrl}/api/v1/relay/servers/next`,
        { method: 'GET', signal: options.signal },
        'token.place relay is unavailable.'
    );
    const rawKey = data?.server_public_key || data?.serverPublicKey || data?.public_key;
    if (!rawKey)
        throw createMalformedTokenPlaceResponseError('No token.place compute node is available.');
    const normalized = normalizeTokenPlacePublicKey(rawKey);
    return { ...data, server_public_key: normalized.base64, serverPublicKeyPem: normalized.pem };
};

export const dispatchTokenPlaceRelayRequest = async (baseUrl, body, options = {}) =>
    fetchJson(
        `${baseUrl}/api/v1/relay/requests`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
            signal: options.signal,
        },
        'token.place relay is unavailable.'
    );

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const retrieveRelayResponse = async (baseUrl, body, options = {}) => {
    let response;
    try {
        response = await fetch(`${baseUrl}/api/v1/relay/responses/retrieve`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
            signal: options.signal,
            credentials: 'omit',
        });
    } catch (error) {
        throw createTokenPlaceNetworkError(error);
    }
    if (response.status === 202) return { ready: false };
    if ([404, 410].includes(response.status)) return { terminalSelectedServerFailure: true };
    if (!response.ok) {
        const payload = await parseErrorPayload(response);
        if (response.status >= 500)
            throw createTokenPlaceHttpError(
                response.status,
                payload,
                'token.place relay is unavailable.'
            );
        throw createTokenPlaceHttpError(response.status, payload, response.statusText);
    }
    try {
        return { ready: true, data: await response.json() };
    } catch {
        throw createMalformedTokenPlaceResponseError('Malformed encrypted token.place response.');
    }
};

const cancelRelayRequest = async (baseUrl, cancelToken, options = {}) => {
    if (!cancelToken) return;
    try {
        await fetch(`${baseUrl}/api/v1/relay/requests/cancel`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cancel_token: cancelToken }),
            signal: options.signal,
            credentials: 'omit',
        });
    } catch {
        // Best-effort timeout cleanup only; preserve the user-facing timeout error.
    }
};

export const pollTokenPlaceRelayResponse = async (baseUrl, body, options = {}) => {
    const startedAt = Date.now();
    const timeoutMs = options.timeoutMs ?? DEFAULT_RELAY_TIMEOUT_MS;
    const intervalMs = options.pollIntervalMs ?? DEFAULT_RELAY_POLL_INTERVAL_MS;
    while (Date.now() - startedAt < timeoutMs) {
        const result = await retrieveRelayResponse(baseUrl, body, options);
        if (result.ready) return result.data;
        if (result.terminalSelectedServerFailure) return result;
        await sleep(intervalMs);
    }
    await cancelRelayRequest(baseUrl, options.cancelToken, options);
    throw createTokenPlaceHttpError(
        408,
        { message: 'Timed out waiting for token.place compute response.' },
        'Timeout'
    );
};

export const validateTokenPlaceResponseEnvelope = (envelope, expected) => {
    if (envelope?.protocol !== RELAY_PROTOCOL)
        throw createMalformedTokenPlaceResponseError(
            'Malformed token.place response: wrong protocol.'
        );
    if (envelope?.version !== RELAY_VERSION)
        throw createMalformedTokenPlaceResponseError(
            'Malformed token.place response: wrong version.'
        );
    if (envelope?.request_id !== expected.requestId)
        throw createMalformedTokenPlaceResponseError(
            'Malformed token.place response: mismatched request id.'
        );
    if (envelope?.client_public_key !== expected.clientPublicKey)
        throw createMalformedTokenPlaceResponseError(
            'Malformed token.place response: mismatched client key.'
        );
    if (!envelope?.api_v1_response)
        throw createMalformedTokenPlaceResponseError(
            'Malformed token.place response: missing API response.'
        );
    return envelope.api_v1_response;
};

const buildApiV1Request = (promptPayload, options = {}) => ({
    model: getTokenPlaceChatModel(options),
    messages: sanitizeTokenPlaceMessages(promptPayload.combinedMessages),
    options: {
        metadata: buildTokenPlaceMetadata(options.metadata),
    },
});

const runRelayAttempt = async (baseUrl, promptPayload, options = {}) => {
    const server = await selectTokenPlaceRelayServer(baseUrl, options);
    const clientKeys = options.clientKeys || (await generateTokenPlaceClientKeypair());
    const requestId = options.requestId || randomBase64Url();
    const cancelToken = options.cancelToken || randomBase64Url();
    const envelope = {
        protocol: RELAY_PROTOCOL,
        version: RELAY_VERSION,
        request_id: requestId,
        client_public_key: clientKeys.publicKeyBase64,
        api_v1_request: buildApiV1Request(promptPayload, options),
    };
    const encrypted = await encryptTokenPlaceEnvelope(envelope, server.serverPublicKeyPem);
    const dispatched = await dispatchTokenPlaceRelayRequest(
        baseUrl,
        {
            server_public_key: server.server_public_key,
            client_public_key: clientKeys.publicKeyBase64,
            request_id: requestId,
            protocol: RELAY_PROTOCOL,
            version: RELAY_VERSION,
            ...encrypted,
            cancel_token: cancelToken,
        },
        options
    );
    if (dispatched?.accepted === false) {
        throw createMalformedTokenPlaceResponseError('token.place relay rejected the request.');
    }
    const encryptedResponse = await pollTokenPlaceRelayResponse(
        baseUrl,
        { client_public_key: clientKeys.publicKeyBase64, request_id: requestId },
        { ...options, cancelToken }
    );
    if (encryptedResponse?.terminalSelectedServerFailure) return encryptedResponse;
    let responseEnvelope;
    try {
        responseEnvelope = await decryptTokenPlaceEnvelope(
            encryptedResponse,
            clientKeys.privateKey
        );
    } catch (error) {
        throw createMalformedTokenPlaceResponseError('Malformed encrypted token.place response.');
    }
    return validateTokenPlaceResponseEnvelope(responseEnvelope, {
        requestId,
        clientPublicKey: clientKeys.publicKeyBase64,
    });
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

    let data = await runRelayAttempt(baseUrl, promptPayload, options);
    if (data?.terminalSelectedServerFailure) {
        data = await runRelayAttempt(baseUrl, promptPayload, {
            ...options,
            requestId: undefined,
            cancelToken: undefined,
        });
        if (data?.terminalSelectedServerFailure) {
            throw createMalformedTokenPlaceResponseError(
                'No token.place compute node is available.'
            );
        }
    }

    throwStructuredTokenPlaceApiError(data);
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
