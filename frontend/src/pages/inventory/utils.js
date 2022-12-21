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

export const bigIntegerString = (integerString) => {
    let bigString = integerString;

    const suffixes = {
        3: 'K',
        6: 'M',
        9: 'B',
        12: 'T',
        15: 'Qa',
        18: 'Qi',
    };

    // convert the number to a string and attach a suffix if necessary
    for (const suffix in suffixes) {
        if (bigString.length > suffix) {
            bigString = bigString.slice(0, -suffix) + suffixes[suffix];
        }
    }

    return bigString;
};

export const prettyPrintNumber = ({number, maxDigits = 4}) => {
    // split the number into the integer and decimal parts
    let [integer, decimal] = number.toString().split('.');

    // if the integer string has more than maxDigits characters, replace each remaining character with a 0
    if (integer.length > maxDigits) {
        integer = integer.slice(0, maxDigits) + '0'.repeat(integer.length - maxDigits);
        return bigIntegerString(integer);
    }
    
    if (decimal !== undefined) {
        // otherwise, return `${integer}.${decimal}` with the decimal part truncated to the remaining number of digits
        return `${integer}.${decimal.slice(0, maxDigits - integer.length)}`;
    }

    return integer;
};

export const getItemCountString = (req, itemId, onlyCount = false, customCount) => {
    const count = customCount ? customCount : getItemCount(req, itemId);
    
    const countString = prettyPrintNumber({number: count});

    const item = items.find((item) => item.id === itemId);
    if (item) {
        if (item.unit) {
            return `${countString} ${item.unit}`;
        }
    }
    if (onlyCount) { 
        return countString;
    }
    return `${countString}`;
}