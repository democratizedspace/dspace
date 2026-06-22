import { JSEncrypt } from 'jsencrypt';
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
const VALID_CHAT_ROLES = new Set(['user', 'assistant', 'system']);
const normalizeTokenPlaceRole = (role) => (VALID_CHAT_ROLES.has(role) ? role : 'user');
export const TOKEN_PLACE_API_V1_MAX_MESSAGES = 64;
export const TOKEN_PLACE_API_V1_MAX_MESSAGE_CONTENT_CHARS = 32_768;
export const TOKEN_PLACE_API_V1_MAX_TOTAL_CONTENT_CHARS = 131_072;
const TOKEN_PLACE_API_V1_CHUNK_LABEL_CHARS = 96;
const TOKEN_PLACE_API_V1_SYSTEM_CHUNK_CHARS =
    TOKEN_PLACE_API_V1_MAX_MESSAGE_CONTENT_CHARS - TOKEN_PLACE_API_V1_CHUNK_LABEL_CHARS;

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

const stringifyJsonOrString = (content) => {
    try {
        const serialized = JSON.stringify(content);
        return typeof serialized === 'string' ? serialized : String(content);
    } catch {
        return String(content);
    }
};

const stringifyTokenPlaceContent = (content) => {
    if (typeof content === 'string') return content;
    if (content == null) return '';
    if (Array.isArray(content)) {
        return content
            .map((part) => {
                if (typeof part === 'string') return part;
                if (typeof part?.text === 'string') return part.text;
                if (typeof part?.content === 'string') return part.content;
                return stringifyJsonOrString(part);
            })
            .filter(Boolean)
            .join('\n');
    }
    return stringifyJsonOrString(content);
};

const chunkText = (content, maxChars) => {
    const chunks = [];
    for (let offset = 0; offset < content.length; offset += maxChars) {
        chunks.push(content.slice(offset, offset + maxChars));
    }
    return chunks;
};

const splitTokenPlaceMessage = (message, index) => {
    const role = normalizeTokenPlaceRole(message?.role);
    const content = stringifyTokenPlaceContent(message?.content).trim();
    if (!content) return [];

    if (content.length <= TOKEN_PLACE_API_V1_MAX_MESSAGE_CONTENT_CHARS) {
        return [{ role, content, originalIndex: index, chunkIndex: 0 }];
    }

    if (role === 'system') {
        const chunks = chunkText(content, TOKEN_PLACE_API_V1_SYSTEM_CHUNK_CHARS);
        return chunks.map((chunk, chunkIndex) => ({
            role,
            content: `[DSPACE context chunk ${chunkIndex + 1}/${chunks.length}]\n${chunk}`,
            originalIndex: index,
            chunkIndex,
        }));
    }

    // Keep oversized conversation turns deterministic and valid. If later limits force trimming,
    // the priority pass below preserves the latest user turn before older history/context.
    return chunkText(content, TOKEN_PLACE_API_V1_MAX_MESSAGE_CONTENT_CHARS).map(
        (chunk, chunkIndex) => ({ role, content: chunk, originalIndex: index, chunkIndex })
    );
};

const getTokenPlaceMessagePriority = (message, latestUserIndex, requiredSystemMessage) => {
    if (
        requiredSystemMessage &&
        message.originalIndex === requiredSystemMessage.originalIndex &&
        message.chunkIndex === requiredSystemMessage.chunkIndex
    ) {
        return 0;
    }
    if (message.originalIndex === latestUserIndex) return 1;
    if (message.role === 'system') return 2;
    if (message.role === 'user') return 3;
    return 4;
};

export const sanitizeTokenPlaceMessages = (messages = []) => {
    const sourceMessages = Array.isArray(messages) ? messages : [];
    const candidates = sourceMessages.flatMap(splitTokenPlaceMessage);
    const latestUserIndex = candidates.reduce(
        (latest, message) => (message.role === 'user' ? message.originalIndex : latest),
        -1
    );
    const requiredSystemMessage = candidates.find((message) => message.role === 'system');
    const selected = [];
    let totalChars = 0;

    for (const candidate of [...candidates].sort((a, b) => {
        const priorityDelta =
            getTokenPlaceMessagePriority(a, latestUserIndex, requiredSystemMessage) -
            getTokenPlaceMessagePriority(b, latestUserIndex, requiredSystemMessage);
        if (priorityDelta) return priorityDelta;
        if (a.role === 'system')
            return a.originalIndex - b.originalIndex || a.chunkIndex - b.chunkIndex;
        return b.originalIndex - a.originalIndex || a.chunkIndex - b.chunkIndex;
    })) {
        if (selected.length >= TOKEN_PLACE_API_V1_MAX_MESSAGES) break;
        if (totalChars + candidate.content.length > TOKEN_PLACE_API_V1_MAX_TOTAL_CONTENT_CHARS) {
            continue;
        }
        selected.push(candidate);
        totalChars += candidate.content.length;
    }

    return selected
        .sort((a, b) => a.originalIndex - b.originalIndex || a.chunkIndex - b.chunkIndex)
        .map(({ role, content }) => ({ role, content }));
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
    const privatePem = base64ToPem(bytesToBase64(pkcs8), 'PRIVATE KEY');
    return {
        publicKey: publicPem,
        privateKey: privatePem,
        publicKeyCrypto: pair.publicKey,
        privateKeyCrypto: pair.privateKey,
        publicKeyPem: publicPem,
        publicKeyBase64: bytesToBase64(textEncoder.encode(publicPem)),
        privateKeyPem: privatePem,
        privateKeyBase64: bytesToBase64(textEncoder.encode(privatePem)),
    };
};

