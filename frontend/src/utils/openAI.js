import { loadGameState, ready } from './gameState/common.js';
import { buildDchatKnowledge, buildDchatKnowledgePack } from './dchatKnowledge.js';
import { searchDocsRag, searchDocsRagWithSources } from './docsRag.js';
import { npcPersonas } from '../data/npcPersonas.js';
import OpenAI from 'openai';

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
const fallbackSystemPrompt =
    defaultPersona?.systemPrompt ||
    "You are dChat, a helpful assistant in the game DSPACE. Your purpose is to assist players by providing information, guidance, and support related to the game. DSPACE is a web-based space exploration idle game where you can 3D print things, grow plants hydroponically, and create and launch model rockets. The game is fully open source, and development is ongoing. DSPACE is made from a combination of the founder, Esp, and a variety of generative models, including GPT-5, Stable Diffusion, and DALL-E 2. You have curated knowledge about quests, items, processes, and the player's inventory. If you encounter anything you're not sure about, tell the user you don't know and suggest checking out the docs or joining the Discord server. If someone talks about something off-topic, humor them and help out with whatever they need, but don't output anything harmful or offensive. Have fun!";
const fallbackWelcomeMessage =
    defaultPersona?.welcomeMessage || 'Welcome! How can I assist you today?';
export const defaultOpenAIErrorMessage =
    "Sorry, I'm having some trouble and can't generate a response.";
const sharedSystemGuardrail =
    'Never invent quests, items, processes, routes, URLs, or player state. If you are ' +
    "unsure, say you don't know and direct the player to /docs or docs/ROUTES.md.";

const applySystemGuardrail = (prompt) => {
    if (!prompt) return sharedSystemGuardrail;
    const normalizedPrompt = prompt.toLowerCase();
    const hasNeverInvent = normalizedPrompt.includes('never invent');
    const hasGuardedDomain = /(quests|items|processes|routes|player state|urls?)/.test(
        normalizedPrompt
    );
    if (hasNeverInvent && hasGuardedDomain) return prompt;
    return `${prompt}\n\n${sharedSystemGuardrail}`;
};

const toNumericStatus = (status) => {
    if (typeof status === 'string') {
        return Number(status);
    }

    return status;
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
    const models = [defaultModel, ...fallbackModels];

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
    const gameState = loadGameState();

    const persona = options.persona || defaultPersona;
    const systemMessage = {
        role: 'system',
        content: applySystemGuardrail(persona?.systemPrompt || fallbackSystemPrompt),
    };

    const knowledgeSummary = buildDchatKnowledge(gameState);
    const knowledgeMessage = knowledgeSummary
        ? {
              role: 'system',
              content: `DSPACE knowledge base:\n${knowledgeSummary}`,
          }
        : null;
    const latestUserMessage = [...messages]
        .reverse()
        .find((message) => message.role === 'user' && message.content?.trim());
    const docsRagPayload = latestUserMessage
        ? await searchDocsRag(latestUserMessage.content)
        : { excerptsText: '' };
    const docsRagMessage = docsRagPayload.excerptsText
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

    const userMessages = [...messages];
    let combinedMessages = [...userMessages];

    if (combinedMessages.length === 0) {
        combinedMessages = [systemMessage];
        if (knowledgeMessage) {
            combinedMessages.push(knowledgeMessage);
        }
        if (docsRagMessage && !knowledgeMessage) {
            combinedMessages.push(docsRagMessage);
        }
        combinedMessages.push(openingMessage);
    } else {
        combinedMessages = [systemMessage];
        if (knowledgeMessage) {
            combinedMessages.push(knowledgeMessage);
        }
        if (docsRagMessage && !knowledgeMessage) {
            combinedMessages.push(docsRagMessage);
        }
        combinedMessages = [...combinedMessages, ...userMessages];
    }

    const ragMessages = new Set([knowledgeMessage, docsRagMessage].filter(Boolean));
    const debugMessages = combinedMessages.map((message) => ({
        role: message.role,
        content: message.content,
        kind: ragMessages.has(message) ? 'rag' : 'main',
    }));

    return { combinedMessages, debugMessages, gameState };
};

