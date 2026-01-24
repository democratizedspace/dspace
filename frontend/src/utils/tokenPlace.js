import { loadGameState, ready } from './gameState/common.js';

const DEFAULT_URL = 'https://token.place/api';

const parseBoolean = (value) => {
    if (value === undefined || value === null) return undefined;

    if (typeof value === 'boolean') return value;

    const normalized = String(value).trim().toLowerCase();

    if (['1', 'true', 'yes', 'on'].includes(normalized)) return true;
    if (['0', 'false', 'no', 'off'].includes(normalized)) return false;

    return undefined;
};

const getEnvUrl = () => {
    // Prefer Vite-style environment variables but fall back to Node env for tests
    if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_TOKEN_PLACE_URL) {
        return import.meta.env.VITE_TOKEN_PLACE_URL;
    }
    if (typeof process !== 'undefined' && process.env?.VITE_TOKEN_PLACE_URL) {
        return process.env.VITE_TOKEN_PLACE_URL;
    }
    return null;
};

const getEnabledOverride = () => {
    const envValue =
        (typeof import.meta !== 'undefined' &&
        import.meta.env?.VITE_TOKEN_PLACE_ENABLED !== undefined
            ? import.meta.env.VITE_TOKEN_PLACE_ENABLED
            : undefined) ??
        (typeof process !== 'undefined' ? process.env?.VITE_TOKEN_PLACE_ENABLED : undefined);

    return parseBoolean(envValue);
};

export const isTokenPlaceEnabled = (options = {}) => {
    const { state = loadGameState() } = options;
    const enabledOverride = getEnabledOverride();

    if (enabledOverride !== undefined) {
        // Explicit env flag takes precedence over any configured URLs or saved state
        return enabledOverride;
    }

    const stateEnabled = parseBoolean(state?.tokenPlace?.enabled);

    return stateEnabled === true;
};

export const getTokenPlaceErrorInfo = (error) => {
    if (!error || typeof error !== 'object') {
        return {
            type: 'unknown',
            title: 'Unexpected error',
            message: 'token.place returned an unexpected error. Please try again.',
        };
    }

    const status = error.status ?? error.statusCode;
    const normalizedMessage =
        typeof error.message === 'string' ? error.message.toLowerCase() : '';

    if (error.type === 'disabled' || normalizedMessage.includes('disabled')) {
        return {
            type: 'disabled',
            title: 'Chat disabled',
            message:
                'token.place is disabled. Enable it in Settings or set VITE_TOKEN_PLACE_ENABLED=true.',
        };
    }

    if (status === 429 || error.type === 'rate_limit') {
        return {
            type: 'rate_limit',
            title: 'Rate limited',
            message: 'token.place rate limited this request. Please wait and try again.',
        };
    }

    if (typeof status === 'number' && status >= 500) {
        return {
            type: 'server',
            title: 'Service unavailable',
            message: 'token.place is unavailable right now. Please try again in a moment.',
        };
    }

    if (error.name === 'TypeError' || normalizedMessage.includes('network')) {
        return {
            type: 'network',
            title: 'Network error',
            message: 'We could not reach token.place. Check your connection and try again.',
        };
    }

    if (typeof status === 'number' && status >= 400) {
        return {
            type: 'request',
            title: 'Request rejected',
            message: 'token.place rejected this request. Please check your settings and try again.',
        };
    }

    return {
        type: 'unknown',
        title: 'Unexpected error',
        message: 'token.place returned an unexpected error. Please try again.',
    };
};

export const tokenPlaceChat = async (messages, { signal } = {}) => {
    await ready;
    const envUrl = getEnvUrl();
    const state = loadGameState();
    const enabled = isTokenPlaceEnabled({ state });

    if (!enabled) {
        const disabledError = new Error(
            'token.place is disabled. Set VITE_TOKEN_PLACE_ENABLED=true or set tokenPlace.enabled=true in game settings.'
        );
        disabledError.type = 'disabled';
        throw disabledError;
    }

    const baseUrl = state.tokenPlace?.url || envUrl || DEFAULT_URL;

    const systemMessage = {
        role: 'system',
        content:
            "You are dChat, a helpful assistant in the game DSPACE. Your purpose is to assist players by providing information, guidance, and support related to the game. DSPACE is a web-based space exploration idle game where you can 3D print things, grow plants hydroponically, and create and launch model rockets. The game is fully open source, and development is ongoing. If you're unsure about something, suggest checking the docs or joining the Discord server. Have fun!",
    };

    const openingMessage = {
        role: 'assistant',
        content: 'Welcome! How can I assist you today?',
    };

    let combinedMessages = [...messages];
    if (combinedMessages.length === 0) {
        combinedMessages = [systemMessage, openingMessage];
    } else {
        combinedMessages = [systemMessage, ...combinedMessages];
    }

    const response = await fetch(`${baseUrl}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: combinedMessages }),
        signal,
    });

    if (!response.ok) {
        let details;
        try {
            const err = await response.json();
            details = err.error || err.message || response.statusText;
        } catch {
            try {
                details = await response.text();
            } catch {
                details = response.statusText;
            }
        }
        const requestError = new Error(`token.place API request failed: ${details}`);
        requestError.status = response.status;
        requestError.details = details;
        if (response.status === 429) {
            requestError.type = 'rate_limit';
        }
        throw requestError;
    }

    const data = await response.json();
    return data.reply;
};
