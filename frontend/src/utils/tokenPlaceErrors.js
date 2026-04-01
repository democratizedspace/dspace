export const getTokenPlaceErrorSummary = (error) => {
    const message = error?.message || '';
    const normalizedMessage = message.toLowerCase();

    if (normalizedMessage.includes('disabled')) {
        return {
            type: 'disabled',
            message:
                'token.place chat is disabled. Enable it in Settings or set the token.place ' +
                'flag for this environment.',
        };
    }

    if (
        normalizedMessage.includes('failed to fetch') ||
        normalizedMessage.includes('network') ||
        normalizedMessage.includes('fetch')
    ) {
        return {
            type: 'network',
            message: 'We could not reach token.place. Check your connection and try again.',
        };
    }

    if (normalizedMessage.includes('api request failed')) {
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
