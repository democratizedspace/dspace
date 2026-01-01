import { loadGameState, ready } from './gameState/common.js';

const DEFAULT_URL = 'https://token.place/api';

const parseBoolean = (value) => {
    if (value === undefined) return undefined;

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
    const { envUrl = getEnvUrl(), state = loadGameState() } = options;
    const enabledOverride = getEnabledOverride();

    if (enabledOverride !== undefined) {
        return enabledOverride;
    }

    const stateUrl = state?.tokenPlace?.url;

    return Boolean(envUrl || stateUrl);
};

export const tokenPlaceChat = async (messages, { signal } = {}) => {
    await ready;
    const envUrl = getEnvUrl();
    const state = loadGameState();
    const enabled = isTokenPlaceEnabled({ envUrl, state });

    if (!enabled) {
        throw new Error(
            'token.place is disabled. Set VITE_TOKEN_PLACE_ENABLED=true or configure a tokenPlace url.'
        );
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
        throw new Error(`token.place API request failed: ${details}`);
    }

    const data = await response.json();
    return data.reply;
};
