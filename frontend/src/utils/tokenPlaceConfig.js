export const DEFAULT_TOKEN_PLACE_ORIGIN = 'https://token.place';
export const DEFAULT_TOKEN_PLACE_CHAT_MODEL = 'gpt-5-chat-latest';

export const stripTokenPlaceTrailingSlashes = (value) =>
    String(value || '')
        .trim()
        .replace(/\/+$/g, '');

export const normalizeTokenPlaceBaseUrl = (candidate, fallback = DEFAULT_TOKEN_PLACE_ORIGIN) => {
    let baseUrl = stripTokenPlaceTrailingSlashes(candidate) || fallback;

    baseUrl = baseUrl.replace(/\/api\/v1\/chat\/completions$/i, '');
    baseUrl = baseUrl.replace(/\/api\/v1$/i, '');
    baseUrl = baseUrl.replace(/\/api$/i, '');

    return stripTokenPlaceTrailingSlashes(baseUrl) || fallback;
};

export const resolveTokenPlaceRuntimeConfig = (env = {}) => ({
    url: normalizeTokenPlaceBaseUrl(env.DSPACE_TOKEN_PLACE_URL || DEFAULT_TOKEN_PLACE_ORIGIN),
    model:
        String(env.DSPACE_TOKEN_PLACE_CHAT_MODEL || DEFAULT_TOKEN_PLACE_CHAT_MODEL).trim() ||
        DEFAULT_TOKEN_PLACE_CHAT_MODEL,
});
