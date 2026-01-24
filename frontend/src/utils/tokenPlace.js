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

const toNumericStatus = (status) => {
    if (typeof status === 'string') {
        return Number(status);
    }

    return status;
};

export const getTokenPlaceErrorInfo = (error) => {
    const numericStatus = toNumericStatus(
        error?.status ?? error?.statusCode ?? error?.response?.status ?? error?.cause?.status
    );
    const normalizedMessage = error?.message?.toLowerCase() ?? '';

    if (normalizedMessage.includes('disabled')) {
        return {
            title: 'Chat disabled',
            message:
                'token.place chat is disabled. Enable it in Settings or set ' +
                'VITE_TOKEN_PLACE_ENABLED=true to continue.',
        };
    }

    if (numericStatus === 401) {
        return {
            title: 'Authentication error',
            message: 'token.place rejected this request. Verify the endpoint and try again.',
        };
    }

    if (numericStatus === 403) {
        return {
            title: 'Access denied',
            message: 'token.place denied this request. Check your access settings and try again.',
        };
    }

    if (numericStatus === 429) {
        return {
            title: 'Rate limited',
            message: 'token.place rate limited this request. Please wait and try again.',
        };
    }

    if (typeof numericStatus === 'number' && numericStatus >= 500) {
        return {
            title: 'token.place server error',
            message: 'token.place is unavailable right now. Please try again in a moment.',
        };
    }

    if (normalizedMessage.includes('network') || normalizedMessage.includes('fetch')) {
        return {
            title: 'Network error',
            message: 'We could not reach token.place. Check your connection and try again.',
        };
    }

    if (normalizedMessage.includes('api request failed')) {
        return {
            title: 'token.place error',
            message: 'token.place responded with an error. Please try again.',
        };
    }

    return {
        title: 'Chat error',
        message: "Sorry, I'm having some trouble and can't generate a response.",
    };
};

export const tokenPlaceChat = async (messages, { signal } = {}) => {
    await ready;
    const envUrl = getEnvUrl();
    const state = loadGameState();
    const enabled = isTokenPlaceEnabled({ state });

    if (!enabled) {
        const error = new Error(
            'token.place is disabled. Set VITE_TOKEN_PLACE_ENABLED=true or set tokenPlace.enabled=true in game settings.'
        );
        error.code = 'token_place_disabled';
        throw error;
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
        const error = new Error(`token.place API request failed: ${details}`);
        error.status = response.status;
        throw error;
    }

    const data = await response.json();
    return data.reply;
};
