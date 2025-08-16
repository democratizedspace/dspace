import { loadGameState } from './gameState/common.js';

const DEFAULT_URL = 'https://token.place/api';

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

const stripTrailingSlash = (url) => url.replace(/\/+$/, '');

export const tokenPlaceChat = async (messages) => {
    const envUrl = getEnvUrl();
    const rawBaseUrl = loadGameState().tokenPlace?.url || envUrl || DEFAULT_URL;
    const baseUrl = stripTrailingSlash(rawBaseUrl);

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
    });

    if (!response.ok) {
        throw new Error('token.place API request failed');
    }

    const data = await response.json();
    return data.reply;
};
