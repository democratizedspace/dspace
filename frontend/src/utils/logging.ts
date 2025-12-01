export interface RouteErrorLog {
    route: string;
    method?: string;
    message: string;
    error?: unknown;
    context?: Record<string, unknown>;
}

const MAX_STACK_LENGTH = 5000;

function formatErrorDetails(error: unknown): { stack?: string; errorMessage?: string } {
    if (!error) {
        return {};
    }

    if (error instanceof Error) {
        const stack = error.stack || error.message;
        return {
            stack: typeof stack === 'string' ? stack.slice(0, MAX_STACK_LENGTH) : undefined,
            errorMessage: error.message,
        };
    }

    if (typeof error === 'string') {
        return { errorMessage: error.slice(0, MAX_STACK_LENGTH) };
    }

    try {
        return { errorMessage: JSON.stringify(error).slice(0, MAX_STACK_LENGTH) };
    } catch (stringifyError) {
        return { errorMessage: String(stringifyError).slice(0, MAX_STACK_LENGTH) };
    }
}

export function logRouteError(details: RouteErrorLog): void {
    const payload = {
        level: 'error',
        route: details.route,
        method: details.method ?? 'GET',
        msg: details.message,
        ...formatErrorDetails(details.error),
        ...details.context,
    };

    console.error(JSON.stringify(payload));
}
