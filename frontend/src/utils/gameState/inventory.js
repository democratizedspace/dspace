import { loadGameState, saveGameState } from './common.js';
import items from '../../pages/inventory/json/items.json' assert { type: 'json' };

const dUSDId = items.find((i) => i.name === 'dUSD')?.id;
const dCarbonId = items.find((i) => i.name === 'dCarbon')?.id;

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
    return getItemCount(dUSDId);
};

export const getSalesTaxPercentage = () => {
    const gameState = loadGameState();

    if (dCarbonId && getItemCount(dCarbonId) > 0) {
        const dCarbonCount = gameState.inventory[dCarbonId] || 0;
        return Math.min(Math.floor(dCarbonCount / 1000) * 10, 90);
    }
    return 0; // No tax for other items
};

export const buyItems = (items) => {
    const gameState = loadGameState();

    items.forEach((item) => {
        const { price, quantity } = item;
        const currencyId = dUSDId;

        const totalPrice = parseFloat(price) * parseFloat(quantity);

        if (gameState.inventory[currencyId] && gameState.inventory[currencyId] >= totalPrice) {
            gameState.inventory[currencyId] -= totalPrice; // Subtracting the currency for buying.
            gameState.inventory[item.id] =
                (gameState.inventory[item.id] || 0) + parseFloat(quantity); // Adding the bought item to inventory.
        }
    });

    saveGameState(gameState);
};

export const sellItems = (items) => {
    const gameState = loadGameState();
    const currencyId = dUSDId;

    items.forEach((item) => {
        const { id, quantity, price } = item;

        if (price === undefined) return;
        if (quantity <= 0 || price <= 0) return;

        if (gameState.inventory[item.id] && gameState.inventory[item.id] >= quantity) {
            const taxPercentage = getSalesTaxPercentage(id);
            const taxedPrice = price * (1 - taxPercentage / 100);
            const totalPriceAfterTax = taxedPrice * quantity;

            gameState.inventory[item.id] -= quantity; // Subtracting the sold item from inventory.
            gameState.inventory[currencyId] += totalPriceAfterTax; // Adding the currency from sale.
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
