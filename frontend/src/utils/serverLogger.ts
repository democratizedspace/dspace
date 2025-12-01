export interface ServerLogContext {
    [key: string]: unknown;
}

function normalizeError(error: unknown): { message: string; stack?: string } {
    if (error instanceof Error) {
        return { message: error.message, stack: error.stack };
    }

    if (typeof error === 'string') {
        return { message: error };
    }

    if (error === null || error === undefined) {
        return { message: 'Unknown error' };
    }

    try {
        return { message: JSON.stringify(error) };
    } catch {
        return { message: String(error) };
    }
}

export function logServerError(options: {
    route: string;
    method?: string;
    message?: string;
    error?: unknown;
    context?: ServerLogContext;
}): void {
    const {
        route,
        method = 'UNKNOWN',
        message = 'Unhandled server error',
        error,
        context,
    } = options;
    const normalized = normalizeError(error);
    const payload = {
        level: 'error',
        route,
        method,
        message: normalized.message || message,
        stack: normalized.stack,
        ...context,
    };

    console.error(JSON.stringify(payload));
}
