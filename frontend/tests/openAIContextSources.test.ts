import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('../src/utils/gameState/common.js', () => ({
    loadGameState: vi.fn(() => ({
        openAI: {},
    })),
    ready: Promise.resolve(),
}));

import { GPT5ChatV2 } from '../src/utils/openAI.js';

class MockResponseClient {
    constructor(resolver) {
        this.responses = {
            create: resolver,
        };
    }
}

describe('GPT5ChatV2', () => {
    afterEach(() => {
        delete globalThis.__DSpaceOpenAIClient;
    });

    it('returns route sources for route-related queries', async () => {
        const resolver = vi.fn(async () => ({
            output_text: 'ok',
        }));

        globalThis.__DSpaceOpenAIClient = class extends MockResponseClient {
            constructor() {
                super(resolver);
            }
        };

        const result = await GPT5ChatV2([
            { role: 'user', content: 'What are the current game routes?' },
        ]);

        expect(result.text).toBe('ok');
        expect(
            result.contextSources.some(
                (source) =>
                    source.type === 'route' &&
                    source.url === '/docs/routes#top'
            )
        ).toBe(true);
    });

    it('returns changelog sources for release questions', async () => {
        const resolver = vi.fn(async () => ({
            output_text: 'ok',
        }));

        globalThis.__DSpaceOpenAIClient = class extends MockResponseClient {
            constructor() {
                super(resolver);
            }
        };

        const result = await GPT5ChatV2([{ role: 'user', content: 'Is token.place active?' }]);

        expect(result.text).toBe('ok');
        expect(
            result.contextSources.some(
                (source) =>
                    source.type === 'changelog' &&
                    typeof source.url === 'string' &&
                    source.url.startsWith('/changelog#')
            )
        ).toBe(true);
    });
});
