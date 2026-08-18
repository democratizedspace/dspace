export type IdentityContract = 'build-info-v1' | 'legacy-build-meta-v1';
export type SmokeProvider = 'token-place' | 'openai';
export type ChatUiContract = 'modern-settings-v1' | 'legacy-inline-openai-v1';
export type ProviderConfigContract =
    | 'chat-default-provider-v1'
    | 'legacy-no-chat-default-provider-v1';

export function normalizeProviderConfigContract(value: string | undefined): ProviderConfigContract {
    const normalized = value?.trim();
    if (
        normalized === 'chat-default-provider-v1' ||
        normalized === 'legacy-no-chat-default-provider-v1'
    ) {
        return normalized;
    }
    throw new Error(
        'DSPACE_EXPECTED_PROVIDER_CONFIG_CONTRACT must select a supported provider-config contract'
    );
}

export function validateProviderConfig(
    value: unknown,
    contract: ProviderConfigContract,
    expectedProvider: SmokeProvider,
    expectedTokenPlaceOrigin?: string,
    expectedTokenPlaceModel?: string
): void {
    if (value === null || typeof value !== 'object' || Array.isArray(value)) {
        throw new Error('PROVIDER_CONFIG_MALFORMED');
    }
    const config = value as Record<string, unknown>;
    const chat = config.chat;
    if (chat !== undefined && (chat === null || typeof chat !== 'object' || Array.isArray(chat))) {
        throw new Error('PROVIDER_CONFIG_MALFORMED');
    }
    const defaultProvider = (chat as Record<string, unknown> | undefined)?.defaultProvider;
    if (contract === 'chat-default-provider-v1') {
        if (defaultProvider !== expectedProvider) {
            throw new Error('LIVE_DEFAULT_PROVIDER_DISAGREEMENT');
        }
    } else if (defaultProvider !== undefined) {
        throw new Error('LEGACY_CONFIG_CLAIMS_DEFAULT_PROVIDER');
    }

    if (contract === 'legacy-no-chat-default-provider-v1' && expectedProvider === 'token-place') {
        const tokenPlace = config.tokenPlace;
        if (
            tokenPlace === null ||
            typeof tokenPlace !== 'object' ||
            Array.isArray(tokenPlace) ||
            typeof (tokenPlace as Record<string, unknown>).url !== 'string'
        ) {
            throw new Error('PROVIDER_CONFIG_MALFORMED');
        }
        let configuredOrigin: string;
        try {
            configuredOrigin = new URL((tokenPlace as Record<string, string>).url).origin;
        } catch {
            throw new Error('PROVIDER_CONFIG_MALFORMED');
        }
        if (
            configuredOrigin !== expectedTokenPlaceOrigin ||
            (tokenPlace as Record<string, unknown>).model !== expectedTokenPlaceModel
        ) {
            throw new Error('LEGACY_TOKEN_PLACE_COORDINATES_DISAGREE');
        }
    }
}

export function chatUiContractFor(
    identityContract: IdentityContract,
    provider: SmokeProvider
): ChatUiContract {
    return identityContract === 'legacy-build-meta-v1' && provider === 'openai'
        ? 'legacy-inline-openai-v1'
        : 'modern-settings-v1';
}
