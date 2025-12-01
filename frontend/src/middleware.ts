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
    const criticalPaths = new Set([...handledPaths, '/']);

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
        return new Response('Internal Server Error', { status: 500 });
    }

    if (response.status >= 500 && criticalPaths.has(pathname)) {
        logServerError({
            route: pathname,
            method: context.request.method,
            message: 'Request returned a server error response',
            context: { status: response.status },
        });
    }

    // Allow page routes to handle these endpoints when present. If a build omits the
    // route files (as happened in the broken Docker image), fall back to the shared
    // helpers so the probes stay available.

    if (!handledPaths.has(pathname) || response.status !== 404) {
        return response;
    }

    try {
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
    } catch (error) {
        logServerError({
            route: pathname,
            method: context.request.method,
            message: 'Failed to build runtime endpoint response',
            error,
        });

        const body = handledPaths.has(pathname)
            ? pathname === '/config.json'
                ? JSON.stringify({ error: 'config_unavailable' })
                : JSON.stringify({ status: 'unhealthy' })
            : 'Internal Server Error';

        const shouldSendJson =
            pathname === '/config.json' || pathname.startsWith('/health') || pathname === '/livez';

        return new Response(body, {
            status: 503,
            headers: shouldSendJson
                ? { 'Content-Type': 'application/json; charset=utf-8' }
                : undefined,
        });
    }
};
