import type { FeatureFlagParseResult } from '@dspace/feature-flags';
import { parseFeatureFlags, readBooleanOverride } from '@dspace/feature-flags';
import { resolveTokenPlaceBaseUrl, getTokenPlaceChatModel } from './tokenPlace.js';
import { logServerError } from './serverLogger';
import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import buildMeta from '../generated/build_meta.json';
import { normalizeBuildIdentity } from './buildIdentity.js';

function parseOfflineWorkerEnabled(flags: FeatureFlagParseResult): boolean {
    const envOverride = readBooleanOverride(process.env.DSPACE_OFFLINE_WORKER_ENABLED);
    if (envOverride !== undefined) {
        return envOverride;
    }

    const flagOverride = readBooleanOverride(flags.overrides.get('offlineWorker.enabled'));
    return flagOverride ?? true;
}

function parseTelemetryEnabled(flags: FeatureFlagParseResult): boolean {
    const envOverride = readBooleanOverride(process.env.DSPACE_TELEMETRY_ENABLED);
    if (envOverride !== undefined) {
        return envOverride;
    }

    const flagOverride = readBooleanOverride(flags.overrides.get('telemetry.enabled'));
    return flagOverride ?? false;
}

const hasChatProxyRateLimitConfig = () =>
    Boolean(
        process.env.DSPACE_CHAT_PROXY_RATE_LIMIT_REDIS_URL &&
            process.env.DSPACE_CHAT_PROXY_RATE_LIMIT_REDIS_TOKEN
    );

const isExplicitPublicChatProxyAccessEnabled = () =>
    ['1', 'true', 'yes'].includes(
        String(process.env.DSPACE_CHAT_PROXY_PUBLIC_ACCESS || '')
            .trim()
            .toLowerCase()
    );

const hasChatProxyAuthorizationConfig = () =>
    Boolean(process.env.DSPACE_CHAT_PROXY_AUTHORIZATION_TOKEN); // scan-secrets: ignore

const hasCompleteChatProxyUsageAuthorization = () =>
    Boolean(
        getChatProxySigningSecret() &&
            hasChatProxyRateLimitConfig() &&
            isExplicitPublicChatProxyAccessEnabled() &&
            hasChatProxyAuthorizationConfig()
    );

export function resolveRuntimeTokenPlaceConfig() {
    return {
        url: resolveTokenPlaceBaseUrl({
            url: process.env.DSPACE_TOKEN_PLACE_URL,
            state: {},
        }),
        model: getTokenPlaceChatModel({ model: process.env.DSPACE_TOKEN_PLACE_CHAT_MODEL }),
        relayProxyAvailable: hasCompleteChatProxyUsageAuthorization(),
    };
}

const CHAT_PROXY_SESSION_COOKIE = 'dspace_chat_proxy_session';
const CHAT_PROXY_SESSION_TTL_SECONDS = 60 * 60;

const getChatProxySigningSecret = () => process.env.DSPACE_CHAT_PROXY_TOKEN || ''; // scan-secrets: ignore

const signChatProxySession = (
    id: string,
    expiresAt: number,
    secret: string // scan-secrets: ignore
) => createHmac('sha256', secret).update(`${id}.${expiresAt}`).digest('base64url');

const chatProxyAuthorizationIdentity = (request: Request) => {
    const expected = process.env.DSPACE_CHAT_PROXY_AUTHORIZATION_TOKEN || ''; // scan-secrets: ignore
    const actual = request.headers.get('x-dspace-chat-proxy-authorization') || '';
    if (!expected || !actual) return null;
    const expectedBuffer = Buffer.from(expected);
    const actualBuffer = Buffer.from(actual);
    if (expectedBuffer.length !== actualBuffer.length) return null;
    if (!timingSafeEqual(actualBuffer, expectedBuffer)) return null;
    return createHmac('sha256', getChatProxySigningSecret())
        .update(expected)
        .digest('base64url')
        .slice(0, 22);
};

export function getAuthorizedChatProxyIdentity(request: Request) {
    if (!hasCompleteChatProxyUsageAuthorization()) return null;
    return chatProxyAuthorizationIdentity(request);
}

export function createChatProxySessionCookie(identity: string | null, now = Date.now()) {
    const secret = getChatProxySigningSecret(); // scan-secrets: ignore
    // Usage authorization: proxy sessions are minted only after an explicit operator-defined
    // authorization header is presented; public access, shared rate limits, and a signing
    // secret alone are not authorization to spend provider capacity.
    if (!secret || !identity || !hasCompleteChatProxyUsageAuthorization()) return null;
    const id = `${identity}_${randomBytes(16).toString('base64url')}`;
    const expiresAt = Math.floor(now / 1000) + CHAT_PROXY_SESSION_TTL_SECONDS;
    const signature = signChatProxySession(id, expiresAt, secret);
    return `${id}.${expiresAt}.${signature}`;
}

