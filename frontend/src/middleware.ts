import type { APIContext } from 'astro';
import {
    buildHealthResponse,
    buildLivezResponse,
    buildRuntimeConfigResponse,
} from './utils/runtimeEndpoints';

export const onRequest = async (context: APIContext, next: () => Promise<Response>) => {
    const { pathname } = new URL(context.request.url);
    const handledPaths = new Set(['/config.json', '/healthz', '/health', '/livez']);

    const logRequestError = (error: unknown, details: Record<string, unknown>) => {
        const serializedError = error instanceof Error
            ? { message: error.message, stack: error.stack }
            : { message: String(error), stack: undefined };

        console.error(
            JSON.stringify({
                level: 'error',
                route: pathname,
                method: context.request.method,
                url: context.request.url,
                ...serializedError,
                ...details,
            })
        );
    };

    // Allow page routes to handle these endpoints when present. If a build omits the
    // route files (as happened in the broken Docker image), fall back to the shared
    // helpers so the probes stay available.
    let response: Response;

    try {
        response = await next();
    } catch (error) {
        logRequestError(error, { step: 'middleware-next' });
        throw error;
    }

    if (response.status >= 500) {
        logRequestError('Route returned error response', { status: response.status });
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
