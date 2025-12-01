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
    const jsonHeaders = {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store',
    } satisfies HeadersInit;

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

    if (response.status >= 500) {
        logServerError({
            route: pathname,
            method: context.request.method,
            message: 'Request returned a server error response',
            context: { status: response.status },
        });
    }

    if (handledPaths.has(pathname) && response.status >= 500) {
        logServerError({
            route: pathname,
            method: context.request.method,
            message: 'Runtime endpoint returned 500',
            context: { status: response.status },
        });
    }

    // Allow page routes to handle these endpoints when present. If a build omits the route
    // files (as happened in the broken Docker image), fall back to the shared helpers so the
    // probes stay available.

    if (!handledPaths.has(pathname) || response.status !== 404) {
        return response;
    }

    switch (pathname) {
        case '/config.json':
            try {
                return buildRuntimeConfigResponse();
            } catch (error) {
                logServerError({
                    route: pathname,
                    method: context.request.method,
                    message: 'Failed to build runtime endpoint response',
                    error,
                });
                return new Response(JSON.stringify({ error: 'config_unavailable' }), {
                    status: 503,
                    headers: jsonHeaders,
                });
            }
        case '/healthz':
        case '/health':
            try {
                return buildHealthResponse();
            } catch (error) {
                logServerError({
                    route: pathname,
                    method: context.request.method,
                    message: 'Failed to build runtime endpoint response',
                    error,
                });
                return new Response(JSON.stringify({ status: 'unhealthy' }), {
                    status: 503,
                    headers: jsonHeaders,
                });
            }
        case '/livez':
            try {
                return buildLivezResponse();
            } catch (error) {
                logServerError({
                    route: pathname,
                    method: context.request.method,
                    message: 'Failed to build runtime endpoint response',
                    error,
                });
                return new Response(JSON.stringify({ status: 'unhealthy' }), {
                    status: 503,
                    headers: jsonHeaders,
                });
            }
        default:
            return response;
    }
};
