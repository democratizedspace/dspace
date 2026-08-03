import { describe, expect, it } from 'vitest';

import { chatUiContractFor } from '../../frontend/e2e/remote-chat-smoke-contract';

describe('remote chat smoke UI contract selection', () => {
  it.each([
    ['build-info-v1', 'modern-settings-v1'],
    ['legacy-build-meta-v1', 'legacy-inline-openai-v1'],
  ] as const)('maps %s to %s', (identityContract, expected) => {
    expect(chatUiContractFor(identityContract)).toBe(expected);
  });
});
