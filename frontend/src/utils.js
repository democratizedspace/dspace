import items from './pages/inventory/json/items.json';

export const prettyPrintNumber = (number) => {
    const n = parseFloat(number);

    if (n !== 0 && (n < 0.005 || n > 9999)) {
        return n.toExponential(2)
            .replace('e', 'E').
            replace(/\+/, '')
            .replace(/\.?0*$/, '')
            .replace(/0*E/, 'E');
    }
    return n.toFixed(3).replace(/\.?0*$/, '');
};

export const parseCookie = (cookie) => {
    try {
        return cookie.split(/[;] */).reduce(function(result, pairStr) {
            const arr = pairStr.split('=');
            if (arr.length === 2) {
                result[arr[0]] = arr[1];
            }
            return result;
        }, {});
    } catch (e) {
        return {};
    }
}

export const getCookieValue = (cookie, key) => {
    const c = parseCookie(cookie);
    if (c) {
        return c[key];
    }
    return null;
}

export const getCookie = (req, key) => {
    const cookie = req.headers.get('cookie');
    return getCookieValue(cookie, key);
}

export const setCookieValue = (res, key, value) => {
    res.headers.append('Set-Cookie', `${key}=${value}; expires=Fri, 31 Dec 9999 23:59:59 GMT; path=/`);
}

export const deleteCookie = (res, key) => {
    res.headers.append('Set-Cookie', `${key}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`);
}

export const parseBool = (value) => {
    if (value === 'true') {
        return true;
    }
    return false;
}

export const hasAcceptedCookies = (req) => {
    const cookie = req.headers.get('cookie');
    const acceptedCookies = parseBool(getCookieValue(cookie, 'acceptedCookies'));
    return acceptedCookies || false;
};

export const getCookies = (cookie) => {
    const parsedCookie = parseCookie(cookie);
    // return as an array of objects
    return Object.keys(parsedCookie).map(key => {
        return {
            key,
            value: parsedCookie[key]
        };
    });
}

export const getCookieItems = (cookie) => {
    const parsedCookie = parseCookie(cookie);
    return Object.keys(parsedCookie)
        .filter(key => key.startsWith('item-'))
        .map(key => {
            return {
            id: key.split('-')[1], // Extract the number after 'item-'
            count: parseInt(parsedCookie[key], 10) // Convert the string value to a number
        };
    });
};

export const prettyPrintDuration = (durationSeconds) => {
    const days = Math.floor(durationSeconds / 86400);
    const hours = Math.floor((durationSeconds % 86400) / 3600);
    const minutes = Math.floor((durationSeconds % 3600) / 60);
    const seconds = durationSeconds % 60;
    const duration = [];
    if (days > 0) {
        duration.push(`${days}d`);
    }
    if (hours > 0) {
        duration.push(`${hours}h`);
    }
    if (minutes > 0) {
        duration.push(`${minutes}m`);
    }
    if (seconds > 0) {
        if (seconds < 1) {
            duration.push(`${seconds.toFixed(1)}s`);
        } else {
            duration.push(`${Math.floor(seconds)}s`);
        }
    }
    return duration.join(' ');
}


export const datetimeAfterDuration = (durationSeconds) => {
    const futureDatetime = new Date(Date.now() + durationSeconds);
    return new Date(Date.now() + durationSeconds * 1000);
}

export const durationInSeconds = (durationString) => {
    try {
        const durationComponents = durationString.split(' ');

        // for each item in durationComponents, get the number and the unit
        // then convert the number to seconds
        let durationSeconds = 0;
        for (const component of durationComponents) {
            const number = parseInt(component);
            const unit = component.replace(number, '');
            let seconds = 0;
            switch (unit) {
                case 'd':
                    seconds = number * 86400;
                    break;
                case 'h':
                    seconds = number * 3600;
                    break;
                case 'm':
                    seconds = number * 60;
                    break;
                case 's':
                    seconds = number;
                    break;
                default:
                    break;
            }
            durationSeconds += seconds;
        }
        
        return durationSeconds;
    } catch (e) {
        return 0;
    }
}

export const getWalletBalance = (req, symbol) => {
    const cookie = req.headers.get('cookie');
    const balance = parseFloat(getCookieValue(cookie, `currency-balance-${symbol}`));
    if (balance !== undefined && !isNaN(balance)) {
        return balance;
    }
    return 0;
}

export const burnCurrency = (req, res, symbol, burnAmount) => {
    const balance = getWalletBalance(req, symbol);
    const newBalance = balance - burnAmount;
    if (newBalance < 0) {
        return false;
    }
    setCookieValue(res, `currency-balance-${symbol}`, newBalance);
    return true;
}

export const addWalletBalance = (req, res, symbol, addBalance) => {
    const balance = getWalletBalance(req, symbol);
    const newBalance = Math.max(0, balance + addBalance);
    // TODO: start here
    setCookieValue(res, `currency-balance-${symbol}`, newBalance);
};

export const fixMarkdownText = (text) => {
    // replace ’ with '
    const fixedText = text.replace(/’/g, '\'');
    return fixedText;
};

export const getPriceStringComponents = (currency) => {
    if (!currency || typeof currency !== 'string') {
        return { price: 0, symbol: '' };
    }

    // parse a string like '10 dUSD' into a number and a symbol
    const priceString = currency.split(' ');
    const price = parseFloat(priceString[0]);
    const symbol = priceString[1];

    return {
        price, symbol
    };
};


export const getSymbolFromId = (itemId) => {
    const item = items.find((item) => item.id === itemId);
    if (item) {
        const { _, symbol } = getPriceStringComponents(item.price);
        return symbol;
    }
    return undefined;
}

export const constructLink = (astroRedirect, url, redirectLink) => {
    if (redirectLink) {
        return `${url}?redirect=${redirectLink}`;
    }
    return url;
};

export const base64ToObject = (base64) => {
    try {
        // decode base64 string
        const urlEncoded = atob(base64);

        // URL decode
        const urlDecoded = decodeURIComponent(urlEncoded);

        // parse JSON
        const json = JSON.parse(urlDecoded);

        if (json) {
            return json;
        }
    } catch (e) {}
    return {};
};

// convert a json object to a base64 encoded string
export const jsonToQuery = (query) => {
    const queryStr = JSON.stringify(query);
    return Buffer.from(queryStr).toString('base64');
};

// convert a base64 encoded string to a json object
export const queryToJson = (query) => {
    const queryStr = Buffer.from(query, 'base64').toString('utf8');
    return JSON.parse(queryStr);
};

export const acceptCookiesPath = '/accept_cookies';

export const MS = 1000;
export const SECOND = 1 * MS;
export const MINUTE = 60 * SECOND;
export const HOUR = 60 * MINUTE;

export const DEFAULT_COOLDOWN = 5 * MINUTE;