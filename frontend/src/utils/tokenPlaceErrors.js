const toNumericStatus = (status) => {
    if (typeof status === 'string') return Number(status);
    return status;
};

const extractDetails = (error) => {
    const providerError = error?.providerError || error?.error || {};
    return {
        status: toNumericStatus(error?.status ?? error?.response?.status),
        type: error?.type ?? providerError.type,
        code: error?.code ?? providerError.code,
        param: error?.param ?? providerError.param,
        message: providerError.message ?? error?.message ?? '',
        name: error?.name ?? '',
    };
};

export const getTokenPlaceErrorSummary = (error) => {
    const { status, type, code, param, message, name } = extractDetails(error);
    const normalizedMessage = String(message || '').toLowerCase();
    const normalizedName = String(name || '').toLowerCase();

    if (normalizedName.includes('abort') || normalizedMessage.includes('abort')) {
        return {
            type: 'abort',
            message: 'The token.place request was canceled. Try again when you are ready.',
        };
    }

    if (
        normalizedName === 'typeerror' ||
        normalizedMessage.includes('failed to fetch') ||
        normalizedMessage.includes('network') ||
        normalizedMessage.includes('fetch') ||
        normalizedMessage.includes('connection')
    ) {
        return {
            type: 'network',
            message: 'We could not reach token.place. Check your connection and try again.',
        };
    }

    if (type === 'content_policy_violation' || code === 'content_blocked') {
        return {
            type: 'content_policy',
            message: 'token.place blocked this request by policy. Try rephrasing your message.',
        };
    }

    if (status === 429) {
        return {
            type: 'rate_limit',
            message: 'token.place is rate limiting chat right now. Please wait and try again.',
        };
    }

    if (typeof status === 'number' && status >= 500) {
        return {
            type: 'server',
            message: 'token.place is unavailable right now. Please try again in a moment.',
        };
    }

    if (param === 'stream') {
        return {
            type: 'provider_validation',
            message: 'token.place rejected an unsupported chat option. Please try again.',
        };
    }

    if (error?.tokenPlaceType === 'malformed_response' || normalizedName.includes('malformed')) {
        return {
            type: 'malformed_response',
            message: 'token.place returned a response DSPACE could not read. Please try again.',
        };
    }

    if (type || code || status) {
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
