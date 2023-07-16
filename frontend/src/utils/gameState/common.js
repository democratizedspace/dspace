import { writable } from 'svelte/store';

const gameStateKey = 'gameState';

const initializeGameState = () => {
  return {
    quests: {},
    inventory: {},
    processes: {},
  };
};

export const loadGameState = () => {
  const storedGameState = localStorage.getItem(gameStateKey);
  if (storedGameState) {
    return JSON.parse(storedGameState);
  }
  return initializeGameState();
};

export const saveGameState = (gameState) => {
  localStorage.setItem(gameStateKey, JSON.stringify(gameState));
  state.set(gameState); // Update the state store directly
};

let gameState = loadGameState();

// Create the state store and set the initial value
export const state = writable(gameState);

export const exportGameStateString = () => {
  return btoa(JSON.stringify(gameState));
};

export const importGameStateString = (gameStateString) => {
  // Decode from Base64 and parse the JSON string
  const importedGameState = JSON.parse(atob(gameStateString));

  // Overwrite the game state with the imported game state
  gameState = importedGameState;

  // Save the updated game state to local storage and update the state store
  saveGameState(gameState);
};