export function chatProxySessionCookieOptions(protocol: string) {
    return {
        httpOnly: true,
        sameSite: 'lax' as const,
        secure: protocol === 'https:',
        path: '/',
        maxAge: CHAT_PROXY_SESSION_TTL_SECONDS,
    };
}

export function verifyChatProxySessionCookie(value: string | null, now = Date.now()) {
    const secret = getChatProxySigningSecret(); // scan-secrets: ignore
    if (!secret || !value || !hasCompleteChatProxyUsageAuthorization()) return null;
    const parts = value.split('.');
    if (parts.length !== 3) return null;
    const [id, expiresAtText, signature] = parts;
    if (!/^[A-Za-z0-9_-]{22}_[A-Za-z0-9_-]{22}$/.test(id)) return null;
    const expiresAt = Number(expiresAtText);
    if (!Number.isInteger(expiresAt) || expiresAt <= Math.floor(now / 1000)) return null;
    const expected = signChatProxySession(id, expiresAt, secret);
    const actualBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expected);
    if (actualBuffer.length !== expectedBuffer.length) return null;
    if (!timingSafeEqual(actualBuffer, expectedBuffer)) return null;
    return id.slice(0, 22);
}

export { CHAT_PROXY_SESSION_COOKIE, CHAT_PROXY_SESSION_TTL_SECONDS };

export function resolveRuntimeOpenAIChatProxyConfig() {
    const serverOpenAIKey = process.env.OPENAI_API_KEY || process.env.DSPACE_OPENAI_API_KEY || ''; // scan-secrets: ignore
    return {
        enabled: Boolean(hasCompleteChatProxyUsageAuthorization() && serverOpenAIKey),
    };
}

function buildHeaders(): HeadersInit {
    return {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store',
    };
}

export function buildRuntimeConfigResponse(): Response {
    try {
        const flags = parseFeatureFlags(process.env.DSPACE_FEATURE_FLAGS);
        const offlineWorkerEnabled = parseOfflineWorkerEnabled(flags);
        const telemetryEnabled = parseTelemetryEnabled(flags);
        const tokenPlace = resolveRuntimeTokenPlaceConfig();

        const body = {
            offlineWorker: {
                enabled: offlineWorkerEnabled,
            },
            telemetry: {
                enabled: telemetryEnabled,
            },
            tokenPlace,
            featureFlags: flags.tokens,
        };

        return new Response(JSON.stringify(body), {
            status: 200,
            headers: buildHeaders(),
        });
    } catch (error) {
        logServerError({
            route: '/config.json',
            method: 'GET',
            message: 'Failed to build runtime config response',
            error,
        });

        return new Response(JSON.stringify({ error: 'config_unavailable' }), {
            status: 503,
            headers: buildHeaders(),
        });
    }
}

function buildHealthBody(status: 'ready' | 'alive') {
    const flags = parseFeatureFlags(process.env.DSPACE_FEATURE_FLAGS);
    const startedAt = new Date(Date.now() - process.uptime() * 1000);

    const version = process.env.DSPACE_VERSION || process.env.npm_package_version || 'unknown';
    const environment = process.env.DSPACE_ENV || 'unknown';

    let buildIdentity = null;
    try {
        buildIdentity = normalizeBuildIdentity(buildMeta);
    } catch {
        // Probe availability is intentionally independent from build-identity validation.
    }
    return {
        status,
        uptimeSeconds: process.uptime(),
        startedAt: startedAt.toISOString(),
        timestamp: new Date().toISOString(),
        version,
        env: environment,
        features: flags.tokens,
        buildIdentity,
    };
}

export function buildHealthResponse(): Response {
    try {
        return new Response(JSON.stringify(buildHealthBody('ready')), {
            status: 200,
            headers: buildHeaders(),
        });
    } catch (error) {
        logServerError({
            route: '/health',
            method: 'GET',
            message: 'Failed to build health response',
            error,
        });

        return new Response(JSON.stringify({ status: 'unhealthy' }), {
            status: 503,
            headers: buildHeaders(),
        });
    }
}

export function buildLivezResponse(): Response {
    try {
        return new Response(JSON.stringify(buildHealthBody('alive')), {
            status: 200,
            headers: buildHeaders(),
        });
    } catch (error) {
        logServerError({
            route: '/livez',
            method: 'GET',
            message: 'Failed to build livez response',
            error,
        });

        return new Response(JSON.stringify({ status: 'unhealthy' }), {
            status: 503,
            headers: buildHeaders(),
        });
    }
}
