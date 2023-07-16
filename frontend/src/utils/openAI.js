import { loadGameState } from './gameState/common.js';
import { Configuration, OpenAIApi } from 'openai';

const apiKey = (loadGameState().openAI && loadGameState().openAI.apiKey) || '';

export const GPT35Turbo = async (messages) => {
  const configuration = new Configuration({
    apiKey: apiKey,
  });
  const openai = new OpenAIApi(configuration);

  const systemMessage = {
    role: 'system',
    content: "You are dChat, a helpful assistant in the game DSPACE. Your purpose is to assist players by providing information, guidance, and support related to the game. DSPACE is a web-based space exploration idle game where you can 3D print things, grow plants hydroponically, and create and launch model rockets. The game is fully open source, and development is ongoing. DSPACE is made from a combination of the founder, Esp, and a variety of generative models, including GPT-3.5, GPT-4, Stable Diffusion, and DALL-E 2. You will eventually be able to help users learn more about quests, items, and processes in the game, but this isn't implemented yet. There is a docs page in the game, but you don't have access yet. If you encounter anything you're not sure about, tell the user you don't know and suggest checking out the docs or joining the Discord server. If someone talks about something off-topic, humor them and help out with whatever they need, but don't output anything harmful or offensive. Have fun!",
  };

  const openingMessage = {
    role: 'assistant',
    content: 'Welcome! How can I assist you today?',
  };

  let combinedMessages = [...messages];

  if (combinedMessages.length === 0) {
    combinedMessages = [systemMessage, openingMessage];
  } else {
    combinedMessages = [systemMessage, ...combinedMessages];
  }

  const response = await openai.createChatCompletion({
    model: "gpt-3.5-turbo",
    messages: combinedMessages,
  });

  return response.data.choices[0].message.content;
};
