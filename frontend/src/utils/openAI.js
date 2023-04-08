import { writable } from 'svelte/store';
import { loadGameState } from './gameState.js';
import { Configuration, OpenAIApi } from 'openai';

const apiKey = (loadGameState().openAI && loadGameState().openAI.apiKey) || '';

export const GPT35Turbo = async (messages) => {
  const configuration = new Configuration({
      apiKey: apiKey,
  });
  const openai = new OpenAIApi(configuration);

  const response = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: messages,
  });

  return response.data.choices[0].message.content;
}
