import { execFile } from 'node:child_process';
import { mkdtemp, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { describe, expect, test } from 'vitest';
import {
    DEFAULT_TOKEN_PLACE_OUTPUT_RESERVATION_TOKENS,
    TOKEN_PLACE_CONTEXT_ESTIMATOR_VERSION,
    TOKEN_PLACE_CONTEXT_TIERS,
    estimateTokenPlaceContext,
    estimateTokenPlaceContextForSanitizedMessages,
} from '../src/utils/tokenPlaceContextEstimator.js';

const classifyContent = (content, options = {}) =>
    estimateTokenPlaceContext([{ role: 'user', content }], options);

const repeat = (chunk, chars) => chunk.repeat(Math.ceil(chars / chunk.length)).slice(0, chars);
const utf8Bytes = (value) => new TextEncoder().encode(value).length;
const execFileAsync = promisify(execFile);
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

describe('token.place context estimator', () => {
    test('exports named 8K and 64K profile constants', () => {
        expect(TOKEN_PLACE_CONTEXT_TIERS['8k-fast'].totalContextTokens).toBe(8192);
        expect(TOKEN_PLACE_CONTEXT_TIERS['64k-full'].totalContextTokens).toBe(65536);
    });

    test('counts the complete serialized API v1 payload bytes', () => {
        const messages = [
            { role: 'system', content: 'Use JSON: {"mode":"safe"}' },
            { role: 'user', content: 'Line 1\nLine 2 🚀' },
        ];
        const result = estimateTokenPlaceContextForSanitizedMessages(messages);
        const serializedPayload = JSON.stringify(messages);

        expect(result.payloadUtf8Bytes).toBe(utf8Bytes(serializedPayload));
        expect(result.payloadUtf8Bytes).toBeGreaterThan(
            result.perMessage.reduce((sum, message) => sum + message.utf8Bytes, 0)
        );
        expect(result.perMessage.map((message) => message.serializedUtf8Bytes)).toEqual(
            messages.map((message) => utf8Bytes(JSON.stringify(message)))
        );
    });

    test('classifies ASCII prose into the fast tier', () => {
        const result = classifyContent('DSPACE can explain solar panels and early quests.');
        expect(result.selectedTier).toBe('8k-fast');
        expect(result.overLimit).toBe(false);
        expect(result.payloadUtf8Bytes).toBeGreaterThan(result.messageCount);
    });

    test('counts UTF-8 bytes for Unicode instead of JavaScript string length only', () => {
        const result = classifyContent('🚀🌕 café composting');
        expect(result.payloadUtf8Bytes).toBeGreaterThan('🚀🌕 café composting'.length);
        expect(result.selectedTier).toBe('8k-fast');
    });

    test('classifies JSON payloads deterministically', () => {
        const content = JSON.stringify({ inventory: ['solar-panel'], quests: { start: true } });
        expect(classifyContent(content)).toMatchObject({
            selectedTier: '8k-fast',
            overLimit: false,
        });
    });

    test('classifies source code payloads', () => {
        const content = repeat('function launch(seed) { return seed.map((x) => x + 1); }\n', 30000);
        const result = classifyContent(content);
        expect(result.selectedTier).toBe('64k-full');
        expect(result.overLimit).toBe(false);
    });

    test('classifies whitespace-heavy content conservatively', () => {
        const result = estimateTokenPlaceContextForSanitizedMessages([
            { role: 'user', content: repeat(' \n\t', 24000) },
        ]);
        expect(result.estimatedPromptTokens).toBeGreaterThan(7000);
        expect(result.selectedTier).toBe('64k-full');
    });

    test('classifies RAG-heavy multi-message content in 64K when it exceeds 8K', () => {
        const messages = [
            { role: 'system', content: repeat('DSPACE docs excerpt. ', 28000) },
            { role: 'system', content: repeat('PlayerState inventory quest process. ', 12000) },
            { role: 'user', content: 'What should I build next?' },
        ];
        const result = estimateTokenPlaceContext(messages);
        expect(result.selectedTier).toBe('64k-full');
        expect(result.estimatedTotalTokens).toBeGreaterThan(8192);
    });

    test('surfaces public-helper shaping metadata instead of hiding discarded content', () => {
        const oversizedMessages = [
            { role: 'system', content: repeat('s', 90000) },
            { role: 'assistant', content: repeat('a', 90000) },
            { role: 'user', content: repeat('u', 90000) },
        ];
        const result = estimateTokenPlaceContext(oversizedMessages);

        expect(result.sanitizedPayload.changed).toBe(true);
        expect(result.sanitizedPayload.sourceMessageCount).toBe(3);
        expect(result.sanitizedPayload.sanitizedMessageCount).toBeGreaterThan(0);
        expect(result.sanitizedPayload.discardedContentChars).toBeGreaterThan(0);
        expect(result.sanitizedPayload.chunkedSourceMessageCount).toBeGreaterThan(0);
    });

    test('classifies 131,072-character sanitized payloads without truncating in the estimator', () => {
        const result = estimateTokenPlaceContextForSanitizedMessages([
            { role: 'user', content: repeat('a', 131072) },
        ]);
        expect(result.payloadUtf8Bytes).toBeGreaterThanOrEqual(131072);
        expect(result.selectedTier).toBe('64k-full');
        expect(result.overLimit).toBe(false);
    });

    test('benchmark calibration reports invalid exact-token data as unavailable', async () => {
        const workdir = await mkdtemp(path.join(tmpdir(), 'token-place-context-benchmark-'));
        const tokenizerModule = path.join(workdir, 'zero-tokenizer.mjs');
        await writeFile(tokenizerModule, 'export const countPromptTokens = () => 0;\n');

        try {
            const scriptPath = path.join(repoRoot, 'scripts/benchmark-token-place-context.mjs');
            await execFileAsync(process.execPath, [scriptPath], {
                cwd: workdir,
                env: {
                    ...process.env,
                    TOKEN_PLACE_CONTEXT_EXACT_TOKENIZER_MODULE: tokenizerModule,
                },
            });
            const benchmarkDir = path.join(workdir, 'artifacts/benchmarks/token-place-context');
            const latestJson = (await readdir(benchmarkDir))
                .filter((file) => file.endsWith('.json'))
                .sort()
                .at(-1);
            const report = JSON.parse(await readFile(path.join(benchmarkDir, latestJson), 'utf8'));

            expect(report.scenarios.length).toBeGreaterThan(0);
            expect(report.scenarios[0].calibration).toMatchObject({
                exactTokenizerAvailable: false,
                exactPromptTokens: null,
                promptTokenError: null,
                promptTokenErrorPercent: null,
                note: expect.stringContaining(
                    'configured exact tokenizer hook returned invalid or non-positive'
                ),
            });
            expect(report.scenarios[0].calibration.note).not.toContain(
                'No lightweight development-only Llama 3.1 tokenizer hook is configured'
            );
        } finally {
            await rm(workdir, { recursive: true, force: true });
        }
    });

    test('honors output-token reservation', () => {
        const defaultResult = classifyContent(repeat('a', 20000));
        const largerReservation = classifyContent(repeat('a', 20000), {
            reservedOutputTokens: 4096,
        });
        expect(defaultResult.reservedOutputTokens).toBe(
            DEFAULT_TOKEN_PLACE_OUTPUT_RESERVATION_TOKENS
        );
        expect(largerReservation.estimatedTotalTokens - defaultResult.estimatedTotalTokens).toBe(
            4096 - DEFAULT_TOKEN_PLACE_OUTPUT_RESERVATION_TOKENS
        );
    });

    test('keeps estimator version deterministic', () => {
        const result = classifyContent('version check');
        expect(result.estimatorVersion).toBe(TOKEN_PLACE_CONTEXT_ESTIMATOR_VERSION);
        expect(TOKEN_PLACE_CONTEXT_ESTIMATOR_VERSION).toBe('dspace-token-context-estimator-v1');
    });

    test('returns explicit over-limit result', () => {
        const result = estimateTokenPlaceContextForSanitizedMessages([
            { role: 'user', content: repeat('x', 210000) },
        ]);
        expect(result.selectedTier).toBeNull();
        expect(result.overLimit).toBe(true);
        expect(result.estimatedTotalTokens).toBeGreaterThan(65536);
    });

    test('preserves boundary policy: 8K only when total estimate fits 8,192', () => {
        const near8k = estimateTokenPlaceContextForSanitizedMessages(
            [{ role: 'user', content: repeat('a', 22000) }],
            {
                reservedOutputTokens: 1,
                safetyMarginTokens: 0,
            }
        );
        const above8k = estimateTokenPlaceContextForSanitizedMessages(
            [{ role: 'user', content: repeat('a', 25000) }],
            {
                reservedOutputTokens: 1,
                safetyMarginTokens: 0,
            }
        );
        expect(near8k.estimatedTotalTokens).toBeLessThanOrEqual(8192);
        expect(near8k.selectedTier).toBe('8k-fast');
        expect(above8k.estimatedTotalTokens).toBeGreaterThan(8192);
        expect(above8k.selectedTier).toBe('64k-full');
    });
});
