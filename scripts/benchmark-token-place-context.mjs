import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createPromptMetrics } from '../frontend/src/utils/promptMetrics.js';

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..'
);
const outputDir = path.join(
  repoRoot,
  'artifacts',
  'benchmarks',
  'token-place-context'
);
const ceiling = 131_072;
const maxMessages = 64;
const maxMessageChars = 32_768;
const maxTotalChars = 131_072;
const tokenLiteSystemMessage =
  "You are dChat, a concise DSPACE assistant. Answer the user's message. If game-specific context is missing, say you do not know.";
const repeat = (label, chars) =>
  Array.from({ length: Math.ceil(chars / label.length) }, () => label)
    .join('')
    .slice(0, chars);
const msg = (role, content) => ({ role, content });

const shapeSyntheticTokenPlaceMessages = (messages) => {
  const shaped = [];
  let totalChars = 0;
  for (const message of messages) {
    const content = String(message.content || '').slice(0, maxMessageChars);
    if (
      !content ||
      totalChars + content.length > maxTotalChars ||
      shaped.length >= maxMessages
    ) {
      continue;
    }
    shaped.push({ role: message.role, content });
    totalChars += content.length;
  }
  return shaped;
};

const scenarios = [
  {
    id: 'token-lite-baseline',
    description:
      'Tiny token.place debug prompt with only system and latest user messages.',
    payload: {
      combinedMessages: [
        msg('system', tokenLiteSystemMessage),
        msg('user', 'Synthetic request for launch guidance.'),
      ],
    },
    components: [
      { index: 0, component: 'systemInstructions' },
      { index: 1, component: 'latestUserMessage' },
    ],
  },
  {
    id: 'minimal-full-fat',
    description:
      'Fresh full-fat shape with base instructions, small state, and one user turn.',
    messages: [
      msg('system', repeat('SYSTEM_RULE ', 900)),
      msg('system', repeat('PLAYER_STATE_MIN ', 220)),
      msg('user', 'Synthetic new commander asks what to do first.'),
    ],
    components: ['systemInstructions', 'playerState', 'latestUserMessage'],
  },
  {
    id: 'typical-mid-game',
    description:
      'Representative inventory, process, quest summary, docs, and short history.',
    messages: [
      msg('system', repeat('SYSTEM_RULE ', 1200)),
      msg('system', repeat('PLAYER_STATE_MIDGAME ', 4500)),
      msg('system', repeat('DOCS_RAG_SYNTHETIC ', 9000)),
      msg('user', 'Earlier synthetic question about solar.'),
      msg('assistant', 'Synthetic prior answer summary.'),
      msg('user', 'What process should this synthetic player start next?'),
    ],
    components: [
      'systemInstructions',
      'playerState',
      'rag',
      'chatHistory',
      'chatHistory',
      'latestUserMessage',
    ],
  },
  {
    id: 'rag-heavy',
    description: 'Large synthetic docs excerpts dominate the prompt.',
    messages: [
      msg('system', repeat('SYSTEM_RULE ', 1200)),
      msg('system', repeat('DOCS_RAG_HEAVY ', 42000)),
      msg('user', 'Summarize synthetic hydroponics prerequisites.'),
    ],
    components: ['systemInstructions', 'rag', 'latestUserMessage'],
  },
  {
    id: 'long-chat-history',
    description:
      'Many compact synthetic user/assistant turns before the latest request.',
    messages: [
      msg('system', repeat('SYSTEM_RULE ', 1200)),
      ...Array.from({ length: 40 }, (_, i) =>
        msg(i % 2 ? 'assistant' : 'user', repeat(`HISTORY_${i}_`, 700))
      ),
      msg('user', 'Latest synthetic recap request.'),
    ],
    components: null,
  },
  {
    id: 'large-player-state',
    description: 'Synthetic save snapshot dominates context use.',
    messages: [
      msg('system', repeat('SYSTEM_RULE ', 1200)),
      msg('system', repeat('PLAYER_STATE_LARGE ', 52000)),
      msg('system', repeat('DOCS_RAG_SYNTHETIC ', 6000)),
      msg('user', 'What changed in this synthetic save?'),
    ],
    components: [
      'systemInstructions',
      'playerState',
      'rag',
      'latestUserMessage',
    ],
  },
  {
    id: 'near-token-place-ceiling',
    description:
      'Synthetic prompt just below the 131,072-character token.place API v1 ceiling.',
    messages: [
      msg('system', repeat('SYSTEM_RULE ', 12000)),
      msg('system', repeat('PLAYER_STATE_CEILING ', 38000)),
      msg('system', repeat('DOCS_RAG_CEILING ', 50000)),
      msg('user', repeat('HISTORY_CEILING ', 30000)),
      msg(
        'user',
        repeat('LATEST_CEILING ', ceiling - 12000 - 38000 - 50000 - 30000 - 256)
      ),
    ],
    components: [
      'systemInstructions',
      'playerState',
      'rag',
      'chatHistory',
      'latestUserMessage',
    ],
  },
];

const runScenario = (scenario) => {
  const started = performance.now();
  const combinedMessages =
    scenario.payload?.combinedMessages || scenario.messages;
  const shaped = shapeSyntheticTokenPlaceMessages(combinedMessages);
  const metrics = createPromptMetrics(
    { combinedMessages: shaped },
    {
      components: (
        scenario.components ||
        shaped.map((message, index) => ({
          index,
          component:
            index === shaped.length - 1
              ? 'latestUserMessage'
              : index === 0
                ? 'systemInstructions'
                : 'chatHistory',
        }))
      ).map((component, index) =>
        typeof component === 'string' ? { index, component } : component
      ),
      promptBuildDurationMs: performance.now() - started,
      ragDurationMs: scenario.id.includes('rag') ? 0 : null,
    }
  );
  return { id: scenario.id, description: scenario.description, metrics };
};

const results = {
  generatedAt: new Date().toISOString(),
  privacy:
    'Synthetic fixtures only; metrics contain counts and timings, never prompt content.',
  scenarios: scenarios.map(runScenario),
};
const stamp = results.generatedAt.replace(/[:.]/g, '-');
await mkdir(outputDir, { recursive: true });
const jsonPath = path.join(outputDir, `${stamp}.json`);
const mdPath = path.join(outputDir, `${stamp}.md`);
await writeFile(jsonPath, `${JSON.stringify(results, null, 2)}\n`);
const markdown = [
  '# token.place context benchmark',
  '',
  results.privacy,
  '',
  '| Scenario | Messages | Chars | UTF-8 bytes | Top component |',
  '| --- | ---: | ---: | ---: | --- |',
  ...results.scenarios.map(({ id, metrics }) => {
    const top = Object.entries(metrics.componentTotals).sort(
      (a, b) => b[1].characters - a[1].characters
    )[0];
    return `| ${id} | ${metrics.messageCount} | ${metrics.totalCharacters} | ${metrics.totalUtf8Bytes} | ${top[0]} (${top[1].characters}) |`;
  }),
].join('\n');
await writeFile(mdPath, `${markdown}\n`);
console.log(`Wrote ${path.relative(repoRoot, jsonPath)}`);
console.log(`Wrote ${path.relative(repoRoot, mdPath)}`);
