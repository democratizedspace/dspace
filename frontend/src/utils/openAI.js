import { loadGameState, ready } from './gameState/common.js';
import { buildDchatKnowledgePack } from './dchatKnowledge.js';
import { mergeSources } from './contextSources.js';
import { searchDocsRag } from './docsRag.js';
import { npcPersonas } from '../data/npcPersonas.js';
import OpenAI from 'openai';
import { getPromptVersionLabel, getPromptVersionSha } from './buildInfo.js';

const resolveOpenAIClient = () => {
    if (
        typeof globalThis !== 'undefined' &&
        typeof globalThis.__DSpaceOpenAIClient === 'function'
    ) {
        return globalThis.__DSpaceOpenAIClient;
    }
    return OpenAI;
};

const toResponseMessage = (message) => {
    const contentType = message.role === 'assistant' ? 'output_text' : 'input_text';
    return {
        role: message.role,
        content: [{ type: contentType, text: message.content }],
    };
};

const toOutputText = (response) => {
    if (!response) return '';

    if (typeof response.output_text === 'string' && response.output_text.trim()) {
        return response.output_text;
    }

    const outputContent = response.output?.flatMap((entry) => entry.content || []);
    const outputText = outputContent?.find((block) => block.type === 'output_text')?.text;

    return outputText || '';
};

const defaultPersona = npcPersonas.find((persona) => persona.id === 'dchat');
const defaultModel = 'gpt-5.2';
const fallbackModels = ['gpt-5-mini'];
export const CHAT_PROMPT_VERSION = getPromptVersionLabel();
export const SYSTEM_POLICY_VERSION_LINE = 'SYSTEM_POLICY_VERSION=v3.0 never-invent-game-facts';
export const safeFallbackMessage = "I don't know; please check /docs for the latest details.";
export const providerRealityLine = 'In v3, chat uses OpenAI. token.place is deferred to v3.1.';
export const fallbackSystemPrompt =
    defaultPersona?.systemPrompt ||
    "You are dChat, a helpful assistant in the game DSPACE. Your purpose is to assist players by providing information, guidance, and support related to the game. DSPACE is a web-based space exploration idle game where you can 3D print things, grow plants hydroponically, and create and launch model rockets. The game is fully open source, and development is ongoing. DSPACE is made from a combination of the founder, Esp, and a variety of generative models, including GPT-5, Stable Diffusion, and DALL-E 2. You have curated knowledge about quests, items, processes, and how inventory and progression systems work in general. Use the PlayerState block when provided; if it is missing, ask for a /gamesaves export. If you encounter anything you're not sure about, tell the user you don't know and suggest checking out the docs or joining the Discord server. If someone talks about something off-topic, humor them and help out with whatever they need, but don't output anything harmful or offensive. Have fun!";
export const fallbackWelcomeMessage =
    defaultPersona?.welcomeMessage || 'Welcome! How can I assist you today?';
export const defaultOpenAIErrorMessage =
    "Sorry, I'm having some trouble and can't generate a response.";
const guardrailRules = [
    {
        line: 'Never invent game facts or player state.',
        pattern: /never invent/i,
    },
    {
        line: 'Use the PlayerState block when present.',
        pattern: /playerstate block/i,
    },
    {
        line: 'If PlayerState is missing, ask for a save snapshot via /gamesaves and cite /docs/routes.',
        pattern: /playerstate is missing/i,
    },
    {
        line:
            "If you're missing context, say you don't know and ask a clarifying question OR point " +
            'to a specific /docs page.',
        pattern: /clarifying question/i,
    },
    {
        line: 'When giving URLs/navigation, cite /docs excerpts or docs/ROUTES.md.',
        pattern: /docs\/routes\.md/i,
    },
    {
        line: 'Never link to GitHub blob/tree URLs for docs; use in-game /docs routes and cite them.',
        pattern: /github.*blob\/tree.*docs/i,
    },
    {
        line:
            'Only give exact counts/durations/rates if they appear in retrieved context; otherwise be ' +
            "approximate or say you don't know.",
        pattern: /only give exact/i,
    },
];
const sharedSystemGuardrail = guardrailRules.map((rule) => rule.line).join('\n');
const vagueFollowupPattern =
    /^\s*(what about|and then|that step|the second step|next step|step 2)\b/i;
