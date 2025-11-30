import { defineMiddleware } from 'astro/middleware';
import { createHealthResponse, createRuntimeConfigResponse } from './utils/runtimeEndpoints';

const handledPaths = new Set(['/config.json', '/healthz', '/health', '/livez']);

export const onRequest = defineMiddleware(async (context, next) => {
    const { pathname } = new URL(context.request.url);

    if (handledPaths.has(pathname)) {
        switch (pathname) {
            case '/health':
            case '/healthz':
            case '/livez':
                return createHealthResponse();
            case '/config.json':
                return createRuntimeConfigResponse();
            default:
                break;
        }
    }

    return next();
});
