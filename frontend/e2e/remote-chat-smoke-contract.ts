export type IdentityContract = 'build-info-v1' | 'legacy-build-meta-v1';
export type SmokeProvider = 'token-place' | 'openai';
export type ChatUiContract = 'modern-settings-v1' | 'legacy-inline-openai-v1';

export function chatUiContractFor(
    identityContract: IdentityContract,
    provider: SmokeProvider
): ChatUiContract {
    return identityContract === 'legacy-build-meta-v1' && provider === 'openai'
        ? 'legacy-inline-openai-v1'
        : 'modern-settings-v1';
}