const retrievalContextLimit = 800;
const retrievalQueryLimit = 1000;
const MAX_PLAYER_STATE_ITEMS = 50;
const docsRagOptions = {
    maxResults: 50,
    maxChars: 50000,
    maxExcerptChars: 8500,
};
const docsRagPromptBudgetChars = 80000;

const readEnvValue = (key) => {
    if (typeof import.meta !== 'undefined' && import.meta.env?.[key]) {
        return import.meta.env[key];
    }
    if (typeof process !== 'undefined' && process.env?.[key]) {
        return process.env?.[key];
    }
    return undefined;
};

const parseEnvList = (value) =>
    (value || '')
        .split(',')
        .map((entry) => entry.trim())
        .filter(Boolean);

const dedupeList = (values) => {
    const seen = new Set();
    return values.filter((value) => {
        const normalized = value?.trim();
        if (!normalized || seen.has(normalized)) {
            return false;
        }
        seen.add(normalized);
        return true;
    });
};

const getChatModelConfig = () => {
    const envModel = readEnvValue('VITE_CHAT_MODEL');
    const envFallbackModels = readEnvValue('VITE_CHAT_FALLBACK_MODELS');
    const resolvedModel = envModel?.trim() || defaultModel;
    const resolvedFallbackModels =
        envFallbackModels && envFallbackModels.trim()
            ? parseEnvList(envFallbackModels)
            : fallbackModels;
    const dedupedModels = dedupeList([resolvedModel, ...resolvedFallbackModels]);
    return {
        defaultModel: dedupedModels[0] || defaultModel,
        fallbackModels: dedupedModels.slice(1),
    };
};

const githubDocsLinkPattern =
    /https?:\/\/github\.com\/democratizedspace\/dspace\/(?:blob|tree)\/[^\s)]+/gi;

const resolveDocsRouteFromGithubPath = (docsPath) => {
    if (!docsPath) return null;
    if (/^docs\/routes\.md$/i.test(docsPath)) {
        return '/docs/routes';
    }
    const docsPageMatch = docsPath.match(/^frontend\/src\/pages\/docs\/md\/(.+)\.md$/i);
    if (docsPageMatch) {
        const slugPath = docsPageMatch[1].replace(/\\/g, '/');
        return `/docs/${slugPath}`;
    }
    return null;
};

const rewriteGithubDocsLink = (url) => {
    try {
        const parsed = new URL(url);
        const match = parsed.pathname.match(
            /^\/democratizedspace\/dspace\/(?:blob|tree)\/[^/]+\/(.+)$/
        );
        if (!match) {
            return null;
        }
        return resolveDocsRouteFromGithubPath(match[1]);
    } catch (error) {
        return null;
    }
};

const sanitizeGithubDocsLinks = (text) => {
    if (!text) {
        return { text: text || '', wasSanitized: false };
    }

    let sanitized = false;
    const rewritten = text.replace(githubDocsLinkPattern, (url) => {
        let cleanedUrl = url;
        let trailingPunctuation = '';
        while (/[.,!?;:]$/.test(cleanedUrl)) {
            trailingPunctuation = cleanedUrl.slice(-1) + trailingPunctuation;
            cleanedUrl = cleanedUrl.slice(0, -1);
        }
        const resolved = rewriteGithubDocsLink(cleanedUrl);
        sanitized = true;
        return `${resolved || '[link removed: use /docs routes]'}${trailingPunctuation}`;
    });

    return { text: rewritten, wasSanitized: sanitized };
};

export const validateChatResponseText = (text, options = {}) => {
    const textValue = typeof text === 'string' ? text : '';
    const sanitizedLinks = sanitizeGithubDocsLinks(textValue);
    const sanitizedText = sanitizedLinks.text;
    const normalizedText = sanitizedText.trim();
    if (!normalizedText) {
        return { text: sanitizedText, wasSanitized: sanitizedLinks.wasSanitized };
    }

    const hasContextSources =
        Array.isArray(options.contextSources) && options.contextSources.length > 0;
    if (hasContextSources) {
        return { text: sanitizedText, wasSanitized: sanitizedLinks.wasSanitized };
    }

    const suspiciousPrecisionPattern =
        /\bexactly\s+\d+(?:\.\d+)?\s+(?:quests?|items?|minutes?|hours?|days?|percent|%)\b|\b\d+\.\d+\s*(?:%|percent)\b/i;
    const citationMarkerPattern =
        /\[[^\]]+\]|【\d+†[^】]+】|\/docs\/|docs\/ROUTES\.md|sources?:|https?:\/\//i;
    const hasSuspiciousPrecision = suspiciousPrecisionPattern.test(normalizedText);
    const hasCitationMarkers = citationMarkerPattern.test(normalizedText);

    if (hasSuspiciousPrecision && !hasCitationMarkers) {
        return { text: safeFallbackMessage, wasSanitized: true };
    }

    return { text: sanitizedText, wasSanitized: sanitizedLinks.wasSanitized };
};

