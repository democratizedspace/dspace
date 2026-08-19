export type IdentityContract = 'build-info-v1' | 'legacy-build-meta-v1';
export type SmokeProvider = 'token-place' | 'openai';
export type ChatUiContract = 'modern-settings-v1' | 'legacy-inline-openai-v1';
export type ProviderConfigContract = 'chat-default-provider-v1' | 'legacy-no-default-provider-v1';

export function normalizeProviderConfigContract(value: string | undefined): ProviderConfigContract {
    const normalized = value?.trim();
    if (
        normalized === 'chat-default-provider-v1' ||
        normalized === 'legacy-no-default-provider-v1'
    ) {
        return normalized;
    }

    throw new Error(
        'DSPACE_EXPECTED_PROVIDER_CONFIG_CONTRACT must select a supported provider config contract'
    );
}

export function providerConfigContractForRemoteSmoke(
    enabled: boolean,
    value: string | undefined
): ProviderConfigContract {
    return enabled ? normalizeProviderConfigContract(value) : 'chat-default-provider-v1';
}

function record(value: unknown, name: string): Record<string, unknown> {
    if (value === null || typeof value !== 'object' || Array.isArray(value)) {
        throw new Error(`routing/configuration: ${name} must be an object`);
    }
    return value as Record<string, unknown>;
}

export function validateProviderConfig(
    value: unknown,
    contract: ProviderConfigContract,
    expectedProvider: SmokeProvider,
    expectedTokenPlaceOrigin?: string,
    expectedTokenPlaceModel?: string
): void {
    const config = record(value, '/config.json');
    const chat = config.chat === undefined ? undefined : record(config.chat, 'chat');

    if (contract === 'chat-default-provider-v1') {
        if (chat?.defaultProvider !== expectedProvider) {
            throw new Error('LIVE_DEFAULT_PROVIDER_DISAGREEMENT');
        }
    } else if (contract === 'legacy-no-default-provider-v1') {
        if (chat && Object.hasOwn(chat, 'defaultProvider')) {
            throw new Error('routing/configuration: legacy config claims chat.defaultProvider');
        }
    } else {
        throw new Error('routing/configuration: unsupported provider config contract');
    }

    if (expectedProvider !== 'token-place') return;
    const tokenPlace = record(config.tokenPlace, 'tokenPlace');
    if (typeof tokenPlace.url !== 'string') {
        throw new Error('routing/configuration: token.place URL is malformed');
    }
    let configuredOrigin: string;
    try {
        const configuredUrl = new URL(tokenPlace.url);
        if (!['http:', 'https:'].includes(configuredUrl.protocol)) throw new Error();
        configuredOrigin = configuredUrl.origin;
    } catch {
        throw new Error('routing/configuration: token.place URL is malformed');
    }
    if (configuredOrigin !== expectedTokenPlaceOrigin) {
        throw new Error('routing/configuration: token.place configured origin drift');
    }
    if (tokenPlace.model !== expectedTokenPlaceModel) {
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
