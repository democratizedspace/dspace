import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../frontend/src/utils/gameState/common.js', () => ({
  loadGameState: vi.fn(() => ({})),
  ready: Promise.resolve(),
}));

vi.mock('../frontend/src/utils/dchatKnowledge.js', () => ({
  buildDchatKnowledgePack: vi.fn(() => ({ summary: '', sources: [] })),
}));

vi.mock('../frontend/src/utils/docsRag.js', () => ({
  searchDocsRag: vi.fn(async () => ({ excerptsText: '', sources: [] })),
}));

describe('chat prompt version stamp', () => {
  let originalNodeEnv: string | undefined;
  let originalViteGitSha: string | undefined;

  beforeEach(() => {
    originalNodeEnv = process.env.NODE_ENV;
    originalViteGitSha = process.env.VITE_GIT_SHA;
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
    if (originalNodeEnv === undefined) {
      delete process.env.NODE_ENV;
    } else {
      process.env.NODE_ENV = originalNodeEnv;
    }
    if (originalViteGitSha === undefined) {
      delete process.env.VITE_GIT_SHA;
    } else {
      process.env.VITE_GIT_SHA = originalViteGitSha;
    }
  });

  const loadOpenAI = async (buildMetaOverride?: {
    gitSha: string;
    generatedAt: string;
    source: string;
  }) => {
    vi.resetModules();
    if (buildMetaOverride) {
      vi.doMock('../frontend/src/generated/build_meta.json', () => ({
        default: buildMetaOverride,
      }));
    } else {
      vi.doMock('../frontend/src/generated/build_meta.json', async () => {
        const actual = await vi.importActual(
          '../frontend/src/generated/build_meta.json'
        );
        return { default: actual.default ?? actual };
      });
    }
    return await import('../frontend/src/utils/openAI.js');
  };

  it('includes the prompt version header and guardrail lines', async () => {
    const { buildChatPrompt, CHAT_PROMPT_VERSION } = await loadOpenAI();
    const payload = await buildChatPrompt([]);
    const systemMessage = payload.combinedMessages.find(
      (message) => message.role === 'system'
    );

    expect(systemMessage).toBeDefined();
    if (!systemMessage) {
      throw new Error('Expected system message to be defined.');
    }

    expect(systemMessage.content).toContain('Prompt version:');
    expect(systemMessage.content).toContain(
      `Prompt version: ${CHAT_PROMPT_VERSION}`
    );
    expect(systemMessage.content).toContain('/gamesaves');
    expect(systemMessage.content).toContain('docs/ROUTES.md');
  });

  it('stamps prompt version with the build SHA when available', async () => {
    vi.stubEnv('VITE_GIT_SHA', 'feedface');
    const { buildChatPrompt, CHAT_PROMPT_VERSION } = await loadOpenAI();
    const payload = await buildChatPrompt([]);
    const systemMessage = payload.combinedMessages.find(
      (message) => message.role === 'system'
    );

    expect(systemMessage).toBeDefined();
    if (!systemMessage) {
      throw new Error('Expected system message to be defined.');
    }

    expect(CHAT_PROMPT_VERSION).toBe('v3:feedfac');
    expect(systemMessage.content).toContain('Prompt version: v3:feedfac');
  });

  it('emits v3:<shortsha> in production mode without a build SHA', async () => {
    process.env.NODE_ENV = 'production';
    delete process.env.VITE_GIT_SHA;
    const buildMeta = {
      gitSha: 'feedfacec0ffee',
      generatedAt: '2026-02-06T05:16:45.000Z',
      source: 'ci',
    };
    const { CHAT_PROMPT_VERSION } = await loadOpenAI(buildMeta);

    expect(CHAT_PROMPT_VERSION).toBe('v3:feedfac');
  });

  it('does not emit a missing prompt version in the system message', async () => {
    process.env.NODE_ENV = 'production';
    delete process.env.VITE_GIT_SHA;
    const buildMeta = {
      gitSha: 'deadbeefcafeba5',
      generatedAt: '2026-02-06T05:16:45.000Z',
      source: 'ci',
    };
    const { buildChatPrompt } = await loadOpenAI(buildMeta);
    const payload = await buildChatPrompt([]);
    const systemMessage = payload.combinedMessages.find(
      (message) => message.role === 'system'
    );

    expect(systemMessage).toBeDefined();
    if (!systemMessage) {
      throw new Error('Expected system message to be defined.');
    }

    expect(systemMessage.content).not.toContain('v3:missing');
  });
});
