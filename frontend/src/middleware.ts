import {
    buildHealthResponse,
    buildLivezResponse,
    buildRuntimeConfigResponse,
} from './utils/runtimeEndpoints';
import { logServerError } from './utils/serverLogger';
import {
    ensureMetricsInitialized,
    recordHttpRequest,
    normalizeRoute,
    outcomeFromStatus,
} from './utils/metrics.js';

export interface MiddlewareContext {
    request: Request;
}

export const onRequest = async (context: MiddlewareContext, next: () => Promise<Response>) => {
    const { pathname } = new URL(context.request.url);
    const requestStartedAt = performance.now();
    const metricsStatus =
        pathname === '/metrics' ? { available: false } : await ensureMetricsInitialized();
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
        if (pathname !== '/metrics' && metricsStatus.available) {
            recordHttpRequest({
                method: context.request.method,
                route: normalizeRoute(pathname),
                status: 500,
                outcome: 'server_error',
                durationSeconds: Math.max(0, (performance.now() - requestStartedAt) / 1000),
            });
        }
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

        if (pathname !== '/metrics' && metricsStatus.available) {
            recordHttpRequest({
                method: context.request.method,
                route: normalizeRoute(pathname),
                status: response.status,
                outcome: outcomeFromStatus(response.status),
                durationSeconds: Math.max(0, (performance.now() - requestStartedAt) / 1000),
            });
        }

        return response;
    }

    let fallbackResponse: Response;
    switch (pathname) {
        case '/config.json':
            fallbackResponse = buildRuntimeConfigResponse();
            break;
        case '/healthz':
        case '/health':
            fallbackResponse = buildHealthResponse();
            break;
        case '/livez':
            fallbackResponse = buildLivezResponse();
            break;
        default:
            fallbackResponse = response;
    }

    if (metricsStatus.available) {
        recordHttpRequest({
            method: context.request.method,
            route: normalizeRoute(pathname),
            status: fallbackResponse.status,
            outcome: outcomeFromStatus(fallbackResponse.status),
            durationSeconds: Math.max(0, (performance.now() - requestStartedAt) / 1000),
        });
    }

    return fallbackResponse;
};
