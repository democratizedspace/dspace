import type { MiddlewareHandler } from 'astro';
import {
    buildHealthResponse,
    buildLivezResponse,
    buildRuntimeConfigResponse,
} from './utils/runtimeEndpoints.js';
import { logServerError } from './utils/serverLogger.js';

const IMMUTABLE_CACHE_HEADER = 'public, max-age=31536000, immutable';
const NO_STORE_HEADER = 'no-store, must-revalidate';
const NO_CACHE_HEADER = 'no-cache';

function isHashedAsset(pathname: string): boolean {
    return (
        pathname.startsWith('/_astro/') ||
        (pathname.startsWith('/assets/') && /\.(c|m)?js($|\?)/.test(pathname)) ||
        (pathname.startsWith('/assets/') && /\.css($|\?)/.test(pathname))
    );
}

function applyCacheHeaders(response: Response, url: URL): Response {
    const contentType = response.headers.get('content-type') || '';

    if (url.pathname === '/service-worker.js') {
        response.headers.set('Cache-Control', NO_CACHE_HEADER);
    } else if (contentType.includes('text/html')) {
        response.headers.set('Cache-Control', NO_STORE_HEADER);
    } else if (isHashedAsset(url.pathname)) {
        response.headers.set('Cache-Control', IMMUTABLE_CACHE_HEADER);
    }

    return response;
}

export const onRequest: MiddlewareHandler = async ({ request }, next) => {
    const url = new URL(request.url);

    try {
        const upstreamResponse = await next();

        if (upstreamResponse.status === 404) {
            if (url.pathname === '/config.json') {
                return applyCacheHeaders(buildRuntimeConfigResponse(), url);
            }

            if (url.pathname === '/health' || url.pathname === '/healthz') {
                return applyCacheHeaders(buildHealthResponse(), url);
            }

            if (url.pathname === '/livez') {
                return applyCacheHeaders(buildLivezResponse(), url);
            }
        }

        if (upstreamResponse.status >= 500) {
            logServerError({
                route: url.pathname,
                method: request.method,
                context: { status: upstreamResponse.status },
            });
        }

        return applyCacheHeaders(upstreamResponse, url);
    } catch (error) {
        logServerError({ route: url.pathname, method: request.method, error });
        throw error;
    }
};
