export const createTokenPlaceError = (type, message, details = {}) => {
    const error = new Error(message || 'token.place returned an error.');
    error.name = 'TokenPlaceError';
    error.type = type;
    if (details.status !== undefined) error.status = details.status;
    if (details.providerError) error.providerError = details.providerError;
    if (details.cause) error.cause = details.cause;
    return error;
};

export const getTokenPlaceErrorSummary = (error) => {
    const providerError = error?.providerError || error?.error;
    const providerType = String(providerError?.type || error?.type || '').toLowerCase();
    const providerCode = String(providerError?.code || '').toLowerCase();
    const providerParam = String(providerError?.param || '').toLowerCase();
    const status = Number(error?.status || error?.response?.status);
    const message = String(error?.message || providerError?.message || '');
    const normalizedMessage = message.toLowerCase();

    if (error?.name === 'AbortError' || providerType === 'abort') {
        return {
            type: 'abort',
            message: 'The token.place request was canceled. Please try again.',
        };
    }

    if (
        providerType === 'network' ||
        normalizedMessage.includes('failed to fetch') ||
        normalizedMessage.includes('network') ||
        normalizedMessage.includes('unable to reach') ||
        normalizedMessage.includes('connection')
    ) {
        return {
            type: 'network',
            message: 'We could not reach token.place. Check your connection and try again.',
        };
    }

    if (providerType === 'malformed' || normalizedMessage.includes('malformed response')) {
        return {
            type: 'malformed',
            message: 'token.place returned a response DSPACE could not read. Please try again.',
        };
    }

    if (providerType === 'content_policy_violation' || providerCode === 'content_blocked') {
        return {
            type: 'content_policy',
            message: 'token.place blocked that request for safety. Try rephrasing your message.',
        };
    }

    if (status === 429) {
        return {
            type: 'rate_limit',
            message: 'token.place is rate limited right now. Please wait a moment and try again.',
        };
    }

    if (status >= 500) {
        return {
            type: 'unavailable',
            message: 'token.place is temporarily unavailable. Please try again in a moment.',
        };
    }

    if (providerParam === 'stream') {
        return {
            type: 'stream_unsupported',
            message: 'token.place API v1 does not support streaming chat requests.',
        };
    }

    if (providerError || providerType === 'provider' || status >= 400) {
        return {
            type: 'provider',
            message: 'token.place returned an error. Please try again in a moment.',
        };
    }

    return {
        type: 'unknown',
        message: 'token.place hit an unexpected error. Please try again shortly.',
    };
};
