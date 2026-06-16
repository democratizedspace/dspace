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

const toNumericStatus = (status) => {
    if (typeof status === 'string') return Number(status);
    return status;
};

export const createTokenPlaceError = (type, message, options = {}) =>
    new TokenPlaceError(message, { ...options, type });

export const getTokenPlaceErrorSummary = (error) => {
    const status = toNumericStatus(error?.status ?? error?.response?.status);
    const type = error?.type ?? error?.error?.type;
    const code = error?.code ?? error?.error?.code;
    const param = error?.param ?? error?.error?.param;
    const message = error?.providerMessage || error?.error?.message || error?.message || '';
    const normalizedMessage = String(message).toLowerCase();
    const normalizedName = String(error?.name || '').toLowerCase();
    const normalizedType = String(type || '').toLowerCase();
    const normalizedCode = String(code || '').toLowerCase();

    if (
        normalizedName === 'aborterror' ||
        type === 'abort' ||
        normalizedMessage.includes('abort')
    ) {
        return {
            type: 'abort',
            message: 'The token.place request was cancelled. Please try again.',
        };
    }

    if (
        type === 'network' ||
        normalizedName === 'typeerror' ||
        normalizedMessage.includes('fetch')
    ) {
        return {
            type: 'network',
            message: 'We could not reach token.place. Check your connection and try again.',
        };
    }

    if (normalizedType === 'content_policy_violation' || normalizedCode === 'content_blocked') {
        return {
            type: 'content_policy',
            message: 'token.place blocked this request by policy. Try changing the message.',
        };
    }

    if (status === 429) {
        return {
            type: 'rate_limit',
            message: 'token.place is rate limiting requests right now. Please wait and try again.',
        };
    }

    if (typeof status === 'number' && status >= 500) {
        return {
            type: 'server',
            message: 'token.place is unavailable right now. Please try again in a moment.',
        };
    }

    if (type === 'malformed') {
        return {
            type: 'malformed',
            message: 'token.place returned a response DSPACE could not read. Please try again.',
        };
    }

    if (param === 'stream' || normalizedMessage.includes('stream')) {
        return {
            type: 'validation',
            message: 'token.place rejected an unsupported request option. Please try again.',
        };
    }

    if (type === 'provider' || error?.error) {
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
