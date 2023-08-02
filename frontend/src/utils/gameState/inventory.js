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
      if (gameState.inventory[id] && gameState.inventory[id] >= count) {
        gameState.inventory[id] -= count;
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
  
  /**
   * Modifies the game state to reflect selling items from the inventory. The
   * function retrieves the game state, processes the provided items, and then
   * saves the modified game state.
   *
   * For every 1000 dCarbon in your inventory, a 10% tax is applied to the selling
   * price. The maximum tax applied is 90%, i.e., once you have 9000 or more dCarbon.
   * 
   * @param {Array} items - Array of items to be sold. Each item is an object
   *                        with `price` and `quantity` properties.
   */
  export const sellItems = (items) => {
    // Load the current game state
    const gameState = loadGameState();
  
    // The id of the dUSD item
    const currencyId = "24";

    // The id of the dCarbon item
    const dCarbonId = "20";
  
    // Loop through all the items to be sold
    items.forEach(item => {
      const { id, quantity, price } = item;

      // Ignore items with an undefined price (this means they're soulbound)
      if (price === undefined) {
        return;
      }
  
      // Ignore items with non-positive quantity
      if (quantity <= 0 || price <= 0) {
        return;
      }
  
      // Only proceed if there is enough of the item in the inventory
      if (gameState.inventory[item.id] && gameState.inventory[item.id] >= quantity) {
        // Decrease the item quantity in the inventory
        gameState.inventory[item.id] -= quantity;
  
        // Calculate the tax based on the amount of dCarbon in the inventory
        const dCarbonCount = gameState.inventory[dCarbonId] || 0;
        const tax = Math.min(Math.floor(dCarbonCount / 1000) * 0.10, 0.90);
  
        // Calculate the total price considering the tax
        const taxedPrice = price * (1 - tax);
  
        // Increase the dUSD count in the inventory
        gameState.inventory[currencyId] = (gameState.inventory[currencyId] || 0) + taxedPrice * quantity;
      }
    });
  
    // Save the updated game state
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