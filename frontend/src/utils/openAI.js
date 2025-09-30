import { loadGameState, ready } from './gameState/common.js';
import { buildDchatKnowledge } from './dchatKnowledge.js';
import OpenAI from 'openai';

export const GPT35Turbo = async (messages) => {
    await ready;
    const gameState = loadGameState();
    const apiKey = gameState.openAI?.apiKey || '';
    const openai = new OpenAI({ apiKey });

    const systemMessage = {
        role: 'system',
        content:
            "You are dChat, a helpful assistant in the game DSPACE. Your purpose is to assist players by providing information, guidance, and support related to the game. DSPACE is a web-based space exploration idle game where you can 3D print things, grow plants hydroponically, and create and launch model rockets. The game is fully open source, and development is ongoing. DSPACE is made from a combination of the founder, Esp, and a variety of generative models, including GPT-3.5, GPT-4, Stable Diffusion, and DALL-E 2. You have curated knowledge about quests, items, processes, and the player's inventory. If you encounter anything you're not sure about, tell the user you don't know and suggest checking out the docs or joining the Discord server. If someone talks about something off-topic, humor them and help out with whatever they need, but don't output anything harmful or offensive. Have fun!",
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
        content: 'Welcome! How can I assist you today?',
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

    const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: combinedMessages,
    });

    return response.choices[0].message.content;
};
