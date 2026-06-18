export class TokenPlaceError extends Error {
    constructor(message, options = {}) {
        super(message);
        this.name = 'TokenPlaceError';
        this.type = options.type || 'provider';
        this.status = options.status;
        this.code = options.code;
        this.param = options.param;
        this.providerMessage = options.providerMessage;
        this.cause = options.cause;
    }
}

const isAbortError = (error) =>
    error?.name === 'AbortError' ||
    String(error?.message || '')
        .toLowerCase()
        .includes('abort');

const isNetworkError = (error) => {
    const name = String(error?.name || '').toLowerCase();
    const message = String(error?.message || '').toLowerCase();
    return (
        name.includes('typeerror') ||
        name.includes('network') ||
        message.includes('failed to fetch') ||
        message.includes('network') ||
        message.includes('load failed')
    );
};

export const createTokenPlaceHttpError = (status, errorPayload = {}, fallbackMessage = '') => {
    const providerError =
        errorPayload?.error && typeof errorPayload.error === 'object' ? errorPayload.error : {};
    const message =
        providerError.message || errorPayload?.message || fallbackMessage || 'Provider error';
    let type = providerError.type || 'provider';

    if (providerError.param === 'stream') {
        type = 'validation';
    } else if (
        providerError.type === 'content_policy_violation' ||
        providerError.code === 'content_blocked'
    ) {
        type = 'content_policy';
    } else if (status === 429) {
        type = 'rate_limit';
    } else if (status >= 500) {
        type = 'server';
    }

    return new TokenPlaceError(`token.place API v1 request failed: ${message}`, {
        type,
        status,
        code: providerError.code,
        param: providerError.param,
        providerMessage: message,
    });
};

export const createTokenPlaceNetworkError = (error) =>
    new TokenPlaceError('Could not reach token.place.', {
        type: isAbortError(error) ? 'abort' : isNetworkError(error) ? 'network' : 'unknown',
        providerMessage: error?.message,
        cause: error,
    });

export const createMalformedTokenPlaceResponseError = (
    message = 'Malformed token.place response.'
) => new TokenPlaceError(message, { type: 'malformed' });

export const getTokenPlaceErrorSummary = (error) => {
    const type = error?.type;
    const status = error?.status;
    const code = error?.code;
    const param = error?.param;
    const message = String(error?.message || '').toLowerCase();

    if (type === 'abort' || error?.name === 'AbortError') {
        return {
            type: 'abort',
            message: 'The token.place request was canceled. Please try again.',
        };
    }

    if (
        type === 'network' ||
        message.includes('failed to fetch') ||
        message.includes('network') ||
        message.includes('fetch')
    ) {
        return {
            type: 'network',
            message: 'We could not reach token.place. Check your connection and try again.',
        };
    }

    if (type === 'content_policy' || code === 'content_blocked') {
        return {
            type: 'content_policy',
            message: 'token.place blocked that request by policy. Try rephrasing your message.',
        };
    }

    if (type === 'rate_limit' || status === 429) {
        return {
            type: 'rate_limit',
            message: 'token.place is rate limited or out of daily quota. Please try again later.',
        };
    }

    if (type === 'server' || status >= 500) {
        return {
            type: 'server',
            message: 'token.place is temporarily unavailable. Please try again in a moment.',
        };
    }

    if (type === 'validation' && param === 'stream') {
        return {
            type: 'validation',
            message: 'token.place rejected an unsupported chat option. Please try again.',
        };
    }

    if (type === 'malformed' || message.includes('malformed')) {
        return {
            type: 'malformed',
            message: 'token.place returned an unexpected response. Please try again shortly.',
        };
    }

    if (
        type === 'provider' ||
        status >= 400 ||
        message.includes('token.place api request failed') ||
        message.includes('token.place api v1 request failed')
    ) {
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
