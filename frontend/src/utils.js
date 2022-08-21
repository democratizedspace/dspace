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

export const parseBool = (value) => {
    if (value === 'true') {
        return true;
    }
    return false;
}