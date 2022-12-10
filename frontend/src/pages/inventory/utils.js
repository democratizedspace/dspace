import { getCookieValue, getWalletBalance, addWalletBalance, burnCurrency, setCookieValue, getPriceStringComponents } from '../../utils.js';
import items from './json/items.json';

export const getAddItemComponents = (query) => {
    const queryJson = queryToJson(query);
    const { createItems, consumeItems } = queryJson;
    
    const createItemIds = createItems.map((item) => item.id);
    const consumeItemIds = consumeItems.map((item) => item.id);

    // create a map of itemIds to count, which is a property on each item in createItems
    const createItemCounts = createItems.reduce((acc, item) => {
        acc[item.id] = item.count;
        return acc;
    }, {});

// create a map of itemIds to count, which is a property on each item in consumeItems
    const consumeItemCounts = consumeItems.reduce((acc, item) => {
        acc[item.id] = item.count;
        return acc;
    }, {});

    return {
        createItemIds,
        consumeItemIds,
        createItemCounts,
        consumeItemCounts
    };
};

export const addItemToInventory = (req, res, itemId, count = 1) => {
    const itemCount = getItemCount(req, itemId);

    if (itemCount !== undefined && !isNaN(itemCount)) {
        setCookieValue(res, `item-${itemId}`, parseFloat(itemCount) + parseFloat(count));
    } else {
        setCookieValue(res, `item-${itemId}`, parseFloat(count));
    }

    return true;
};

export const getItemCount = (req, itemId) => {
    const item = items.find((item) => item.id === itemId);
    if (item && item.type === "currency") {
        const symbol = item.symbol;
        return getWalletBalance(req, symbol);
    }

    const cookie = req.headers.get('cookie');
    const itemCount = parseFloat(getCookieValue(cookie, `item-${itemId}`));
    if (itemCount !== undefined && !isNaN(itemCount)) {
        return itemCount;
    }
    return 0;
}

export const buyItem = (req, res, itemId, count = 1) => {
    const item = items.find((item) => item.id === itemId);
    if (item) {
        const { price, symbol } = getPriceStringComponents(item.price);
        const totalPrice = price * count;
        const walletBalance = getWalletBalance(req, symbol);
        if (walletBalance >= totalPrice) {
            if (addItemToInventory(req, res, itemId, count, true)) {
                setCookieValue(res, `currency-balance-${symbol}`, Math.max(0, walletBalance - totalPrice));
                return true;
            }
        }
    }
    return false;
}

export const sellItem = (req, res, itemId, count = 1) => {
    const item = items.find((item) => item.id === itemId);
    if (item) {
        const { price, symbol } = getPriceStringComponents(item.price);
        const totalPrice = price * count;
        const itemCount = getItemCount(req, itemId);
        if (itemCount >= count) {
            addWalletBalance(req, res, symbol, totalPrice);
            burnItem(req, res, itemId, count);
            return true;
        }
    }
    return false;
}

export const burnItem = (req, res, itemId, count = 1) => {
    const item = items.find((item) => item.id === itemId);

    if (item.type === 'currency') {
        const symbol = item.symbol;

        const walletBalance = getWalletBalance(req, symbol);

        if (walletBalance < count) {
            return false;
        }

        burnCurrency(req, res, symbol, count);
    }

    const itemCount = getItemCount(req, itemId);

    const newItemCount = Math.max(0, itemCount - count);

    setCookieValue(res, `item-${itemId}`, newItemCount);
};

export const getItemCountString = (req, itemId, onlyCount = false, customCount) => {
    const count = customCount ? customCount : getItemCount(req, itemId);
    const item = items.find((item) => item.id === itemId);
    if (item) {
        if (item.unit) {
            return `${count}${item.unit}`;
        }
    }
    if (onlyCount) { 
        return count;
    }
    return `${count} x`;
}