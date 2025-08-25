import items from './pages/inventory/json/items';
import { questFinished, canStartQuest } from './utils/gameState.js';

export const prettyPrintNumber = (number) => {
    const n = parseFloat(number);

    if (n !== 0 && (n < 0.005 || n > 9999)) {
        return n
            .toExponential(2)
            .replace('e', 'E')
            .replace(/\+/, '')
            .replace(/\.?0*$/, '')
            .replace(/0*E/, 'E');
    }
    return n.toFixed(3).replace(/\.?0*$/, '');
};

export const parseCookie = (cookie) => {
    try {
        return cookie.split(/[;] */).reduce(function (result, pairStr) {
            const arr = pairStr.split('=');
            if (arr.length === 2) {
                result[arr[0]] = arr[1];
            }
            return result;
        }, {});
    } catch (e) {
        return {};
    }
};

export const getCookieValue = (cookie, key) => {
    const c = parseCookie(cookie);
    if (c && Object.prototype.hasOwnProperty.call(c, key)) {
        return c[key];
    }
    return null;
};

export const getCookie = (req, key) => {
    const cookie = req.headers.get('cookie');
    return getCookieValue(cookie, key);
};

export const setCookieValue = (res, key, value) => {
    res.headers.append(
        'Set-Cookie',
        `${key}=${value}; expires=Fri, 31 Dec 9999 23:59:59 GMT; path=/`
    );
};

export const deleteCookie = (res, key) => {
    res.headers.append('Set-Cookie', `${key}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`);
};

export const parseBool = (value) => {
    if (value === 'true') {
        return true;
    }
    return false;
};

export const hasAcceptedCookies = (req) => {
    const cookie = req.headers.get('cookie');
    const acceptedCookies = parseBool(getCookieValue(cookie, 'acceptedCookies'));
    return acceptedCookies || false;
};

export const getCookies = (cookie) => {
    const parsedCookie = parseCookie(cookie);
    // return as an array of objects
    return Object.keys(parsedCookie).map((key) => {
        return {
            key,
            value: parsedCookie[key],
        };
    });
};

