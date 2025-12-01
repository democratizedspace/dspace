import type { APIContext } from 'astro';
import {
    buildHealthResponse,
    buildLivezResponse,
    buildRuntimeConfigResponse,
} from './utils/runtimeEndpoints';
import { logRouteError } from './utils/logging';

export const onRequest = async (context: APIContext, next: () => Promise<Response>) => {
    const { pathname } = new URL(context.request.url);
    const method = context.request.method;
    const handledPaths = new Set(['/config.json', '/healthz', '/health', '/livez']);

    let response: Response;

    try {
        // Allow page routes to handle these endpoints when present. If a build omits the
        // route files (as happened in the broken Docker image), fall back to the shared
        // helpers so the probes stay available.
        response = await next();
    } catch (error) {
        logRouteError({
            route: pathname,
            method,
            message: 'Unhandled error while processing request',
            error,
        });

        return new Response('Internal Server Error', { status: 500 });
    }

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
