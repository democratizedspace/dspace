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

const toResponseMessage = (message) => ({
    role: message.role,
    content: [{ type: 'text', text: message.content }],
});

const defaultPersona = npcPersonas.find((persona) => persona.id === 'dchat');
const fallbackSystemPrompt =
    defaultPersona?.systemPrompt ||
    "You are dChat, a helpful assistant in the game DSPACE. Your purpose is to assist players by providing information, guidance, and support related to the game. DSPACE is a web-based space exploration idle game where you can 3D print things, grow plants hydroponically, and create and launch model rockets. The game is fully open source, and development is ongoing. DSPACE is made from a combination of the founder, Esp, and a variety of generative models, including GPT-5, Stable Diffusion, and DALL-E 2. You have curated knowledge about quests, items, processes, and the player's inventory. If you encounter anything you're not sure about, tell the user you don't know and suggest checking out the docs or joining the Discord server. If someone talks about something off-topic, humor them and help out with whatever they need, but don't output anything harmful or offensive. Have fun!";
const fallbackWelcomeMessage =
    defaultPersona?.welcomeMessage || 'Welcome! How can I assist you today?';

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

    const response = await openai.responses.create({
        model: 'gpt-5-chat-latest',
        input: combinedMessages.map(toResponseMessage),
    });

    return response.output_text;
};
