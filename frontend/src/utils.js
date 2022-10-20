import items from './pages/inventory/json/items.json';

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
        duration.push('');
    }
    return duration.join(' ');
}

const datetimeAfterDuration = (durationSeconds) => {
    return new Date(Date.now() + durationSeconds);
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

export const addItemToInventory = (req, res, itemId, count = 1, bypass = false) => {
    const cookie = req.headers.get('cookie');
    const itemCount = getItemCount(req, itemId);
    let cooldownDuration = DEFAULT_COOLDOWN;

    const item = items.find((item) => item.id === itemId);
    if (item && item.cooldown) {
        cooldownDuration = durationInSeconds(item.cooldown) * SECOND; 
    }

    const cooldown = getCookieValue(cookie, `item-${itemId}-cooldown`);
    if (cooldown) {
        const cooldownDate = new Date(cooldown);
        if (cooldownDate > Date.now()) {
            if (!bypass) {
                return false;
            }
        }
    }

    if (itemCount !== undefined && !isNaN(itemCount)) {
        setCookieValue(res, `item-${itemId}`, itemCount + count);
    } else {
        setCookieValue(res, `item-${itemId}`, count);
    }

    // create a cookie saving a cooldown of 1 hour
    if (!bypass) {
        setCookieValue(res, `item-${itemId}-cooldown`, datetimeAfterDuration(cooldownDuration));
    }

    return true;
};

export const getItemCount = (req, itemId) => {
    const cookie = req.headers.get('cookie');
    const itemCount = parseInt(getCookieValue(cookie, `item-${itemId}`));
    if (itemCount !== undefined && !isNaN(itemCount)) {
        return itemCount;
    }
    return 0;
}

export const acceptCookiesPath = '/accept_cookies';

export const MS = 1000;
export const SECOND = 1 * MS;
export const MINUTE = 60 * SECOND;
export const HOUR = 60 * MINUTE;

export const DEFAULT_COOLDOWN = 5 * MINUTE;