const applyProviderRealityLine = (prompt) => {
    const basePrompt = prompt || providerRealityLine;
    const normalizedPrompt = basePrompt.toLowerCase();
    const normalizedRealityLine = providerRealityLine.toLowerCase();
    if (normalizedPrompt.includes(normalizedRealityLine)) {
        if (basePrompt.includes(providerRealityLine)) {
            return basePrompt;
        }
        const escapedRealityLine = providerRealityLine.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const realityLinePattern = new RegExp(escapedRealityLine, 'i');
        return basePrompt.replace(realityLinePattern, providerRealityLine);
    }
    return `${providerRealityLine}\n\n${basePrompt}`;
};

const applySystemGuardrail = (prompt) => {
    if (!prompt) return sharedSystemGuardrail;
    const normalizedPrompt = prompt.toLowerCase();
    const missingRules = guardrailRules.filter((rule) => !rule.pattern.test(normalizedPrompt));
    if (missingRules.length === 0) return prompt;
    const missingGuardrail = missingRules.map((rule) => rule.line).join('\n');
    return `${prompt}\n\n${missingGuardrail}`;
};

const applySystemPolicyVersion = (prompt) => {
    if (!prompt) return SYSTEM_POLICY_VERSION_LINE;
    if (prompt.includes(SYSTEM_POLICY_VERSION_LINE)) return prompt;
    return `${SYSTEM_POLICY_VERSION_LINE}\n${prompt}`;
};

const toNumericStatus = (status) => {
    if (typeof status === 'string') {
        return Number(status);
    }

    return status;
};

const normalizeQueryText = (text) => (text || '').replace(/\s+/g, ' ').trim();

const truncateText = (text, maxLength) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength);
};

const countPromptChars = (messages) => {
    if (!Array.isArray(messages)) return 0;
    return messages.reduce((total, message) => total + (message?.content?.length || 0), 0);
};

const normalizeVersionNumberString = (value) => {
    if (typeof value === 'string' && value.trim()) {
        return value.trim();
    }
    if (typeof value === 'number' && Number.isFinite(value)) {
        return String(value);
    }
    return '3';
};

const buildPlayerStateSnapshot = (gameState, options = {}) => {
    const { maxInventoryEntries = MAX_PLAYER_STATE_ITEMS } = options;
    if (!gameState || typeof gameState !== 'object') {
        return {
            block: null,
            meta: {
                included: false,
                questsFinishedCount: 0,
                inventoryIncludedCount: 0,
                inventoryTotalCount: 0,
                inventoryTruncated: false,
            },
        };
    }

    const questsFinished = Object.entries(gameState.quests || {})
        .filter(([, questState]) => questState?.finished)
        .map(([questId]) => questId)
        .sort((a, b) => a.localeCompare(b));

    const inventoryEntries = Object.entries(gameState.inventory || {})
        .filter(([, count]) => typeof count === 'number' && Number.isFinite(count) && count > 0)
        .map(([id, count]) => ({ id, count }))
        .sort((a, b) => {
            if (b.count !== a.count) {
                return b.count - a.count;
            }
            return a.id.localeCompare(b.id);
        });

    const totalItems = inventoryEntries.length;
    const truncated = totalItems > maxInventoryEntries;
    const includedInventory = truncated
        ? inventoryEntries.slice(0, maxInventoryEntries)
        : inventoryEntries;

    const versionNumberString = normalizeVersionNumberString(gameState.versionNumberString);
    const snapshot = {
        versionNumberString,
        questsFinished,
        inventory: includedInventory,
    };

    if (truncated) {
        snapshot.truncated = true;
        snapshot.totalItems = totalItems;
    }

    const block = `PlayerState v${versionNumberString} (authoritative; do not infer beyond this):\n${JSON.stringify(
        snapshot,
        null,
        2
    )}`;

    return {
        block,
        meta: {
            included: true,
            questsFinishedCount: questsFinished.length,
            inventoryIncludedCount: includedInventory.length,
            inventoryTotalCount: totalItems,
            inventoryTruncated: truncated,
        },
    };
};