export const getCookieItems = (cookie) => {
    const parsedCookie = parseCookie(cookie);
    return Object.keys(parsedCookie)
        .filter((key) => /^item-\d+$/.test(key) && parseFloat(parsedCookie[key]) > 0)
        .map((key) => {
            return {
                id: key.split('-')[1], // Extract the number after 'item-'
                count: parseFloat(parsedCookie[key]), // Convert the string value to a number
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
};

export const datetimeAfterDuration = (durationSeconds) => {
    return new Date(Date.now() + durationSeconds * 1000);
};

export const durationInSeconds = (durationString) => {
    try {
        const durationComponents = durationString.split(' ').filter(Boolean);

        // for each item in durationComponents, get the number and the unit
        // then convert the number to seconds
        let durationSeconds = 0;
        for (const component of durationComponents) {
            const number = parseFloat(component);
            if (isNaN(number)) continue;
            const unit = component.replace(String(number), '').toLowerCase();
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
                /* istanbul ignore next */
                default:
                    break;
            }
            durationSeconds += seconds;
        }

        return durationSeconds;
    } catch (e) {
        return 0;
    }
};

export const getWalletBalance = (req, symbol) => {
    const cookie = req.headers.get('cookie');
    const balance = parseFloat(getCookieValue(cookie, `currency-balance-${symbol}`));
    if (balance !== undefined && !isNaN(balance)) {
        return balance;
    }
    return 0;
};

export const burnCurrency = (req, res, symbol, burnAmount) => {
    const balance = getWalletBalance(req, symbol);
    const newBalance = balance - burnAmount;
    if (newBalance < 0) {
        return false;
    }
    setCookieValue(res, `currency-balance-${symbol}`, newBalance);
    return true;
};

export const addWalletBalance = (req, res, symbol, addBalance) => {
    const balance = getWalletBalance(req, symbol);
    const newBalance = Math.max(0, balance + addBalance);
    setCookieValue(res, `currency-balance-${symbol}`, newBalance);
    return newBalance;
};

export const fixMarkdownText = (text) => {
    // replace ' with '
    const fixedText = text.replace(/'/g, "'");
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
        price,
        symbol,
    };
};

export const getSymbolFromId = (itemId) => {
    const item = items.find((item) => item.id === itemId);
    if (item) {
        const { symbol } = getPriceStringComponents(item.price);
        return symbol;
    }
    return undefined;
};

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
    } catch (e) {
        // Silently fail and return empty object for invalid base64 or JSON
    }
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

// Define the delay promise
export const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Get elapsed time based on timeStart, timeEnd, and pausedTime
export function getElapsedTime(timeStart, timeEnd = new Date(), pausedTime = 0) {
    return Math.max(0, timeEnd - timeStart - pausedTime);
}

// Get the time left based on timeStart, timeElapsed, and timeMs
export function getTimeLeft(timeStart, timeElapsed, timeMs) {
    const now = new Date();
    const diff = getElapsedTime(timeStart, now, timeElapsed);
    return Math.max(0, timeMs - diff);
}

// Convert MS to a nice readable string
export function msToTime(s) {
    const ms = s % 1000;
    s = (s - ms) / 1000;
    const secs = s % 60;
    s = (s - secs) / 60;
    const mins = s % 60;
    const hrs = (s - mins) / 60;

    const showMs = hrs === 0 && mins === 0 && secs < 10;

    let str = '';

    if (hrs > 0) str += hrs + 'h ';
    if (mins > 0 || hrs > 0) str += mins + 'm ';
    if (secs > 0 || mins > 0 || hrs > 0) str += secs + 's';
    if (showMs && ms > 0) str += ' ' + ms + 'ms';

    return str.trim();
}

// Format a number to be kinda nice
export function formatNumber(n) {
    return Number(n).toLocaleString();
}

// Format a number to be kinda nice
export function formatNumberK(n) {
    if (n < 1e3) return n;
    if (n >= 1e3 && n < 1e6) return +(n / 1e3).toFixed(1) + 'K';
    if (n >= 1e6 && n < 1e9) return +(n / 1e6).toFixed(1) + 'M';
    if (n >= 1e9 && n < 1e12) return +(n / 1e9).toFixed(1) + 'B';
    if (n >= 1e12) return +(n / 1e12).toFixed(1) + 'T';
}

// Get price string
export function getPriceString(price) {
    const components = getPriceStringComponents(price);
    return `${components.symbol}${components.price}`;
}

/**
 * Converts a date object into various time formats.
 * @param {Date} date - The date to convert.
 * @returns {Object} timeFormats - The formatted time strings.
 * @returns {string} timeFormats.iso - ISO format.
 * @returns {string} timeFormats.utc - UTC format.
 * @returns {string} timeFormats.full - Full format.
 * @returns {string} timeFormats.short - Short format.
 * @returns {string} timeFormats.tinyTime - Tiny time format.
 * @returns {string} timeFormats.timeOnly - Time only format.
 * @returns {string} timeFormats.dateOnly - Date only format.
 */
export function formatTime(date) {
    if (!date) {
        date = new Date();
    }
    // Pad with a zero if needed
    const pad = (n) => (n < 10 ? '0' + n : n);

    const hours = date.getHours();
    const hoursFormat = hours % 12 === 0 ? 12 : hours % 12;
    const minutes = date.getMinutes();
    const seconds = date.getSeconds();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const month = date.getMonth() + 1; // JavaScript months are 0-11
    const day = date.getDate();
    const year = date.getFullYear();

    const timeFormats = {
        iso: date.toISOString(),
        utc: date.toUTCString(),
        full: `${month}/${day}/${year} ${hoursFormat}:${pad(minutes)}:${pad(seconds)} ${ampm}`,
        short: `${month}/${day}/${year} ${hoursFormat}:${pad(minutes)} ${ampm}`,
        tinyTime: `${hoursFormat}:${pad(minutes)}${ampm}`,
        timeOnly: `${hoursFormat}:${pad(minutes)}:${pad(seconds)} ${ampm}`,
        dateOnly: `${month}/${day}/${year}`,
    };

    return timeFormats;
}

export function getRelativeTimeString(date, lang = navigator.language) {
    // Allow dates or times to be passed
    const timeMs = typeof date === 'number' ? date : date.getTime();

    // Get the time difference in seconds
    const deltaSeconds = Math.round((timeMs - Date.now()) / 1000);

    // Array of time divisions
    const divisions = [
        { amount: 31536000, name: 'year' },
        { amount: 2592000, name: 'month' },
        { amount: 86400, name: 'day' },
        { amount: 3600, name: 'hour' },
        { amount: 60, name: 'minute' },
        { amount: 1, name: 'second' },
    ];

    // Absolute delta in seconds
    const deltaSec = Math.abs(deltaSeconds);

    // Find the appropriate division
    const division = divisions.find((division) => division.amount <= deltaSec);

    if (!division) {
        return 'just now';
    }

    const count = Math.round(deltaSec / division.amount);
    const formatted = new Intl.RelativeTimeFormat(lang, { numeric: 'auto' }).format(
        deltaSeconds > 0 ? count : -count,
        division.name
    );

    return formatted;
}

// Clamp a number
export function clamp(min, max, n) {
    return Math.min(Math.max(n, min), max);
}

// Interpolate between min and max (0, 1 => 0, 0.5, 1 => min, (min+max)/2, max)
export function lerp(min, max, t) {
    return min + (max - min) * clamp(0, 1, t);
}

// Get a random item from an array
export function choice(arr) {
    return arr.length === 0 ? undefined : arr[Math.floor(Math.random() * arr.length)];
}

// Get a random int between min and max (inclusive)
export function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function getRandomInts(min, max, n) {
    const result = Array(n).fill(0);
    for (let i = 0; i < n; i++) {
        result[i] = getRandomInt(min, max);
    }
    return result;
}

// Shuffles an array
export function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
    return array;
}

