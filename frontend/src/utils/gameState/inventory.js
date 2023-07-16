import { loadGameState, saveGameState } from "./common.js";

export const addItems = (items) => {
    const gameState = loadGameState();

    items.forEach(({ id, count }) => {
      gameState.inventory[id] = (gameState.inventory[id] || 0) + count;
    });
    saveGameState(gameState);
  };
  
  export const burnItems = (items) => {
    const gameState = loadGameState();

    items.forEach(({ id, count }) => {
      if (gameState.inventory[id]) {
        gameState.inventory[id] -= count;
        if (gameState.inventory[id] < 0) {
          gameState.inventory[id] = 0;
        }
      }
    });
    saveGameState(gameState);
  };
  
  export const getItemCounts = (itemList) => {
    const gameState = loadGameState();

    const counts = {};
    itemList.forEach((item) => {
      counts[item.id] = gameState.inventory[item.id] || 0;
    });
    return counts;
  };
  
  export const getItemCount = (itemId) => {
    return getItemCounts([{ id: itemId }])[itemId];
  };
  
  export const getCurrentdUSD = () => {
    return getItemCount("24");
  };
  
  export const buyItems = (items) => {
    const gameState = loadGameState();

    items.forEach(item => {
      const { price, quantity } = item;
      const currencyId = "24"; // Assuming the currency ID is always "24"
  
      const totalPrice = parseFloat(price) * parseFloat(quantity); // Convert price and quantity to numbers
  
      if (gameState.inventory[currencyId] && gameState.inventory[currencyId] >= totalPrice) {
        gameState.inventory[currencyId] -= totalPrice;
        gameState.inventory[item.id] = (gameState.inventory[item.id] || 0) + parseFloat(quantity);
      }
    });
  
    saveGameState(gameState);
  };
  
  export const sellItems = (items) => {
    const gameState = loadGameState();
  
    items.forEach(item => {
      const { price, quantity } = item;
      const currencyId = "24"; // Assuming the currency ID is always "24"
  
      // Ignore items with non-positive quantity
      if (quantity <= 0) {
        return;
      }
  
      if (gameState.inventory[item.id] && gameState.inventory[item.id] >= quantity) {
        gameState.inventory[item.id] -= quantity;
        gameState.inventory[currencyId] = (gameState.inventory[currencyId] || 0) + price * quantity;
      }
    });
  
    saveGameState(gameState);
  };  
    
  export const hasItems = (itemList) => {
    const gameState = loadGameState();

    for (let i = 0; i < itemList.length; i++) {
      const { id, count } = itemList[i];
      if (!gameState.inventory[id] || gameState.inventory[id] < count) {
        return false;
      }
    }
    return true;
  };