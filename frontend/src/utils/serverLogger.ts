/** Context object for server-side logging. */
export interface ServerLogContext {
    [key: string]: unknown;
}

const SENSITIVE_KEYS = ['password', 'token', 'secret', 'authorization'];
const ALLOWED_KEYS = ['message', 'name', 'code', 'status', 'statusCode'];

function safeStringify(value: unknown): string {
    try {
        return JSON.stringify(value, (key, val) =>
            SENSITIVE_KEYS.some((sensitiveKey) => key.toLowerCase().includes(sensitiveKey))
                ? '[REDACTED]'
                : val
        );
    } catch {
        return String(value);
    }
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

    if (typeof error === 'object') {
        const record = error as Record<string, unknown>;
        const message = typeof record.message === 'string' ? record.message : undefined;
        const stack = typeof record.stack === 'string' ? record.stack : undefined;

        const sanitized: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(record)) {
            if (!ALLOWED_KEYS.includes(key)) {
                continue;
            }

            if (
                typeof value === 'string' ||
                typeof value === 'number' ||
                typeof value === 'boolean'
            ) {
                sanitized[key] = value;
            } else {
                sanitized[key] = '[REDACTED]';
            }
        }

        const serialized = Object.keys(sanitized).length > 0 ? safeStringify(sanitized) : undefined;

        return {
            message: message ?? serialized ?? 'Unknown error',
            stack,
        };
    }

    return { message: String(error) };
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
        message: normalized.message ?? message,
        stack: normalized.stack,
        context,
    };

    // Avoid logging sensitive data: callers should sanitize the context and error payloads
    // before invoking this helper.
    console.error(JSON.stringify(payload));
}
