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

export const prettyPrintDuration = (durationSeconds, integer) => {
    const days = Math.floor(durationSeconds / 86400);
    const hours = Math.floor((durationSeconds % 86400) / 3600);
    const minutes = Math.floor((durationSeconds % 3600) / 60);
    const seconds = !(integer) ? (durationSeconds % 60).toFixed(1) : Math.floor(durationSeconds % 60);
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
        duration.push(`${seconds}s`);
    }
    if (seconds == 0) {
        duration.push(`Done`);
    }
    return duration.join(' ');
}

const datetimeAfterDuration = (durationSeconds) => {
    return new Date(Date.now() + durationSeconds);
}

export const addItemToInventory = (req, res, itemId) => {
    const cookie = req.headers.get('cookie');
    const itemCount = parseInt(getCookieValue(cookie, `item-${itemId}`));

    const cooldown = getCookieValue(cookie, `item-${itemId}-cooldown`);
    if (cooldown) {
        const cooldownDate = new Date(cooldown);
        if (cooldownDate > Date.now()) {
            return false;
        }
    }

    if (itemCount !== undefined && !isNaN(itemCount)) {
        setCookieValue(res, `item-${itemId}`, itemCount + 1);
    } else {
        setCookieValue(res, `item-${itemId}`, 1);
    }
    // create a cookie saving a cooldown of 1 hour
    setCookieValue(res, `item-${itemId}-cooldown`, datetimeAfterDuration(30 * SECOND));

    return true;
};

export const acceptCookiesPath = '/accept_cookies';

export const MS = 1000;
export const SECOND = 1 * MS;
export const MINUTE = 60 * SECOND;
export const HOUR = 60 * MINUTE;