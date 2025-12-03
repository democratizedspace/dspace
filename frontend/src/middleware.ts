import type { APIContext } from 'astro';
import {
    buildHealthResponse,
    buildLivezResponse,
    buildRuntimeConfigResponse,
} from './utils/runtimeEndpoints';
import { logServerError } from './utils/serverLogger';

export const onRequest = async (context: APIContext, next: () => Promise<Response>) => {
    const { pathname } = new URL(context.request.url);
    const handledPaths = new Set(['/config.json', '/healthz', '/health', '/livez']);

    let response: Response;

    try {
        response = await next();
    } catch (error) {
        logServerError({
            route: pathname,
            method: context.request.method,
            message: 'Unhandled error while processing request',
            error,
        });
        throw error;
    }

    if (response.status >= 500) {
        logServerError({
            route: pathname,
            method: context.request.method,
            message: 'Request returned a server error response',
            context: { status: response.status },
        });
    }

    const contentType = response.headers.get('content-type') || '';

    if (pathname === '/service-worker.js') {
        response.headers.set('cache-control', 'no-cache');
    } else if (contentType.includes('text/html')) {
        response.headers.set('cache-control', 'no-store');
    } else if (pathname.startsWith('/_astro/')) {
        const existing = response.headers.get('cache-control');
        if (!existing || !/immutable/i.test(existing)) {
            response.headers.set('cache-control', 'public, max-age=31536000, immutable');
        }
    }

    // Allow page routes to handle these endpoints when present. If a build omits the route
    // files (as happened in the broken Docker image), fall back to the shared helpers so the
    // probes stay available.

    if (!handledPaths.has(pathname) || response.status !== 404) {
        return response;
    }

    switch (pathname) {
        case '/config.json':
            return buildRuntimeConfigResponse();
        case '/healthz':
        case '/health':
            return buildHealthResponse();
        case '/livez':
            return buildLivezResponse();
        default:
            return response;
    }
};
