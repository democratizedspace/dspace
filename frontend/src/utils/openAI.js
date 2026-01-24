import { loadGameState, ready } from './gameState/common.js';
import { buildDchatKnowledge } from './dchatKnowledge.js';
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

const toNumericStatus = (status) => {
    if (typeof status === 'string') {
        return Number(status);
    }

    return status;
};

const isModelAccessError = (error) => {
    if (!error || typeof error !== 'object') return false;

    const status = toNumericStatus(error.status ?? error.statusCode);
    const code = error.code ?? error?.error?.code;
    const message = typeof error.message === 'string' ? error.message.toLowerCase() : undefined;

    if (status === 404) {
        return true;
    }

    if (status === 403 && code === 'model_not_found') {
        return true;
    }

    if (code === 'model_not_found') {
        return true;
    }

    return Boolean(message) && message.includes('model') && message.includes('does not exist');
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
        undefined;

    return { status, code, type, message };
};

export const describeOpenAIError = (error) => {
    const { status, code, type, message } = extractErrorDetails(error);
    const numericStatus = toNumericStatus(status);
    const normalizedMessage = message?.toLowerCase() ?? '';

    if (numericStatus === 401) {
        return 'OpenAI rejected your API key. Update your key in Settings and try again.';
    }

    if (numericStatus === 429 || code === 'rate_limit_exceeded') {
        if (
            normalizedMessage.includes('quota') ||
            code === 'insufficient_quota' ||
            type === 'insufficient_quota'
        ) {
            return (
                'OpenAI could not generate a reply because this account is out of credits. ' +
                'Add billing or wait for your quota to reset, then try again.'
            );
        }

        return 'OpenAI rate limited this request. Please wait a few seconds and try again.';
    }

    if (numericStatus === 403 || code === 'insufficient_permissions') {
        return (
            'OpenAI denied access to the requested model. Try another model or check your ' +
            'OpenAI account permissions.'
        );
    }

    if (typeof numericStatus === 'number' && numericStatus >= 500) {
        return 'OpenAI is unavailable right now. Please try again in a moment.';
    }

    if (normalizedMessage.includes('network') || normalizedMessage.includes('fetch')) {
        return 'We could not reach OpenAI. Check your connection and try again.';
    }

    return defaultOpenAIErrorMessage;
};

export const getOpenAIErrorNotice = (error) => {
    const { status, code, type, message } = extractErrorDetails(error);
    const numericStatus = toNumericStatus(status);
    const normalizedMessage = message?.toLowerCase() ?? '';
    let title = 'Chat error';

    if (numericStatus === 401) {
        title = 'OpenAI authentication error';
    } else if (numericStatus === 429 || code === 'rate_limit_exceeded') {
        if (
            normalizedMessage.includes('quota') ||
            code === 'insufficient_quota' ||
            type === 'insufficient_quota'
        ) {
            title = 'OpenAI quota exceeded';
        } else {
            title = 'OpenAI rate limit';
        }
    } else if (numericStatus === 403 || code === 'insufficient_permissions') {
        title = 'OpenAI permissions error';
    } else if (typeof numericStatus === 'number' && numericStatus >= 500) {
        title = 'OpenAI service error';
    } else if (normalizedMessage.includes('network') || normalizedMessage.includes('fetch')) {
        title = 'Network error';
    }

    return {
        title,
        message: describeOpenAIError(error) || defaultOpenAIErrorMessage,
    };
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

export const GPT5Chat = async (messages, options = {}) => {
    await ready;
    const gameState = loadGameState();
    const apiKey = gameState.openAI?.apiKey || '';
    const OpenAIClient = resolveOpenAIClient();
    const openai = new OpenAIClient({ apiKey, dangerouslyAllowBrowser: true });

    const persona = options.persona || defaultPersona;
    const systemMessage = {
        role: 'system',
        content: persona?.systemPrompt || fallbackSystemPrompt,
    };

    const knowledgeSummary = buildDchatKnowledge(gameState);
    const knowledgeMessage = knowledgeSummary
        ? {
              role: 'system',
              content: `DSPACE knowledge base:\n${knowledgeSummary}`,
          }
        : null;

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
        combinedMessages.push(openingMessage);
    } else {
        combinedMessages = [systemMessage];
        if (knowledgeMessage) {
            combinedMessages.push(knowledgeMessage);
        }
        combinedMessages = [...combinedMessages, ...userMessages];
    }

    const response = await createChatResponse(openai, combinedMessages.map(toResponseMessage));

    return toOutputText(response);
};
