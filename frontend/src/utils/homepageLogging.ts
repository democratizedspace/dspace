const serializeError = (error: unknown) => {
    if (error instanceof Error) {
        return {
            message: error.message,
            stack: error.stack,
        };
    }

    return {
        message: typeof error === 'string' ? error : JSON.stringify(error),
        stack: undefined,
    };
};

const buildLogPayload = (
    request: Request,
    url: URL,
    details: Record<string, unknown>
) => {
    return {
        level: 'error',
        route: '/',
        method: request.method,
        url: url?.toString?.() ?? '',
        ...details,
    };
};

export const logHomepageError = (
    request: Request,
    url: URL,
    error: unknown,
    details: Record<string, unknown> = {}
) => {
    const serializedError = serializeError(error);
    const payload = buildLogPayload(request, url, {
        ...serializedError,
        ...details,
    });

    console.error(JSON.stringify(payload));
};

export const loadHomepageChangelogs = async <TEntry>(options: {
    loader: () => Promise<TEntry[]>;
    request: Request;
    url: URL;
}) => {
    try {
        const entries = await options.loader();
        return Array.isArray(entries) ? entries : [];
    } catch (error) {
        logHomepageError(options.request, options.url, error, {
            step: 'load-changelogs',
        });
        return [];
    }
};
