export type IdentityContract = 'build-info-v1' | 'legacy-build-meta-v1';
export type ChatUiContract = 'modern-settings-v1' | 'legacy-inline-key-v1';

export function chatUiContractForIdentity(identityContract: IdentityContract): ChatUiContract {
    return identityContract === 'legacy-build-meta-v1'
        ? 'legacy-inline-key-v1'
        : 'modern-settings-v1';
}
