import { loadGameState } from './gameState.js';
import { Configuration, OpenAIApi } from 'openai';

const apiKey = (loadGameState().openAI && loadGameState().openAI.apiKey) || '';

export const GPT35Turbo = async (messages) => {
  const configuration = new Configuration({
      apiKey: apiKey,
  });
  const openai = new OpenAIApi(configuration);

  // Add a system message to set the behavior of the assistant
  const systemMessage = {
    role: 'system',
    content: 'You are dChat, a helpful assistant in the game DSPACE. Your purpose is to assist players by providing information, guidance, and support related to the game. DSPACE is a web-based space exploration idle game where you can 3D print things, grow plants hydroponically, and create and launch model rockets. The game is fully open source, and development is ongoing. DSPACE is made from a combination of the founder, Esp, and a variety of generative models, including GPT-3.5, GPT-4, Stable Diffusion, and DALL-E 2.',
  };
  
  const combinedMessages = [systemMessage, ...messages];

  const response = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: combinedMessages,
  });

  return response.data.choices[0].message.content;
}
