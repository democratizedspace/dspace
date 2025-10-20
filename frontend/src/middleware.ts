import type { MiddlewareHandler } from 'astro';
import { httpRequestCounter, httpRequestDuration } from './utils/metrics.js';

const toPathname = (request: Request) => new URL(request.url).pathname;

const log = (level: 'info' | 'error', message: string, payload: Record<string, unknown>) => {
    const entry = { level, msg: message, ...payload };
    const serialized = JSON.stringify(entry);
    if (level === 'error') {
        console.error(serialized);
    } else {
        console.log(serialized);
    }
};

export const onRequest: MiddlewareHandler = async ({ request }, next) => {
    const pathname = toPathname(request);
    const method = request.method;
    const start = process.hrtime.bigint();
    const timer = httpRequestDuration.startTimer({ method, route: pathname });

    try {
        const response = await next();
        const status = response.status || 200;
        httpRequestCounter.inc({ method, route: pathname, status_code: `${status}` });
        timer({ status_code: `${status}` });
        const durationMs = Number(process.hrtime.bigint() - start) / 1_000_000;
        log('info', 'request.completed', {
            method,
            path: pathname,
            status,
            durationMs: Math.round(durationMs * 100) / 100,
        });
        return response;
    } catch (error) {
        const status =
            typeof error === 'object' && error !== null && 'status' in error
                ? Number.parseInt(String(error.status)) || 500
                : 500;
        httpRequestCounter.inc({ method, route: pathname, status_code: `${status}` });
        timer({ status_code: `${status}` });
        const durationMs = Number(process.hrtime.bigint() - start) / 1_000_000;
        log('error', 'request.failed', {
            method,
            path: pathname,
            status,
            durationMs: Math.round(durationMs * 100) / 100,
            error: error instanceof Error ? error.message : String(error),
        });
        throw error;
    }
};
