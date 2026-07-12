import {
    buildHealthResponse,
    buildLivezResponse,
    buildRuntimeConfigResponse,
} from './utils/runtimeEndpoints';
import { logServerError } from './utils/serverLogger';
import { normalizeRoute, recordHttpRequest } from './utils/metrics.js';

export interface MiddlewareContext {
    request: Request;
}

export const onRequest = async (context: MiddlewareContext, next: () => Promise<Response>) => {
    const { pathname } = new URL(context.request.url);
    const startedAt = performance.now();
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
        recordHttpRequest({
            method: context.request.method,
            route: normalizeRoute(pathname),
            status: 500,
            outcome: 'server_error',
            durationSeconds: (performance.now() - startedAt) / 1000,
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

    // Allow page routes to handle these endpoints when present. If a build omits the route
    // files (as happened in the broken Docker image), fall back to the shared helpers so the
    // probes stay available.

    if (!handledPaths.has(pathname) || response.status !== 404) {
        const contentType = response.headers.get('Content-Type') || '';
        const isHtml = contentType.includes('text/html');

        if (pathname === '/service-worker.js') {
            response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
        } else if (pathname === '/cache-version.js' || pathname === '/config.json' || isHtml) {
            response.headers.set('Cache-Control', 'no-store');
        } else if (pathname.startsWith('/_astro/')) {
            response.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
        }

        recordHttpRequest({
            method: context.request.method,
            route: normalizeRoute(pathname),
            status: response.status,
            outcome:
                response.status >= 500
                    ? 'server_error'
                    : response.status >= 400
                      ? 'validation_error'
                      : 'success',
            durationSeconds: (performance.now() - startedAt) / 1000,
        });
        return response;
    }

    switch (pathname) {
        case '/config.json':
            response = buildRuntimeConfigResponse();
            break;
        case '/healthz':
        case '/health':
            response = buildHealthResponse();
            break;
        case '/livez':
            response = buildLivezResponse();
            break;
        default:
            recordHttpRequest({
                method: context.request.method,
                route: normalizeRoute(pathname),
                status: response.status,
                outcome:
                    response.status >= 500
                        ? 'server_error'
                        : response.status >= 400
                          ? 'validation_error'
                          : 'success',
                durationSeconds: (performance.now() - startedAt) / 1000,
            });
            return response;
    }

    recordHttpRequest({
        method: context.request.method,
        route: normalizeRoute(pathname),
        status: response.status,
        outcome:
            response.status >= 500
                ? 'server_error'
                : response.status >= 400
                  ? 'validation_error'
                  : 'success',
        durationSeconds: (performance.now() - startedAt) / 1000,
    });
    return response;
};
