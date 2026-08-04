export type IdentityContract = 'build-info-v1' | 'legacy-build-meta-v1';
export type ChatProvider = 'token-place' | 'openai';
export type ChatUiContract = 'modern-settings-v1' | 'legacy-inline-openai-v1';

export function chatUiContractFor(
    identityContract: IdentityContract,
    provider: ChatProvider
): ChatUiContract {
    if (identityContract === 'legacy-build-meta-v1' && provider === 'openai') {
        return 'legacy-inline-openai-v1';
    }

    return 'modern-settings-v1';
}
