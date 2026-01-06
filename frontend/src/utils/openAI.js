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

const defaultOpenAIErrorMessage =
    "Sorry, I couldn't reach OpenAI right now. Please try again shortly.";

const toLowerCase = (text) => {
    return typeof text === 'string' ? text.toLowerCase() : '';
};

const hasStatus = (error, status) => {
    const statusCode = error?.status ?? error?.statusCode;
    return statusCode === status;
};

const hasCode = (error, code) => {
    const errorCode = error?.code ?? error?.error?.code;
    return errorCode === code;
};

export const getOpenAIErrorMessage = (error) => {
    if (!error || typeof error !== 'object') {
        return defaultOpenAIErrorMessage;
    }

    const message = toLowerCase(error.message);

    if (hasStatus(error, 401) || hasCode(error, 'invalid_api_key')) {
        return 'OpenAI rejected the API key. Update it in Settings and try again.';
    }

    if (hasStatus(error, 429) || hasCode(error, 'insufficient_quota')) {
        if (message.includes('quota') || message.includes('credit')) {
            return 'OpenAI reports your account is out of credits. Add billing or wait for your quota to reset, then try again.';
        }

        return 'OpenAI is rate limiting requests right now. Please wait a few seconds and retry.';
    }

    if (hasStatus(error, 403) || hasCode(error, 'insufficient_permissions')) {
        return 'Your OpenAI key cannot access this model. Switch models or update your plan before trying again.';
    }

    if (hasStatus(error, 503) || hasStatus(error, 500) || hasCode(error, 'server_error')) {
        return 'OpenAI is temporarily unavailable. Please try again in a moment.';
    }

    if (message.includes('fetch failed') || message.includes('network')) {
        return 'We could not contact OpenAI due to a network issue. Check your connection and try again.';
    }

    return defaultOpenAIErrorMessage;
};

const isModelAccessError = (error) => {
    if (!error || typeof error !== 'object') return false;

    const status = error.status ?? error.statusCode;
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

export const GPT35Turbo = async (messages, options = {}) => {
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
