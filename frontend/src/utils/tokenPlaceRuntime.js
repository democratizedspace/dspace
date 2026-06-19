const DEFAULT_TOKEN_PLACE_URL = 'https://token.place';
const DEFAULT_TOKEN_PLACE_CHAT_MODEL = 'gpt-5-chat-latest';

export const stripTokenPlaceUrlSuffixes = (value) => {
    let baseUrl = String(value || '')
        .trim()
        .replace(/\/+$/g, '');

    baseUrl = baseUrl.replace(/\/api\/v1\/chat\/completions$/i, '');
    baseUrl = baseUrl.replace(/\/api\/v1$/i, '');
    baseUrl = baseUrl.replace(/\/api$/i, '');

    return baseUrl.trim().replace(/\/+$/g, '') || DEFAULT_TOKEN_PLACE_URL;
};

export const normalizeTokenPlaceUrl = (value = DEFAULT_TOKEN_PLACE_URL) =>
    stripTokenPlaceUrlSuffixes(value || DEFAULT_TOKEN_PLACE_URL);

export const normalizeTokenPlaceChatModel = (value = DEFAULT_TOKEN_PLACE_CHAT_MODEL) =>
    String(value || '').trim() || DEFAULT_TOKEN_PLACE_CHAT_MODEL;

export const resolveRuntimeTokenPlaceConfig = (env = process.env) => ({
    url: normalizeTokenPlaceUrl(env?.DSPACE_TOKEN_PLACE_URL || DEFAULT_TOKEN_PLACE_URL),
    model: normalizeTokenPlaceChatModel(
        env?.DSPACE_TOKEN_PLACE_CHAT_MODEL || DEFAULT_TOKEN_PLACE_CHAT_MODEL
    ),
});

export { DEFAULT_TOKEN_PLACE_URL, DEFAULT_TOKEN_PLACE_CHAT_MODEL };