// Generate a random string
export function generateRandomString(length) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    Array(length)
        .fill(0)
        .forEach(() => {
            result += characters.charAt(Math.floor(Math.random() * characters.length));
        });
    return result;
}

export function getQuestPossibleChoices(quest) {
    if (!quest) return {};
    const possibleChoices = {};

    for (const section of quest.quest) {
        if (section.goto) {
            possibleChoices[section.name] = section.goto.options || [];
        }
    }

    return possibleChoices;
}

export function getQuestByID(id, questList) {
    if (!questList) return null;
    for (const quest of questList) {
        if (quest && quest.id === id) {
            return quest;
        }
    }
    return null;
}

export function getQuestCategory(quest) {
    return quest.tags ? quest.tags[0] : 'Unknown';
}

export function getQuestCategories(quests) {
    if (!quests || !quests.length) return [];
    const categories = new Set();
    for (const quest of quests) {
        categories.add(getQuestCategory(quest));
    }
    // Convert it to an array
    return Array.from(categories);
}

// Function to filter quests by available, finished, or all
export function filterQuests(quests, filter = 'all') {
    if (!quests) return [];
    let result = [];

    switch (filter) {
        case 'available':
            result = quests.filter((quest) => !questFinished(quest.id) && canStartQuest(quest));
            break;
        case 'finished':
            result = quests.filter((quest) => questFinished(quest.id));
            break;
        case 'all':
        default:
            result = [...quests];
            break;
    }

    return result;
}

export function getQuestsByCategory(quests, category) {
    if (!quests || !quests.length) return [];
    return quests.filter((quest) => getQuestCategory(quest) === category);
}

// Get URL slug
export function getUrlSlug(str) {
    return str
        .toLowerCase()
        .replace(/[^\w ]+/g, '')
        .replace(/ +/g, '-');
}

// Get random ID
export function getRandomId() {
    return Math.random().toString(36).substr(2, 9);
}

// Get file extension
export function getFileExtension(filename) {
    return filename.slice(((filename.lastIndexOf('.') - 1) >>> 0) + 2);
}

// Returns a truncated string
export function truncateString(str, n, useWordBoundary = true) {
    if (!str) return '';
    if (str.length <= n) {
        return str;
    }
    const subString = str.slice(0, n - 1);
    return (
        (useWordBoundary ? subString.slice(0, subString.lastIndexOf(' ')) : subString) + '&hellip;'
    );
}

export function arrayBufferToBase64(buffer) {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
}

export async function getFileAsBase64(filename) {
    if (!filename) {
        return '';
    }
    try {
        const response = await fetch(filename);
        const blob = await response.blob();
        return new Promise((resolve, reject) => {
            try {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result);
                reader.readAsDataURL(blob);
                /* istanbul ignore next */
            } catch (err) {
                reject(err);
            }
        });
    } catch (err) {
        console.error('Error fetching file:', err);
        return '';
    }
}

export function formatCurrency(value, symbol = '$') {
    if (value === undefined || value === null) return `${symbol}0`;
    const numberFormat = new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    });
    return `${symbol}${numberFormat.format(value)}`;
}

export function isArrayEqual(a, b) {
    if (a === b) return true;
    if (a === null || b === null) return false;
    if (a.length !== b.length) return false;

    for (let i = 0; i < a.length; ++i) {
        if (a[i] !== b[i]) return false;
    }
    return true;
}
