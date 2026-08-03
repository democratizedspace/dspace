import { describe, expect, it } from 'vitest';

import { selectChatUiContract } from '../../frontend/e2e/remote-chat-smoke-contract';

describe('remote chat smoke UI contract selection', () => {
  it('uses modern settings for build-info identity', () => {
    expect(selectChatUiContract('build-info-v1')).toBe('modern-settings-v1');
  });

  it('uses the inline OpenAI editor for the exact legacy identity contract', () => {
    expect(selectChatUiContract('legacy-build-meta-v1')).toBe(
      'legacy-inline-openai-v1'
    );
  });
});
