#!/usr/bin/env node
import { existsSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { performance } from 'node:perf_hooks';
import { buildPromptMetrics } from '../frontend/src/utils/promptMetrics.js';
import {
  estimateTokenPlaceContextForSanitizedMessages,
  TOKEN_PLACE_CONTEXT_TIERS,
} from '../frontend/src/utils/tokenPlaceContextEstimator.js';
import {
  sanitizeTokenPlaceMessagesWithMetadata,
  TOKEN_PLACE_API_V1_MAX_TOTAL_CONTENT_CHARS,
} from '../frontend/src/utils/tokenPlaceMessages.js';

const OUTPUT_DIR = 'artifacts/benchmarks/token-place-context';
const EXACT_TOKENIZER_MODULE_ENV = 'TOKEN_PLACE_CONTEXT_EXACT_TOKENIZER_MODULE';
const repeat = (label, length) =>
  label.repeat(Math.ceil(length / label.length)).slice(0, length);

const syntheticState = (chars) =>
  `SYNTHETIC_PLAYER_STATE:${repeat(' inventory=synthetic-item quest=synthetic-step ', chars)}`;
const syntheticRag = (chars) =>
  `SYNTHETIC_RAG_EXCERPTS:${repeat(' docs synthetic guidance for benchmark only. ', chars)}`;
const syntheticHistory = (turns, chars) =>
  Array.from({ length: turns }, (_, index) => [
    {
      role: 'user',
      content: `synthetic user turn ${index}: ${repeat('u ', chars)}`,
    },
    {
      role: 'assistant',
      content: `synthetic assistant turn ${index}: ${repeat('a ', chars)}`,
    },
  ]).flat();

const scenario = (
  id,
  description,
  { system = 500, rag = 0, state = 0, history = [], latest = 80 }
) => {
  const systemContent = `SYNTHETIC_SYSTEM:${repeat(' system policy. ', system)}`;
  const ragContent = rag ? syntheticRag(rag) : '';
  const stateContent = state ? syntheticState(state) : '';
  const latestContent = `synthetic latest user message: ${repeat('latest ', latest)}`;
  const combinedMessages = [
    { role: 'system', content: systemContent },
    ...(ragContent ? [{ role: 'system', content: ragContent }] : []),
    ...(stateContent ? [{ role: 'system', content: stateContent }] : []),
    ...history,
    { role: 'user', content: latestContent },
  ];
  const systemIndex = 0;
  const ragIndex = ragContent ? 1 : -1;
  const playerStateIndex = stateContent ? 1 + (ragContent ? 1 : 0) : -1;
  const historyStartIndex = 1 + (ragContent ? 1 : 0) + (stateContent ? 1 : 0);
  const latestUserMessageIndex = combinedMessages.length - 1;
  return {
    id,
    description,
    combinedMessages,
    componentSourceIndexes: {
      systemInstructions: systemIndex,
      rag: ragIndex,
      playerState: playerStateIndex,
      chatHistory: history.map((_, index) => historyStartIndex + index),
      latestUserMessage: latestUserMessageIndex,
    },
  };
};

const scenarios = [
  scenario('token-lite-baseline', 'Small token-lite style prompt.', {
    system: 180,
    latest: 40,
  }),
  scenario('minimal-full-fat', 'Minimal full-fat DSPACE prompt.', {
    system: 1200,
    state: 800,
    latest: 80,
  }),
  scenario(
    'typical-mid-game',
    'Typical mid-game state, RAG, and short history.',
    {
      system: 1800,
      rag: 6000,
      state: 8000,
      history: syntheticHistory(6, 160),
      latest: 180,
    }
  ),
  scenario('rag-heavy', 'Large synthetic docs-RAG excerpts.', {
    system: 1800,
    rag: 36000,
    state: 5000,
    history: syntheticHistory(4, 120),
    latest: 160,
  }),
  scenario('long-chat-history', 'Long accumulated chat history.', {
    system: 1500,
    state: 4000,
    history: syntheticHistory(30, 420),
    latest: 160,
  }),
  scenario('large-player-state', 'Large save/player-state snapshot.', {
    system: 1500,
    rag: 2500,
    state: 52000,
    history: syntheticHistory(4, 120),
    latest: 160,
  }),
  scenario(
    'near-token-place-ceiling',
    `Synthetic payload near the ${TOKEN_PLACE_API_V1_MAX_TOTAL_CONTENT_CHARS.toLocaleString('en-US')}-character request ceiling.`,
    {
      system: 2000,
      rag: 44000,
      state: 44000,
      history: syntheticHistory(10, 1700),
      latest: 900,
    }
  ),
];

const loadExactTokenizer = async () => {
  const modulePath = process.env[EXACT_TOKENIZER_MODULE_ENV];
  if (!modulePath) return null;
  const resolvedModulePath = path.resolve(modulePath);
  if (!existsSync(resolvedModulePath)) return null;

  const module = await import(pathToFileURL(resolvedModulePath).href);
  const countPromptTokens = module.countPromptTokens ?? module.default;
  return typeof countPromptTokens === 'function' ? countPromptTokens : null;
};

const countExactPromptTokens = async (tokenizer, messages) => {
  if (typeof tokenizer !== 'function') return null;
  const exactPromptTokens = await tokenizer(messages);
  return Number.isFinite(exactPromptTokens) ? exactPromptTokens : null;
};

const calibrationFor = (estimate, exactPromptTokens) => {
  if (!Number.isFinite(exactPromptTokens) || exactPromptTokens <= 0) {
    return {
      exactTokenizerAvailable: false,
      exactPromptTokens: null,
      promptTokenError: null,
      promptTokenErrorPercent: null,
      note: `No lightweight development-only Llama 3.1 tokenizer hook is configured for this benchmark. Set ${EXACT_TOKENIZER_MODULE_ENV} to a module exporting countPromptTokens(messages) to enable calibration.`,
    };
  }
  const promptTokenError = estimate.estimatedPromptTokens - exactPromptTokens;
  return {
    exactTokenizerAvailable: true,
    exactPromptTokens,
    promptTokenError,
    promptTokenErrorPercent:
      exactPromptTokens > 0
        ? Number(((promptTokenError / exactPromptTokens) * 100).toFixed(2))
        : null,
  };
};

const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
await mkdir(OUTPUT_DIR, { recursive: true });
const exactTokenizer = await loadExactTokenizer();

const indexesForShapedMessages = (shapedMessages, sourceIndexes) => {
  const sourceIndexSet = new Set(
    (Array.isArray(sourceIndexes) ? sourceIndexes : [sourceIndexes]).filter(
      Number.isInteger
    )
  );
  return shapedMessages
    .map((message, index) =>
      sourceIndexSet.has(message.originalIndex) ? index : null
    )
    .filter(Number.isInteger);
};

const componentIndexesForShapedMessages = (
  shapedMessages,
  componentSourceIndexes
) =>
  Object.fromEntries(
    Object.entries(componentSourceIndexes).map(([name, sourceIndexes]) => [
      name,
      indexesForShapedMessages(shapedMessages, sourceIndexes),
    ])
  );

const componentTotalsSum = (componentTotals, field) =>
  Object.values(componentTotals).reduce((sum, total) => sum + total[field], 0);

const results = await Promise.all(
  scenarios.map(async (item) => {
    const startedAt = performance.now();
    const shapedMessagesWithMetadata = sanitizeTokenPlaceMessagesWithMetadata(
      item.combinedMessages
    );
    const tokenPlaceMessages = shapedMessagesWithMetadata.map(
      ({ role, content }) => ({
        role,
        content,
      })
    );
    const metrics = buildPromptMetrics(
      { combinedMessages: tokenPlaceMessages },
      {
        componentMessageIndexes: componentIndexesForShapedMessages(
          shapedMessagesWithMetadata,
          item.componentSourceIndexes
        ),
        promptBuildDurationMs: performance.now() - startedAt,
        ragDurationMs: item.componentSourceIndexes.rag === -1 ? null : 0,
      }
    );
    if (
      componentTotalsSum(metrics.componentTotals, 'characters') !==
      metrics.totalCharacters
    ) {
      throw new Error(
        `Component character totals do not sum to payload total for ${item.id}`
      );
    }
    if (
      componentTotalsSum(metrics.componentTotals, 'utf8Bytes') !==
      metrics.totalUtf8Bytes
    ) {
      throw new Error(
        `Component UTF-8 byte totals do not sum to payload total for ${item.id}`
      );
    }
    const contextEstimate =
      estimateTokenPlaceContextForSanitizedMessages(tokenPlaceMessages);
    const charCeiling =
      metrics.totalCharacters <= TOKEN_PLACE_API_V1_MAX_TOTAL_CONTENT_CHARS;
    const exactPromptTokens = await countExactPromptTokens(
      exactTokenizer,
      tokenPlaceMessages
    );
    return {
      id: item.id,
      description: item.description,
      sourceMessageCount: item.combinedMessages.length,
      tokenPlaceMessageCount: tokenPlaceMessages.length,
      metrics,
      charCeiling,
      contextEstimate,
      calibration: calibrationFor(contextEstimate, exactPromptTokens),
    };
  })
);

const jsonPath = path.join(OUTPUT_DIR, `${timestamp}.json`);
const mdPath = path.join(OUTPUT_DIR, `${timestamp}.md`);
const json = {
  generatedAt: new Date().toISOString(),
  fixturePolicy:
    'synthetic repository-owned benchmark data only; no user prompts or secrets',
  scenarios: results,
};
const markdown = [
  '# token.place Context Benchmark',
  '',
  `Generated: ${json.generatedAt}`,
  '',
  '| Scenario | Source messages | token.place messages | Chars | Char ceiling | UTF-8 bytes | Est. prompt tokens | Reserved output | Safety margin | Est. total | Selected tier | Over limit | Calibration | Dominant component |',
  '| --- | ---: | ---: | ---: | --- | ---: | ---: | ---: | ---: | ---: | --- | --- | --- | --- |',
  ...results.map((result) => {
    const entries = Object.entries(result.metrics.componentTotals);
    const [dominant] = entries.sort(
      (a, b) => b[1].characters - a[1].characters
    )[0];
    return `| ${result.id} | ${result.sourceMessageCount} | ${result.tokenPlaceMessageCount} | ${result.metrics.totalCharacters} | ${result.charCeiling ? 'yes' : 'no'} | ${result.metrics.totalUtf8Bytes} | ${result.contextEstimate.estimatedPromptTokens} | ${result.contextEstimate.reservedOutputTokens} | ${result.contextEstimate.safetyMarginTokens} | ${result.contextEstimate.estimatedTotalTokens} | ${result.contextEstimate.selectedTier || 'over-limit'} | ${result.contextEstimate.overLimit ? 'yes' : 'no'} | ${result.calibration.exactTokenizerAvailable ? `${result.calibration.promptTokenErrorPercent}%` : 'n/a'} | ${dominant} |`;
  }),
  '',
  `Profiles: 8k-fast=${TOKEN_PLACE_CONTEXT_TIERS['8k-fast'].totalContextTokens} tokens; 64k-full=${TOKEN_PLACE_CONTEXT_TIERS['64k-full'].totalContextTokens} tokens.`,
  '',
  'All values are content-free counts from synthetic fixtures after token.place request shaping. Estimator values are deterministic conservative heuristics over UTF-8 bytes plus chat-template overhead, output reservation, and safety margin; they are not exact model tokens. Calibration error is reported only when an exact development tokenizer is available.',
].join('\n');

await writeFile(jsonPath, `${JSON.stringify(json, null, 2)}\n`);
await writeFile(mdPath, `${markdown}\n`);
console.log(`Wrote ${jsonPath}`);
console.log(`Wrote ${mdPath}`);
