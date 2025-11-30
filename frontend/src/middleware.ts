import type { APIContext } from 'astro';
import {
    buildHealthResponse,
    buildLivezResponse,
    buildRuntimeConfigResponse,
} from './utils/runtimeEndpoints';

export const onRequest = async (context: APIContext, next: () => Promise<Response>) => {
    const { pathname } = new URL(context.request.url);

    switch (pathname) {
        case '/config.json':
            return buildRuntimeConfigResponse();
        case '/healthz':
            return buildHealthResponse();
        case '/livez':
            return buildLivezResponse();
        default:
            return next();
    }
};
