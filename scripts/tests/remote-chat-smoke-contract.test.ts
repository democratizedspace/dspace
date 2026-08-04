import { describe, expect, it } from 'vitest';

import { chatUiContractFor } from '../../frontend/e2e/remote-chat-smoke-contract';

describe('remote chat smoke UI contract selection', () => {
  it.each([
    ['legacy-build-meta-v1', 'openai', 'legacy-inline-openai-v1'],
    ['legacy-build-meta-v1', 'token-place', 'modern-settings-v1'],
    ['build-info-v1', 'openai', 'modern-settings-v1'],
    ['build-info-v1', 'token-place', 'modern-settings-v1'],
  ] as const)('maps %s + %s to %s', (identityContract, provider, expected) => {
    expect(chatUiContractFor(identityContract, provider)).toBe(expected);
  });
});
