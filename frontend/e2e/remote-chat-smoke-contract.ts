export type IdentityContract = 'build-info-v1' | 'legacy-build-meta-v1';
export type SmokeProvider = 'token-place' | 'openai';
export type ChatUiContract = 'modern-settings-v1' | 'legacy-inline-openai-v1';
export type ProviderConfigContract =
    | 'explicit-default-provider-v1'
    | 'legacy-no-default-provider-v1';

type ProviderConfigExpectations = {
    provider: SmokeProvider;
    tokenPlaceOrigin?: string;
    tokenPlaceModel?: string;
};

export function providerConfigContractFrom(value: string | undefined): ProviderConfigContract {
    if (value === undefined) return 'explicit-default-provider-v1';
    const normalized = value.trim();
    if (
        normalized === 'explicit-default-provider-v1' ||
        normalized === 'legacy-no-default-provider-v1'
    ) {
        return normalized;
    }
    throw new Error(
        'DSPACE_EXPECTED_PROVIDER_CONFIG_CONTRACT must select a supported provider config contract'
    );
}

export function validateProviderConfig(
    contract: ProviderConfigContract,
    config: unknown,
    expectations: ProviderConfigExpectations
): void {
    if (config === null || typeof config !== 'object' || Array.isArray(config)) {
        throw new Error('routing/configuration: /config.json did not return an object');
    }
    const record = config as Record<string, unknown>;
    if (
        record.chat !== undefined &&
        (record.chat === null || typeof record.chat !== 'object' || Array.isArray(record.chat))
    ) {
        throw new Error('routing/configuration: malformed chat provider configuration');
    }
    const defaultProvider = (record.chat as Record<string, unknown> | undefined)?.defaultProvider;
    if (contract === 'explicit-default-provider-v1') {
        if (defaultProvider !== expectations.provider) {
            throw new Error('LIVE_DEFAULT_PROVIDER_DISAGREEMENT');
        }
    } else if (defaultProvider !== undefined) {
        throw new Error('routing/configuration: legacy config claims an explicit default provider');
    }

    if (expectations.provider !== 'token-place') return;
    const tokenPlace = record.tokenPlace;
    if (tokenPlace === null || typeof tokenPlace !== 'object' || Array.isArray(tokenPlace)) {
        throw new Error('routing/configuration: malformed token.place configuration');
    }
    const tokenPlaceConfig = tokenPlace as Record<string, unknown>;
    let configuredOrigin: string;
    try {
        if (typeof tokenPlaceConfig.url !== 'string') throw new Error();
        configuredOrigin = new URL(tokenPlaceConfig.url).origin;
    } catch {
        throw new Error('routing/configuration: malformed token.place configured URL');
    }
    if (configuredOrigin !== expectations.tokenPlaceOrigin) {
        throw new Error('routing/configuration: token.place configured origin drift');
    }
    if (tokenPlaceConfig.model !== expectations.tokenPlaceModel) {
        throw new Error('routing/configuration: token.place configured model drift');
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
