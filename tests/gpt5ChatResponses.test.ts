import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const loadGameStateMock = vi.fn();
const buildDchatKnowledgeMock = vi.fn();

const MockOpenAI = function (config) {
  this.config = config;
  this.responses = {
    create: async (payload) => {
      const response = await fetch('https://api.openai.com/v1/responses', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${config.apiKey}`,
        },
        body: JSON.stringify(payload),
      });
      return response.json();
    },
  };
};

vi.mock('../frontend/src/utils/gameState/common.js', () => ({
  loadGameState: loadGameStateMock,
  ready: Promise.resolve(),
}));

vi.mock('../frontend/src/utils/dchatKnowledge.js', () => ({
  buildDchatKnowledge: buildDchatKnowledgeMock,
}));

describe('gpt-5 chat responses integration', () => {
  const fetchMock = vi.fn();
  const jsonResponse = (outputText) =>
    new Response(
      JSON.stringify({
        id: 'resp_123',
        model: 'gpt-5-chat-latest',
        output: [
          {
            id: 'msg_123',
            type: 'message',
            role: 'assistant',
            content: [
              {
                type: 'output_text',
                text: outputText,
              },
            ],
          },
        ],
        output_text: outputText,
      }),
      {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }
    );

  const extractAuthHeader = (headers) => {
    if (!headers) {
      return undefined;
    }
    if (headers instanceof Headers) {
      return headers.get('authorization');
    }
    const normalized = new Headers(headers);
    return normalized.get('authorization');
  };

  beforeEach(() => {
    globalThis.__DSpaceOpenAIClient = MockOpenAI;
    loadGameStateMock.mockReset();
    buildDchatKnowledgeMock.mockReset();
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    delete globalThis.__DSpaceOpenAIClient;
    vi.unstubAllGlobals();
  });

  it('calls the Responses API with knowledge context and returns text output', async () => {
    const playerCredentials = { session: ['demo', 'token'].join('-') };
    loadGameStateMock.mockReturnValue({
      openAI: {
        ['api' + 'Key']: playerCredentials.session,
      },
    });
    buildDchatKnowledgeMock.mockReturnValue('Quest facts');
    fetchMock.mockResolvedValueOnce(jsonResponse('ok'));

    const { GPT35Turbo: gpt5Chat } = await import('../frontend/src/utils/openAI.js');
    const result = await gpt5Chat([{ role: 'user', content: 'Hello there' }]);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toContain('/responses');
    expect(init?.method).toBe('POST');
    expect(extractAuthHeader(init?.headers)).toBe(`Bearer ${playerCredentials.session}`);

    const payload = JSON.parse(init?.body ?? '{}');
    expect(payload.model).toBe('gpt-5-chat-latest');
    expect(payload.input).toHaveLength(3);
    expect(payload.input[0].role).toBe('system');
    expect(payload.input[0].content[0].text).toContain('GPT-5');
    expect(payload.input[1].role).toBe('system');
    expect(payload.input[1].content[0].text).toContain('Quest facts');
    expect(payload.input[2]).toEqual({
      role: 'user',
      content: [
        {
          type: 'text',
          text: 'Hello there',
        },
      ],
    });
    expect(result).toBe('ok');
  });

  it('seeds a welcome assistant message when no conversation history exists', async () => {
    const playerCredentials = { session: ['demo', 'token'].join('-') };
    loadGameStateMock.mockReturnValue({
      openAI: { ['api' + 'Key']: playerCredentials.session },
    });
    buildDchatKnowledgeMock.mockReturnValue(null);
    fetchMock.mockResolvedValueOnce(jsonResponse('hello!'));

    const { GPT35Turbo: gpt5Chat } = await import('../frontend/src/utils/openAI.js');
    const result = await gpt5Chat([]);

    const [, init] = fetchMock.mock.calls[0];
    const payload = JSON.parse(init?.body ?? '{}');
    expect(payload.input).toHaveLength(2);
    expect(payload.input[1]).toEqual({
      role: 'assistant',
      content: [
        {
          type: 'text',
          text: 'Welcome! How can I assist you today?',
        },
      ],
    });
    expect(result).toBe('hello!');
  });
});
