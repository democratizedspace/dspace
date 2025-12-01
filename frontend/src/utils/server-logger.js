const serializeError = (error) => {
    if (!error) {
        return undefined;
    }

    if (error instanceof Error) {
        return {
            message: error.message,
            stack: error.stack,
            name: error.name,
        };
    }

    return {
        message: String(error),
    };
};

export const logRequestError = ({ route = 'unknown', method = 'UNKNOWN', message, error, context = {} }) => {
    const normalizedError = serializeError(error);
    const payload = {
        level: 'error',
        route,
        method,
        message: message || normalizedError?.message || 'Unhandled error',
        stack: normalizedError?.stack,
        time: new Date().toISOString(),
        ...context,
    };

    console.error(JSON.stringify(payload));
};
