import { loadGameState, ready } from './gameState/common.js';

const DEFAULT_URL = 'https://token.place/api';

const parseBoolean = (value) => value === true || value === 'true';

const getEnvEnabled = () => {
    if (
        typeof import.meta !== 'undefined' &&
        import.meta.env?.VITE_TOKEN_PLACE_ENABLED !== undefined
    ) {
        return parseBoolean(import.meta.env.VITE_TOKEN_PLACE_ENABLED);
    }

    if (typeof process !== 'undefined' && process.env?.VITE_TOKEN_PLACE_ENABLED !== undefined) {
        return parseBoolean(process.env.VITE_TOKEN_PLACE_ENABLED);
    }

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

export const isTokenPlaceEnabled = (state = loadGameState()) => {
    const envEnabled = getEnvEnabled();
    if (envEnabled !== undefined) {
        return envEnabled;
    }

    const tokenPlaceState = state.tokenPlace;
    if (!tokenPlaceState) {
        return false;
    }

    if (tokenPlaceState.enabled !== undefined) {
        return Boolean(tokenPlaceState.enabled);
    }

    return Boolean(tokenPlaceState.url);
};

export const tokenPlaceChat = async (messages, { signal } = {}) => {
    const envUrl = getEnvUrl();
    await ready;
    const state = loadGameState();

    if (!isTokenPlaceEnabled(state)) {
        throw new Error(
            'token.place chat is disabled. Enable it with VITE_TOKEN_PLACE_ENABLED=true or configure a token.place URL.'
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
