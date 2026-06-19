export const DEFAULT_TOKEN_PLACE_URL = 'https://token.place';
export const DEFAULT_TOKEN_PLACE_CHAT_MODEL = 'gpt-5-chat-latest';

export type TokenPlaceRuntimeConfig = {
    url: string;
    model: string;
};

export function normalizeTokenPlaceUrl(value?: string | null): string {
    let baseUrl = String(value || '')
        .trim()
        .replace(/\/+$/g, '');

    if (!baseUrl) {
        baseUrl = DEFAULT_TOKEN_PLACE_URL;
    }

    baseUrl = baseUrl.replace(/\/api\/v1\/chat\/completions$/i, '');
    baseUrl = baseUrl.replace(/\/api\/v1$/i, '');
    baseUrl = baseUrl.replace(/\/api$/i, '');

    return (
        String(baseUrl || '')
            .trim()
            .replace(/\/+$/g, '') || DEFAULT_TOKEN_PLACE_URL
    );
}

export function normalizeTokenPlaceModel(value?: string | null): string {
    return String(value || '').trim() || DEFAULT_TOKEN_PLACE_CHAT_MODEL;
}

export function resolveTokenPlaceRuntimeConfig(
    env: NodeJS.ProcessEnv = process.env
): TokenPlaceRuntimeConfig {
    return {
        url: normalizeTokenPlaceUrl(env.DSPACE_TOKEN_PLACE_URL),
        model: normalizeTokenPlaceModel(env.DSPACE_TOKEN_PLACE_CHAT_MODEL),
    };
}