const encryptTokenPlaceCipherkey = (aesKeyBase64, publicKeyPem) => {
    const rsa = new JSEncrypt();
    rsa.setPublicKey(publicKeyPem);
    const cipherkey = rsa.encrypt(aesKeyBase64);
    if (!cipherkey) throw new Error('Unable to encrypt token.place cipher key.');
    return cipherkey;
};

const isValidAesKeySize = (bytes) => [16, 24, 32].includes(bytes.byteLength);

const decodeBase64AesKey = (value) => {
    const normalized = String(value || '').trim();
    if (!normalized) throw new Error('Malformed encrypted token.place response.');
    if (!/^[A-Za-z0-9+/]+={0,2}$/.test(normalized) || normalized.length % 4 !== 0) {
        throw new Error('Malformed encrypted token.place response.');
    }
    const decodedKey = base64ToBytes(normalized);
    if (!isValidAesKeySize(decodedKey)) {
        throw new Error('Malformed encrypted token.place response.');
    }
    return decodedKey;
};

const decryptTokenPlaceCipherkey = (cipherkey, privateKeyPem) => {
    const rsa = new JSEncrypt();
    rsa.setPrivateKey(privateKeyPem);
    const decryptedKey = rsa.decrypt(cipherkey);
    if (!decryptedKey) throw new Error('Malformed encrypted token.place response.');
    try {
        return decodeBase64AesKey(decryptedKey);
    } catch (error) {
        const rawKey = textEncoder.encode(decryptedKey);
        if (rawKey.byteLength === 32) return rawKey;
        throw error;
    }
};

const importTokenPlacePrivateKey = async (privateKeyPem) =>
    getCrypto().subtle.importKey(
        'pkcs8',
        base64ToBytes(pemToBase64(privateKeyPem)),
        { name: 'RSA-OAEP', hash: 'SHA-256' },
        false,
        ['decrypt']
    );

export const encryptTokenPlaceEnvelope = async (envelope, serverPublicKeyPem) => {
    const crypto = getCrypto();
    const aesKey = await crypto.subtle.generateKey({ name: 'AES-CBC', length: 256 }, true, [
        'encrypt',
    ]);
    const rawAesKey = await crypto.subtle.exportKey('raw', aesKey);
    const encodedAesKey = bytesToBase64(rawAesKey);
    const iv = crypto.getRandomValues(new Uint8Array(16));
    const ciphertext = await crypto.subtle.encrypt(
        { name: 'AES-CBC', iv },
        aesKey,
        textEncoder.encode(JSON.stringify(envelope))
    );
    return {
        ciphertext: bytesToBase64(ciphertext),
        cipherkey: encryptTokenPlaceCipherkey(encodedAesKey, serverPublicKeyPem),
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
        if (isValidAesKeySize(decodedKey)) return decodedKey;
    } catch {
        // Fall through to the raw-key compatibility check below.
    }
    // Compatibility fallback: current token.place CBC payloads wrap the base64-encoded
    // AES key, but early/internal payloads may have wrapped the raw 256-bit key bytes.
    if (wrappedAesKey.byteLength === 32) return new Uint8Array(wrappedAesKey);
    throw new Error('Malformed encrypted token.place response.');
};

export const decryptTokenPlaceEnvelope = async (payload, clientPrivateKey) => {
    const usesGcm = String(payload.mode || '')
        .toLowerCase()
        .includes('gcm');
    let rawAesKey;
    if (usesGcm) {
        const privateKey =
            typeof clientPrivateKey === 'string'
                ? await importTokenPlacePrivateKey(clientPrivateKey)
                : clientPrivateKey;
        rawAesKey = await getCrypto().subtle.decrypt(
            { name: 'RSA-OAEP' },
            privateKey,
            base64ToBytes(payload.cipherkey)
        );
    } else if (typeof clientPrivateKey === 'string') {
        rawAesKey = decryptTokenPlaceCipherkey(payload.cipherkey, clientPrivateKey);
    } else {
        const wrappedAesKey = await getCrypto().subtle.decrypt(
            { name: 'RSA-OAEP' },
            clientPrivateKey,
            base64ToBytes(payload.cipherkey)
        );
        rawAesKey = decodeTokenPlaceCbcAesKey(wrappedAesKey);
    }
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
    options: {},
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