const dedupeContextSources = (sources = []) => {
    const seen = new Set();
    const deduped = [];

    for (const source of sources) {
        if (!source) continue;
        const key = `${source.type}|${source.id}|${source.url ?? ''}`;
        if (seen.has(key)) {
            continue;
        }
        seen.add(key);
        deduped.push(source);
    }

    return deduped;
};

const sortContextSources = (sources = []) => {
    return sources.sort((a, b) => {
        const typeCompare = String(a.type || '').localeCompare(String(b.type || ''));
        if (typeCompare !== 0) {
            return typeCompare;
        }
        const labelCompare = String(a.label || '').localeCompare(String(b.label || ''));
        if (labelCompare !== 0) {
            return labelCompare;
        }
        return String(a.id || '').localeCompare(String(b.id || ''));
    });
};

export const buildChatPromptWithSources = async (messages, options = {}) => {
    await ready;
    const gameState = loadGameState();

    const persona = options.persona || defaultPersona;
    const systemMessage = {
        role: 'system',
        content: applySystemGuardrail(persona?.systemPrompt || fallbackSystemPrompt),
    };

    const knowledgePack = buildDchatKnowledgePack(gameState);
    const knowledgeMessage = knowledgePack.summary
        ? {
              role: 'system',
              content: `DSPACE knowledge base:\n${knowledgePack.summary}`,
          }
        : null;
    const latestUserMessage = [...messages]
        .reverse()
        .find((message) => message.role === 'user' && message.content?.trim());
    const docsRagPayload = latestUserMessage
        ? await searchDocsRagWithSources(latestUserMessage.content)
        : { excerptsText: '', sources: [] };
    const docsRagMessage = docsRagPayload.excerptsText
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

    const userMessages = [...messages];
    let combinedMessages = [...userMessages];

    if (combinedMessages.length === 0) {
        combinedMessages = [systemMessage];
        if (knowledgeMessage) {
            combinedMessages.push(knowledgeMessage);
        }
        if (docsRagMessage && !knowledgeMessage) {
            combinedMessages.push(docsRagMessage);
        }
        combinedMessages.push(openingMessage);
    } else {
        combinedMessages = [systemMessage];
        if (knowledgeMessage) {
            combinedMessages.push(knowledgeMessage);
        }
        if (docsRagMessage && !knowledgeMessage) {
            combinedMessages.push(docsRagMessage);
        }
        combinedMessages = [...combinedMessages, ...userMessages];
    }

    const ragMessages = new Set([knowledgeMessage, docsRagMessage].filter(Boolean));
    const debugMessages = combinedMessages.map((message) => ({
        role: message.role,
        content: message.content,
        kind: ragMessages.has(message) ? 'rag' : 'main',
    }));

    const mergedSources = dedupeContextSources([
        ...(knowledgePack.sources || []),
        ...(docsRagPayload.sources || []),
    ]);

    return {
        combinedMessages,
        debugMessages,
        gameState,
        contextSources: sortContextSources(mergedSources),
    };
};

export const GPT5Chat = async (messages, options = {}) => {
    const promptPayload = options.promptPayload || (await buildChatPrompt(messages, options));
    const { combinedMessages, gameState } = promptPayload;
    const apiKey = gameState.openAI?.apiKey || ''; // scan-secrets: ignore
    const OpenAIClient = resolveOpenAIClient();
    const openai = new OpenAIClient({ apiKey, dangerouslyAllowBrowser: true });

    const response = await createChatResponse(openai, combinedMessages.map(toResponseMessage));

    return toOutputText(response);
};

export const GPT5ChatV2 = async (messages, options = {}) => {
    const promptPayload =
        options.promptPayload || (await buildChatPromptWithSources(messages, options));
    const { combinedMessages, gameState, contextSources } = promptPayload;
    const apiKey = gameState.openAI?.apiKey || ''; // scan-secrets: ignore
    const OpenAIClient = resolveOpenAIClient();
    const openai = new OpenAIClient({ apiKey, dangerouslyAllowBrowser: true });

    const response = await createChatResponse(openai, combinedMessages.map(toResponseMessage));

    return {
        text: toOutputText(response),
        contextSources: Array.isArray(contextSources) ? contextSources : [],
    };
};