export const getPlayerStateSummary = (gameState = loadGameState()) => {
    const hasGameState = gameState && typeof gameState === 'object';
    return buildPlayerStateSnapshot(hasGameState ? gameState : null).meta;
};

const buildDocsRagOptions = ({ promptBudgetChars, options, baseMessages }) => {
    const budget =
        typeof promptBudgetChars === 'number' && Number.isFinite(promptBudgetChars)
            ? Math.max(0, promptBudgetChars)
            : docsRagPromptBudgetChars;
    const baseOptions = { ...docsRagOptions, ...(options || {}) };
    const remainingBudget = Math.max(0, budget - countPromptChars(baseMessages));

    return {
        ...baseOptions,
        maxChars: Math.min(baseOptions.maxChars, remainingBudget),
    };
};

const buildRetrievalQuery = (messages, latestUserMessage) => {
    if (!latestUserMessage) return '';
    const latestText = normalizeQueryText(latestUserMessage.content);
    if (!latestText) return latestUserMessage.content || '';

    const isVague = vagueFollowupPattern.test(latestText);
    if (!isVague) {
        return latestUserMessage.content;
    }

    const latestIndex = messages.lastIndexOf(latestUserMessage);
    let prevUserMessage;
    let prevAssistantMessage;
    for (let index = latestIndex - 1; index >= 0; index -= 1) {
        const candidate = messages[index];
        if (!prevUserMessage && candidate.role === 'user' && candidate.content?.trim()) {
            prevUserMessage = candidate;
        }
        if (!prevAssistantMessage && candidate.role === 'assistant' && candidate.content?.trim()) {
            prevAssistantMessage = candidate;
        }
        if (prevUserMessage && prevAssistantMessage) break;
    }

    const prevUserText = normalizeQueryText(prevUserMessage?.content);
    const prevAssistantText = normalizeQueryText(prevAssistantMessage?.content);
    const perMessageLimit = Math.floor(retrievalContextLimit / 2);
    const cappedPrevUserText = truncateText(prevUserText, perMessageLimit);
    const cappedPrevAssistantText = truncateText(prevAssistantText, perMessageLimit);
    const combinedContext = [cappedPrevUserText, cappedPrevAssistantText]
        .filter(Boolean)
        .join('\n\n');

    if (!combinedContext) {
        return latestUserMessage.content;
    }

    const baseQuery = `${latestText}\n\nPrevious context:\n`;
    const availableContextLength = Math.max(
        0,
        Math.min(retrievalContextLimit, retrievalQueryLimit - baseQuery.length)
    );
    const cappedContext = truncateText(combinedContext, availableContextLength);
    const retrievalQuery = `${baseQuery}${cappedContext}`;

    return truncateText(retrievalQuery, retrievalQueryLimit);
};

const extractErrorDetails = (error) => {
    const status =
        error?.status ??
        error?.statusCode ??
        error?.response?.status ??
        error?.cause?.status ??
        error?.error?.status;
    const code =
        error?.code ?? error?.error?.code ?? error?.response?.data?.error?.code ?? undefined;
    const type =
        error?.error?.type ?? error?.response?.data?.error?.type ?? error?.type ?? undefined;
    const message =
        error?.error?.message ??
        error?.response?.data?.error?.message ??
        error?.message ??
        error?.cause?.message ??
        undefined;

    return { status, code, type, message };
};

const isModelAccessError = (error) => {
    if (!error || typeof error !== 'object') return false;

    const { status, code, message } = extractErrorDetails(error);
    const numericStatus = toNumericStatus(status);
    const normalizedMessage = typeof message === 'string' ? message.toLowerCase() : '';
    const hasMissingModelMessage =
        normalizedMessage.includes('model') &&
        (normalizedMessage.includes('not found') || normalizedMessage.includes('does not exist'));

    if (code === 'model_not_found') {
        return true;
    }

    if (numericStatus === 404 && hasMissingModelMessage) {
        return true;
    }

    if (numericStatus === 403 && code === 'model_not_found') {
        return true;
    }

    return hasMissingModelMessage;
};

export const describeOpenAIError = (error) => {
    return getOpenAIErrorSummary(error).message;
};

export const getOpenAIErrorSummary = (error) => {
    const { status, code, type, message } = extractErrorDetails(error);
    const numericStatus = toNumericStatus(status);
    const normalizedMessage = message?.toLowerCase() ?? '';
    const normalizedName = error?.name?.toLowerCase() ?? '';
    const normalizedCauseMessage = error?.cause?.message?.toLowerCase() ?? '';
    const normalizedCauseName = error?.cause?.name?.toLowerCase() ?? '';
    const isOffline = typeof navigator !== 'undefined' && navigator.onLine === false;
    const isTypeErrorWithoutMessage =
        normalizedName === 'typeerror' && !normalizedMessage && numericStatus == null;
    const isCauseTypeErrorWithoutMessage =
        normalizedCauseName === 'typeerror' && !normalizedCauseMessage && numericStatus == null;

    if (numericStatus === 401) {
        return {
            type: 'auth',
            message: 'OpenAI rejected your API key. Update your key in Settings and try again.',
        };
    }

    if (numericStatus === 429 || code === 'rate_limit_exceeded') {
        if (
            normalizedMessage.includes('quota') ||
            code === 'insufficient_quota' ||
            type === 'insufficient_quota'
        ) {
            return {
                type: 'quota',
                message:
                    'OpenAI could not generate a reply because this account is out of credits. ' +
                    'Add billing or wait for your quota to reset, then try again.',
            };
        }

        return {
            type: 'rate_limit',
            message: 'OpenAI rate limited this request. Please wait a few seconds and try again.',
        };
    }

    if (isModelAccessError(error)) {
        return {
            type: 'permission',
            message:
                'OpenAI denied access to the requested model. Try another model or check your ' +
                'OpenAI account permissions.',
        };
    }

    if (numericStatus === 403 || code === 'insufficient_permissions') {
        return {
            type: 'permission',
            message:
                'OpenAI denied access to the requested model. Try another model or check your ' +
                'OpenAI account permissions.',
        };
    }

    if (typeof numericStatus === 'number' && numericStatus >= 500) {
        return {
            type: 'server',
            message: 'OpenAI is unavailable right now. Please try again in a moment.',
        };
    }

    if (
        isOffline ||
        isTypeErrorWithoutMessage ||
        isCauseTypeErrorWithoutMessage ||
        normalizedName.includes('network') ||
        normalizedCauseName.includes('network') ||
        normalizedMessage.includes('network') ||
        normalizedCauseMessage.includes('network') ||
        normalizedMessage.includes('fetch') ||
        normalizedCauseMessage.includes('fetch') ||
        normalizedMessage.includes('load failed') ||
        normalizedCauseMessage.includes('load failed') ||
        normalizedMessage.includes('networkerror') ||
        normalizedCauseMessage.includes('networkerror')
    ) {
        return {
            type: 'network',
            message: 'We could not reach OpenAI. Check your connection and try again.',
        };
    }

    return { type: 'unknown', message: defaultOpenAIErrorMessage };
};

async function createChatResponse(openai, input) {
    const { defaultModel: resolvedModel, fallbackModels: resolvedFallbackModels } =
        getChatModelConfig();
    const models = [resolvedModel, ...resolvedFallbackModels];

    for (let index = 0; index < models.length; index += 1) {
        const model = models[index];

        try {
            return await openai.responses.create({ model, input });
        } catch (error) {
            const hasFallback = index < models.length - 1;
            if (!hasFallback || !isModelAccessError(error)) {
                throw error;
            }
        }
    }
}

export const buildChatPrompt = async (messages, options = {}) => {
    await ready;
    const normalizedMessages = Array.isArray(messages) ? messages : [];
    const rawGameState = loadGameState();
    const hasGameState = rawGameState && typeof rawGameState === 'object';
    const gameState = hasGameState ? rawGameState : {};
    const playerStateSnapshot = buildPlayerStateSnapshot(hasGameState ? rawGameState : null);
    const playerStateMessage = playerStateSnapshot.block
        ? {
              role: 'system',
              content: playerStateSnapshot.block,
          }
        : null;

    const persona = options.persona || defaultPersona;
    const systemPrompt = applySystemPolicyVersion(
        applyProviderRealityLine(
            applySystemGuardrail(persona?.systemPrompt || fallbackSystemPrompt)
        )
    );
    const systemMessage = {
        role: 'system',
        content: `Prompt version: v3:${getPromptVersionSha()}\n${systemPrompt}`,
    };

    const knowledgePack = buildDchatKnowledgePack(gameState);
    const knowledgeSummary = knowledgePack.summary;
    const knowledgeMessage = knowledgeSummary
        ? {
              role: 'system',
              content: `DSPACE knowledge base:\n${knowledgeSummary}`,
          }
        : null;
    const docsRagRequestOptions = buildDocsRagOptions({
        promptBudgetChars: options.docsRagBudgetChars,
        options: options.docsRagOptions,
        baseMessages: [
            systemMessage,
            ...(playerStateMessage ? [playerStateMessage] : []),
            ...(knowledgeMessage ? [knowledgeMessage] : []),
            ...normalizedMessages,
        ],
    });
    const latestUserMessage = [...normalizedMessages]
        .reverse()
        .find((message) => message.role === 'user' && message.content?.trim());
    const retrievalQuery = latestUserMessage
        ? buildRetrievalQuery(normalizedMessages, latestUserMessage)
        : '';
    const docsRagPayload = latestUserMessage
        ? await searchDocsRag(retrievalQuery, docsRagRequestOptions)
        : { excerptsText: '', sources: [] };
    const docsRagMessage =
        !knowledgeMessage && docsRagPayload.excerptsText
            ? {
                  role: 'system',
                  content: docsRagPayload.excerptsText,
              }
            : null;

    if (knowledgeMessage && docsRagPayload.excerptsText) {
        knowledgeMessage.content = `${knowledgeMessage.content}\n\n${docsRagPayload.excerptsText}`;
    }

    const openingMessage = {
        role: 'assistant',
        content: persona?.welcomeMessage || fallbackWelcomeMessage,
    };

    let combinedMessages = [...normalizedMessages];

    if (combinedMessages.length === 0) {
        combinedMessages = [systemMessage];
        if (playerStateMessage) {
            combinedMessages.push(playerStateMessage);
        }
        if (knowledgeMessage) {
            combinedMessages.push(knowledgeMessage);
        }
        if (docsRagMessage && !knowledgeMessage) {
            combinedMessages.push(docsRagMessage);
        }
        combinedMessages.push(openingMessage);
    } else {
        combinedMessages = [systemMessage];
        if (playerStateMessage) {
            combinedMessages.push(playerStateMessage);
        }
        if (knowledgeMessage) {
            combinedMessages.push(knowledgeMessage);
        }
        if (docsRagMessage && !knowledgeMessage) {
            combinedMessages.push(docsRagMessage);
        }
        combinedMessages = [...combinedMessages, ...normalizedMessages];
    }

    const ragMessages = new Set([knowledgeMessage, docsRagMessage].filter(Boolean));
    const debugMessages = combinedMessages.map((message) => ({
        role: message.role,
        content: message.content,
        kind: ragMessages.has(message) ? 'rag' : 'main',
    }));

    const contextSources = mergeSources(knowledgePack.sources || [], docsRagPayload.sources || []);

    return {
        combinedMessages,
        debugMessages,
        gameState,
        contextSources,
        playerStateSummary: playerStateSnapshot.meta,
    };
};

export const GPT5Chat = async (messages, options = {}) => {
    const promptPayload = options.promptPayload || (await buildChatPrompt(messages, options));
    const { combinedMessages, gameState, contextSources } = promptPayload;
    const apiKey = gameState?.openAI?.apiKey || ''; // scan-secrets: ignore
    const OpenAIClient = resolveOpenAIClient();
    const openai = new OpenAIClient({ apiKey, dangerouslyAllowBrowser: true });

    const response = await createChatResponse(openai, combinedMessages.map(toResponseMessage));
    const outputText = toOutputText(response);
    const { text } = validateChatResponseText(outputText, { contextSources });

    return text;
};

export const GPT5ChatV2 = async (messages, options = {}) => {
    const promptPayload = options.promptPayload || (await buildChatPrompt(messages, options));
    const { combinedMessages, gameState, contextSources } = promptPayload;
    const apiKey = gameState?.openAI?.apiKey || ''; // scan-secrets: ignore
    const OpenAIClient = resolveOpenAIClient();
    const openai = new OpenAIClient({ apiKey, dangerouslyAllowBrowser: true });

    const response = await createChatResponse(openai, combinedMessages.map(toResponseMessage));
    const outputText = toOutputText(response);
    const { text } = validateChatResponseText(outputText, { contextSources });

    return {
        text,
        contextSources: Array.isArray(contextSources) ? contextSources : [],
    };
};
